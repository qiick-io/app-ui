#!/usr/bin/env node
/**
 * Compares the GitHub settings of qiick repos with the fleet standard
 * (`standards/repo-settings.json`, rules in `standards/rules/repository.md`,
 * conventions F15, F16 and F19). Reads through `gh api` as the logged-in account;
 * changes nothing unless `--fix-labels` is given, which creates or updates the
 * fleet labels (never deletes a repo's own).
 *
 *     node scripts/check-repo-settings.mjs [--fix-labels] [<repo> …]
 *
 * Without repo names it checks every non-archived public repo of `qiick-io`.
 * Branch protection, rulesets and required checks need admin read access;
 * settings are the maintainer's to change, so the script only reports them.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ORGANISATION = 'qiick-io';

/**
 * @typedef {{ name: string, color: string, description: string }} LabelDefinition
 * @typedef {{
 *     repository: Record<string, unknown>,
 *     protectedBranches: string[],
 *     branchProtection: { strict: boolean, enforceAdmins: boolean, requiredApprovingReviewCount: number, allowForcePushes: boolean, allowDeletions: boolean },
 *     requiredChecks: string[],
 *     requiredChecksExceptions: Record<string, string>,
 *     rulesets: string[],
 *     actions: Record<string, unknown>,
 *     privateVulnerabilityReporting: boolean,
 *     labels: LabelDefinition[],
 * }} RepoSettingsStandard
 * @typedef {{
 *     name: string,
 *     isPrivate: boolean,
 *     repository: Record<string, unknown>,
 *     protections: Record<string, Record<string, any> | null>,
 *     rulesetNames: string[],
 *     actions: Record<string, unknown> | null,
 *     isPrivateVulnerabilityReportingEnabled: boolean | null,
 *     labels: LabelDefinition[],
 *     projectTitles: string[],
 * }} RepoState
 */

/** @returns {RepoSettingsStandard} */
export function readStandard() {
    return JSON.parse(
        fs.readFileSync(
            path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                '../standards/repo-settings.json',
            ),
            'utf8',
        ),
    );
}

/**
 * Every difference between one repo's state and the standard.
 * @param {RepoState} state
 * @param {RepoSettingsStandard} standard
 * @returns {string[]}
 */
export function findSettingsViolations(state, standard) {
    /** @type {string[]} */
    const violations = [];

    for (const [setting, expected] of Object.entries(standard.repository)) {
        if (state.repository[setting] !== expected) {
            violations.push(
                `F15 ${setting} is ${JSON.stringify(state.repository[setting])}, expected ${JSON.stringify(expected)}.`,
            );
        }
    }

    /** @type {Record<string, string[]>} */
    const requiredChecksByBranch = {};

    for (const branch of standard.protectedBranches) {
        const protection = state.protections[branch];

        if (protection === undefined || protection === null) {
            violations.push(
                state.isPrivate
                    ? `F15 ${branch}: no branch protection (private repo on the free plan: by convention only).`
                    : `F15 ${branch}: not protected.`,
            );
            continue;
        }

        const expected = standard.branchProtection;
        const actual = {
            strict: protection.required_status_checks?.strict === true,
            enforceAdmins: protection.enforce_admins?.enabled === true,
            requiredApprovingReviewCount:
                protection.required_pull_request_reviews
                    ?.required_approving_review_count ?? null,
            allowForcePushes: protection.allow_force_pushes?.enabled === true,
            allowDeletions: protection.allow_deletions?.enabled === true,
        };

        for (const [setting, expectedValue] of Object.entries(expected)) {
            if (actual[setting] !== expectedValue) {
                violations.push(
                    `F15 ${branch}: ${setting} is ${JSON.stringify(actual[setting])}, expected ${JSON.stringify(expectedValue)}.`,
                );
            }
        }

        requiredChecksByBranch[branch] = [
            ...(protection.required_status_checks?.contexts ?? []),
        ].sort();

        if (!Object.hasOwn(standard.requiredChecksExceptions, state.name)) {
            for (const check of standard.requiredChecks) {
                if (!requiredChecksByBranch[branch].includes(check)) {
                    violations.push(
                        `F15 ${branch}: required check \`${check}\` is missing.`,
                    );
                }
            }
        }
    }

    const [firstBranch, ...otherBranches] = Object.keys(requiredChecksByBranch);

    for (const branch of otherBranches) {
        const firstList = requiredChecksByBranch[firstBranch];
        const otherList = requiredChecksByBranch[branch];
        const onlyOnFirst = firstList.filter(
            (check) => !otherList.includes(check),
        );
        const onlyOnOther = otherList.filter(
            (check) => !firstList.includes(check),
        );

        if (onlyOnFirst.length > 0 || onlyOnOther.length > 0) {
            violations.push(
                `F15 required checks differ: only on ${firstBranch}: ${onlyOnFirst.join(', ') || 'none'}; only on ${branch}: ${onlyOnOther.join(', ') || 'none'}.`,
            );
        }
    }

    for (const ruleset of standard.rulesets) {
        if (!state.rulesetNames.includes(ruleset)) {
            violations.push(`F15 ruleset "${ruleset}" is missing.`);
        }
    }

    for (const [setting, expected] of Object.entries(standard.actions)) {
        if (state.actions !== null && state.actions[setting] !== expected) {
            violations.push(
                `F15 actions ${setting} is ${JSON.stringify(state.actions[setting])}, expected ${JSON.stringify(expected)}.`,
            );
        }
    }

    // F19: SECURITY.md sends reporters there; a private repo takes no outside reports.
    if (
        !state.isPrivate &&
        state.isPrivateVulnerabilityReportingEnabled !==
            standard.privateVulnerabilityReporting
    ) {
        violations.push(
            `F19 private vulnerability reporting is ${state.isPrivateVulnerabilityReportingEnabled ? 'on' : 'off'}, expected ${standard.privateVulnerabilityReporting ? 'on' : 'off'}.`,
        );
    }

    const labelsByName = new Map(
        state.labels.map((label) => [label.name, label]),
    );

    for (const label of standard.labels) {
        const actual = labelsByName.get(label.name);

        if (!actual) {
            violations.push(`F16 label \`${label.name}\` is missing.`);
        } else if (
            actual.color.toLowerCase() !== label.color.toLowerCase() ||
            actual.description !== label.description
        ) {
            violations.push(
                `F16 label \`${label.name}\` has another colour or description.`,
            );
        }
    }

    if (state.projectTitles.length === 0) {
        violations.push('F16 no GitHub project is linked to the repo.');
    }

    return violations;
}

/**
 * `gh api` as JSON; null when GitHub answers 403 or 404 (no access, not set).
 * @param {string[]} apiArguments
 */
function ghApi(apiArguments) {
    try {
        return JSON.parse(
            execFileSync('gh', ['api', ...apiArguments], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
            }),
        );
    } catch (error) {
        if (/HTTP 40[34]/.test(String(error.stderr ?? error.message))) {
            return null;
        }

        throw error;
    }
}

/**
 * The live state of one repo (several `gh api` calls).
 * @param {string} repoName
 * @param {RepoSettingsStandard} standard
 * @returns {RepoState}
 */
function fetchRepoState(repoName, standard) {
    const repoPath = `repos/${ORGANISATION}/${repoName}`;
    const repository = ghApi([repoPath]) ?? {};
    const projects = ghApi([
        'graphql',
        '-f',
        `query={repository(owner:"${ORGANISATION}",name:"${repoName}"){projectsV2(first:10){nodes{title}}}}`,
    ]);

    return {
        name: repoName,
        isPrivate: repository.private === true,
        repository,
        protections: Object.fromEntries(
            standard.protectedBranches.map((branch) => [
                branch,
                ghApi([`${repoPath}/branches/${branch}/protection`]),
            ]),
        ),
        rulesetNames: (ghApi([`${repoPath}/rulesets`]) ?? []).map(
            (ruleset) => ruleset.name,
        ),
        actions: ghApi([`${repoPath}/actions/permissions`]),
        isPrivateVulnerabilityReportingEnabled:
            ghApi([`${repoPath}/private-vulnerability-reporting`])?.enabled ??
            null,
        labels: ghApi(['--paginate', `${repoPath}/labels?per_page=100`]) ?? [],
        projectTitles:
            projects?.data?.repository?.projectsV2?.nodes?.map(
                (project) => project.title,
            ) ?? [],
    };
}

/**
 * Creates or updates every fleet label in a repo (`gh label create --force`).
 * @param {string} repoName
 * @param {LabelDefinition[]} labels
 */
function applyLabels(repoName, labels) {
    for (const label of labels) {
        execFileSync('gh', [
            'label',
            'create',
            label.name,
            '--repo',
            `${ORGANISATION}/${repoName}`,
            '--color',
            label.color,
            '--description',
            label.description,
            '--force',
        ]);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const standard = readStandard();
    const shouldFixLabels = process.argv.includes('--fix-labels');
    const namedRepos = process.argv
        .slice(2)
        .filter((argument) => !argument.startsWith('--'));
    const repoNames =
        namedRepos.length > 0
            ? namedRepos
            : JSON.parse(
                  execFileSync(
                      'gh',
                      [
                          'repo',
                          'list',
                          ORGANISATION,
                          '--limit',
                          '200',
                          '--no-archived',
                          '--visibility',
                          'public',
                          '--json',
                          'name',
                      ],
                      { encoding: 'utf8' },
                  ),
              )
                  .map((repo) => repo.name)
                  .sort();
    let violationCount = 0;

    for (const repoName of repoNames) {
        if (shouldFixLabels) {
            applyLabels(repoName, standard.labels);
        }

        const violations = findSettingsViolations(
            fetchRepoState(repoName, standard),
            standard,
        );

        violationCount += violations.length;
        console.log(
            violations.length === 0
                ? `${repoName}: ok`
                : `${repoName}:\n${violations.map((violation) => `  ${violation}`).join('\n')}`,
        );
    }

    process.exit(violationCount > 0 ? 1 : 0);
}

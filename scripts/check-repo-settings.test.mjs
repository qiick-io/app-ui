import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    findSettingsViolations,
    projectTitlesByRepository,
    readStandard,
} from './check-repo-settings.mjs';

const standard = readStandard();

/**
 * A repo state that follows the standard, as `gh api` would return it.
 * @param {string} [name]
 */
function conformingState(name = 'laravel-demo') {
    const protection = {
        required_status_checks: {
            strict: true,
            contexts: ['tests', ...standard.requiredChecks],
        },
        enforce_admins: { enabled: true },
        required_pull_request_reviews: { required_approving_review_count: 0 },
        allow_force_pushes: { enabled: false },
        allow_deletions: { enabled: false },
    };

    return {
        name,
        isPrivate: false,
        repository: { ...standard.repository },
        protections: {
            develop: structuredClone(protection),
            main: structuredClone(protection),
        },
        rulesetNames: [...standard.rulesets],
        actions: { ...standard.actions },
        isPrivateVulnerabilityReportingEnabled: true,
        labels: structuredClone(standard.labels),
        projectTitles: ['laravel-demo'],
    };
}

test('a repo that follows the standard has no violation', () => {
    assert.deepEqual(findSettingsViolations(conformingState(), standard), []);
});

test('each difference is reported with its convention id', () => {
    const state = conformingState();

    state.repository.default_branch = 'main';
    state.protections.develop.enforce_admins.enabled = false;
    state.protections.main.required_status_checks.contexts = [];
    state.rulesetNames = [];
    state.labels = state.labels.filter((label) => label.name !== 'schema');
    state.projectTitles = [];
    state.isPrivateVulnerabilityReportingEnabled = false;

    const violations = findSettingsViolations(state, standard).join('\n');

    assert.match(violations, /F15 default_branch is "main"/);
    assert.match(violations, /F15 develop: enforceAdmins is false/);
    assert.match(
        violations,
        /F15 main: required check `pr-title \/ commitlint` is missing/,
    );
    assert.match(
        violations,
        /F15 required checks differ: only on develop: app-ui-drift/,
    );
    assert.match(
        violations,
        /F15 ruleset "main: merge commits only" is missing/,
    );
    assert.match(violations, /F16 label `schema` is missing/);
    assert.match(violations, /F16 no GitHub project/);
    assert.match(
        violations,
        /F19 private vulnerability reporting is off, expected on/,
    );
});

test('app-ui needs only identical required checks, not the shared names', () => {
    const state = conformingState('app-ui');

    for (const branch of ['develop', 'main']) {
        state.protections[branch].required_status_checks.contexts = [
            'lint',
            'pr-title',
        ];
    }

    assert.deepEqual(findSettingsViolations(state, standard), []);
});

test('required package cells are checked against the endpoint jobs emitted on every PR', () => {
    const state = conformingState();

    for (const branch of standard.protectedBranches) {
        state.protections[branch].required_status_checks.contexts.push(
            'PHP 8.3 Laravel 12 lowest',
            'PHP 8.5 Laravel 13 stable',
            'PHP 8.4 Laravel 13 stable',
        );
    }

    assert.deepEqual(
        findSettingsViolations(state, standard),
        standard.protectedBranches.map(
            (branch) =>
                `F15 ${branch}: required check \`PHP 8.4 Laravel 13 stable\` is not emitted on every pull request by the package matrix.`,
        ),
    );
});

test('the required cell audit respects the PHP minimum for laravel-audit', () => {
    const state = conformingState('laravel-audit');

    for (const branch of standard.protectedBranches) {
        state.protections[branch].required_status_checks.contexts.push(
            'PHP 8.4 Laravel 12 lowest',
            'PHP 8.5 Laravel 13 stable',
        );
        state.protections[branch].required_status_checks.checks = [
            { context: 'PHP 8.3 Laravel 12 lowest', app_id: 15368 },
        ];
    }

    assert.deepEqual(
        findSettingsViolations(state, standard),
        standard.protectedBranches.map(
            (branch) =>
                `F15 ${branch}: required check \`PHP 8.3 Laravel 12 lowest\` is not emitted on every pull request by the package matrix.`,
        ),
    );
});

test('an unprotected private repo is reported as convention only', () => {
    const state = conformingState();

    state.isPrivate = true;
    state.protections = { develop: null, main: null };
    state.isPrivateVulnerabilityReportingEnabled = null;

    assert.match(
        findSettingsViolations(state, standard).join('\n'),
        /private repo on the free plan/,
    );
    assert.doesNotMatch(
        findSettingsViolations(state, standard).join('\n'),
        /F19/,
    );
});

test('a repo counts as linked when an organisation project lists it', () => {
    const titlesByRepository = projectTitlesByRepository([
        {
            title: 'Excubia',
            repositories: {
                nodes: [{ name: 'excubia-core' }, { name: 'excubia-app' }],
            },
        },
        {
            title: 'laravel-access',
            repositories: { nodes: [{ name: 'laravel-access' }] },
        },
    ]);

    assert.deepEqual(titlesByRepository.get('excubia-app'), ['Excubia']);
    assert.deepEqual(titlesByRepository.get('laravel-access'), [
        'laravel-access',
    ]);
    assert.equal(titlesByRepository.get('externa-bruno'), undefined);
});

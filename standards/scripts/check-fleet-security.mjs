#!/usr/bin/env node
/**
 * Checks F31–F33 in a checkout. The reusable workflow checks repository
 * visibility from the event so private repositories only run F31.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listWorkflowFiles } from './check-package-matrix.mjs';

const dayInMilliseconds = 24 * 60 * 60 * 1000;
const utcTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const websitesUsingSharedPolicy = new Set([
    'lucagiardi20/qiick-website',
    'lucagiardi20/qiick-docs',
    'lucagiardi20/lucagiardi-website',
]);

/**
 * Validates the fleet's RFC 9116 fields and returns expiry warnings separately
 * so upcoming renewals stay visible without blocking a change.
 */
export function checkSecurityTxt(
    contents,
    repository,
    policyPath,
    now,
    policyReference = `HEAD/${policyPath}`,
) {
    const errors = [];
    const warnings = [];
    const fields = (name) =>
        [
            ...contents.matchAll(
                new RegExp(`^${name}:[ \\t]*(.*)\\r?$`, 'gim'),
            ),
        ].map((match) => match[1].trim());
    const contacts = fields('Contact');
    const expires = fields('Expires');
    const languages = fields('Preferred-Languages');
    const policies = fields('Policy');

    if (
        contacts[0] !==
        `https://github.com/${repository}/security/advisories/new`
    ) {
        errors.push(
            'F31: the first Contact must open the repository’s private reporting form.',
        );
    }

    if (languages.length !== 1 || languages[0] !== 'en, it') {
        errors.push('F31: set Preferred-Languages to en, it.');
    }

    if (
        policies.length !== 1 ||
        policies[0] !==
            `https://github.com/${repository}/blob/${policyReference}`
    ) {
        errors.push(`F31: Policy must link to the repository’s ${policyPath}.`);
    }

    const expiry = new Date(expires[0]);

    if (
        expires.length !== 1 ||
        !utcTimestamp.test(expires[0]) ||
        !Number.isFinite(expiry.getTime()) ||
        expiry.toISOString().replace('.000Z', 'Z') !== expires[0]
    ) {
        errors.push(
            'F31: set one Expires field to a valid UTC RFC 3339 timestamp.',
        );

        return { errors, warnings };
    }

    const remaining = expiry.getTime() - now.getTime();

    if (remaining <= 0 || remaining > 365 * dayInMilliseconds) {
        errors.push('F31: Expires must be in the future and within 365 days.');
    } else if (remaining <= 30 * dayInMilliseconds) {
        warnings.push(
            `F31: security.txt expires on ${expires[0]}; renew it before then.`,
        );
    }

    return { errors, warnings };
}

/** Read an event's list from inline or block-style workflow YAML. */
function hasWorkflowEventValue(workflow, event, key, value) {
    const mapping = workflow.match(
        new RegExp(`^  ${event}: *\\n((?:^ {4,}[^\\n]*\\n?)*)`, 'm'),
    )?.[1];
    const values = mapping?.match(
        new RegExp(`^    ${key}: *(\\[[^\\n]*\\]|(?:\\n {6,}- [^\\n]*)+)`, 'm'),
    )?.[1];

    return values?.match(/[\w-]+/g)?.includes(value) ?? false;
}

/**
 * Checks the tracked public endpoint, scanner configuration and release job.
 * The release workflow verifies inventory generation and upload at release time.
 */
export function findFleetSecurityViolations(
    root,
    { repository, securityTxt = '', isPublicFleet = false },
    now = new Date(),
) {
    const errors = [];
    const warnings = [];

    if (securityTxt) {
        const usesSharedPolicy = websitesUsingSharedPolicy.has(
            repository.toLowerCase(),
        );
        const reportingRepository = usesSharedPolicy
            ? 'qiick-io/app-ui'
            : repository;
        const policyRoot = usesSharedPolicy
            ? fileURLToPath(new URL('../../', import.meta.url))
            : root;
        const policyPath =
            ['SECURITY.md', '.github/SECURITY.md'].find((candidate) =>
                fs.existsSync(path.join(policyRoot, candidate)),
            ) ?? 'SECURITY.md';
        const textPath = path.join(root, securityTxt);

        if (
            !securityTxt.endsWith('/.well-known/security.txt') ||
            !fs.existsSync(textPath)
        ) {
            errors.push(
                'F31: track security.txt under the deployment’s public .well-known directory.',
            );
        } else {
            if (!fs.existsSync(path.join(policyRoot, policyPath))) {
                errors.push('F31: SECURITY.md is missing.');
            }

            const result = checkSecurityTxt(
                fs.readFileSync(textPath, 'utf8'),
                reportingRepository,
                policyPath,
                now,
                usesSharedPolicy ? 'develop/SECURITY.md#websites' : undefined,
            );
            errors.push(...result.errors);
            warnings.push(...result.warnings);
        }
    }

    if (!isPublicFleet) {
        return { errors, warnings };
    }

    const workflowTexts = listWorkflowFiles(root).map((workflowPath) =>
        fs.readFileSync(workflowPath, 'utf8'),
    );
    const readmePath = path.join(root, 'README.md');
    const readme = fs.existsSync(readmePath)
        ? fs.readFileSync(readmePath, 'utf8')
        : '';
    const callsWorkflow = (workflow, name) =>
        new RegExp(
            `^[ \\t]*uses: (?:\\./\\.github/workflows/${name}\\.yml|qiick-io/app-ui/\\.github/workflows/${name}\\.yml@[a-f0-9]{40})[ \\t]*(?:#.*)?$`,
            'm',
        ).test(workflow);

    if (
        !workflowTexts.some(
            (workflow) =>
                /^  schedule:\n    - cron: ['"]?\d+ \d+ \* \* [0-7]['"]?(?: *#.*)?$/m.test(
                    workflow,
                ) &&
                hasWorkflowEventValue(
                    workflow,
                    'push',
                    'branches',
                    'develop',
                ) &&
                callsWorkflow(workflow, 'codeql') &&
                callsWorkflow(workflow, 'scorecard'),
        )
    ) {
        errors.push(
            'F32: call both reusable scanners on a weekly schedule and on pushes to develop.',
        );
    }

    if (
        !readme.includes(
            `https://api.scorecard.dev/projects/github.com/${repository}/badge`,
        )
    ) {
        errors.push(
            'F32: add the repository’s OpenSSF Scorecard badge to README.md.',
        );
    }

    if (
        fs.existsSync(path.join(root, 'composer.json')) &&
        !/PHPStan.*max/.test(readme)
    ) {
        errors.push(
            'F32: document PHPStan max as the PHP static analysis check in README.md.',
        );
    }

    if (
        !workflowTexts.some(
            (workflow) =>
                hasWorkflowEventValue(
                    workflow,
                    'release',
                    'types',
                    'published',
                ) && callsWorkflow(workflow, 'release-sbom'),
        )
    ) {
        errors.push(
            'F33: call the reusable SBOM workflow when the GitHub release is published.',
        );
    }

    if (
        workflowTexts.some(
            (workflow) =>
                /^\s*(?:- )?uses: actions\/attest-build-provenance@/m.test(
                    workflow,
                ) && !/^\s*(?:- )?uses: actions\/attest-sbom@/m.test(workflow),
        )
    ) {
        errors.push(
            'F33: attest the SBOM for the artefact that already carries build provenance.',
        );
    }

    return { errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [, , repository, securityTxt, isPublicFleet] = process.argv;
    const { errors, warnings } = findFleetSecurityViolations(process.cwd(), {
        repository,
        securityTxt,
        isPublicFleet: isPublicFleet === 'true',
    });

    for (const warning of warnings) {
        console.warn(`::warning::${warning}`);
    }

    for (const error of errors) {
        console.error(error);
    }

    process.exitCode = errors.length ? 1 : 0;
}

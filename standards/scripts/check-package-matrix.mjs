#!/usr/bin/env node
/**
 * Fails a qiick Composer package whose CI matrix is not the shared one
 * (`standards/package-matrix.json`, exported by package-matrix.yml).
 *
 * A package must:
 * 1. call `qiick-io/app-ui/.github/workflows/package-matrix.yml@…`;
 * 2. expand `fromJSON(needs.<job>.outputs.matrix)`;
 * 3. expand `fromJSON(needs.<job>.outputs.databases)`;
 * 4. honour the pull request variant: skip a cell's steps on `matrix.skip`,
 *    the database steps unless `outputs.run-databases`, and mutate only
 *    `outputs.mutate-classes` (when it has a mutation job);
 * 5. cancel superseded runs, run the full variant nightly, and open an issue
 *    when the nightly run fails (`gh issue create`);
 * 6. skip steps, never a whole job, on the plan's outputs, so every
 *    required check reports on a pull request.
 *
 * Used by `scripts/sync-standards.mjs --check` when `qiick-standards.json`
 * has `"package": true`. Docs: docs/package-matrix.md.
 *
 *     node check-package-matrix.mjs [--target <repo root>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKFLOW_CALL =
    /uses:\s*qiick-io\/app-ui\/\.github\/workflows\/package-matrix\.yml@[^\s#]+/;
const FROM_JSON_MATRIX =
    /fromJSON\(\s*needs\.([A-Za-z0-9_-]+)\.outputs\.matrix\s*\)/;
const FROM_JSON_DATABASES =
    /fromJSON\(\s*needs\.([A-Za-z0-9_-]+)\.outputs\.databases\s*\)/;

/**
 * Every `*.yml` / `*.yaml` under `.github/workflows`, if the directory exists.
 * @param {string} targetRoot
 * @returns {string[]} Absolute paths
 */
export function listWorkflowFiles(targetRoot) {
    const workflowsDirectory = path.join(targetRoot, '.github', 'workflows');

    if (!fs.existsSync(workflowsDirectory)) {
        return [];
    }

    return fs
        .readdirSync(workflowsDirectory)
        .filter((name) => /\.ya?ml$/i.test(name))
        .map((name) => path.join(workflowsDirectory, name))
        .sort();
}

/**
 * Concatenated workflow text for the target repo (empty when none).
 * @param {string} targetRoot
 */
export function readWorkflowsText(targetRoot) {
    return listWorkflowFiles(targetRoot)
        .map((filePath) => fs.readFileSync(filePath, 'utf8'))
        .join('\n');
}

/** A job-level `if:` (four spaces, under `jobs:`) on a plan output. */
const JOB_LEVEL_PLAN_CONDITION =
    /^ {4}if:.*(?:run-databases|mutate-classes|mutate-scope)/m;

/**
 * Errors when the package does not consume the shared matrix; empty when ok.
 * @param {string} targetRoot
 * @returns {string[]}
 */
export function findPackageMatrixViolations(targetRoot) {
    /** @type {string[]} */
    const errors = [];
    const workflowsText = readWorkflowsText(targetRoot);

    if (workflowsText.trim() === '') {
        errors.push(
            'package matrix: no workflow under .github/workflows (expected a call to package-matrix.yml).',
        );

        return errors;
    }

    if (!WORKFLOW_CALL.test(workflowsText)) {
        errors.push(
            'package matrix: no job calls qiick-io/app-ui/.github/workflows/package-matrix.yml@… (see docs/package-matrix.md).',
        );
    }

    if (!FROM_JSON_MATRIX.test(workflowsText)) {
        errors.push(
            'package matrix: no job expands fromJSON(needs.<job>.outputs.matrix).',
        );
    }

    if (!FROM_JSON_DATABASES.test(workflowsText)) {
        errors.push(
            'package matrix: no job expands fromJSON(needs.<job>.outputs.databases).',
        );
    }

    /** Signals of the reduced pull request run (docs/package-matrix.md, "Pull requests"). */
    const pullRequestSignals = [
        [
            /matrix\.skip\b/,
            'no test step honours `matrix.skip` (a docs-only pull request runs nothing).',
        ],
        [
            /outputs\.run-databases\b/,
            'the database jobs ignore `needs.<job>.outputs.run-databases`.',
        ],
        [
            /outputs\.docs-only\b/,
            'no job reads `needs.<job>.outputs.docs-only` (lint and PHPStan skip their steps on a docs-only pull request).',
        ],
        [
            /cancel-in-progress:/,
            'no `concurrency` with `cancel-in-progress` (a superseded pull request run keeps paying).',
        ],
        [
            /schedule:\s*\n\s*-\s*cron:/,
            'no nightly `schedule: - cron:` run of the full variant.',
        ],
        [
            /gh issue create/,
            'a failed nightly run opens no issue (`gh issue create`).',
        ],
    ];

    if (/mutat/i.test(workflowsText)) {
        pullRequestSignals.push([
            /outputs\.mutate-classes\b/,
            'the mutation job ignores `needs.<job>.outputs.mutate-classes` (a pull request mutates only the classes it changed).',
        ]);
    }

    for (const [signal, message] of pullRequestSignals) {
        if (!signal.test(workflowsText)) {
            errors.push(`package matrix: ${message}`);
        }
    }

    // A job skipped by its own `if:` reports no check, so a required check would wait forever.
    if (JOB_LEVEL_PLAN_CONDITION.test(workflowsText)) {
        errors.push(
            'package matrix: a job skips itself on the pull request plan (`if:` at job level); skip its steps instead so its required check reports.',
        );
    }

    return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const targetFlag = process.argv.indexOf('--target');
    const targetRoot = path.resolve(
        targetFlag === -1 ? process.cwd() : process.argv[targetFlag + 1],
    );
    const errors = findPackageMatrixViolations(targetRoot);

    if (errors.length > 0) {
        console.error(`check-package-matrix:\n\n${errors.join('\n')}`);
        process.exit(1);
    }

    console.log('check-package-matrix: ok');
}

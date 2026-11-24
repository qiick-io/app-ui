#!/usr/bin/env node
/**
 * Fails a qiick Composer package whose CI matrix is not the shared one
 * (`standards/package-matrix.json`, exported by package-matrix.yml).
 *
 * A package must:
 * 1. call `qiick-io/app-ui/.github/workflows/package-matrix.yml@…`;
 * 2. expand `fromJSON(needs.<job>.outputs.matrix)`;
 * 3. expand `fromJSON(needs.<job>.outputs.databases)`.
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

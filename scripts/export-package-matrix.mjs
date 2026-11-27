#!/usr/bin/env node
/**
 * Exports the canonical PHP matrix and server database services for a package.
 * The package's default Pest matrix covers SQLite; only server databases need
 * service containers. A package may exclude PHP versions below its minimum.
 *
 * Two variants: `full` (push to develop or main, nightly, manual runs) is the
 * whole matrix; `pr` runs only what the files a pull request touches can break
 * (`pr` in package-matrix.json). Every job keeps its name in both, so a
 * required check always reports: a part the PR does not need runs with its
 * steps skipped (`matrix.skip`, `docs-only`, `run-databases`) instead of not
 * at all.
 *
 * Environment: EXCLUDE_PHP_VERSIONS (JSON array), VARIANT (`pr` | `full`),
 * CHANGED_FILES (newline-separated paths, `pr` only), PACKAGE_ROOT (the package
 * checkout, default `package`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Reads the canonical matrix for the workflow and the repository settings audit. */
export function readPackageMatrixDocument() {
    return JSON.parse(
        fs.readFileSync(
            new URL('../standards/package-matrix.json', import.meta.url),
            'utf8',
        ),
    );
}

/**
 * Applies package-specific PHP exclusions and removes SQLite from the
 * service-container list.
 *
 * @param {{matrix: {php: string[]}, databases: {image: string | null}[]}} packageMatrixDocument
 * @param {string[]} excludedPhpVersions
 * @returns {{matrix: {php: string[]} & Record<string, unknown>, databases: {image: string}[]}}
 */
export function createPackageMatrixOutputs(
    packageMatrixDocument,
    excludedPhpVersions,
) {
    if (!Array.isArray(excludedPhpVersions)) {
        throw new TypeError('PHP exclusions must be a JSON array.');
    }

    const unsupportedPhpVersions = excludedPhpVersions.filter(
        (phpVersion) =>
            typeof phpVersion !== 'string' ||
            !packageMatrixDocument.matrix.php.includes(phpVersion),
    );

    if (unsupportedPhpVersions.length > 0) {
        throw new Error(
            `PHP exclusions must name versions in the shared matrix: ${unsupportedPhpVersions.join(', ')}.`,
        );
    }

    const supportedPhpVersions = packageMatrixDocument.matrix.php.filter(
        (phpVersion) => !excludedPhpVersions.includes(phpVersion),
    );

    if (supportedPhpVersions.length === 0) {
        throw new Error(
            'PHP exclusions cannot remove every shared PHP version.',
        );
    }

    return {
        matrix: {
            ...packageMatrixDocument.matrix,
            php: supportedPhpVersions,
        },
        databases: packageMatrixDocument.databases.filter(
            (database) => database.image !== null,
        ),
    };
}

/**
 * @param {string[]} files
 * @param {string[]} patterns - Regular expressions on repo-relative paths
 */
const touches = (files, patterns) =>
    files.filter((file) =>
        patterns.some((pattern) => new RegExp(pattern).test(file)),
    );

/**
 * What a pull request runs, from the files it changes (`pr` in package-matrix.json).
 *
 * @param {{pr: {always: Record<string, string>, whenCodeChanges: Record<string, string>, paths: Record<'docsOnly' | 'code' | 'mutation', string[]>}}} packageMatrixDocument
 * @param {{php: string[], laravel: string[], include: {laravel: string, testbench: string}[]}} fullMatrix - After PHP exclusions
 * @param {string[]} changedFiles
 * @returns {{matrix: {include: Record<string, string | boolean>[]}, isDocsOnly: boolean, runDatabases: boolean, mutateClasses: string[]}}
 */
export function createPullRequestPlan(
    packageMatrixDocument,
    fullMatrix,
    changedFiles,
) {
    const { always, whenCodeChanges, paths } = packageMatrixDocument.pr;
    const isDocsOnly =
        changedFiles.length > 0 &&
        touches(changedFiles, paths.docsOnly).length === changedFiles.length;
    // `lowest` / `highest` name the ends of an axis, after the package's exclusions.
    const cell = (shape, shouldSkip) => {
        const pick = (axis) =>
            shape[axis] === 'lowest'
                ? fullMatrix[axis][0]
                : fullMatrix[axis][fullMatrix[axis].length - 1];
        const laravel = pick('laravel');

        return {
            php: pick('php'),
            laravel,
            'dependency-version': shape['dependency-version'],
            testbench: fullMatrix.include.find(
                (entry) => entry.laravel === laravel,
            )?.testbench,
            skip: shouldSkip,
        };
    };
    const hasCodeChanges = touches(changedFiles, paths.code).length > 0;

    return {
        matrix: {
            include: [
                cell(always, isDocsOnly),
                // Keep the job's check name on every PR, even without code to test.
                cell(whenCodeChanges, isDocsOnly || !hasCodeChanges),
            ],
        },
        isDocsOnly,
        runDatabases: !isDocsOnly,
        mutateClasses: isDocsOnly ? [] : touches(changedFiles, paths.mutation),
    };
}

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] === scriptPath) {
    const packageMatrixDocument = readPackageMatrixDocument();
    const excludedPhpVersions = JSON.parse(
        process.env.EXCLUDE_PHP_VERSIONS ?? '[]',
    );
    const packageMatrixOutputs = createPackageMatrixOutputs(
        packageMatrixDocument,
        excludedPhpVersions,
    );
    const isPullRequest = process.env.VARIANT === 'pr';
    const changedFiles = (process.env.CHANGED_FILES ?? '')
        .split('\n')
        .map((file) => file.trim())
        .filter((file) => file !== '');
    const plan = isPullRequest
        ? createPullRequestPlan(
              packageMatrixDocument,
              packageMatrixOutputs.matrix,
              changedFiles,
          )
        : {
              matrix: packageMatrixOutputs.matrix,
              isDocsOnly: false,
              runDatabases: true,
              mutateClasses: [],
          };
    // A class the PR deleted has nothing left to mutate; the package checkout is in PACKAGE_ROOT.
    const packageRoot = process.env.PACKAGE_ROOT ?? 'package';
    const mutateClasses = plan.mutateClasses.filter((file) =>
        fs.existsSync(path.join(packageRoot, file)),
    );

    process.stdout.write(`variant=${isPullRequest ? 'pr' : 'full'}\n`);
    process.stdout.write(`matrix=${JSON.stringify(plan.matrix)}\n`);
    process.stdout.write(
        `databases=${JSON.stringify(packageMatrixOutputs.databases)}\n`,
    );
    process.stdout.write(`docs-only=${plan.isDocsOnly}\n`);
    process.stdout.write(`run-databases=${plan.runDatabases}\n`);
    // `all` on the full variant; the changed classes (possibly none) on a PR.
    process.stdout.write(`mutate-scope=${isPullRequest ? 'changed' : 'all'}\n`);
    process.stdout.write(`mutate-classes=${JSON.stringify(mutateClasses)}\n`);
}

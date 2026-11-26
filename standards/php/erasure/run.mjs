#!/usr/bin/env node
/**
 * Runs the package erasure suite and proves it ran (qiick standards pack).
 *
 * Generated from qiick-io/app-ui `standards/php/erasure/` by
 * `scripts/sync-standards.mjs`; CI fails when this copy differs. The package's
 * CI runs it as its own step, `node tests/Erasure/run.mjs`, which the
 * standards check requires.
 *
 * It runs `vendor/bin/pest tests/Erasure` by path, so no phpunit.xml exclusion,
 * suite or group filter can leave the suite out, and then fails unless the
 * JUnit report holds a passing, unskipped test for every check of
 * `ErasureConformanceRunner::CHECKS`.
 *
 * Standard: `.qiick/standards/erasure.md`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The check ids of the runner's CHECKS constant.
 *
 * @param {string} runnerSource ErasureConformanceRunner.php
 * @returns {string[]}
 */
export function erasureCheckIds(runnerSource) {
    const checksBlock =
        runnerSource.match(/CHECKS = \[([\s\S]*?)\];/)?.[1] ?? '';

    return [...checksBlock.matchAll(/'(E[\w-]+)'\s*=>/g)].map(
        (match) => match[1],
    );
}

/**
 * Errors for every check without a passing test in the JUnit report.
 *
 * @param {string} junitXml
 * @param {string[]} checkIds
 * @returns {string[]}
 */
export function findErasureRunViolations(junitXml, checkIds) {
    const passingTestNames = [
        ...junitXml.matchAll(
            /<testcase\b[^>]*?\bname="([^"]*)"[^>]*?(?:\/>|>([\s\S]*?)<\/testcase>)/g,
        ),
    ]
        .filter((match) => !/<(?:failure|error|skipped)\b/.test(match[2] ?? ''))
        .map((match) => match[1]);

    return checkIds
        .filter(
            (checkId) =>
                !passingTestNames.some((testName) =>
                    testName.includes(`${checkId}: `),
                ),
        )
        .map((checkId) => `erasure: check ${checkId} did not run and pass.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const erasureDirectory = path.dirname(fileURLToPath(import.meta.url));
    const reportPath = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-erasure-')),
        'junit.xml',
    );
    const pest = spawnSync(
        'vendor/bin/pest',
        [
            path.relative(process.cwd(), erasureDirectory),
            '--log-junit',
            reportPath,
        ],
        { stdio: 'inherit' },
    );

    if (pest.status !== 0) {
        process.exit(pest.status ?? 1);
    }

    const violations = findErasureRunViolations(
        fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '',
        erasureCheckIds(
            fs.readFileSync(
                path.join(
                    erasureDirectory,
                    'Support/ErasureConformanceRunner.php',
                ),
                'utf8',
            ),
        ),
    );

    for (const violation of violations) {
        console.error(violation);
    }

    process.exit(violations.length === 0 ? 0 : 1);
}

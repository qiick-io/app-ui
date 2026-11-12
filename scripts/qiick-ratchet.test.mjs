import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../standards/scripts/qiick-ratchet.mjs',
);
const rule = 'i18next/no-literal-string';

/**
 * Runs the lint ratchet in a throwaway directory.
 * @param {unknown} report - ESLint or oxlint JSON report
 * @param {Record<string, number> | null} baseline
 * @param {string[]} [extraArguments]
 */
function runLint(report, baseline, extraArguments = []) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-ratchet-'));

    if (baseline) {
        fs.writeFileSync(
            path.join(directory, 'baseline.json'),
            JSON.stringify(baseline),
        );
    }

    const result = spawnSync(
        process.execPath,
        [
            script,
            'lint',
            '--rule',
            rule,
            '--baseline',
            'baseline.json',
            ...extraArguments,
        ],
        { cwd: directory, input: JSON.stringify(report), encoding: 'utf8' },
    );

    return { ...result, directory };
}

const eslintReport = (directory, count) => [
    {
        filePath: path.join(directory ?? '.', 'resources/js/pages/home.tsx'),
        messages: Array.from({ length: count }, () => ({ ruleId: rule })),
    },
];

test('the baseline count passes; growth and stale allowance fail', () => {
    const baseline = { 'resources/js/pages/home.tsx': 2 };

    assert.equal(runLint(eslintReport(null, 2), baseline).status, 0);
    assert.equal(runLint(eslintReport(null, 3), baseline).status, 1);
    assert.match(
        runLint(eslintReport(null, 1), baseline).stderr,
        /lower it with --update/,
    );
});

test('oxlint reports are counted, other rules are not', () => {
    const report = {
        diagnostics: [
            { code: 'i18next(no-literal-string)', filename: 'a.tsx' },
            { code: 'eslint(no-unused-vars)', filename: 'a.tsx' },
        ],
    };

    assert.equal(runLint(report, { 'a.tsx': 1 }).status, 0);
    assert.equal(runLint(report, {}).status, 1);
});

test('--update writes the current counts', () => {
    const { directory, status } = runLint(eslintReport(null, 4), null, [
        '--update',
    ]);

    assert.equal(status, 0);
    assert.deepEqual(
        JSON.parse(fs.readFileSync(path.join(directory, 'baseline.json'))),
        { 'resources/js/pages/home.tsx': 4 },
    );
});

test('the phpstan ratchet fails when the baseline grows against the base ref', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-ratchet-'));
    const git = (...gitArguments) =>
        spawnSync('git', gitArguments, { cwd: directory, encoding: 'utf8' });
    const neon = (count) =>
        `parameters:\n\tignoreErrors:\n\t\t-\n\t\t\tmessage: 'x'\n\t\t\tcount: ${count}\n\t\t\tpath: app/A.php\n`;
    const ratchet = () =>
        spawnSync(process.execPath, [script, 'phpstan', '--base', 'HEAD'], {
            cwd: directory,
            encoding: 'utf8',
        });

    git('init', '-q');
    fs.writeFileSync(path.join(directory, 'phpstan-baseline.neon'), neon(3));
    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base');

    fs.writeFileSync(path.join(directory, 'phpstan-baseline.neon'), neon(2));
    assert.equal(ratchet().status, 0);

    fs.writeFileSync(path.join(directory, 'phpstan-baseline.neon'), neon(4));
    assert.equal(ratchet().status, 1);
});

test('several rules keep a baseline per rule', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-ratchet-'));
    const report = [
        {
            filePath: 'resources/js/app.tsx',
            messages: [{ ruleId: 'id-length' }, { ruleId: 'id-length' }],
        },
    ];
    const run = (baseline) => {
        fs.writeFileSync(
            path.join(directory, 'baseline.json'),
            JSON.stringify(baseline),
        );

        return spawnSync(
            process.execPath,
            [
                script,
                'lint',
                '--rule',
                'id-length,no-restricted-imports',
                '--baseline',
                'baseline.json',
            ],
            { cwd: directory, input: JSON.stringify(report), encoding: 'utf8' },
        );
    };

    assert.equal(run({ 'id-length': { 'resources/js/app.tsx': 2 } }).status, 0);
    assert.match(
        run({ 'id-length': { 'resources/js/app.tsx': 1 } }).stderr,
        /2 id-length \(baseline 1\)/,
    );
    // A count under one rule does not cover another rule's findings.
    assert.equal(
        run({ 'no-restricted-imports': { 'resources/js/app.tsx': 2 } }).status,
        1,
    );
});

/**
 * A throwaway git repo with one commit, for the ratchets that compare with a base ref.
 * @param {Record<string, string>} files - Committed as the base
 */
function makeRepoWithBase(files) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-ratchet-'));
    const git = (...gitArguments) =>
        spawnSync('git', gitArguments, { cwd: directory, encoding: 'utf8' });

    git('init', '-q');

    for (const [file, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(directory, file)), {
            recursive: true,
        });
        fs.writeFileSync(path.join(directory, file), content);
    }

    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base');

    return directory;
}

/**
 * @param {string} directory
 * @param {string[]} ratchetArguments
 */
const runRatchet = (directory, ratchetArguments) =>
    spawnSync(
        process.execPath,
        [script, ...ratchetArguments, '--base', 'HEAD'],
        {
            cwd: directory,
            encoding: 'utf8',
        },
    );

const phpstanConfig = (level) => `parameters:\n    level: ${level}\n`;

test('the phpstan ratchet enforces the level floor and never lets the level drop', () => {
    const directory = makeRepoWithBase({ 'phpstan.neon': phpstanConfig(6) });

    assert.equal(runRatchet(directory, ['phpstan']).status, 0);
    assert.match(
        runRatchet(directory, ['phpstan', '--min-level', '8']).stderr,
        /level 6; the qiick floor here is 8/,
    );

    fs.writeFileSync(path.join(directory, 'phpstan.neon'), phpstanConfig(5));
    assert.match(runRatchet(directory, ['phpstan']).stderr, /level dropped/);

    fs.writeFileSync(
        path.join(directory, 'phpstan.neon'),
        phpstanConfig('max'),
    );
    assert.equal(
        runRatchet(directory, ['phpstan', '--min-level', 'max']).status,
        0,
    );
});

/**
 * A Clover report: per file, `[covered, executable]` statement lines, plus a
 * method line that must not count.
 * @param {Record<string, [number, number]>} lineCountsByFile
 */
function clover(lineCountsByFile) {
    const files = Object.entries(lineCountsByFile).map(
        ([file, [covered, executable]]) => {
            const lines = Array.from(
                { length: executable },
                (_, lineIndex) =>
                    `<line num="${lineIndex + 2}" type="stmt" count="${lineIndex < covered ? 1 : 0}"/>`,
            );

            return `<file name="/build/app/${file}"><line num="1" type="method" name="run" count="0"/>${lines.join('')}</file>`;
        },
    );

    return `<?xml version="1.0"?><coverage><project><package name="App">${files.join('')}</package></project></coverage>`;
}

test('the coverage ratchet fails below the floor and when the floor is lowered', () => {
    const directory = makeRepoWithBase({ 'coverage-floor.txt': '70.0\n' });
    const coverage = (covered) => {
        fs.writeFileSync(
            path.join(directory, 'clover.xml'),
            clover({ 'src/A.php': [covered, 100] }),
        );

        return runRatchet(directory, ['coverage', '--clover', 'clover.xml']);
    };

    assert.equal(coverage(70).status, 0);
    assert.match(coverage(69).stderr, /69\.0% is below the floor 70%/);
    assert.match(coverage(80).stdout, /raise it in this PR with --update/);

    fs.writeFileSync(path.join(directory, 'coverage-floor.txt'), '60\n');
    assert.match(coverage(80).stderr, /lowered \(70 -> 60\)/);

    assert.equal(
        runRatchet(directory, [
            'coverage',
            '--clover',
            'clover.xml',
            '--update',
        ]).status,
        0,
    );
    assert.equal(
        fs.readFileSync(path.join(directory, 'coverage-floor.txt'), 'utf8'),
        '80.0\n',
    );
});

test('the coverage ratchet asks for a floor file when there is none', () => {
    const directory = makeRepoWithBase({ 'README.md': '' });

    fs.writeFileSync(
        path.join(directory, 'clover.xml'),
        clover({ 'A.php': [3, 4] }),
    );
    assert.match(
        runRatchet(directory, ['coverage', '--clover', 'clover.xml']).stderr,
        /coverage-floor\.txt is missing: commit the current coverage \(75\.0\)/,
    );
});

test('package coverage applies a fixed minimum per path and skips paths without PHP files', () => {
    const directory = makeRepoWithBase({
        'src/Checks/Check.php': '<?php',
        'src/Kernel.php': '<?php',
    });

    fs.writeFileSync(
        path.join(directory, 'clover.xml'),
        clover({ 'src/Checks/Check.php': [9, 10], 'src/Kernel.php': [5, 10] }),
    );

    const run = (...thresholds) =>
        runRatchet(directory, [
            'coverage',
            '--clover',
            'clover.xml',
            ...thresholds,
        ]);

    assert.equal(run('src/Checks=90', 'src/Future=90').status, 0);
    assert.match(
        run('src/Future=90').stdout,
        /src\/Future has no PHP files yet/,
    );
    // `src` counts `src/Checks` too: 14 of 20 lines.
    assert.match(run('src=90').stderr, /src coverage 70\.0% \(14\/20 lines\)/);
});

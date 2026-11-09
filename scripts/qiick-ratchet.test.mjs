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

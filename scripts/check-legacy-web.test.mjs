import assert from 'node:assert/strict';
import test from 'node:test';
import {
    compareWithBaseline,
    countFindings,
    mergeCounts,
    renderBaseline,
    sortCounts,
} from './check-legacy-web.mjs';

/**
 * A `legacy-scan --json` report, as the scanner writes it.
 * @param {string} targetDir
 * @param {{ ruleId: string, files: string[] }[]} rules
 */
const report = (targetDir, rules) => ({
    targetDir,
    totalFindings: rules.reduce((sum, rule) => sum + rule.files.length, 0),
    guides: rules.map((rule) => ({
        guideId: rule.ruleId,
        rules: [
            {
                ruleId: rule.ruleId,
                findings: rule.files.map((file, index) => ({
                    file,
                    line: index + 1,
                })),
            },
        ],
    })),
});

test('counts findings per rule and file, relative to the repo root', () => {
    const counts = countFindings(
        report('resources/js', [
            {
                ruleId: 'ime-safe-enter-submit',
                files: ['components/dialog.tsx', 'pages/index.tsx'],
            },
            {
                ruleId: 'js/copying-array-methods',
                files: ['lib/sort.ts', 'lib/sort.ts'],
            },
        ]),
    );

    assert.deepEqual(counts, {
        'ime-safe-enter-submit': {
            'resources/js/components/dialog.tsx': 1,
            'resources/js/pages/index.tsx': 1,
        },
        'js/copying-array-methods': { 'resources/js/lib/sort.ts': 2 },
    });
});

test('a scan of the repo root keeps the paths as they are', () => {
    const counts = countFindings(
        report('.', [
            { ruleId: 'js/structured-clone', files: ['app/page.tsx'] },
        ]),
    );

    assert.deepEqual(counts, {
        'js/structured-clone': { 'app/page.tsx': 1 },
    });
});

test('merges the scans of several frontend roots', () => {
    const counts = countFindings(
        report('registry/src', [
            { ruleId: 'js/copying-array-methods', files: ['a.ts'] },
        ]),
    );

    mergeCounts(
        counts,
        countFindings(
            report('playground/src', [
                { ruleId: 'js/copying-array-methods', files: ['b.ts'] },
            ]),
        ),
    );

    assert.deepEqual(counts, {
        'js/copying-array-methods': {
            'registry/src/a.ts': 1,
            'playground/src/b.ts': 1,
        },
    });
});

test('a baseline finding does not fail', () => {
    const errors = compareWithBaseline(
        { 'ime-safe-enter-submit': { 'resources/js/a.tsx': 2 } },
        { 'ime-safe-enter-submit': { 'resources/js/a.tsx': 2 } },
    );

    assert.deepEqual(errors, []);
});

test('a finding in a file the baseline does not list fails', () => {
    const errors = compareWithBaseline(
        {
            'ime-safe-enter-submit': {
                'resources/js/a.tsx': 1,
                'resources/js/new.tsx': 1,
            },
        },
        { 'ime-safe-enter-submit': { 'resources/js/a.tsx': 1 } },
    );

    assert.equal(errors.length, 1);
    assert.match(
        errors[0],
        /^resources\/js\/new\.tsx: 1 ime-safe-enter-submit \(baseline 0\)/,
    );
});

test('a rule the baseline does not list at all fails', () => {
    const errors = compareWithBaseline(
        { 'js/structured-clone': { 'resources/js/a.tsx': 1 } },
        {},
    );

    assert.equal(errors.length, 1);
    assert.match(errors[0], /js\/structured-clone \(baseline 0\)/);
});

test('one more finding in a baselined file fails', () => {
    const errors = compareWithBaseline(
        { 'ime-safe-enter-submit': { 'resources/js/a.tsx': 3 } },
        { 'ime-safe-enter-submit': { 'resources/js/a.tsx': 2 } },
    );

    assert.equal(errors.length, 1);
    assert.match(errors[0], /3 ime-safe-enter-submit \(baseline 2\)/);
});

test('a line number moving does not fail, because lines are not in the key', () => {
    const scanned = countFindings(
        report('resources/js', [
            { ruleId: 'ime-safe-enter-submit', files: ['a.tsx'] },
        ]),
    );
    const scannedLower = countFindings({
        targetDir: 'resources/js',
        totalFindings: 1,
        guides: [
            {
                guideId: 'ime-safe-enter-submit',
                rules: [
                    {
                        ruleId: 'ime-safe-enter-submit',
                        findings: [{ file: 'a.tsx', line: 900 }],
                    },
                ],
            },
        ],
    });

    assert.deepEqual(scanned, scannedLower);
    assert.deepEqual(compareWithBaseline(scannedLower, scanned), []);
});

test('a fixed finding fails until the baseline is lowered', () => {
    const errors = compareWithBaseline(
        {},
        { 'ime-safe-enter-submit': { 'resources/js/a.tsx': 1 } },
    );

    assert.equal(errors.length, 1);
    assert.match(
        errors[0],
        /the baseline still allows 1: lower it with --update/,
    );
});

test('the written baseline is sorted and names the scanner', () => {
    const baseline = JSON.parse(
        renderBaseline({
            'js/copying-array-methods': { 'b.ts': 1, 'a.ts': 1 },
            'ime-safe-enter-submit': { 'c.tsx': 1 },
        }),
    );

    assert.match(baseline.scanner, /^modern-web-guidance@\d+\.\d+\.\d+$/);
    assert.deepEqual(Object.keys(baseline.findings), [
        'ime-safe-enter-submit',
        'js/copying-array-methods',
    ]);
    assert.deepEqual(
        Object.keys(baseline.findings['js/copying-array-methods']),
        ['a.ts', 'b.ts'],
    );
});

test('sorting does not change the counts', () => {
    const counts = { b: { 'z.ts': 2 }, a: { 'y.ts': 1 } };

    assert.deepEqual(sortCounts(counts), {
        a: { 'y.ts': 1 },
        b: { 'z.ts': 2 },
    });
});

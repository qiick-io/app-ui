import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { checkWcag22Report } from './check-wcag22-report.mjs';

const browserAssertion = readFileSync(
    new URL('./wcag22-axe.js', import.meta.url),
    'utf8',
);

test('the WCAG 2.2 axe assertion separates violations, errors and manual review', async () => {
    const calls = [];
    const checkTargetSize = runInNewContext(browserAssertion, {
        window: {
            axe: {
                run: async (options) => {
                    calls.push(options);

                    return {
                        violations: [
                            {
                                nodes: [
                                    {
                                        target: ['#close'],
                                        failureSummary: 'Insufficient spacing',
                                    },
                                ],
                            },
                        ],
                        incomplete: [
                            {
                                help: 'Review spacing',
                                nodes: [{ target: ['#review'] }],
                            },
                            { error: new Error('Rule execution failed') },
                        ],
                    };
                },
            },
        },
    });

    assert.deepEqual(structuredClone(await checkTargetSize()), {
        rule: 'target-size',
        violations: [
            { target: ['#close'], detail: 'Insufficient spacing' },
            { target: [], detail: 'Rule execution failed' },
        ],
        needsReview: [{ target: ['#review'], detail: 'Review spacing' }],
    });
    assert.deepEqual(structuredClone(calls), [{ runOnly: ['target-size'] }]);
});

test('the focus check distinguishes a visible control, full opaque cover and a partial overlap', () => {
    const source = readFileSync(
        new URL('./wcag22-focus.js', import.meta.url),
        'utf8',
    );
    const focusedBounds = { left: 10, top: 10, right: 30, bottom: 30 };
    const focused = {
        getBoundingClientRect: () => focusedBounds,
        contains: (element) => element === focused,
        closest: () => null,
    };
    const checkFocus = (overlayBounds) => {
        const overlay = overlayBounds && {
            getBoundingClientRect: () => overlayBounds,
            contains: () => false,
        };
        const hit = overlay ? { closest: () => overlay } : focused;
        const document = {
            activeElement: focused,
            elementFromPoint: () => hit,
        };

        return runInNewContext(source, {
            document,
            window: { innerWidth: 100, innerHeight: 100 },
        })('.overlay');
    };

    assert.equal(checkFocus(null).violations.length, 0);
    assert.equal(checkFocus(null).needsReview.length, 0);
    assert.equal(
        checkFocus({ left: 0, top: 0, right: 40, bottom: 40 }).violations
            .length,
        1,
    );
    assert.equal(
        checkFocus({ left: 0, top: 15, right: 40, bottom: 40 }).needsReview
            .length,
        1,
    );
});

test('the workflow requires a target-size report and retains manual findings', () => {
    assert.throws(
        () => checkWcag22Report(''),
        /did not report any target-size checks/,
    );
    assert.throws(
        () => checkWcag22Report('{}\n'),
        /Invalid WCAG 2.2 browser report/,
    );

    const reviewFinding = { target: ['#review'] };
    const result = JSON.stringify({
        rule: 'target-size',
        violations: [],
        needsReview: [reviewFinding],
    });
    const violation = JSON.stringify({
        rule: 'focus-not-obscured',
        violations: [{ detail: 'Fully covered' }],
        needsReview: [],
    });
    assert.deepEqual(
        checkWcag22Report(`${result}\n${result}\n${violation}\n`),
        {
            violations: [
                JSON.stringify({
                    rule: 'focus-not-obscured',
                    detail: 'Fully covered',
                }),
            ],
            needsReview: [
                JSON.stringify({ rule: 'target-size', ...reviewFinding }),
            ],
        },
    );
});

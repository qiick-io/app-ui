import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const browserAssertion = readFileSync(
    new URL('./wcag22-axe.js', import.meta.url),
    'utf8',
);

test('the WCAG 2.2 axe assertion runs target size and reports violations and execution errors', async () => {
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
                            { nodes: [{ target: ['#review'] }] },
                            { error: new Error('Rule execution failed') },
                        ],
                    };
                },
            },
        },
    });

    assert.deepEqual(structuredClone(await checkTargetSize()), [
        { target: ['#close'], detail: 'Insufficient spacing' },
        { target: [], detail: 'Rule execution failed' },
    ]);
    assert.deepEqual(structuredClone(calls), [{ runOnly: ['target-size'] }]);
});

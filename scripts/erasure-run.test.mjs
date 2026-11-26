import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    erasureCheckIds,
    findErasureRunViolations,
} from '../standards/php/erasure/run.mjs';

const CHECK_IDS = ['E1', 'E3-delete', 'E3b'];

/** @param {string} testcases */
const junit = (testcases) =>
    `<?xml version="1.0"?><testsuites><testsuite name="Erasure">${testcases}</testsuite></testsuites>`;

test('the erasure run passes only when every check ran and passed', () => {
    const passing = junit(
        '<testcase name="it E1: the eraser has the shape"/>' +
            '<testcase name="it E3-delete: a delete run"></testcase>' +
            '<testcase name="it E3b: every table"/>',
    );

    assert.deepEqual(findErasureRunViolations(passing, CHECK_IDS), []);
    assert.equal(findErasureRunViolations(junit(''), CHECK_IDS).length, 3);
    assert.deepEqual(
        findErasureRunViolations(
            passing.replace(
                '<testcase name="it E3b: every table"/>',
                '<testcase name="it E3b: every table"><skipped/></testcase>',
            ),
            CHECK_IDS,
        ),
        ['erasure: check E3b did not run and pass.'],
    );
});

test('the check ids come from the runner the package has installed', () => {
    const runnerSource = `final class ErasureConformanceRunner
{
    public const array CHECKS = [
        'E1' => 'the eraser',
        'E3-delete' => 'a delete run',
        'E3b' => 'every table',
    ];

    private const array KEPT_REASONS = ['legal_obligation'];
}`;

    assert.deepEqual(erasureCheckIds(runnerSource), CHECK_IDS);
});

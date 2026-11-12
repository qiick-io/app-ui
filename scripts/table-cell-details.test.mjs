import assert from 'node:assert/strict';
import { test } from 'node:test';
// Node strips the types of the registry's TypeScript lib (no imports in it).
import {
    MINIMUM_VISIBLE_BAR_PERCENT,
    barWidthPercent,
} from '../registry/src/lib/table-cell-details.ts';

test('the largest value fills the row and the others scale against it', () => {
    assert.equal(barWidthPercent(0.08, 0.08), 100);
    assert.equal(barWidthPercent(0.06, 0.08), 75);
    assert.equal(barWidthPercent(40, 160), 25);
});

test('a tiny value above zero still shows a sliver', () => {
    assert.equal(barWidthPercent(0.001, 1000), MINIMUM_VISIBLE_BAR_PERCENT);
});

test('zero, negative and non-finite values get no bar', () => {
    assert.equal(barWidthPercent(0, 10), 0);
    assert.equal(barWidthPercent(-3, 10), 0);
    assert.equal(barWidthPercent(Number.NaN, 10), 0);
    assert.equal(barWidthPercent(5, 0), 0);
    assert.equal(barWidthPercent(5, Number.POSITIVE_INFINITY), 0);
});

test('a value above the largest one never overflows the row', () => {
    assert.equal(barWidthPercent(20, 10), 100);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
// Node strips the types of the registry's TypeScript lib (no imports in it).
import {
    DEFAULT_VISIBLE_CHIP_COUNT,
    splitTimelineChips,
} from '../registry/src/lib/timeline.ts';

const chipsUpTo = (count) =>
    Array.from({ length: count }, (_, position) => `chip-${position + 1}`);

test('chips past the visible count fold, in the order the app sent them', () => {
    const { visibleChips, foldedChips } = splitTimelineChips(chipsUpTo(10), 6);

    assert.deepEqual(visibleChips, chipsUpTo(6));
    assert.deepEqual(foldedChips, ['chip-7', 'chip-8', 'chip-9', 'chip-10']);
});

test('a single extra chip shows instead of a "Show 1 more" toggle', () => {
    const { visibleChips, foldedChips } = splitTimelineChips(chipsUpTo(7), 6);

    assert.equal(visibleChips.length, 7);
    assert.deepEqual(foldedChips, []);
});

test('few or no chips never fold', () => {
    assert.deepEqual(splitTimelineChips([], 6), {
        visibleChips: [],
        foldedChips: [],
    });
    assert.deepEqual(splitTimelineChips(chipsUpTo(3), 6).foldedChips, []);
});

test('a count below one still shows one chip; a non-finite count shows all', () => {
    assert.deepEqual(splitTimelineChips(chipsUpTo(4), 0).visibleChips, [
        'chip-1',
    ]);
    assert.equal(
        splitTimelineChips(chipsUpTo(20), Number.POSITIVE_INFINITY).foldedChips
            .length,
        0,
    );
    assert.equal(
        splitTimelineChips(chipsUpTo(20), Number.NaN).foldedChips.length,
        0,
    );
});

test('the default shows six chips', () => {
    assert.equal(DEFAULT_VISIBLE_CHIP_COUNT, 6);
});

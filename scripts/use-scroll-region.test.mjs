import assert from 'node:assert/strict';
import { test } from 'node:test';
// Node strips the hook's types; only the pure measurement is tested here.
import { hiddenScrollSides } from '../registry/src/hooks/use-scroll-region.ts';

const wideTable = { scrollWidth: 900, clientWidth: 390, isRightToLeft: false };

test('a table that fits hides nothing, so no cue shows', () => {
    assert.deepEqual(
        hiddenScrollSides({
            scrollLeft: 0,
            scrollWidth: 390,
            clientWidth: 390,
            isRightToLeft: false,
        }),
        { hasHiddenLeft: false, hasHiddenRight: false },
    );
});

test('a wide table at rest hides columns on the right only', () => {
    assert.deepEqual(hiddenScrollSides({ ...wideTable, scrollLeft: 0 }), {
        hasHiddenLeft: false,
        hasHiddenRight: true,
    });
});

test('scrolled to the middle it hides columns on both sides', () => {
    assert.deepEqual(hiddenScrollSides({ ...wideTable, scrollLeft: 200 }), {
        hasHiddenLeft: true,
        hasHiddenRight: true,
    });
});

test('scrolled to the end it hides columns on the left only, sub-pixel slack included', () => {
    assert.deepEqual(hiddenScrollSides({ ...wideTable, scrollLeft: 509.5 }), {
        hasHiddenLeft: true,
        hasHiddenRight: false,
    });
});

test('right to left starts at the right edge with negative scroll offsets', () => {
    const rightToLeftTable = { ...wideTable, isRightToLeft: true };

    assert.deepEqual(
        hiddenScrollSides({ ...rightToLeftTable, scrollLeft: 0 }),
        {
            hasHiddenLeft: true,
            hasHiddenRight: false,
        },
    );
    assert.deepEqual(
        hiddenScrollSides({ ...rightToLeftTable, scrollLeft: -510 }),
        { hasHiddenLeft: false, hasHiddenRight: true },
    );
});

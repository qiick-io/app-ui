import assert from 'node:assert/strict';
import { test } from 'node:test';
// Node strips the types of the registry's TypeScript lib (no imports in it).
import {
    paginationPageUrl,
    paginationWindow,
} from '../registry/src/lib/pagination-window.ts';

test('a few pages show every page, no gaps', () => {
    assert.deepEqual(paginationWindow(1, 1), [1]);
    assert.deepEqual(paginationWindow(4, 7), [1, 2, 3, 4, 5, 6, 7]);
});

test('near the start the window keeps five leading pages', () => {
    assert.deepEqual(paginationWindow(1, 120), [1, 2, 3, 4, 5, null, 120]);
    assert.deepEqual(paginationWindow(3, 120), [1, 2, 3, 4, 5, null, 120]);
});

test('in the middle it shows the current page with one neighbour each side', () => {
    assert.deepEqual(paginationWindow(6421, 12854), [
        1,
        null,
        6420,
        6421,
        6422,
        null,
        12854,
    ]);
});

test('near the end the window keeps five trailing pages', () => {
    assert.deepEqual(paginationWindow(12853, 12854), [
        1,
        null,
        12850,
        12851,
        12852,
        12853,
        12854,
    ]);
    assert.deepEqual(paginationWindow(12854, 12854), [
        1,
        null,
        12850,
        12851,
        12852,
        12853,
        12854,
    ]);
});

test('never more than seven numbers, at any page', () => {
    for (const lastPage of [1, 7, 8, 120, 12854]) {
        for (
            let currentPage = 1;
            currentPage <= Math.min(lastPage, 200);
            currentPage++
        ) {
            const numbers = paginationWindow(currentPage, lastPage).filter(
                (entry) => entry !== null,
            );
            assert.ok(
                numbers.length <= 7,
                `${currentPage}/${lastPage}: ${numbers.length}`,
            );
            assert.ok(numbers.includes(currentPage));
        }
    }
});

test('an out-of-range page is clamped, no pages gives nothing', () => {
    assert.deepEqual(paginationWindow(99, 3), [1, 2, 3]);
    assert.deepEqual(paginationWindow(1, 0), []);
});

test('page URLs keep every other parameter and find the page parameter by value', () => {
    assert.equal(
        paginationPageUrl(
            'https://app.test/activity?q=x&page=12845&per_page=20',
            12845,
            6421,
        ),
        'https://app.test/activity?q=x&page=6421&per_page=20',
    );
    assert.equal(
        paginationPageUrl('https://app.test/users?usersPage=2', 2, 9),
        'https://app.test/users?usersPage=9',
    );
    assert.equal(
        paginationPageUrl('/activity?page=1', 1, 3),
        '/activity?page=3',
    );
});

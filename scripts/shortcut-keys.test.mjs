import assert from 'node:assert/strict';
import { test } from 'node:test';
// Node strips the types of the registry's TypeScript lib (no imports in it).
import {
    isSingleKeyShortcut,
    isTypingTarget,
    matchesShortcut,
    parseShortcut,
    shortcutKeyCaps,
} from '../registry/src/lib/shortcut-keys.ts';

/** A keydown with no modifiers unless the test sets them. */
const keyEvent = (key, modifiers = {}) => ({
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...modifiers,
});

test('mod is ⌘ on Apple platforms and Ctrl elsewhere', () => {
    assert.ok(matchesShortcut(keyEvent('k', { metaKey: true }), 'mod+k', true));
    assert.ok(
        !matchesShortcut(keyEvent('k', { ctrlKey: true }), 'mod+k', true),
    );
    assert.ok(
        matchesShortcut(keyEvent('k', { ctrlKey: true }), 'mod+k', false),
    );
    assert.ok(!matchesShortcut(keyEvent('k'), 'mod+k', false));
});

test('extra modifiers do not match a plain key', () => {
    assert.ok(matchesShortcut(keyEvent('j'), 'j', true));
    assert.ok(!matchesShortcut(keyEvent('j', { metaKey: true }), 'j', true));
    assert.ok(!matchesShortcut(keyEvent('j', { altKey: true }), 'j', true));
});

test('shift+? matches the printed question mark', () => {
    assert.ok(
        matchesShortcut(keyEvent('?', { shiftKey: true }), 'shift+?', true),
    );
    assert.ok(!matchesShortcut(keyEvent('/'), 'shift+?', true));
});

test('single-key shortcuts are the ones without ⌘ / Ctrl / Alt', () => {
    assert.ok(isSingleKeyShortcut('j'));
    assert.ok(isSingleKeyShortcut('shift+?'));
    assert.ok(!isSingleKeyShortcut('mod+k'));
    assert.ok(!isSingleKeyShortcut('alt+n'));
});

test('key caps follow the platform and drop Shift on shifted symbols', () => {
    assert.deepEqual(shortcutKeyCaps('mod+k', true), ['⌘', 'K']);
    assert.deepEqual(shortcutKeyCaps('mod+k', false), ['Ctrl', 'K']);
    assert.deepEqual(shortcutKeyCaps('shift+?', true), ['?']);
    assert.deepEqual(shortcutKeyCaps('shift+n', false), ['Shift', 'N']);
});

test('an unknown modifier is an error', () => {
    assert.throws(() => parseShortcut('cmd+k'), /"cmd" is not a modifier/);
});

test('typing targets are fields and editors, not buttons or checkboxes', () => {
    const elementMatching = (selectorMatches, isContentEditable = false) => ({
        isContentEditable,
        closest: () => (selectorMatches ? {} : null),
    });

    assert.ok(isTypingTarget(elementMatching(true)));
    assert.ok(isTypingTarget(elementMatching(false, true)));
    assert.ok(!isTypingTarget(elementMatching(false)));
    assert.ok(!isTypingTarget(null));
});

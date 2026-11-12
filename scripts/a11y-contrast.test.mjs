/**
 * Behaviour of scripts/a11y-contrast.mjs on the status badges (#77, #122):
 * the badge's real tints, at rest and on hover, are checked, so a darker one
 * cannot slip back in.
 *
 * Usage: node --test scripts/
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts/a11y-contrast.mjs');
const badgeSource = fs.readFileSync(
    path.join(root, 'registry/src/components/ui/badge.tsx'),
    'utf8',
);

/**
 * @param {string[]} extraArguments
 */
function runContrastCheck(extraArguments = []) {
    return spawnSync(process.execPath, [script, ...extraArguments], {
        encoding: 'utf8',
    });
}

test('the registry theme and badge pass, badges included', () => {
    const result = runContrastCheck();

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /PASS {2}badge success \/ card: /);
    assert.match(result.stdout, /PASS {2}badge destructive \/ sidebar: /);
    assert.match(result.stdout, /PASS {2}badge success hover \/ popover: /);
});

test('the dark bg-success/20 tint fails on the popover at 4.49:1', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-badge-'));
    const badgeWithDarkerTint = path.join(directory, 'badge.tsx');

    fs.writeFileSync(
        badgeWithDarkerTint,
        badgeSource.replace(
            'bg-success/15 text-success',
            'bg-success/15 text-success dark:bg-success/20',
        ),
    );

    const result = runContrastCheck(['--badge', badgeWithDarkerTint]);

    assert.equal(result.status, 1);
    assert.match(
        result.stderr,
        /FAIL {2}badge success \/ popover: 4\.49:1 \(need 4\.5:1\) \[#6fd49a on #355552\]/,
    );
});

test('a hover that raises the tint fails on the muted row', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-badge-'));
    const badgeWithDarkerHover = path.join(directory, 'badge.tsx');

    fs.writeFileSync(
        badgeWithDarkerHover,
        badgeSource.replace('[a&]:hover:bg-info/10', '[a&]:hover:bg-info/25'),
    );

    const result = runContrastCheck(['--badge', badgeWithDarkerHover]);

    assert.equal(result.status, 1);
    assert.match(
        result.stderr,
        /FAIL {2}badge info hover \/ muted: 4\.06:1 \(need 4\.5:1\) \[#1d4ed8 on #b8caef\]/,
    );
});

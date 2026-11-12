/**
 * Behaviour of scripts/a11y-contrast.mjs on the status badges (#77): the
 * badge's real tint is checked, so a darker one cannot slip back in.
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
});

test('the dark bg-success/20 tint fails on the card at 4.42:1', () => {
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
        /FAIL {2}badge success \/ card: 4\.42:1 \(need 4\.5:1\) \[#3bb872 on #1e413a\]/,
    );
});

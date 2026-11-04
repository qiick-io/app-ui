#!/usr/bin/env node
/**
 * Registry guardrails (#1):
 * - `public/r` must match a fresh `shadcn build` of `registry/registry.json`
 *   (apps install straight from the committed files at a release tag, #4);
 * - every registry item needs a playground demo in `playground/src/demos/{name}.tsx`.
 *
 * Usage: node scripts/check-registry.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const committedDir = path.join(root, 'public/r');
const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-registry-'));
const registry = JSON.parse(
    fs.readFileSync(path.join(root, 'registry/registry.json'), 'utf8'),
);
const errors = [];

execFileSync('npx', ['shadcn', 'build', '--output', freshDir], {
    cwd: path.join(root, 'registry'),
    stdio: 'ignore',
});

const listJson = (dir) =>
    fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((name) => name.endsWith('.json'))
        : [];
const freshFiles = listJson(freshDir);
const committedFiles = listJson(committedDir);

for (const name of freshFiles) {
    const fresh = fs.readFileSync(path.join(freshDir, name), 'utf8');
    const committedPath = path.join(committedDir, name);

    if (!fs.existsSync(committedPath)) {
        errors.push(`public/r/${name} is missing`);
    } else if (fs.readFileSync(committedPath, 'utf8') !== fresh) {
        errors.push(`public/r/${name} is out of date`);
    }
}

for (const name of committedFiles) {
    if (!freshFiles.includes(name)) {
        errors.push(`public/r/${name} has no registry item (remove it)`);
    }
}

fs.rmSync(freshDir, { recursive: true, force: true });

for (const item of registry.items) {
    if (
        !fs.existsSync(path.join(root, `playground/src/demos/${item.name}.tsx`))
    ) {
        errors.push(`playground/src/demos/${item.name}.tsx is missing`);
    }
}

if (errors.length > 0) {
    console.error('check-registry: failed\n');
    console.error(errors.map((error) => `  ${error}`).join('\n'));
    console.error('\nRun `npm run build` and commit public/r.');
    process.exit(1);
}

console.log(
    `check-registry: ok (${registry.items.length} items, public/r up to date)`,
);

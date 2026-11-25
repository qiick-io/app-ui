#!/usr/bin/env node
/**
 * Expand / contract (fleet convention F21, `standards/rules/operations.md`):
 * run by `migrations-frozen.sh` once a repo has a stable tag, with the
 * migrations added since that tag. Exits 1 when one of them breaks the
 * previous release's code without a `contract:` or `expand-safe:` comment.
 *
 *     node check-expand-contract.mjs <latest stable tag> <migration file> …
 *
 * Reads the repo's tags with `git tag`, so it runs from the repo root.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

import { findExpandContractViolations } from './check-conventions.mjs';

const [latestStableTag, ...migrationPaths] = process.argv.slice(2);
const releasedTags = execFileSync('git', ['tag', '--list', 'v*'], {
    encoding: 'utf8',
})
    .split('\n')
    .filter((tag) => tag !== '');
const errors = findExpandContractViolations(
    migrationPaths.map((migrationPath) => ({
        path: migrationPath,
        text: fs.readFileSync(migrationPath, 'utf8'),
    })),
    releasedTags,
    latestStableTag,
);

for (const error of errors) {
    console.error(`FAIL: ${error}`);
}

process.exit(errors.length > 0 ? 1 : 0);

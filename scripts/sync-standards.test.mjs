import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { syncStandards } from './sync-standards.mjs';

/**
 * A throwaway repo with a qiick-standards.json and the given files.
 * @param {Record<string, unknown>} config
 * @param {Record<string, string>} [files]
 */
function makeRepo(config, files = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-standards-'));

    fs.writeFileSync(
        path.join(root, 'qiick-standards.json'),
        JSON.stringify(config),
    );

    for (const [file, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        fs.writeFileSync(path.join(root, file), content);
    }

    return root;
}

const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8');

test('a synced repo passes the check', () => {
    const root = makeRepo({ uiPreset: 'Blue', php: true, eslint: true });

    syncStandards(root, { isCheck: false });

    assert.deepEqual(syncStandards(root, { isCheck: true }), []);
    assert.match(read(root, 'AGENTS.md'), /This repo's preset: \*\*Blue\*\*/);
    assert.match(read(root, 'CLAUDE.md'), /^@AGENTS\.md$/m);
    assert.ok(
        fs.existsSync(path.join(root, 'tests/Arch/naming-architecture.php')),
    );
    assert.ok(fs.existsSync(path.join(root, 'qiick-standards.eslint.js')));
});

test('a repo without UI or PHP gets neither the UI rules nor the arch test', () => {
    const root = makeRepo({});

    syncStandards(root, { isCheck: false });

    assert.doesNotMatch(read(root, 'AGENTS.md'), /qiick app UI/);
    assert.ok(
        !fs.existsSync(
            path.join(root, '.cursor/rules/accessibility-and-theme.mdc'),
        ),
    );
    assert.ok(
        !fs.existsSync(
            path.join(root, 'tests/Arch/NamingArchitectureTest.php'),
        ),
    );
});

test('repo text outside the block survives the sync and is not checked', () => {
    const root = makeRepo(
        {},
        {
            'AGENTS.md':
                '## Repository rules\n\nKeep it small.\n\n<laravel-boost-guidelines>\nboost\n</laravel-boost-guidelines>\n',
        },
    );

    syncStandards(root, { isCheck: false });
    fs.appendFileSync(path.join(root, 'AGENTS.md'), '\nAnother local rule.\n');

    const agents = read(root, 'AGENTS.md');

    assert.ok(agents.startsWith('<!-- qiick-standards:begin'));
    assert.match(agents, /Keep it small\./);
    assert.match(agents, /<laravel-boost-guidelines>/);
    assert.deepEqual(syncStandards(root, { isCheck: true }), []);

    // A second sync replaces the block in place and keeps the rest.
    syncStandards(root, { isCheck: false });
    assert.equal(read(root, 'AGENTS.md'), agents);
});

test('an edit inside a block or a managed file fails the check', () => {
    const root = makeRepo({ php: true });

    syncStandards(root, { isCheck: false });
    fs.writeFileSync(
        path.join(root, 'AGENTS.md'),
        read(root, 'AGENTS.md').replace('squash-merged', 'merged'),
    );
    fs.appendFileSync(
        path.join(root, 'tests/Arch/NamingArchitectureTest.php'),
        '// local\n',
    );

    assert.deepEqual(syncStandards(root, { isCheck: true }), [
        'AGENTS.md: the qiick-standards block differs from the standards (edit outside the block only).',
        'tests/Arch/NamingArchitectureTest.php differs from the standards.',
    ]);
});

test('the repo-owned arch config is written once and never overwritten', () => {
    const root = makeRepo(
        { php: true },
        { 'tests/Arch/naming-architecture.php': '<?php return [];\n' },
    );

    syncStandards(root, { isCheck: false });

    assert.equal(
        read(root, 'tests/Arch/naming-architecture.php'),
        '<?php return [];\n',
    );
});

test('non-kebab-case frontend names fail the check', () => {
    const root = makeRepo(
        { frontendRoots: ['resources/js'] },
        {
            'resources/js/components/user-menu.tsx': '',
            'resources/js/components/UserCard.tsx': '',
            'resources/js/Pages/home.tsx': '',
            'resources/js/types/global.d.ts': '',
        },
    );

    syncStandards(root, { isCheck: false });

    assert.deepEqual(syncStandards(root, { isCheck: true }).sort(), [
        'resources/js/Pages is not kebab-case (frontend files and directories are kebab-case on disk).',
        'resources/js/components/UserCard.tsx is not kebab-case (frontend files and directories are kebab-case on disk).',
    ]);
});

test('a repo without frontend roots has no file names checked, even in git', () => {
    const root = makeRepo({}, { 'README.md': '', 'docs/ARCHITECTURE.md': '' });

    spawnSync('git', ['init', '-q'], { cwd: root });
    syncStandards(root, { isCheck: false });

    assert.deepEqual(syncStandards(root, { isCheck: true }), []);
});

test('gitignored output under a frontend root is not checked', () => {
    const root = makeRepo(
        { frontendRoots: ['resources/js'] },
        {
            '.gitignore': '/resources/js/actions\n',
            'resources/js/actions/App/UserController.ts': '',
            'resources/js/app.tsx': '',
        },
    );

    spawnSync('git', ['init', '-q'], { cwd: root });
    syncStandards(root, { isCheck: false });

    assert.deepEqual(syncStandards(root, { isCheck: true }), []);
});

test('Laravel UI apps get the theme-token check with a baseline of their own', () => {
    const app = makeRepo({ uiPreset: 'Teal', php: true });
    const nonUiPackage = makeRepo({ php: true });

    syncStandards(app, { isCheck: false });
    syncStandards(nonUiPackage, { isCheck: false });

    assert.ok(fs.existsSync(path.join(app, 'scripts/check-ui-tokens.mjs')));
    assert.match(
        read(app, 'scripts/ui-token-baseline.txt'),
        /Format: path:kind:token:count/,
    );
    assert.ok(
        !fs.existsSync(path.join(nonUiPackage, 'scripts/check-ui-tokens.mjs')),
    );
});

test('PHP repos get the backend conventions', () => {
    const laravelRepo = makeRepo({ php: true });
    const frontendOnlyRepo = makeRepo({});

    syncStandards(laravelRepo, { isCheck: false });
    syncStandards(frontendOnlyRepo, { isCheck: false });

    assert.match(read(laravelRepo, 'AGENTS.md'), /^## Backend conventions$/m);
    assert.doesNotMatch(
        read(frontendOnlyRepo, 'AGENTS.md'),
        /Backend conventions/,
    );
});

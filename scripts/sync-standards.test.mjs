import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
    qiickRatchetedRuleIds,
    qiickRatchetedRules,
} from '../standards/eslint/qiick-standards.eslint.js';
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

    // Every product must ignore the local graph; default fixtures pass that check.
    if (!Object.hasOwn(files, '.gitignore')) {
        files = { '.gitignore': '/graphify-out/\n', ...files };
    }

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
    assert.ok(
        fs.existsSync(
            path.join(root, 'tests/Conformance/ConformanceSuiteTest.php'),
        ),
    );
    assert.ok(fs.existsSync(path.join(root, 'tests/Conformance/hooks.php')));
    assert.ok(
        fs.existsSync(
            path.join(root, 'tests/Conformance/Support/ConformanceRunner.php'),
        ),
    );
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

test('the repo-owned conformance hooks file is written once and never overwritten', () => {
    const root = makeRepo(
        { php: true },
        {
            'tests/Conformance/hooks.php':
                "<?php\n\ndeclare(strict_types=1);\n\nreturn ['assertErasure' => static fn () => null];\n",
        },
    );

    syncStandards(root, { isCheck: false });

    assert.match(read(root, 'tests/Conformance/hooks.php'), /assertErasure/);
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
            '.gitignore': '/resources/js/actions\n/graphify-out/\n',
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
    assert.match(read(laravelRepo, 'AGENTS.md'), /^## Fleet conventions$/m);
    assert.match(
        read(laravelRepo, '.qiick/standards/conventions.md'),
        /^## F14 Test fakes in `Testing`$/m,
    );
    assert.doesNotMatch(
        read(frontendOnlyRepo, 'AGENTS.md'),
        /Backend conventions|Fleet conventions/,
    );
});

test('the fleet convention checks run only in a repo that adopted them', () => {
    const files = {
        'composer.json': JSON.stringify({ name: 'qiick/laravel-demo' }),
        'config/demo.php': "<?php return ['timeout' => env('TIMEOUT')];",
    };
    const conventionErrors = (config) => {
        const root = makeRepo(config, files);

        syncStandards(root, { isCheck: false });

        return syncStandards(root, { isCheck: true }).filter((message) =>
            message.startsWith('conventions'),
        );
    };

    assert.deepEqual(conventionErrors({ php: true, package: true }), []);
    assert.match(
        conventionErrors({ php: true, package: true, conventions: {} }).join(
            '\n',
        ),
        /F7 .*env\('TIMEOUT'\) does not start with DEMO_/,
    );
});

test('apps get the stack rules and every repo points at the new-product guide', () => {
    const app = makeRepo({ app: true });
    const library = makeRepo({});

    syncStandards(app, { isCheck: false });
    syncStandards(library, { isCheck: false });

    assert.match(read(app, 'AGENTS.md'), /^## Stack$/m);
    assert.doesNotMatch(read(library, 'AGENTS.md'), /^## Stack$/m);
    assert.match(read(library, 'AGENTS.md'), /docs\/new-product\.md/);
});

test('the agent files carry each page core with a pointer, the details live in .qiick/standards', () => {
    const repo = makeRepo({ php: true, uiPreset: 'Teal', app: true });

    syncStandards(repo, { isCheck: false });

    const agents = read(repo, 'AGENTS.md');
    const codeDetails = read(repo, '.qiick/standards/code.md');

    assert.match(agents, /^### Architecture: five layers$/m);
    assert.doesNotMatch(agents, /^### Role suffixes$/m);
    assert.match(
        agents,
        /\*\*Details:\*\* `\.qiick\/standards\/code\.md`\. Read it before creating or renaming/,
    );
    assert.match(codeDetails, /^## Role suffixes$/m);
    assert.match(codeDetails, /^## Architecture: five layers$/m);
    assert.doesNotMatch(codeDetails, /qiick-standards:detail/);
    assert.doesNotMatch(
        read(repo, '.cursor/rules/code-craftsmanship.mdc'),
        /qiick-standards:detail/,
    );
    assert.deepEqual(syncStandards(repo, { isCheck: true }), []);
});

test('Vite+ apps get the shared Oxlint configs, ESLint repos the ESLint one', () => {
    const viteApp = makeRepo({ php: true, oxlint: true });
    const eslintRepo = makeRepo({ php: true, eslint: true });

    syncStandards(viteApp, { isCheck: false });
    syncStandards(eslintRepo, { isCheck: false });

    assert.match(
        read(viteApp, '.oxlintrc.standards.json'),
        /"no-restricted-imports"/,
    );
    assert.match(read(viteApp, '.oxlintrc.i18n.json'), /eslint-plugin-i18next/);
    assert.equal(
        fs.existsSync(path.join(viteApp, 'qiick-standards.eslint.js')),
        false,
    );
    assert.equal(
        fs.existsSync(path.join(eslintRepo, '.oxlintrc.standards.json')),
        false,
    );
    assert.deepEqual(syncStandards(viteApp, { isCheck: true }), []);
});

test('Oxlint and ESLint ratchet the same rules with the same size limits', () => {
    const oxlintRules = JSON.parse(
        fs.readFileSync(
            new URL(
                '../standards/oxlint/oxlintrc.standards.json',
                import.meta.url,
            ),
            'utf8',
        ),
    ).rules;
    const eslintRules = Object.assign(
        {},
        ...qiickRatchetedRules(['**/*.ts']).map((config) => config.rules),
    );

    // Boolean prefixes are type-aware: ESLint only, until Oxlint has an equivalent.
    assert.deepEqual(
        Object.keys(oxlintRules),
        qiickRatchetedRuleIds.filter(
            (ruleId) => ruleId !== '@typescript-eslint/naming-convention',
        ),
    );

    for (const [ruleId, max] of [
        ['max-lines', 600],
        ['max-lines-per-function', 300],
    ]) {
        const sizeOptions = { max, skipBlankLines: true, skipComments: true };

        assert.deepEqual(oxlintRules[ruleId], ['warn', sizeOptions]);
        assert.deepEqual(eslintRules[ruleId][1], sizeOptions);
    }
});

/** A catalogue with one plain pattern and one with variants, for the `patterns` tests. */
const testCatalogue = {
    'command-palette': {
        title: 'Command palette',
        page: 'docs/optional/command-palette.md',
    },
    'grouped-tabs': {
        title: 'Grouped view tabs',
        page: 'docs/optional/grouped-tabs.md',
        variants: ['sub-menu', 'two-rows'],
    },
};

test('adopted optional patterns are named in the UI rules', () => {
    const root = makeRepo({
        uiPreset: 'Blue',
        patterns: ['command-palette', 'grouped-tabs:two-rows'],
    });

    syncStandards(root, { isCheck: false, catalogue: testCatalogue });

    assert.deepEqual(
        syncStandards(root, { isCheck: true, catalogue: testCatalogue }),
        [],
    );
    assert.match(
        read(root, 'AGENTS.md'),
        /Optional patterns adopted in this repo: \[command-palette\]\(.+command-palette\.md\), \[grouped-tabs \(two-rows\)\]/,
    );
    assert.match(
        read(root, '.qiick/standards/ui.md'),
        /\| Grouped view tabs \| `grouped-tabs:sub-menu`, `grouped-tabs:two-rows` \|/,
    );
});

test('a UI repo without patterns says it adopted none', () => {
    const root = makeRepo({ uiPreset: 'Teal' });

    syncStandards(root, { isCheck: false, catalogue: testCatalogue });

    assert.match(
        read(root, 'AGENTS.md'),
        /Optional patterns adopted in this repo: none\./,
    );
});

test('unknown patterns and missing variants fail the sync and the check', () => {
    const root = makeRepo({
        uiPreset: 'Teal',
        patterns: ['sidebar-search', 'grouped-tabs', 'command-palette:big'],
    });
    const errors = syncStandards(root, {
        isCheck: true,
        catalogue: testCatalogue,
    });

    assert.equal(errors.length, 3);
    assert.match(errors[0], /"sidebar-search" is not an optional pattern/);
    assert.match(errors[1], /"grouped-tabs" needs one of its variants/);
    assert.match(errors[2], /"command-palette" has no variants/);
    assert.throws(
        () => syncStandards(root, { isCheck: false, catalogue: testCatalogue }),
        /is not an optional pattern/,
    );
});

test('the agent files include the graphify core rules', () => {
    const root = makeRepo({});

    syncStandards(root, { isCheck: false });

    const agents = read(root, 'AGENTS.md');

    assert.match(agents, /^## graphify$/m);
    assert.match(agents, /graphify query/);
    assert.match(agents, /graphify update \./);
    assert.match(agents, /AST-only, no API cost/);
    assert.match(agents, /`graphify-out\/` is local and never committed/);
    assert.match(agents, /graphify hook install/);
    assert.match(
        agents,
        /merge-driver line that command writes to `\.gitattributes` must not be committed/,
    );
    assert.ok(fs.existsSync(path.join(root, '.qiick/standards/graphify.md')));
    assert.deepEqual(syncStandards(root, { isCheck: true }), []);
});

test('a repo without graphify-out/ in .gitignore fails the check', () => {
    const root = makeRepo({}, { '.gitignore': 'node_modules/\n' });

    spawnSync('git', ['init', '-q'], { cwd: root });
    syncStandards(root, { isCheck: false });

    const errors = syncStandards(root, { isCheck: true });

    assert.equal(errors.length, 1);
    assert.match(errors[0], /\.gitignore must ignore graphify-out\//);
});

test('a tracked graphify-out/ path fails the check', () => {
    const root = makeRepo(
        {},
        {
            '.gitignore': '/graphify-out/\n',
            'graphify-out/graph.json': '{}\n',
        },
    );

    spawnSync('git', ['init', '-q'], { cwd: root });
    // Force-add despite gitignore: simulates a committed graph.
    spawnSync('git', ['add', '-f', 'graphify-out/graph.json'], { cwd: root });
    syncStandards(root, { isCheck: false });

    const errors = syncStandards(root, { isCheck: true });

    assert.equal(errors.length, 1);
    assert.match(errors[0], /tracked graphify-out path/);
});

test('a committed merge=graphify line in .gitattributes fails the check', () => {
    const root = makeRepo(
        {},
        {
            '.gitignore': '/graphify-out/\n',
            '.gitattributes': 'graphify-out/** merge=graphify\n',
        },
    );

    spawnSync('git', ['init', '-q'], { cwd: root });
    syncStandards(root, { isCheck: false });

    const errors = syncStandards(root, { isCheck: true });

    assert.equal(errors.length, 1);
    assert.match(errors[0], /\.gitattributes must not contain merge=graphify/);
});

test('a package without opt-in is not required to consume the shared matrix', () => {
    const root = makeRepo(
        { ref: 'develop', php: true },
        {
            '.github/workflows/ci.yml': `
name: CI
jobs:
  tests:
    strategy:
      matrix:
        php: ['8.3']
`,
        },
    );

    syncStandards(root, { isCheck: false });

    const errors = syncStandards(root, { isCheck: true }).filter((message) =>
        message.startsWith('package matrix:'),
    );

    assert.deepEqual(errors, []);
});

test('a package:true repo without the shared matrix fails the check', () => {
    const root = makeRepo(
        { ref: 'develop', php: true, package: true },
        {
            '.github/workflows/ci.yml': `
name: CI
jobs:
  tests:
    strategy:
      matrix:
        php: ['8.3']
`,
        },
    );

    syncStandards(root, { isCheck: false });

    const errors = syncStandards(root, { isCheck: true }).filter((message) =>
        message.startsWith('package matrix:'),
    );

    assert.ok(errors.length >= 1);
    assert.match(errors.join('\n'), /package-matrix\.yml/);
});

test('a package:true repo that consumes the shared matrix passes that check', () => {
    const root = makeRepo(
        { ref: 'develop', php: true, package: true },
        {
            '.github/workflows/ci.yml': `
jobs:
  package-matrix:
    uses: qiick-io/app-ui/.github/workflows/package-matrix.yml@v0.13.0
  tests:
    needs: package-matrix
    strategy:
      matrix: \${{ fromJSON(needs.package-matrix.outputs.matrix) }}
  databases:
    needs: package-matrix
    strategy:
      matrix:
        database: \${{ fromJSON(needs.package-matrix.outputs.databases) }}
`,
        },
    );

    syncStandards(root, { isCheck: false });

    const errors = syncStandards(root, { isCheck: true }).filter((message) =>
        message.startsWith('package matrix:'),
    );

    assert.deepEqual(errors, []);
});

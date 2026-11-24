import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
    findConventionViolations,
    findErrorCodeRegistryErrors,
    generatedIndexNames,
    readErrorCodeRegistry,
} from '../standards/scripts/check-conventions.mjs';

/**
 * A temporary repo: composer.json named after the package plus the given files.
 * @param {Record<string, string>} files - relative path => content
 * @param {string} [composerName]
 */
function makeRepo(files, composerName = 'qiick/laravel-demo') {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qiick-conventions-'));

    fs.writeFileSync(
        path.join(root, 'composer.json'),
        JSON.stringify({ name: composerName }),
    );

    for (const [relativePath, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(root, relativePath)), {
            recursive: true,
        });
        fs.writeFileSync(path.join(root, relativePath), content);
    }

    return root;
}

/** A package that follows every convention the checks read. */
const conformingPackage = {
    'config/demo.php':
        "<?php return ['enabled' => env('DEMO_ENABLED', true), 'locale' => env('APP_FALLBACK_LOCALE')];",
    'tests/DisabledTest.php': "<?php config(['demo.enabled' => false]);",
    'src/Console/CheckCommand.php':
        "<?php final class CheckCommand { protected $signature = 'demo:check'; }",
    'src/Console/PruneTokensCommand.php': `<?php
final class PruneTokensCommand {
    protected $signature = 'demo:prune-tokens {--dry-run : Count only}';
    public function handle() { Token::query()->where('expires_at', '<', now('UTC'))->chunkById(500, fn ($tokens) => null); }
}`,
    'src/DemoServiceProvider.php': `<?php
final class DemoServiceProvider {
    public function boot() {
        $this->callAfterResolving(Schedule::class, fn ($schedule) => $schedule->command('demo:prune-tokens')->daily()->onOneServer());
        Log::info('Token pruned', ['request_id' => $id, 'public_id' => $token->public_id]);
    }
}`,
    'src/Events/TokenPrunedEvent.php': '<?php final class TokenPrunedEvent {}',
    'src/Contracts/TokenStore.php': '<?php interface TokenStore {}',
    'src/Testing/InMemoryTokenStore.php':
        '<?php final class InMemoryTokenStore { private static $tokens = []; }',
    'docs/public-api.md':
        '# Public API\n\n## Deprecation policy\n\nRemoval in majors only.\n',
    'tests/Arch/PublicApiTest.php':
        "<?php file_get_contents(__DIR__.'/../../docs/public-api.md');",
    'docs/security-checklist.md':
        '| # | Property | Covering test | Status |\n| --- | --- | --- | --- |\n',
    'docs/decisions/2026-11-24-token-lifetime.md':
        '# 2026-11-24: Token lifetime\n\nWhy.\n',
    'CHANGELOG.md':
        '# Changelog\n\n## [Unreleased]\n\n## [1.0.0] - 2026-11-24\n\n[1.0.0]: https://github.com/qiick-io/laravel-demo/compare/v0.9.0...v1.0.0\n',
    'UPGRADING.md': '# Upgrading\n\n## From 0.9.0 to 1.0.0\n',
    'composer.json': JSON.stringify({
        name: 'qiick/laravel-demo',
        require: { 'qiick/laravel-outbound': '^1.0' },
    }),
    '.github/workflows/ci.yml':
        'jobs:\n  test:\n    steps:\n      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2\n      - uses: ./.github/actions/setup\n',
    'database/migrations/2026_11_24_000000_create_demo_tokens_table.php': `<?php
Schema::create('demo_tokens', function (Blueprint $table) {
    $table->id();
    $table->uuid('public_id')->unique();
    $table->uuid('organisation_id')->nullable()->index();
    $table->json('metadata')->nullable();
    $table->dateTime('expires_at')->index();
    $table->timestamp('revoked_at')->nullable();
});`,
};

const adopted = { package: true, conventions: {} };

/**
 * The convention ids a repo breaks.
 * @param {string} root
 * @param {object} [config]
 */
function brokenIds(root, config = adopted) {
    return [
        ...new Set(
            findConventionViolations(root, config, {
                today: '2026-11-24',
            }).map((error) => error.match(/^conventions:? (F\d+)/)?.[1]),
        ),
    ];
}

test('a repo without a conventions object is not checked', () => {
    const root = makeRepo({});

    assert.deepEqual(
        findConventionViolations(
            root,
            { package: true },
            { today: '2026-11-24' },
        ),
        [],
    );
});

test('a conforming package passes every check', () => {
    assert.deepEqual(
        findConventionViolations(makeRepo(conformingPackage), adopted, {
            today: '2026-11-24',
        }),
        [],
    );
});

test('each broken convention fails its own check', () => {
    /** @type {[string, Record<string, string>][]} */
    const cases = [
        ['F1', { 'config/demo.php': undefined }],
        ['F2', { 'src/Console/CheckCommand.php': '<?php' }],
        ['F3', { 'tests/DisabledTest.php': '<?php' }],
        [
            'F4',
            {
                'src/Cache.php':
                    '<?php final class Cache { private static array $entries = []; }',
            },
        ],
        [
            'F5',
            {
                'src/Events/TokenPruned.php':
                    '<?php final class TokenPruned {}',
            },
        ],
        [
            'F6',
            {
                'src/Console/ListCommand.php':
                    "<?php final class ListCommand { protected $signature = 'demo:tokens:list'; }",
            },
        ],
        [
            'F7',
            {
                'config/demo.php':
                    "<?php return ['enabled' => env('WEBHOOK_ENABLED', true)];",
            },
        ],
        [
            'F8',
            {
                'database/migrations/2026_11_24_000001_create_demo_links_table.php': `<?php
Schema::create('demo_links', function (Blueprint $table) {
    $table->foreignId('organisation_id');
    $table->timestamp('expires_at');
});`,
            },
        ],
        [
            'F9',
            {
                'src/Console/PruneTokensCommand.php': `<?php
final class PruneTokensCommand {
    protected $signature = 'demo:prune-tokens {--dry-run}';
    public function handle() { Token::query()->delete(); }
}`,
            },
        ],
        [
            'F10',
            {
                'src/Mailer.php':
                    "<?php Log::warning('Bounce', ['email' => $address, 'orgId' => $id]);",
            },
        ],
        [
            'F11',
            {
                'docs/error-codes.md':
                    '| Code | Description |\n| --- | --- |\n| `demo_exploded` | Not registered. |\n',
            },
        ],
        [
            'F14',
            {
                'src/FakeTokenStore.php': '<?php final class FakeTokenStore {}',
            },
        ],
        [
            'F12',
            {
                'docs/decisions/2026-11-24-token-lifetime.md':
                    '# Token lifetime\n',
            },
        ],
        [
            'F13',
            {
                'composer.json': JSON.stringify({
                    name: 'qiick/laravel-demo',
                    require: { 'qiick/laravel-outbound': '^0.1' },
                }),
            },
        ],
        [
            'F15',
            {
                '.github/workflows/ci.yml':
                    'jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n',
            },
        ],
    ];

    for (const [conventionId, changes] of cases) {
        const files = { ...conformingPackage, ...changes };

        for (const [relativePath, content] of Object.entries(changes)) {
            if (content === undefined) {
                delete files[relativePath];
            }
        }

        assert.deepEqual(
            brokenIds(makeRepo(files)),
            [conventionId],
            conventionId,
        );
    }
});

test('a deleting command without --dry-run breaks F6', () => {
    const root = makeRepo({
        ...conformingPackage,
        'src/Console/PurgeCommand.php':
            "<?php final class PurgeCommand { protected $signature = 'demo:purge-cache'; public function handle() { Cache::flush(); } }",
    });
    const errors = findConventionViolations(root, adopted, {
        today: '2026-11-24',
    });

    assert.ok(
        errors.some((error) =>
            /F6.*deletes data without a `--dry-run`/.test(error),
        ),
    );
});

test('apps are checked under app/, with their schedule in routes/console.php', () => {
    const root = makeRepo(
        {
            'app/Console/Commands/PruneReportsCommand.php': `<?php
final class PruneReportsCommand {
    protected $signature = 'excubia:prune-reports {--dry-run}';
    public function handle() { Report::query()->limit(1000)->delete(); }
}`,
            'routes/console.php':
                "<?php Schedule::command('excubia:prune-reports')->daily();",
            'app/Console/Commands/InstallCommand.php':
                "<?php final class InstallCommand { protected $signature = 'excubia:install {--force}'; }",
            'app/Console/Commands/UpgradeCommand.php':
                "<?php #[Signature('excubia:upgrade')] final class UpgradeCommand {}",
            'docs/beta-readiness.md': '# Beta readiness\n',
            '.env.example': 'DB_CONNECTION=sqlite\n',
            'phpunit.xml': '<env name="DB_DATABASE" value=":memory:"/>',
        },
        'qiick/excubia-app',
    );

    assert.deepEqual(brokenIds(root, { app: true, conventions: {} }), ['F9']);
});

test('a divergence skips its check, and fails when stale, expired or incomplete', () => {
    const root = makeRepo({
        ...conformingPackage,
        'src/Events/TokenPruned.php': '<?php final class TokenPruned {}',
    });
    const divergence = {
        reason: 'Design names until 2.0',
        decision: 'knowledge/decisions/2026-11-24-fleet-conventions',
        review_by: '2027-05-01',
    };
    const withDivergence = (value) => ({
        package: true,
        conventions: { divergences: { F5: value } },
    });

    assert.deepEqual(brokenIds(root, withDivergence(divergence)), []);
    assert.deepEqual(
        brokenIds(
            root,
            withDivergence({ ...divergence, review_by: '2026-01-01' }),
        ),
        [undefined],
    );
    assert.deepEqual(
        brokenIds(root, withDivergence({ reason: 'No decision' })),
        [undefined],
    );
    assert.match(
        findConventionViolations(
            makeRepo(conformingPackage),
            withDivergence(divergence),
            { today: '2026-11-24' },
        ).join('\n'),
        /F5 .* passes; remove its divergence/,
    );
});

test('generated index names are computed from literal table names', () => {
    assert.deepEqual(
        generatedIndexNames(`Schema::create('links', function ($table) {
    $table->uuid('public_id')->unique();
    $table->index(['organisation_id', 'created_at']);
    $table->unique(['a', 'b'], 'links_pair_unique');
});`),
        ['links_public_id_unique', 'links_organisation_id_created_at_index'],
    );
});

test('the fleet error code registry has one entry per code', () => {
    const registry = readErrorCodeRegistry();

    assert.deepEqual(findErrorCodeRegistryErrors(registry), []);
    assert.deepEqual(
        findErrorCodeRegistryErrors({
            sharedOwners: [],
            codes: [
                { code: 'gone', owner: 'a', description: 'One.' },
                { code: 'gone', owner: 'b', description: 'Two.' },
                {
                    code: 'Bad-Code',
                    owner: 'b',
                    description: 'Three.',
                    replacedBy: 'missing',
                },
            ],
        }).length,
        3,
    );
});

test('F18 checks the product structure', () => {
    const root = makeRepo(
        {
            '.env.example':
                'DB_CONNECTION=mysql\nDB_DATABASE=excubia_app_beta3\n',
            'phpunit.xml': '<phpunit />',
        },
        'qiick/excubia-app',
    );
    const errors = findConventionViolations(
        root,
        { app: true, conventions: {} },
        { today: '2026-11-24' },
    ).join('\n');

    assert.match(errors, /docs\/beta-readiness\.md is missing/);
    assert.match(errors, /no `excubia:install` command/);
    assert.match(errors, /`excubia_app`, the app's one database/);
    assert.match(errors, /phpunit\.xml does not pin DB_DATABASE/);
});

test('F13 lets a pre-release depend on a pre-release, never a stable release', () => {
    const repoWith = (version, constraint) =>
        makeRepo({
            ...conformingPackage,
            'CHANGELOG.md': `## [Unreleased]\n\n## [${version}] - 2026-11-24\n\n[${version}]: https://example.test/compare\n`,
            'UPGRADING.md': `## ${version}\n`,
            'composer.json': JSON.stringify({
                name: 'qiick/laravel-demo',
                require: { 'qiick/laravel-oidc': constraint },
            }),
        });

    assert.deepEqual(brokenIds(repoWith('1.0.0-beta.2', '^1.0@beta')), []);
    assert.deepEqual(brokenIds(repoWith('1.5.1', '^1.0@beta')), ['F13']);
    assert.deepEqual(brokenIds(repoWith('0.4.0', '^0.1')), []);
});

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

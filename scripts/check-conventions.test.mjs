import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
    findConventionViolations,
    findErrorCodeRegistryErrors,
    findExpandContractViolations,
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
        'jobs:\n  test:\n    steps:\n      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2\n      - uses: ./.github/actions/setup\n      - run: composer audit\n',
    '.github/dependabot.yml':
        'version: 2\nupdates:\n  - package-ecosystem: composer\n    directory: /\n  - package-ecosystem: github-actions\n    directory: /\n',
    'tests/Pest.php':
        '<?php\nbeforeEach(function () {\n    Http::preventStrayRequests();\n    Process::preventStrayProcesses();\n});\n',
    '.github/workflows/release.yml':
        "on:\n  push:\n    tags: ['v*']\njobs:\n  signed-tag:\n    uses: qiick-io/app-ui/.github/workflows/signed-tag.yml@11bd71901bbe5b1630ceea73d27597364c9af683 # v0.14.0\n",
    'SECURITY.md':
        '# Security policy\n\n## Supported versions\n\n1.x\n\n## Reporting a vulnerability\n\nUse GitHub private vulnerability reporting.\n',
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
const asvsRegisterTemplate = fs.readFileSync(
    new URL('../standards/templates/asvs.md', import.meta.url),
    'utf8',
);
const evidencedAsvsRegister = asvsRegisterTemplate.replaceAll(
    /^\| (v5\.0\.0-\d+\.\d+\.\d+) +\| *\| *\| *\|$/gm,
    '| $1 | Partial | `SecurityTest.php` covers this path. | |',
);

test('F34 requires a complete, evidenced ASVS Level 2 register for products', () => {
    const config = { app: true, conventions: {} };
    const root = makeRepo({});
    const registerPath = path.join(root, 'docs/asvs.md');
    const errors = () =>
        findConventionViolations(root, config).filter((error) =>
            error.startsWith('conventions F34 '),
        );
    assert.match(errors()[0], /docs\/asvs\.md is missing/);

    fs.mkdirSync(path.dirname(registerPath));
    fs.writeFileSync(registerPath, asvsRegisterTemplate);
    assert.ok(
        errors().some((error) =>
            /v5\.0\.0-1\.1\.1 needs a valid status and evidence/.test(error),
        ),
    );

    fs.writeFileSync(registerPath, evidencedAsvsRegister);
    assert.deepEqual(errors(), []);

    const gapRegister = (evidence) =>
        evidencedAsvsRegister.replace(
            '| v5.0.0-1.1.1 | Partial | `SecurityTest.php` covers this path. |',
            `| v5.0.0-1.1.1 | Gap | ${evidence} |`,
        );
    fs.writeFileSync(registerPath, gapRegister('Missing test coverage.'));
    assert.match(errors()[0], /v5\.0\.0-1\.1\.1 must link its \[asvs\] issue/);

    for (const reference of [
        '#123',
        '[Follow-up](https://github.com/qiick-io/demo-app/issues/123)',
    ]) {
        fs.writeFileSync(
            registerPath,
            gapRegister(`Missing test coverage. ${reference}`),
        );
        assert.deepEqual(errors(), []);
    }

    fs.writeFileSync(
        registerPath,
        evidencedAsvsRegister
            .replace(/^\| v5\.0\.0-1\.1\.1 .*\n/m, '')
            .replace('| v5.0.0-1.1.2 | Partial |', '| v5.0.0-1.1.2 | Covered |')
            .replace(
                '| v5.0.0-1.2.1 | Partial | `SecurityTest.php` covers this path. |',
                '| v5.0.0-1.2.1 | Gap | — |',
            )
            .replace('| v5.0.0-1.2.2 |', '| v5.0.0-1.2.1 |'),
    );

    assert.match(
        errors().join('\n'),
        /is missing 2 requirements: v5\.0\.0-1\.1\.1, v5\.0\.0-1\.2\.2/,
    );
    assert.match(
        errors().join('\n'),
        /v5\.0\.0-1\.1\.2 needs a valid status and evidence/,
    );
    assert.match(
        errors().join('\n'),
        /v5\.0\.0-1\.2\.1 needs a valid status and evidence/,
    );
    assert.match(
        errors().join('\n'),
        /v5\.0\.0-1\.2\.1 is listed more than once/,
    );
    assert.ok(
        !findConventionViolations(root, adopted).some((error) =>
            error.startsWith('conventions F34 '),
        ),
    );
});

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
                    'jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n      - run: composer audit\n',
            },
        ],
        ['F24', { '.github/dependabot.yml': undefined }],
        ['F25', { 'tests/Pest.php': undefined }],
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
                "<?php Schedule::command('excubia:prune-reports')->daily(); Schedule::command('excubia:check')->daily()->onOneServer();",
            'app/Console/Commands/InstallCommand.php':
                "<?php final class InstallCommand { protected $signature = 'excubia:install {--force}'; }",
            'app/Console/Commands/UpgradeCommand.php':
                "<?php #[Signature('excubia:upgrade')] final class UpgradeCommand {}",
            'docs/beta-readiness.md': '# Beta readiness\n',
            '.env.example': 'DB_CONNECTION=sqlite\n',
            'phpunit.xml': '<env name="DB_DATABASE" value=":memory:"/>',
            'SECURITY.md': conformingPackage['SECURITY.md'],
            '.github/workflows/release.yml':
                conformingPackage['.github/workflows/release.yml'],
            'docs/runbooks/secrets.md': '# Secrets\n\n## After a leak\n',
            'docs/runbooks/backup.md':
                '# Backup\n\n## What is backed up\n\n## Restore\n\n## Restore drills\n',
            '.github/workflows/ci.yml':
                conformingPackage['.github/workflows/ci.yml'],
            '.github/dependabot.yml':
                conformingPackage['.github/dependabot.yml'],
            'tests/Pest.php': conformingPackage['tests/Pest.php'],
            'composer.lock': '{}',
            'app/Providers/AppServiceProvider.php': `<?php
final class AppServiceProvider {
    public function boot(): void {
        Model::shouldBeStrict(! app()->isProduction());
        DB::prohibitDestructiveCommands(app()->isProduction());
        URL::forceHttps(app()->isProduction());
        Date::use(CarbonImmutable::class);
        Password::defaults(fn () => Password::min(12));
    }
}`,
            'excubia.json': '{ "checks": {} }',
            'composer.json': JSON.stringify({
                name: 'qiick/excubia-app',
                require: { 'qiick/excubia-core': '^1.0' },
            }),
            'routes/health.php':
                "<?php Route::get('health/live', LiveController::class); Route::get('health/ready', ReadyController::class);",
            'docs/privacy.md':
                '# Privacy\n\n## Personal data\n\n## Processors and outbound destinations\n\n## Export and erasure\n\n## Telemetry\n',
            'docs/runbooks/deploy.md': '# Deploy\n\n## Rollback\n',
            'docs/runbooks/incident.md':
                '# Incident\n\n## First steps\n\n## After the incident\n',
            'docs/asvs.md': evidencedAsvsRegister,
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

test('F19 needs a security policy that sends reporters to private reporting', () => {
    const withoutPolicy = { ...conformingPackage };

    delete withoutPolicy['SECURITY.md'];
    assert.deepEqual(brokenIds(makeRepo(withoutPolicy)), ['F19']);
    assert.deepEqual(
        brokenIds(
            makeRepo({
                ...withoutPolicy,
                '.github/SECURITY.md':
                    '# Security\n\n## Supported versions\n\n## Reporting a vulnerability\n\nOpen an issue.\n',
            }),
        ),
        ['F19'],
    );
});

test('F23 needs the signed tag check on tag pushes', () => {
    const withoutSignedTag = { ...conformingPackage };

    delete withoutSignedTag['.github/workflows/release.yml'];
    assert.deepEqual(brokenIds(makeRepo(withoutSignedTag)), ['F23']);
});

test('F20 and F22: the secrets and backup runbooks of a product', () => {
    const product = {
        '.env.example':
            'APP_KEY=\nDB_PASSWORD=\nAWS_ACCESS_KEY_ID=\nMAIL_FROM_ADDRESS=hello@example.com\n',
        'CHANGELOG.md': '# Changelog\n\n## [1.0.0] - 2026-06-01\n',
        'docs/runbooks/secrets.md':
            '# Secrets\n\n| `APP_KEY` | … |\n| `DB_PASSWORD` | … |\n',
        'docs/runbooks/backup.md':
            '# Backup\n\n## What is backed up\n\n## Restore\n\n## Restore drills\n\n| Date | Version | Result | Time to restore |\n| ---- | ------- | ------ | --------------- |\n| 2026-06-01 | 1.0.0 | ok | 20 min |\n| 2026-09-15 | 1.2.0 | ok | 15 min |\n',
    };
    const errorsOn = (today, files = product) =>
        findConventionViolations(
            makeRepo(files, 'qiick/demo-app'),
            { app: true, conventions: {} },
            { today },
        )
            .filter((error) => /conventions F2[02] /.test(error))
            .join('\n');

    const errors = errorsOn('2026-11-24');

    assert.match(errors, /does not list AWS_ACCESS_KEY_ID/);
    assert.doesNotMatch(errors, /MAIL_FROM_ADDRESS|DB_PASSWORD/);
    assert.match(errors, /no "After a leak" section/);
    assert.doesNotMatch(errors, /F22/);
    assert.match(
        errorsOn('2026-12-31'),
        /newest restore drill \(2026-09-15\) is more than 92 days old/,
    );
    assert.doesNotMatch(
        errorsOn('2026-12-31', {
            ...product,
            'CHANGELOG.md': '# Changelog\n\n## [1.0.0-beta.2] - 2026-06-01\n',
        }),
        /F22/,
    );
});

test('F21 accepts a contract only after the release that stopped using the column', () => {
    const migration = (upBody) => ({
        path: 'database/migrations/2027_01_01_000000_drop_legacy.php',
        text: `<?php\nreturn new class {\n    public function up(): void\n    {\n${upBody}\n    }\n    public function down(): void\n    {\n        Schema::dropIfExists('legacy');\n    }\n};\n`,
    });
    const errorsFor = (upBody) =>
        findExpandContractViolations(
            [migration(upBody)],
            ['v1.0.0', 'v1.1.0-beta.1', 'v1.1.0'],
            'v1.1.0',
        );

    assert.deepEqual(
        errorsFor(
            "        Schema::create('demo', fn ($table) => $table->id());",
        ),
        [],
    );
    assert.equal(
        errorsFor("        Schema::dropIfExists('legacy');").length,
        1,
    );
    assert.equal(
        errorsFor("        // Schema::drop('legacy') in 2.0\n").length,
        0,
    );
    assert.deepEqual(
        errorsFor(
            "        // contract: legacy unused since v1.0.0\n        Schema::drop('legacy');",
        ),
        [],
    );
    assert.match(
        errorsFor(
            "        // contract: legacy unused since v1.2.0\n        Schema::drop('legacy');",
        ).join(''),
        /names v1\.2\.0, which is not a released tag up to v1\.1\.0/,
    );
    assert.deepEqual(
        errorsFor(
            "        // expand-safe: widens name to 255 characters\n        Schema::table('users', fn ($table) => $table->string('name', 255)->change());",
        ),
        [],
    );
});

test('F24-F30: what a product without them is told to fix', () => {
    const root = makeRepo(
        {
            'package.json': '{}',
            'routes/api.php':
                "<?php Route::get('projects', ProjectController::class);",
            '.github/workflows/release.yml':
                'jobs:\n  image:\n    steps:\n      - uses: docker/build-push-action@0000000000000000000000000000000000000000 # v6\n        with:\n          push: true\n',
        },
        'qiick/demo-app',
    );
    const errors = findConventionViolations(
        root,
        { app: true, uiPreset: 'Teal', conventions: {} },
        { today: '2026-11-25' },
    )
        .filter((error) => /^conventions F(?:2[4-9]|30) /.test(error))
        .join('\n');

    for (const expected of [
        /F24 .*no workflow runs `composer audit`/,
        /F24 .*`npm audit/,
        /F24 .*dependabot\.yml is missing/,
        /F24 .*composer\.lock is not committed/,
        /F24 .*without `actions\/attest-build-provenance`/,
        /F25 .*never calls URL::forceHttps/,
        /F25 .*Process::preventStrayProcesses\(\)/,
        /F26 .*does not require qiick\/excubia-core/,
        /F26 .*no route serves \/health\/ready/,
        /F27 .*resources\/openapi/,
        /F27 .*no `v<N>` prefix/,
        /F28 .*ui-quality\.yml/,
        /F28 .*tests\/Browser/,
        /F29 .*docs\/privacy\.md is missing/,
        /F30 .*docs\/runbooks\/deploy\.md is missing/,
    ]) {
        assert.match(errors, expected);
    }
});

test('F8 asks a package with foreign keys for a test of their indexes', () => {
    const withForeignKey = {
        ...conformingPackage,
        'database/migrations/2026_11_25_000000_create_demo_grants_table.php':
            "<?php\nSchema::create('demo_grants', function (Blueprint $table) {\n    $table->id();\n    $table->foreignId('demo_token_id')->index()->constrained('demo_tokens');\n});",
    };

    assert.match(
        findConventionViolations(makeRepo(withForeignKey), adopted, {
            today: '2026-11-25',
        }).join('\n'),
        /F8 .*no test calls SchemaInspector::foreignKeysWithoutIndex\(\)/,
    );
    assert.deepEqual(
        brokenIds(
            makeRepo({
                ...withForeignKey,
                'tests/Feature/ForeignKeyIndexTest.php':
                    '<?php it("indexes", fn () => expect((new SchemaInspector())->foreignKeysWithoutIndex())->toBe([]));',
            }),
        ),
        [],
    );
});

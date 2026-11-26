<?php

declare(strict_types=1);

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Qiick\ConformanceHarness\GreenSchema;
use Qiick\Standards\Conformance\Support\ConformanceBehaviourProbe;
use Qiick\Standards\Conformance\Support\ConformanceHooks;
use Qiick\Standards\Conformance\Support\ConformanceRunner;
use Qiick\Standards\Conformance\Support\SchemaInspector;

/**
 * @return array<string, array{id: string, tag: string, description: string, decision: string, engines?: list<string>}>
 */
function catalogById(): array
{
    static $indexed = null;

    if ($indexed !== null) {
        return $indexed;
    }

    /** @var list<array{id: string, tag: string, description: string, decision: string, engines?: list<string>}> $catalog */
    $catalog = require dirname(__DIR__, 2).'/conformance/catalog.php';
    $indexed = [];

    foreach ($catalog as $entry) {
        $indexed[$entry['id']] = $entry;
    }

    return $indexed;
}

function harnessBasePath(): string
{
    return dirname(__DIR__);
}

function harnessRunner(): ConformanceRunner
{
    $base = harnessBasePath();

    return new ConformanceRunner(
        $base,
        ConformanceHooks::fromBasePath($base, $base.'/tests/Conformance/hooks.php'),
        new SchemaInspector(),
    );
}

function runCheck(string $id): void
{
    $check = catalogById()[$id] ?? null;

    if ($check === null) {
        throw new RuntimeException("Unknown check id {$id}.");
    }

    harnessRunner()->run($check);
}

/**
 * Schema / config / file checks that the green fixture satisfies without a real HTTP app.
 *
 * @return list<string>
 */
function greenSchemaCheckIds(): array
{
    // C3/C5/C11/C15/C72 need PostgreSQL or MySQL (see engine-dependent probes).
    // C75 is schema/file and runs on every engine when usesLaravelAccess is true.
    return ['C1', 'C2', 'C4', 'C6', 'C9', 'C10', 'C12', 'C14', 'C16', 'C18', 'C26', 'C33', 'C34', 'C35', 'C36', 'C75'];
}

/**
 * Behaviour checks proven GREEN via harness hooks, RED when the hook is missing.
 *
 * @return list<string>
 */
function hookedBehaviourCheckIds(): array
{
    return [
        'C7', 'C8', 'C13', 'C17', 'C19', 'C20', 'C21', 'C22', 'C23', 'C24', 'C25',
        'C27', 'C28', 'C29', 'C30', 'C31', 'C32',
        'C71', 'C73', 'C74', 'C77',
    ];
}

beforeEach(function (): void {
    // Ensure graphify ignore exists for C35 (restore after RED mutations without dropping other ignores).
    file_put_contents(
        harnessBasePath().'/.gitignore',
        "/vendor/\n/graphify-out/\ncomposer.lock\n.phpunit.result.cache\n.phpunit.cache/\n/database/migrations/\n/app/\n",
    );
});

describe('GREEN fixture', function (): void {
    beforeEach(function (): void {
        $this->migrateGreen();
    });

    foreach (greenSchemaCheckIds() as $checkId) {
        it("{$checkId} passes on the correct schema/config", function () use ($checkId): void {
            runCheck($checkId);
            expect(true)->toBeTrue();
        });
    }

    foreach (hookedBehaviourCheckIds() as $checkId) {
        it("{$checkId} passes when the product hook is provided", function () use ($checkId): void {
            runCheck($checkId);
            expect(true)->toBeTrue();
        });
    }

    it('catalog covers every id with a decision link', function (): void {
        $catalog = catalogById();
        expect($catalog)->not->toBeEmpty();

        foreach ($catalog as $id => $check) {
            expect($check['decision'])->toStartWith('knowledge/decisions/');
            expect($check['tag'])->toBeIn(['schema', 'behaviour', 'config', 'file']);
            expect($check['description'])->not->toBeEmpty();
            expect($id)->toMatch('/^C\d+$/');
        }
    });
});

describe('RED fixtures', function (): void {
    it('C77 rejects an unproven or unsafe super-admin policy decision', function (array $callables, string $expectedError): void {
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], $callables),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run(catalogById()['C77']))->toThrow(RuntimeException::class, $expectedError);
    })->with([
        'missing hook' => [[], 'Conformance hook "policySuperAdminDecisions" is required'],
        'no web grant' => [
            ['policySuperAdminDecisions' => static fn (): array => ['web' => false, 'api' => false]],
            'must report a super-admin web actor allowed',
        ],
        'missing API verdict' => [
            ['policySuperAdminDecisions' => static fn (): array => ['web' => true]],
            'did not report a denial',
        ],
        'API actor inherits super-admin' => [
            ['policySuperAdminDecisions' => static fn (): array => ['web' => true, 'api' => true]],
            'granted super-admin authority to an API actor',
        ],
    ]);

    it('C77 is inapplicable to products without laravel-access', function (): void {
        $hooks = new ConformanceHooks([], [
            'policySuperAdminDecisions' => static fn (): never => throw new RuntimeException('C77 ran for a product without laravel-access.'),
        ]);

        $runner = new ConformanceRunner(harnessBasePath(), $hooks, new SchemaInspector());

        expect(fn () => $runner->run(catalogById()['C77']))->not->toThrow(RuntimeException::class);
    });

    it('C1 goes red when public_id is missing', function (): void {
        GreenSchema::migrate();
        // Dependent FKs block DROP users on PostgreSQL; remove them first.
        Schema::dropIfExists('api_keys');
        Schema::dropIfExists('principals');
        Schema::dropIfExists('user_identities');
        Schema::drop('users');
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('username')->nullable()->unique();
            $table->string('email')->unique();
            $table->string('locale')->default('en');
            $table->string('timezone')->default('UTC');
            $table->string('password')->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        expect(fn () => runCheck('C1'))->toThrow(RuntimeException::class, 'public_id');
    });

    it('C2 goes red when users.organisation_id exists', function (): void {
        GreenSchema::migrate();
        Schema::table('users', function (Blueprint $table): void {
            $table->uuid('organisation_id')->nullable();
        });

        expect(fn () => runCheck('C2'))->toThrow(RuntimeException::class, 'organisation_id');
    });

    it('C2 goes red when principals.organisation_id is nullable with organisations', function (): void {
        GreenSchema::migrate();
        Schema::drop('api_keys');
        Schema::drop('principals');
        Schema::create('principals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->foreignId('user_id')->nullable()->unique();
            $table->uuid('organisation_id')->nullable();
            $table->string('name')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();
        });
        Schema::create('api_keys', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('key_prefix', 32);
            $table->string('key_hash', 64)->unique();
            $table->uuid('owner_principal_id');
            $table->foreignId('created_by')->nullable();
            $table->json('scopes');
            $table->json('ip_allowlist')->nullable();
            $table->unsignedInteger('rate_limit_per_minute')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->dateTime('previous_key_valid_until')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->string('last_used_ip')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });

        expect(fn () => runCheck('C2'))
            ->toThrow(RuntimeException::class, 'principals.organisation_id must be NOT NULL');
    });

    it('C2 accepts principals as the membership table', function (): void {
        GreenSchema::migrate();
        Schema::drop('organisation_user');
        Schema::table('principals', function (Blueprint $table): void {
            $table->unique(['organisation_id', 'user_id']);
        });

        $base = harnessBasePath();
        $hooks = new ConformanceHooks(
            [
                'hasOrganisations' => true,
                'hasPrincipals' => true,
                'membershipTable' => 'principals',
                'organisationTable' => 'organisations',
            ],
            [],
        );
        $runner = new ConformanceRunner($base, $hooks, new SchemaInspector());

        $runner->run([
            'id' => 'C2',
            'tag' => 'schema',
            'description' => 'c2',
            'decision' => 'knowledge/decisions/2026-11-22-principal-organisation-required-in-multi-tenant-products',
        ]);
        expect(true)->toBeTrue();
    });

    it('C4 goes red when teams are required but config is off', function (): void {
        GreenSchema::migrate();
        config(['permission.teams' => false]);

        expect(fn () => runCheck('C4'))->toThrow(RuntimeException::class, 'permission.teams');
    });

    it('C10 goes red when api_keys.owner_id cascades', function (): void {
        GreenSchema::migrate();
        Schema::table('api_keys', function (Blueprint $table): void {
            $table->foreignId('owner_id')->nullable()->constrained('users')->cascadeOnDelete();
        });

        expect(fn () => runCheck('C10'))
            ->toThrow(RuntimeException::class, 'api_keys.owner_id must not cascade-delete');
    });

    it('C10 goes red when principals.user_id cascades', function (): void {
        GreenSchema::migrate();
        Schema::drop('api_keys');
        Schema::drop('principals');
        Schema::create('principals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->cascadeOnDelete();
            $table->uuid('organisation_id');
            $table->string('name')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();
        });
        Schema::create('api_keys', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('key_prefix', 32);
            $table->string('key_hash', 64)->unique();
            $table->uuid('owner_principal_id');
            $table->foreignId('created_by')->nullable();
            $table->json('scopes');
            $table->json('ip_allowlist')->nullable();
            $table->unsignedInteger('rate_limit_per_minute')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->dateTime('previous_key_valid_until')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->string('last_used_ip')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });

        expect(fn () => runCheck('C10'))
            ->toThrow(RuntimeException::class, 'principals.user_id must not cascade-delete');
    });

    it('C11 goes red when expires_at is a MySQL TIMESTAMP', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            $this->markTestSkipped('TIMESTAMP vs DATETIME is a MySQL semantics check.');
        }

        GreenSchema::migrate();
        Schema::table('api_keys', function (Blueprint $table): void {
            $table->dropColumn('expires_at');
        });
        Schema::table('api_keys', function (Blueprint $table): void {
            $table->timestamp('expires_at')->nullable();
        });

        expect(fn () => runCheck('C11'))->toThrow(RuntimeException::class, 'dateTime');
    });

    it('C11 goes red when previous_key_valid_until is a MySQL TIMESTAMP', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            $this->markTestSkipped('TIMESTAMP vs DATETIME is a MySQL semantics check.');
        }

        GreenSchema::migrate();
        Schema::table('api_keys', function (Blueprint $table): void {
            $table->dropColumn('previous_key_valid_until');
        });
        Schema::table('api_keys', function (Blueprint $table): void {
            $table->timestamp('previous_key_valid_until')->nullable();
        });

        expect(fn () => runCheck('C11'))
            ->toThrow(RuntimeException::class, 'previous_key_valid_until must be dateTime');
    });

    it('C12 goes red when activity morphs are bigint', function (): void {
        GreenSchema::migrate();
        Schema::drop('activity_log');
        Schema::create('activity_log', function (Blueprint $table): void {
            $table->id();
            $table->nullableMorphs('subject');
            $table->nullableMorphs('causer');
            $table->uuid('organisation_id')->nullable();
            $table->timestamps();
        });

        expect(fn () => runCheck('C12'))->toThrow(RuntimeException::class, 'string(64)');
    });

    it('C14 goes red when scope_id is nullable', function (): void {
        GreenSchema::migrate();
        Schema::drop('settings');
        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->string('scope');
            $table->string('scope_id', 36)->nullable();
            $table->string('group');
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();
        });

        expect(fn () => runCheck('C14'))->toThrow(RuntimeException::class, 'NOT NULL');
    });

    it('C16 goes red when notifications is missing', function (): void {
        GreenSchema::migrate();
        Schema::drop('notifications');

        expect(fn () => runCheck('C16'))->toThrow(RuntimeException::class, 'notifications');
    });

    it('C18 goes red when super_admin config is missing', function (): void {
        GreenSchema::migrate();
        config(['super_admin' => null]);

        expect(fn () => runCheck('C18'))->toThrow(RuntimeException::class, 'super_admin');
    });

    it('C26 goes red when OpenAPI is 3.0.x', function (): void {
        GreenSchema::migrate();
        $path = harnessBasePath().'/openapi-bad.yaml';
        file_put_contents($path, "openapi: 3.0.3\ninfo:\n  title: bad\n  version: 0\npaths: {}\n");

        $base = harnessBasePath();
        $hooks = new ConformanceHooks(
            [
                'openApiPath' => 'openapi-bad.yaml',
                'apiPrefix' => 'api/v1',
            ],
            [],
        );
        $runner = new ConformanceRunner($base, $hooks, new SchemaInspector());

        expect(fn () => $runner->run([
            'id' => 'C26',
            'tag' => 'file',
            'description' => 'openapi',
            'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
        ]))->toThrow(RuntimeException::class, '3.1');

        unlink($path);
    });

    it('C26 goes red when a parent path is only a substring of a documented child', function (): void {
        GreenSchema::migrate();
        $path = harnessBasePath().'/openapi-substring.yaml';
        file_put_contents($path, <<<'YAML'
openapi: 3.1.0
info:
  title: substring trap
  version: 0
servers:
  - url: /api/v1
paths:
  /users/{id}:
    get:
      operationId: showUser
YAML);

        Illuminate\Support\Facades\Route::get('api/v1/users', fn () => null)->name('users.index');
        Illuminate\Support\Facades\Route::get('api/v1/users/{id}', fn () => null)->name('users.show');

        $base = harnessBasePath();
        $hooks = new ConformanceHooks(
            [
                'openApiPath' => 'openapi-substring.yaml',
                'apiPrefix' => 'api/v1',
            ],
            [],
        );
        $runner = new ConformanceRunner($base, $hooks, new SchemaInspector());

        expect(fn () => $runner->run([
            'id' => 'C26',
            'tag' => 'file',
            'description' => 'openapi',
            'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
        ]))->toThrow(RuntimeException::class, 'exact path+method');

        unlink($path);
    });

    it('C26 accounts for the OpenAPI servers prefix', function (): void {
        GreenSchema::migrate();
        $path = harnessBasePath().'/openapi-servers.yaml';
        file_put_contents($path, <<<'YAML'
openapi: 3.1.0
info:
  title: servers prefix
  version: 0
servers:
  - url: https://example.test/api/v1
paths:
  /users:
    get:
      operationId: listUsers
YAML);

        Illuminate\Support\Facades\Route::get('api/v1/users', fn () => null)->name('users.index');

        $base = harnessBasePath();
        $hooks = new ConformanceHooks(
            [
                'openApiPath' => 'openapi-servers.yaml',
                'apiPrefix' => 'api/v1',
            ],
            [],
        );
        $runner = new ConformanceRunner($base, $hooks, new SchemaInspector());

        $runner->run([
            'id' => 'C26',
            'tag' => 'file',
            'description' => 'openapi',
            'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
        ]);
        expect(true)->toBeTrue();

        unlink($path);
    });

    it('C29 is skipped when Spatie teams are really off in config', function (): void {
        GreenSchema::migrate();
        config(['permission.teams' => false]);
        $hooks = new ConformanceHooks(
            ['usesSpatieTeams' => false],
            [],
        );
        $runner = new ConformanceRunner(harnessBasePath(), $hooks, new SchemaInspector());

        $runner->run([
            'id' => 'C29',
            'tag' => 'behaviour',
            'description' => 'team switch',
            'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
        ]);
        expect(true)->toBeTrue();
    });

    it('C29 goes red when teams are on in config but usesSpatieTeams is false', function (): void {
        GreenSchema::migrate();
        config([
            'permission.teams' => true,
            'permission.column_names.team_foreign_key' => 'team_id',
        ]);
        $hooks = new ConformanceHooks(
            ['usesSpatieTeams' => false],
            [],
        );
        $runner = new ConformanceRunner(harnessBasePath(), $hooks, new SchemaInspector());

        expect(fn () => $runner->run([
            'id' => 'C29',
            'tag' => 'behaviour',
            'description' => 'team switch',
            'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
        ]))->toThrow(RuntimeException::class, 'usesSpatieTeams is false');
    });

    it('C29 goes red when teams are on with a wrong team_foreign_key', function (): void {
        GreenSchema::migrate();
        config([
            'permission.teams' => true,
            'permission.column_names.team_foreign_key' => 'team_id',
        ]);
        $hooks = new ConformanceHooks(
            ['usesSpatieTeams' => true],
            ['assertTeamSwitch' => static function (): void {}],
        );
        $runner = new ConformanceRunner(harnessBasePath(), $hooks, new SchemaInspector());

        expect(fn () => $runner->run([
            'id' => 'C29',
            'tag' => 'behaviour',
            'description' => 'team switch',
            'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
        ]))->toThrow(RuntimeException::class, 'team_foreign_key must be organisation_id');
    });

    it('C29 goes red when organisation_id column is missing on roles', function (): void {
        GreenSchema::migrate();
        Schema::drop('roles');
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();
        });
        $hooks = new ConformanceHooks(
            ['usesSpatieTeams' => true],
            ['assertTeamSwitch' => static function (): void {}],
        );
        $runner = new ConformanceRunner(harnessBasePath(), $hooks, new SchemaInspector());

        expect(fn () => $runner->run([
            'id' => 'C29',
            'tag' => 'behaviour',
            'description' => 'team switch',
            'decision' => 'knowledge/decisions/2026-11-20-core-hardening',
        ]))->toThrow(RuntimeException::class, 'organisation_id');
    });

    it('C37 goes red when a declared hook is reduced to a no-op', function (): void {
        GreenSchema::migrate();
        $gate = new Qiick\Standards\Conformance\Support\DivergenceGate(
            [
                'C7' => [
                    'reason' => 'temporary skip',
                    'decision' => 'knowledge/decisions/2026-11-19-roles-groups-initial-admin-and-username',
                    'review_by' => '2099-01-01',
                ],
            ],
            array_keys(catalogById()),
            new DateTimeImmutable('2026-11-20'),
        );

        $runner = harnessRunner();
        $stillPassingWhileDiverged = [];

        try {
            $runner->run(catalogById()['C7']);
            $stillPassingWhileDiverged[] = 'C7';
        } catch (Throwable) {
            // Unexpected: empty harness hook should pass.
        }

        expect($stillPassingWhileDiverged)->toContain('C7');
        expect(fn () => $gate->assertNoStaleDeclarations($stillPassingWhileDiverged))
            ->toThrow(RuntimeException::class, 'stale');
    });

    it('isolation keeps a later check runnable after an earlier failure on the same connection', function (): void {
        GreenSchema::migrate();
        $schema = new SchemaInspector();
        $runner = harnessRunner();

        $schema->connection()->beginTransaction();

        try {
            // A statement error aborts PostgreSQL until ROLLBACK TO SAVEPOINT.
            // Avoid DDL here: MySQL implicitly commits and drops savepoints.
            $didFail = false;

            try {
                $schema->isolate(function () use ($schema): void {
                    $schema->statement('SELECT * FROM conformance_missing_table_xyz');
                });
            } catch (Throwable) {
                $didFail = true;
            }

            expect($didFail)->toBeTrue();
            $runner->run(catalogById()['C1']);
            expect(true)->toBeTrue();
        } finally {
            if ($schema->connection()->transactionLevel() > 0) {
                $schema->connection()->rollBack();
            }
        }
    });

    it('C33 goes red when .frozen exists without a stable tag', function (): void {
        GreenSchema::migrate();
        $frozenDir = harnessBasePath().'/database/migrations';
        @mkdir($frozenDir, 0777, true);
        $frozen = $frozenDir.'/.frozen';
        file_put_contents($frozen, "create_users_table.php\n");

        // Harness has no git stable tags; presence of .frozen must fail.
        expect(fn () => runCheck('C33'))->toThrow(RuntimeException::class, '.frozen');

        unlink($frozen);
    });

    it('C34 goes red when an add_ migration exists before stable', function (): void {
        GreenSchema::migrate();
        $dir = harnessBasePath().'/database/migrations';
        @mkdir($dir, 0777, true);
        $file = $dir.'/2026_11_20_000000_add_something_to_users_table.php';
        file_put_contents($file, "<?php\n");

        expect(fn () => runCheck('C34'))->toThrow(RuntimeException::class, 'add_');

        unlink($file);
    });

    it('C35 goes red when graphify-out is not ignored', function (): void {
        GreenSchema::migrate();
        $gitignore = harnessBasePath().'/.gitignore';
        $original = (string) file_get_contents($gitignore);
        file_put_contents($gitignore, "/vendor/\n");

        expect(fn () => runCheck('C35'))->toThrow(RuntimeException::class, 'graphify-out');

        file_put_contents($gitignore, $original);
    });

    it('C36 goes red when permission:setup-teams appears in app code', function (): void {
        GreenSchema::migrate();
        $dir = harnessBasePath().'/app';
        @mkdir($dir, 0777, true);
        $file = $dir.'/BadSetup.php';
        file_put_contents($file, "<?php\n// artisan permission:setup-teams\n");

        expect(fn () => runCheck('C36'))->toThrow(RuntimeException::class, 'permission:setup-teams');

        unlink($file);
        @rmdir($dir);
    });

    it('C7 goes red when the behaviour hook is missing', function (): void {
        GreenSchema::migrate();
        $base = harnessBasePath();
        $runner = new ConformanceRunner(
            $base,
            new ConformanceHooks(['hasUserGroups' => true], []),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run([
            'id' => 'C7',
            'tag' => 'behaviour',
            'description' => 'soft-deleted group',
            'decision' => 'knowledge/decisions/2026-11-19-roles-groups-initial-admin-and-username',
        ]))->toThrow(RuntimeException::class, 'hooks.php');
    });

    it('C71 goes red when permission.events_enabled is false', function (): void {
        GreenSchema::migrate();
        config(['permission.events_enabled' => false]);

        expect(fn () => runCheck('C71'))
            ->toThrow(RuntimeException::class, 'permission.events_enabled must be true');
    });

    it('C71 goes red when register_permission_check_method is still on', function (): void {
        GreenSchema::migrate();
        config(['permission.register_permission_check_method' => true]);

        expect(fn () => runCheck('C71'))
            ->toThrow(RuntimeException::class, 'register_permission_check_method must be false');
    });

    it('C71 goes red when a grant-all Gate::before is registered at runtime', function (): void {
        GreenSchema::migrate();
        config(['permission.register_permission_check_method' => false]);
        Gate::before(static fn (): ?bool => true);

        expect(fn () => runCheck('C71'))
            ->toThrow(RuntimeException::class, 'Gate::before callback granted');
    });

    it('C71 goes red when the resolver-clear hook is missing', function (): void {
        GreenSchema::migrate();
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], []),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run(catalogById()['C71']))
            ->toThrow(RuntimeException::class, 'assertRoleDetachClearsResolver');
    });

    it('C71 goes red when the resolver-clear hook is a no-op', function (): void {
        GreenSchema::migrate();
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], [
                'assertRoleDetachClearsResolver' => static function (): void {},
                'assertApiActorDeniedSuperAdmin' => static function ($probe): void {
                    $probe->pass();
                },
            ]),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run(catalogById()['C71']))
            ->toThrow(RuntimeException::class, 'did not prove the behaviour');
    });

    it('C71 goes red when the API-actor hook is missing', function (): void {
        GreenSchema::migrate();
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], [
                'assertRoleDetachClearsResolver' => static function ($probe): void {
                    $probe->pass();
                },
            ]),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run(catalogById()['C71']))
            ->toThrow(RuntimeException::class, 'assertApiActorDeniedSuperAdmin');
    });

    it('C73 goes red when the expired-membership hook is missing', function (): void {
        GreenSchema::migrate();
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], []),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run(catalogById()['C73']))
            ->toThrow(RuntimeException::class, 'assertExpiredMembershipGrantsNothing');
    });

    it('C73 goes red when the expired-membership hook is a no-op', function (): void {
        GreenSchema::migrate();
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], [
                'assertExpiredMembershipGrantsNothing' => static function (): void {},
            ]),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run(catalogById()['C73']))
            ->toThrow(RuntimeException::class, 'did not prove the behaviour');
    });

    it('C73 stays green when the hook only passes the probe without exercising behaviour (documented limit)', function (): void {
        GreenSchema::migrate();
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], [
                'assertExpiredMembershipGrantsNothing' => static function (?ConformanceBehaviourProbe $probe = null): void {
                    if ($probe instanceof ConformanceBehaviourProbe) {
                        $probe->pass();

                        return;
                    }

                    throw new RuntimeException('real path never runs');
                },
            ]),
            new SchemaInspector(),
        );

        $runner->run(catalogById()['C73']);
        expect(true)->toBeTrue();
    });

    it('C74 goes red when the access-activity UUID hook is missing', function (): void {
        GreenSchema::migrate();
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], []),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run(catalogById()['C74']))
            ->toThrow(RuntimeException::class, 'assertAccessActivityUuidOnly');
    });

    it('C74 goes red when the access-activity UUID hook is a no-op', function (): void {
        GreenSchema::migrate();
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks(['usesLaravelAccess' => true], [
                'assertAccessActivityUuidOnly' => static function (): void {},
            ]),
            new SchemaInspector(),
        );

        expect(fn () => $runner->run(catalogById()['C74']))
            ->toThrow(RuntimeException::class, 'did not prove the behaviour');
    });

    it('C75 goes red when user_groups.public_id is missing', function (): void {
        GreenSchema::migrate();
        Schema::drop('user_group_role');
        Schema::drop('user_group_user');
        Schema::drop('user_groups');
        Schema::create('user_groups', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('user_group_user', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('user_id')->index();
            $table->dateTime('expires_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'user_id']);
        });
        Schema::create('user_group_role', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('role_id')->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'role_id']);
        });

        expect(fn () => runCheck('C75'))->toThrow(RuntimeException::class, 'public_id');
    });

    it('C75 goes red when user_groups.organisation_id is missing', function (): void {
        GreenSchema::migrate();
        Schema::drop('user_group_role');
        Schema::drop('user_group_user');
        Schema::drop('user_groups');
        Schema::create('user_groups', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('name')->unique();
            $table->json('metadata')->nullable();
            $table->boolean('is_instance')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('user_group_user', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('user_id')->index();
            $table->dateTime('expires_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'user_id']);
        });
        Schema::create('user_group_role', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('role_id')->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'role_id']);
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'organisation_id');
    });

    it('C75 goes red when the instance/organisation XOR constraint is missing', function (): void {
        GreenSchema::migrate();
        Schema::drop('user_group_role');
        Schema::drop('user_group_user');
        Schema::drop('user_groups');
        Schema::create('user_groups', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('name')->unique();
            $table->json('metadata')->nullable();
            $table->uuid('organisation_id')->nullable()->index();
            $table->boolean('is_instance')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
        // Deliberately no XOR trigger / CHECK — insert of the forbidden combo succeeds.
        Schema::create('user_group_user', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('user_id')->index();
            $table->dateTime('expires_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'user_id']);
        });
        Schema::create('user_group_role', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('role_id')->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'role_id']);
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'is_instance=true only when organisation_id IS NULL');
    });

    it('C75 goes red when is_instance can coexist with a non-null organisation_id', function (): void {
        // Same gap as missing XOR: the forbidden combo must be rejected by the schema.
        GreenSchema::migrate();
        Schema::drop('user_group_role');
        Schema::drop('user_group_user');
        Schema::drop('user_groups');
        Schema::create('user_groups', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('name')->unique();
            $table->json('metadata')->nullable();
            $table->uuid('organisation_id')->nullable()->index();
            $table->boolean('is_instance')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('user_group_user', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('user_id')->index();
            $table->dateTime('expires_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'user_id']);
        });
        Schema::create('user_group_role', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('role_id')->index();
            $table->timestamps();
            $table->unique(['user_group_id', 'role_id']);
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'is_instance with organisation_id set must be rejected');
    });

    it('C75 stays green for externa 1.x shape (teams off, org columns unused)', function (): void {
        GreenSchema::migrate();
        config([
            'permission.teams' => false,
            'permission.column_names.team_foreign_key' => 'team_id',
        ]);
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks([
                'usesLaravelAccess' => true,
                'usesSpatieTeams' => false,
                'hasOrganisations' => false,
            ], []),
            new SchemaInspector(),
        );

        $runner->run(catalogById()['C75']);
        expect(true)->toBeTrue();
    });

    it('C75 goes red when a literal Schema::table alters Spatie roles', function (): void {
        GreenSchema::migrate();
        $dir = harnessBasePath().'/database/migrations';
        @mkdir($dir, 0777, true);
        $file = $dir.'/2026_11_22_000000_add_access_column_to_roles_table.php';
        file_put_contents(
            $file,
            "<?php\nuse Illuminate\\Support\\Facades\\Schema;\nSchema::table('roles', function (\$table) { \$table->string('bad'); });\n",
        );

        try {
            expect(fn () => runCheck('C75'))
                ->toThrow(RuntimeException::class, 'must not alter Spatie role tables');
        } finally {
            @unlink($file);
        }
    });

    it('C75 goes red when Schema::table uses a variable Spatie table name', function (): void {
        GreenSchema::migrate();
        $dir = harnessBasePath().'/database/migrations';
        @mkdir($dir, 0777, true);
        $file = $dir.'/2026_11_22_fn_alter_roles.php';
        file_put_contents(
            $file,
            "<?php\nuse Illuminate\\Support\\Facades\\Schema;\n\$tableName = 'roles';\nSchema::table(\$tableName, function (\$table) { \$table->string('bad'); });\n",
        );

        try {
            expect(fn () => runCheck('C75'))
                ->toThrow(RuntimeException::class, 'must not alter Spatie role tables');
        } finally {
            @unlink($file);
        }
    });

    it('C75 goes red when a migration uses ALTER TABLE on Spatie roles', function (): void {
        GreenSchema::migrate();
        $dir = harnessBasePath().'/database/migrations';
        @mkdir($dir, 0777, true);
        $file = $dir.'/2026_11_22_alter_roles_sql.php';
        file_put_contents(
            $file,
            "<?php\nuse Illuminate\\Support\\Facades\\DB;\nDB::statement(\"ALTER TABLE roles ADD bad varchar(10)\");\n",
        );

        try {
            expect(fn () => runCheck('C75'))
                ->toThrow(RuntimeException::class, 'must not alter Spatie role tables');
        } finally {
            @unlink($file);
        }
    });

    it('C75 goes red when the migrated Spatie schema has an extra column', function (): void {
        GreenSchema::migrate();
        Schema::table('roles', function (Blueprint $table): void {
            $table->string('bad')->nullable();
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'unexpected column "bad"');
    });

    it('C75 goes red when a required Spatie column is missing', function (): void {
        GreenSchema::migrate();
        Schema::drop('roles');
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->uuid('organisation_id')->nullable();
            $table->timestamps();
            $table->unique(['organisation_id', 'name']);
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'missing required column "guard_name"');
    });

    it('C75 goes red when a required Spatie column type changes', function (): void {
        GreenSchema::migrate();
        Schema::drop('roles');
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->integer('name');
            $table->string('guard_name');
            $table->uuid('organisation_id')->nullable();
            $table->timestamps();
            $table->unique(['organisation_id', 'name', 'guard_name']);
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'unexpected type');
    });

    it('C75 goes red when a required Spatie unique index is missing', function (): void {
        GreenSchema::migrate();
        Schema::drop('roles');
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('guard_name');
            $table->uuid('organisation_id')->nullable();
            $table->timestamps();
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'missing a required unique index');
    });

    it('C75 goes red when a migration builds ALTER TABLE with sprintf', function (): void {
        GreenSchema::migrate();
        $dir = harnessBasePath().'/database/migrations';
        @mkdir($dir, 0777, true);
        $file = $dir.'/2026_11_22_sprintf_alter.php';
        file_put_contents(
            $file,
            "<?php\nuse Illuminate\\Support\\Facades\\DB;\nDB::statement(sprintf('ALTER TABLE %s ADD bad varchar(10)', 'roles'));\n",
        );

        try {
            expect(fn () => runCheck('C75'))
                ->toThrow(RuntimeException::class, 'must not alter Spatie role tables');
        } finally {
            @unlink($file);
        }
    });

    it('C75 goes red when Schema::table uses a variable after intervening statements', function (): void {
        GreenSchema::migrate();
        $dir = harnessBasePath().'/database/migrations';
        @mkdir($dir, 0777, true);
        $file = $dir.'/2026_11_22_intervening_alter.php';
        file_put_contents(
            $file,
            "<?php\nuse Illuminate\\Support\\Facades\\Schema;\n\$tableName = 'roles';\n\$noop = 1;\nSchema::table(\$tableName, function (\$table) { \$table->string('bad'); });\n",
        );

        try {
            expect(fn () => runCheck('C75'))
                ->toThrow(RuntimeException::class, 'must not alter Spatie role tables');
        } finally {
            @unlink($file);
        }
    });

    it('C75 goes red when user_group_user.expires_at has no index', function (): void {
        GreenSchema::migrate();
        Schema::drop('user_group_user');
        Schema::create('user_group_user', function (Blueprint $table): void {
            $table->foreignId('user_group_id');
            $table->foreignId('user_id')->index();
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['user_group_id', 'user_id']);
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'expires_at must be indexed');
    });

    it('C75 stays green when Schema::table appears only in a comment', function (): void {
        GreenSchema::migrate();
        $dir = harnessBasePath().'/database/migrations';
        @mkdir($dir, 0777, true);
        $file = $dir.'/2026_11_22_comment_only.php';
        file_put_contents(
            $file,
            "<?php\n// Schema::table('roles', function (\$table) { \$table->string('bad'); });\n",
        );

        try {
            runCheck('C75');
            expect(true)->toBeTrue();
        } finally {
            @unlink($file);
        }
    });

    it('C75 goes red when user_group_user.expires_at is a MySQL TIMESTAMP', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            $this->markTestSkipped('TIMESTAMP vs DATETIME is a MySQL semantics check.');
        }

        GreenSchema::migrate();
        Schema::table('user_group_user', function (Blueprint $table): void {
            $table->dropColumn('expires_at');
        });
        Schema::table('user_group_user', function (Blueprint $table): void {
            $table->timestamp('expires_at')->nullable()->index();
        });

        expect(fn () => runCheck('C75'))
            ->toThrow(RuntimeException::class, 'expires_at must be dateTime');
    });
});

describe('engine-dependent probes', function (): void {
    it('C3 goes red when users.oidc_sub exists', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['pgsql', 'mysql', 'mariadb'], true)) {
            $this->markTestSkipped('C3 requires PostgreSQL or MySQL.');
        }

        GreenSchema::migrate();
        Schema::table('users', function (Blueprint $table): void {
            $table->string('oidc_sub')->nullable();
        });

        expect(fn () => runCheck('C3'))->toThrow(RuntimeException::class, 'oidc_sub');
    });

    it('C3 goes green with case-sensitive issuer uniqueness and creates its fixture user', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['pgsql', 'mysql', 'mariadb'], true)) {
            $this->markTestSkipped('C3 requires PostgreSQL or MySQL.');
        }

        GreenSchema::migrate();
        // No pre-seeded user: the runner must create one (FK on user_identities.user_id).
        expect(Schema::getConnection()->table('users')->count())->toBe(0);
        runCheck('C3');
        expect(true)->toBeTrue();
    });

    it('C3 creates its fixture user through the product factory, the fixtureUser hook, or fails with advice', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['pgsql', 'mysql', 'mariadb'], true)) {
            $this->markTestSkipped('C3 requires PostgreSQL or MySQL.');
        }

        $runnerWith = static fn (array $config, array $callables = []): ConformanceRunner => new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks($config, $callables),
            new SchemaInspector(),
        );
        $migrateWithFirstName = static function (): void {
            GreenSchema::migrate();
            // excubia: an extra NOT NULL column the raw minimal insert cannot fill.
            Schema::table('users', function (Blueprint $table): void {
                $table->string('first_name');
            });
        };

        $migrateWithFirstName();
        expect(fn () => $runnerWith(['userModel' => 'App\\Models\\User'])->run(catalogById()['C3']))
            ->toThrow(RuntimeException::class, 'fixtureUser hook');

        $migrateWithFirstName();
        // Green only because the factory fills first_name (the raw insert above failed).
        $runnerWith(['userModel' => \Qiick\ConformanceHarness\FixtureUser::class])->run(catalogById()['C3']);

        $migrateWithFirstName();
        $wasHookCalled = false;
        $runnerWith(['userModel' => 'App\\Models\\User'], [
            'fixtureUser' => static function () use (&$wasHookCalled): int {
                $wasHookCalled = true;

                return (int) Schema::getConnection()->table('users')->insertGetId([
                    'public_id' => (string) \Illuminate\Support\Str::uuid(),
                    'email' => 'hook@example.test',
                    'first_name' => 'Grace',
                ]);
            },
        ])->run(catalogById()['C3']);
        expect($wasHookCalled)->toBeTrue();
    });

    it('C15 goes green when duplicate instance settings are rejected', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['pgsql', 'mysql', 'mariadb'], true)) {
            $this->markTestSkipped('C15 requires PostgreSQL or MySQL.');
        }

        GreenSchema::migrate();
        runCheck('C15');
        expect(true)->toBeTrue();
    });

    it('C5 goes green when Spatie team columns are UUID', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['pgsql', 'mysql', 'mariadb'], true)) {
            $this->markTestSkipped('C5 requires PostgreSQL or MySQL.');
        }

        GreenSchema::migrate();
        runCheck('C5');
        expect(true)->toBeTrue();
    });

    it('C72 goes green when access Spatie team columns are UUID', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['pgsql', 'mysql', 'mariadb'], true)) {
            $this->markTestSkipped('C72 requires PostgreSQL or MySQL.');
        }

        GreenSchema::migrate();
        runCheck('C72');
        expect(true)->toBeTrue();
    });

    it('C72 goes red when organisation_id is unsignedBigInteger', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['pgsql', 'mysql', 'mariadb'], true)) {
            $this->markTestSkipped('C72 requires PostgreSQL or MySQL.');
        }

        GreenSchema::migrate();
        Schema::drop('roles');
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('guard_name');
            $table->unsignedBigInteger('organisation_id')->nullable();
            $table->timestamps();
        });

        expect(fn () => runCheck('C72'))
            ->toThrow(RuntimeException::class, 'organisation_id must be UUID-typed');
    });

    it('C72 skips when teams are really off (externa 1.x keeps team_id)', function (): void {
        GreenSchema::migrate();
        config([
            'permission.teams' => false,
            'permission.column_names.team_foreign_key' => 'team_id',
        ]);
        $runner = new ConformanceRunner(
            harnessBasePath(),
            new ConformanceHooks([
                'usesLaravelAccess' => true,
                'usesSpatieTeams' => false,
            ], []),
            new SchemaInspector(),
        );

        $runner->run(catalogById()['C72']);
        expect(true)->toBeTrue();
    });
});


/**
 * C76 RED: PostgreSQL and SQLite leave a foreign key unindexed, so the check
 * must name it. MySQL and MariaDB add the index themselves (and refuse to
 * drop it), so there the proof is that the engine indexed it and C76 passes.
 */
function expectUnindexedForeignKeyCaught(string $expectedForeignKey): void
{
    if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
        expect((new SchemaInspector())->foreignKeysWithoutIndex())->toBe([]);
        runCheck('C76');

        return;
    }

    expect(fn () => runCheck('C76'))->toThrow(RuntimeException::class, $expectedForeignKey);
}

describe('C76 foreign key indexes', function (): void {
    beforeEach(function (): void {
        GreenSchema::migrate();
    });

    it('C76 passes when every foreign key leads an index', function (): void {
        runCheck('C76');
        expect(true)->toBeTrue();
    });

    it('C76 goes red when a foreign key has no index', function (): void {
        Schema::create('invoices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
        });

        expectUnindexedForeignKeyCaught('invoices(user_id) -> users');
    });

    it('C76 goes red when the foreign key is only the second column of an index', function (): void {
        Schema::create('invoices', function (Blueprint $table): void {
            $table->id();
            $table->string('number');
            $table->foreignId('user_id')->constrained('users');
            $table->index(['number', 'user_id']);
        });

        expectUnindexedForeignKeyCaught('invoices(user_id) -> users');
    });

    it('C76 accepts a composite foreign key led by an index in another order', function (): void {
        Schema::create('invoice_owners', function (Blueprint $table): void {
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('owner_id');
            $table->primary(['tenant_id', 'owner_id']);
        });
        Schema::create('invoices', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('owner_id');
            $table->unique(['owner_id', 'tenant_id', 'id']);
            $table->foreign(['tenant_id', 'owner_id'])->references(['tenant_id', 'owner_id'])->on('invoice_owners');
        });

        runCheck('C76');
        expect(true)->toBeTrue();
    });
});

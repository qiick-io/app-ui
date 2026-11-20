<?php

declare(strict_types=1);

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Qiick\ConformanceHarness\GreenSchema;
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
    // C3/C5/C11/C15 need PostgreSQL or MySQL (see engine-dependent probes).
    return ['C1', 'C2', 'C4', 'C6', 'C9', 'C10', 'C12', 'C14', 'C16', 'C18', 'C26', 'C33', 'C34', 'C35', 'C36'];
}

/**
 * Behaviour checks proven GREEN via harness hooks, RED when the hook is missing.
 *
 * @return list<string>
 */
function hookedBehaviourCheckIds(): array
{
    return ['C7', 'C8', 'C13', 'C17', 'C19', 'C20', 'C21', 'C22', 'C23', 'C24', 'C25', 'C27', 'C28', 'C29', 'C30', 'C31', 'C32'];
}

beforeEach(function (): void {
    // Ensure graphify ignore and openapi exist for file checks (restore after RED mutations).
    file_put_contents(
        harnessBasePath().'/.gitignore',
        "/vendor/\n/graphify-out/\ncomposer.lock\n.phpunit.result.cache\n",
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
    it('C1 goes red when public_id is missing', function (): void {
        GreenSchema::migrate();
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

    it('C4 goes red when teams are required but config is off', function (): void {
        GreenSchema::migrate();
        config(['permission.teams' => false]);

        expect(fn () => runCheck('C4'))->toThrow(RuntimeException::class, 'permission.teams');
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

    it('C3 goes green with case-sensitive issuer uniqueness', function (): void {
        if (! in_array(Schema::getConnection()->getDriverName(), ['pgsql', 'mysql', 'mariadb'], true)) {
            $this->markTestSkipped('C3 requires PostgreSQL or MySQL.');
        }

        GreenSchema::migrate();
        // Seed a user row so the FK-less insert of user_id=1 is fine.
        Schema::getConnection()->table('users')->insert([
            'public_id' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'probe@example.com',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        runCheck('C3');
        expect(true)->toBeTrue();
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
});

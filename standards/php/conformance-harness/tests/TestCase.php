<?php

declare(strict_types=1);

namespace Tests;

use Orchestra\Testbench\TestCase as OrchestraTestCase;
use Qiick\ConformanceHarness\GreenSchema;

/**
 * Testbench base for conformance RED/GREEN proofs.
 */
abstract class TestCase extends OrchestraTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'permission.teams' => true,
            'permission.events_enabled' => true,
            // Spatie's Gate::before permission check stays off after full boot (C71).
            'permission.register_permission_check_method' => false,
            'permission.column_names.team_foreign_key' => 'organisation_id',
            'super_admin' => [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'superadmin@example.com',
                'password' => null,
            ],
        ]);
    }

    /**
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver' => env('DB_CONNECTION', 'sqlite'),
            'database' => env('DB_DATABASE', ':memory:'),
            'prefix' => '',
            'foreign_key_constraints' => true,
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT'),
            'username' => env('DB_USERNAME', ''),
            'password' => env('DB_PASSWORD', ''),
        ]);
    }

    protected function migrateGreen(): void
    {
        GreenSchema::migrate();
    }
}

<?php

declare(strict_types=1);

/**
 * Every foreign key of the package's migrations is served by an index (fleet
 * convention F8; conformance C76 runs the same code in products).
 *
 * Written once by the qiick standards sync and owned by this repo: keep it in
 * a directory whose tests get the package's TestCase with its migrations
 * loaded, adjust the `uses()` line to how this suite migrates. The package
 * matrix runs it on SQLite, MySQL, MariaDB and PostgreSQL; only PostgreSQL and
 * SQLite can go red, because MySQL and MariaDB index a foreign key themselves.
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Qiick\Standards\Conformance\Support\SchemaInspector;

require_once __DIR__.'/../Conformance/Support/SchemaInspector.php';

uses(RefreshDatabase::class);

it('serves every foreign key with an index', function (): void {
    expect((new SchemaInspector())->foreignKeysWithoutIndex())->toBe([]);
});

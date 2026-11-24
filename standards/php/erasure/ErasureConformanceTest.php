<?php

declare(strict_types=1);

/**
 * Package erasure conformance suite, E1–E14 (qiick standards pack).
 *
 * Generated from qiick-io/app-ui `standards/php/erasure/` by
 * `scripts/sync-standards.mjs`; CI fails when this copy differs. Do not edit it
 * here. The package describes its stores in `fixture.php` (repo-owned), and
 * its `tests/Pest.php` extends its test case into this folder, which must give
 * every test a freshly migrated database.
 *
 * Standard: `.qiick/standards/erasure.md`.
 * Binding decision: knowledge/decisions/2026-11-24-fleet-erasure-and-cimd.
 */

use Qiick\Standards\Erasure\Support\ErasureConformanceRunner;
use Qiick\Standards\Erasure\Support\ErasureFixture;

spl_autoload_register(static function (string $class): void {
    $prefix = 'Qiick\\Standards\\Erasure\\';

    if (! str_starts_with($class, $prefix)) {
        return;
    }

    $path = __DIR__.'/'.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';

    if (is_file($path)) {
        require_once $path;
    }
});

$erasureFixture = require __DIR__.'/fixture.php';

if (! $erasureFixture instanceof ErasureFixture) {
    it('has an erasure fixture', function (): void {
        throw new LogicException('Implement tests/Erasure/fixture.php (see .qiick/standards/erasure.md), or set "erasure": false in qiick-standards.json for a package with no personal data.');
    })->group('erasure');

    return;
}

foreach (ErasureConformanceRunner::CHECKS as $checkId => $description) {
    it("{$checkId}: {$description}", function () use ($erasureFixture, $checkId): void {
        (new ErasureConformanceRunner($erasureFixture))->run($checkId);

        expect(true)->toBeTrue();
    })->group('erasure');
}

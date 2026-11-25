<?php

declare(strict_types=1);

use Qiick\ConformanceHarness\DemoErasureFixture;
use Qiick\Demo\Erasure\DemoEraser;
use Qiick\DemoBroken\Erasure\DemoBrokenEraser;
use Qiick\Standards\Erasure\Support\ErasureConformanceException;
use Qiick\Standards\Erasure\Support\ErasureConformanceRunner;

/*
 * RED/GREEN proofs for the package erasure suite (standards/php/erasure):
 * the reference eraser passes every check, and each deliberate defect turns
 * exactly the check that guards against it red.
 */

beforeEach(function (): void {
    config(['cache.default' => 'array']);
    DemoErasureFixture::migrate();
    DemoEraser::$defect = null;
    DemoEraser::$isOrganisationScopeSupported = true;
});

function expectErasureCheckFails(ErasureConformanceRunner $runner, string $checkId): void
{
    $checkPrefix = explode('-', $checkId)[0].':';

    try {
        $runner->run($checkId);
    } catch (ErasureConformanceException $exception) {
        expect($exception->getMessage())->toStartWith($checkPrefix);

        return;
    }

    throw new RuntimeException("{$checkId} stayed green on a broken eraser.");
}

it('GREEN: the reference eraser passes every check', function (string $checkId): void {
    (new ErasureConformanceRunner(new DemoErasureFixture()))->run($checkId);

    expect(true)->toBeTrue();
})->with(array_keys(ErasureConformanceRunner::CHECKS));

it('GREEN: a store without organisation support passes every check by refusing the scope', function (string $checkId): void {
    DemoEraser::$isOrganisationScopeSupported = false;

    (new ErasureConformanceRunner(new DemoErasureFixture(isOrganisationScopeSupported: false)))->run($checkId);

    expect(true)->toBeTrue();
})->with(array_keys(ErasureConformanceRunner::CHECKS));

it('RED: each eraser defect fails its check', function (string $checkId, string $defect): void {
    DemoEraser::$defect = $defect;

    expectErasureCheckFails(new ErasureConformanceRunner(new DemoErasureFixture()), $checkId);
})->with([
    'E2 throws on an empty subject' => ['E2', 'throw_when_empty'],
    'E3 delete leaves a store' => ['E3-delete', 'skip_links'],
    'E3 anonymise leaves a store' => ['E3-anonymise', 'skip_links'],
    'E4 reports a change on every run' => ['E4', 'report_phantom_change'],
    'E5 dry run writes' => ['E5', 'dry_run_writes'],
    'E6 erases everyone' => ['E6', 'erase_everyone'],
    'E7 logs an identifier' => ['E7', 'log_identifier'],
    'E8 dispatches inside the transaction' => ['E8', 'event_inside_transaction'],
    'E9 writes without a transaction' => ['E9', 'no_transaction'],
    'E10 ignores the organisation' => ['E10', 'ignore_organisation'],
    'E11 accepts an unknown mode' => ['E11', 'accept_bad_mode'],
    'E12 skips the scoped rows' => ['E12', 'skip_scoped'],
    'E13 keeps the cache' => ['E13', 'keep_cache'],
]);

it('RED: E1 fails on a signature that breaks the standard', function (): void {
    expectErasureCheckFails(new ErasureConformanceRunner(new DemoErasureFixture(eraserClass: DemoBrokenEraser::class)), 'E1');
});

it('RED: E3b fails on an unclassified column', function (): void {
    expectErasureCheckFails(new ErasureConformanceRunner(new DemoErasureFixture(unclassifiedColumns: ['ip_address'])), 'E3b');
});

it('RED: E14 fails when an unsupported organisation scope does not throw', function (): void {
    expectErasureCheckFails(new ErasureConformanceRunner(new DemoErasureFixture(isOrganisationScopeSupported: false)), 'E14');
});

/*
 * Cheats: a fixture that hides a store, misclassifies a column or seeds too
 * little, or an eraser that only looks right, must still turn the suite red.
 */
it('RED: a cheat fails its check', function (string $checkId, ?string $defect, array $fixtureOptions): void {
    DemoEraser::$defect = $defect;

    expectErasureCheckFails(new ErasureConformanceRunner(new DemoErasureFixture(...$fixtureOptions)), $checkId);
})->with([
    'E3b: a personal table left out of tables()' => ['E3b', 'skip_links', ['omittedTables' => ['demo_links']]],
    'E3b: a personal column classified other' => ['E3b', null, ['columnClasses' => ['demo_profiles.email' => 'other']]],
    'E3: a retained column the report does not keep' => ['E3-anonymise', 'keep_email', ['columnClasses' => ['demo_profiles.email' => 'retained']]],
    'E3: a store seed() leaves empty' => ['E3-delete', 'skip_links', ['skippedSeeds' => ['demo_links']]],
    'E8: the event before the writes' => ['E8', 'event_before_writes', []],
    'E9: a swallowed failure on a single write' => ['E9', 'swallow_failure', ['skippedSeeds' => ['demo_links']]],
    'E9: nothing seeded to roll back' => ['E9', null, ['skippedSeeds' => ['demo_profiles', 'demo_links', 'cache']]],
    'E12: organisation support with no scoped table' => ['E12', 'skip_scoped', ['organisationScopedTables' => []]],
    'E12: no row seeded in the organisation' => ['E12', null, ['skippedSeeds' => ['demo_profiles']]],
    'E13: a cache written but not declared' => ['E13', 'keep_cache', ['isCacheDeclared' => false]],
    'E13: a declared cache seed() never wrote' => ['E13', null, ['skippedSeeds' => ['cache']]],
    'E13: a cache the report does not list' => ['E13', 'omit_cache_store', []],
]);

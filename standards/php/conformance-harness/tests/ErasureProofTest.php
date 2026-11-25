<?php

declare(strict_types=1);

use Illuminate\Support\Facades\DB;
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
    config(['cache.default' => 'array', 'cache.stores.second' => ['driver' => 'array']]);
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
    'E5: a dry run that writes in anonymise mode only' => ['E5', 'anonymise_dry_run_writes', []],
    'E7: the user key in a log record' => ['E7', 'log_user_id', []],
    'E7: a user key too short to search for' => ['E7', null, ['userId' => '42']],
    'E3: a personal column that is no search marker survives' => ['E3-anonymise', 'keep_national_id', []],
    'E3: a personal column seed() leaves empty' => ['E3-delete', null, ['skippedSeeds' => ['national_id']]],
    'E3: a retained column keeps cleartext under a kept reason' => ['E3-anonymise', 'keep_email_kept', ['columnClasses' => ['demo_profiles.email' => 'retained']]],
    'E3: a declared cleartext column the report does not list' => ['E3-anonymise', 'keep_email_kept', ['columnClasses' => ['demo_profiles.email' => 'retained'], 'retainedCleartextColumns' => ['demo_profiles.email' => 'legal_obligation']]],
    'E3b: a cleartext column with a reason outside the standard' => ['E3b', null, ['columnClasses' => ['demo_profiles.email' => 'retained'], 'retainedCleartextColumns' => ['demo_profiles.email' => 'because']]],
    'E3: a file on a declared disk survives' => ['E3-delete', 'keep_files', []],
    'E3: a declared disk seed() leaves empty' => ['E3-delete', null, ['skippedSeeds' => ['disk']]],
    'E3: a row on another connection survives' => ['E3-anonymise', 'keep_archive', []],
    'E3: a declared connection seed() leaves empty' => ['E3-delete', null, ['skippedSeeds' => ['archive']]],
    'E2: no event for a person with no data' => ['E2', 'skip_event_when_empty', []],
    'E11: a whitespace-only identifier accepted' => ['E11', 'accept_blank_identifier', []],
    'E12: a personal column that is no search marker survives the organisation run' => ['E12', 'org_scrub_keep_national_id', []],
    'E3: a retained column keeps a value that is no search marker, undeclared' => ['E3-anonymise', 'keep_national_id', ['columnClasses' => ['demo_profiles.national_id' => 'retained']]],
    'E3: a personal column on another connection survives' => ['E3-anonymise', 'keep_dossier', []],
    'E3: an email copied into an other column' => ['E3-anonymise', 'copy_email_to_note', []],
    'E3: a seeded value kept inside a longer string on another connection' => ['E3-anonymise', 'append_to_dossier', []],
    'E12: a misspelled scoped table and an eraser that ignores scoped runs' => ['E12', 'ignore_scoped_runs', ['organisationScopedTables' => ['demo_profles']]],
    'E12: a scoped anonymise run that does nothing' => ['E12', 'org_anonymise_noop', []],
    'E13: a cache entry kept by anonymise' => ['E13', 'keep_cache_on_anonymise', []],
    'E13: the same key in an undeclared second cache store' => ['E13', null, ['isSecondCacheStoreSeeded' => true]],
    'E7: a seeded personal value that is no marker in a log record' => ['E7', 'log_national_id', []],
    'E7: an identifier logged only by anonymise' => ['E7', 'log_identifier_on_anonymise', []],
    'E5: a dry run that replaces a declared file' => ['E5', 'dry_run_replaces_avatar', []],
    'E9: a row on another connection deleted before the failing write' => ['E9', 'archive_before_primary', []],
    'E11: an identifier trimmed before its type is checked' => ['E11', 'trim_before_type_check', []],
]);

it('GREEN: a retained column declared cleartext, with its reason and its report entry, passes E3', function (): void {
    DemoEraser::$defect = 'keep_email_cleartext';
    $fixture = new DemoErasureFixture(columnClasses: ['demo_profiles.email' => 'retained'], retainedCleartextColumns: ['demo_profiles.email' => 'legal_obligation']);

    (new ErasureConformanceRunner($fixture))->run('E3-anonymise');
    (new ErasureConformanceRunner($fixture))->run('E3b');

    expect(true)->toBeTrue();
});

it('RED: E3b fails on a system-versioned personal table, whose history keeps the erased rows', function (): void {
    DB::statement('ALTER TABLE demo_profiles ADD SYSTEM VERSIONING');

    expectErasureCheckFails(new ErasureConformanceRunner(new DemoErasureFixture()), 'E3b');
})->skip(fn (): bool => DB::connection()->getDriverName() !== 'mariadb', 'system versioning is MariaDB only');

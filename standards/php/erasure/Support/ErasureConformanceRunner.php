<?php

declare(strict_types=1);

namespace Qiick\Standards\Erasure\Support;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use LogicException;
use ReflectionClass;
use ReflectionMethod;
use ReflectionNamedType;
use Throwable;

/**
 * The package erasure conformance checks E1–E14 (qiick standards pack).
 *
 * Each check builds its own people and data through the package's fixture and
 * throws ErasureConformanceException, message prefixed with the check id, when
 * the eraser breaks the standard. Messages name tables, columns and counts,
 * never a seeded value. These checks prove one package's eraser; the product's
 * orchestrator is proved by the fleet conformance check C17.
 *
 * Standard: `standards/rules/erasure.md`.
 * Binding decision: knowledge/decisions/2026-11-24-fleet-erasure-and-cimd.
 */
final class ErasureConformanceRunner
{
    /** @var array<string, string> check id => what it proves */
    public const array CHECKS = [
        'E1' => 'the eraser, its report and its event have the standard shape',
        'E2' => 'erasing a person with no data changes nothing, reports zeros and still dispatches its event',
        'E3-delete' => 'a delete run leaves no personal value in any store',
        'E3-anonymise' => 'an anonymise run leaves no personal value in any store',
        'E3b' => 'every table of the migrated schema is classified, and no seeded value sits in an other column',
        'E4' => 'a second run changes nothing',
        'E5' => 'a dry run, in both modes, writes nothing, fires nothing and predicts the real run',
        'E6' => 'another person\'s data is left byte-identical',
        'E7' => 'no user key, public id or seeded identifier reaches the report, package events or logs',
        'E8' => 'a real run dispatches exactly one SubjectErasedEvent, after commit',
        'E9' => 'a failure at the last write rolls every write back and is rethrown',
        'E10' => 'an organisation-scoped run leaves other organisations and out-of-scope tables alone',
        'E11' => 'invalid input throws InvalidArgumentException without echoing it',
        'E12' => 'an organisation-scoped run erases that organisation\'s rows',
        'E13' => 'cache entries written for the person are forgotten',
        'E14' => 'an organisation scope the store cannot honour throws before writing',
    ];

    /** Kept-row reasons the standard allows. */
    private const array KEPT_REASONS = [
        'legal_obligation',
        'security_log',
        'consent_evidence',
        'encrypted_until_expiry',
        'cache_ttl',
        'outside_organisation_scope',
    ];

    /**
     * Laravel skeleton tables a package's test database may hold. None is a
     * package store, so E3b skips them unless the fixture classifies them.
     */
    private const array FRAMEWORK_TABLES = [
        'migrations',
        'users',
        'password_reset_tokens',
        'password_resets',
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
        'failed_jobs',
    ];

    /** Seeded values shorter than this are compared for equality only, never as substrings. */
    private const int MINIMUM_SEARCH_LENGTH = 6;

    /** Upper bound of strings collected from one event payload, so a large object cannot stall E7. */
    private const int MAXIMUM_COLLECTED_STRINGS = 5000;

    public function __construct(private readonly ErasureFixture $fixture) {}

    public function run(string $checkId): void
    {
        match ($checkId) {
            'E1' => $this->checkShape(),
            'E2' => $this->checkEmptySubject(),
            'E3-delete' => $this->checkNoPersonalValueLeft('E3', 'delete'),
            'E3-anonymise' => $this->checkNoPersonalValueLeft('E3', 'anonymise'),
            'E3b' => $this->checkEveryColumnClassified(),
            'E4' => $this->checkIdempotent(),
            'E5' => $this->checkDryRun(),
            'E6' => $this->checkOtherPersonUntouched(),
            'E7' => $this->checkNoIdentifierLeaks(),
            'E8' => $this->checkEventAfterCommit(),
            'E9' => $this->checkRollbackOnFailure(),
            'E10' => $this->checkOtherOrganisationUntouched(),
            'E11' => $this->checkInvalidInput(),
            'E12' => $this->checkOrganisationRowsErased(),
            'E13' => $this->checkCacheForgotten(),
            'E14' => $this->checkUnsupportedOrganisationScope(),
            default => throw new InvalidArgumentException("Unknown erasure check {$checkId}."),
        };
    }

    private function checkShape(): void
    {
        $eraserClass = $this->fixture->eraserClass();

        if (! class_exists($eraserClass)) {
            $this->fail('E1', "the eraser class {$eraserClass} does not exist");
        }

        $eraser = new ReflectionClass($eraserClass);

        if (! $eraser->isFinal() || ! str_ends_with($eraser->getNamespaceName(), '\\Erasure') || ! str_ends_with($eraser->getShortName(), 'Eraser')) {
            $this->fail('E1', 'the eraser must be a final class Qiick\\<Package>\\Erasure\\<Package>Eraser');
        }

        if ($eraser->getConstant('DELETE') !== 'delete' || $eraser->getConstant('ANONYMISE') !== 'anonymise') {
            $this->fail('E1', 'the eraser must declare DELETE = \'delete\' and ANONYMISE = \'anonymise\'');
        }

        $this->assertEraseSignature($eraser);
        $this->assertReportShape();

        $eventClass = $this->packageEventClass();
        $eventConstructor = class_exists($eventClass) ? (new ReflectionClass($eventClass))->getConstructor() : null;
        $eventParameterType = $eventConstructor?->getParameters()[0]?->getType();

        if (! $eventParameterType instanceof ReflectionNamedType || $eventParameterType->getName() !== $this->reportClass()) {
            $this->fail('E1', "the event {$eventClass} must exist and take the ErasureReport as its first parameter");
        }

        if (! app()->make($eraserClass) instanceof $eraserClass) {
            $this->fail('E1', 'the eraser must resolve from the container without arguments');
        }
    }

    private function checkEmptySubject(): void
    {
        $person = $this->fixture->makePerson();
        $before = $this->snapshot([$person]);
        $recording = $this->startRecording();

        try {
            $report = $this->erase($person, 'delete');
        } catch (Throwable $exception) {
            $this->fail('E2', 'erasing a person with no data threw '.$exception::class);
        } finally {
            $recording->stop();
        }

        // Listeners rely on one event per run, even when there was nothing to erase.
        if (count($this->erasedEvents($recording)) !== 1) {
            $this->fail('E2', 'erasing a person with no data did not dispatch exactly one SubjectErasedEvent');
        }

        $this->assertReport('E2', $report, $person, 'delete', false);
        $this->assertNoSurfaceIdentifiesPerson('E2', $report, $recording, $person, [], 'a run for a person with no data');

        foreach ($report->stores as $storeName => $counts) {
            if ($counts['deleted'] + $counts['anonymised'] + $counts['kept'] !== 0) {
                $this->fail('E2', "store {$storeName} reports a non-zero count for a person with no data");
            }
        }

        $this->assertSnapshotsEqual('E2', $before, $this->snapshot([$person]));
    }

    private function checkNoPersonalValueLeft(string $checkId, string $mode): void
    {
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $this->seedOrganisationId());
        $this->assertSeeded($checkId, $person, $this->personalTables());
        $this->assertOtherStoresSeeded($checkId, $person);
        $valuesBefore = $this->columnValues(['personal']);
        $retainedBefore = $this->columnValues(['retained']);
        $seededValues = $this->searchableColumnValues($valuesBefore);

        foreach ($valuesBefore as $qualifiedColumn => $values) {
            if ($values === []) {
                $this->fail($checkId, "seed() left the personal column {$qualifiedColumn} empty, so there is nothing to check");
            }
        }

        $report = $this->erase($person, $mode);
        $this->assertReport($checkId, $report, $person, $mode, false);
        $valuesAfter = $this->columnValues(['personal']);
        $retainedAfter = $this->columnValues(['retained']);

        // Every personal value seed() wrote must go, not only the person's search markers.
        foreach ($valuesBefore as $qualifiedColumn => $values) {
            if (array_intersect($values, $valuesAfter[$qualifiedColumn]) !== []) {
                $this->fail($checkId, "after a real {$mode} run, {$qualifiedColumn} still holds a value seed() wrote");
            }
        }

        $tableNames = array_keys($this->fixture->tables());
        $leftovers = $this->seededColumns($person, $tableNames, ['personal']);

        if ($leftovers !== []) {
            $this->fail($checkId, "after a real {$mode} run, personal values remain in ".implode(', ', $leftovers));
        }

        // Retained means a tombstone or ciphertext; cleartext only where declared, and reported apart.
        $cleartextColumns = $this->fixture->retainedCleartextColumns();

        $retainedAsSeeded = array_keys(array_filter(
            $retainedBefore,
            fn (array $values, string $qualifiedColumn): bool => array_intersect($values, $retainedAfter[$qualifiedColumn]) !== [],
            ARRAY_FILTER_USE_BOTH,
        ));
        $retainedColumns = array_unique([...$this->seededColumns($person, $tableNames, ['retained'], false), ...$retainedAsSeeded]);

        foreach ($retainedColumns as $retainedColumn) {
            if (! isset($cleartextColumns[$retainedColumn])) {
                $this->fail($checkId, "{$retainedColumn} is retained but keeps a value of the person as seeded; declare it in retainedCleartextColumns() or scrub it");
            }

            $cleartextStore = $report->stores["cleartext:{$retainedColumn}"] ?? null;

            if ($cleartextStore === null || $cleartextStore['kept'] === 0 || $cleartextStore['reason'] !== $cleartextColumns[$retainedColumn]) {
                $this->fail($checkId, "the report must list cleartext:{$retainedColumn} with its kept rows and declared reason");
            }
        }

        $otherStores = $this->otherStoresHoldingPerson($person);

        if ($otherStores !== []) {
            $this->fail($checkId, "after a real {$mode} run, values of the person remain in ".implode(', ', $otherStores));
        }

        // A value moved into another column, or kept inside a longer string, is still there.
        $leakedColumns = $this->columnsHoldingPerson($person, $seededValues);

        if ($leakedColumns !== []) {
            $this->fail($checkId, "after a real {$mode} run, values of the person sit in ".implode(', ', $leakedColumns));
        }
    }

    private function checkEveryColumnClassified(): void
    {
        // The inventory comes from the migrated schema, not from the fixture's word.
        $this->assertTablesClassified('', $this->schema(), $this->fixture->tables(), $this->schemaTables());

        foreach ($this->fixture->additionalConnections() as $connectionName => $classifiedTables) {
            $connectionSchema = Schema::connection($connectionName);
            $this->assertTablesClassified("{$connectionName}:", $connectionSchema, $classifiedTables, $this->uniqueTableNames($connectionName));
        }

        $this->assertNoSystemVersionedTables();

        foreach ($this->fixture->retainedCleartextColumns() as $qualifiedColumn => $keptReason) {
            if (($this->classifiedColumns()[$qualifiedColumn] ?? null) !== 'retained' || ! in_array($keptReason, self::KEPT_REASONS, true)) {
                $this->fail('E3b', "the cleartext column {$qualifiedColumn} must be classified retained and name one of the standard kept reasons");
            }
        }

        // A classification is proved, not trusted: no seeded value may sit in an `other` column.
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $this->seedOrganisationId());
        $misclassifiedColumns = $this->seededColumns($person, array_keys($this->fixture->tables()), ['other'], false);

        if ($misclassifiedColumns !== []) {
            $this->fail('E3b', 'seeded personal values sit in columns classified other: '.implode(', ', $misclassifiedColumns));
        }
    }

    private function checkIdempotent(): void
    {
        foreach (['delete', 'anonymise'] as $mode) {
            $person = $this->fixture->makePerson();
            $this->fixture->seed($person, $this->seedOrganisationId());
            $this->erase($person, $mode);
            $secondReport = $this->erase($person, $mode);
            $this->assertReport('E4', $secondReport, $person, $mode, false);

            if ($secondReport->changed() !== 0) {
                $this->fail('E4', "a second {$mode} run changed {$secondReport->changed()} rows");
            }
        }
    }

    private function checkDryRun(): void
    {
        foreach (['delete', 'anonymise'] as $mode) {
            $person = $this->fixture->makePerson();
            $valuesBeforeSeed = $this->columnValues(['personal']);
            $this->fixture->seed($person, $this->seedOrganisationId());
            $seededValues = $this->searchableValuesSince($valuesBeforeSeed);
            $before = $this->snapshot([$person]);
            $recording = $this->startRecording();

            try {
                $dryReport = $this->erase($person, $mode, null, true);
            } finally {
                $recording->stop();
            }

            $this->assertReport('E5', $dryReport, $person, $mode, true);
            // A dry run is held to the privacy rules of a real one (E7).
            $this->assertNoSurfaceIdentifiesPerson('E5', $dryReport, $recording, $person, $seededValues, "a {$mode} dry run");
            // Tables on every connection, declared files by content and declared cache entries.
            $this->assertSnapshotsEqual('E5', $before, $this->snapshot([$person]));

            if ($recording->packageEvents() !== []) {
                $this->fail('E5', "a {$mode} dry run dispatched a package event");
            }

            // Declared entries are in the snapshot; this catches a new one.
            if ($recording->writtenCacheEntries() !== []) {
                $this->fail('E5', "a {$mode} dry run wrote a cache entry");
            }

            $realReport = $this->erase($person, $mode);

            if ($dryReport->toArray()['stores'] !== $realReport->toArray()['stores']) {
                $this->fail('E5', "the {$mode} dry run counts differ from the real run that follows");
            }
        }
    }

    private function checkOtherPersonUntouched(): void
    {
        foreach (['delete', 'anonymise'] as $mode) {
            $organisationId = $this->seedOrganisationId();
            $otherPerson = $this->fixture->makePerson();
            $this->fixture->seed($otherPerson, $organisationId);
            $otherPersonRows = $this->snapshot([$otherPerson]);
            $person = $this->fixture->makePerson();
            $this->fixture->seed($person, $organisationId);
            $this->erase($person, $mode);
            $this->assertRowsSurvive('E6', $otherPersonRows, $this->snapshot([$otherPerson]), "a {$mode} run changed the other person's data");
        }
    }

    private function checkNoIdentifierLeaks(): void
    {
        $runs = [['delete', false], ['anonymise', false]];

        if ($this->fixture->supportsOrganisationScope()) {
            $runs[] = ['delete', true];
            $runs[] = ['anonymise', true];
        }

        foreach ($runs as [$mode, $isScoped]) {
            $person = $this->fixture->makePerson();

            // A short key ('42') matches ordinary numbers, so the search would prove nothing.
            if (mb_strlen($person->userId) < self::MINIMUM_SEARCH_LENGTH) {
                $this->fail('E7', 'makePerson() must give a user key of at least '.self::MINIMUM_SEARCH_LENGTH.' characters, so the suite can search for it');
            }

            $organisationId = $isScoped ? (string) Str::uuid() : $this->seedOrganisationId();
            $valuesBeforeSeed = $this->columnValues(['personal']);
            $this->fixture->seed($person, $organisationId);
            $seededValues = $this->searchableValuesSince($valuesBeforeSeed);
            $recording = $this->startRecording();

            try {
                $report = $this->erase($person, $mode, $isScoped ? $organisationId : null);
            } finally {
                $recording->stop();
            }

            $runName = ($isScoped ? 'an organisation-scoped ' : ($mode === 'anonymise' ? 'an ' : 'a '))."{$mode} run";
            $this->assertNoSurfaceIdentifiesPerson('E7', $report, $recording, $person, $seededValues, $runName);
        }
    }

    /**
     * No search marker, user key or seeded personal value in the report, the
     * package events or the log records of one run.
     *
     * @param  list<string>  $seededValues
     */
    private function assertNoSurfaceIdentifiesPerson(string $checkId, object $report, ErasureRecording $recording, ErasurePerson $person, array $seededValues, string $runName): void
    {
        $surfaces = [
            'the report' => [json_encode($report->toArray(), JSON_THROW_ON_ERROR)],
            'a package event' => array_merge([], ...array_column($recording->packageEvents(), 'strings')),
            'a log record' => $recording->logStrings(),
        ];

        foreach ($surfaces as $surfaceName => $strings) {
            if ($this->containsSeededValue($strings, $person)) {
                $this->fail($checkId, "a seeded identifier or public id appears in {$surfaceName} of {$runName}");
            }

            if ($this->containsWholeValue($strings, [$person->userId, ...$seededValues])) {
                $this->fail($checkId, "the user key or a seeded personal value appears in {$surfaceName} of {$runName}");
            }
        }
    }

    /**
     * The searchable personal values seed() added since the given snapshot,
     * so values earlier runs left behind (a constant tombstone) do not count.
     *
     * @param  array<string, list<string>>  $valuesBeforeSeed
     * @return list<string>
     */
    private function searchableValuesSince(array $valuesBeforeSeed): array
    {
        return array_values(array_diff(
            $this->searchableColumnValues($this->columnValues(['personal'])),
            $this->searchableColumnValues($valuesBeforeSeed),
        ));
    }

    private function checkEventAfterCommit(): void
    {
        // Listeners rely on the event after every kind of run, not only a global delete.
        $runs = [['delete', null], ['anonymise', null]];

        if ($this->fixture->supportsOrganisationScope()) {
            $runs[] = ['delete', (string) Str::uuid()];
            $runs[] = ['anonymise', (string) Str::uuid()];
        }

        foreach ($runs as [$mode, $organisationId]) {
            $this->checkEventAfterCommitIn($mode, $organisationId);
        }
    }

    private function checkEventAfterCommitIn(string $mode, ?string $organisationId): void
    {
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $organisationId ?? $this->seedOrganisationId());
        $runName = ($organisationId === null ? '' : 'organisation-scoped ')."{$mode} run";
        $baseTransactionLevel = $this->connection()->transactionLevel();

        // Inside a caller's transaction that is rolled back, the writes never
        // commit, so the event must never come: neither before the writes nor
        // inside the eraser's own transaction.
        $rolledBackRecording = $this->startRecording();
        $this->connection()->beginTransaction();

        try {
            $this->erase($person, $mode, $organisationId);
        } finally {
            $this->connection()->rollBack();
            $rolledBackRecording->stop();
        }

        if ($this->erasedEvents($rolledBackRecording) !== []) {
            $this->fail('E8', "SubjectErasedEvent was dispatched although the caller's transaction rolled the writes of a {$runName} back");
        }

        $recording = $this->startRecording();

        try {
            $this->erase($person, $mode, $organisationId);
        } finally {
            $recording->stop();
        }

        $erasedEvents = $this->erasedEvents($recording);

        if (count($erasedEvents) !== 1) {
            $this->fail('E8', "a real {$runName} dispatched ".count($erasedEvents).' SubjectErasedEvent events instead of one');
        }

        if ($erasedEvents[0]['transactionLevel'] !== $baseTransactionLevel) {
            $this->fail('E8', "SubjectErasedEvent of a {$runName} was dispatched inside an open transaction, not after commit");
        }
    }

    private function checkRollbackOnFailure(): void
    {
        // Each mode has its own writes: a transaction around one proves nothing about the other.
        foreach (['delete', 'anonymise'] as $mode) {
            $this->checkRollbackOnFailureIn($mode);
        }
    }

    private function checkRollbackOnFailureIn(string $mode): void
    {
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $this->seedOrganisationId());
        $before = $this->snapshot([$person]);
        $writeCount = 0;
        $failingWrite = null;
        $isArmed = true;

        // The listener cannot be removed again, so it is disarmed through the flag.
        $this->connection()->beforeExecuting(function (string $query) use (&$writeCount, &$failingWrite, &$isArmed): void {
            if (! $isArmed || preg_match('/^\s*(insert|update|delete)\b/i', $query) !== 1) {
                return;
            }

            $writeCount++;

            if ($writeCount === $failingWrite) {
                throw new InjectedErasureFailureException('Injected by erasure check E9.');
            }
        });

        // A probe run inside transactions that are rolled back, on every
        // declared connection, counts the writes and leaves the data as seeded.
        $connections = [$this->connection(), ...array_map(fn (string $connectionName): Connection => DB::connection($connectionName), array_keys($this->fixture->additionalConnections()))];

        foreach ($connections as $connection) {
            $connection->beginTransaction();
        }

        try {
            $this->erase($person, $mode);
        } finally {
            foreach ($connections as $connection) {
                $connection->rollBack();
            }
        }

        if ($writeCount === 0) {
            $isArmed = false;
            $this->fail('E9', "a real {$mode} run on the seeded data wrote nothing, so there is no failure to roll back");
        }

        // The failure comes at the last write, so every earlier write must roll back.
        $failingWrite = $writeCount;
        $writeCount = 0;
        $isFailureSeen = false;

        try {
            $this->erase($person, $mode);
        } catch (InjectedErasureFailureException) {
            $isFailureSeen = true;
        } finally {
            $isArmed = false;
        }

        if (! $isFailureSeen) {
            $this->fail('E9', "the eraser swallowed a failure raised at the last write of a {$mode} run");
        }

        // Every declared store, not only the package's connection, is as it was.
        $this->assertSnapshotsEqual('E9', $before, $this->snapshot([$person]), "a failed {$mode} run");
    }

    private function checkOtherOrganisationUntouched(): void
    {
        if (! $this->fixture->supportsOrganisationScope()) {
            return;
        }

        $scopedTables = $this->resolvedScopedTables('E10');

        foreach (['delete', 'anonymise'] as $mode) {
            $erasedOrganisationId = (string) Str::uuid();
            $person = $this->fixture->makePerson();
            $this->fixture->seed($person, (string) Str::uuid());
            $this->assertSeeded('E10', $person, $scopedTables);
            $otherOrganisationRows = $this->snapshot([$person]);
            $this->fixture->seed($person, $erasedOrganisationId);
            $beforeErase = $this->snapshot([$person]);
            $this->assertReport('E10', $this->erase($person, $mode, $erasedOrganisationId), $person, $mode, false);
            $afterErase = $this->snapshot([$person]);
            $this->assertRowsSurvive('E10', $otherOrganisationRows, $afterErase, "a {$mode} run changed rows of another organisation");

            foreach (array_diff(array_keys($beforeErase), $scopedTables) as $outOfScopeStore) {
                if ($beforeErase[$outOfScopeStore] !== $afterErase[$outOfScopeStore]) {
                    $this->fail('E10', "a {$mode} run changed the out-of-scope store {$outOfScopeStore}");
                }
            }
        }
    }

    private function checkInvalidInput(): void
    {
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $this->seedOrganisationId());
        $before = $this->snapshot([$person]);
        $invalidCases = [
            'an unknown mode' => ['mode' => 'purge-everything-e11', 'echo' => 'purge-everything-e11'],
            'a user public id that is not a UUID' => ['userPublicId' => 'not-a-uuid-e11a', 'echo' => 'not-a-uuid-e11a'],
            'a public id that is not a UUID' => ['publicIds' => ['not-a-uuid-e11b'], 'echo' => 'not-a-uuid-e11b'],
            'an empty identifier' => ['identifiers' => [''], 'echo' => null],
            'a whitespace-only identifier' => ['identifiers' => ['   '], 'echo' => null],
            'a non-string identifier' => ['identifiers' => [482_731], 'echo' => '482731'],
        ];

        $recording = $this->startRecording();

        foreach ($invalidCases as $caseName => $overrides) {
            $echoedValue = $overrides['echo'];
            unset($overrides['echo']);
            $arguments = [...$person->arguments('delete'), ...$overrides];

            try {
                $this->fixture->call(fn (): object => app()->make($this->fixture->eraserClass())->erase(...$arguments));
            } catch (InvalidArgumentException $exception) {
                if (($echoedValue !== null && str_contains($exception->getMessage(), $echoedValue)) || $this->containsSeededValue([$exception->getMessage()], $person)) {
                    $this->fail('E11', "the exception for {$caseName} echoes the input");
                }

                continue;
            } catch (Throwable $exception) {
                $this->fail('E11', "{$caseName} threw ".$exception::class.' instead of InvalidArgumentException');
            }

            $this->fail('E11', "{$caseName} was accepted");
        }

        $recording->stop();
        $echoedValues = array_values(array_filter(array_column($invalidCases, 'echo')));

        // Rejected input must not reach a log record on its way out either.
        if ($this->containsSeededValue($recording->logStrings(), $person) || $this->containsWholeValue($recording->logStrings(), [$person->userId, ...$echoedValues])) {
            $this->fail('E11', 'a log record of a rejected run holds the input or a value of the person');
        }

        $this->assertSnapshotsEqual('E11', $before, $this->snapshot([$person]));
    }

    private function checkOrganisationRowsErased(): void
    {
        if (! $this->fixture->supportsOrganisationScope()) {
            return;
        }

        $scopedTables = $this->resolvedScopedTables('E12');

        foreach (['delete', 'anonymise'] as $mode) {
            $organisationId = (string) Str::uuid();
            $person = $this->fixture->makePerson();
            // Both modes share the database: only what this seed() adds is the person's.
            $valuesBeforeSeed = $this->columnValues(['personal'], $scopedTables);
            $this->fixture->seed($person, $organisationId);
            $this->assertSeeded('E12', $person, $scopedTables);
            $valuesBefore = $this->columnValues(['personal'], $scopedTables);
            $seededValues = $this->searchableColumnValues($valuesBefore);
            $this->erase($person, $mode, $organisationId);
            $valuesAfter = $this->columnValues(['personal'], $scopedTables);

            foreach ($valuesBefore as $qualifiedColumn => $values) {
                $addedValues = array_diff($values, $valuesBeforeSeed[$qualifiedColumn]);

                if (array_intersect($addedValues, $valuesAfter[$qualifiedColumn]) !== []) {
                    $this->fail('E12', "after an organisation-scoped {$mode} run, {$qualifiedColumn} still holds a value seed() wrote");
                }
            }

            $leftovers = $this->seededColumns($person, $scopedTables, ['personal']);

            if ($leftovers !== []) {
                $this->fail('E12', "after an organisation-scoped {$mode} run, personal values remain in ".implode(', ', $leftovers));
            }

            // The person was seeded in this organisation only, so no column of a scoped table may keep them.
            $leakedColumns = $this->columnsHoldingPerson($person, array_diff($seededValues, $this->searchableColumnValues($valuesBeforeSeed)), $scopedTables);

            if ($leakedColumns !== []) {
                $this->fail('E12', "after an organisation-scoped {$mode} run, values of the person sit in ".implode(', ', $leakedColumns));
            }
        }
    }

    /**
     * The declared organisation-scoped tables, each a classified table with a
     * personal column: a misspelt or empty declaration would scope nothing.
     *
     * @return list<string>
     */
    private function resolvedScopedTables(string $checkId): array
    {
        $scopedTables = $this->fixture->organisationScopedTables();

        if ($scopedTables === []) {
            $this->fail($checkId, 'the fixture supports an organisation scope but declares no organisation-scoped table');
        }

        $personalTablesOnEveryConnection = [...$this->personalTables()];

        foreach ($this->fixture->additionalConnections() as $connectionName => $classifiedTables) {
            foreach ($classifiedTables as $tableName => $classifiedColumns) {
                if (in_array('personal', $classifiedColumns, true)) {
                    $personalTablesOnEveryConnection[] = "{$connectionName}:{$tableName}";
                }
            }
        }

        $unresolvedTables = array_diff($scopedTables, $personalTablesOnEveryConnection);

        if ($unresolvedTables !== []) {
            $this->fail($checkId, 'the organisation-scoped tables ['.implode(', ', $unresolvedTables).'] are not classified tables with a personal column (`connection:table` on another connection)');
        }

        return array_values($scopedTables);
    }

    private function checkCacheForgotten(): void
    {
        foreach (['delete', 'anonymise'] as $mode) {
            $person = $this->fixture->makePerson();
            $seedRecording = $this->startRecording();

            try {
                $this->fixture->seed($person, $this->seedOrganisationId());
            } finally {
                $seedRecording->stop();
            }

            // An entry is its store and key: the same key in two stores is two entries.
            $cacheEntries = $this->cacheEntries($person);
            $declaredEntryNames = array_map(fn (array $entry): string => implode('|', $entry), $cacheEntries);
            $undeclaredEntryCount = count(array_diff($seedRecording->writtenCacheEntries(), $declaredEntryNames));

            if ($undeclaredEntryCount > 0) {
                $this->fail('E13', "seeding wrote {$undeclaredEntryCount} cache entries that cacheKeys() does not declare");
            }

            foreach ($cacheEntries as [$storeName, $cacheKey]) {
                if (! Cache::store($storeName)->has($cacheKey)) {
                    $this->fail('E13', 'the fixture declares a cache entry that seeding did not write');
                }
            }

            $eraseRecording = $this->startRecording();

            try {
                $report = $this->erase($person, $mode);
            } finally {
                $eraseRecording->stop();
            }

            $this->assertReport('E13', $report, $person, $mode, false);

            // A new entry that still holds the person is the same data under another key.
            foreach ($eraseRecording->writtenCacheValues() as [$storeName, $cacheKey, $strings]) {
                if ($this->containsSeededValue([$cacheKey, ...$strings], $person) && Cache::store($storeName)->has($cacheKey)) {
                    $this->fail('E13', "a real {$mode} run wrote a cache entry that holds a value of the person");
                }
            }

            $forgottenCount = array_sum(array_map(
                fn (string $storeName): int => str_starts_with($storeName, 'cache:') ? $report->stores[$storeName]['deleted'] : 0,
                array_keys($report->stores),
            ));

            if ($cacheEntries !== [] && $forgottenCount === 0) {
                $this->fail('E13', "the {$mode} report counts no forgotten cache entry");
            }

            foreach ($cacheEntries as [$storeName, $cacheKey]) {
                if (Cache::store($storeName)->has($cacheKey)) {
                    $this->fail('E13', "a cache entry written for the person survived a real {$mode} run");
                }
            }
        }
    }

    private function checkUnsupportedOrganisationScope(): void
    {
        if ($this->fixture->supportsOrganisationScope()) {
            return;
        }

        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, null);
        $before = $this->snapshot([$person]);
        $expectedClass = $this->erasureNamespace().'\\OrganisationScopeUnsupportedException';
        $recording = $this->startRecording();

        try {
            $this->erase($person, 'delete', (string) Str::uuid());
        } catch (Throwable $exception) {
            $recording->stop();

            if ($this->containsSeededValue($recording->logStrings(), $person) || $this->containsWholeValue($recording->logStrings(), [$person->userId])) {
                $this->fail('E14', 'a log record of the refused run holds a value of the person');
            }

            if (! $exception instanceof LogicException || $exception::class !== $expectedClass) {
                $this->fail('E14', 'an unsupported organisation scope threw '.$exception::class." instead of {$expectedClass}");
            }

            $this->assertSnapshotsEqual('E14', $before, $this->snapshot([$person]));

            return;
        }

        $recording->stop();
        $this->fail('E14', 'an organisation-scoped run on a store that cannot filter by organisation did not throw');
    }

    private function assertEraseSignature(ReflectionClass $eraser): void
    {
        if (! $eraser->hasMethod('erase')) {
            $this->fail('E1', 'the eraser has no erase() method');
        }

        $method = $eraser->getMethod('erase');
        $expectedParameters = [
            ['userId', 'string', false, null],
            ['userPublicId', 'string', false, null],
            ['mode', 'string', false, null],
            ['publicIds', 'array', true, []],
            ['identifiers', 'array', true, []],
            ['organisationId', '?string', true, null],
            ['dryRun', 'bool', true, false],
        ];
        $actualParameters = [];

        foreach ($method->getParameters() as $parameter) {
            $actualParameters[] = [
                $parameter->getName(),
                (string) $parameter->getType(),
                $parameter->isDefaultValueAvailable(),
                $parameter->isDefaultValueAvailable() ? $parameter->getDefaultValue() : null,
            ];
        }

        if (! $method->isPublic() || $method->isStatic() || $actualParameters !== $expectedParameters) {
            $this->fail('E1', 'erase() must be public and take exactly (string $userId, string $userPublicId, string $mode, array $publicIds = [], array $identifiers = [], ?string $organisationId = null, bool $dryRun = false)');
        }

        if ((string) $method->getReturnType() !== $this->reportClass()) {
            $this->fail('E1', 'erase() must return '.$this->reportClass());
        }
    }

    private function assertReportShape(): void
    {
        $reportClass = $this->reportClass();

        if (! class_exists($reportClass)) {
            $this->fail('E1', "the report class {$reportClass} does not exist");
        }

        $report = new ReflectionClass($reportClass);
        $constructorParameters = array_map(
            fn ($parameter): array => [$parameter->getName(), (string) $parameter->getType()],
            $report->getConstructor()?->getParameters() ?? [],
        );
        $expectedConstructor = [['package', 'string'], ['mode', 'string'], ['dryRun', 'bool'], ['stores', 'array']];

        if (! $report->isFinal() || ! $report->isReadOnly() || $constructorParameters !== $expectedConstructor) {
            $this->fail('E1', 'ErasureReport must be final readonly with constructor (string $package, string $mode, bool $dryRun, array $stores)');
        }

        $publicMethods = array_map(
            fn (ReflectionMethod $method): string => $method->getName().':'.$method->getReturnType(),
            array_filter($report->getMethods(ReflectionMethod::IS_PUBLIC), fn (ReflectionMethod $method): bool => $method->getName() !== '__construct'),
        );
        sort($publicMethods);

        if ($publicMethods !== ['changed:int', 'toArray:array']) {
            $this->fail('E1', 'ErasureReport must expose exactly changed(): int and toArray(): array');
        }
    }

    /**
     * The checks every report must pass, whatever the run.
     */
    private function assertReport(string $checkId, object $report, ErasurePerson $person, string $mode, bool $isDryRun): void
    {
        $reportClass = $this->reportClass();

        if (! $report instanceof $reportClass) {
            $this->fail($checkId, 'erase() did not return '.$reportClass);
        }

        if ($report->package !== $this->fixture->packageName() || $report->mode !== $mode || $report->dryRun !== $isDryRun) {
            $this->fail($checkId, 'the report does not echo the package, the mode and the dry-run flag');
        }

        $changedRows = 0;

        foreach ($report->stores as $storeName => $counts) {
            $keys = is_array($counts) ? array_keys($counts) : [];
            sort($keys);

            if (! is_string($storeName) || $keys !== ['anonymised', 'deleted', 'kept', 'reason']) {
                $this->fail($checkId, 'every store entry must hold exactly deleted, anonymised, kept and reason');
            }

            foreach (['deleted', 'anonymised', 'kept'] as $countName) {
                if (! is_int($counts[$countName]) || $counts[$countName] < 0) {
                    $this->fail($checkId, "store {$storeName}: {$countName} must be a non-negative integer");
                }
            }

            $isReasonValid = $counts['kept'] === 0
                ? $counts['reason'] === null
                : in_array($counts['reason'], self::KEPT_REASONS, true);

            if (! $isReasonValid) {
                $this->fail($checkId, "store {$storeName}: kept rows need one of the standard reasons, and only kept rows have one");
            }

            $changedRows += $counts['deleted'] + $counts['anonymised'];
        }

        $missingStores = array_diff($this->personalTables(), array_keys($report->stores));

        if ($missingStores !== []) {
            $this->fail($checkId, 'the report does not list the tables '.implode(', ', $missingStores));
        }

        $cacheStoreNames = array_filter(array_keys($report->stores), fn (string $storeName): bool => str_starts_with($storeName, 'cache:'));

        if ($this->cacheEntries($person) !== [] && $cacheStoreNames === []) {
            $this->fail($checkId, 'the package caches the person\'s data, but the report lists no cache:<name> store');
        }

        $declaredStores = [
            ...array_map(fn (string $diskName): string => "disk:{$diskName}", array_keys($this->fixture->diskPaths($person))),
            ...array_map(fn (string $connectionName): string => "connection:{$connectionName}", array_keys($this->fixture->additionalConnections())),
        ];
        $missingOtherStores = array_diff($declaredStores, array_keys($report->stores));

        if ($missingOtherStores !== []) {
            $this->fail($checkId, 'the report does not list the stores '.implode(', ', $missingOtherStores));
        }

        if ($report->changed() !== $changedRows) {
            $this->fail($checkId, 'changed() is not the sum of deleted and anonymised');
        }

        $expectedArray = ['package' => $report->package, 'mode' => $report->mode, 'dry_run' => $report->dryRun, 'stores' => $report->stores];

        if ($report->toArray() !== $expectedArray) {
            $this->fail($checkId, 'toArray() must be {package, mode, dry_run, stores}');
        }
    }

    private function erase(ErasurePerson $person, string $mode, ?string $organisationId = null, bool $isDryRun = false): object
    {
        $arguments = $person->arguments($mode, $organisationId, $isDryRun);

        return $this->fixture->call(fn (): object => app()->make($this->fixture->eraserClass())->erase(...$arguments));
    }

    /**
     * The state a run must leave alone, as sorted strings per store, so two
     * snapshots compare as multisets without knowing any primary key: every
     * row of every classified table on every declared connection and, for the
     * given people, every file on the declared disks (path and content hash)
     * and every declared cache entry (store, key and value hash).
     *
     * @param  list<ErasurePerson>  $people
     * @return array<string, list<string>>
     */
    private function snapshot(array $people = []): array
    {
        $snapshot = [];

        foreach (array_keys($this->fixture->tables()) as $tableName) {
            $snapshot[$tableName] = $this->tableRows($this->connection(), $tableName);
        }

        foreach ($this->fixture->additionalConnections() as $connectionName => $classifiedTables) {
            foreach (array_keys($classifiedTables) as $tableName) {
                $snapshot["{$connectionName}:{$tableName}"] = $this->tableRows(DB::connection($connectionName), $tableName);
            }
        }

        if ($people === []) {
            return $snapshot;
        }

        foreach (array_keys($this->fixture->diskPaths($people[0])) as $diskName) {
            $disk = Storage::disk($diskName);
            $files = array_map(fn (string $path): string => $path.'#'.sha1((string) $disk->get($path)), $disk->allFiles());
            sort($files);
            $snapshot["disk:{$diskName}"] = $files;
        }

        $cacheEntries = [];

        foreach ($people as $person) {
            foreach ($this->cacheEntries($person) as [$storeName, $cacheKey]) {
                $cacheEntries[] = "{$storeName}|{$cacheKey}|".sha1(serialize(Cache::store($storeName)->get($cacheKey)));
            }
        }

        sort($cacheEntries);
        $snapshot['cache'] = $cacheEntries;

        return $snapshot;
    }

    /**
     * @return list<string>
     */
    private function tableRows(Connection $connection, string $tableName): array
    {
        $rows = $connection->table($tableName)->get()
            ->map(fn (object $row): string => json_encode((array) $row, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE))
            ->all();
        sort($rows);

        return $rows;
    }

    /**
     * The person's declared cache entries as [store, key] pairs.
     *
     * @return list<array{0: string, 1: string}>
     */
    private function cacheEntries(ErasurePerson $person): array
    {
        $entries = [];

        foreach ($this->fixture->cacheKeys($person) as $storeName => $cacheKeys) {
            foreach ($cacheKeys as $cacheKey) {
                $entries[] = [(string) $storeName, $cacheKey];
            }
        }

        return $entries;
    }

    /**
     * The seeded personal values long enough to search for inside other strings.
     *
     * @param  array<string, list<string>>  $valuesByColumn
     * @return list<string>
     */
    private function searchableColumnValues(array $valuesByColumn): array
    {
        return array_values(array_unique(array_filter(
            array_merge([], ...array_values($valuesByColumn)),
            fn (string $value): bool => mb_strlen($value) >= self::MINIMUM_SEARCH_LENGTH,
        )));
    }

    /**
     * Whether a string holds one of the values as a whole token, not as part
     * of a longer number or word.
     *
     * @param  list<string>  $strings
     * @param  list<string>  $values
     */
    private function containsWholeValue(array $strings, array $values): bool
    {
        foreach ($values as $value) {
            $pattern = '/(?<![[:alnum:]])'.preg_quote($value, '/').'(?![[:alnum:]])/u';

            // A pattern error (a seeded value that is not valid UTF-8) is no match.
            if ((preg_grep($pattern, $strings) ?: []) !== []) {
                return true;
            }
        }

        return false;
    }

    /**
     * Every classified column, of any class and on any declared connection,
     * that holds a search marker of the person or a value seed() wrote; the
     * declared cleartext columns are left out.
     *
     * @param  list<string>  $seededValues
     * @param  ?list<string>  $tableNames  only these tables (`table`, or `connection:table` on another connection)
     * @return list<string>
     */
    private function columnsHoldingPerson(ErasurePerson $person, array $seededValues, ?array $tableNames = null): array
    {
        $stores = $this->classifiedStores($tableNames);

        $cleartextColumns = $this->fixture->retainedCleartextColumns();
        $columnsHoldingPerson = [];

        foreach ($stores as [$prefix, $connection, $classifiedTables]) {
            foreach ($classifiedTables as $tableName => $classifiedColumns) {
                foreach ($connection->table($tableName)->get() as $row) {
                    foreach ((array) $row as $columnName => $value) {
                        $qualifiedColumn = "{$prefix}{$tableName}.{$columnName}";

                        if (! is_scalar($value) || isset($cleartextColumns[$qualifiedColumn])) {
                            continue;
                        }

                        if ($this->containsSeededValue([(string) $value], $person) || $this->containsWholeValue([(string) $value], $seededValues)) {
                            $columnsHoldingPerson[] = $qualifiedColumn;
                        }
                    }
                }
            }
        }

        return array_values(array_unique($columnsHoldingPerson));
    }

    /**
     * MariaDB's system-versioned tables keep every erased row in their history,
     * where the suite's queries cannot see it, so a classified table with
     * personal or retained columns must not be one. PostgreSQL, MySQL and
     * SQLite have no built-in system versioning.
     */
    private function assertNoSystemVersionedTables(): void
    {
        $stores = [[$this->fixture->connectionName(), $this->fixture->tables()]];

        foreach ($this->fixture->additionalConnections() as $connectionName => $classifiedTables) {
            $stores[] = [$connectionName, $classifiedTables];
        }

        foreach ($stores as [$connectionName, $classifiedTables]) {
            $connection = DB::connection($connectionName);

            if (! in_array($connection->getDriverName(), ['mysql', 'mariadb'], true)) {
                continue;
            }

            $versionedTables = array_column(
                $connection->select("select TABLE_NAME as name from information_schema.TABLES where TABLE_SCHEMA = database() and TABLE_TYPE = 'SYSTEM VERSIONED'"),
                'name',
            );
            $personalTables = array_keys(array_filter(
                $classifiedTables,
                fn (array $classifiedColumns): bool => array_intersect($classifiedColumns, ['personal', 'retained']) !== [],
            ));
            $versionedPersonalTables = array_intersect($personalTables, $versionedTables);

            if ($versionedPersonalTables !== []) {
                $this->fail('E3b', 'the system-versioned tables ['.implode(', ', $versionedPersonalTables).'] keep erased personal data in their history; drop system versioning on them');
            }
        }
    }

    /**
     * @param  array<string, list<string>>  $before
     * @param  array<string, list<string>>  $after
     */
    private function assertSnapshotsEqual(string $checkId, array $before, array $after, ?string $runName = null): void
    {
        foreach ($before as $tableName => $rows) {
            if ($rows !== ($after[$tableName] ?? [])) {
                $this->fail($checkId, "store {$tableName} changed".($runName === null ? '' : " after {$runName}"));
            }
        }
    }

    /**
     * Every row of `$survivors` must still exist, unchanged, in `$after`.
     *
     * @param  array<string, list<string>>  $survivors
     * @param  array<string, list<string>>  $after
     */
    private function assertRowsSurvive(string $checkId, array $survivors, array $after, string $failure): void
    {
        foreach ($survivors as $tableName => $rows) {
            $remainingRows = array_count_values($after[$tableName] ?? []);

            foreach ($rows as $row) {
                if (($remainingRows[$row] ?? 0) === 0) {
                    $this->fail($checkId, "{$failure} in table {$tableName}");
                }

                $remainingRows[$row]--;
            }
        }
    }

    /**
     * `table.column` for every column of the given classes that holds a value of the person.
     *
     * @param  list<string>  $tableNames
     * @param  list<string>  $columnClasses
     * @param  bool  $isUserIdCompared  false for `other` columns, where a short user key equals ordinary ids by chance
     * @return list<string>
     */
    private function seededColumns(ErasurePerson $person, array $tableNames, array $columnClasses, bool $isUserIdCompared = true): array
    {
        $seededColumns = [];

        foreach ($tableNames as $tableName) {
            $columnNames = array_keys(array_filter(
                $this->fixture->tables()[$tableName] ?? [],
                fn (string $columnClass): bool => in_array($columnClass, $columnClasses, true),
            ));

            if ($columnNames === []) {
                continue;
            }

            foreach ($this->connection()->table($tableName)->get($columnNames) as $row) {
                foreach ($columnNames as $columnName) {
                    $value = $row->{$columnName};

                    if ($value === null) {
                        continue;
                    }

                    if (($isUserIdCompared && (string) $value === $person->userId) || $this->containsSeededValue([(string) $value], $person)) {
                        $seededColumns[] = "{$tableName}.{$columnName}";
                    }
                }
            }
        }

        return array_values(array_unique($seededColumns));
    }

    /**
     * A check proves nothing on empty tables: every given table with a
     * personal column must hold a value of the person before the run.
     *
     * @param  list<string>  $tableNames
     */
    private function assertSeeded(string $checkId, ErasurePerson $person, array $tableNames): void
    {
        foreach (array_intersect($tableNames, $this->personalTables()) as $tableName) {
            if ($this->seededColumns($person, [$tableName], ['personal']) === []) {
                $this->fail($checkId, "seed() wrote nothing of the person into {$tableName}, so there is nothing to check");
            }
        }

        $personalValues = $this->columnValues(['personal'], $tableNames);

        foreach ($tableNames as $tableName) {
            foreach ($personalValues as $qualifiedColumn => $values) {
                if ($values === [] && str_starts_with($qualifiedColumn, "{$tableName}.")) {
                    $this->fail($checkId, "seed() left the personal column {$qualifiedColumn} empty, so there is nothing to check");
                }
            }
        }
    }

    /**
     * Every non-null value of every column of the given classes, as strings:
     * on the package's connection (`table.column`) and on each additional
     * connection (`connection:table.column`).
     *
     * @param  list<string>  $columnClasses
     * @param  ?list<string>  $tableNames  only these tables (`table`, or `connection:table` on another connection)
     * @return array<string, list<string>> qualified column => values
     */
    private function columnValues(array $columnClasses, ?array $tableNames = null): array
    {
        $stores = $this->classifiedStores($tableNames);

        $valuesByColumn = [];

        foreach ($stores as [$prefix, $connection, $classifiedTables]) {
            foreach ($classifiedTables as $tableName => $classifiedColumns) {
                $columnNames = array_keys(array_filter($classifiedColumns, fn (string $columnClass): bool => in_array($columnClass, $columnClasses, true)));

                if ($columnNames === []) {
                    continue;
                }

                $rows = $connection->table($tableName)->get($columnNames);

                foreach ($columnNames as $columnName) {
                    $valuesByColumn["{$prefix}{$tableName}.{$columnName}"] = $rows->pluck($columnName)
                        ->reject(fn (mixed $value): bool => $value === null)
                        ->map(fn (mixed $value): string => (string) $value)
                        ->values()
                        ->all();
                }
            }
        }

        return $valuesByColumn;
    }

    /**
     * The classified tables of every declared connection, as [prefix,
     * connection, table => column => class]; with table names, only those
     * (`table` on the package's connection, `connection:table` elsewhere).
     *
     * @param  ?list<string>  $tableNames
     * @return list<array{0: string, 1: Connection, 2: array<string, array<string, string>>}>
     */
    private function classifiedStores(?array $tableNames = null): array
    {
        $stores = [['', $this->connection(), $this->fixture->tables()]];

        foreach ($this->fixture->additionalConnections() as $connectionName => $classifiedTables) {
            $stores[] = ["{$connectionName}:", DB::connection($connectionName), $classifiedTables];
        }

        if ($tableNames === null) {
            return $stores;
        }

        foreach ($stores as $index => [$prefix]) {
            $stores[$index][2] = array_filter(
                $stores[$index][2],
                fn (string $tableName): bool => in_array($prefix.$tableName, $tableNames, true),
                ARRAY_FILTER_USE_KEY,
            );
        }

        return $stores;
    }

    /**
     * Every classified column on every connection, by its qualified name.
     *
     * @return array<string, string> qualified column => class
     */
    private function classifiedColumns(): array
    {
        $classes = [];
        $stores = ['' => $this->fixture->tables()];

        foreach ($this->fixture->additionalConnections() as $connectionName => $classifiedTables) {
            $stores["{$connectionName}:"] = $classifiedTables;
        }

        foreach ($stores as $prefix => $classifiedTables) {
            foreach ($classifiedTables as $tableName => $classifiedColumns) {
                foreach ($classifiedColumns as $columnName => $columnClass) {
                    $classes["{$prefix}{$tableName}.{$columnName}"] = $columnClass;
                }
            }
        }

        return $classes;
    }

    /**
     * Every table of one schema, and every column of each, must be classified.
     *
     * @param  array<string, array<string, string>>  $classifiedTables
     * @param  list<string>  $schemaTableNames
     */
    private function assertTablesClassified(string $prefix, \Illuminate\Database\Schema\Builder $schema, array $classifiedTables, array $schemaTableNames): void
    {
        $unclassifiedTables = array_diff($schemaTableNames, array_keys($classifiedTables));

        if ($unclassifiedTables !== []) {
            $this->fail('E3b', "the migrated schema {$prefix} has unclassified tables [".implode(', ', $unclassifiedTables).']');
        }

        foreach ($classifiedTables as $tableName => $classifiedColumns) {
            if (! $schema->hasTable($tableName)) {
                $this->fail('E3b', "the classified table {$prefix}{$tableName} does not exist");
            }

            $actualColumns = $schema->getColumnListing($tableName);
            $unclassifiedColumns = array_diff($actualColumns, array_keys($classifiedColumns));
            $staleColumns = array_diff(array_keys($classifiedColumns), $actualColumns);

            if ($unclassifiedColumns !== [] || $staleColumns !== []) {
                $this->fail('E3b', "table {$prefix}{$tableName}: unclassified columns [".implode(', ', $unclassifiedColumns).'], classified columns that do not exist ['.implode(', ', $staleColumns).']');
            }

            foreach ($classifiedColumns as $columnName => $columnClass) {
                if (! in_array($columnClass, ['personal', 'retained', 'other'], true)) {
                    $this->fail('E3b', "table {$prefix}{$tableName}: column {$columnName} has an unknown class");
                }
            }
        }
    }

    /**
     * Every declared disk and connection must hold the person before the run,
     * or the checks on them prove nothing.
     */
    private function assertOtherStoresSeeded(string $checkId, ErasurePerson $person): void
    {
        $declaredStores = [
            ...array_map(fn (string $diskName): string => "disk:{$diskName}", array_keys($this->fixture->diskPaths($person))),
            ...array_map(fn (string $connectionName): string => "connection:{$connectionName}", array_keys($this->fixture->additionalConnections())),
        ];
        $emptyStores = array_diff($declaredStores, $this->otherStoresHoldingPerson($person));

        if ($emptyStores !== []) {
            $this->fail($checkId, 'the declared stores hold nothing of the person: '.implode(', ', $emptyStores));
        }
    }

    /**
     * The declared disks and connections that hold a file or a row of the
     * person: a file matching a declared pattern, or whose path or content
     * holds a searchable value; a row with a searchable value in any column.
     *
     * shortcut: reads every file and row whole, fine for a test database; stream if a fixture seeds large files.
     *
     * @return list<string> `disk:<name>` and `connection:<name>`
     */
    private function otherStoresHoldingPerson(ErasurePerson $person): array
    {
        $storesHoldingPerson = [];

        foreach ($this->fixture->diskPaths($person) as $diskName => $patterns) {
            $disk = Storage::disk($diskName);

            foreach ($disk->allFiles() as $path) {
                $isDeclaredFile = array_filter($patterns, fn (string $pattern): bool => fnmatch($pattern, $path)) !== [];

                if ($isDeclaredFile || $this->containsSeededValue([$path, (string) $disk->get($path)], $person)) {
                    $storesHoldingPerson[] = "disk:{$diskName}";

                    break;
                }
            }
        }

        foreach (array_keys($this->fixture->additionalConnections()) as $connectionName) {
            foreach ($this->uniqueTableNames($connectionName) as $tableName) {
                foreach (DB::connection($connectionName)->table($tableName)->get() as $row) {
                    $values = array_map(fn (mixed $value): string => (string) $value, array_filter((array) $row, is_scalar(...)));

                    if ($this->containsSeededValue($values, $person)) {
                        $storesHoldingPerson[] = "connection:{$connectionName}";

                        continue 3;
                    }
                }
            }
        }

        return $storesHoldingPerson;
    }

    /**
     * Classified tables with a personal or retained column: the stores every report lists.
     *
     * @return list<string>
     */
    private function personalTables(): array
    {
        return array_keys(array_filter(
            $this->fixture->tables(),
            fn (array $classifiedColumns): bool => array_intersect($classifiedColumns, ['personal', 'retained']) !== [],
        ));
    }

    /**
     * Every table of the migrated schema on the package's connection, skeleton tables left out.
     *
     * @return list<string>
     */
    private function schemaTables(): array
    {
        return array_values(array_filter(
            $this->uniqueTableNames($this->fixture->connectionName()),
            fn (string $tableName): bool => ! in_array($tableName, self::FRAMEWORK_TABLES, true),
        ));
    }

    /**
     * The table names of a connection: on MySQL and MariaDB those of its
     * database, elsewhere those of every schema. The suite reads tables by bare
     * name, so two of one name in different PostgreSQL schemas (a trigger can
     * mirror rows into the second) would hide one from every check: that fails instead.
     *
     * @return list<string>
     */
    private function uniqueTableNames(?string $connectionName): array
    {
        $connection = DB::connection($connectionName);
        $databaseName = in_array($connection->getDriverName(), ['mysql', 'mariadb'], true) ? $connection->getDatabaseName() : null;
        $tableNames = array_column(Schema::connection($connectionName)->getTables($databaseName), 'name');
        $duplicateNames = array_unique(array_diff_assoc($tableNames, array_unique($tableNames)));

        if ($duplicateNames !== []) {
            $this->fail('E3b', 'the connection '.($connectionName ?? 'default').' has tables of the same name in several schemas ['.implode(', ', $duplicateNames).'], which the suite cannot tell apart; rename one');
        }

        return $tableNames;
    }

    /**
     * @return list<array{name: string, transactionLevel: int, strings: list<string>}>
     */
    private function erasedEvents(ErasureRecording $recording): array
    {
        return array_values(array_filter(
            $recording->packageEvents(),
            fn (array $event): bool => $event['name'] === $this->packageEventClass(),
        ));
    }

    /**
     * @param  list<string>  $strings
     */
    private function containsSeededValue(array $strings, ErasurePerson $person): bool
    {
        foreach ($strings as $string) {
            foreach ($person->searchableValues() as $seededValue) {
                if (mb_strlen($seededValue) >= self::MINIMUM_SEARCH_LENGTH && mb_stripos($string, $seededValue) !== false) {
                    return true;
                }
            }
        }

        return false;
    }

    private function startRecording(): ErasureRecording
    {
        $recording = new ErasureRecording($this->packageRootNamespace(), $this->connection(), self::MAXIMUM_COLLECTED_STRINGS);
        Event::listen('*', $recording->listen(...));

        return $recording;
    }

    private function seedOrganisationId(): ?string
    {
        return $this->fixture->supportsOrganisationScope() ? (string) Str::uuid() : null;
    }

    private function erasureNamespace(): string
    {
        return Str::beforeLast($this->fixture->eraserClass(), '\\');
    }

    private function packageRootNamespace(): string
    {
        return Str::beforeLast($this->erasureNamespace(), '\\').'\\';
    }

    private function reportClass(): string
    {
        return $this->erasureNamespace().'\\ErasureReport';
    }

    private function packageEventClass(): string
    {
        return $this->packageRootNamespace().'Events\\SubjectErasedEvent';
    }

    private function connection(): Connection
    {
        return DB::connection($this->fixture->connectionName());
    }

    private function schema(): \Illuminate\Database\Schema\Builder
    {
        return Schema::connection($this->fixture->connectionName());
    }

    private function fail(string $checkId, string $message): never
    {
        throw new ErasureConformanceException("{$checkId}: {$message}.");
    }
}

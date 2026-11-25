<?php

declare(strict_types=1);

namespace Qiick\Standards\Erasure\Support;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
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
        'E2' => 'erasing a person with no data changes nothing and reports zeros',
        'E3-delete' => 'a delete run leaves no personal value in a personal column',
        'E3-anonymise' => 'an anonymise run leaves no personal value in a personal column',
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
        $before = $this->snapshot();

        try {
            $report = $this->erase($person, 'delete');
        } catch (Throwable $exception) {
            $this->fail('E2', 'erasing a person with no data threw '.$exception::class);
        }

        $this->assertReport('E2', $report, $person, 'delete', false);

        foreach ($report->stores as $storeName => $counts) {
            if ($counts['deleted'] + $counts['anonymised'] + $counts['kept'] !== 0) {
                $this->fail('E2', "store {$storeName} reports a non-zero count for a person with no data");
            }
        }

        $this->assertSnapshotsEqual('E2', $before, $this->snapshot());
    }

    private function checkNoPersonalValueLeft(string $checkId, string $mode): void
    {
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $this->seedOrganisationId());
        $this->assertSeeded($checkId, $person, $this->personalTables());
        $report = $this->erase($person, $mode);
        $this->assertReport($checkId, $report, $person, $mode, false);
        $tableNames = array_keys($this->fixture->tables());
        $leftovers = $this->seededColumns($person, $tableNames, ['personal']);

        if ($leftovers !== []) {
            $this->fail($checkId, "after a {$mode} run, personal values remain in ".implode(', ', $leftovers));
        }

        // A retained value survives by design only when the report says why.
        foreach ($this->seededColumns($person, $tableNames, ['retained']) as $retainedColumn) {
            $tableName = Str::before($retainedColumn, '.');

            if ($report->stores[$tableName]['kept'] === 0) {
                $this->fail($checkId, "{$retainedColumn} keeps a personal value, but the report keeps no row of {$tableName}");
            }
        }
    }

    private function checkEveryColumnClassified(): void
    {
        // The inventory comes from the migrated schema, not from the fixture's word.
        $unclassifiedTables = array_diff($this->schemaTables(), array_keys($this->fixture->tables()));

        if ($unclassifiedTables !== []) {
            $this->fail('E3b', 'the migrated schema has unclassified tables ['.implode(', ', $unclassifiedTables).']');
        }

        foreach ($this->fixture->tables() as $tableName => $classifiedColumns) {
            if (! $this->schema()->hasTable($tableName)) {
                $this->fail('E3b', "the classified table {$tableName} does not exist");
            }

            $actualColumns = $this->schema()->getColumnListing($tableName);
            $unclassifiedColumns = array_diff($actualColumns, array_keys($classifiedColumns));
            $staleColumns = array_diff(array_keys($classifiedColumns), $actualColumns);

            if ($unclassifiedColumns !== [] || $staleColumns !== []) {
                $this->fail('E3b', "table {$tableName}: unclassified columns [".implode(', ', $unclassifiedColumns).'], classified columns that do not exist ['.implode(', ', $staleColumns).']');
            }

            foreach ($classifiedColumns as $columnName => $columnClass) {
                if (! in_array($columnClass, ['personal', 'retained', 'other'], true)) {
                    $this->fail('E3b', "table {$tableName}: column {$columnName} has an unknown class");
                }
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
            $this->fixture->seed($person, $this->seedOrganisationId());
            $before = $this->snapshot();
            $recording = $this->startRecording();

            try {
                $dryReport = $this->erase($person, $mode, null, true);
            } finally {
                $recording->stop();
            }

            $this->assertReport('E5', $dryReport, $person, $mode, true);
            $this->assertSnapshotsEqual('E5', $before, $this->snapshot());

            if ($recording->packageEvents() !== []) {
                $this->fail('E5', "a {$mode} dry run dispatched a package event");
            }

            foreach ($this->fixture->cacheKeys($person) as $cacheKey) {
                if (! Cache::has($cacheKey)) {
                    $this->fail('E5', "a {$mode} dry run forgot a cache entry");
                }
            }

            $realReport = $this->erase($person, $mode);

            if ($dryReport->toArray()['stores'] !== $realReport->toArray()['stores']) {
                $this->fail('E5', "the {$mode} dry run counts differ from the real run that follows");
            }
        }
    }

    private function checkOtherPersonUntouched(): void
    {
        $organisationId = $this->seedOrganisationId();
        $otherPerson = $this->fixture->makePerson();
        $this->fixture->seed($otherPerson, $organisationId);
        $otherPersonRows = $this->snapshot();
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $organisationId);
        $this->erase($person, 'delete');
        $this->assertRowsSurvive('E6', $otherPersonRows, $this->snapshot(), 'the other person\'s rows changed');
    }

    private function checkNoIdentifierLeaks(): void
    {
        $person = $this->fixture->makePerson();

        // A short key ('42') matches ordinary numbers, so the search would prove nothing.
        if (mb_strlen($person->userId) < self::MINIMUM_SEARCH_LENGTH) {
            $this->fail('E7', 'makePerson() must give a user key of at least '.self::MINIMUM_SEARCH_LENGTH.' characters, so the suite can search for it');
        }

        $this->fixture->seed($person, $this->seedOrganisationId());
        $recording = $this->startRecording();

        try {
            $report = $this->erase($person, 'delete');
        } finally {
            $recording->stop();
        }

        $surfaces = [
            'the report' => [json_encode($report->toArray(), JSON_THROW_ON_ERROR)],
            'a package event' => array_merge([], ...array_column($recording->packageEvents(), 'strings')),
            'a log record' => $recording->logStrings(),
        ];

        $userIdPattern = '/(?<![[:alnum:]])'.preg_quote($person->userId, '/').'(?![[:alnum:]])/u';

        foreach ($surfaces as $surfaceName => $strings) {
            if ($this->containsSeededValue($strings, $person)) {
                $this->fail('E7', "a seeded identifier or public id appears in {$surfaceName}");
            }

            if (preg_grep($userIdPattern, $strings) !== []) {
                $this->fail('E7', "the user key appears in {$surfaceName}");
            }
        }
    }

    private function checkEventAfterCommit(): void
    {
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $this->seedOrganisationId());
        $baseTransactionLevel = $this->connection()->transactionLevel();

        // Inside a caller's transaction that is rolled back, the writes never
        // commit, so the event must never come: neither before the writes nor
        // inside the eraser's own transaction.
        $rolledBackRecording = $this->startRecording();
        $this->connection()->beginTransaction();

        try {
            $this->erase($person, 'delete');
        } finally {
            $this->connection()->rollBack();
            $rolledBackRecording->stop();
        }

        if ($this->erasedEvents($rolledBackRecording) !== []) {
            $this->fail('E8', 'SubjectErasedEvent was dispatched although the caller\'s transaction rolled the writes back');
        }

        $recording = $this->startRecording();

        try {
            $this->erase($person, 'delete');
        } finally {
            $recording->stop();
        }

        $erasedEvents = $this->erasedEvents($recording);

        if (count($erasedEvents) !== 1) {
            $this->fail('E8', 'a real run dispatched '.count($erasedEvents).' SubjectErasedEvent events instead of one');
        }

        if ($erasedEvents[0]['transactionLevel'] !== $baseTransactionLevel) {
            $this->fail('E8', 'SubjectErasedEvent was dispatched inside an open transaction, not after commit');
        }
    }

    private function checkRollbackOnFailure(): void
    {
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $this->seedOrganisationId());
        $before = $this->snapshot();
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

        // A probe run inside a transaction that is rolled back counts the writes.
        $this->connection()->beginTransaction();

        try {
            $this->erase($person, 'delete');
        } finally {
            $this->connection()->rollBack();
        }

        if ($writeCount === 0) {
            $isArmed = false;
            $this->fail('E9', 'a real run on the seeded data wrote nothing, so there is no failure to roll back');
        }

        // The failure comes at the last write, so every earlier write must roll back.
        $failingWrite = $writeCount;
        $writeCount = 0;
        $isFailureSeen = false;

        try {
            $this->erase($person, 'delete');
        } catch (InjectedErasureFailureException) {
            $isFailureSeen = true;
        } finally {
            $isArmed = false;
        }

        if (! $isFailureSeen) {
            $this->fail('E9', 'the eraser swallowed a failure raised at its last write');
        }

        $this->assertSnapshotsEqual('E9', $before, $this->snapshot());

        foreach ($this->fixture->cacheKeys($person) as $cacheKey) {
            if (! Cache::has($cacheKey)) {
                $this->fail('E9', 'a run that failed forgot a cache entry');
            }
        }
    }

    private function checkOtherOrganisationUntouched(): void
    {
        if (! $this->fixture->supportsOrganisationScope()) {
            return;
        }

        $scopedTables = $this->fixture->organisationScopedTables();
        $erasedOrganisationId = (string) Str::uuid();
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, (string) Str::uuid());
        $this->assertSeeded('E10', $person, $scopedTables);
        $otherOrganisationRows = $this->snapshot();
        $this->fixture->seed($person, $erasedOrganisationId);
        $beforeErase = $this->snapshot();
        $this->assertReport('E10', $this->erase($person, 'delete', $erasedOrganisationId), $person, 'delete', false);
        $afterErase = $this->snapshot();
        $this->assertRowsSurvive('E10', $otherOrganisationRows, $afterErase, 'rows of another organisation changed');

        foreach (array_diff(array_keys($beforeErase), $scopedTables) as $outOfScopeTable) {
            if ($beforeErase[$outOfScopeTable] !== $afterErase[$outOfScopeTable]) {
                $this->fail('E10', "the out-of-scope table {$outOfScopeTable} changed");
            }
        }
    }

    private function checkInvalidInput(): void
    {
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $this->seedOrganisationId());
        $before = $this->snapshot();
        $invalidCases = [
            'an unknown mode' => ['mode' => 'purge-everything-e11', 'echo' => 'purge-everything-e11'],
            'a user public id that is not a UUID' => ['userPublicId' => 'not-a-uuid-e11a', 'echo' => 'not-a-uuid-e11a'],
            'a public id that is not a UUID' => ['publicIds' => ['not-a-uuid-e11b'], 'echo' => 'not-a-uuid-e11b'],
            'an empty identifier' => ['identifiers' => [''], 'echo' => null],
        ];

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

        $this->assertSnapshotsEqual('E11', $before, $this->snapshot());
    }

    private function checkOrganisationRowsErased(): void
    {
        if (! $this->fixture->supportsOrganisationScope()) {
            return;
        }

        $scopedTables = $this->fixture->organisationScopedTables();

        if ($scopedTables === []) {
            $this->fail('E12', 'the fixture supports an organisation scope but declares no organisation-scoped table');
        }

        $organisationId = (string) Str::uuid();
        $person = $this->fixture->makePerson();
        $this->fixture->seed($person, $organisationId);
        $this->assertSeeded('E12', $person, $scopedTables);
        $this->erase($person, 'delete', $organisationId);
        $leftovers = $this->seededColumns($person, $scopedTables, ['personal']);

        if ($leftovers !== []) {
            $this->fail('E12', 'after an organisation-scoped run, personal values remain in '.implode(', ', $leftovers));
        }
    }

    private function checkCacheForgotten(): void
    {
        $person = $this->fixture->makePerson();
        $seedRecording = $this->startRecording();

        try {
            $this->fixture->seed($person, $this->seedOrganisationId());
        } finally {
            $seedRecording->stop();
        }

        $cacheKeys = $this->fixture->cacheKeys($person);
        $undeclaredKeyCount = count(array_diff($seedRecording->writtenCacheKeys(), $cacheKeys));

        if ($undeclaredKeyCount > 0) {
            $this->fail('E13', "seeding wrote {$undeclaredKeyCount} cache keys that cacheKeys() does not declare");
        }

        foreach ($cacheKeys as $cacheKey) {
            if (! Cache::has($cacheKey)) {
                $this->fail('E13', 'the fixture declares a cache key that seeding did not write');
            }
        }

        $report = $this->erase($person, 'delete');
        $this->assertReport('E13', $report, $person, 'delete', false);
        $forgottenCount = array_sum(array_map(
            fn (string $storeName): int => str_starts_with($storeName, 'cache:') ? $report->stores[$storeName]['deleted'] : 0,
            array_keys($report->stores),
        ));

        if ($cacheKeys !== [] && $forgottenCount === 0) {
            $this->fail('E13', 'the report counts no forgotten cache entry');
        }

        foreach ($cacheKeys as $cacheKey) {
            if (Cache::has($cacheKey)) {
                $this->fail('E13', 'a cache entry written for the person survived a real run');
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
        $before = $this->snapshot();
        $expectedClass = $this->erasureNamespace().'\\OrganisationScopeUnsupportedException';

        try {
            $this->erase($person, 'delete', (string) Str::uuid());
        } catch (Throwable $exception) {
            if (! $exception instanceof LogicException || $exception::class !== $expectedClass) {
                $this->fail('E14', 'an unsupported organisation scope threw '.$exception::class." instead of {$expectedClass}");
            }

            $this->assertSnapshotsEqual('E14', $before, $this->snapshot());

            return;
        }

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

        if ($this->fixture->cacheKeys($person) !== [] && $cacheStoreNames === []) {
            $this->fail($checkId, 'the package caches the person\'s data, but the report lists no cache:<name> store');
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
     * Every row of every classified table, as sorted JSON strings, so two
     * snapshots compare as multisets without knowing any primary key.
     *
     * @return array<string, list<string>>
     */
    private function snapshot(): array
    {
        $snapshot = [];

        foreach (array_keys($this->fixture->tables()) as $tableName) {
            $rows = $this->connection()->table($tableName)->get()
                ->map(fn (object $row): string => json_encode((array) $row, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE))
                ->all();
            sort($rows);
            $snapshot[$tableName] = $rows;
        }

        return $snapshot;
    }

    /**
     * @param  array<string, list<string>>  $before
     * @param  array<string, list<string>>  $after
     */
    private function assertSnapshotsEqual(string $checkId, array $before, array $after): void
    {
        foreach ($before as $tableName => $rows) {
            if ($rows !== ($after[$tableName] ?? [])) {
                $this->fail($checkId, "table {$tableName} changed");
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
            array_column($this->schema()->getTables(), 'name'),
            fn (string $tableName): bool => ! in_array($tableName, self::FRAMEWORK_TABLES, true),
        ));
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

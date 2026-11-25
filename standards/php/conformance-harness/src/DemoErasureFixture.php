<?php

declare(strict_types=1);

namespace Qiick\ConformanceHarness;

use Closure;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Qiick\Demo\Erasure\DemoEraser;
use Qiick\Standards\Erasure\Support\ErasureFixture;
use Qiick\Standards\Erasure\Support\ErasurePerson;

/**
 * The erasure fixture of the harness's demo package, written the way a real
 * package writes its `tests/Erasure/fixture.php`. The options let a proof
 * break the fixture itself (E1, E3b, E14).
 *
 * Caches the package uses with the person's data, each written by seed():
 * - `demo:{userPublicId}`: the person's email, forgotten after a real run.
 *
 * Other stores: the `demo` disk (`avatars/{userPublicId}.txt`) and the
 * `demo_archive` connection (`demo_archive_entries`).
 */
final class DemoErasureFixture implements ErasureFixture
{
    /**
     * Every option after the first two lets a proof make the fixture cheat, so
     * the suite shows it does not trust the fixture's own word.
     *
     * @param  list<string>  $unclassifiedColumns  profile columns left out of tables()
     * @param  list<string>  $omittedTables  tables left out of tables()
     * @param  array<string, 'personal'|'retained'|'other'>  $columnClasses  `table.column` => a class that overrides the honest one
     * @param  list<string>  $skippedSeeds  what seed() leaves empty: `demo_profiles`, `demo_links`, `cache`, `disk`, `archive`, or the `national_id` column
     * @param  array<string, string>  $retainedCleartextColumns  `table.column` => kept reason
     * @param  bool  $isSecondCacheStoreSeeded  seed() also writes the person's key to the undeclared `second` store
     * @param  ?list<string>  $organisationScopedTables  overrides the honest `['demo_profiles']`
     * @param  ?string  $userId  a fixed user key instead of a fresh six-digit one
     */
    public function __construct(
        private readonly string $eraserClass = DemoEraser::class,
        private readonly bool $isOrganisationScopeSupported = true,
        private readonly array $unclassifiedColumns = [],
        private readonly array $omittedTables = [],
        private readonly array $columnClasses = [],
        private readonly array $skippedSeeds = [],
        private readonly ?array $organisationScopedTables = null,
        private readonly bool $isCacheDeclared = true,
        private readonly ?string $userId = null,
        private readonly array $retainedCleartextColumns = [],
        private readonly bool $isSecondCacheStoreSeeded = false,
    ) {}

    /** Fresh, distinct user keys: two random keys in one check could collide and look like one person. */
    private static int $issuedUserKeyCount = 0;

    /**
     * Recreates the demo stores on an empty schema, as a package's freshly
     * migrated test database; the harness has no RefreshDatabase, and E3b
     * reads the whole schema.
     */
    public static function migrate(): void
    {
        Schema::dropAllTables();
        Storage::fake('demo');
        config(['database.connections.demo_archive' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']]);
        DB::purge('demo_archive');

        Schema::connection('demo_archive')->create('demo_archive_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('owner_public_id', 36)->index();
            $table->string('email')->nullable();
            $table->string('dossier', 32)->nullable();
        });

        Schema::create('demo_profiles', function (Blueprint $table): void {
            $table->id();
            $table->string('user_id', 64)->index();
            $table->string('organisation_id', 36)->nullable();
            $table->string('email')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('national_id', 32)->nullable();
            $table->string('note');
            $table->timestamp('anonymised_at')->nullable();
        });

        Schema::create('demo_links', function (Blueprint $table): void {
            $table->id();
            $table->string('owner_public_id', 36)->index();
            $table->string('label');
        });
    }

    public function packageName(): string
    {
        return 'qiick/demo';
    }

    public function eraserClass(): string
    {
        return $this->eraserClass;
    }

    public function connectionName(): ?string
    {
        return null;
    }

    public function tables(): array
    {
        $profileColumns = [
            'id' => 'other',
            'user_id' => 'personal',
            'organisation_id' => 'other',
            'email' => 'personal',
            'ip_address' => 'personal',
            'national_id' => 'personal',
            'note' => 'other',
            'anonymised_at' => 'other',
        ];

        $tables = [
            'demo_profiles' => array_diff_key($profileColumns, array_flip($this->unclassifiedColumns)),
            'demo_links' => ['id' => 'other', 'owner_public_id' => 'personal', 'label' => 'other'],
        ];

        foreach ($this->columnClasses as $qualifiedColumn => $columnClass) {
            [$tableName, $columnName] = explode('.', $qualifiedColumn);
            $tables[$tableName][$columnName] = $columnClass;
        }

        return array_diff_key($tables, array_flip($this->omittedTables));
    }

    public function makePerson(): ErasurePerson
    {
        return ErasurePerson::fresh($this->userId ?? (string) (100000 + ++self::$issuedUserKeyCount));
    }

    public function seed(ErasurePerson $person, ?string $organisationId): void
    {
        if (! in_array('demo_profiles', $this->skippedSeeds, true)) {
            DB::table('demo_profiles')->insert([
                'user_id' => $person->userId,
                'organisation_id' => $organisationId,
                'email' => $person->identifiers[0],
                'ip_address' => $person->otherPersonalValues[0],
                // Not one of the person's search markers: E3 must still see it erased.
                'national_id' => in_array('national_id', $this->skippedSeeds, true) ? null : 'NID'.random_int(10000000, 99999999),
                'note' => 'seeded profile',
            ]);
        }

        if (! in_array('disk', $this->skippedSeeds, true)) {
            Storage::disk('demo')->put("avatars/{$person->userPublicId}.txt", $person->identifiers[0]);
        }

        if (! in_array('archive', $this->skippedSeeds, true)) {
            DB::connection('demo_archive')->table('demo_archive_entries')->insert([
                'owner_public_id' => $person->publicIds[0],
                'email' => $person->identifiers[0],
                // Not a search marker: the suite must compare it by value.
                'dossier' => 'DOS'.random_int(10000000, 99999999),
            ]);
        }

        if (! in_array('demo_links', $this->skippedSeeds, true)) {
            DB::table('demo_links')->insert(['owner_public_id' => $person->publicIds[0], 'label' => 'seeded link']);
        }

        if (! in_array('cache', $this->skippedSeeds, true)) {
            Cache::put("demo:{$person->userPublicId}", $person->identifiers[0], 3600);
        }

        if ($this->isSecondCacheStoreSeeded) {
            Cache::store('second')->put("demo:{$person->userPublicId}", $person->identifiers[0], 3600);
        }
    }

    public function supportsOrganisationScope(): bool
    {
        return $this->isOrganisationScopeSupported;
    }

    public function organisationScopedTables(): array
    {
        return $this->organisationScopedTables ?? ['demo_profiles'];
    }

    public function cacheKeys(ErasurePerson $person): array
    {
        return $this->isCacheDeclared ? [Cache::getDefaultDriver() => ["demo:{$person->userPublicId}"]] : [];
    }

    public function retainedCleartextColumns(): array
    {
        return $this->retainedCleartextColumns;
    }

    public function diskPaths(ErasurePerson $person): array
    {
        return ['demo' => ["avatars/{$person->userPublicId}*"]];
    }

    public function additionalConnections(): array
    {
        return ['demo_archive' => ['demo_archive_entries' => ['id' => 'other', 'owner_public_id' => 'personal', 'email' => 'personal', 'dossier' => 'personal']]];
    }

    public function call(Closure $erase): object
    {
        return $erase();
    }
}

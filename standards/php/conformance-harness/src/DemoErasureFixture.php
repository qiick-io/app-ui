<?php

declare(strict_types=1);

namespace Qiick\ConformanceHarness;

use Closure;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Qiick\Demo\Erasure\DemoEraser;
use Qiick\Standards\Erasure\Support\ErasureFixture;
use Qiick\Standards\Erasure\Support\ErasurePerson;

/**
 * The erasure fixture of the harness's demo package, written the way a real
 * package writes its `tests/Erasure/fixture.php`. The options let a proof
 * break the fixture itself (E1, E3b, E14).
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
     * @param  list<string>  $skippedSeeds  stores seed() leaves empty: `demo_profiles`, `demo_links`, `cache`
     * @param  ?list<string>  $organisationScopedTables  overrides the honest `['demo_profiles']`
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
    ) {}

    /**
     * Recreates the demo stores on an empty schema, as a package's freshly
     * migrated test database; the harness has no RefreshDatabase, and E3b
     * reads the whole schema.
     */
    public static function migrate(): void
    {
        Schema::dropAllTables();

        Schema::create('demo_profiles', function (Blueprint $table): void {
            $table->id();
            $table->string('user_id', 64)->index();
            $table->string('organisation_id', 36)->nullable();
            $table->string('email')->nullable();
            $table->string('ip_address', 45)->nullable();
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
        return ErasurePerson::fresh((string) random_int(100000, 999999));
    }

    public function seed(ErasurePerson $person, ?string $organisationId): void
    {
        if (! in_array('demo_profiles', $this->skippedSeeds, true)) {
            DB::table('demo_profiles')->insert([
                'user_id' => $person->userId,
                'organisation_id' => $organisationId,
                'email' => $person->identifiers[0],
                'ip_address' => $person->otherPersonalValues[0],
                'note' => 'seeded profile',
            ]);
        }

        if (! in_array('demo_links', $this->skippedSeeds, true)) {
            DB::table('demo_links')->insert(['owner_public_id' => $person->publicIds[0], 'label' => 'seeded link']);
        }

        if (! in_array('cache', $this->skippedSeeds, true)) {
            Cache::put("demo:{$person->userPublicId}", $person->identifiers[0], 3600);
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
        return $this->isCacheDeclared ? ["demo:{$person->userPublicId}"] : [];
    }

    public function call(Closure $erase): object
    {
        return $erase();
    }
}

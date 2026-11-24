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
     * @param  list<string>  $unclassifiedColumns  profile columns left out of tables(), for the E3b RED proof
     */
    public function __construct(
        private readonly string $eraserClass = DemoEraser::class,
        private readonly bool $isOrganisationScopeSupported = true,
        private readonly array $unclassifiedColumns = [],
    ) {}

    /** Recreates the demo stores; the harness has no RefreshDatabase. */
    public static function migrate(): void
    {
        Schema::dropIfExists('demo_profiles');
        Schema::dropIfExists('demo_links');

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

        return [
            'demo_profiles' => array_diff_key($profileColumns, array_flip($this->unclassifiedColumns)),
            'demo_links' => ['id' => 'other', 'owner_public_id' => 'personal', 'label' => 'other'],
        ];
    }

    public function makePerson(): ErasurePerson
    {
        return ErasurePerson::fresh((string) random_int(100000, 999999));
    }

    public function seed(ErasurePerson $person, ?string $organisationId): void
    {
        DB::table('demo_profiles')->insert([
            'user_id' => $person->userId,
            'organisation_id' => $organisationId,
            'email' => $person->identifiers[0],
            'ip_address' => $person->otherPersonalValues[0],
            'note' => 'seeded profile',
        ]);
        DB::table('demo_links')->insert(['owner_public_id' => $person->publicIds[0], 'label' => 'seeded link']);
        Cache::put("demo:{$person->userPublicId}", $person->identifiers[0], 3600);
    }

    public function supportsOrganisationScope(): bool
    {
        return $this->isOrganisationScopeSupported;
    }

    public function organisationScopedTables(): array
    {
        return ['demo_profiles'];
    }

    public function cacheKeys(ErasurePerson $person): array
    {
        return ["demo:{$person->userPublicId}"];
    }

    public function call(Closure $erase): object
    {
        return $erase();
    }
}

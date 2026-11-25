<?php

declare(strict_types=1);

namespace Qiick\ConformanceHarness;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Fills the extra NOT NULL `first_name` the C3 fixture-user proof adds to users.
 *
 * @extends Factory<FixtureUser>
 */
final class FixtureUserFactory extends Factory
{
    protected $model = FixtureUser::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'public_id' => (string) Str::uuid(),
            'email' => 'factory-'.Str::random(8).'@example.test',
            'first_name' => 'Ada',
        ];
    }
}

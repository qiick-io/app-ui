<?php

declare(strict_types=1);

namespace Qiick\ConformanceHarness;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A product user model with a factory, for the C3 fixture-user proof: the
 * runner must create its users row through this factory, which knows the
 * product's extra NOT NULL columns.
 */
final class FixtureUser extends Model
{
    /** @use HasFactory<FixtureUserFactory> */
    use HasFactory;

    protected $table = 'users';

    protected $guarded = [];

    protected static function newFactory(): FixtureUserFactory
    {
        return FixtureUserFactory::new();
    }
}

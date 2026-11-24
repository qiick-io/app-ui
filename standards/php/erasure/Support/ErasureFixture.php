<?php

declare(strict_types=1);

namespace Qiick\Standards\Erasure\Support;

use Closure;

/**
 * What a package tells the erasure conformance suite about its stores.
 *
 * The package implements it once, in its repo-owned `tests/Erasure/fixture.php`.
 * Binding decision: knowledge/decisions/2026-11-24-fleet-erasure-and-cimd.
 */
interface ErasureFixture
{
    /** The Composer name the report must carry, for example `qiick/laravel-oidc`. */
    public function packageName(): string;

    /** The eraser, `Qiick\<Package>\Erasure\<Package>Eraser`. */
    public function eraserClass(): string;

    /** The connection of the package's stores; null for the default one. */
    public function connectionName(): ?string;

    /**
     * Every column of every table the eraser reads or writes, classified.
     * `personal` must not hold the person's values after a real run;
     * `retained` survives by design and the standard names the reason (a
     * reference to a tombstone, an encrypted payload); `other` is not personal.
     *
     * @return array<string, array<string, 'personal'|'retained'|'other'>> table => column => class
     */
    public function tables(): array;

    /** Creates a person, and the user row when the package needs one. */
    public function makePerson(): ErasurePerson;

    /** Seeds the person's data in every store; in this organisation when it is not null. */
    public function seed(ErasurePerson $person, ?string $organisationId): void;

    /** False when an organisation-scoped run must throw `OrganisationScopeUnsupportedException` (E14). */
    public function supportsOrganisationScope(): bool;

    /**
     * Tables whose rows belong to one organisation; an organisation-scoped run
     * erases only their rows of that organisation and leaves every other table alone.
     *
     * @return list<string>
     */
    public function organisationScopedTables(): array;

    /**
     * Cache keys the package wrote for the person and a real run must forget (E13).
     *
     * @return list<string>
     */
    public function cacheKeys(ErasurePerson $person): array;

    /**
     * Runs one erase call. Most packages return `$erase()`; access opens the
     * transaction that also deletes the user row, as the product's orchestrator does.
     *
     * @param  Closure(): object  $erase
     */
    public function call(Closure $erase): object;
}

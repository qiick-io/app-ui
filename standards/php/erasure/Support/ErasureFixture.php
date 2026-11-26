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

    /**
     * Columns classified `retained` that keep the person's value in cleartext
     * by design, each with the standard kept reason. Every other retained
     * column must hold no searchable value of the person after a real run, and
     * the report lists each of these as `cleartext:<table>.<column>`.
     *
     * @return array<string, string> `table.column` => kept reason
     */
    public function retainedCleartextColumns(): array;

    /**
     * Files the package writes for the person, as glob patterns relative to
     * each disk's root. seed() writes at least one file on each disk; a real
     * run leaves no matching file and no file that names or holds a value of
     * the person. The report lists each disk as `disk:<name>`.
     *
     * @return array<string, list<string>> disk => patterns
     */
    public function diskPaths(ErasurePerson $person): array;

    /**
     * Database connections besides connectionName() that hold the person's
     * rows, with every column of every table classified as in tables().
     * seed() fills every personal column; after a real run no personal column
     * holds a value seed() wrote and no row holds a searchable value of the
     * person. The report lists each connection as `connection:<name>`.
     *
     * @return array<string, array<string, array<string, 'personal'|'retained'|'other'>>> connection => table => column => class
     */
    public function additionalConnections(): array;

    /** Creates a person, and the user row when the package needs one; a user key of 6+ characters (E7). */
    public function makePerson(): ErasurePerson;

    /** Seeds the person's data in every store; in this organisation when it is not null. */
    public function seed(ErasurePerson $person, ?string $organisationId): void;

    /** False when an organisation-scoped run must throw `OrganisationScopeUnsupportedException` (E14). */
    public function supportsOrganisationScope(): bool;

    /**
     * Tables whose rows belong to one organisation; an organisation-scoped run
     * erases only their rows of that organisation and leaves every other table
     * alone. A table of additionalConnections() is named `connection:table`.
     *
     * @return list<string>
     */
    public function organisationScopedTables(): array;

    /**
     * Cache entries the package wrote for the person and a real run must
     * forget (E13), by store name (the default store too, by its name): the
     * same key in two stores is two entries. E13 sees only entries `seed()`
     * writes, so the fixture's docblock lists every cache the package uses
     * with the person's data, and `seed()` writes each one.
     *
     * @return array<string, list<string>> store => keys
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

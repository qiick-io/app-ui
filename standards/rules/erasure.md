# Personal data erasure

GDPR erasure across qiick packages and products: one eraser of the same shape in every package that holds personal data, and one resumable orchestrator in each product. There is no shared interface package. A formal interface may be added later, but only additively. Binding decision: `knowledge/decisions/2026-11-24-fleet-erasure-and-cimd` (the maintainer, 2026-11-24).

- **Packages:** `final class Qiick\<Package>\Erasure\<Package>Eraser` with `erase(string $userId, string $userPublicId, string $mode, array $publicIds = [], array $identifiers = [], ?string $organisationId = null, bool $dryRun = false): ErasureReport`. It must be idempotent, use one transaction per package, never delete the user row, and put no personal data in reports, events, logs or exception messages. The suite in `tests/Erasure/`, synced once the package sets `"erasure": true`, proves E1–E14.
- **Products:** user deletion goes only through the erasure orchestrator, which writes a resumable `erasure_requests` row first and runs the erasers in the standard order. The fleet conformance check C17 proves it. Nothing else calls an eraser or `PrincipalDirectory::eraseUser()`.

<!-- qiick-standards:detail when: writing or changing an eraser, a package store that holds personal data, a user deletion path, the erasure orchestrator or tests/Erasure -->

## The eraser

```php
namespace Qiick\<Package>\Erasure;

/** @api GDPR erasure of one person's data held by this package. */
final class <Package>Eraser
{
    public const string DELETE = 'delete';
    public const string ANONYMISE = 'anonymise';

    public function erase(
        string $userId,              // the user's key as a string ('42' or a UUID)
        string $userPublicId,
        string $mode,                // self::DELETE or self::ANONYMISE
        array $publicIds = [],       // list<string>: the person's principal ids and API key public ids
        array $identifiers = [],     // list<string>: email, username, display name; only to scrub free text
        ?string $organisationId = null,
        bool $dryRun = false,
    ): ErasureReport;
}
```

- The eraser resolves from the container without arguments. The signature uses only built-in types, so no shared type is needed. A new parameter may only be appended, with a default.
- **Invalid input** throws `InvalidArgumentException` whose message contains no argument value. These cases are invalid:
    - an unknown mode;
    - a `$userPublicId` or a `$publicIds` entry that is not a UUID;
    - an `$identifiers` entry that is not a non-empty string.
- `$publicIds` is a trust boundary of the product: the eraser matches its own columns against the whole list, because UUIDs do not collide.
- **`delete`** removes rows that exist only for the person. **`anonymise`** keeps the rows and scrubs or unlinks their personal columns. Rows the package must keep are anonymised in both modes and reported as `kept`.
- **`$organisationId`** removes the person from one organisation. Only stores the package declares organisation-scoped are touched. A store that cannot filter by organisation throws `Qiick\<Package>\Erasure\OrganisationScopeUnsupportedException` (a `LogicException`) before writing. It never falls back to the person's data in every organisation.

## The report

```php
/** @api */
final readonly class ErasureReport
{
    /** @param array<string, array{deleted: int, anonymised: int, kept: int, reason: ?string}> $stores */
    public function __construct(public string $package, public string $mode, public bool $dryRun, public array $stores) {}

    public function changed(): int;   // deleted + anonymised over every store: 0 on a second run

    public function toArray(): array; // {package, mode, dry_run, stores}
}
```

- **Stores.** Every table with a personal or retained column is listed, with zero counts too. A cache the package writes with the person's data is listed as `cache:<name>`; a forgotten entry counts as `deleted`.
- **Reasons.** A store with `kept > 0` names one of these reasons, and a store with `kept = 0` has `reason = null`:

| Reason                       | Meaning                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `legal_obligation`           | audit evidence                                                  |
| `security_log`               | the `auth` log, 730 days                                        |
| `consent_evidence`           | mcp-oauth consent records, until `retention_until`              |
| `encrypted_until_expiry`     | encrypted data that cannot be searched, purged by its retention |
| `cache_ttl`                  | a non-enumerable cache with a TTL of 24 hours at most           |
| `outside_organisation_scope` | a store out of scope for an organisation-scoped run             |

- **No personal data.** The report holds no ids, identifiers, tombstones or row content.

## Rules

Names and logs follow the [fleet conventions](conventions.md): the event ends with `Event` (F5), the exception for an unsupported scope with `Exception`, and log context never carries personal data (F10).

1. **Idempotent.** A person with no data is normal: zero counts, no exception.
2. **One transaction per package**, on the package's connection. An eraser joins a transaction that is already open as a savepoint. A failure rolls back the package's writes and is rethrown. Nothing is atomic across packages: the product's resumable request is what makes a partial run safe.
3. **Dry run** writes nothing, forgets nothing, dispatches nothing, and returns the counts that a real run would return.
4. **Events.** After commit, a real run dispatches `Qiick\<Package>\Events\SubjectErasedEvent(ErasureReport $report)` and no other package event that carries an identifier. Listeners never write the person's data anywhere, the audit log included.
5. **Explicit, not cascade.** The eraser handles every personal column itself. Foreign-key cascades stay only as a safety net.
6. **Caches.** The eraser forgets after commit every cache entry it can key from the person's data. A cache it cannot enumerate needs a TTL of 24 hours at most and is reported as `cache_ttl`.
7. **No user row.** No eraser deletes the user row. Only the product's access step does.

## The package conformance suite (`tests/Erasure/`)

**When the sync adds it.** The suite is opt-in, so a re-sync never turns a package red before it has an eraser. A package sets `"erasure": true` in `qiick-standards.json` in the PR that adds its eraser, and from then on the sync writes:

- `ErasureConformanceTest.php` and `Support/`: managed, never edited in the package;
- `fixture.php`: written once and owned by the package.

`erasure` is a top-level flag like `package`, not a key of `conventions`: it turns on a synced test suite, as `php` turns on the architecture test, while `conventions` only scopes the static F-checks and their divergences. A package with no personal data sets `"erasure": false` and says why in the PR. While a package (`"package": true`) has set neither, the standards check prints a warning; once `CHANGELOG.md` has a stable `## [1.x.y]` section (the 1.0 release PR adds it), it is an error, so no package reaches 1.0 undecided. Once it opts in, the suite has one red test until `fixture.php` returns a fixture. The package's `tests/Pest.php` extends its test case into `tests/Erasure` (for example `pest()->extend(PackageTestCase::class)->in('Feature', 'Unit', 'Erasure')`), and that test case gives every test a freshly migrated database.

**The fixture** implements `Qiick\Standards\Erasure\Support\ErasureFixture`:

| Method                                                         | What it gives the suite                                                                                                                                                                                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packageName()`                                                | the Composer name                                                                                                                                                                                                                                  |
| `eraserClass()`                                                | the eraser class                                                                                                                                                                                                                                   |
| `connectionName()`                                             | the connection of the package's stores                                                                                                                                                                                                             |
| `tables()`                                                     | every column of every table of the migrated schema (Laravel skeleton tables such as `users` and `migrations` may be left out), classified `personal`, `retained` (survives by design: a reference to a tombstone, an encrypted payload) or `other` |
| `makePerson()`                                                 | an `ErasurePerson::fresh($userId)` plus the user row when the package needs one                                                                                                                                                                    |
| `seed()`                                                       | the person's data in every store, in an organisation when given                                                                                                                                                                                    |
| `supportsOrganisationScope()` and `organisationScopedTables()` | how organisation-scoped runs behave                                                                                                                                                                                                                |
| `cacheKeys()`                                                  | every cache key `seed()` writes, all of which a real run must forget                                                                                                                                                                               |
| `call()`                                                       | `$erase()` for most packages; access wraps it in the transaction that also deletes the user                                                                                                                                                        |

| Check | Fails when                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1    | the eraser, `ErasureReport`, the constants or `Events\SubjectErasedEvent` differ from the pinned shape                                                                                         |
| E2    | a person with no data throws, writes, or reports a non-zero count                                                                                                                              |
| E3    | `seed()` left a personal table empty; after a `delete` or `anonymise` run a seeded value remains in a `personal` column, or in a `retained` column of a table the report keeps no row of       |
| E3b   | a table of the migrated schema or one of its columns is unclassified, a classified column does not exist, or a seeded value sits in an `other` column                                          |
| E4    | a second run reports `changed() > 0`                                                                                                                                                           |
| E5    | a dry run writes, forgets a cache entry, dispatches a package event, or predicts other counts than the real run                                                                                |
| E6    | another person's rows change                                                                                                                                                                   |
| E7    | a seeded identifier or public id reaches the report, a package event or a log record                                                                                                           |
| E8    | inside a caller's transaction that rolls back, a run dispatches `SubjectErasedEvent`; or a real run does not dispatch exactly one, at the caller's transaction level                           |
| E9    | a run on the seeded data writes nothing; or a failure injected at its last write leaves a change behind, forgets a cache entry, or is swallowed                                                |
| E10   | `seed()` left a scoped table empty, or an organisation-scoped run changes another organisation's rows or an out-of-scope table                                                                 |
| E11   | invalid input is accepted, throws another exception, or is echoed in the message                                                                                                               |
| E12   | the fixture supports an organisation scope with no scoped table, `seed()` left a scoped table empty, or an organisation-scoped run leaves personal values in that organisation's scoped tables |
| E13   | `seed()` writes an undeclared cache key or misses a declared one, the report lists no `cache:<name>` store or counts nothing forgotten, or a declared key survives a real run                  |
| E14   | without organisation support, a scoped run does not throw `OrganisationScopeUnsupportedException`, or writes                                                                                   |

The suite proves one package's eraser. It is not an Art. 17 certificate: the product's C17 check proves the whole erasure.

## The product orchestrator

Each product owns an `erasure_requests` table:

| Column            | Meaning                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | uuid, the case id                                                            |
| `mode`            | `delete` or `anonymise`                                                      |
| `organisation_id` | null to erase the person, a UUID to remove them from that organisation       |
| `status`          | `pending`, `running`, `completed`, `failed`                                  |
| `steps`           | JSON per package: `pending` / `done` and the report counts                   |
| `subject`         | **encrypted** snapshot: `userId`, `userPublicId`, `publicIds`, `identifiers` |
| bookkeeping       | `requested_at`, `completed_at`, `attempts`, `last_error_code`                |

**Rules for both branches:**

- **One open request per person and organisation**, created under a lock on the user row. A full erasure supersedes an open organisation request.
- **Resume.**
    - Each step is marked `done` when its eraser returns.
    - A failure records `failed` and a code, with no message text.
    - A retry replays the steps that are not `done`, from the snapshot, never from the `User` model.
    - A snapshot that cannot be decrypted sets `snapshot_unreadable` and escalates to an admin, without retrying.
- **Close** in one transaction: `completed`, `completed_at`, `subject = null`. Just before it, the orchestrator writes one "erasure completed" audit entry with the case id and the counts.

**Erase the person** (`organisation_id` null):

| Step | What happens                                                                                                                                                                                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Check Art. 17(3), and offer the export first if the person asked for one. Then, in one transaction: write the request and snapshot, set an unusable password, null `remember_token` and delete the user's sessions. From then on, the user provider refuses the user on every login path |
| 1    | mcp-oauth (`GrantStore::eraseForUser()`), then api-keys: every credential, revoked by owner                                                                                                                                                                                              |
| 2    | oidc                                                                                                                                                                                                                                                                                     |
| 3    | outbound: pending deliveries with the person's `subject_public_id` become `Cancelled` with a null payload. Collect the Art. 19 recipients before this step                                                                                                                               |
| 4    | http-basics, settings, then the product's own tables                                                                                                                                                                                                                                     |
| 5    | In one transaction on the users connection: `AccessEraser`, then `forceDelete()` of the user                                                                                                                                                                                             |
| 6    | audit, last                                                                                                                                                                                                                                                                              |
| 7    | close                                                                                                                                                                                                                                                                                    |

**Remove the person from an organisation** (`organisation_id` set). There is no lock-out and no user delete. The snapshot holds only that organisation's principal and its keys.

| Step | What happens                                                  |
| ---- | ------------------------------------------------------------- |
| 0    | Write the request and deactivate that principal               |
| 1    | mcp-oauth (`GrantStore::eraseForPrincipals()`), then api-keys |
| 2    | http-basics and the product's organisation tables             |
| 3    | `AccessEraser`                                                |
| 4    | audit                                                         |
| 5    | close                                                         |

oidc, settings and outbound are not called in this branch.

## Product duties no package can do

- the Art. 17(3) check;
- the export first, when asked for;
- answering within one month (Art. 12(3));
- telling recipients (Art. 19);
- legal hold;
- backup and log retention;
- queued jobs that carry personal data;
- Art. 18 restriction.

Webhook payloads carry public ids, not personal data. An admin or export lookup by a user id with no user row returns 404.

# Fleet conformance suite

Every core-hardening decision ships with a check. Binding decision:
[2026-11-20 Core hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md).

The suite lives in `standards/php/conformance/`, is synced into each product's
`tests/Conformance/` by `scripts/sync-standards.mjs`, and runs against a freshly
migrated database plus the built config. Engine-dependent checks (column types,
unique-with-empty-string, case-sensitive issuer) run on **PostgreSQL and MySQL**
via the reusable [`.github/workflows/conformance.yml`](../.github/workflows/conformance.yml).

## Product setup

1. Sync the standards pack (`php: true` in `qiick-standards.json`).
2. Fill `qiick-standards.json` → `conformance` with scalars (user model, table
   names, feature flags). See the example below.
3. Implement behaviour hooks in the repo-owned `tests/Conformance/hooks.php`
   (written once, never overwritten).
4. Call the reusable workflow (or `vendor/bin/pest --group=conformance` on each
   engine).
5. Skip a check only with a divergence object:

```json
{
    "conformance": {
        "userModel": "App\\Models\\User",
        "publicIdColumn": "public_id",
        "apiPrefix": "api/v1",
        "usesSpatieTeams": true,
        "usesLaravelAccess": false,
        "hasOrganisations": true,
        "hasUserGroups": true,
        "hasPrincipals": true,
        "hasApiKeys": true,
        "hasSettings": true,
        "hasUserIdentities": true
    },
    "divergences": {
        "C3": {
            "reason": "IdP-only product; identities live upstream",
            "decision": "knowledge/decisions/2026-11-19-fleet-core-schema",
            "review_by": "2027-05-01"
        }
    }
}
```

An expired `review_by`, an unknown check id, or a divergence whose check now
passes all fail the suite (C37).

## Proofs in app-ui

`standards/php/conformance-harness/` is a Testbench project. Every check has been
seen to go **RED** on a deliberately broken fixture and **GREEN** on a correct
one (`composer test` in that directory; CI matrix covers SQLite, PostgreSQL and
MySQL).

## Check catalogue

| Id  | Tag       | Asserts                                                                                                                                              | Decision                                                                                                                                                                |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | schema    | `users` baseline (bigint id, public UUID, username, locale, timezone UTC, nullable password, soft deletes, is_active, last_login_*, Fortify 2FA)     | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C2  | schema    | No `users.organisation_id`; organisation UUID PK; membership UNIQUE; with orgs, `principals.organisation_id` NOT NULL (principals may be membership) | [principal-organisation-required](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-22-principal-organisation-required-in-multi-tenant-products.md) |
| C3  | behaviour | `user_identities` case-sensitive UNIQUE(issuer,subject); no `users.oidc_sub` (PG+MySQL)                                                              | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C4  | config    | `permission.teams` and `team_foreign_key=organisation_id` when teams are used                                                                        | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C5  | schema    | Spatie team columns are UUID; `model_id` stays bigint (PG+MySQL)                                                                                     | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C6  | schema    | Spatie tables + soft-deleted `user_groups` + unique pivots                                                                                           | [roles-groups](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-roles-groups-initial-admin-and-username.md)                                     |
| C7  | behaviour | Soft-deleted group grants no permission                                                                                                              | [roles-groups](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-roles-groups-initial-admin-and-username.md)                                     |
| C8  | behaviour | Global role definitions cannot duplicate via the NULL-unique hole                                                                                    | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C9  | schema    | `principals` UUID shape; every user has one principal                                                                                                | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C10 | schema    | API key ownership via principal; `owner_principal_id` / `owner_id` / `principals.user_id` never cascade-erase                                        | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C11 | schema    | API key columns; `expires_at` and `previous_key_valid_until` are dateTime, not MySQL TIMESTAMP (PG+MySQL)                                            | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C12 | schema    | Activity morphs `string(64)`; nullable indexed `organisation_id`                                                                                     | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C13 | behaviour | Activity `properties.api_key_id` holds the public UUID                                                                                               | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C14 | schema    | Scoped settings NOT NULL + 4-column UNIQUE                                                                                                           | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C15 | behaviour | Duplicate `scope_id=''` instance settings fail (PG+MySQL)                                                                                            | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C16 | schema    | `notifications`, `sessions`, `passkeys` present                                                                                                      | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C17 | behaviour | Erasure anonymises; no cascade of keys/audit; unique tombstones                                                                                      | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C18 | config    | `config/super_admin.php` exposes the four `INITIAL_SUPER_ADMIN_*` keys                                                                               | [roles-groups](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-roles-groups-initial-admin-and-username.md)                                     |
| C19 | behaviour | Initial-admin seeder: no known default outside local/testing; never modifies                                                                         | [roles-groups](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-roles-groups-initial-admin-and-username.md)                                     |
| C20 | behaviour | Machine errors expose `error`; JSON without Accept on `/api/*` and `/mcp`                                                                            | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C21 | behaviour | `Content-Language` on success and error                                                                                                              | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C22 | behaviour | Pagination keys `data` / `links` / `meta`                                                                                                            | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C23 | behaviour | 429 throttle headers                                                                                                                                 | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C24 | behaviour | `X-Request-Id` preserved/replaced and logged                                                                                                         | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C25 | behaviour | `Idempotency-Key` replay                                                                                                                             | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C26 | file      | OpenAPI 3.1.x covers every named `api/v1` route as an exact path+method pair (honours `servers` prefix)                                              | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C27 | behaviour | Standard Webhooks outbound shape                                                                                                                     | [shared-packages](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-shared-packages-for-api-keys-and-outbound-http.md)                           |
| C28 | behaviour | SSRF guard + `CURLOPT_CONNECT_TO` pin                                                                                                                | [shared-packages](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-shared-packages-for-api-keys-and-outbound-http.md)                           |
| C29 | behaviour | Team switch clears cached roles/permissions; skipped only when `permission.teams` is off; red when teams are on with a wrong declaration or key      | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C30 | behaviour | Instance super-admin with zero organisations (not Spatie null-team)                                                                                  | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C31 | behaviour | API resources expose public UUIDs only                                                                                                               | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C32 | behaviour | Encrypted casts + `APP_PREVIOUS_KEYS`; `key_hash` stays SHA-256                                                                                      | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C33 | file      | No `.frozen` before the first stable `v*` tag                                                                                                        | [migrations-freeze](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-migrations-freeze-at-first-stable-release.md)                              |
| C34 | file      | No `add_`/`alter_`/`drop_` migrations before the first stable tag                                                                                    | [migrations-freeze](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-migrations-freeze-at-first-stable-release.md)                              |
| C35 | file      | `graphify-out/` ignored                                                                                                                              | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C36 | file      | Never call `permission:setup-teams`                                                                                                                  | [fleet-core-schema](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-fleet-core-schema.md)                                                      |
| C37 | file      | Divergence metadata: reason, decision, review_by; no unknown/expired/stale (including a declared hook reduced to a no-op); each check is isolated    | [core-hardening](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-20-core-hardening.md)                                                            |
| C7  | behaviour | Soft-deleted group grants no permission                                                                                                              | [roles-groups](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-19-roles-groups-initial-admin-and-username.md)                                     |
| C71 | behaviour | `events_enabled`, `register_permission_check_method` off, runtime `Gate::before` probe; resolver clear + API actor denied proved (usesLaravelAccess) | [laravel-access](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-22-laravel-access-package.md)                                                    |
| C72 | schema    | When teams are really on: `team_foreign_key=organisation_id` and UUID team columns (usesLaravelAccess; skips when teams are off, e.g. externa 1.x)   | [laravel-access](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-22-laravel-access-package.md)                                                    |
| C73 | behaviour | Expired group membership grants nothing, proved via probe (usesLaravelAccess)                                                                        | [laravel-access](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-22-laravel-access-package.md)                                                    |
| C74 | behaviour | Role/group/membership activity properties use public UUIDs only, proved via probe (usesLaravelAccess)                                                | [laravel-access](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-22-laravel-access-package.md)                                                    |
| C75 | schema    | Access group tables + bidirectional Spatie allowlist (columns/types/indexes); migration scan extra signal (usesLaravelAccess)                        | [laravel-access](https://github.com/LucaGiardi20/knowledge/blob/main/decisions/2026-11-22-laravel-access-package.md)                                                    |

Source of the ordered list: merged OpenCode cross-review §5 and Cursor cross-review §5
(2026-11-20), with Cursor's `permission:setup-teams` check kept as C36 and the
divergence meta-check as C37. C71–C75 are AC13–AC17 from the laravel-access
standards review (2026-11-22), numbered after C70.

## Runner isolation (C3 / C37)

Each check runs inside a transaction or SAVEPOINT (`SchemaInspector::isolate`). A
failing probe (for example a foreign-key error) cannot abort the outer Pest
transaction on PostgreSQL and leave later checks — C37's stale-divergence scan
included — blind. C3 creates a real fixture user before its case-sensitivity
inserts; it no longer hard-codes `user_id=1`.

## Behaviour hooks

C37 only re-runs checks that declare a divergence. Most presence-only behaviour
hooks left as a no-op **without** a divergence (for example an empty
`assertTeamSwitch`) stay green: proving they exercise real product behaviour is
the product's responsibility.

**Exception — C71 / C73 / C74:** these use `ConformanceHooks::requireProved()`.
The hook receives a `ConformanceBehaviourProbe` and must call `$probe->pass()`
after exercising the real path. An empty no-op stays red.

**Probe limit:** a hook that recognises it is being tested (for example
`instanceof ConformanceBehaviourProbe` then `$probe->pass()` with no real
detach / expiry / activity exercise) stays green. The probe is not a substitute
for reviewing the product hook body.

## Access-package checks (C71–C75)

Set `conformance.usesLaravelAccess: true` when the product adopts
`qiick/laravel-access`. Until then the five checks are no-ops.

- **C71:** `permission.events_enabled === true`,
  `permission.register_permission_check_method === false`, and a runtime
  `Gate::before` probe (a Spatie-shaped non-user actor must not be granted);
  proved hooks `assertRoleDetachClearsResolver` and
  `assertApiActorDeniedSuperAdmin`.
- **C73:** proved hook `assertExpiredMembershipGrantsNothing`.
- **C74:** proved hook `assertAccessActivityUuidOnly`.
- **C75:** package group-table shape (including `name` unique, `expires_at` /
  `user_id` / `role_id` indexes); Spatie tables must match the column allowlist
  on the **migrated** database in both directions (unexpected columns, missing
  required columns/types/indexes); migration text (literal / variable
  `Schema::table`, `ALTER TABLE`, sprintf / concatenation heuristics) is only
  an extra signal. Comments are stripped so examples do not false-positive.

Source: `knowledge/projects/qiick/packages/laravel-access-standards-review.md`
§3.3.

# Changelog

All notable changes to **qiick app UI** (the `@qiick` shadcn registry, theme included) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
One version covers the theme package and the registry: a release tag `vX.Y.Z` pins both.

## [Unreleased]

### Added

- CI: adds a shared Laravel / PHP compatibility matrix and database service list for qiick Composer packages. The reusable `package-matrix.yml` exports the canonical JSON so package workflows can keep their existing test jobs and required check names while consuming it with `fromJSON`. Packages can exclude unsupported PHP versions (for example, `laravel-audit` excludes PHP 8.3); the shared database targets are SQLite, MySQL 8.4, MariaDB 11.4, and PostgreSQL 17. Docs: `docs/package-matrix.md`.

- Standards: the fleet conventions F1–F11 and F14 (decision of 2026-11-24) in a new rule page `standards/rules/conventions.md`, synced into every PHP repo: published config with nested defaults and fail-fast validation, `<package>:check`, off means off, no static state, `*Event` names, `<package>:<verb>` commands with `--dry-run`, env prefix, standard columns, retention, log keys, one error shape. `standards/scripts/check-conventions.mjs` checks them statically from the standards drift check, only in repos whose `qiick-standards.json` has a `conventions` object; exceptions are `conventions.divergences` with reason, decision and review date. `standards/error-codes.json` is the fleet registry of machine `error` codes (#227).

- Standards: package dependency register in `docs/dependencies.md`, with a template and standards-drift coverage check for every runtime `composer.json` `require` entry. Affects Composer packages on the next standards pin bump and re-sync; fill in the generated register.

### Fixed

- Conformance C75 (AC17): require nullable `user_groups.organisation_id`, non-null `is_instance`, and the XOR constraint (`is_instance` true only with `organisation_id` NULL), matching qiick/laravel-access#8. Externa 1.x keeps the columns unused and stays green.

## [0.13.0] - 2026-11-22

### Added

- Conformance C71–C75 (`usesLaravelAccess`): laravel-access review AC13–AC17 — `events_enabled` + resolver clear, Spatie team UUID helper, expired membership, UUID-only access activity properties, package group-table shape with no Spatie-table alterations. Skipped until the product sets the flag. RED/GREEN proofs in the harness (#217, #219).

### Fixed

- Conformance C71–C75 re-review nits (#219 / #218): C75 Spatie allowlist is bidirectional (missing columns, type changes, dropped required uniques go red); C71 probes `Gate::before` at runtime against a Spatie-shaped non-user actor; migration scan catches sprintf / concatenation ALTER and intervening-statement `Schema::table($var)`; documents that a probe which only `$probe->pass()` after `instanceof` stays green.
- Conformance C71–C75 review hardenings (landed with #217): C75 verifies the migrated Spatie schema against a column allowlist (catches `Schema::table($var)` / `ALTER TABLE`) and keeps the migration scan as an extra signal (variable assignment, raw DDL, comment strip); C71/C73/C74 require `ConformanceBehaviourProbe::pass()` so empty no-op hooks stay red; C71 also asserts `register_permission_check_method === false` and `assertApiActorDeniedSuperAdmin`; C75 asserts `user_groups.name` unique and `expires_at` / `user_id` / `role_id` indexes.
- Conformance runner gaps from fleet re-reviews (#216 / #208, #209): C3 creates a real fixture user; every check (C37 included) runs in its own transaction/SAVEPOINT so a PostgreSQL abort cannot blind later checks; C37 asserts for real and goes red when a declared hook is a no-op; C10 rejects cascade on `api_keys.owner_id` and `principals.user_id`; C11 requires `previous_key_valid_until` as dateTime; C26 matches exact path+method pairs and honours the OpenAPI `servers` prefix; C29/C4/C5 skip only when `permission.teams` is really off and go red when teams are on with a wrong declaration or `team_foreign_key`; C2 requires `principals.organisation_id` NOT NULL with organisations and accepts `principals` as `membershipTable`. Affects every PHP app on the next pin bump and re-sync.

### Changed

- Docs: `docs/api-keys.md` and `docs/api.md` align with the 2026-11-19 decision and `qiick/laravel-api-keys` v0.1.0 — token `{product}_{live|test}_{id}{secret}`, full-token SHA-256, `api-keys.rotation_grace_hours` (max 168), and `403 ip_not_allowed` (#214).

### Upgrade notes

- **Every PHP app:** bump the three pins to `v0.13.0` and re-sync the standards pack. The conformance runner fixes in #216 and the C71–C75 hardenings in #217/#219 ship with this tag; adopt or declare divergences for any new red check.
- **Apps adopting `qiick/laravel-access`:** set `conformance.usesLaravelAccess: true`, keep `permission.events_enabled` true and `register_permission_check_method` false, implement the proved hooks (`assertRoleDetachClearsResolver`, `assertApiActorDeniedSuperAdmin`, `assertExpiredMembershipGrantsNothing`, `assertAccessActivityUuidOnly`) so they call `$probe->pass()` after exercising the real path, and ensure Spatie tables match the bidirectional allowlist.
- Before `1.0.0` a minor may include behaviour that would be major later; this release does not rename registry props or tokens.

## [0.12.0] - 2026-11-20

### Added

- Standards: fleet conformance suite (`standards/php/conformance/`, synced to `tests/Conformance/`). Every core-hardening decision ships with a check id (C1–C37): schema/behaviour/config/file, divergences with `reason` / `decision` / `review_by`, product hooks in repo-owned `hooks.php`, and RED/GREEN proofs in `standards/php/conformance-harness/` (SQLite, PostgreSQL, MySQL). Reusable `.github/workflows/conformance.yml` runs the suite on PostgreSQL 16 and MySQL 8.4. Catalogue: `standards/CONFORMANCE.md`. Binding decision 2026-11-20. Affects every PHP app on the next pin bump: sync, fill `qiick-standards.json` → `conformance`, implement hooks or declare divergences, call the workflow.
- Registry item `record-id`: `RecordId = string | number`, the shared record-id type of the items that hold records (`paginated-multi-select`, `chat-pinned-bar`, `user-avatar`, `user-hover-card`, `nav-user` / `user-info`, `files-grid`, `api-key-list-row`, `avatar-tone`). Ids from UUID APIs and legacy numeric ids both work; equality is strict, so `'7'` and `7` stay different records and no item coerces an id with `Number()` / `parseInt()` (fleet decision 2026-11-20). The item is pulled in as a registry dependency wherever it is used.
- Component tests with Vitest for `PaginatedMultiSelect`: selecting, deselecting and round-tripping the exact id, for UUID strings and numbers, including single-select. This is the first React component test in the repo; `npm test` now runs them after the script tests.

### Changed

- Docs: API responses expose record ids as UUID strings, not a bigint plus a `uuid` (`docs/api.md`); `docs/forms.md` documents `RecordId` and strict equality for the record-bearing items.

### Upgrade notes

- Every app with the affected items: re-pull them (`npx shadcn add @qiick/<item> --overwrite`); `record-id` installs as a dependency. Props that took `number` now take `RecordId`: existing numeric values compile unchanged, and UUID strings from API resources can be passed without a fork. Do not convert between the two before passing them: identity is strict.

## [0.11.0] - 2026-11-20

### Changed

- Standards: migrations freeze only at the first **stable** release (`vX.Y.Z` with no pre-release suffix). Until then `migrations-frozen.sh` prints that migrations are editable and exits 0 (ignoring `origin/main`, beta/rc tags and any `.frozen` baseline); after a stable tag it compares against the latest stable tag plus `origin/main` and `.frozen` as before. The code contract says to edit `create_` migrations and fold add/alter into them before 1.0; betas warn that an upgrade may need a fresh database. Decision 2026-11-20. Unblocks products still on betas that need to fix schema in place (instituta-core tenancy create_ on develop, signaculum-core folding its week of migrations, excubia-app despite dogfood production). externa-core (1.x) stays frozen. Affects every PHP app on the next pin bump.

### Added

- Standards: graphify agent rules in every product's `qiick-standards` block (`standards/rules/graphify.md`: query/path/explain first, `GRAPH_REPORT` only for broad review, `graphify update .` after code changes, AST-only). The standards check fails when `.gitignore` does not ignore `graphify-out/`, when any `graphify-out/` path is tracked, or when `.gitattributes` contains `merge=graphify` (local hooks only). `new-product` ensures the ignore line. Affects every repo on the next pin bump and re-sync: add `/graphify-out/` to `.gitignore` if missing; externa-core must drop its duplicate `## graphify` section outside the block when it adopts the pack version.
- Standards: a ratchet over Google Chrome's `legacy-scan` (`modern-web-guidance`, Apache-2.0, published by the Chrome team, no dependencies). The scanner finds legacy web platform patterns but always exits 0, findings or not, so there is no gate until one is written: `standards/scripts/check-legacy-web.mjs` is it, and a ratchet rather than a wall, because the fleet already carries findings and the scanner itself calls them provisional (deterministic rules for 38 of about 200 guides, a fifth of the corpus). Each repo commits what it carries in `legacy-scan-baseline.json` and only a new finding fails; a fixed one must be removed from the baseline (`--update`). Findings are keyed by **rule and file, never by line**, so an edit above a finding does not churn the baseline. The scanner version is pinned in the script (`modern-web-guidance@1.0.1`) and recorded in each baseline, since `@latest` would turn every repo red the day Chrome adds a rule; bumping it is its own PR. It runs as a step in each repo's existing lint job, never a job of its own (GitHub bills per job, rounded up to the minute). Seeded today: externa-core 15 findings, excubia-app 10, app-ui 7, the Next and Nuxt starters 0. Five of app-ui's seven are in registry components the products install (`use-autosize-textarea`, `command-palette`, `confirm-destructive-dialog`, `keyboard-shortcuts`), which is why excubia-app carries the same ones. Affects every repo with `frontendRoots`: re-sync to get `scripts/check-legacy-web.mjs` and the baseline seed, run it once with `--update`, and add the step to the lint job.

## [0.10.0] - 2026-11-18

### Changed

- Shell: the notifications bell goes in the **sidebar footer**, right above the user menu, instead of the sidebar header. That is where externa-core and instituta-core already have it, and since v0.9.0 the ⌘K search sits in the page header, so nothing is left for the bell to sit next to (`docs/shell.md`, `docs/notifications.md`). Upgrade: apps that have the bell in `SidebarHeader` (excubia-app) move it into `SidebarFooter`, before `NavUser`.

### Added

- Pattern page `docs/api-keys.md`: the API key baseline every product implements (storage columns, the `<resource>:(read|write)` scope vocabulary with `write` implying `read`, show-once secret, rotation with a grace window, immediate revocation, activity log, expiry notice, `last_used_at`, fail-closed errors) and the screen. Registry items `api-key-scopes`, `api-key-scope-picker`, `api-key-form`, `api-key-secret-dialog` and `api-key-list-row`, with `apiKeys.*` keys in `en` / `it` / `de` (#171).
- Standards: a size tripwire for god components. `max-lines` (600) and `max-lines-per-function` (300), lines of code without blank lines and comments, join the ratcheted rules in `.oxlintrc.standards.json` and `qiickRatchetedRules()`; generated Wayfinder output and `components/ui` are excluded. The function limit is measured, not guessed: across the four products' 6,922 functions p95 is 122 lines and p99 351, so 150 would baseline 283 functions while 300 baselines 93, 58 of them in files under the file limit. Seeded today: externa-core 18 files and 45 functions, excubia-app 6 and 21, instituta-core 2 and 17, signaculum-core 1 and 10. The code standard gains a Size section (`standards/rules/code.md`). Affects every repo: re-sync (the Size section is in the `AGENTS.md` core). Apps also add `eslint/max-lines,eslint/max-lines-per-function` to the `--rule` list of `lint:standards` (a rule missing there is never checked), then run it once with `--update` to seed `qiick-lint-baseline.json`.
- Drift check: coverage, not only fidelity (#172). `scripts/check-drift.mjs` reads `requiredItems` and `divergences` from the app's `qiick-standards.json` and fails on a required item that is neither installed nor declared a divergence, and on a divergence whose item is installed, is not required or has no reason. Before, an app that built its own screen instead of installing the item stayed green. Nothing changes for an app without `requiredItems`; the required list per product is still to be decided.
- Registry item `segmented-icon-item` (`SegmentedIconItem`): an icon-only segment of a segmented control with its name in a tooltip and as the `aria-label`. It sets the toggle's `data-state` from `isActive`, since a tooltip trigger around a `ToggleGroupItem` replaces it and loses the selected style. `docs/page.md` (segmented filters) and the playground Users screen use it.

### Fixed

- `app-shell`: the sidebar toggle's hover background and focus ring were cut at the header's left edge (a `-ml-1` inside an `overflow-hidden` row); only the breadcrumbs clip now. The toggle and the `leading` icons sit flush, spaced by their own padding.

## [0.9.0] - 2026-11-17

### Upgrade notes

- **Every repo:** bump the three pins to `v0.9.0`.
- **Every repo:** re-sync the standards on the next pin bump; the optional catalogue gains `timeline`. Nothing changes for an app that does not adopt it.
- **Adopting `timeline`** (first: excubia-app's upgrade plan, excubia-app#333): add `"timeline"` to `patterns` in `qiick-standards.json`, re-sync, then `npx shadcn add @qiick/timeline` (it pulls `badge`, `button`, `collapsible` and `separator` when missing) and merge the new `timeline.*` keys into `en` / `it` / `de`. Map each plan step to a `TimelineStep` (title, status, description, chips) instead of rendering it as one sentence.
- **Apps with the command palette** (excubia-app, instituta-core): `npx shadcn add @qiick/app-shell @qiick/command-palette --overwrite`, merge the new `a11y.collapseSidebar` / `a11y.expandSidebar` keys into `en` / `it` / `de`, and move `CommandPaletteTrigger` from the header actions to `AppSidebarHeader`'s new `leading` prop (in `layouts/app/app-sidebar-layout.tsx`).

### Added

- Optional pattern **timeline** (#156): the `timeline` item.
    - `Timeline` renders ordered steps as an `<ol>` on a vertical connector line: a number or icon marker, a status badge with icon and text (`done`, `current`, `pending`, `warning`, `blocked`, on the status badge variants), a title, an optional description, optional chips (`label`, `value`, or a change `previousValue → value`) and an optional count. `default` and `compact` density.
    - Past `visibleChipCount` (default 6) the chips fold behind a "Show N more" `Collapsible` button with `aria-expanded`; `lib/timeline.ts` decides the fold (never "Show 1 more").
    - Page: `docs/optional/timeline.md`. Listed in `standards/patterns.json`. New `timeline.*` locale keys.

### Changed

- `command-palette`: `CommandPaletteTrigger` is a search icon with a tooltip (name and ⌘K) instead of a search-field-shaped button; it goes in the header's `leading` slot right after the sidebar toggle, so the right side stays free for page actions (#157).
- `app-shell`: `AppSidebarHeader` takes a `leading` slot for icon controls after the sidebar toggle; the toggle has a tooltip saying "Collapse sidebar" / "Expand sidebar" with ⌘B / Ctrl+B. The playground shell shows both.

## [0.8.0] - 2026-11-17

### Upgrade notes

- **Every repo:** bump the three pins to `v0.8.0` and re-sync the standards. The local-development rule no longer names Herd. Repos then take PHP from `PATH` / `PHP_BINARY` and the Vite HTTPS certificate from `VITE_DEV_SERVER_KEY` / `VITE_DEV_SERVER_CERT`, and run Reverb with `php artisan reverb:start`. Check any script that hard-codes a Herd path.
- **Apps with list pages** (excubia-app, externa-core, instituta-core): run `npx shadcn add @qiick/page-layout --overwrite`, and merge the new `common.pageOf` key into `en` / `it` / `de`. Pass `currentPage` / `lastPage` to `TablePagination` when the page has them; without them it reads the links as before.
- **Optional:**
  - add `menubar`, `navigation-menu` or `resizable` when a screen needs them (`resizable` brings `react-resizable-panels`);
  - adopt the optional `sidebar-nav` pattern: add it to `patterns` in `qiick-standards.json`, re-sync, then `npx shadcn add @qiick/sidebar-nav`.

### Added

- Registry: the last shadcn primitives the registry lacked, `menubar`, `navigation-menu` and `resizable` (new dependency `react-resizable-panels` for `resizable`).
- Optional pattern **sidebar-nav** (`docs/optional/sidebar-nav.md`, registry item `sidebar-nav`): nav items with children as a collapsible or always-open submenu, a dropdown beside the icon in the icon-only sidebar, folding sections and a folder tree, from the shadcn sidebar blocks.

### Fixed

- `page-layout`: the list pagination no longer overflows at large page counts (#150). Page numbers come from a compact window (first, last, current ±1, ellipses; at most seven numbers, `paginationWindow` in the new `lib/pagination-window.ts`) instead of Laravel's own window; page buttons widen with longer numbers; numbers and the row counter follow the UI language's number format; below `sm` the numbers give way to "Page 3 of 120" (new key `common.pageOf`). `TablePagination` takes optional `currentPage` / `lastPage`; without them it reads them from the links as before.

### Changed

- Standards, local development: no longer names Laravel Herd as the one tool. Any local PHP environment (Flock, Herd, Valet) serves `<app>.test`; repos take PHP from `PATH` / `PHP_BINARY`, Vite HTTPS from `VITE_DEV_SERVER_KEY` / `VITE_DEV_SERVER_CERT` and run Reverb with `php artisan reverb:start`. Repos pick it up on their next pin bump and standards sync.

## [0.7.0] - 2026-11-16

### Upgrade notes

- **Every repo:** bump the three pins to `v0.7.0` and re-sync the standards. Only the AI rule changes (see below). Nothing else changes for an app without AI tools.
- **excubia-app:** already follows it (#320, PR #321); the re-sync only refreshes the AI line of the synced block.
- **externa-core:** follow it in externa-core#766 (flip the write defaults, split destructive actions, add collection and field tools).

### Changed

- **AI writes are on by default** (maintainer decision, 2026-11-16; `docs/ai-backend.md`, the AI line of `rules/backend.md`).
  - Reversible write tools now work out of the box: in the in-app assistant with approval, and over MCP for keys with `mcp:write`. `AI_TOOLS_WRITE_ENABLED` and `mcp.write_enabled` now default to `true` and turn writes off when wanted.
  - Destructive and security tools stay off by default (`AI_TOOLS_DESTRUCTIVE_ENABLED`) and are approved one call at a time. Security actions never reach MCP.
  - Upgrade notes:
    - Every repo: re-sync.
    - externa-core: flip the two defaults, and split destructive actions out of the write switch.
    - excubia-app: drop its "tools are read-only" repo rule and add the write tools.

## [0.6.1] - 2026-11-12

### Upgrade notes

- **Every app on v0.6.0:** bump the three pins to `v0.6.1`; the `ui-quality / ui-quality` check works again. Apps using `sidebar-entities`: re-pull `sidebar-entity-list`, or apply the class change to an overridden copy.

### Fixed

- `ui-quality.yml`: the contrast step failed in every app since v0.6.0 (`ENOENT … registry/src/components/ui/badge.tsx`), because the workflow checked out only `scripts/` from app-ui while `a11y-contrast.mjs` now reads the badge. It now passes the app's own badge (new input `badge-file`, default `resources/js/components/ui/badge.tsx`) and falls back to the registry's copy, which the sparse checkout now includes. Upgrade: bump the `uses:` pin; nothing else.
- `sidebar-entity-list`: the "Pinned" / "Needs attention" headings and the empty hint used `text-sidebar-foreground/70`, 3.15:1 on the light sidebar (below AA); they use the `text-sidebar-muted-foreground` token now. Upgrade: re-pull `sidebar-entity-list` (apps with an override: apply the same class change).

## [0.6.0] - 2026-11-12

### Upgrade notes

- **Every repo:** bump the three pins to `v0.6.0` (`qiick-standards.json` `ref`, the `@qiick` URL in `components.json`, every `uses: qiick-io/app-ui/.github/workflows/<workflow>.yml@…`) and re-sync the standards.
- **Every app:** after bumping the pins, `npx shadcn add @qiick/theme @qiick/badge --overwrite` (the theme changes for the dark status colours, #122, and the table scroll cue below). The `success`, `warning` and `info` badges keep their `/15` tint in dark mode too. Then make the axe smoke test assert that `color-contrast` ran (`docs/theme-tokens.md`, "Contrast check"), and pay the raw `neutral-*` entries in `ui-token-baseline.txt` (excubia-app: `nav-footer.tsx`, `text-sidebar-foreground hover:text-foreground`).
- **Every PHP repo:** re-sync. The automated-checks rule gains the PHP quality floor (PHPStan level 8 in apps, `max` in packages, the coverage ratchet) and `release.md` gains the required checks per repo. `scripts/qiick-ratchet.mjs` gains `phpstan --min-level` and a `coverage` mode; `phpstan` now also fails when `level:` is lower than on the base branch. Nothing fails until a repo calls `php-quality.yml` or passes `--min-level`.
- **excubia-app** (level 8, baseline 0 already):
  1. In `ci.yml`, add the job `php-quality: uses: qiick-io/app-ui/.github/workflows/php-quality.yml@v0.6.0` (defaults: level 8, build with `npm ci && npm run build`, floor in `coverage-floor.txt`), and drop the `PHPStan` and `Larastan baseline only shrinks` steps from the `tests` job.
  2. Commit `coverage-floor.txt`: the first run fails and prints the number, or locally with pcov / Xdebug `vendor/bin/pest --coverage-clover=build/qiick-coverage.xml && node scripts/qiick-ratchet.mjs coverage --clover build/qiick-coverage.xml --update`.
  3. Remove the local `migrations-frozen` job and `scripts/migrations-frozen.sh`, and rename the job `shared-migrations-frozen` to `migrations-frozen`, so the shared check is `migrations-frozen / migrations-frozen`.
  4. Ask the maintainer to make the required checks match `release.md`: add `php-quality / php-quality`, `pr-title / commitlint`, `app-ui-drift / drift`, `ui-quality / ui-quality` and `migrations-frozen / migrations-frozen`; drop `Migrations frozen`.
- **externa-core** (level 6, 51 baseline entries / 63 errors on `develop` on 2026-11-12): a ratchet, not a jump to 8.
  1. Add the job `php-quality` calling `php-quality.yml@v0.6.0` with `phpstan-min-level: ''` (the level may not drop and the baseline may not grow, but 6 passes), commit `coverage-floor.txt` as above, and drop the non-blocking `coverage` job of `tests.yml` (#288) and the PHPStan and ratchet steps of `quality`.
  2. One PR per level: raise `level:` to 7 and baseline its new errors (the ratchet allows it once, in that PR); pay the baseline down in later PRs; then the same for 8.
  3. At level 8, remove `phpstan-min-level: ''` so the default floor 8 applies.
  4. Ask the maintainer to make the required checks match `release.md`: add `php-quality / php-quality`, `pr-title / commitlint`, `app-ui-drift / standards`, `app-ui-drift / drift`; call `ui-quality.yml` and `migrations-frozen.yml`, rename the job `smoke` in `distribution.yml` to `distribution-smoke`, then require `ui-quality / ui-quality`, `migrations-frozen / migrations-frozen` and `distribution-smoke / smoke`.
- **excubia-core** (`max`, baseline 0, coverage gate already): optionally replace its own PHPStan, Pest coverage and `.github/assert-coverage.php` steps with `php-quality.yml` (`phpstan-min-level: max`, `coverage-thresholds: src/Checks=90 src=90`, `build-command: ''`); its lowest / stable matrix stays its own. Add the `pr-title.yml` caller, rename the job `standards` to `app-ui-drift`, and pin a release tag instead of `develop`.
- **Every app with tables (excubia-app#206, externa-core):** re-pull `npx shadcn add @qiick/theme @qiick/use-scroll-region @qiick/table @qiick/page-layout --overwrite` (`data-table` itself is unchanged; it gets the cue through `table` and `page-layout`). Merge the new `a11y.scrollableTable` key from `registry/locales/{en,de,it}.json` into the app's locale files. Nothing else: no props, wrappers or classes to add per page. Review `app-ui.overrides.json` entries for `table.tsx`, `page-layout.tsx` or `qiick-theme.css`, if any. An app whose axe test snapshots the DOM sees `role="region"` and `aria-label` on table scrollers that overflow.

### Added

- PHP quality floor (#63):
  - **Rule:** PHPStan level 8 at least in apps and `max` in packages; the level never drops and the baseline only shrinks. Apps fail CI below a committed line coverage floor (`coverage-floor.txt`, only rises); packages keep a fixed minimum per path (`standards/rules/checks.md`).
  - **Ratchet:** `qiick-ratchet.mjs phpstan --min-level <8|max>` and `qiick-ratchet.mjs coverage --clover <report>` (the floor file, `--update`, or `<path>=<percent>` minimums), from excubia-core's `assert-coverage.php`, with tests.
  - **Reusable workflow** `php-quality.yml`: PHPStan, the level floor and baseline ratchet, Pest with pcov coverage and the coverage ratchet, with the repo's synced script. Check name `php-quality / php-quality`. `scripts/new-product.mjs` adds it to `qiick.yml`.
  - **New products** start at level 8, baseline 0 and a coverage floor (`docs/new-product.md`).
  - **Required checks per repo** on `develop` and `main` in `standards/rules/release.md` (details).
- Scroll cue for wide tables on small screens (#118, for excubia-app#206): a table wider than its card fades out over the last 2rem on each side that hides columns, so phone users see that it scrolls.
    - Applies to every `Table` (its container) and every `TablePanel` (so every `DataTable`); a table that fits shows nothing, so desktop tables are unchanged.
    - `useScrollRegion` marks the hidden sides (`data-scroll-cue-left` / `-right`) on scroll, resize and content changes; the `theme` draws the fade as a mask, so it needs no colour and holds in light, dark and high contrast. The fade animates only without reduced motion and gives way to the focus ring on keyboard focus.
    - While it overflows, the scroller is a focusable region named "Scrollable table" (`a11y.scrollableTable`), so the keyboard can scroll it (WCAG 2.1.1, axe `scrollable-region-focusable`); standalone `Table`s in cards had no keyboard access before.
    - `useScrollRegion(accessibleName?)` takes an optional name and ignores containers whose own `overflow` is `visible`. Documented in `docs/list-page.md` ("Wide tables on small screens"); the playground `table` demo has a wide table in a phone-width card.

### Fixed

- `badge`: the `success` variant met only 4.42:1 in dark mode on the card and sidebar (green-400 on the `/20` tint), below WCAG AA (#77). The status variants drop `dark:bg-*/20` and use the `/15` tint in both modes: dark `success` 4.90:1, `warning` 5.47:1, `info` 6.10:1 on the card (5.62, 6.27 and 7.13:1 on the page). Light mode is unchanged.
- Status badges below AA on hover and on raised surfaces (#122). Dark `--success` and `--warning` move one step lighter (green-300, amber-300, like `--destructive` and `--info`), so the `/15` tint passes on popovers and muted rows (ink-800): dark `success` 3.87 → 5.02:1, `warning` 4.38 → 5.21:1 there. A link badge's hover now lowers the tint instead of raising it (`/25` → `/10`; dark `destructive` `/90` → `/50` under white text), so hovering only adds contrast: worst case `success` 4.32 → 5.49:1 light and 3.26 → 5.61:1 dark, `warning` 4.27 → 5.43 / 3.64 → 5.83, `info` 4.06 → 5.15 / 3.91 → 5.42, dark `destructive` 2.89 → 5.45:1. Light mode at rest is unchanged. `a11y-contrast.mjs` checks the hover state and the popover and muted surfaces too.
- `a11y-contrast.mjs` checks the status badges as they render: the variant's text on its tint, read from `badge.tsx` (or `--badge <file>`) and composited over the page, card and sidebar, in every mode and preset. The token pairs alone missed the dark tint.
- `docs/theme-tokens.md`: axe-core before 4.11.1 errors on `oklch(… none)` colours (Tailwind v4 `neutral-*`) and drops the whole `color-contrast` rule into `incomplete`; Pest's browser plugin bundles axe 4.10.3 and reads only `violations`. The page documents the assertion that keeps the rule visible.

## [0.5.0] - 2026-11-12

### Upgrade notes

- **Every app:** bump the three pins to `v0.5.0` (`qiick-standards.json` `ref`, the `@qiick` URL in `components.json`, every `uses: qiick-io/app-ui/.github/workflows/<workflow>.yml@…`) and re-sync the standards. The core pattern table renames the row "Notifications: toasts, bell and drawer", and the optional catalogue gains `table-cell-details`. Nothing else changes for an app that adopts neither.
- **Apps using `sidebar-entities` (excubia-app):** `npx shadcn add @qiick/sidebar-entity-list --overwrite`, which also pulls `@qiick/context-menu`. Pass `onTogglePin` to get the star action in the rows; pass `shouldShowPinHint={false}` to hide the empty-Pinned hint.
- **Adopting `table-cell-details`:** add it to `patterns` in `qiick-standards.json`, re-sync, then `npx shadcn add @qiick/table-cell-details`.
- **`notifications` (core):** excubia-app installs it with its in-app alerts (excubia-app#296). externa-core keeps its own copy until a follow-up moves it to the item. That move is a visible change, because the registry puts the bell in the sidebar header while Externa has it in the footer today: either move it, or list it as an override.

### Added

- Core pattern notification centre (#111): the `notifications` item, the persistent counterpart of toasts (`docs/notifications.md`, with the backend contract).
    - `NotificationsBell` sits in the sidebar header with the unread badge; `NotificationsDrawer` opens on the right with "Mark as read" per item and "Mark all as read". Clicking a notification marks it read and opens its link.
    - App-agnostic: the app maps its notification types to `{ icon, title, body, link, time }` and passes its routes to `createNotificationsSource()` (URLs or Wayfinder routes).
    - Works without realtime (the badge follows the shared prop on every visit) and live with an optional `subscribe` (Reverb). The sound is off by default, a user preference.
    - Upgrade: externa-core moves from its own copy to the item (follow-up there); re-sync the standards for the renamed row in the core pattern table.
- Optional pattern `table-cell-details` (#109): the `table-cell-details` item.
  - `TableCellDetails` keeps a table cell that holds a list on one line: a summary (a total, a count, or the first item and "+N"), then a ghost `icon-sm` button that opens the full detail in a popover at most 20rem wide, scrolling past about ten rows, and in a bottom drawer on mobile.
  - Two content variants per cell: `list` for names, `bar` for sizes or shares (bars on theme tokens, scaled against the largest value by `lib/table-cell-details.ts`, each with a visible value label).
  - The app passes the summary, title, accessible name ("Show 5 largest tables") and item labels translated; focus returns to the button on close.
  - Page: `docs/optional/table-cell-details.md`, linked from `list-page.md`. Listed in `standards/patterns.json`.
- `sidebar-entity-list` (#110): pin and unpin from the sidebar rows. `onTogglePin(entity)` on `SidebarEntityList` and `SidebarEntityFlyout` adds a star inside each row, aligned right (shown on hover and focus, always on touch screens), the same action in the row's right-click menu, and a star next to each record in the icon-only flyout. Pinned rows say "Unpin {name}", Needs attention rows "Pin {name}". After a toggle, focus follows the row into its new block. `shouldShowPinHint={false}` hides the empty-Pinned hint. Without `onTogglePin` nothing changes. The item now depends on `@qiick/context-menu`; no new locale keys.

## [0.4.0] - 2026-11-11

### Upgrade notes

- **Every repo with a `uiPreset` (excubia-app, externa-core):** re-sync. The UI block gains the two tiers of patterns: core, which every app follows, and optional, which an app adopts only through `"patterns"` in `qiick-standards.json`. It also gains the line "Optional patterns adopted in this repo". Without `patterns` nothing else changes, and no new check can fail.
- **Adopting optional patterns** is a choice per app, not part of the upgrade:
  1. add the names to `patterns` (`grouped-tabs` and `inbox-list` need a variant: `grouped-tabs:sub-menu` or `:two-rows`, `inbox-list:side-panel` or `:full-page`);
  2. re-sync;
  3. `npx shadcn add @qiick/<item>` for the items each page names.
  `command-palette`, `sidebar-entity-list` and `inbox-list` need the backend each page describes.
- **`theme`:** re-pull. The only change is the additive `[data-density='compact']` table rules, so nothing moves until an app sets the attribute.
- **`confirmation`:** re-pull it, and pass `isDestructive` for tool calls that delete. Apps that carry it as an `app-ui.overrides.json` entry (externa-core) drop the override.
- **`reasoning`:** re-pull it. It now opens while it streams. Drop any override for it.

### Added

- Optional patterns (#90): `docs/` splits into **core** patterns, which every app follows, and **optional** patterns in `docs/optional/`, which an app adopts only when they fit. `standards/patterns.json` is the catalogue. An app lists the ones it adopts in `qiick-standards.json` `"patterns"` (`"name"` or `"name:variant"`), and the sync names them in its agent files. An unknown name or a missing variant fails the sync and `--check`. The UI rule now says: ask to adopt an optional pattern instead of building a variant, and propose a new solution in app-ui instead of designing it inside one app. Upgrade: re-sync; add `patterns` only when adopting one.
- Optional pattern `keyboard-shortcuts` (#95): the `keyboard-shortcuts` item.
  - `ShortcutsProvider` runs one document listener for every shortcut a mounted component registers with `useShortcut`; the latest registration of a key wins.
  - Single-key shortcuts never fire while typing, and turn off with the user's setting (WCAG 2.1.4). ⌘ / Ctrl shortcuts never fire inside a rich-text editor, and a key another handler already took is left alone.
  - `?` opens the help dialog. `ShortcutHint` shows platform key caps.
  - `lib/shortcut-keys.ts` has the `mod+k` definitions and `RESERVED_SHORTCUTS` (⌘K palette, ⌘J Assistant, `?` help).
  - Page: `docs/optional/keyboard-shortcuts.md`. New `shortcuts.*` locale keys.
- Optional pattern `command-palette` (#91): the `command-palette` item.
  - `CommandPalette` is a ⌘K / Ctrl+K dialog. It filters local `groups` (navigation, actions) as you type, and calls a debounced, abortable server `search` for records. It keeps recent results per browser, and ⌘ / Ctrl+Enter opens a link in a new tab.
  - `CommandPaletteTrigger` is the header control.
  - It builds on `keyboard-shortcuts`.
  - Page: `docs/optional/command-palette.md`, including the backend rules: one throttled endpoint, scoped by policy. New `commandPalette.*` locale keys.
- Optional pattern `grouped-tabs` (#93): the `grouped-view-tabs` item. `GroupedViewTabs` groups a record's views by the question they answer, with open-item counts and a severity marker (icon and label) per view and per group. It comes in two variants, declared as `grouped-tabs:sub-menu` or `grouped-tabs:two-rows`. Below `sm` it is one select. Page: `docs/optional/grouped-tabs.md`, linked from the view rules in `page.md`. New `viewTabs.severity.*` locale keys.
- Optional pattern `sidebar-entities` (#92): the `sidebar-entity-list` item.
  - `SidebarEntityList` lists records under a nav item: Pinned first, in a stable order, then Needs attention, worst first and hidden when empty. "View all" ends it. Status shows as an icon with a label.
  - `SidebarEntityFlyout` opens the same blocks from the icon-only sidebar. `PinToggleButton` is the star that pins a record.
  - The optional sidebar filter: `SidebarFilterProvider`, `SidebarFilterInput`, `useSidebarFilter`.
  - Page: `docs/optional/sidebar-entities.md`, with the backend rules (pins table, deferred and cached shared prop, scoped by visibility), linked from `shell.md`. New `sidebarEntities.*` locale keys.
- Optional pattern `table-density` (#96): the `table-density-toggle` item (`TableDensityToggle`, `applyTableDensity`). The `theme` tightens table rows by 8px (a text row from 37px to 29px) under `[data-density='compact']`; controls keep their size. Page: `docs/optional/table-density.md`. New `tableDensity.*` locale keys. Upgrade: re-pull `theme` (additive rules only).
- Optional pattern `inbox-list` (#94): the `inbox-list` item.
  - `InboxSavedViews`: preset filter sets as URL links with counts, above the toolbar.
  - `InboxDetailSheet`: the item beside the list. Status, title, description and actions; then "What to do"; then collapsed sections; and "Open full page".
  - Variants: `inbox-list:side-panel` and `inbox-list:full-page`.
  - Page: `docs/optional/inbox-list.md` covers the fixed filter order, bulk actions authorized and logged per item, the item layout, empty views and one vocabulary per app. It is linked from `list-page.md`. New `inbox.*` locale keys.

### Changed

- `reasoning`: opens while the model thinks and closes when it finishes, as shadcn's AI Elements Reasoning does; once the person opens or closes it, their choice wins (#85). It used to stay collapsed. Upgrade: re-pull `reasoning`.

### Fixed

- `confirmation`: Approve takes the brand (default) variant for a call that writes and the destructive variant only with the new `isDestructive` prop, so approving a create no longer looks like a delete (#83). Upgrade: re-pull `confirmation` and pass `isDestructive` for calls that delete.

## [0.3.0] - 2026-11-10

### Upgrade notes

- **Vite+ apps (excubia-app):** set `"oxlint": true` in `qiick-standards.json`; the sync then manages `.oxlintrc.standards.json` and `.oxlintrc.i18n.json` (identical to excubia-app's, so nothing changes there). **externa-core** keeps `"eslint": true` until it moves to Vite+ in 1.5.0 (#609).

- **Every repo:** re-sync. The `AGENTS.md` / Copilot block shrinks (37.5 KB to 20.1 KB in an app with PHP, UI and distribution rules) and the sync writes the full rule pages to `.qiick/standards/`; commit that directory. If the repo's Prettier formats Markdown, add `.qiick/` to `.prettierignore` so a format run never changes the managed files.

### Changed

- Standards aligned with the decisions of 2026-11-09 / 10 (#61): **Vite+ is the frontend toolchain** and excubia-app the reference that sets the lint rules (`stack.md`, core and details; `checks.md`; the new-product guide and `scripts/new-product.mjs` keep the kit's Vite+ and write `oxlint: true`); the pack ships excubia-app's Oxlint configs (`"oxlint": true`). `stack.md` gains the local-environment rules (one database per app, re-seed instead of copies, clean up worktrees / Herd sites / databases after a task). `git.md`: issue and PR metadata at creation, branch protection and update-branch, merge commits only on `main`, merge-back through a PR, nothing personal in tracked files. `release.md`: the release PR and the merge-back take merge commits.
- Standards: progressive disclosure. Each rule page keeps its always-needed **core** in the agent files and moves the rest (casing and role-suffix table, stack versions and toolchain, backend API / security / logging / realtime / AI / operations, the automated checks list, release lifecycle, distribution steps, the UI pattern table) to `.qiick/standards/<page>.md`, with a pointer that says when to read it. Idea from mattpocock/skills `writing-for-agents` (context load, disclosure by branch).
- `rules/code.md`: new rule "Current sources, not memory": read the current official page before writing framework code or copying an upstream registry component, name the source page in the copied file, and record upstream items in the registry README (the AI Elements copies had silently gone stale). Upgrade: re-sync.
- Docs and comments say "the maintainer" (or "product decision") instead of a name: `RELEASING.md`, `docs/README.md`, the registry README and the `reasoning` item (#76). Upgrade: re-pull `reasoning` (comment only).
- app-ui's own CI reruns on an edited pull request, so a fixed title turns `pr-title` green without reopening the PR (#79).

## [0.2.1] - 2026-11-09

### Upgrade notes

- Released as a patch at Luca's call so externa-core 1.4.0 can take it; by the semver table it would be a minor (the AI Elements compound exports are removed). Only externa-core uses those items.
- **Apps with the Assistant (externa-core):** re-pull `trace`, `tool`, `reasoning`, `chain-of-thought`, `sources`, `suggestion`, `confirmation` and `ai-answer-parts` (`npx shadcn add @qiick/<name> --overwrite`), merge the locale keys (`ai.tool.*` is new, `ai.approval.*` moves into the registry), delete `components/ai-elements/use-open-state.ts`, and pass `describeToolCall` to `AiAnswerParts` with a sentence for each of your tools and actions. The compound exports (`ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput`, `ReasoningTrigger`, `ReasoningContent`, `SourcesTrigger`, `SourcesContent`, `Source`, `ChainOfThoughtHeader`, `ChainOfThoughtContent`, `ChainOfThoughtStep`) are gone.

### Added

- `date-range-picker` from externa-core (#62): one field, a two-click range on `Calendar` with a hover preview and Clear; optional `withTime` (start and end `Input type="time"`, Apply, `YYYY-MM-DDTHH:mm` in local time) and `min` / `max`. New keys `dateRangePicker.startTime`, `endTime`, `apply`. Upgrade: optional, `npx shadcn add @qiick/date-range-picker` (Excubia's custom time range, qiick-io/excubia-app#247).

### Changed

- AI Elements rebuilt on shadcn **Trace**, as shadcn did upstream (ui.shadcn.com/docs/ai-elements/base): a tool call is one line with a sentence the app writes (`AiAnswerParts` `describeToolCall`), never the JSON of its arguments and result; reasoning, chain of thought and sources are Trace lines too. New items `trace`, `suggestion` (a plain scrolling row: the ScrollArea version clipped the chips inside the answer's flex column) and `confirmation` (on `Item`). `docs/chat-and-assistant.md` describes the new answer anatomy.

## [0.2.0] - 2026-11-09

### Upgrade notes

- **Every app:** bump the three pins from `v0.1.0` to `v0.2.0` (`qiick-standards.json` `ref`, the `@qiick` URL in `components.json`, every `uses: qiick-io/app-ui/.github/workflows/<workflow>.yml@…`), then re-sync the standards pack and re-pull changed registry items (`file-card`, `chat-layout`, `alert`, `calendar`).
- New ratcheted lint rules and the thin-controller arch test ship with baselines, so existing apps stay green; new apps start at zero.

### Added

- Prose rules as ratcheted checks. `qiick-standards.eslint.js` exports `qiickRatchetedRules()`: `no-restricted-imports` (other icon / component / toast libraries, `sonner` outside `@/lib/toast`), `no-restricted-properties` (`navigator.clipboard` outside `@/lib/clipboard`), `@typescript-eslint/naming-convention` (boolean prefixes, type-aware) and `id-length`; off in a plain lint run, on with `QIICK_RATCHET=1`, ratcheted per file and rule (`qiick-ratchet.mjs lint` now takes several comma-separated rules). The architecture test gains "controllers stay thin" (at most five public methods, existing debt in `controllerPublicMethods`). Measured on externa-core `develop`: 512 naming and 130 id-length findings, 14 controllers to baseline; app-ui baselines 29 + 2. Upgrade (ESLint repos): add `...qiickRatchetedRules([...])`, a `lint:standards` script and CI step, run it once with `--update`; PHP repos: paste the controller entries the test prints into `naming-architecture.php`.
- New-product path: `docs/new-product.md` (empty repo to first green CI, required checks to ask for, a proposed `qiick-io/app-template`), `scripts/new-product.mjs` (writes `qiick-standards.json`, the `@qiick` registry in `components.json` and `.github/workflows/qiick.yml`, all pinned to one app-ui ref, then runs the sync) and `standards/rules/stack.md` (Laravel 13 React starter kit, Inertia 3, Pest 5, Node 24, ESLint + Prettier as the one lint toolchain, SQLite, Horizon, Reverb, en / it / de, Herd), synced into repos with `"app": true`. Every managed `AGENTS.md` block now links the guide. Affects every repo: re-sync; apps also get the Stack section. `docs/app-agents-section.md` is deleted.
- Pattern pages, each naming the externa-core (or excubia-app) files it follows: `forms.md` (page vs drawer vs dialog, `Field` / `FieldError`, `useForm` vs `<Form>`), `detail-page.md`, `auth.md` (Fortify, 2FA, passkeys, SSO through Signaculum with `qiick/laravel-oidc`), `roles-and-permissions.md` (`PermissionEnum`, `<app>:sync-permissions`, `permission:` middleware, policies, `useCan`), `error-pages.md`, `realtime.md`, `api.md`, `security-headers.md`, `logging-and-audit.md`, `ai-backend.md`. `standards/rules/backend.md` summarises them and is synced into PHP repos; `rules/ui.md` lists the four UI pages. Upgrade: re-sync.
- Reusable workflows so no app keeps its own copy: `pr-title.yml` (commitlint on the PR title, no dependency in the app; `rules/git.md` claimed it, now apps can run it), `ui-quality.yml` (theme-token ratchet, WCAG contrast of the installed `@qiick/theme` with app-ui's `a11y-contrast.mjs --theme-dir`, optional axe smoke browser test) and `migrations-frozen.yml` (excubia-app's forward-only migration check, freeze baseline now optional). The pack syncs `scripts/check-ui-tokens.mjs` (identical to the externa-core and excubia-app copies) and a `scripts/ui-token-baseline.txt` template into Laravel apps with a `uiPreset`. Upgrade: apps call the three workflows and may delete their own `a11y-contrast.mjs` and `migrations-frozen.sh`.
- `alert` (status variants `success` / `warning` / `info`) and `calendar` (connected range band, module-level slots for a hover preview) from externa-core's `ui/`, so its drift check covers them. `calendar` adds the `react-day-picker` dependency.

### Changed

- `files-grid`: `FileCard` follows externa-core #592 / #596. The whole card is square; the preview fills the area above a 40px name row (`cover`: edge to edge, no blurred strip); the name row has the name, a ghost `icon-xs` tag button with the tags in a `HoverCard` (only when there are tags) and a ⋮ `DropdownMenu` with the same actions as the right-click menu; folders look like files; no tab stop on the card surface. `FileGrid`: 2 columns on phones, `minmax(15rem, 1fr)` from `sm`. New locale keys `files.card.moreActions`, `files.card.tagsMenu_one` / `_other`; `files.tags.moreTags` removed. Upgrade: `npx shadcn add @qiick/files-grid --overwrite` (+ `badge`, `dropdown-menu`, `hover-card`) and merge the locale keys.
- Docs: `shell.md` (offline presence and the disabled realtime dot are solid `bg-muted-foreground`), `theme.md` (registry presets set 8 brand tokens, never the `ai` tokens), `theme-tokens.md` (radius example), `files-grid.md` (the square card). `rules/release.md` gains the release lifecycle (beta / rc, Keep a Changelog with Upgrade notes, required check names) and `rules/distribution.md` the GHCR tags, docs site, Packagist checklist and the excubia-app install-smoke exception.
- `chat-layout`: `ChatLayout` takes `isThreadOpen` for the phone layout (list or thread, full width, below `md`), `data-*` attributes for its parts (`listColumnProps`, `listProps`, `threadProps`), passes other props to its root, and marks its parts with `data-slot`. Without `isThreadOpen` it renders as before. externa-core's `/ai` and `/chat` now render through it.

## [0.1.0] - 2026-11-09

First tagged release. Everything below was on `develop` only; apps pinned `develop`.

### Upgrade notes

- **Every app:** replace `develop` with `v0.1.0` in the three pins: `"ref"` in `qiick-standards.json`, the `@qiick` URL in `components.json`, and every `uses: qiick-io/app-ui/.github/workflows/<workflow>.yml@develop`. Nothing else changes: the content is the `develop` the apps already synced.
- Optionally extend `github>qiick-io/app-ui//renovate/app-ui` in `renovate.json` so later releases arrive as PRs (see `RELEASING.md`).

### Added

- Versioning: `RELEASING.md` describes the tag that pins the registry, the standards pack and the reusable workflows together, the three places an app pins it, pre-release naming and the release commands; `renovate/app-ui.json` is a Renovate preset that bumps the three pins in one PR.
- `standards/`: the qiick standards pack, one public source of the code, testing, git, release and UI rules for every qiick repo. `scripts/sync-standards.mjs` writes it into a repo (`AGENTS.md` / `CLAUDE.md` / `.github/copilot-instructions.md` blocks, `.cursor/rules/`, `tests/Arch/NamingArchitectureTest.php`, a zero-dependency ESLint kebab-case file-name config); `drift-check.yml` gains `standards: true` (and `registry: false` for repos without the UI registry) to fail CI on a drifted copy. Affects every app: add `qiick-standards.json`, run the sync, fill `tests/Arch/naming-architecture.php`. `docs/app-agents-section.md` is superseded by the pack.
- Automated checks in the pack: knip, `noUnusedLocals` / `noUnusedParameters`, strict Eloquent models, a Larastan baseline ratchet and a hard-coded JSX text ratchet (`scripts/qiick-ratchet.mjs`), plus the self-hosted app distribution contract and the reusable `app-distribution-smoke.yml` (create-project, non-interactive install, health, upgrade from the previous tag). This repo runs knip and the i18n ratchet (registry sources: 0 literals) in CI; `knip` and `eslint-plugin-i18next` are new dev dependencies.

### Changed

- `table`, `alert-dialog`, `switch`, `toggle-group`, `badge`, `sheet` and `tooltip` re-pulled from shadcn new-york-v4: table without `forwardRef` and with a `data-slot` on every part (header cells in normal case, foreground colour, cells `whitespace-nowrap`); alert dialog with `size` (`default` / `sm`), `AlertDialogMedia`, and `AlertDialogAction` / `AlertDialogCancel` taking Button `variant` and `size` (Action defaults to `default`: pass `variant="destructive"` for deletes); switch with `size` (`default` / `sm`); toggle group with `spacing` (items keep the qiick toggle sizes); badge with `ghost` and `link` (the qiick status variants stay); sheet with `showCloseButton`; tooltip in the upstream look (`bg-foreground` / `text-background`, was `bg-primary`). Apps must check `AlertDialogAction` call sites.
- Every `ui/` item imports Radix from the single `radix-ui` package; the `@radix-ui/react-*` dependencies are gone from the items. Installing the items lets an app remove its `@radix-ui/*` packages.
- `drawer` documents its qiick additions (`DrawerNested`, `showOverlay`, focus on open, right-side width).
- Page views are line tabs under the header, each with its own URL, never a segmented control in `headerActions`: the header keeps only actions. A segmented control filters one view, in the filter row. A list row opens its record and editing becomes a row action (`docs/page.md`, `docs/dashboard.md`). Apps that switch views with a `ToggleGroup` in the header (externa-core Overview / Health) must move to tabs. `docs/page.md` gives the test (does the choice change the content, or only the rows?) and a table of the existing cases.
- `card` follows the shadcn new-york v4 card: `CardAction` and a grid header (#15).
- The theme ships as registry items, not an npm package: `@qiick/theme` (`resources/css/qiick-theme.css`) and `@qiick/theme-blue` (`resources/css/qiick-theme-blue.css`). One version covers tokens and components, and the drift check covers the theme. `packages/app-theme` is removed; the token reference is `docs/theme-tokens.md`.

### Added

- Chat patterns from externa-core: `ai-answer-parts` (an AI answer's reasoning, tool calls, chain of thought, text, sources and token usage) on the AI Elements items `shimmer`, `reasoning`, `chain-of-thought`, `tool`, `sources`, `context`, `code-block` and the `ai-message-parts` lib; human chat `chat-message-reactions`, `chat-attachment-file`, `chat-reply-quote`, `chat-pinned-bar`, `chat-mention`; `clipboard` lib; `collapsible` and `progress`. Adds `shiki`. Locale keys `ai.reasoning.*`, `ai.tool.*`, `ai.sources.*`, `ai.usage.*`, `chat.*`. `docs/chat-and-assistant.md` describes AI answers and human chat messages.
- Wave 2 patterns from externa-core: `data-table` (server-driven TanStack `DataTable`, `DataTableColumnHeader`, `DataTableFacetedFilter`, select / expand columns; adds `@tanstack/react-table`), `paginated-multi-select` (server-searched Popover + Command picker, single-select with `multiple={false}`), `removable-badge` (tag chip with a labelled remove button), `user-hover-card` (user card on hover, presence as a prop) and `spinner`. Locale keys `common.noResults`, `common.sortAscending`, `common.sortDescending`, `common.clearFilters`, `a11y.search`, `a11y.loading`, `picker.*`. The playground `#/users` screen is on `DataTable` with `ButtonGroup` row actions; `docs/list-page.md` describes both.
- `input-otp` and `slider` items (shadcn new-york-v4), with playground demos.
- `tabs` item: the shadcn new-york v4 tabs with the `line` variant, for page views (`docs/page.md`). Taken from Excubia, which tried it first.
- `stat-card` item (`StatCard`, `trendOf`): key numbers from the shadcn `dashboard-01` block (section cards), documented in `docs/dashboard.md` (#15).
- Registry items `card`, `context-menu`, `avatar`, `drawer`, `actions-overflow`, `user-avatar` (with `ConnectionDot`), `nav-user` (sidebar user menu), `files-grid` and `assistant-panel`, extracted from externa-core and made generic (props and slots instead of Inertia routes, Wayfinder and Externa types); docs point to them instead of externa-core files. Apps that already have `ui/card.tsx`, `ui/avatar.tsx`, `nav-user.tsx`, `user-info.tsx` or `user-menu-content.tsx` from the starter kit must install the items (`npx shadcn add @qiick/<name> --overwrite`) and adapt the call sites, or list the files in `app-ui.overrides.json`.
- Theme tokens `--avatar-1` … `--avatar-10` and `--avatar-foreground` (per-user avatar swatches), checked by `a11y:contrast`.
- Playground `#/files` screen.
- `AGENTS.md` (+ `CLAUDE.md`) with the UI rules for every qiick app, `docs/` with one page per pattern (shell, page, list page, settings, empty states, destructive actions, dashboard, chat and Assistant, files grid, theme), the UI section template for app repos, and `RELEASING.md`; README header.
- Drift check (#5): `scripts/check-drift.mjs` compares an app's installed registry files with the tag pinned in its `components.json`, with `app-ui.overrides.json` for intentional changes (reason required, stale entries fail), and prints a diff; reusable workflow `.github/workflows/drift-check.yml`; tests run in CI.
- Registry items extracted from externa-core 1.4.0 (#3): `ui` button, input, input-group, native-select, select, toggle, toggle-group, dropdown-menu, dialog, alert-dialog, sheet, field, badge, table, pagination, empty, switch, checkbox, radio-group, tooltip, sidebar (straight active bar), label, separator, skeleton, textarea, breadcrumb, message, bubble; `use-mobile`; components header-icon-button, page-header, page-layout, data-table-toolbar, page-empty-state, settings-form-actions, confirm-destructive-dialog, app-shell.
- `chat-layout`: list column, thread and composer of the externa-core `/ai` and `/chat` pages (#3).
- `registry/locales/{en,it,de}.json`: the translation keys the items use (#3).
- `check-ui-tokens` in `npm run lint`: no raw palette, `#hex` or arbitrary font sizes in the registry (#3).
- Playground: a demo per item and full screens (`#/users`, `#/settings`, `#/assistant`, `#/chat`, `/dark`) for side-by-side checks against externa-core (#3).
- `@qiick/app-theme` tokens extracted from externa-core 1.4.0: palette scales, light/dark/high-contrast colour tokens in the `base` cascade layer, `--brand-primary` accent (teal default), `--primary-hover`, sidebar and AI tokens, focus-ring rule, control-size scale (24/32/40 px), base and reduced-motion rules; documented in `packages/app-theme/README.md` (#2).
- `presets/blue.css` brand preset (Excubia), the shared base + brand-only model from externa-core `config/theme-presets.php` (#2).
- `npm run a11y:contrast`: WCAG 2.2 AA check of every token pair in light, dark and both high-contrast modes, for teal and every preset, including `--primary-hover`; runs in CI (#2).
- Playground shows the theme tokens with a preset and high-contrast switch (#2).
- npm workspaces for `@qiick/app-theme` and the shadcn registry, built with `shadcn build` into the committed `public/r` (#1).
- Vite playground that renders every registry item in light and dark mode (#1).
- CI: lint, Prettier, typecheck, build, stale `public/r` check and Conventional Commits; Dependabot (#1).
- `utils` registry item: `cn()` aware of the control-size spacing keys (#1).

### Fixed

- Accessibility (WCAG 2.2 AA axe sweep on externa-core):
    - `sidebar`: group labels use the new solid `--sidebar-muted-foreground` token (theme item: ink-500 / ink-400, ink-700 / ink-200 in high contrast; 4.6:1 or more) instead of `text-sidebar-foreground/70`, which failed contrast in light mode.
    - `data-table`: the select column's checkboxes have a 24px hit area with the same 16px look (`checkboxTargetClassName`, exported for hand-built tables).
    - `page-layout`: the `TablePanel` scroller joins the tab order while its content overflows (new `use-scroll-region` hook item), so the keyboard can scroll it. The hook sets `tabindex` on the node itself (React state lost it after a re-render), re-measures on any content change, and works without `ResizeObserver` (jsdom unit tests).
    - `page-header` / `data-table-toolbar`: below `sm` the filter row wraps, search full width on its own row, then the other controls; on a phone they drew on top of each other.
- `data-table` pins `@tanstack/react-table@^8.21.3`: unpinned, `shadcn add` installed v9, which drops `useReactTable` / `getCoreRowModel`. Sortable column headers (`DataTableColumnHeader`) are normal case, foreground and `text-sm` like the plain ones, as in shadcn's data table (they were muted, uppercase and `text-xs`). `data-table` cells have an `h-10` minimum, so every row is 41px like externa-core's admin tables.
- `paginated-multi-select`: the trigger (`role="combobox"`) gets an accessible name, the new `aria-label` prop or else the placeholder. A combobox takes no name from its content; axe reported it as critical (`button-name`), found by Excubia's smoke test.
- `input-group` has a transparent background in dark mode, like `input`. It had shadcn's `dark:bg-input/30`, so a search field or a password field looked lighter than the plain inputs next to it.
- `docs/page.md`: link tabs set `aria-controls={undefined}` on each `TabsTrigger`. Without it, axe reports a critical `aria-valid-attr-value` (found by externa-core's axe smoke test).
- Drift check: an override can now explain a **missing** file of an installed item, not only a changed one. The source app (externa-core) keeps `lib/list-per-page.ts` and `layout/chat-layout.tsx` elsewhere.

[Unreleased]: https://github.com/qiick-io/app-ui/compare/v0.13.0...HEAD
[0.13.0]: https://github.com/qiick-io/app-ui/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/qiick-io/app-ui/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/qiick-io/app-ui/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/qiick-io/app-ui/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/qiick-io/app-ui/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/qiick-io/app-ui/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/qiick-io/app-ui/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/qiick-io/app-ui/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/qiick-io/app-ui/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/qiick-io/app-ui/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/qiick-io/app-ui/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/qiick-io/app-ui/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/qiick-io/app-ui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/qiick-io/app-ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/qiick-io/app-ui/releases/tag/v0.1.0

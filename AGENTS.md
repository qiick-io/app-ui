<!-- qiick-standards:begin. Generated from qiick-io/app-ui standards: do not edit inside this block, run the sync (see qiick-standards.json). -->

# qiick standards

These rules bind every agent and contributor in this repo from the first task. They are the same in every qiick repo (source: https://github.com/qiick-io/app-ui/tree/develop/standards), and CI fails when this block differs from the source. Rules for this repo only live outside this block; where they are more specific, they win. Starting a new qiick product: https://github.com/qiick-io/app-ui/blob/develop/docs/new-product.md.

## Code standard

Every file follows classic craftsmanship, including files nobody reads line by line: self-explanatory names, English documentation of _why_ and of domain invariants, clean structure with breathing room, and no duplication.

### Simplest thing that works

Stop at the first rung that holds: YAGNI, standard library, platform, installed dependency, one line, then the minimum code.

- No unrequested abstractions, dependencies or boilerplate. A new Composer or npm dependency needs the maintainer's OK.
- Deletion over addition. Boring over clever. Fewest files possible.
- Mark an intentional shortcut with a `ponytail:` comment that names the ceiling and the upgrade path.
- Never lazy about trust-boundary validation, data-loss prevention, security, accessibility, or anything explicitly requested.
- Non-trivial logic leaves one runnable check behind (a test).

### Current sources, not memory

Before writing framework or library code, or copying a component from an upstream registry (shadcn, AI Elements), read the current official page for the installed version. Training data and old copies go stale: until 2026-11-09 the registry's AI Elements were a superseded release, and nobody had compared them with the current pages. A file copied from upstream names its source page in its header comment, and the registry README records the source and date of every upstream item.

### Names: full words

- No single letters (`x`, `e`, `q`) and no abbreviations (`cfg`, `res`, `req`, `val`, `arr`, `tmp`, `idx`, `usr`, `ctx`, `def`, `cb`). Full words even at 30+ characters (`$collectionFieldDefinition`, `handleFormSubmissionError`).
- `i`, `j`, `k` only as indices of tight numeric loops; prefer `foreach ($collectionItems as $collectionItem)`, `for...of`, `.map()`.
- **Booleans** (variables, columns, custom props, boolean-returning methods) start with `is`, `has`, `can` or `should` (`$isEmailVerified`, `canManageCollection()`, `shouldBroadcastImmediately`). Exempt: names fixed by a framework or library contract (see [Contracts](#contracts-never-break-them)).
- **Collections** use specific plurals (`$publishedArticles`) or explicit maps (`$usersIndexedById`), never `$data`, `$list`, `$arr`.
- Every class of our own ends with its role suffix (`*Controller`, `*Action`, `*Service`, `*Data`, `*Enum`, `*Job`, …); only Eloquent models use bare nouns. The full table is in the details.
- **Never rename framework or package scaffolding:** files native to Laravel or published by a package keep their upstream names: Fortify actions (`app/Actions/Fortify/*`), starter-kit files (`HandleInertiaRequests`, `HandleAppearance`, `app/Concerns/*`), default service providers, vendor-published files (Spatie, Horizon, Telescope, Pennant, Passport), and frontend primitives (`shadcn/ui` files in `components/ui/`). They are listed in the repo's `tests/Arch/naming-architecture.php`, never renamed.

### Architecture: five layers

1. **Thin controllers.** At most the 5 resource methods or one `__invoke`, about 10 to 15 lines each, doing three things: receive a typed `*Request`, call an `*Action` / `*Service` with a `*Data` DTO, return a `*Resource`, JSON or an Inertia page. No business logic, no `DB` facade.
2. **Domain layer.** Writes in `app/Actions/*Action.php`, orchestration and reads in `app/Services/*Service.php`, typed `readonly` DTOs in `app/Data/*Data.php` instead of `array<string, mixed>` between controllers, actions, services and jobs.
3. **Clean models.** Relationships, `casts()`, accessors / mutators, scopes (or an `app/Builders/*Builder.php`), table constants. Never HTTP calls, disk or S3 work, or multi-step orchestration in a model.
4. **Authorization in Policies**, called through `Gate::authorize()` or a FormRequest `authorize()`, not scattered checks.
5. **One domain for every surface.** The Inertia UI, the REST / GraphQL API, MCP / AI tools and the CLI call the same `*Action` and `*Service` classes; domain logic is never duplicated per surface.

The Pest architecture test (`tests/Arch/NamingArchitectureTest.php`) enforces the suffixes, readonly DTOs, `declare(strict_types=1)`, no debugging helpers, no `env()` outside `config/`, no `DB` facade in controllers, and at most five public methods per controller (existing debt ratcheted in `naming-architecture.php`).

### Formatting

- Curly braces on every `if`, `else`, `for`, `foreach`, `while`, `do`. No single-line braceless control statements.
- A blank line before and after control-flow blocks (`if`, `return`, `for`, `foreach`, `while`, `switch`, `try`, `throw`); ESLint `@stylistic/padding-line-between-statements` and Pint enforce it where configured.
- `declare(strict_types=1);` in every PHP file you write or touch.
- No `dd`, `dump`, `ray`, `var_dump`, `console.log` left behind. No `env()` outside `config/`.
- Strict DRY: extract shared validation rules, scopes, DTO shapes and UI primitives instead of copying blocks.

### Documentation (English PHPDoc / JSDoc)

This replaces the "comment only exceptionally complex logic" default of Laravel Boost and similar guidelines.

- **Class, component and hook docblock** (mandatory): the unit's responsibility and why it exists.
- **Method and function docblock** for what the signature cannot say:
    1. Array shapes and generics for PHPStan / Larastan (`@param array{title: string, slug: string} $validatedPayload`, `@return Collection<int, CollectionItem>`).
    2. Side effects: queued jobs, dispatched events, filesystem / S3 writes, external HTTP calls.
    3. Business invariants, why a guard exists, `@throws` conditions.
- No noise that restates the code (`// set loading to true`).

### Contracts: never break them

1. **Migrations are forward-only.** Never edit, rename or delete a migration in `database/migrations/` once it is merged into a released version: existing self-hosted installs would no longer upgrade. A schema or stored-data change is a new migration with a safe backfill. The reusable `migrations-frozen.yml` fails CI when a migration on `main`, on the latest tag or in `database/migrations/.frozen` changes. A repo that has not released yet may state a pre-release exception in its own section.
2. **Framework method contracts keep their names** (no `is` / `has` prefix forced on them): `FormRequest::authorize()`, Policy methods (`viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`), `Rule::passes()` / `ValidationRule::validate()`, `broadcastWhen()`, `shouldQueue()`.
3. **Native and library props keep their names:** `disabled`, `required`, `checked`, `open`, `defaultOpen`, `readOnly`, `asChild`, `modal`, `preserveScroll`, `preserveState`, `replace` (DOM, React, Radix / shadcn, Inertia). The prefix rule applies only to our own props and state.
4. **Wire formats stay stable** when a PHP class is renamed: REST JSON keys, GraphQL type and field names, webhook payloads, `broadcastAs()` names, Inertia page paths, named routes, morph maps (`Relation::enforceMorphMap`), queued job class names. Enum backing values stay identical.
5. **Convention-driven directories** (`app/GraphQL/`, `app/Ai/`, MCP tools) keep the names their resolver expects unless the resolver mapping changes in the same PR.
6. **Mechanical renames and behaviour changes never share a PR.** Land the `git mv` + import updates first with green tests, then extract or change logic in a separate PR.

**Details:** `.qiick/standards/code.md`. Read it before creating or renaming a file, class, enum, job, command or other PHP / TypeScript unit.

## Testing

- Pest for PHP (`*Test.php`), Vitest or `node:test` for TypeScript / scripts. Test behaviour, not private structure.
- Every behaviour change adds or updates a test that fails without the change. Pure copy, styling or layout changes need none.
- Never delete, skip or weaken an existing test to get green; ask the maintainer first.
- No real network, AI provider or external process in tests: `Http::fake()`, `Process::fake()`, recorded fixtures, fake providers.
- Use model factories (and their states) for test data.
- UI flows that only a browser proves (navigation, dialogs, keyboard, focus) get a Pest browser test (`tests/Browser`, `pestphp/pest-plugin-browser`) where the repo has the plugin; check light and dark.
- `tests/Arch/NamingArchitectureTest.php` stays green. A new class satisfies its role suffix; scaffolding is listed in `tests/Arch/naming-architecture.php`, never renamed.
- Run the narrowest tests while iterating (`--filter`, a file path), and the repo's full quality gate (listed in its own section) before every push.

## Git, commits and pull requests

- **English everywhere in the repo:** code, comments, docs, commit messages, issues, pull requests.
- **Conventional Commits:** `type(scope): summary` in the imperative, lower case, no trailing period. Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `ci`, `build`, `security`. `!` or a `BREAKING CHANGE:` footer for breaking changes. commitlint checks PR titles in CI through the reusable `qiick-io/app-ui/.github/workflows/pr-title.yml` (check `pr-title / commitlint`), which every repo calls on `pull_request` with the `edited` type.
- **One issue, one branch, one pull request.** Branch from `develop` as `<type>/<issue>-<kebab-slug>` (`feat/42-project-registration`). Never commit directly to `develop` or `main`.
- Pull requests target `develop` and are **squash-merged**, so the PR title becomes the commit: make it a valid Conventional Commit. The body says what changed, why, and `Closes #<issue>`.
- **Every issue and pull request gets its metadata when it is created:** assignee (the maintainer), labels from the repo's set, the milestone of the release it belongs to, and the repo's GitHub project when it has one.
- **Branch protection** (every public repo): `develop` and `main` change only through a pull request with green required checks; admins are not exempt. When a PR is behind its base, update the branch (`gh pr update-branch`) and wait for the checks again. `main` takes **merge commits** only (a ruleset): release PRs, and the merge of `main` back into `develop` after a tag, which is a pull request too.
- Never force-push a shared branch, never `--no-verify`, never `--admin` or any branch-protection bypass.
- No attribution or `Co-authored-by` trailers for tools or agents.
- Never commit `.env`, secrets, tokens, personal phone numbers or email addresses; only `.env.example`.
- Nothing personal in tracked files: no absolute local paths (`/Users/…`), no one's own editor or agent configuration (keep it in `.gitignore`), and "the maintainer" instead of people's names in code, comments and docs. Describe what code does rather than which product it imitates; naming a product is fine where it is an integration (an importer, a compatible endpoint).
- Ask the maintainer before: a new dependency, anything outside the issue's scope, repo settings (branch protection, required checks, secrets), paid services or accounts.

## Releases: never without the maintainer

`develop` is the integration branch. `main` holds releases only.

Agents may, when asked for a release:

- open a `develop` → `main` release pull request with a full body (changelog, included PRs), then **stop**.

Agents must not, unless the maintainer explicitly says so in this conversation:

- merge a release pull request or anything into `main` / `release/*`;
- bump versions, create tags (`vX.Y.Z` or any other), run `gh release create` or publish a GitHub Release;
- push to `main` / `master` / `release/*`;
- publish packages (Packagist, npm) or images (Docker Hub, GHCR);
- change repository visibility.

How a release goes, for reference: release PR → the maintainer merges it with a **merge commit** (never squash: `main` must stay an ancestor of `develop`) → tag `vX.Y.Z` on the merge commit → GitHub Release titled exactly with the tag, listing the included PRs → `main` is merged back into `develop` through a pull request, also with a merge commit.

**Details:** `.qiick/standards/release.md`. Read it before preparing a release PR or the CHANGELOG, bumping a version, or asking for required checks.

## Automated checks

Machines enforce these in CI; keep them green, and never silence one to get green. Fix the new finding; a baseline only shrinks.

**Details:** `.qiick/standards/checks.md`. Read it before fixing a failing check, or touching a baseline, `knip.json`, a ratchet or the strict-model setup.

## UI (qiick app UI)

No agent invents a layout, a component, a colour or a component position in a qiick app. The only exceptions are explicit overrides (rule 2).

### Before any UI change

Patterns come in two tiers. **Core** patterns bind every qiick app. **Optional** patterns are accepted solutions that bind only the apps that adopt them, by listing them in `qiick-standards.json` `patterns`. Optional patterns adopted in this repo: none.

1. Find the pattern in the tables in the details and read its page: each one names the registry items, and the reference app files where they are not in the registry yet.
2. Install it from the `@qiick` registry with `npx shadcn add @qiick/<name>`; do not rewrite it. The registry list: https://github.com/qiick-io/app-ui/blob/develop/registry/README.md
3. If the registry does not have it yet, copy it from the reference app the page names, file by file.
4. When a screen needs what an optional pattern solves and this app has not adopted it, ask the maintainer to adopt it (add it to `patterns`). Do not build a variant of your own.
5. If no core or optional pattern fits, **stop and ask the maintainer**. A new solution is proposed in app-ui as an optional pattern, never designed inside one app.

### Hard rules

1. **Source of truth.** The `@qiick` registry; until an item ships there, the reference app its pattern page names. Copy, never redesign.
2. **Overrides.** An intentional difference from the registry is listed in the app's `app-ui.overrides.json` with a reason per file. Any other difference fails the drift check in CI.
3. **Primitives.** shadcn components only (the registry `ui` items). Icons: `lucide-react` only. No Headless UI or other component libraries.
4. **Colours.** Theme tokens only (`bg-primary`, `text-muted-foreground`, `border-sidebar-border`, …). No hex and no raw palette classes (`bg-teal-600`, `text-neutral-500`) in `className`; no arbitrary font sizes (`text-[11px]`).
    - AI surfaces use the violet `ai` token set (`bg-ai`, `text-ai-text`, `border-ai-border`, …), never the brand primary.
    - Status colours (`success`, `warning`, `destructive`, `info`) carry status only; never use one as a brand or primary colour.
5. **Control scale.** `sm` 24px, default 32px, `lg` 40px. The default (32px) everywhere: headers, toolbars, forms, settings. `sm` only for compact inline actions (table row icons, chips); `lg` for rare large CTAs.
6. **Accessibility.** WCAG 2.2 AA in light, dark and high contrast: visible focus, keyboard reachability, labels / `aria-label` on icon-only controls, contrast. Check every UI change in light and dark.
7. **Positions are part of the pattern.** Where a control sits (primary action far right, filters left, pagination counter left / pages centre / rows per page right, …) is copied like the code.
8. **Presence.** shadcn `AvatarBadge` inside the `Avatar`, bottom-right. Users: green online, solid grey offline (never transparent). The realtime badge on the signed-in user: green connected, amber connecting, grey disabled, red only when the connection is lost. Member lists show avatars without presence, then `AvatarGroupCount` "+N".

### Theme

Tokens come from the `@qiick/theme` registry item: one shared base (surfaces, the two-tone shell, text, borders) plus brand-only presets (Teal = Externa, Blue = Excubia). An app picks its preset and never edits surface tokens. This repo's preset: **Teal**.

**Details:** `.qiick/standards/ui.md`. Read it before making any UI change (it has the table of pattern pages).

<!-- qiick-standards:end -->

# This repo: qiick app UI

Rules for working in `qiick-io/app-ui` itself, on top of the qiick standards above.

- This repo is the **source** of the UI rules and of the standards pack. Every deliberate change from the reference app is listed in [`registry/README.md`](registry/README.md); copy code from the reference app a pattern page names, do not redesign.
- A new shared solution becomes an **optional pattern** ([`docs/optional/`](docs/optional/README.md)): registry items, a playground route, an entry in `standards/patterns.json` and a page from the template.
- Pattern pages: [`docs/`](docs/README.md). Theme: [`docs/theme.md`](docs/theme.md).
- An item from an upstream registry (shadcn, AI Elements) records its source page, style and date in [`registry/README.md`](registry/README.md). Before adding, re-pulling or changing one, read the current upstream page and say in the PR what changed upstream.
- Commit `public/r` with the registry sources (`npm run build`); CI fails when it is stale.
- Quality gate before a PR: `npm run lint`, `format:check`, `types:check`, `registry:check`, `a11y:contrast`, `test`, `standards:check`.
- Releases: [`RELEASING.md`](RELEASING.md).

## The standards pack

[`standards/`](standards/README.md) holds the rules every qiick repo follows. Change a rule there (never in a synced copy), run `npm run standards:sync` so this repo's own copy follows, and say in the PR which repos must re-sync.

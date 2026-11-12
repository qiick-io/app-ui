# Starting a new qiick product

From an empty repository to a first green CI, in order. The product spec says _what_ to build; everything about _how_ (stack, structure, UI, code, tests, CI, release, distribution) is in this repo, and CI enforces it. Read this page once, then the managed block of the new repo's `AGENTS.md` (written in step 3) before every task.

Throughout: `<app>` is the product's kebab-case name (`externa`, `excubia`), used for the repo `qiick-io/<app>-core` or `<app>-app`, the Composer package `qiick/<app>-…`, the Artisan namespace `<app>:` and the Herd site `<app>.test`. `vX.Y.Z` is the latest app-ui release (https://github.com/qiick-io/app-ui/releases).

## 1. Create the app from the starter kit

The exact stack and versions: [`standards/rules/stack.md`](../standards/rules/stack.md).

```bash
laravel new <app> --react --pest --npm --database=sqlite --git
cd <app>
herd link && herd secure
```

Then, in one `chore: bootstrap` commit on `develop` (the default branch for work; `main` holds releases only):

- `.nvmrc` with `24`, `"engines": { "node": "24.x" }` in `package.json`.
- Lint and format: keep the kit's **Vite+** setup as it is (`vp check` with Oxlint and Oxfmt); never replace it with ESLint or Prettier. The standards sync adds `.oxlintrc.standards.json` and `.oxlintrc.i18n.json`; add the scripts `lint:standards` and `lint:i18n` as excubia-app has them.
- `composer require laravel/horizon laravel/reverb spatie/laravel-permission spatie/laravel-activitylog` and `composer require --dev larastan/larastan laravel/boost` (each is part of the stack; nothing else without the maintainer).
- `react-i18next` with `en`, `it`, `de` from the first screen.
- `AppServiceProvider::boot()`: `Model::shouldBeStrict(! app()->isProduction())`.

## 2. Pin app-ui and scaffold the qiick files

From an app-ui checkout at the release tag:

```bash
git -C ../app-ui fetch --tags && git -C ../app-ui checkout vX.Y.Z
node ../app-ui/scripts/new-product.mjs --target . --name <app> --preset Teal
```

It writes, all pinned to the same `vX.Y.Z`:

| File                          | What                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qiick-standards.json`        | `ref`, `uiPreset`, `php`, `frontendRoots`, `oxlint: true`, `app: true`, and later `patterns` (the [optional patterns](optional/README.md) it adopts)                   |
| `components.json`             | the `@qiick` registry at `https://raw.githubusercontent.com/qiick-io/app-ui/vX.Y.Z/public/r/{name}.json`                                                               |
| `.github/workflows/qiick.yml` | the reusable checks: PR title, drift (standards + registry), PHP quality (PHPStan floor, coverage floor), UI quality, frozen migrations, distribution smoke            |
| the standards sync            | `AGENTS.md` / `CLAUDE.md` / copilot blocks, `.cursor/rules`, `tests/Arch`, `.oxlintrc.standards.json`, `.oxlintrc.i18n.json`, `knip.json`, `scripts/qiick-ratchet.mjs` |

The preset is the product's brand colour. A product without a preset of its own uses Teal until the maintainer adds one to the registry (`@qiick/theme-<colour>`).

## 3. Agent files

- Fill `tests/Arch/naming-architecture.php`: the root namespace and the starter-kit scaffolding (Fortify actions, `HandleInertiaRequests`, `HandleAppearance`, `app/Concerns/*`), one reason per entry.
- Below the managed block in `AGENTS.md`, add **only** the repo's own rules: the product in two sentences, its quality-gate commands, and any pre-release exception (for example "migrations may change until v1.0.0-beta.1").
- Run `php artisan boost:install`: Boost writes its own block; the qiick block wins where they disagree.

## 4. UI: theme, shell and the first pages

```bash
npx shadcn@latest add @qiick/theme @qiick/shadcn-utilities --overwrite          # + @qiick/theme-blue for Excubia-blue products
npx shadcn@latest add @qiick/app-shell @qiick/nav-user @qiick/page-layout @qiick/page-header @qiick/toast @qiick/sonner --overwrite
```

Then follow [`registry/README.md`](../registry/README.md#requirements-in-the-app) (CSS imports, `TooltipProvider`, locale keys merged into `en` / `it` / `de`). Every screen starts from a pattern page in [`docs/`](README.md); a screen with no pattern and no externa-core equivalent is a question for the maintainer, never a new design.

## 5. Backend skeleton

Follow [`standards/rules/backend.md`](../standards/rules/backend.md) and these pages, copying the externa-core files they name:

1. Auth pages and SSO through Signaculum ([`auth.md`](auth.md)).
2. Roles and permissions with `<app>:sync-permissions` ([`roles-and-permissions.md`](roles-and-permissions.md)).
3. Error pages 403 / 404 / 500 / 503 ([`error-pages.md`](error-pages.md)).
4. Security headers ([`security-headers.md`](security-headers.md)) and logging / activity log ([`logging-and-audit.md`](logging-and-audit.md)).
5. `GET /health/live` (process up, no I/O) and `GET /health/ready` (database, and Redis when configured; `503` otherwise), outside auth and rate limits: externa-core `routes/health.php`, `app/Http/Controllers/HealthController.php`, `app/Support/Health/ReadinessChecks.php`.
6. `php artisan <app>:install` (interactive, plus `--no-interaction --force` for CI) and `php artisan <app>:upgrade` (migrate, `<app>:sync-permissions`, caches, version steps), as externa-core `app/Console/Commands/InstallCommand.php` / `UpgradeCommand.php` (externa still calls its permissions command `permissions:sync`; see [`roles-and-permissions.md`](roles-and-permissions.md)). The rules: [`standards/rules/distribution.md`](../standards/rules/distribution.md).
7. A `Dockerfile`, `docker-bake.hcl` and `docker-compose.yml` like externa-core (multi-stage on `php:8.4-fpm-bookworm`, Node 24 for the Vite stage, Nginx in the `production` stage, `docker/entrypoint.sh` that runs migrations only when `RUN_MIGRATIONS=true`), and a release workflow job that pushes `ghcr.io/qiick-io/<repo>` for linux/amd64 + arm64 on `v*` tags (externa-core `.github/workflows/docker.yml`, job `ghcr-publish`).

API, realtime and AI only when the spec asks for them: [`api.md`](api.md), [`realtime.md`](realtime.md), [`ai-backend.md`](ai-backend.md).

## 6. CI

The app's own workflow runs the quality gate on every push and PR to `develop` / `main`: `composer install`, `npm ci`, `npm run build`, `pint --test`, `php artisan test`, `npm run lint`, `format:check`, `types:check`, `knip`, `lint:i18n`, and the axe smoke test (`tests/Browser/A11ySmokeBrowserTest.php`) on PRs. `.github/workflows/qiick.yml` from step 2 adds the shared checks, among them `php-quality` (PHPStan, its ratchet and Pest with coverage).

A new product starts at the quality floor and never goes below it ([automated checks](../standards/rules/checks.md)):

- **PHPStan level 8, baseline 0:** `level: 8` in `phpstan.neon` and no `phpstan-baseline.neon`. Fix every error from the first commit; the ratchet fails on a lower level and on any baselined error.
- **A coverage floor:** after the first green test run with coverage, commit the total as `coverage-floor.txt`. Locally, with pcov or Xdebug: `vendor/bin/pest --coverage-clover=build/qiick-coverage.xml && node scripts/qiick-ratchet.mjs coverage --clover build/qiick-coverage.xml --update`. Without the file the `php-quality` job fails and prints the number to commit. Raise it with `--update` whenever coverage grows by a point or more.

Push the bootstrap to `develop`, open a PR for the first feature, and get every check green.

## 7. Ask the maintainer to protect the branches

Agents never change repository settings. Ask the maintainer to:

- require these checks on `develop` and `main` (names as GitHub shows them):
    - the app's own jobs (tests on SQLite, lint / types / format, the accessibility smoke);
    - `pr-title / commitlint`, `app-ui-drift / standards`, `app-ui-drift / drift`, `php-quality / php-quality`, `ui-quality / ui-quality`, `migrations-frozen / migrations-frozen`, `distribution-smoke / smoke`;
- allow squash merges only, and delete branches after merge;
- add Renovate (or keep Dependabot) with the app-ui preset from [`RELEASING.md`](../RELEASING.md#how-apps-pin-and-upgrade), so app-ui releases arrive as PRs;
- create the Packagist package and the GHCR package once the first release is tagged.

## A template repository (proposed)

Steps 1–3 are the same for every product, so they could live in a GitHub template repository `qiick-io/app-template` (not created yet: the maintainer decides). It would contain the starter kit after step 1, the output of step 2 with a placeholder `<app>` name, the filled `tests/Arch/naming-architecture.php`, the theme and shell from step 4, `/health/live|ready`, `InstallCommand` / `UpgradeCommand` stubs, the error pages, the `Dockerfile`, `docker-compose.yml`, the CI and release workflows, and a `bin/rename <app>` script that replaces the placeholder. Until it exists, `scripts/new-product.mjs` and this page are the path.

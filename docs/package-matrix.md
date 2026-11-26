# Package compatibility matrix

Every qiick Composer package consumes the same PHP / Laravel compatibility
matrix and database service definitions from
[`standards/package-matrix.json`](../standards/package-matrix.json). The
reusable [`.github/workflows/package-matrix.yml`](../.github/workflows/package-matrix.yml)
exports those values as JSON for package workflows to expand with `fromJSON`.
It does not run package tests: test jobs stay in each package's CI so their
required check names remain stable.

## Shared targets

| Axis                | Values                                      |
| ------------------- | ------------------------------------------- |
| PHP                 | 8.3, 8.4, 8.5                               |
| Laravel             | 12, 13                                      |
| Dependency versions | `lowest`, `stable` (`composer update` mode) |
| Orchestra Testbench | 10 (Laravel 12), 11 (Laravel 13)            |

`exclude-php-versions` is an optional JSON array input for a package whose PHP
minimum is higher than the shared minimum. `laravel-audit` requires PHP ^8.4,
so its call excludes `8.3`; the other six packages use the full PHP axis.
Unknown versions and exclusions that remove every PHP version fail the export.

The shared database targets are:

| Engine             | Connection | Service image (digest-pinned)          |
| ------------------ | ---------- | -------------------------------------- |
| SQLite             | `sqlite`   | None; exercised by the PHP test matrix |
| MySQL 8.4          | `mysql`    | `mysql:8.4@sha256:…`                   |
| MariaDB 11.4 (LTS) | `mariadb`  | `mariadb:11.4@sha256:…`                |
| PostgreSQL 17      | `pgsql`    | `postgres:17@sha256:…`                 |

The `databases` output contains only the three server databases, with their
service environment, ports, health checks, and credentials. SQLite needs no
service container and remains covered by the package's regular Pest matrix.
Exact image digests and service settings live in
`standards/package-matrix.json`. Every package aligns its database versions
when it adopts the matrix; package-specific Redis and Memcached checks remain
in the packages that use them.

## Pull requests: only what the change can break

The org's Actions queue is shared by every repo, so a pull request runs a
reduced plan (decision of 2026-11-24) and the full matrix runs after the merge.
`package-matrix.yml` picks the variant itself (`variant: auto`): `pr` on
`pull_request`, `full` on push, schedule and manual runs. The `pr` rules are
data in `standards/package-matrix.json` (`pr`), applied to the files the PR
changes:

| The PR changes                                   | It runs                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| only docs (`*.md`, `docs/`, `LICENSE`)           | nothing: every job reports success with its steps skipped                                   |
| anything else                                    | lint, PHPStan and Pest on the highest cell (highest PHP, highest Laravel, `stable`, SQLite) |
| `composer.json` or `src/`                        | also the lowest cell (lowest PHP, lowest Laravel, `lowest`)                                 |
| `database/`, models, stores, queries, migrations | also the server databases (PostgreSQL, MySQL, MariaDB)                                      |
| `src/Erasure/`, `tests/Erasure/`, workflow YAML  | also the server databases for erasure verification                                          |
| `tests/Pest.php`, `*TestCase.php`, `phpunit.xml` | also the server databases because test setup can change how erasure runs                    |
| classes in `src/` (not `src/Testing/`)           | mutation on those classes only, with the per-class gate; a deleted class is not mutated     |

Any `.github/workflows/*.yml` or `.yaml` file can contain the erasure CI step,
so changes to those files select the server databases too.

On push to `develop` and `main`, nightly and on `workflow_dispatch`, the
`full` variant runs everything: the whole matrix, the databases, mutation on
every class. A nightly failure opens an issue, so nobody has to watch the
nightly run.

**Never skip a job, skip its steps.** A required check that never reports
stays pending forever (`rules/checks.md`, CI cost), so the jobs always run:
both test cells carry `skip: true` on a docs-only PR, and the lowest cell also
carries `skip: true` when the PR changes neither `composer.json` nor `src/`.
The database jobs read `run-databases`. The mutation job reads `mutate-classes`
(an empty list passes at once), and lint, PHPStan and every other required job
read `docs-only`.
A docs-only PR runs no tests, yet every required check reports success under
its usual name. Never use `paths:` or `paths-ignore:`.

**Only jobs a PR always reports can be required checks.** These include the
highest cell (`PHP 8.5 Laravel 13 stable`), the lowest cell, the database jobs,
the mutation gate (`Mutation (per-class ≥95%)`), lint and PHPStan. The other
cells run on the full variant. `node scripts/check-repo-settings.mjs <repo>`
reports required package cell names outside the PR plan, including before
adoption. Keep `packagePhpVersionExclusions` in `standards/repo-settings.json`
aligned with any package-specific `exclude-php-versions` inputs.

```yaml
on:
    push:
        branches: [main, develop]
    pull_request:
    schedule:
        - cron: '17 3 * * *' # nightly full run
    workflow_dispatch:

concurrency:
    group: ${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}
    cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
    tests:
        # …as below, and every step guarded:
        steps:
            - if: ${{ !matrix.skip }}
              uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6

    databases:
        services:
            database:
                # An empty image starts no container on a PR that does not need it.
                image: ${{ needs.package-matrix.outputs.run-databases == 'true' && matrix.database.image || '' }}
        steps:
            - if: needs.package-matrix.outputs.run-databases == 'true'
              run: vendor/bin/pest

    phpstan:
        name: PHPStan
        needs: package-matrix
        steps:
            - if: needs.package-matrix.outputs.docs-only != 'true'
              run: vendor/bin/phpstan analyse

    mutation:
        name: Mutation (per-class ≥95%)
        needs: package-matrix
        steps:
            # scripts/mutate-per-class.sh mutates the classes in MUTATE_CLASSES
            # (a JSON array; empty means nothing to mutate), or every class when
            # MUTATE_SCOPE is `all`.
            - run: bash scripts/mutate-per-class.sh
              env:
                  MUTATE_SCOPE: ${{ needs.package-matrix.outputs.mutate-scope }}
                  MUTATE_CLASSES: ${{ needs.package-matrix.outputs.mutate-classes }}

    nightly-failure:
        needs: [tests, databases, mutation]
        if: failure() && github.event_name == 'schedule'
        runs-on: ubuntu-latest
        permissions:
            issues: write
        steps:
            - run: gh issue create --repo "$GITHUB_REPOSITORY" --title "Nightly CI failed on $(date -u +%F)" --body "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" --label bug
              env:
                  GH_TOKEN: ${{ github.token }}
```

## Required check names

The exporter is a separate, small check (`package-matrix / export`). The PHP and
database test jobs remain defined in each package's CI and keep their current
`name:` values, such as `PHP 8.4 Laravel 12 stable` and `Pest on PostgreSQL 17`.
GitHub therefore does not add the reusable-workflow caller name to those
existing required checks. Do not move those test jobs into the reusable
workflow; called jobs are shown under their caller in GitHub Actions and would
change the status-check names.

## Policy for adding and dropping versions

- **Add** a PHP or Laravel major when the fleet is ready (the framework and
  Testbench line are released and at least one package has proved it green).
  Update `standards/package-matrix.json` and this page in the same app-ui PR;
  packages adopt on their next app-ui pin bump.
- **Drop** a PHP or Laravel major only when fleet support ends. Dropping one
  is a **major** release for each affected package because its Composer support
  and CI matrix both narrow.
- If a Laravel major does not support every PHP version, add the combination
  to the canonical `matrix.exclude`. Use `exclude-php-versions` only for a
  package-specific PHP minimum such as `laravel-audit`.

## Package adoption

For each package (`laravel-oidc`, `laravel-outbound`, `laravel-api-keys`,
`laravel-http-basics`, `laravel-access`, `laravel-mcp-oauth`, and
`laravel-audit`):

0. **First, the maintainer cuts the required checks** on `develop` and `main`
   down to the jobs that report on every pull request (see above). A
   package that requires every cell today (laravel-http-basics requires
   `PHP 8.3 Laravel 12 stable` and fifteen more) would otherwise leave each
   pull request waiting for checks the reduced matrix never runs. Changing
   required checks is the maintainer's, repo by repo; the adoption PR names
   the list to set.
1. Pin the reusable workflow to the app-ui commit SHA that contains it, and
   pass that same SHA as `app-ui-ref`. The called workflow's `github` context
   belongs to the package caller, so `github.workflow_sha` cannot identify the
   app-ui source revision.
2. Set `"package": true` in `qiick-standards.json`. Until that opt-in is set,
   the drift check does not require the matrix, so packages can migrate
   independently.
3. Add the exporter job and use its outputs in the existing test jobs. Only
   `laravel-audit` passes `exclude-php-versions: '["8.3"]'`.
4. Align database service images to MySQL 8.4, MariaDB 11.4, and PostgreSQL 17.
   Keep the package's existing mutations, real-transport, Redis, and Memcached
   jobs, along with their check names.

The call needs the `app-ui-ref` because reusable workflows receive the caller's
`github` context. Keep it equal to the full commit SHA after `@`:

```yaml
jobs:
    package-matrix:
        uses: qiick-io/app-ui/.github/workflows/package-matrix.yml@<app-ui-commit-sha>
        with:
            app-ui-ref: <app-ui-commit-sha>
            exclude-php-versions: '[]'

    tests:
        name: PHP ${{ matrix.php }} Laravel ${{ matrix.laravel }} ${{ matrix.dependency-version }}
        needs: package-matrix
        runs-on: ubuntu-latest
        strategy:
            fail-fast: false
            matrix: ${{ fromJSON(needs.package-matrix.outputs.matrix) }}
        steps:
            - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6
            - uses: shivammathur/setup-php@eb7c497e18156a6bbabfef1d3a82760b9eda3962 # 2.40.0
              with:
                  php-version: ${{ matrix.php }}
            - name: Install dependencies
              run: |
                  composer require --dev --no-update "orchestra/testbench:^${{ matrix.testbench }}.0"
                  composer require --no-update "illuminate/support:^${{ matrix.laravel }}.0"
                  if [ "${{ matrix.dependency-version }}" = "lowest" ]; then
                    composer update --prefer-lowest --prefer-dist --no-interaction --with-all-dependencies
                  else
                    composer update --prefer-dist --no-interaction --with-all-dependencies
                  fi
            - run: vendor/bin/pest

    databases:
        name: Pest on ${{ matrix.database.name }}
        needs: package-matrix
        runs-on: ubuntu-latest
        strategy:
            fail-fast: false
            matrix:
                database: ${{ fromJSON(needs.package-matrix.outputs.databases) }}
        services:
            database:
                image: ${{ matrix.database.image }}
                env: ${{ matrix.database.environment }}
                ports:
                    - ${{ matrix.database.port }}:${{ matrix.database.port }}
                options: ${{ matrix.database.options }}
        steps:
            - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6
            # Install the package dependencies, then run its database-specific Pest suite.
            - run: vendor/bin/pest
              env:
                  DB_CONNECTION: ${{ matrix.database.connection }}
                  DB_HOST: 127.0.0.1
                  DB_PORT: ${{ matrix.database.port }}
                  DB_DATABASE: qiick_package
                  DB_USERNAME: ${{ matrix.database.username }}
                  DB_PASSWORD: ${{ matrix.database.password }}
```

For `laravel-audit`, replace the empty exclusion in the reusable-workflow call
with `'["8.3"]'`. Keep the package's existing job IDs and `name:` expressions
when changing their matrices.

## Drift check

When `qiick-standards.json` has `"package": true`,
`scripts/sync-standards.mjs --check` (run by
[`drift-check.yml`](../.github/workflows/drift-check.yml) with `standards: true`)
requires a call to this workflow, `fromJSON` use of both outputs, and the pull
request plan: `matrix.skip`, `run-databases`, `mutate-classes` (with a mutation
job), `cancel-in-progress`, a nightly `cron` and the nightly-failure issue.
Packages that have not opted in are unaffected.

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
requires a call to this workflow and `fromJSON` use of both outputs. Packages
that have not opted in are unaffected.

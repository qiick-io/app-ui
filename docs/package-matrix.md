# Package compatibility matrix

Every qiick Composer package shares one Laravel / PHP CI matrix from this repo.
The source of truth is [`standards/package-matrix.json`](../standards/package-matrix.json);
the reusable [`.github/workflows/package-matrix.yml`](../.github/workflows/package-matrix.yml)
exports it as job outputs. Packages must not invent their own PHP, Laravel or
dependency-version axes.

## Supported versions

| Axis                | Values                                      |
| ------------------- | ------------------------------------------- |
| PHP                 | 8.3, 8.4, 8.5                               |
| Laravel             | 12, 13                                      |
| Dependency versions | `lowest`, `stable` (`composer update` mode) |
| Orchestra Testbench | 10 (Laravel 12), 11 (Laravel 13)            |

Documented excludes live in `matrix.exclude` of the JSON file. Today the set is
empty: every PHP × Laravel pair above is valid. When a future Laravel major
drops an older PHP (or the reverse), the exclude lands in the JSON in the same
PR that updates the axes, and every package picks it up on the next pin bump.

### Databases

Packages that exercise real engines use the second output. The list is fixed:

| Engine        | Connection | Image (digest-pinned)    |
| ------------- | ---------- | ------------------------ |
| SQLite        | `sqlite`   | none (in-process)        |
| PostgreSQL 17 | `pgsql`    | `postgres:17@sha256:…`   |
| MySQL 8.4     | `mysql`    | `mysql:8.4@sha256:…`     |
| MariaDB 10.11 | `mariadb`  | `mariadb:10.11@sha256:…` |

Exact digests are in `standards/package-matrix.json`. Bumping a digest is its
own PR in app-ui; packages move when they bump their app-ui tag.

## Policy: adding and dropping a major

- **Add** a new PHP or Laravel major when the fleet is ready to support it
  (framework release is out, Testbench maps to it, at least one package has
  proven green). The change is a minor (or patch) release of app-ui: extend
  `standards/package-matrix.json`, document any new exclude, release. Packages
  adopt on their next pin bump; until then they keep testing the previous set.
- **Drop** a PHP or Laravel major only when support ends for the fleet. Dropping
  one is a **major** release for every affected package (Composer constraints
  and the CI matrix both narrow). App-ui removes the value from the shared
  matrix in the same release train; package major notes must say which major
  was dropped and the minimum remaining versions.
- Never leave a package on a private matrix that is wider or narrower than the
  shared one. Divergence is a bug; the standards check fails it.

## How a package consumes the matrix

1. Pin this repo (`qiick-standards.json` → `ref`, and the `uses:` tag on the
   workflow call) to a release that includes `package-matrix.yml`.
2. Set `"package": true` in `qiick-standards.json` so the standards drift check
   requires the shared matrix.
3. Call the reusable workflow and expand its outputs with `fromJSON`:

```yaml
jobs:
    package-matrix:
        uses: qiick-io/app-ui/.github/workflows/package-matrix.yml@vX.Y.Z

    tests:
        name: PHP ${{ matrix.php }} Laravel ${{ matrix.laravel }} ${{ matrix.dependency-version }}
        needs: package-matrix
        runs-on: ubuntu-latest
        strategy:
            fail-fast: false
            matrix: ${{ fromJSON(needs.package-matrix.outputs.matrix) }}
        steps:
            - uses: actions/checkout@…
            - uses: shivammathur/setup-php@…
              with:
                  php-version: ${{ matrix.php }}
            - name: Install
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
        # Skip the service container when matrix.database.image is null (SQLite).
        services:
            database:
                image: ${{ matrix.database.image }}
                ports:
                    - ${{ matrix.database.port }}:${{ matrix.database.port }}
        steps:
            - uses: actions/checkout@…
            # … install, then Pest with DB_CONNECTION=${{ matrix.database.connection }}
```

Pin every `uses:` action by SHA (as the rest of the fleet does). The matrix
workflow itself only needs `contents: read`.

## What the standards check asserts

With `"package": true`, `scripts/sync-standards.mjs --check` (via
[`drift-check.yml`](../.github/workflows/drift-check.yml) with `standards: true`)
runs [`standards/scripts/check-package-matrix.mjs`](../standards/scripts/check-package-matrix.mjs).
It fails when:

- no workflow calls `qiick-io/app-ui/.github/workflows/package-matrix.yml@…`;
- no job expands `fromJSON(needs.<job>.outputs.matrix)`;
- no job expands `fromJSON(needs.<job>.outputs.databases)`.

Packages adopt after the next app-ui release: bump the pin, set `"package": true`,
switch CI to the snippet above, then re-sync.

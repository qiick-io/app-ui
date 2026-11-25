# Public API

Everything listed here is the public API: it changes only as the deprecation policy below allows. Everything else in `src/` is marked `@internal` and may change in any release. `tests/Arch/PublicApiTest.php` fails when a class is neither `@api` nor `@internal`, or when an `@api` class is missing from this page (copy it from `qiick/laravel-http-basics`).

## Classes, interfaces and enums

Public means the class name, its public methods and constructor, and for enums the case names and backing values (backing values are wire values).

### `Qiick\<Package>\Contracts`

- `<Name>` (interface)

## Config keys and environment variables

Every key of `config/<package>.php` and every `<PACKAGE>_*` variable.

## Commands, events, routes, tables and error codes

The Artisan commands (`<package>:<verb>`), the events, the routes the package registers, the tables and columns of its migrations, and the `error` codes in `docs/error-codes.md`.

## Deprecation policy

This package follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **Deprecation in minor releases:** a deprecated public API (class, method, interface, config key, environment variable, command, event) is marked `@deprecated`, listed in `CHANGELOG.md` under `Deprecated` and in `UPGRADING.md` with its replacement, and keeps working for at least one minor release.
- **Removal in major releases only:** nothing public is removed or changed incompatibly within a major version; removals wait for the next major.
- **Before 1.0.0:** a minor may break; every break is in `UPGRADING.md` before the tag. From `1.0.0` on, the API and the migrations are frozen and follow SemVer.

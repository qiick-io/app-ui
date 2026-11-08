# Self-hosted app distribution

For apps a customer installs (not for Composer packages, which ship with plain `composer require` / `update`). externa-core is the reference implementation.

1. **Install from Packagist:** `composer create-project qiick/<app>`. `create-project` only copies `.env` and runs `key:generate`: no migrate, seed or database assumption.
2. **First run:** `php artisan <app>:install`, interactive (database, name / URL, stack profile, optional seed, frontend build), with a non-interactive mode for CI (`--no-interaction --force`).
3. **Updates:** `php artisan <app>:upgrade` (migrate, permissions, caches, version-specific steps), plus opt-in `--sync-upstream=vX.Y.Z` with `--dry-run`. `create-project` is never the update channel, and the README says so.
4. **Docker:** an image on GHCR with semver tags, published by the release workflow; a Compose quick start; `GET /health/live` and `GET /health/ready`.
5. **Docs:** installation and upgrade pages, and an "Upgrade notes" section for every version in the `CHANGELOG`.
6. **CI smoke** (`qiick-io/app-ui/.github/workflows/app-distribution-smoke.yml`): `create-project` from the current `develop`, non-interactive install, health endpoints, and an upgrade from the previous tag.

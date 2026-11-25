# Deploy, upgrade and rollback

Commands in order, and what success looks like after each one (fleet convention F30).

## Deploy or upgrade

1. Back up first (`backup.md`): the database and `.env`.
2. Put the new release in place (`git checkout vX.Y.Z` or the new image) and install its dependencies (`composer install --no-dev --optimize-autoloader`).
3. Run the upgrade command: `php artisan <app>:upgrade --force` (migrations, caches, queue restart). It ends with "Upgrade complete".
4. Check `GET /health/ready` (`200`) and `php artisan excubia:check` (no new failure), then sign in.

## Rollback

- **Code only** (the new release broke something, its migrations were expand-only, F21): put the previous release back, `composer install`, `php artisan optimize:clear`, `php artisan queue:restart`. The schema stays; the previous release works with it.
- **Code and data** (a migration damaged data, or the release contracted a column): put the app in maintenance mode (`php artisan down`), restore the backup taken in step 1 (`backup.md`), put the previous release back, `php artisan up`.

Write down what happened in `incident.md`.

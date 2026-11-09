# Logging and activity log

**Registry:** the activity page is a list page (`page-layout`, `data-table`, `data-table-toolbar`, `user-hover-card`).

**Copy from externa-core:** `app/Traits/LogsApplicationActivityTrait.php`, `config/activitylog.php`, the activity setup in `app/Providers/AppServiceProvider.php` (`configureActivityLogging()`, `registerAuthActivityListeners()`), `app/Http/Controllers/Admin/ActivityLogController.php` (`index`, `export`), `app/Http/Resources/Admin/ActivityLogResource.php`, `app/Support/Activity/FilterableActivityEvents.php` (PHP, repo root); `pages/admin/activity-logs/index.tsx`.

## Activity (audit) log

- `spatie/laravel-activitylog`. Every model a user can create, change or delete uses `LogsApplicationActivityTrait`: `LogOptions::defaults()->logAll()->logOnlyDirty()->dontLogEmptyChanges()`. Models exclude secrets with `->logExcept([...])`: `password`, `two_factor_secret`, `two_factor_recovery_codes`, `remember_token`, key hashes, encrypted settings.
- Log names: `default` (model changes), `auth` (login, logout, failed login: listeners in `AppServiceProvider`), `settings`, `ai` (every tool call and approval), plus one per domain area. `Activity::beforeLogging` adds `ip` and `user_agent`. Successful logins also set `last_login_at` / `last_login_ip`.
- Actions that are not model changes (export, bulk delete, sync) log explicitly with `activity('<area>')->causedBy($user)->performedOn($subject)->withProperties([...])->log('<event>')`.
- Retention: `clean_after_days` 365 by default, pruned by the scheduler; configurable by the operator.
- The activity page (`/admin/activity-logs`, permission `can-show-activity-logs`) filters by user, log name, event and date, and exports CSV.

## Application logs

- Stock `config/logging.php`: `LOG_CHANNEL=stack`, `LOG_STACK=single` (bare metal) or `stderr` (Docker), `daily` with `LOG_DAILY_DAYS=14` when the operator wants rotation.
- Log what an operator needs to act: failed jobs, failed external calls (status, host, duration), unexpected states. Context as an array (`Log::warning('…', ['project_id' => …])`), never interpolated.
- Never log secrets, tokens, passwords, full request bodies or personal data beyond an id.

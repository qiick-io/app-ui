# Incident

What to do first when the product is down, slow, or something leaked (fleet convention F30).

## First steps

1. **Is it a security incident** (a leaked secret, data seen by the wrong person, an unknown admin)? Rotate first (`secrets.md`, "After a leak"), then go on.
2. **Look:** `GET /health/ready`, `php artisan excubia:check`, `storage/logs/laravel.log` (or the log driver in `.env`), `php artisan queue:failed`.
3. **Contain:** `php artisan down --secret=<token>` keeps users out while you can still reach the app; `php artisan queue:pause` (or stop the workers) stops a runaway job.
4. **Recover:** roll back (`deploy.md`) or restore (`backup.md`), then `php artisan up`.

## Who to tell

- The users affected, when their data or their work is affected, with what happened and what they need to do.
- A vulnerability in the product itself: the maintainers, privately, as `SECURITY.md` says.

## After the incident

Add an entry below, newest first, and open a PR that fixes the cause and corrects any runbook step that was wrong.

| Date | What happened | Impact | Cause | Fix (PR) |
| ---- | ------------- | ------ | ----- | -------- |

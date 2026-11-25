# Backup and restore

What is backed up, how to restore it, and every restore drill (fleet convention F22).

## What is backed up

| What                                  | Copy goes to          | How often                       | Kept for | Encrypted |
| ------------------------------------- | --------------------- | ------------------------------- | -------- | --------- |
| Database                              | off the app host      | daily, and before every upgrade | 30 days  | yes       |
| Storage disks with user files         | off the app host      | daily                           | 30 days  | yes       |
| `.env` (with `APP_KEY`) and key files | a sealed secret store | after every change              | forever  | yes       |

`APP_KEY` is kept apart from the database copy: without it, encrypted columns cannot be read; with it next to the dump, one stolen copy exposes everything.

## Restore

1. Start an empty environment with the same version as the backup.
2. Restore `.env` with the **same** `APP_KEY`, and the key files.
3. Restore the database and the storage disks.
4. Run the upgrade command if the backup is older than the version, then `php artisan optimize:clear`.
5. Check `GET /health/ready` and sign in.

## Restore drills

A real restore of a real backup into an empty environment, following this page; what went wrong is fixed on this page in the same PR. One drill before the first stable release, then at least every 92 days.

| Date | Version | Result | Time to restore |
| ---- | ------- | ------ | --------------- |

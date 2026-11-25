# Secrets runbook

Every secret this product uses: where it lives, what it protects, how to rotate it and what the rotation breaks (fleet convention F20). One row per variable of `.env.example` whose name ends in `KEY`, `SECRET`, `TOKEN`, `PASSWORD` or `DSN`, and per key file. Production values never go in git.

| Secret        | Lives in                     | Protects                                                  | Rotate with                                                    | Rotation breaks                     | Rotated |
| ------------- | ---------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------- | ------- |
| `APP_KEY`     | the server's `.env` (sealed) | sessions, signed URLs, encrypted casts and stored secrets | new key in `APP_KEY`, the old one first in `APP_PREVIOUS_KEYS` | nothing while the old key is listed | on leak |
| `DB_PASSWORD` | the server's `.env`          | the database                                              | change the database user's password, then `.env`, then restart | connections until the restart       | yearly  |

## After a leak

1. Rotate or revoke the leaked secret (table above), first in the provider, then in `.env`, then restart the app, the queue workers and the scheduler.
2. Invalidate what it signed or encrypted: sessions, issued tokens, signed URLs, webhook signatures.
3. Read the activity log for the secret's use since it leaked.
4. Write the incident down (what leaked, when, how, what was rotated) and fix the cause in a PR.

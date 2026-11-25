# Security and data safety

What every qiick repo does so a vulnerability can be reported, a leaked secret replaced, a schema changed without downtime, the data restored and a release trusted (fleet conventions F19–F23, maintainer request of 2026-11-25).

- **F19 Security policy:** every repo has a `SECURITY.md` (supported versions, how to report, response time) and GitHub private vulnerability reporting switched on, because the policy sends reporters there.
- **F20 Secrets runbook:** every product has `docs/runbooks/secrets.md`: each secret of `.env.example` and each key file, where it lives, who rotates it, how, what the rotation breaks, and what to do after a leak.
- **F21 Expand / contract:** after the first stable release a schema change never breaks the code of the release before it. Add first (expand), move the data, switch the code, and drop or rename only in a later release (contract), with a `contract:` comment naming the release that stopped using the column.
- **F22 Backup and restore drill:** every product documents what is backed up and how to restore it in `docs/runbooks/backup.md`, and records a restore drill there before its first stable release and at least every quarter after it.
- **F23 Signed release tags:** the maintainer creates release tags locally with `git tag -s`; the release workflow runs `signed-tag / verified`, which fails unless GitHub shows the tag as Verified, and every publishing job needs it.

With a `conventions` object in `qiick-standards.json`, the standards drift check runs the static checks of F19, F20, F22 and F23; `migrations-frozen / migrations-frozen` checks F21; `scripts/check-repo-settings.mjs` in app-ui checks that private vulnerability reporting is on. An exception is a `conventions.divergences` entry like any other convention.

<!-- qiick-standards:detail when: writing or changing SECURITY.md, a secret, a runbook, a migration that drops, renames or changes a column or table, a backup, or a release tag or release workflow -->

## F19 Security policy and private reporting

**Rule.** Every repo has `SECURITY.md` at its root (or in `.github/`) with three sections: **Supported versions** (which versions get security fixes), **Reporting a vulnerability** (GitHub private vulnerability reporting on the repo's Security tab, never a public issue; acknowledgement within 72 hours) and what the repo treats as critical. "Private vulnerability reporting" is on in the repo's settings. A fix ships as a patch release with a `Security` entry in the CHANGELOG and a GitHub security advisory; a finding that spans packages is coordinated in each repo's advisory. A repo without one starts from `standards/templates/SECURITY.md`.

**Why.** On 2026-11-25, 16 of the 19 repos had a `SECURITY.md` and almost all of them told reporters to use private vulnerability reporting, but it was switched on in three (excubia-app, externa-core, excubia-core): a reporter who followed the policy found no button and had only a public issue left. app-ui, externa-bruno and two starters had no policy at all.

**Checked by.** F19 in the conventions check: `SECURITY.md` exists and has the supported versions and reporting sections. `scripts/check-repo-settings.mjs`: private vulnerability reporting is enabled (`gh api repos/<repo>/private-vulnerability-reporting`).

**Exceptions.** A private repo (foruli-core) cannot receive outside reports; its policy names the maintainer as the only channel, and the setting check skips it.

## F20 Secrets runbook

**Rule.** Every product keeps `docs/runbooks/secrets.md` with one row per secret: every variable of `.env.example` whose name ends in `KEY`, `SECRET`, `TOKEN`, `PASSWORD` or `DSN` (optionally followed by `_ID`), and every key file (`storage/oauth-*.key`, signing keys in the database). Each row says where the value lives in production (never in git), what it protects, how to rotate it (the command, as `signaculum:rotate-signing-key`), what the rotation breaks (sessions, issued tokens, encrypted columns) and how often it is rotated. A last section, **After a leak**, gives the order: revoke or rotate, invalidate what the secret signed or encrypted, read the audit log for its use, write the incident down. `APP_KEY` is never rotated by replacing it: Laravel's `APP_PREVIOUS_KEYS` keeps old ciphertext readable while the new key takes over.

**Why.** On 2026-11-25 only signaculum-core (`docs/key-rotation-and-backup.md`) and laravel-http-basics (one secret, in its `SECURITY.md`) wrote down how to rotate a secret. The other products had rotation code (`RotateApiKeyAction`, `RotateProjectTokenAction`) but no page that lists their secrets, so after a leak the operator has to find them in the code under pressure, and a forgotten one stays valid.

**Checked by.** F20 (_app_): `docs/runbooks/secrets.md` exists, names every secret-like variable of `.env.example` and has an **After a leak** section.

**Exceptions.** A variable that only looks like a secret (`PUSHER_APP_KEY`, a public client id) is still listed, with "public, not a secret" as what it protects; the list stays complete and the check stays simple.

## F21 Expand / contract schema changes

**Rule.** Until the first stable release, schema changes go into the `create_` migrations (the migration contract in the code rules). After it, a release runs its migrations while the previous release's code may still serve requests (rolling deploys, queue workers that finish their jobs, a rollback), so no migration may break that code:

1. **Expand** (release N): add the new column or table, nullable or with a default; write both the old and the new place; backfill in chunks (a queued job or a `<app>:` command, not one `UPDATE` in the migration).
2. **Switch** (release N or N+1): read only the new place; stop writing the old one.
3. **Contract** (release N+1 or later, never the release that switched): drop or rename the old column or table. The migration's `up()` carries a comment `// contract: <column or table> unused since vX.Y.Z`, naming the released tag whose code no longer reads or writes it.

A type change (`->change()`) that only widens (a longer string, a bigger integer, nullable) breaks nothing and carries `// expand-safe: <why>` instead. A new `NOT NULL` column without a default is an expand step done wrong: add it nullable, backfill, then make it `NOT NULL` in a later release. Packages follow the same rule, because a product upgrades the package before it deploys its own code.

**Why.** The migration contract (decision of 2026-11-20) freezes released migrations, so a mistake can no longer be edited away after 1.0; and every qiick product is self-hosted with an upgrade command, so the window in which old code meets the new schema is the operator's whole deploy, not a second. A `dropColumn` in the same release as the code change turns that window into errors, and a rollback to the previous release into a broken app.

**Checked by.** `migrations-frozen / migrations-frozen` (`standards/scripts/migrations-frozen.sh`), once the repo has a stable tag: every migration added since the latest stable tag whose `up()` drops, renames or changes a column or table needs the `contract:` comment with a tag that exists and is not newer than the latest stable tag, or the `expand-safe:` comment (`standards/scripts/check-expand-contract.mjs`). Packages call the same workflow.

**Exceptions.** A table no released code ever used (created and dropped between two releases) needs no contract step; its migration carries `// contract: never released`. A deliberate breaking schema change in a new major version is a divergence with its upgrade notes.

## F22 Backup and restore drill

**Rule.** Every product keeps `docs/runbooks/backup.md` (written from `standards/templates/runbook-backup.md` when the repo adopts the conventions) with:

- **What is backed up:** the database, the storage disks with user files, the `.env` (with `APP_KEY`) and every key file, each with where the copy goes (off the application host), how often, how long it is kept, and how it is encrypted. A backup without `APP_KEY` cannot decrypt encrypted columns; it is kept apart from the database copy, never next to it.
- **Restore:** the steps in order, ending with the app's health check (`GET /health/ready`) and the commands that must not run after a restore (a key rotation that would retire the restored key).
- **Restore drills:** a table with one row per drill (`| Date | Version | Result | Time to restore |`): a real restore of a real backup into an empty environment, following the page, with what went wrong fixed on the page in the same PR.

The first drill is recorded before the first stable release; after it, at least one drill every 92 days.

**Why.** On 2026-11-25 signaculum-core and instituta-core documented their backups, and no product had ever recorded a restore. A backup that has never been restored is a hope: missing `APP_KEY`, a disk nobody listed, or a dump from the wrong database are found during the first restore, and the first restore should not be the incident.

**Checked by.** F22 (_app_): `docs/runbooks/backup.md` exists with the three sections; once the CHANGELOG has a stable release, the newest drill is at most 92 days old.

**Exceptions.** None. A product without a production installation still records the drill against its demo or test data before 1.0.

## F23 Signed release tags

**Rule.** The maintainer creates every release tag on their own machine, signed: `git tag -s vX.Y.Z -m vX.Y.Z <merge commit>` with a GPG or SSH key registered on GitHub as a signing key (`git config tag.gpgSign true` makes every annotated tag signed), then pushes it. A tag created in the GitHub UI, by `gh release create` on a missing tag, or by an agent is not signed and fails. Every repo that tags releases has a workflow on `push: tags: ['v*']` that calls the reusable `signed-tag.yml` with the job id `signed-tag`; the check `signed-tag / verified` fails unless the tag is an annotated tag that GitHub shows as **Verified**. Every job that publishes from the tag (GitHub Release, Docker image, package) `needs: signed-tag`.

```yaml
on:
    push:
        tags: ['v*']

jobs:
    signed-tag:
        uses: qiick-io/app-ui/.github/workflows/signed-tag.yml@<sha> # vX.Y.Z
    docker-image:
        needs: signed-tag
        # …
```

**Why.** On 2026-11-25 every release tag of the fleet was a lightweight tag: it carries no signature, so nothing proves that the maintainer, and not a leaked token or a compromised account, chose that commit for the release. The `release tags: immutable` ruleset stops a tag from moving after it is pushed; the signature proves who pushed it. Composer and Packagist install by tag, so the tag is the release.

**Checked by.** `signed-tag / verified` on every tag push (the reusable workflow reads `gh api repos/<repo>/git/tags/<sha>` and its `verification`). F23 in the conventions check: the repo's workflows call `signed-tag.yml`.

**Exceptions.** Tags pushed before 2026-11-25 stay as they are (immutable); the rule starts with the next release of each repo.

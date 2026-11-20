# Conformance scan against origin/develop (read-only)

Static read of migrations and config on each product's `origin/develop` tip
(2026-11-20). A full Pest boot against throwaway worktrees was attempted; migrate
failed where the checkout's `vendor/` did not match develop, so this table is the
adoption baseline from schema/config/file inspection. Behaviour checks (C7, C8,
C13, C17, C19–C25, C27–C32) need product hooks and are listed as **fail until
hooks** once the schema gaps close.

Legend: **fail** = will go red; **pass** = looks green from files; **n/a** =
engine-dependent (needs PG/MySQL in CI).

## Summary

| Product         | Likely failing checks (schema/config/file)                                                                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| externa-core    | C1 (no `public_id`; password NOT NULL), C3 (`oidc_sub`, no `user_identities`), C4/C5 (teams off), C9 (no principals), C10/C11 (`owner_id` not `owner_principal_id`), C12 (bigint morphs), C14/C15 (settings shape TBD on live DB), C34 (many `add_` migrations — allowed: already stable 1.x), behaviour hooks |
| excubia-app     | C3 (no `user_identities` / may still have `oidc_sub` debt), C4/C5 (teams off), C10/C11 (verify principal ownership + datetime), C12 (verify morph width), behaviour hooks                                                                                                                                      |
| signaculum-core | C1 (password NOT NULL in create_; subject via add_), C3 (IdP-only — declare divergence), C4 (teams false — declared divergence path), C16 (notifications?), C34 (`add_`/`drop_` before 1.0), C35 (graphify-out ignore missing), behaviour hooks                                                                |
| instituta-core  | C3 (no identities yet), C4/C5 (teams off), C9–C11 (principals/keys programme), C12 (verify string(64)), C20 (`code`→`error` rename), behaviour hooks                                                                                                                                                           |

## Per product (high-signal)

### externa-core (`d6e032b2`)

| Id        | Status | Note                                                            |
| --------- | ------ | --------------------------------------------------------------- |
| C1        | fail   | No `public_id`; `password` not nullable                         |
| C2        | pass   | No `users.organisation_id`                                      |
| C3        | fail   | `add_oidc_sub`; no `user_identities`                            |
| C4        | fail   | `permission.teams` false                                        |
| C5        | fail   | teams off                                                       |
| C6        | pass   | roles + user_groups present                                     |
| C9–C11    | fail   | keys still `owner_id`→users; no principals table on develop tip |
| C12       | fail   | activity morphs still bigint historically                       |
| C16       | pass   | notifications, sessions, passkeys                               |
| C18       | pass   | `config/super_admin.php`                                        |
| C33       | pass   | stable 1.x may keep `.frozen`                                   |
| C34       | n/a    | stable: forward-only `add_` allowed                             |
| C35       | pass   | graphify ignored                                                |
| C36       | pass   | no setup-teams expected                                         |
| behaviour | fail   | hooks not provided yet                                          |

### excubia-app (`b8c47edf`)

| Id        | Status       | Note                                                   |
| --------- | ------------ | ------------------------------------------------------ |
| C1        | pass         | `public_id`, username, timezone UTC, nullable password |
| C2        | pass         | no user organisation_id                                |
| C3        | fail         | identities programme not complete on develop tip       |
| C4–C5     | fail         | teams false                                            |
| C6        | pass         | permissions + groups                                   |
| C9        | pass/partial | principals migration present — verify seed             |
| C10–C12   | fail/verify  | keys + activity need live assert                       |
| C16       | pass         | notifications present                                  |
| C18       | pass         | super_admin config                                     |
| C33–C34   | pass         | no `.frozen`; create_-only fold on develop tip         |
| C35       | pass         | graphify ignored                                       |
| behaviour | fail         | hooks not provided yet                                 |

### signaculum-core (`a6154de`)

| Id        | Status       | Note                                                                    |
| --------- | ------------ | ----------------------------------------------------------------------- |
| C1        | fail/partial | `subject` as public id (divergence); password still NOT NULL in create_ |
| C3        | diverge      | IdP product — needs C3 divergence object                                |
| C4        | diverge      | teams false by decision — declare                                       |
| C6        | pass/partial | Spatie + groups migrations landed as add_                               |
| C9–C11    | partial      | principals migration present                                            |
| C34       | fail         | many `add_`/`drop_` before first stable — fold into create_             |
| C35       | fail         | `.gitignore` missing graphify-out                                       |
| behaviour | fail         | hooks not provided yet                                                  |

### instituta-core (`770a88c`)

| Id        | Status      | Note                                             |
| --------- | ----------- | ------------------------------------------------ |
| C1        | pass        | public_id, username, nullable password, timezone |
| C3        | fail        | no user_identities yet                           |
| C4–C5     | fail        | teams false                                      |
| C9–C12    | fail/verify | tenancy/principals/keys still aligning           |
| C20       | fail        | machine `code`→`error` still open on develop tip |
| C33–C34   | pass        | create_-oriented; no frozen                      |
| C35       | pass        | graphify ignored                                 |
| behaviour | fail        | hooks not provided yet                           |

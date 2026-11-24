# Beta readiness: product checklist

The fleet checklist for deciding when a qiick **product** (a self-hosted app, not a Composer package) is ready for a beta and for its first stable release (fleet convention F18). The items are the same in every product; only the **Status** column is the product's own. Written first for signaculum-core (`docs/beta-readiness.md` there), adopted for every product on 2026-11-24.

## How to read it

- **Gate** says when an item must hold:
    - **Beta**: before a pre-release (`vX.Y.Z-beta.N`) that people outside the team are told to install;
    - **Stable**: before the first stable tag (`vX.Y.Z`), after which migrations are frozen.
- **Status** is the product's state on `develop` at a named commit and date: ✅ holds, 🟡 partly, ❌ missing, ➖ not applicable. Each status names its evidence (issue, file or check).
- A release PR links the evidence for every Beta item (for a beta) or every item (for a stable release).
- A product may add items of its own at the end of a section; it never removes one (write ➖ with the reason instead).

## 1. Scope and tests

| #    | Item                                                                                                                               | Gate   | Status |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 1.1  | The milestone, the design documents and the README describe the same scope; a superseded document is updated in a PR that says so. | Beta   |        |
| 1.2  | Every milestone item is implemented, or moved to a later milestone with a dated decision.                                          | Stable |        |
| 1.3  | Every protocol and security rule has a test that fails when the rule is removed (red first).                                       | Beta   |        |
| 1.4  | The suite runs on SQLite, PostgreSQL, MySQL and MariaDB in CI.                                                                     | Beta   |        |
| 1.5  | Concurrency tests run truly in parallel wherever the design relies on atomicity (claims, locks, token families).                   | Beta   |        |
| 1.6  | Line coverage has a committed floor that only rises.                                                                               | Beta   |        |
| 1.7  | Where a public protocol test suite exists, the product passes it with 0 failures.                                                  | Beta   |        |
| 1.8  | The fleet conformance suite is green; every divergence has a reason, a decision, a `review_by` date and an issue.                  | Beta   |        |
| 1.9  | No divergence is left except permanent ones, and every behaviour hook of the conformance suite is wired.                           | Stable |        |
| 1.10 | UI flows that only a browser proves (navigation, dialogs, keyboard, focus) have browser tests, in light and dark.                  | Stable |        |

## 2. Security

| #   | Item                                                                                                                            | Gate   | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 2.1 | Every PR that touches authentication, tokens or a trust boundary has an adversarial review by a reviewer that did not write it. | Beta   |        |
| 2.2 | An adversarial review of the **whole product** at the release-candidate commit; every finding fixed or in a dated decision.     | Stable |        |
| 2.3 | No open issue labelled `bug` or `security`.                                                                                     | Beta   |        |
| 2.4 | `composer audit` and `npm audit` are clean; no open Dependabot or secret-scanning alert.                                        | Beta   |        |
| 2.5 | Static analysis for security (CodeQL or equivalent) runs on PRs.                                                                | Stable |        |
| 2.6 | A threat model (assets, trust boundaries, attacker capabilities, what is out of scope) is written and matches the code.         | Stable |        |
| 2.7 | Open security decisions waiting on the maintainer are answered or explicitly deferred.                                          | Beta   |        |

## 3. Contract and schema

| #   | Item                                                                                                                      | Gate   | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 3.1 | Every wire contract is written down: protocol profile, REST API (OpenAPI), webhooks, and what a client library relies on. | Beta   |        |
| 3.2 | The fleet schema decisions are applied in the `create_` migrations while the product is unreleased.                       | Beta   |        |
| 3.3 | One `create_` migration per table: the `add_` / `alter_` migrations of the betas are folded in.                           | Stable |        |
| 3.4 | Personal-data erasure works with unique tombstones (GDPR erasure without breaking unique keys).                           | Stable |        |
| 3.5 | After the first stable tag, migrations are forward-only; `migrations-frozen` guards it.                                   | Stable |        |
| 3.6 | Every version has upgrade notes; a beta that needs a fresh database says so.                                              | Beta   |        |

## 4. Supply chain

| #   | Item                                                                                                  | Gate   | Status |
| --- | ----------------------------------------------------------------------------------------------------- | ------ | ------ |
| 4.1 | Rulesets: release tags created by admins only and immutable; `main` takes merge commits only.         | Beta   |        |
| 4.2 | `develop` and `main` change only through PRs with green required checks.                              | Beta   |        |
| 4.3 | Dependabot runs weekly grouped updates and security updates.                                          | Beta   |        |
| 4.4 | `minimum-stability: stable`, no `repositories` entries; reusable workflows and actions pinned by SHA. | Beta   |        |
| 4.5 | Release tags are signed.                                                                              | Stable |        |

## 5. Distribution (self-hosted products only)

| #   | Item                                                                                                                               | Gate | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| 5.1 | `composer create-project qiick/<app>` works from Packagist.                                                                        | Beta |        |
| 5.2 | `php artisan <app>:install` (interactive and `--no-interaction --force`) and `<app>:upgrade`.                                      | Beta |        |
| 5.3 | The CI smoke test: `create-project`, non-interactive install, health endpoints, upgrade from the previous tag.                     | Beta |        |
| 5.4 | A release workflow publishes `ghcr.io/qiick-io/<repo>` for linux/amd64 and arm64 on a `v*` tag (`X.Y.Z-beta.N` for a pre-release). | Beta |        |
| 5.5 | Docs: installation (Composer, Docker), configuration, upgrade, backup.                                                             | Beta |        |
| 5.6 | Health endpoints for orchestration.                                                                                                | Beta |        |
| 5.7 | Repository visibility and the agent rules agree.                                                                                   | Beta |        |

## 6. UI

| #   | Item                                                                                          | Gate   | Status |
| --- | --------------------------------------------------------------------------------------------- | ------ | ------ |
| 6.1 | The app-ui drift check is green against a pinned app-ui release; every override has a reason. | Beta   |        |
| 6.2 | Every UI string in `en`, `it` and `de`; the hard-coded string ratchet only shrinks.           | Beta   |        |
| 6.3 | The product's theme preset is in use.                                                         | Stable |        |

## 7. Shared qiick packages

The fleet rule is one implementation per concern. An unreleased product adopts the shared packages in beta, and it counts as the "second product" a package needs before its own `1.0.0`. One row per package; ➖ with the reason when it does not apply. Each adoption is a separate PR, and a schema change a package brings goes into the `create_` migration while the product is unreleased.

| Package                     | Gate   | Status | What the product changes to adopt it |
| --------------------------- | ------ | ------ | ------------------------------------ |
| `qiick/laravel-outbound`    | Beta   |        |                                      |
| `qiick/laravel-access`      | Beta   |        |                                      |
| `qiick/laravel-api-keys`    | Beta   |        |                                      |
| `qiick/laravel-http-basics` | Beta   |        |                                      |
| `qiick/laravel-audit`       | Stable |        |                                      |
| `qiick/laravel-oidc`        | Stable |        |                                      |
| `qiick/laravel-mcp-oauth`   | Stable |        |                                      |

## 8. What is missing for the next beta, by priority

P0 (blocks a beta people outside the team can install), P1 (changes a wire format or the schema), P2 (the rest): one numbered line per item, with the issue.

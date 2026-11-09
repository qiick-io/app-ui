# qiick standards pack

One public source for the rules every qiick repo follows (Externa, Excubia, Signaculum, their packages, and this repo). Contributors never have to find or read a rulebook: the sync writes the rules into the files each agent reads by itself at its first task, and CI fails when a repo's copy drifts.

## What a repo gets

| File in the repo                            | Read by                         | Managed                          |
| ------------------------------------------- | ------------------------------- | -------------------------------- |
| `AGENTS.md`                                 | Codex, Cursor, Copilot agent, … | the `qiick-standards` block only |
| `CLAUDE.md` (`@AGENTS.md` import)           | Claude Code                     | the `qiick-standards` block only |
| `.github/copilot-instructions.md`           | GitHub Copilot                  | the `qiick-standards` block only |
| `.cursor/rules/code-craftsmanship.mdc`      | Cursor, always                  | whole file                       |
| `.cursor/rules/no-auto-release.mdc`         | Cursor, always                  | whole file                       |
| `.cursor/rules/testing.mdc`                 | Cursor, on test files           | whole file                       |
| `.cursor/rules/accessibility-and-theme.mdc` | Cursor, on `.tsx` (UI repos)    | whole file                       |
| `.cursor/commands/code-comments.md`         | Cursor `/code-comments`         | whole file                       |
| `tests/Arch/NamingArchitectureTest.php`     | Pest, in CI (PHP repos)         | whole file                       |
| `tests/Arch/naming-architecture.php`        | the test above                  | **the repo's own**, written once |
| `qiick-standards.eslint.js`                 | ESLint, in the editor           | whole file                       |

The rules themselves are in [`rules/`](rules): [stack](rules/stack.md) (only in repos with `"app": true`), [code](rules/code.md) (casing, full-word names, boolean prefixes, role suffixes, the five layers, PHPDoc / JSDoc, contracts and refactoring guardrails), [testing](rules/testing.md), [git](rules/git.md) (English, Conventional Commits, branches, squash), [releases](rules/release.md) (nothing ships without the maintainer), [automated checks](rules/checks.md) (knip, `noUnused*`, strict models, the Larastan and i18n ratchets), [UI](rules/ui.md) (the app-ui rules, only in repos with a `uiPreset`) and [self-hosted distribution](rules/distribution.md) (only in repos with `"app": true`).

## What CI enforces

The reusable [`drift-check.yml`](../.github/workflows/drift-check.yml) with `standards: true` runs `scripts/sync-standards.mjs --check` from the app-ui ref pinned in the repo's `qiick-standards.json`. It fails when:

- a managed file differs, or a managed block in `AGENTS.md` / `CLAUDE.md` / `.github/copilot-instructions.md` differs or is missing;
- a file or directory under `frontendRoots` is not kebab-case.

The repo's own CI runs the rest, each one a step in its workflow:

| Check                                                                                                | Command                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture test (suffixes, readonly DTOs, `strict_types`, no `dd` / `env()` / `DB` in controllers) | Pest (`tests/Arch`)                                                                                                                      |
| Dead code: unused files, exports, dependencies                                                       | `npx knip`                                                                                                                               |
| Unused locals and parameters                                                                         | `tsc --noEmit` with `noUnusedLocals` / `noUnusedParameters`                                                                              |
| Lazy loading, discarded or missing attributes                                                        | the test suite, with `Model::shouldBeStrict(! app()->isProduction())` in `AppServiceProvider`                                            |
| Larastan baseline only shrinks                                                                       | `node scripts/qiick-ratchet.mjs phpstan`                                                                                                 |
| No new hard-coded JSX text                                                                           | lint JSON report piped into `node scripts/qiick-ratchet.mjs lint --rule i18next/no-literal-string --baseline i18n-literal-baseline.json` |
| Conventional Commit PR titles                                                                        | commitlint                                                                                                                               |
| Self-hosted install and upgrade (apps)                                                               | [`app-distribution-smoke.yml`](../.github/workflows/app-distribution-smoke.yml)                                                          |

`i18next/no-literal-string` runs with `{ "mode": "jsx-text-only" }`: JSX text, never attributes. ESLint repos load `eslint-plugin-i18next` with the rule off and turn it on from the ratchet command (`--rule`); Vite+ / oxlint repos load it through `jsPlugins`.

What CI cannot check (full-word names, docblocks, thin controllers beyond the `DB` rule, the release rules) is in the agent files, so every agent reads it before its first change.

## Repo-specific rules

The check skips everything that is the repo's own:

- text outside the `qiick-standards` block in `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` (repo rules, quality-gate commands, Laravel Boost's `<laravel-boost-guidelines>` block). Put repo rules in `AGENTS.md`, below the block: every agent reads it;
- other `.cursor/rules/*.mdc` files (`graphify.mdc`, `stay-in-externa-workspace.mdc`, …);
- `tests/Arch/naming-architecture.php`: the root namespace, the scaffolding each rule skips (with a reason per entry) and extra role suffixes of the repo;
- other test files in `tests/Arch/` for repo-only architecture rules.

## Adopting it in a repo

A new product: [`docs/new-product.md`](../docs/new-product.md) and `scripts/new-product.mjs` do all of this in one step. An existing repo:

1. Add `qiick-standards.json` at the repo root:

    ```json
    {
        "ref": "vX.Y.Z",
        "uiPreset": "Blue",
        "php": true,
        "frontendRoots": ["resources/js"],
        "eslint": false,
        "app": true
    }
    ```

    `ref` is the app-ui tag (or branch) CI checks against; omit `uiPreset` in repos without a UI; `eslint: true` writes `qiick-standards.eslint.js` for repos that lint with ESLint (add `qiickStandards(['resources/js/**/*.{ts,tsx}'])` to `eslint.config.js`); `app: true` adds the self-hosted distribution rules (apps, not Composer packages).

2. Sync from an app-ui checkout at that ref:

    ```bash
    node ../app-ui/scripts/sync-standards.mjs --target .
    ```

3. Fill `tests/Arch/naming-architecture.php`, move repo rules below the block in `AGENTS.md`, and call the check in CI:

    ```yaml
    jobs:
        app-ui-drift:
            uses: qiick-io/app-ui/.github/workflows/drift-check.yml@vX.Y.Z
            with:
                standards: true
                registry: false # repos without the @qiick UI registry
        distribution-smoke: # apps only
            uses: qiick-io/app-ui/.github/workflows/app-distribution-smoke.yml@vX.Y.Z
            with:
                package: qiick/externa-core
                command: externa
    ```

To upgrade, bump `ref`, run the sync again and commit the result.

## Laravel Boost

`php artisan boost:install` / `boost:update` rewrite only their `<laravel-boost-guidelines>` block in `AGENTS.md` / `CLAUDE.md`, so they coexist with the pack. Where Boost's guidelines disagree (Boost says comment only complex logic), the qiick standard wins: it says so in its Documentation section.

## Changing a rule

Edit `standards/` in app-ui only, run `npm run standards:sync` (this repo follows the pack too) and `npm test`, and open a PR. After the release, each repo bumps its `ref` and re-syncs.

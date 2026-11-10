# Releasing qiick app UI

One version covers everything apps consume from this repo: the `@qiick` registry (`public/r`, theme included), the standards pack (`standards/`, `scripts/sync-standards.mjs`) and the reusable workflows (`.github/workflows/*.yml` with `workflow_call`). A tag `vX.Y.Z` pins all three, so a merge into `develop` never changes an app's CI: an app moves only when it bumps its tag.

## No release without the maintainer

Never merge `develop` → `main`, create a tag or publish a GitHub release unless the maintainer explicitly says so. Agents may open the `develop` → `main` release PR and stop there.

## Branching and tags

- Work lands in `develop` through squash-merged PRs. `main` holds releases only.
- A release is a `develop` → `main` PR (merge commit, not squash, so `main` and `develop` share history); the maintainer tags `vX.Y.Z` on the merge commit and publishes a GitHub Release titled exactly with the tag.
- Pre-releases: `vX.Y.Z-beta.N`, then `vX.Y.Z-rc.N`. Apps may pin a pre-release while they test it; Renovate offers stable tags only unless the app opts in.
- `public/r/*.json` is committed and up to date at every tag (CI fails when it is stale).
- After the tag, `main` is merged back into `develop`.

## How apps pin and upgrade

An app pins the same tag in three places:

| Where                               | Pin                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `qiick-standards.json`              | `"ref": "vX.Y.Z"`                                                                           |
| `components.json`                   | `"@qiick": "https://raw.githubusercontent.com/qiick-io/app-ui/vX.Y.Z/public/r/{name}.json"` |
| `.github/workflows/*.yml` (`uses:`) | `qiick-io/app-ui/.github/workflows/<workflow>.yml@vX.Y.Z`                                   |

`drift-check.yml` reads the first two and checks the app against exactly that tag, so an app is never failed by a release it has not adopted. Pinning `develop` anywhere is a pre-release shortcut only: every app-ui merge could turn the app red.

Upgrades arrive as one PR per release through the Renovate preset in [`renovate/app-ui.json`](renovate/app-ui.json): in the app's `renovate.json`,

```json
{ "extends": ["config:recommended", "github>qiick-io/app-ui//renovate/app-ui"] }
```

It bumps the three pins together. Its PR is red until the app follows the release; on that branch, from an app-ui checkout at the new tag:

1. `node ../app-ui/scripts/sync-standards.mjs --target .` and commit the managed files.
2. `npx shadcn add @qiick/<item> --overwrite` for each installed item the CHANGELOG names; review `app-ui.overrides.json`.
3. Follow the version's **Upgrade notes** in the CHANGELOG.

Without Renovate (Dependabot cannot see a tag inside a URL or JSON value), the same three steps by hand.

## Semantic versioning

| Bump  | When                                                                                                                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| patch | Visual fixes with no API change (a class, a colour value within its role, a spacing fix); wording fixes in the standards that change no rule.                                                                                 |
| minor | Additive: new items, tokens, optional props or variants; a new or changed standards rule, a new pattern page, a new reusable workflow or input. Apps re-sync; their code may need small follow-ups.                           |
| major | An app must change code or overrides: tokens renamed or removed, component props changed or removed, a layout that moves elements; a new required check that existing apps fail without a baseline; a workflow input removed. |

Before `1.0.0`, a minor may also carry what would be a major; the Upgrade notes say so.

## CHANGELOG

[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), one section per release. Each release has an **Upgrade notes** subsection: which apps are affected and what an app must do (re-sync, re-run `shadcn add` for which items, override entries to review, renamed tokens, new required checks).

## Release checklist (for the release PR)

1. `CHANGELOG.md`: move `[Unreleased]` into `[X.Y.Z] - YYYY-MM-DD`, with the Upgrade notes; add the compare link.
2. Bump `version` in `registry/package.json`.
3. `npm run build`, commit `public/r`; CI green.
4. Open the `develop` → `main` PR titled `chore(release): vX.Y.Z` and stop. The maintainer merges it, then:

```bash
git fetch origin && git checkout main && git pull --ff-only
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --title vX.Y.Z --notes-file <(sed -n '/^## \[X.Y.Z\]/,/^## \[/p' CHANGELOG.md | sed '$d')
git checkout develop && git pull --ff-only && git merge --no-ff main -m "chore: merge main back into develop after vX.Y.Z" && git push origin develop
```

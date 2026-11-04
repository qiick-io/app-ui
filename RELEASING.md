# Releasing qiick app UI

These rules cover the qiick apps that consume this repo.

## No release without Luca

Never merge `develop` → `main`, create a tag or publish a GitHub release unless Luca explicitly says so ("rilascia"). Agents may open the `develop` → `main` release PR and stop there.

## Branching and tags

- Work lands in `develop` through squash-merged PRs.
- A release is a `develop` → `main` PR; the maintainer tags `vX.Y.Z` on `main`.
- `public/r/*.json` is committed and up to date at every tag. CI fails when it is stale.
- One version covers the theme and every component.

## How apps pin and upgrade

- Apps pin the tag in `components.json`:

    ```json
    "registries": {
        "@qiick": "https://raw.githubusercontent.com/qiick-io/app-ui/vX.Y.Z/public/r/{name}.json"
    }
    ```

- To upgrade, an app bumps the tag, runs `npx shadcn add @qiick/<name> --overwrite` for its installed items, and reviews its `app-ui.overrides.json`.
- The drift check compares the app against its own pinned tag, so an app is never failed by a release it has not adopted.
- Dependabot cannot see a tag inside a URL; upgrade PRs are manual until the upgrade workflow exists.

## Semantic versioning for UI

| Bump  | When                                                                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| patch | Visual fixes with no API change (a class, a colour value within its role, a spacing fix).                                          |
| minor | Additive: new items, new tokens, new optional props or variants.                                                                   |
| major | An app must change code or overrides: tokens renamed or removed, component props changed or removed, a layout that moves elements. |

## CHANGELOG

[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), one section per release. Each entry says which apps are affected and what an app must do to upgrade (re-run `shadcn add` for which items, override entries to review, renamed tokens).

## Release checklist (for the release PR)

1. `CHANGELOG.md`: move `[Unreleased]` into `[X.Y.Z] - YYYY-MM-DD`, with the upgrade notes.
2. Bump `version` in `registry/package.json`.
3. `npm run build`, commit `public/r`; CI green.
4. Open the `develop` → `main` PR and stop. Luca merges, tags and publishes.

# Agent rules for qiick app UI

These rules apply to every agent working on a **qiick app** (the `qiick-io` apps: Externa, Excubia, and the ones that follow). They do not apply to other projects.

Goal: no agent invents a layout, a component, a colour or a component position in a qiick app. The only exceptions are explicit overrides (rule 2).

## Before any UI change

1. Read [`docs/`](docs/README.md): one page per pattern, each pointing at the exact externa-core files to copy.
2. Find the pattern in the registry ([`registry/README.md`](registry/README.md)). Install it with `npx shadcn add @qiick/<name>`; do not rewrite it.
3. If the registry does not have it yet, copy it from **externa-core `develop`** (the 1.4.0 UI), file by file.
4. If externa-core has no equivalent, **stop and ask Luca**. Do not design one.

## Hard rules

1. **Source of truth.** The `@qiick` registry; until an item ships there, externa-core `develop`. Copy, never redesign.
2. **Overrides.** An intentional difference from the registry is listed in the app's `app-ui.overrides.json` with a reason per file. Any other difference fails the drift check ([`scripts/check-drift.mjs`](scripts/check-drift.mjs)).
3. **Primitives.** shadcn components only (the registry `ui` items). Icons: `lucide-react` only. No new Headless UI or other component libraries.
4. **Colours.** Theme tokens only (`bg-primary`, `text-muted-foreground`, `border-sidebar-border`, …). No hex and no raw palette classes (`bg-teal-600`, `text-neutral-500`) in `className`; no arbitrary font sizes (`text-[11px]`). `check-ui-tokens` enforces it.
    - AI surfaces use the violet `ai` token set (`bg-ai`, `text-ai-text`, `border-ai-border`, …), never the brand primary.
    - Status colours (`success`, `warning`, `destructive`, `info`) carry status only; never use one as a brand or primary colour.
5. **Control scale.** antd-like: `sm` 24px, default 32px, `lg` 40px. Use the default (32px) everywhere: headers, toolbars, forms, settings. `sm` is only for compact inline actions (table row icons, chips); `lg` for rare large CTAs.
6. **Accessibility.** WCAG 2.2 AA in light, dark and high contrast: visible focus, keyboard reachability, labels on icon-only controls, contrast. Check every UI change in light and dark.
7. **Positions are part of the pattern.** Where a control sits (primary action far right, filters left, pagination counter left / pages centre / rows per page right, …) is copied like the code. See `docs/`.

## Theme

The tokens come from the `@qiick/theme` registry item (`packages/app-theme/src/theme.css`): one shared base (surfaces, the two-tone shell, text, borders) plus brand-only presets (Teal = Externa, the default; Blue = Excubia). An app picks a preset; it does not edit surface tokens. See [`docs/theme.md`](docs/theme.md).

## Working in this repo

- Copy code from externa-core `develop`; do not redesign. Every deliberate change from externa-core is listed in [`registry/README.md`](registry/README.md).
- English in the repo (code, docs, commits, PRs). Conventional Commits; PR titles are linted, PRs are squash-merged into `develop`.
- Commit `public/r` with the registry sources (`npm run build`); CI fails when it is stale.
- Run `npm run lint`, `format:check`, `types:check`, `registry:check`, `a11y:contrast`, `test` before a PR.
- **No release without Luca**: never tag, merge `develop` → `main` or create a GitHub release unless Luca says so. See [`RELEASING.md`](RELEASING.md).

## For app repos

Copy [`docs/app-agents-section.md`](docs/app-agents-section.md) verbatim into the app's `AGENTS.md` / `CLAUDE.md`.

# Changelog

All notable changes to **qiick app UI** (`@qiick/app-theme` and the `@qiick` shadcn registry) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
One version covers the theme package and the registry: a release tag `vX.Y.Z` pins both.

## [Unreleased]

### Added

- `AGENTS.md` (+ `CLAUDE.md`) with the UI rules for every qiick app, `docs/` with one page per pattern (shell, page, list page, settings, empty states, destructive actions, dashboard, chat and Assistant, files grid, theme), the UI section template for app repos, and `RELEASING.md`; README header.
- Drift check (#5): `scripts/check-drift.mjs` compares an app's installed registry files with the tag pinned in its `components.json`, with `app-ui.overrides.json` for intentional changes (reason required, stale entries fail), and prints a diff; reusable workflow `.github/workflows/drift-check.yml`; tests run in CI.
- Registry items extracted from externa-core 1.4.0 (#3): `ui` button, input, input-group, native-select, select, toggle, toggle-group, dropdown-menu, dialog, alert-dialog, sheet, field, badge, table, pagination, empty, switch, checkbox, radio-group, tooltip, sidebar (straight active bar), label, separator, skeleton, textarea, breadcrumb, message, bubble; `use-mobile`; components header-icon-button, page-header, page-layout, data-table-toolbar, page-empty-state, settings-form-actions, confirm-destructive-dialog, app-shell.
- `chat-layout`: list column, thread and composer of the externa-core `/ai` and `/chat` pages (#3).
- `registry/locales/{en,it,de}.json`: the translation keys the items use (#3).
- `check-ui-tokens` in `npm run lint`: no raw palette, `#hex` or arbitrary font sizes in the registry (#3).
- Playground: a demo per item and full screens (`#/users`, `#/settings`, `#/assistant`, `#/chat`, `/dark`) for side-by-side checks against externa-core (#3).
- `@qiick/app-theme` tokens extracted from externa-core 1.4.0: palette scales, light/dark/high-contrast colour tokens in the `base` cascade layer, `--brand-primary` accent (teal default), `--primary-hover`, sidebar and AI tokens, focus-ring rule, control-size scale (24/32/40 px), base and reduced-motion rules; documented in `packages/app-theme/README.md` (#2).
- `presets/blue.css` brand preset (Excubia), the shared base + brand-only model from externa-core `config/theme-presets.php` (#2).
- `npm run a11y:contrast`: WCAG 2.2 AA check of every token pair in light, dark and both high-contrast modes, for teal and every preset, including `--primary-hover`; runs in CI (#2).
- Playground shows the theme tokens with a preset and high-contrast switch (#2).
- npm workspaces for `@qiick/app-theme` and the shadcn registry, built with `shadcn build` into the committed `public/r` (#1).
- Vite playground that renders every registry item in light and dark mode (#1).
- CI: lint, Prettier, typecheck, build, stale `public/r` check and Conventional Commits; Dependabot (#1).
- `utils` registry item: `cn()` aware of the control-size spacing keys (#1).

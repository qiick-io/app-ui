# Changelog

All notable changes to **qiick app UI** (the `@qiick` shadcn registry, theme included) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
One version covers the theme package and the registry: a release tag `vX.Y.Z` pins both.

## [Unreleased]

### Added

- `standards/`: the qiick standards pack, one public source of the code, testing, git, release and UI rules for every qiick repo. `scripts/sync-standards.mjs` writes it into a repo (`AGENTS.md` / `CLAUDE.md` / `.github/copilot-instructions.md` blocks, `.cursor/rules/`, `tests/Arch/NamingArchitectureTest.php`, a zero-dependency ESLint kebab-case file-name config); `drift-check.yml` gains `standards: true` (and `registry: false` for repos without the UI registry) to fail CI on a drifted copy. Affects every app: add `qiick-standards.json`, run the sync, fill `tests/Arch/naming-architecture.php`. `docs/app-agents-section.md` is superseded by the pack.
- Automated checks in the pack: knip, `noUnusedLocals` / `noUnusedParameters`, strict Eloquent models, a Larastan baseline ratchet and a hard-coded JSX text ratchet (`scripts/qiick-ratchet.mjs`), plus the self-hosted app distribution contract and the reusable `app-distribution-smoke.yml` (create-project, non-interactive install, health, upgrade from the previous tag). This repo runs knip and the i18n ratchet (registry sources: 0 literals) in CI; `knip` and `eslint-plugin-i18next` are new dev dependencies.

### Changed

- `table`, `alert-dialog`, `switch`, `toggle-group`, `badge`, `sheet` and `tooltip` re-pulled from shadcn new-york-v4: table without `forwardRef` and with a `data-slot` on every part (header cells in normal case, foreground colour, cells `whitespace-nowrap`); alert dialog with `size` (`default` / `sm`), `AlertDialogMedia`, and `AlertDialogAction` / `AlertDialogCancel` taking Button `variant` and `size` (Action defaults to `default`: pass `variant="destructive"` for deletes); switch with `size` (`default` / `sm`); toggle group with `spacing` (items keep the qiick toggle sizes); badge with `ghost` and `link` (the qiick status variants stay); sheet with `showCloseButton`; tooltip in the upstream look (`bg-foreground` / `text-background`, was `bg-primary`). Apps must check `AlertDialogAction` call sites.
- Every `ui/` item imports Radix from the single `radix-ui` package; the `@radix-ui/react-*` dependencies are gone from the items. Installing the items lets an app remove its `@radix-ui/*` packages.
- `drawer` documents its qiick additions (`DrawerNested`, `showOverlay`, focus on open, right-side width).
- Page views are line tabs under the header, each with its own URL, never a segmented control in `headerActions`: the header keeps only actions. A segmented control filters one view, in the filter row. A list row opens its record and editing becomes a row action (`docs/page.md`, `docs/dashboard.md`). Apps that switch views with a `ToggleGroup` in the header (externa-core Overview / Health) must move to tabs. `docs/page.md` gives the test (does the choice change the content, or only the rows?) and a table of the existing cases.
- `card` follows the shadcn new-york v4 card: `CardAction` and a grid header (#15).
- The theme ships as registry items, not an npm package: `@qiick/theme` (`resources/css/qiick-theme.css`) and `@qiick/theme-blue` (`resources/css/qiick-theme-blue.css`). One version covers tokens and components, and the drift check covers the theme. `packages/app-theme` is removed; the token reference is `docs/theme-tokens.md`.

### Added

- Chat patterns from externa-core: `ai-answer-parts` (an AI answer's reasoning, tool calls, chain of thought, text, sources and token usage) on the AI Elements items `shimmer`, `reasoning`, `chain-of-thought`, `tool`, `sources`, `context`, `code-block` and the `ai-message-parts` lib; human chat `chat-message-reactions`, `chat-attachment-file`, `chat-reply-quote`, `chat-pinned-bar`, `chat-mention`; `clipboard` lib; `collapsible` and `progress`. Adds `shiki`. Locale keys `ai.reasoning.*`, `ai.tool.*`, `ai.sources.*`, `ai.usage.*`, `chat.*`. `docs/chat-and-assistant.md` describes AI answers and human chat messages.
- Wave 2 patterns from externa-core: `data-table` (server-driven TanStack `DataTable`, `DataTableColumnHeader`, `DataTableFacetedFilter`, select / expand columns; adds `@tanstack/react-table`), `paginated-multi-select` (server-searched Popover + Command picker, single-select with `multiple={false}`), `removable-badge` (tag chip with a labelled remove button), `user-hover-card` (user card on hover, presence as a prop) and `spinner`. Locale keys `common.noResults`, `common.sortAscending`, `common.sortDescending`, `common.clearFilters`, `a11y.search`, `a11y.loading`, `picker.*`. The playground `#/users` screen is on `DataTable` with `ButtonGroup` row actions; `docs/list-page.md` describes both.
- `input-otp` and `slider` items (shadcn new-york-v4), with playground demos.
- `tabs` item: the shadcn new-york v4 tabs with the `line` variant, for page views (`docs/page.md`). Taken from Excubia, which tried it first.
- `stat-card` item (`StatCard`, `trendOf`): key numbers from the shadcn `dashboard-01` block (section cards), documented in `docs/dashboard.md` (#15).
- Registry items `card`, `context-menu`, `avatar`, `drawer`, `actions-overflow`, `user-avatar` (with `ConnectionDot`), `nav-user` (sidebar user menu), `files-grid` and `assistant-panel`, extracted from externa-core and made generic (props and slots instead of Inertia routes, Wayfinder and Externa types); docs point to them instead of externa-core files. Apps that already have `ui/card.tsx`, `ui/avatar.tsx`, `nav-user.tsx`, `user-info.tsx` or `user-menu-content.tsx` from the starter kit must install the items (`npx shadcn add @qiick/<name> --overwrite`) and adapt the call sites, or list the files in `app-ui.overrides.json`.
- Theme tokens `--avatar-1` … `--avatar-10` and `--avatar-foreground` (per-user avatar swatches), checked by `a11y:contrast`.
- Playground `#/files` screen.
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

### Fixed

- Accessibility (WCAG 2.2 AA axe sweep on externa-core):
    - `sidebar`: group labels use the new solid `--sidebar-muted-foreground` token (theme item: ink-500 / ink-400, ink-700 / ink-200 in high contrast; 4.6:1 or more) instead of `text-sidebar-foreground/70`, which failed contrast in light mode.
    - `data-table`: the select column's checkboxes have a 24px hit area with the same 16px look (`checkboxTargetClassName`, exported for hand-built tables).
    - `page-layout`: the `TablePanel` scroller joins the tab order while its content overflows (new `use-scroll-region` hook item), so the keyboard can scroll it.
- `data-table` pins `@tanstack/react-table@^8.21.3`: unpinned, `shadcn add` installed v9, which drops `useReactTable` / `getCoreRowModel`. Sortable column headers (`DataTableColumnHeader`) are normal case, foreground and `text-sm` like the plain ones, as in shadcn's data table (they were muted, uppercase and `text-xs`). `data-table` cells have an `h-10` minimum, so every row is 41px like externa-core's admin tables.
- `paginated-multi-select`: the trigger (`role="combobox"`) gets an accessible name, the new `aria-label` prop or else the placeholder. A combobox takes no name from its content; axe reported it as critical (`button-name`), found by Excubia's smoke test.
- `input-group` has a transparent background in dark mode, like `input`. It had shadcn's `dark:bg-input/30`, so a search field or a password field looked lighter than the plain inputs next to it.
- `docs/page.md`: link tabs set `aria-controls={undefined}` on each `TabsTrigger`. Without it, axe reports a critical `aria-valid-attr-value` (found by externa-core's axe smoke test).
- Drift check: an override can now explain a **missing** file of an installed item, not only a changed one. The source app (externa-core) keeps `lib/list-per-page.ts` and `layout/chat-layout.tsx` elsewhere.

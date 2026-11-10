# Changelog

All notable changes to **qiick app UI** (the `@qiick` shadcn registry, theme included) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
One version covers the theme package and the registry: a release tag `vX.Y.Z` pins both.

## [Unreleased]

### Upgrade notes

- **Vite+ apps (excubia-app):** set `"oxlint": true` in `qiick-standards.json`; the sync then manages `.oxlintrc.standards.json` and `.oxlintrc.i18n.json` (identical to excubia-app's, so nothing changes there). **externa-core** keeps `"eslint": true` until it moves to Vite+ in 1.5.0 (#609).

- **Every repo:** re-sync. The `AGENTS.md` / Copilot block shrinks (37.5 KB to 20.1 KB in an app with PHP, UI and distribution rules) and the sync writes the full rule pages to `.qiick/standards/`; commit that directory. If the repo's Prettier formats Markdown, add `.qiick/` to `.prettierignore` so a format run never changes the managed files.

### Changed

- Standards aligned with the decisions of 2026-11-09 / 10 (#61): **Vite+ is the frontend toolchain** and excubia-app the reference that sets the lint rules (`stack.md`, core and details; `checks.md`; the new-product guide and `scripts/new-product.mjs` keep the kit's Vite+ and write `oxlint: true`); the pack ships excubia-app's Oxlint configs (`"oxlint": true`). `stack.md` gains the local-environment rules (one database per app, re-seed instead of copies, clean up worktrees / Herd sites / databases after a task). `git.md`: issue and PR metadata at creation, branch protection and update-branch, merge commits only on `main`, merge-back through a PR, nothing personal in tracked files. `release.md`: the release PR and the merge-back take merge commits.
- Standards: progressive disclosure. Each rule page keeps its always-needed **core** in the agent files and moves the rest (casing and role-suffix table, stack versions and toolchain, backend API / security / logging / realtime / AI / operations, the automated checks list, release lifecycle, distribution steps, the UI pattern table) to `.qiick/standards/<page>.md`, with a pointer that says when to read it. Idea from mattpocock/skills `writing-for-agents` (context load, disclosure by branch).
- `rules/code.md`: new rule "Current sources, not memory": read the current official page before writing framework code or copying an upstream registry component, name the source page in the copied file, and record upstream items in the registry README (the AI Elements copies had silently gone stale). Upgrade: re-sync.

## [0.2.1] - 2026-11-09

### Upgrade notes

- Released as a patch at Luca's call so externa-core 1.4.0 can take it; by the semver table it would be a minor (the AI Elements compound exports are removed). Only externa-core uses those items.
- **Apps with the Assistant (externa-core):** re-pull `trace`, `tool`, `reasoning`, `chain-of-thought`, `sources`, `suggestion`, `confirmation` and `ai-answer-parts` (`npx shadcn add @qiick/<name> --overwrite`), merge the locale keys (`ai.tool.*` is new, `ai.approval.*` moves into the registry), delete `components/ai-elements/use-open-state.ts`, and pass `describeToolCall` to `AiAnswerParts` with a sentence for each of your tools and actions. The compound exports (`ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput`, `ReasoningTrigger`, `ReasoningContent`, `SourcesTrigger`, `SourcesContent`, `Source`, `ChainOfThoughtHeader`, `ChainOfThoughtContent`, `ChainOfThoughtStep`) are gone.

### Added

- `date-range-picker` from externa-core (#62): one field, a two-click range on `Calendar` with a hover preview and Clear; optional `withTime` (start and end `Input type="time"`, Apply, `YYYY-MM-DDTHH:mm` in local time) and `min` / `max`. New keys `dateRangePicker.startTime`, `endTime`, `apply`. Upgrade: optional, `npx shadcn add @qiick/date-range-picker` (Excubia's custom time range, qiick-io/excubia-app#247).

### Changed

- AI Elements rebuilt on shadcn **Trace**, as shadcn did upstream (ui.shadcn.com/docs/ai-elements/base): a tool call is one line with a sentence the app writes (`AiAnswerParts` `describeToolCall`), never the JSON of its arguments and result; reasoning, chain of thought and sources are Trace lines too. New items `trace`, `suggestion` (a plain scrolling row: the ScrollArea version clipped the chips inside the answer's flex column) and `confirmation` (on `Item`). `docs/chat-and-assistant.md` describes the new answer anatomy.

## [0.2.0] - 2026-11-09

### Upgrade notes

- **Every app:** bump the three pins from `v0.1.0` to `v0.2.0` (`qiick-standards.json` `ref`, the `@qiick` URL in `components.json`, every `uses: qiick-io/app-ui/.github/workflows/<workflow>.yml@…`), then re-sync the standards pack and re-pull changed registry items (`file-card`, `chat-layout`, `alert`, `calendar`).
- New ratcheted lint rules and the thin-controller arch test ship with baselines, so existing apps stay green; new apps start at zero.

### Added

- Prose rules as ratcheted checks. `qiick-standards.eslint.js` exports `qiickRatchetedRules()`: `no-restricted-imports` (other icon / component / toast libraries, `sonner` outside `@/lib/toast`), `no-restricted-properties` (`navigator.clipboard` outside `@/lib/clipboard`), `@typescript-eslint/naming-convention` (boolean prefixes, type-aware) and `id-length`; off in a plain lint run, on with `QIICK_RATCHET=1`, ratcheted per file and rule (`qiick-ratchet.mjs lint` now takes several comma-separated rules). The architecture test gains "controllers stay thin" (at most five public methods, existing debt in `controllerPublicMethods`). Measured on externa-core `develop`: 512 naming and 130 id-length findings, 14 controllers to baseline; app-ui baselines 29 + 2. Upgrade (ESLint repos): add `...qiickRatchetedRules([...])`, a `lint:standards` script and CI step, run it once with `--update`; PHP repos: paste the controller entries the test prints into `naming-architecture.php`.
- New-product path: `docs/new-product.md` (empty repo to first green CI, required checks to ask for, a proposed `qiick-io/app-template`), `scripts/new-product.mjs` (writes `qiick-standards.json`, the `@qiick` registry in `components.json` and `.github/workflows/qiick.yml`, all pinned to one app-ui ref, then runs the sync) and `standards/rules/stack.md` (Laravel 13 React starter kit, Inertia 3, Pest 5, Node 24, ESLint + Prettier as the one lint toolchain, SQLite, Horizon, Reverb, en / it / de, Herd), synced into repos with `"app": true`. Every managed `AGENTS.md` block now links the guide. Affects every repo: re-sync; apps also get the Stack section. `docs/app-agents-section.md` is deleted.
- Pattern pages, each naming the externa-core (or excubia-app) files it follows: `forms.md` (page vs drawer vs dialog, `Field` / `FieldError`, `useForm` vs `<Form>`), `detail-page.md`, `auth.md` (Fortify, 2FA, passkeys, SSO through Signaculum with `qiick/laravel-oidc`), `roles-and-permissions.md` (`PermissionEnum`, `<app>:sync-permissions`, `permission:` middleware, policies, `useCan`), `error-pages.md`, `realtime.md`, `api.md`, `security-headers.md`, `logging-and-audit.md`, `ai-backend.md`. `standards/rules/backend.md` summarises them and is synced into PHP repos; `rules/ui.md` lists the four UI pages. Upgrade: re-sync.
- Reusable workflows so no app keeps its own copy: `pr-title.yml` (commitlint on the PR title, no dependency in the app; `rules/git.md` claimed it, now apps can run it), `ui-quality.yml` (theme-token ratchet, WCAG contrast of the installed `@qiick/theme` with app-ui's `a11y-contrast.mjs --theme-dir`, optional axe smoke browser test) and `migrations-frozen.yml` (excubia-app's forward-only migration check, freeze baseline now optional). The pack syncs `scripts/check-ui-tokens.mjs` (identical to the externa-core and excubia-app copies) and a `scripts/ui-token-baseline.txt` template into Laravel apps with a `uiPreset`. Upgrade: apps call the three workflows and may delete their own `a11y-contrast.mjs` and `migrations-frozen.sh`.
- `alert` (status variants `success` / `warning` / `info`) and `calendar` (connected range band, module-level slots for a hover preview) from externa-core's `ui/`, so its drift check covers them. `calendar` adds the `react-day-picker` dependency.

### Changed

- `files-grid`: `FileCard` follows externa-core #592 / #596. The whole card is square; the preview fills the area above a 40px name row (`cover`: edge to edge, no blurred strip); the name row has the name, a ghost `icon-xs` tag button with the tags in a `HoverCard` (only when there are tags) and a ⋮ `DropdownMenu` with the same actions as the right-click menu; folders look like files; no tab stop on the card surface. `FileGrid`: 2 columns on phones, `minmax(15rem, 1fr)` from `sm`. New locale keys `files.card.moreActions`, `files.card.tagsMenu_one` / `_other`; `files.tags.moreTags` removed. Upgrade: `npx shadcn add @qiick/files-grid --overwrite` (+ `badge`, `dropdown-menu`, `hover-card`) and merge the locale keys.
- Docs: `shell.md` (offline presence and the disabled realtime dot are solid `bg-muted-foreground`), `theme.md` (registry presets set 8 brand tokens, never the `ai` tokens), `theme-tokens.md` (radius example), `files-grid.md` (the square card). `rules/release.md` gains the release lifecycle (beta / rc, Keep a Changelog with Upgrade notes, required check names) and `rules/distribution.md` the GHCR tags, docs site, Packagist checklist and the excubia-app install-smoke exception.
- `chat-layout`: `ChatLayout` takes `isThreadOpen` for the phone layout (list or thread, full width, below `md`), `data-*` attributes for its parts (`listColumnProps`, `listProps`, `threadProps`), passes other props to its root, and marks its parts with `data-slot`. Without `isThreadOpen` it renders as before. externa-core's `/ai` and `/chat` now render through it.

## [0.1.0] - 2026-11-09

First tagged release. Everything below was on `develop` only; apps pinned `develop`.

### Upgrade notes

- **Every app:** replace `develop` with `v0.1.0` in the three pins: `"ref"` in `qiick-standards.json`, the `@qiick` URL in `components.json`, and every `uses: qiick-io/app-ui/.github/workflows/<workflow>.yml@develop`. Nothing else changes: the content is the `develop` the apps already synced.
- Optionally extend `github>qiick-io/app-ui//renovate/app-ui` in `renovate.json` so later releases arrive as PRs (see `RELEASING.md`).

### Added

- Versioning: `RELEASING.md` describes the tag that pins the registry, the standards pack and the reusable workflows together, the three places an app pins it, pre-release naming and the release commands; `renovate/app-ui.json` is a Renovate preset that bumps the three pins in one PR.
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
    - `page-layout`: the `TablePanel` scroller joins the tab order while its content overflows (new `use-scroll-region` hook item), so the keyboard can scroll it. The hook sets `tabindex` on the node itself (React state lost it after a re-render), re-measures on any content change, and works without `ResizeObserver` (jsdom unit tests).
    - `page-header` / `data-table-toolbar`: below `sm` the filter row wraps, search full width on its own row, then the other controls; on a phone they drew on top of each other.
- `data-table` pins `@tanstack/react-table@^8.21.3`: unpinned, `shadcn add` installed v9, which drops `useReactTable` / `getCoreRowModel`. Sortable column headers (`DataTableColumnHeader`) are normal case, foreground and `text-sm` like the plain ones, as in shadcn's data table (they were muted, uppercase and `text-xs`). `data-table` cells have an `h-10` minimum, so every row is 41px like externa-core's admin tables.
- `paginated-multi-select`: the trigger (`role="combobox"`) gets an accessible name, the new `aria-label` prop or else the placeholder. A combobox takes no name from its content; axe reported it as critical (`button-name`), found by Excubia's smoke test.
- `input-group` has a transparent background in dark mode, like `input`. It had shadcn's `dark:bg-input/30`, so a search field or a password field looked lighter than the plain inputs next to it.
- `docs/page.md`: link tabs set `aria-controls={undefined}` on each `TabsTrigger`. Without it, axe reports a critical `aria-valid-attr-value` (found by externa-core's axe smoke test).
- Drift check: an override can now explain a **missing** file of an installed item, not only a changed one. The source app (externa-core) keeps `lib/list-per-page.ts` and `layout/chat-layout.tsx` elsewhere.

[Unreleased]: https://github.com/qiick-io/app-ui/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/qiick-io/app-ui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/qiick-io/app-ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/qiick-io/app-ui/releases/tag/v0.1.0

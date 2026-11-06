# qiick registry

shadcn registry with the shared admin UI of the qiick apps, extracted from externa-core 1.4.0. Sources live in `src/` with the same `@/` paths the apps use, so `shadcn add` writes them unchanged. `npm run build` writes `../public/r/*.json`, which is committed.

## Requirements in the app

The items target apps on the Laravel React starter kit (Inertia + React 19 + Tailwind v4), like Externa and Excubia:

- `components.json` with the starter kit aliases (`@/components`, `@/components/ui`, `@/lib`, `@/hooks`) and the `@qiick` registry (see the root README).
- The `@qiick/theme` item (plus a preset such as `@qiick/theme-blue`) imported in the app CSS, plus `tw-animate-css` and `shadcn/tailwind.css` (`@import "shadcn/tailwind.css";`, from the `shadcn` package, as `shadcn init` sets up: the `scroll-fade` and `shimmer` utilities used by `message-scroller`). See [`docs/theme-tokens.md`](../docs/theme-tokens.md).
- The `sidebarOpen` shared Inertia prop (starter kit default), for `app-shell`.
- `react-i18next` set up, with the keys in [`locales/`](locales) merged into the app's locale files (en, it, de). Every visible or accessible string in the items goes through these keys.
- `<TooltipProvider delayDuration={0}>` around the app (starter kit `app.tsx`), for `tooltip`, `sidebar` and everything built on them.

## Items

| Item                                                                                    | Type      | What                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils`                                                                                 | lib       | `cn()` aware of the control-size spacing keys, `toUrl()`                                                                                                                                            |
| `button`, `input`, `input-group`, `native-select`, `select`, `toggle`, `toggle-group`   | ui        | Controls on the control-size scale (24 / 32 / 40 px). `toggle-group` with `variant="outline"` is the segmented control                                                                              |
| `tabs`                                                                                  | ui        | `TabsList variant="line"`: the views of one record, under the header (`docs/page.md`)                                                                                                               |
| `dropdown-menu`, `context-menu`, `dialog`, `alert-dialog`, `sheet`, `drawer`, `tooltip` | ui        | Overlays                                                                                                                                                                                            |
| `field`, `label`, `textarea`, `switch`, `checkbox`, `radio-group`, `separator`          | ui        | Forms                                                                                                                                                                                               |
| `badge`, `card`, `avatar`, `table`, `pagination`, `empty`, `skeleton`, `breadcrumb`     | ui        | Display (`avatar` with `userId`: per-user swatch)                                                                                                                                                   |
| `sidebar` (+ `use-mobile` hook)                                                         | ui        | Collapsible sidebar with the straight full-height active bar                                                                                                                                        |
| `message`, `bubble`                                                                     | ui        | Chat messages                                                                                                                                                                                       |
| `sonner`, `toast`                                                                       | ui, lib   | Toasts in two channels: `toast.success()` is a small top-centre message, `error` / `warning` / `info` are notifications top-right below the header (`docs/notifications.md`)                        |
| `item`, `kbd`, `scroll-area`, `aspect-ratio`, `hover-card`, `accordion`, `popover`      | ui        | shadcn as published: list rows (`item`), shortcuts (`kbd`), scroll containers, media boxes, previews, accordions, popovers                                                                          |
| `command`                                                                               | ui        | `cmdk` lists with search and keyboard; **Popover + Command is the picker pattern** (relations, users, tags, mentions). The Base UI `combobox` is not used, so Radix stays the only headless library |
| `button-group`                                                                          | ui        | Split buttons and toolbars (`ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`)                                                                                                               |
| `chart`                                                                                 | ui        | `ChartContainer`, `ChartTooltip`, `ChartLegend` around recharts, coloured from a `ChartConfig`                                                                                                      |
| `message-scroller`, `marker`, `attachment`, `carousel`                                  | ui        | Chat: conversation scroller (needs `shadcn/tailwind.css`), status lines, attachments, media carousel                                                                                                |
| `header-icon-button`                                                                    | component | Icon-only button with tooltip, for headers and toolbars                                                                                                                                             |
| `page-header`                                                                           | component | `PageHeader` (description, subheader, filter row) and `FilterSearch`                                                                                                                                |
| `page-layout`                                                                           | component | `PageLayout` page scaffold, flat `TablePanel`, `TablePagination`, `TablePaginationFooter` (+ `lib/list-per-page.ts`: rows-per-page options and URL helpers)                                         |
| `data-table-toolbar`                                                                    | component | Search, selection count and bulk actions                                                                                                                                                            |
| `page-empty-state`                                                                      | component | Empty state with icon, title, sentence, CTA, docs link                                                                                                                                              |
| `settings-form-actions`                                                                 | component | Sticky Save bar for settings forms                                                                                                                                                                  |
| `confirm-destructive-dialog`                                                            | component | Cancel / Delete confirmation, optional typed name                                                                                                                                                   |
| `app-shell`                                                                             | component | `AppShell`, `AppContent` (framed inset panel), `AppSidebarHeader`, `Breadcrumbs`, `TruncatedText`                                                                                                   |
| `chat-layout`                                                                           | component | `ChatLayout` (list column + thread), `ChatListSection`, `ChatListItem`, `ChatThread`, `ChatComposer` (+ `lib/composer-chrome.ts`, `hooks/use-autosize-textarea.ts`)                                 |
| `actions-overflow`                                                                      | component | `ActionsOverflow`: toolbar actions that spill into ⋯ only when space runs out, `pinned` slot                                                                                                        |
| `user-avatar`                                                                           | component | `UserAvatar` (initials, presence dot) and `ConnectionDot` (realtime state on the avatar)                                                                                                            |
| `nav-user`                                                                              | component | Sidebar user menu: `NavUser`, `UserMenuContent` (settings, language, appearance, accessibility, logout), `UserInfo`                                                                                 |
| `files-grid`                                                                            | component | `FileGrid` (2 → 8 columns, infinite scroll + Load more) and `FileCard` (selection, context menu, tags, cover preview)                                                                               |
| `assistant-panel`                                                                       | component | `AssistantPanel`: right drawer with thread and composer, ⌘J / Ctrl+J, `toggleAssistantPanel()`, `openAssistantPanelWithPrompt()`                                                                    |

## Building a page

An admin list page, as externa-core `/users`:

```tsx
<AppLayout breadcrumbs={breadcrumbs} headerActions={<Button>New user</Button>}>
    <PageLayout
        filters={
            <DataTableToolbar search={search} onSearchChange={setSearch} />
        }
        filtersRight={
            <ToggleGroup type="single" variant="outline">
                …
            </ToggleGroup>
        }
    >
        <TablePanel footer={<TablePaginationFooter pagination={users} />}>
            <Table>…</Table>
        </TablePanel>
    </PageLayout>
</AppLayout>
```

A chat page, as externa-core `/ai` and `/chat`:

```tsx
<PageLayout filters={<FilterSearch … />} filtersRight={<HeaderIconButton … />}>
    <ChatLayout listLabel="Conversations" list={…ChatListItem rows…}>
        <ChatThread composer={<ChatComposer … />}>{…messages…}</ChatThread>
    </ChatLayout>
</PageLayout>
```

The playground has both as full screens (`#/users`, `#/settings`, `#/assistant`, `#/chat`, `#/files`; add `/dark` for dark mode).

## Changes from externa-core

The code is copied unchanged except:

- `page-header`, `data-table-toolbar`: the search `maxLength` default is `255` instead of Externa's `STRING_LIMITS.SEARCH` (same value).
- `settings-form-actions`: without Externa's unsaved-changes toolbar (Excubia's copy).
- The rows-per-page helpers of Externa's `lib/pagination.ts` are in `lib/list-per-page.ts`. `normalizePaginated` stays in each app's `lib/pagination.ts` (it needs the app's `@/types/admin`), and the name differs because `shadcn add` resolves `@/lib/pagination` to `components/ui/pagination.tsx` when both are installed together.
- `app-shell`, `app-content`, `breadcrumbs`, `app-sidebar-header`: the `AppVariant` and `BreadcrumbItem` types are declared in the files (`BreadcrumbItemType` is exported from `breadcrumbs.tsx`) instead of imported from `@/types`, because `shadcn add` rewrites `@/types` to `@/resources/js/types` in a Laravel app.
- `actions-overflow`: the test ids are `actions-overflow-*` instead of `files-action-*` (the component is not files-specific). Externa's `FilesActionsOverflow` was a typed wrapper around it and is not an item.
- `avatar`: `userId` picks one of the theme's `avatar-*` swatches (the same ten pastels as Externa's `lib/avatar-color.ts`, now tokens); the `color` prop (any hex) is dropped.
- `user-avatar`, `nav-user`: users are `{ id, name, email, avatar? }` (`name` is the display name) instead of Externa's `User` / `AdminUserRow`; initials come from `getInitials(name, email)`. `ConnectionDot` takes the connection `state` instead of calling `useEchoConnection()`, and uses `bg-success` / `bg-warning` instead of `bg-emerald-500` / `bg-amber-400`.
- `nav-user`: `NavUser` takes the `user` and the dropdown body as props instead of reading `usePage().props.auth`. `UserMenuContent` takes the routes (`settingsHref`, `logoutHref`, URLs or Wayfinder routes) and the language, appearance and accessibility state as props; a section is hidden when its prop is missing. Cleanup before logout (`resetChatStore()`, `router.flushAll()`) is the app's `onLogout`.
- `files-grid`: `FileGrid` is generic over the item (`items`, `renderItem`, `empty` slot, `backgroundMenu` slot) instead of taking Externa's file rows, permissions and drag-and-drop callbacks; `FileCard` takes `name`, `preview`, `cover`, `tags`, `topRight` / `bottomLeft` badges and `actions` instead of an `AdminFileRow`, and passes drag-and-drop props through. The auto-load guard on array identity, the 400px look-ahead on the scrolling panel and the Load more fallback are unchanged.
- `assistant-panel`: the drawer, ⌘J / Ctrl+J, the `ai:open` / `ai:toggle` events and the composer focus of Externa's `ai-assistant-panel.tsx`, without the chat logic (streaming, attachments, voice, presets, approvals): the app passes the thread as `children` and the composer as `composer`, and decides `enabled` (AI usable, not on the Assistant page).
- `chat-layout` is new: the list column, thread, and composer frame that `/ai` and `/chat` repeat inline, extracted with the same classes. `ChatComposer` is the frame and send behaviour of Externa's `AiComposer`, without the Externa-specific actions (attachments, voice, presets), which an app passes as `actions`.
- shadcn items added on 2026-11-06 (`item`, `kbd`, `button-group`, `command`, `scroll-area`, `chart`, `accordion`, `hover-card`, `aspect-ratio`, `carousel`, `message-scroller`, `marker`, `attachment`, `popover`) are the shadcn new-york-v4 sources as `shadcn add` writes them, unchanged.
- `avatar` is the current shadcn avatar (`size`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`) plus the qiick `userId` swatch; `textarea` adds shadcn's `field-sizing-content` (it grows with its text); `dialog` gets shadcn's `showCloseButton` prop; `button` gets shadcn's `xs` / `icon-xs` sizes, mapped to the smallest qiick step (24px).
- `sonner`, `toast`: Externa's `lib/toast.ts` and `lib/live-announcer.ts`, with `toast.success()` moved to the message channel (top centre, no rich colour, no close button, 3 s) and the live regions renamed `app-live-polite` / `app-live-assertive`. `ui/sonner.tsx` is the shadcn component instead of Externa's older one: the app passes `theme` instead of `next-themes`, the icons carry the status colour, Sonner's rich colours are mapped to the theme's status tokens, and position, offset, duration and close button are set in the item instead of in `app.tsx`.

## How items install

`shadcn add` 4.23 writes every file unchanged into a Laravel React starter kit app (tested on a copy of excubia-app: all 46 files byte-identical, `tsc` green). `lib/utils.ts` and `lib/list-per-page.ts` are `registry:file` items with an explicit `resources/js/…` target: shadcn never overwrites a `registry:lib` `utils.ts` in a Laravel app, and its transforms drop a leading comment.

## Checks

- `npm run lint` runs `scripts/check-ui-tokens.mjs`: no raw palette utilities, `#hex` classes or arbitrary font sizes anywhere in `src/`.
- `npm run registry:check`: `public/r` matches the sources, and every item has a playground demo.

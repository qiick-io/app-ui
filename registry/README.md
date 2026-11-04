# qiick registry

shadcn registry with the shared admin UI of the qiick apps, extracted from externa-core 1.4.0. Sources live in `src/` with the same `@/` paths the apps use, so `shadcn add` writes them unchanged. `npm run build` writes `../public/r/*.json`, which is committed.

## Requirements in the app

The items target apps on the Laravel React starter kit (Inertia + React 19 + Tailwind v4), like Externa and Excubia:

- `components.json` with the starter kit aliases (`@/components`, `@/components/ui`, `@/lib`, `@/hooks`) and the `@qiick` registry (see the root README).
- The `@qiick/theme` item (plus a preset such as `@qiick/theme-blue`) imported in the app CSS, plus `tw-animate-css` (see [`docs/theme-tokens.md`](../docs/theme-tokens.md)).
- The `sidebarOpen` shared Inertia prop (starter kit default), for `app-shell`.
- `react-i18next` set up, with the keys in [`locales/`](locales) merged into the app's locale files (en, it, de). Every visible or accessible string in the items goes through these keys.
- `<TooltipProvider delayDuration={0}>` around the app (starter kit `app.tsx`), for `tooltip`, `sidebar` and everything built on them.

## Items

| Item                                                                                  | Type      | What                                                                                                                                                                |
| ------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils`                                                                               | lib       | `cn()` aware of the control-size spacing keys, `toUrl()`                                                                                                            |
| `button`, `input`, `input-group`, `native-select`, `select`, `toggle`, `toggle-group` | ui        | Controls on the control-size scale (24 / 32 / 40 px). `toggle-group` with `variant="outline"` is the segmented control                                              |
| `dropdown-menu`, `dialog`, `alert-dialog`, `sheet`, `tooltip`                         | ui        | Overlays                                                                                                                                                            |
| `field`, `label`, `textarea`, `switch`, `checkbox`, `radio-group`, `separator`        | ui        | Forms                                                                                                                                                               |
| `badge`, `table`, `pagination`, `empty`, `skeleton`, `breadcrumb`                     | ui        | Display                                                                                                                                                             |
| `sidebar` (+ `use-mobile` hook)                                                       | ui        | Collapsible sidebar with the straight full-height active bar                                                                                                        |
| `message`, `bubble`                                                                   | ui        | Chat messages                                                                                                                                                       |
| `header-icon-button`                                                                  | component | Icon-only button with tooltip, for headers and toolbars                                                                                                             |
| `page-header`                                                                         | component | `PageHeader` (description, subheader, filter row) and `FilterSearch`                                                                                                |
| `page-layout`                                                                         | component | `PageLayout` page scaffold, flat `TablePanel`, `TablePagination`, `TablePaginationFooter` (+ `lib/list-per-page.ts`: rows-per-page options and URL helpers)         |
| `data-table-toolbar`                                                                  | component | Search, selection count and bulk actions                                                                                                                            |
| `page-empty-state`                                                                    | component | Empty state with icon, title, sentence, CTA, docs link                                                                                                              |
| `settings-form-actions`                                                               | component | Sticky Save bar for settings forms                                                                                                                                  |
| `confirm-destructive-dialog`                                                          | component | Cancel / Delete confirmation, optional typed name                                                                                                                   |
| `app-shell`                                                                           | component | `AppShell`, `AppContent` (framed inset panel), `AppSidebarHeader`, `Breadcrumbs`, `TruncatedText`                                                                   |
| `chat-layout`                                                                         | component | `ChatLayout` (list column + thread), `ChatListSection`, `ChatListItem`, `ChatThread`, `ChatComposer` (+ `lib/composer-chrome.ts`, `hooks/use-autosize-textarea.ts`) |

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

The playground has both as full screens (`#/users`, `#/settings`, `#/assistant`, `#/chat`; add `/dark` for dark mode).

## Changes from externa-core

The code is copied unchanged except:

- `page-header`, `data-table-toolbar`: the search `maxLength` default is `255` instead of Externa's `STRING_LIMITS.SEARCH` (same value).
- `settings-form-actions`: without Externa's unsaved-changes toolbar (Excubia's copy).
- The rows-per-page helpers of Externa's `lib/pagination.ts` are in `lib/list-per-page.ts`. `normalizePaginated` stays in each app's `lib/pagination.ts` (it needs the app's `@/types/admin`), and the name differs because `shadcn add` resolves `@/lib/pagination` to `components/ui/pagination.tsx` when both are installed together.
- `app-shell`, `app-content`, `breadcrumbs`, `app-sidebar-header`: the `AppVariant` and `BreadcrumbItem` types are declared in the files (`BreadcrumbItemType` is exported from `breadcrumbs.tsx`) instead of imported from `@/types`, because `shadcn add` rewrites `@/types` to `@/resources/js/types` in a Laravel app.
- `chat-layout` is new: the list column, thread, and composer frame that `/ai` and `/chat` repeat inline, extracted with the same classes. `ChatComposer` is the frame and send behaviour of Externa's `AiComposer`, without the Externa-specific actions (attachments, voice, presets), which an app passes as `actions`.

## How items install

`shadcn add` 4.23 writes every file unchanged into a Laravel React starter kit app (tested on a copy of excubia-app: all 46 files byte-identical, `tsc` green). `lib/utils.ts` and `lib/list-per-page.ts` are `registry:file` items with an explicit `resources/js/…` target: shadcn never overwrites a `registry:lib` `utils.ts` in a Laravel app, and its transforms drop a leading comment.

## Checks

- `npm run lint` runs `scripts/check-ui-tokens.mjs`: no raw palette utilities, `#hex` classes or arbitrary font sizes anywhere in `src/`.
- `npm run registry:check`: `public/r` matches the sources, and every item has a playground demo.

# List page

Admin lists: Users, Groups, Roles, API keys, Activity log.

**Registry:** `page-layout` (`TablePanel`, `TablePaginationFooter`), `data-table-toolbar`, `actions-overflow`, `user-avatar`, `table`, `checkbox`, `badge`, `select`, `toggle-group`, `page-empty-state`.

**Copy from externa-core:** `pages/admin/users/index.tsx` (reference list), `components/admin/data-table-toolbar.tsx`, `components/layout/page-layout.tsx`, `components/admin/files/files-selection-toolbar.tsx`, `lib/pagination.ts`.

## Toolbar

- `filters={<DataTableToolbar …/>}`: search (and filters) on the **left**.
- `filtersRight`: sort `Select` (`w-[7.5rem]`), direction icon button, segmented view toggle (e.g. active / trash), on the **right**.
- All controls at the default 32px size.

## Selection bar

When rows are selected the same row becomes the selection bar:

- **Left:** select-all checkbox (where the list has one), count ("3 selected") with a clear (X) button.
- **Right:** the bulk actions (icon buttons with tooltips in dense bars). `filtersRight` is hidden.
- Sources: `DataTableToolbar` with `selectedCount`, `onClearSelection`, `bulkActions`; `components/admin/files/files-selection-toolbar.tsx` (the bulk actions there are an `ActionsOverflow` with `iconOnly`, `className="justify-end"`, in a `flex-1` slot so it measures the free width). The playground `#/files` screen has it.

## Overflow

Actions spill into a ⋯ menu **only when space runs out**, measured with `ResizeObserver`, never by counting items: the `actions-overflow` item (`ActionsOverflow`). Its `pinned` slot never spills. It needs the free width of its row: give it a `flex-1` slot, never a shrink-wrapped one such as `filtersRight`.

## Table

- `TablePanel` + `Table`: the head is muted, uppercase, small; it sticks to the top of the panel.
- First column: selection checkbox (`w-10`). Names: avatar (`UserAvatar` from `user-avatar`, with `isOnline` where presence is known) or icon + `font-medium` name; a slug or secondary id below or beside it in `font-mono text-xs text-muted-foreground` (one combined cell, not two columns).
- Numbers right-aligned with `tabular-nums`.
- Status as `Badge` (`success` / `muted` / `warning` / `destructive`).
- Row actions in the **last column**, right-aligned, `size="icon-sm"` ghost buttons (24px, the only place `sm` is the norm).

## Pagination

`TablePaginationFooter` in the `TablePanel` footer, under the table, inside the panel:

- **Left:** counter "1–20 of 67".
- **Centre:** page links (Previous, numbers, Next).
- **Right:** rows-per-page `Select` showing "20 / page", options 10 / 20 / 50 / 100, no label, kept in the `per_page` query param (dropped at the default 20).
- Shown only when `hasTablePaginationFooter(pagination)`.

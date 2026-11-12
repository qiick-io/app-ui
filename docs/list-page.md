# List page

Admin lists: Users, Groups, Roles, API keys, Activity log.

**Registry:** `data-table` (`DataTable`, `DataTableColumnHeader`, `DataTableFacetedFilter`), `page-layout` (`TablePanel`, `TablePaginationFooter`), `data-table-toolbar`, `actions-overflow`, `user-avatar`, `table`, `checkbox`, `badge`, `select`, `toggle-group`, `page-empty-state`.

**Copy from externa-core:** `pages/admin/users/index.tsx` (reference list), `components/admin/data-table.tsx`, `components/admin/data-table-toolbar.tsx`, `components/layout/page-layout.tsx`, `components/admin/files/files-selection-toolbar.tsx`, `lib/pagination.ts`.

A list people triage (issues, alerts, tickets) rather than browse: the optional [inbox list](optional/inbox-list.md) pattern adds saved views, a fixed filter order and the item beside the list.

A cell that holds several items (the largest tables, the packages blocking an upgrade): the optional [table cell details](optional/table-cell-details.md) pattern keeps it on one line and opens the full list in a popover.

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

- `DataTable` (TanStack Table, the shadcn data-table pattern) inside its own `TablePanel` (its scroller takes `tabIndex={0}` while the content overflows, so the keyboard can scroll it), server-driven: sort, filter and paging are done by the server (`manual*`). The page owns the query (Inertia visits, URL params, `per_page`); the table reports `onSortChange` and `onRowSelectionChange` and renders the pagination footer.
- Columns are `ColumnDef`s. A sortable column has `accessorKey` and `enableSorting: true`, its id is the server sort field, and its header is `DataTableColumnHeader` (ascending / descending dropdown). Sortable and plain headers look the same (shadcn table head: normal case, `font-medium`, foreground, `text-sm`); only the sort icon tells them apart. `meta.headerClassName` / `meta.cellClassName` style a column; `meta.isRowClickIgnored` keeps clicks in a cell from opening the row.
- Facets (status, action, type) are `DataTableFacetedFilter` in the filter row: outline dashed trigger, selected values as badges, `Command` list in a `Popover`.
- First column: selection checkbox (`w-10`, `dataTableSelectColumn`) with a 24px hit area; a hand-built table passes `checkboxTargetClassName` to its checkboxes. A clickable row (`role="link"`) takes its name from its cells: no `aria-label` that differs from the visible text. Names: avatar (`UserAvatar` from `user-avatar`, with `isOnline` where presence is known) or icon + `font-medium` name; a slug or secondary id below or beside it in `font-mono text-xs text-muted-foreground` (one combined cell, not two columns).
- **One row height: 41px** in every admin table (24px content + `p-2` cells + the border), text-only tables included (the DataTable sets the minimum). Nothing in a cell may be taller than 24px: avatars in cells are `size="sm"` (`UserAvatar size="sm"`, group and member avatars too), row actions are `icon-sm`, long text stays on one line, truncated, with the full text in a `Tooltip`.
- Numbers right-aligned with `tabular-nums`.
- Status as `Badge` (`success` / `muted` / `warning` / `destructive`).
- Row actions in the **last column** (`meta: { headerClassName: 'w-[1%] text-right', cellClassName: 'text-right', isRowClickIgnored: true }`): a `ButtonGroup` (`aria-label` = the column name, `className="ml-auto"`) of outline `size="icon-sm"` `HeaderIconButton`s (24px, the only place `sm` is the norm), delete last with `className="text-destructive hover:text-destructive"`. Text actions (Restore, Delete forever) are outline `size="sm"` buttons in the same group. The playground `#/users` screen has it.

### Wide tables on small screens

On a phone most tables are wider than their card. They keep every column and scroll sideways; the **scroll cue** tells the user that columns are hidden:

- The content fades out over the last 2rem on each side that hides columns (right at rest, both sides mid-scroll, left at the end). A table that fits shows nothing, so desktop tables are unchanged.
- Built in: the `table` container and the `TablePanel` scroller both use `useScrollRegion`, which sets `data-scroll-cue-left` / `data-scroll-cue-right` on scroll, resize and content changes; the `theme` draws the fade as a mask (no colour, so it is right in light, dark and high contrast) and animates it only without reduced motion.
- While it scrolls, the scroller is a focusable region named "Scrollable table" (`a11y.scrollableTable`): Tab reaches it and the arrow keys scroll it. On keyboard focus the fade gives way to the focus ring.
- Nothing to add per page: no wrapper, no extra classes. Do not stack rows below `sm` or hide columns to avoid the scroll; keep the 41px row and put the row actions last as usual. The playground `table` demo has a wide table in a phone-width card.

## Pagination

`TablePaginationFooter` in the `TablePanel` footer, under the table, inside the panel:

- **Left:** counter "1–20 of 67".
- **Centre:** page links (Previous, numbers, Next).
- **Right:** rows-per-page `Select` showing "20 / page", options 10 / 20 / 50 / 100, no label, kept in the `per_page` query param (dropped at the default 20).
- Shown only when `hasTablePaginationFooter(pagination)`.

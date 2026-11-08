# List page

Admin lists: Users, Groups, Roles, API keys, Activity log.

**Registry:** `data-table` (`DataTable`, `DataTableColumnHeader`, `DataTableFacetedFilter`), `page-layout` (`TablePanel`, `TablePaginationFooter`), `data-table-toolbar`, `actions-overflow`, `user-avatar`, `table`, `checkbox`, `badge`, `select`, `toggle-group`, `page-empty-state`.

**Copy from externa-core:** `pages/admin/users/index.tsx` (reference list), `components/admin/data-table.tsx`, `components/admin/data-table-toolbar.tsx`, `components/layout/page-layout.tsx`, `components/admin/files/files-selection-toolbar.tsx`, `lib/pagination.ts`.

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

- `DataTable` (TanStack Table, the shadcn data-table pattern) inside its own `TablePanel`, server-driven: sort, filter and paging are done by the server (`manual*`). The page owns the query (Inertia visits, URL params, `per_page`); the table reports `onSortChange` and `onRowSelectionChange` and renders the pagination footer.
- Columns are `ColumnDef`s. A sortable column has `accessorKey` and `enableSorting: true`, its id is the server sort field, and its header is `DataTableColumnHeader` (ascending / descending dropdown). `meta.headerClassName` / `meta.cellClassName` style a column; `meta.isRowClickIgnored` keeps clicks in a cell from opening the row.
- Facets (status, action, type) are `DataTableFacetedFilter` in the filter row: outline dashed trigger, selected values as badges, `Command` list in a `Popover`.
- First column: selection checkbox (`w-10`, `dataTableSelectColumn`). Names: avatar (`UserAvatar` from `user-avatar`, with `isOnline` where presence is known) or icon + `font-medium` name; a slug or secondary id below or beside it in `font-mono text-xs text-muted-foreground` (one combined cell, not two columns).
- **One row height: 41px** in every admin table (24px content + `p-2` cells + the border), text-only tables included (the DataTable sets the minimum). Nothing in a cell may be taller than 24px: avatars in cells are `size="sm"` (`UserAvatar size="sm"`, group and member avatars too), row actions are `icon-sm`, long text stays on one line, truncated, with the full text in a `Tooltip`.
- Numbers right-aligned with `tabular-nums`.
- Status as `Badge` (`success` / `muted` / `warning` / `destructive`).
- Row actions in the **last column** (`meta: { headerClassName: 'w-[1%] text-right', cellClassName: 'text-right', isRowClickIgnored: true }`): a `ButtonGroup` (`aria-label` = the column name, `className="ml-auto"`) of outline `size="icon-sm"` `HeaderIconButton`s (24px, the only place `sm` is the norm), delete last with `className="text-destructive hover:text-destructive"`. Text actions (Restore, Delete forever) are outline `size="sm"` buttons in the same group. The playground `#/users` screen has it.

## Pagination

`TablePaginationFooter` in the `TablePanel` footer, under the table, inside the panel:

- **Left:** counter "1–20 of 67".
- **Centre:** page links (Previous, numbers, Next).
- **Right:** rows-per-page `Select` showing "20 / page", options 10 / 20 / 50 / 100, no label, kept in the `per_page` query param (dropped at the default 20).
- Shown only when `hasTablePaginationFooter(pagination)`.

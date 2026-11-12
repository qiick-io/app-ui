# Table cell details

Report tables sometimes need a list inside one cell: the largest database tables, the packages blocking an upgrade, one line per backup disk or connection. Stacking the items makes the row grow (13 lines for a single row), and the table can no longer be scanned. This pattern keeps every such cell on one line and puts the full list one click away.

**Use when:** a table cell holds several items (names, or sizes and shares) that people check now and then, not on every scan.
**Skip when:** the cell has one or two short items; show them inline. When the list is the point of the page, give it its own section or page.

**Registry:** `table-cell-details` (`TableCellDetails`, `lib/table-cell-details.ts`), on the core `popover`, `drawer`, `button`, `use-mobile` and `use-scroll-region`. **Playground:** the `table-cell-details` section of the catalogue.
**Seen in:** excubia-app (Infrastructure card, Fleet upgrade readiness).

## Rules

- **Positions.** The summary stays left-aligned in the cell, on one line (it truncates). The button follows it directly, never pushed to the far right of the cell.
- **Summary.** One line: a total ("1.2 GB"), a count ("12 packages") or the first item followed by "+N" (the default when the app passes no `summary`). With no items the cell shows only its summary, without a button.
- **Button.** Ghost, `icon-sm` (24px, the compact inline step of the control scale), with a chevron. It opens on click or keyboard, never on hover.
- **Detail.** A `Popover` aligned to the start of the button, at most 20rem wide, with the title on top. Past about ten rows the items scroll inside it. On mobile (below 768px) the same content opens in a bottom `Drawer` with a Close button.
- **Two content variants**, chosen per cell (both are part of the one pattern, not an adopted variant):
    - `list`: names, one per line (packages, disks). Long names wrap.
    - `bar`: one horizontal bar per item for sizes or shares (largest tables), scaled against the largest value. Bars rather than a pie, because a pie cannot compare close values (0.08 / 0.08 / 0.06 MB). Each item shows its formatted value as visible text (`valueLabel`); the bar is decoration. Bars use `bg-primary` on a `bg-muted` track, never a status colour.
- The app orders the items (largest first for bars) and caps how many it sends; the popover is not a paginated list.

## Keyboard and accessibility

- The button's accessible name (`triggerLabel`) gives the summary and its context: "Show 5 largest tables", "Show 12 packages blocking the upgrade". It exposes `aria-expanded`.
- Enter or Space opens the popover; Escape or a click outside closes it, and focus returns to the button. The drawer behaves the same.
- The scroll area joins the tab order only while it overflows, so the keyboard can scroll it.
- Items are a list (`ul`), so screen readers announce how many there are. Bars are `aria-hidden`; the value label is read instead.

## i18n

`a11y.close` (the drawer's Close button). The summary, title, accessible name, item labels and formatted values come translated from the app.

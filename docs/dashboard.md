# Dashboard

**Registry:** `card`, `kpi-tile`, `stat-card`, `page-layout`, `tabs`, `toggle-group`, `table`, `card-table-scroll`, `info-hint`, `page-empty-state`.

**Copy from externa-core:** `pages/dashboard.tsx`. Key numbers come from the shadcn [`dashboard-01` block](https://ui.shadcn.com/blocks) (`section-cards.tsx`).

- `PageLayout scrollContent`. Views (Overview / Health) are line tabs under the header, each with its own URL; the period and scope filters are a segmented `ToggleGroup` in the filter row. See [page.md](page.md).
- Cards are **flat** and sit in a grid: `grid grid-cols-1 gap-4 xl:grid-cols-12`, cards spanning columns (`xl:col-span-4`, `xl:col-span-5`, …).
- Each card: `CardHeader className="pb-3"` with `CardTitle`, then `CardContent`. A `CardDescription` only when it carries data the title cannot ("8 of 22 open problems", "Last hour"), never a sentence that explains the card: see [Page text](page.md#page-text). No extra icons or coloured headers.
- Tables inside cards: `CardTableScroll` (below), names `truncate font-medium` with a `font-mono text-xs text-muted-foreground` secondary line, numbers `text-right tabular-nums`.
- Empty card content uses `PageEmptyState compact`.

## Card grids

A dashboard or overview never shows a ragged gap: no card beside an empty space, at any width (phone, tablet, desktop).

- **Cards in one row share its height.** Grid items stretch by default: never add `items-start` to a card grid. A row of one lonely card beside a hole is a layout to fix, not to ship: widen the card (`col-span-full`), pair it with a sibling of similar weight (two short cards share a row: `xl:grid-cols-2`), or move a number into the key numbers row.
- **A card with a table never stretches its row.** Its table scrolls inside `CardTableScroll`, with the header row sticky on the card surface, and the card header keeps a "View all" link (`CardAction`, `Button variant="outline" size="sm"`) to the full list. Either:
    - a **fixed maximum height**: `<CardTableScroll className="max-h-80">` (`max-h-48` for a short list next to key numbers, `max-h-96` for a long one); or
    - **fills the row** that its siblings set: the card gets `xl:h-0 xl:min-h-full` (it takes the row height without adding to it), `CardContent className="flex min-h-0 flex-1 flex-col"`, and `<CardTableScroll className="max-h-96 xl:max-h-none xl:flex-1">`, so below `xl`, where the cards stack, it falls back to a fixed maximum height.
- **Short cards stack next to a tall one.** Several short cards (infrastructure, dependencies, runtimes) go in one column (`flex flex-col gap-4`) beside the tall card, which fills the row as above. Key number tiles go in the key numbers row or under each other, never stretched beside a list.
- **An odd last tile spans the row** at the two-column width, so five key numbers read 2-2-1 without a hole: add `sm:*:last:odd:col-span-2 xl:*:last:odd:col-span-1` to the key numbers grid (`xl:*:last:odd:col-span-1` only when the `xl` row holds them all).
- Check every grid at phone, tablet and desktop width, in light and dark.

Source: Excubia `components/projects/overview/overview-view.tsx` (short cards beside the checks card that fills the row), `pages/fleet/index.tsx` (a full key numbers row).

## Key numbers

A row of key numbers at the top of a dashboard uses **`KpiTile`**, with its delta coloured by what the change means and a 30-day `Sparkline`; compositions (severity, check outcomes) go in one card under the row. See [charts.md](charts.md) for the layout, the palette and when not to chart.

`StatCard` (the shadcn `dashboard-01` section cards) stays for existing screens: its badge does not say whether a change is good news, so new dashboards use `KpiTile`.

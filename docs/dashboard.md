# Dashboard

**Registry:** `card`, `kpi-tile`, `stat-card`, `page-layout`, `tabs`, `toggle-group`, `table`, `page-empty-state`.

**Copy from externa-core:** `pages/dashboard.tsx`. Key numbers come from the shadcn [`dashboard-01` block](https://ui.shadcn.com/blocks) (`section-cards.tsx`).

- `PageLayout scrollContent`. Views (Overview / Health) are line tabs under the header, each with its own URL; the period and scope filters are a segmented `ToggleGroup` in the filter row. See [page.md](page.md).
- Cards are **flat** and sit in a grid: `grid grid-cols-1 gap-4 xl:grid-cols-12`, cards spanning columns (`xl:col-span-4`, `xl:col-span-5`, …).
- Each card: `CardHeader className="pb-3"` with `CardTitle` and a **one-line** `CardDescription`, then `CardContent`. No extra icons or coloured headers.
- Tables inside cards: `max-h-64 overflow-auto`, names `truncate font-medium` with a `font-mono text-xs text-muted-foreground` secondary line, numbers `text-right tabular-nums`.
- Empty card content uses `PageEmptyState compact`.

## Key numbers

A row of key numbers at the top of a dashboard uses **`KpiTile`**, with its delta coloured by what the change means and a 30-day `Sparkline`; compositions (severity, check outcomes) go in one card under the row. See [charts.md](charts.md) for the layout, the palette and when not to chart.

`StatCard` (the shadcn `dashboard-01` section cards) stays for existing screens: its badge does not say whether a change is good news, so new dashboards use `KpiTile`.

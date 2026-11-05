# Dashboard

**Registry:** `card`, `stat-card`, `page-layout`, `tabs`, `toggle-group`, `table`, `page-empty-state`.

**Copy from externa-core:** `pages/dashboard.tsx`. Key numbers come from the shadcn [`dashboard-01` block](https://ui.shadcn.com/blocks) (`section-cards.tsx`).

- `PageLayout scrollContent`. Views (Overview / Health) are line tabs under the header, each with its own URL; the period and scope filters are a segmented `ToggleGroup` in the filter row. See [page.md](page.md).
- Cards are **flat** and sit in a grid: `grid grid-cols-1 gap-4 xl:grid-cols-12`, cards spanning columns (`xl:col-span-4`, `xl:col-span-5`, …).
- Each card: `CardHeader className="pb-3"` with `CardTitle` and a **one-line** `CardDescription`, then `CardContent`. No extra icons or coloured headers.
- Tables inside cards: `max-h-64 overflow-auto`, names `truncate font-medium` with a `font-mono text-xs text-muted-foreground` secondary line, numbers `text-right tabular-nums`.
- Empty card content uses `PageEmptyState compact`.

## Key numbers

A row of key numbers at the top of a dashboard uses **`StatCard`** (the shadcn `dashboard-01` section cards), not a `CardHeader` + `CardContent` card with a small value:

- Grid `grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12`, each `StatCard` `xl:col-span-3` (four per row).
- `label` is the metric name (one line). `value` is the formatted number; it renders large (`text-2xl`, `text-3xl` from 250px card width) with `tabular-nums`.
- `trend` is the change vs the previous period, from `trendOf(value, previous)`: a percentage when there is a previous value, the absolute change otherwise. It shows as an outline `Badge` with a lucide trend icon next to the value; leave it out when there is no comparison.
- `headline` is one short line that explains the number (a breakdown such as "11 medium · 3 low", or what counts). `context` is the muted second line, for the comparison period ("vs previous 14 days") or a scope. No long descriptions: move them to a tooltip.
- Colour never carries the trend alone: the badge always has the icon and the signed text.

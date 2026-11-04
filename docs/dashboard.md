# Dashboard

**Registry:** `page-layout`, `toggle-group`, `table`, `page-empty-state`. `Card` is the shadcn `card` primitive (externa-core `components/ui/card.tsx`).

**Copy from externa-core:** `pages/dashboard.tsx`.

- `PageLayout scrollContent`; views switch with the segmented `ToggleGroup` in the header (Overview / Health), see [page.md](page.md).
- Cards are **flat** and sit in a grid: `grid grid-cols-1 gap-4 xl:grid-cols-12`, cards spanning columns (`xl:col-span-4`, `xl:col-span-5`, …).
- Each card: `CardHeader className="pb-3"` with `CardTitle` and a **one-line** `CardDescription`, then `CardContent`. No extra icons or coloured headers.
- Tables inside cards: `max-h-64 overflow-auto`, names `truncate font-medium` with a `font-mono text-xs text-muted-foreground` secondary line, numbers `text-right tabular-nums`.
- Empty card content uses `PageEmptyState compact`.

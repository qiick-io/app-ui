# Charts and key numbers

**Registry:** `kpi-tile`, `sparkline`, `segmented-bar`, `time-series-chart`, `entity-bar-chart`, `chart-data-table` (on `chart`, shadcn's Recharts wrapper). Tokens: the `--chart-*` semantic palette in `@qiick/theme`.

**Playground:** `#/dashboard` (add `/dark`) rebuilds the Excubia project overview with every piece below.

A dashboard is read at a glance. A chart earns its place only when it reads faster than the number it draws; never add one for decoration.

## Which form

| The question                                    | Form                                                                | Item               |
| ----------------------------------------------- | ------------------------------------------------------------------- | ------------------ |
| How much, and is it getting better?             | Key number with the change vs the previous period and a 30-day area | `KpiTile`          |
| What is it made of? (severity, check outcomes)  | One horizontal bar split into segments, counts in the legend        | `SegmentedBar`     |
| How did it move over time, and who drove it?    | Stacked area over time, one metric at a time                        | `TimeSeriesChart`  |
| Which entity has the most? (projects, services) | Vertical bars, one colour, the value on every bar                   | `EntityBarChart`   |
| Anything else, or fewer than three values       | A number or a table, no chart                                       | `KpiTile`, `Table` |

### When not to chart

- **A single state or a full ratio.** "Runtimes supported 3/3" is a number; a gauge or a ring adds nothing.
- **No trend to show.** A tile without history has no sparkline; never draw a flat line to fill the space.
- **Two or three values.** Write them ("2 failed · 3 warnings"); a bar of three segments only helps next to the total it splits.
- **Exact values matter more than shape** (invoices, limits, audit lists): a table.
- **No pie, donut, gauge or radar charts**, and never a second y-axis: two measures with different units are a metric switch or two charts.

## Key numbers row

The top row of a dashboard. Copy the layout of `playground/src/screens/dashboard.tsx`:

- Grid `grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5` (or `xl:grid-cols-4` for four tiles). One row, at most five tiles.
- `label` is the metric name; `value` the formatted number, large and `tabular-nums`. A ratio keeps its denominator muted (`25<span className="text-lg text-muted-foreground">/41</span>`).
- `delta` comes from `kpiDeltaOf(value, previous, isIncreaseGood)`: the signed change and an arrow, coloured by what it **means**. `isIncreaseGood` is `false` for findings, exceptions, errors and latency (up is bad), `true` for checks passing and coverage, `null` when the change is neither (traffic). The arrow and the sign carry the direction, so colour never carries it alone. Leave `delta` out when there is no previous period.
- `secondary` is one short line: a breakdown ("2 failed · 3 warnings"), the comparison period ("vs previous 30 days") or a scope.
- `chart` is a `Sparkline` of the last 30 days, one value per day, which bleeds to the tile's edges. It is a shape, not a reading: no axes, no tooltip, hidden from screen readers. Leave it out when there is no history.

## Compositions

Compositions sit in **one card under the key numbers row**, side by side from `md` up (`grid gap-6 p-4 md:grid-cols-2`), each a `section` with an `h2` (`text-sm font-medium`) and a `SegmentedBar`.

- Segments keep the fixed order of their scale, worst first: critical → high → medium → low → info; fail → warn → pass → skipped. Never sort them by size.
- Every count is printed in the legend, zero included ("Critical 0" is good news worth reading). The bar is hidden from screen readers; the legend is a list named by `title`.
- Tones come from the semantic palette only (below). A composition of something else (plans, regions) is a table until a pattern for it exists.

## Time series

One card (`TimeSeriesChart`), on its own row or `xl:col-span-8` next to an entity comparison:

- Title left, **metric switch right** (`ToggleGroup type="single" variant="outline"`, the period filter's look). One metric at a time: agent time, cost or tokens, never two y-axes.
- Up to **five series**, stacked, coloured `--chart-1` … `--chart-5` in fixed order. A sixth series folds into "Other"; the component throws beyond five. A series keeps its colour when others are hidden.
- The legend under the plot shows each series' **total for the period** and toggles it (`aria-pressed`); the last visible series cannot be hidden.
- Tooltip on hover and on the arrow keys (Recharts' accessibility layer). Dates on the axis are short ("Nov 3"); values use the metric's `formatValue` everywhere: axis, tooltip, legend and table.
- `isLoading` shows a `Skeleton` the plot's height; a period with no data shows `emptyState` (`PageEmptyState compact`) instead of an empty grid.

## Comparing entities

`EntityBarChart` compares projects (or services, queues) on **one** measure: vertical bars in `--chart-1`, largest first, the value printed on every bar. Not for time (that is a `TimeSeriesChart`) and not for shares of a whole (a `SegmentedBar`). Long names are shortened under the bar; the tooltip and the table keep them whole. More than about eight entities: a table sorted by the measure.

## Palette

Fixed in every preset; a product never picks its own red for "critical". Defined in `qiick-theme.css`, as classes `bg-chart-critical`, … through `CHART_TONE_BACKGROUND` in `segmented-bar`.

| Token              | Light      | Dark       | Meaning           |
| ------------------ | ---------- | ---------- | ----------------- |
| `--chart-critical` | `#7f1a28`  | `#ef4a5c`  | Critical severity |
| `--chart-high`     | `#c8401c`  | `#f49a6e`  | High severity     |
| `--chart-medium`   | `#b7882a`  | `#fbe060`  | Medium severity   |
| `--chart-low`      | `#2f6fd6`  | `#5f93e8`  | Low severity      |
| `--chart-info`     | ink-400    | ink-500    | Info              |
| `--chart-pass`     | green-600  | green-400  | Check passed      |
| `--chart-warn`     | = medium   | = medium   | Check warning     |
| `--chart-fail`     | = critical | = critical | Check failed      |
| `--chart-skipped`  | = info     | = info     | Check skipped     |

Every token is ≥3:1 on the card and the page in light, dark and high contrast (`npm run a11y:contrast` checks it). Neighbours in each scale stay apart for colour-blind readers: adjacent OKLab ΔE ≥ 15 with normal vision and ≥ 8 under protanopia and deuteranopia. Change a value only after re-running both checks. Series identity (`--chart-1` … `--chart-5`) and status meaning never mix in one chart.

## Accessibility

- **Numbers are always visible** next to the chart: legend counts, legend totals or bar labels. Hover adds detail, never the only reading.
- Screen readers get the data, not the SVG: `SegmentedBar` reads its legend list, `TimeSeriesChart` and `EntityBarChart` render a visually hidden `ChartDataTable` with caption and headers. A sparkline is hidden; its tile's text states the number and the period.
- Keyboard: the metric switch and the legend toggles are buttons; the plots take focus and move the tooltip with the arrow keys.
- **No animation.** Charts render with `isAnimationActive={false}`, so reduced motion holds without a media query.
- Phone width: tiles stack, the composition card stacks, the time series header wraps; nothing scrolls sideways. Check light and dark.

Sources: shadcn charts (`ui.shadcn.com/charts`, the `chart` item on Recharts 3), the Excubia project overview it replaces.

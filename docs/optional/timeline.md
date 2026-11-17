# Timeline

Ordered steps (an upgrade plan, a setup checklist, a migration runbook) shown as a numbered list of long sentences blur together: what to do, how far along it is, and which packages or records it touches all sit in one line ("Update to the latest patch: spatie/laravel-activitylog 5.1.5, laravel/pint v1.32.3, …"). This pattern gives each step its own row on a vertical line, with a status badge, a short title and the touched items as chips that fold when there are many.

**Use when:** the screen shows a sequence the user works through in order (a plan, a checklist, a runbook), where each step has a status and some steps touch many items.
**Skip when:** the order does not matter (use a list or a table), the steps are a history of past events (an activity feed), or the user fills the steps in one after the other (a stepper inside a form).

**Registry:** `timeline` (`Timeline`, `TimelineStep`, `TimelineChip`, `lib/timeline.ts`), on the core `badge`, `button`, `collapsible` and `separator`. **Playground:** the `timeline` section of the catalogue.
**Seen in:** none yet; first consumer: the excubia-app upgrade plan.

## Rules

- **Layout.** A vertical `<ol>`: a marker column on the left (the marker, then a connector line down to the next marker; none after the last step) and the step's content on the right. The connector is a decorative vertical `Separator`.
- **Marker.** The step number by default, or a lucide `icon` when the step is better told by its kind. The marker border takes the status colour; its content stays `text-foreground`.
- **Header row.** The title (short, an imperative: "Update npm packages to the latest patch"), then the optional count, then the status badge. On narrow screens the badges wrap below the title.
- **Status** (optional), always a `Badge` with an icon and text, never colour alone:

    | `status`  | Badge variant | Icon            | Default text    |
    | --------- | ------------- | --------------- | --------------- |
    | `done`    | `success`     | `CircleCheck`   | Done            |
    | `current` | `info`        | `CircleDot`     | In progress     |
    | `pending` | `muted`       | `CircleDashed`  | To do           |
    | `warning` | `warning`     | `TriangleAlert` | Needs attention |
    | `blocked` | `destructive` | `Ban`           | Blocked         |

    `statusLabel` replaces the text when the app has a more precise word ("Ready"); the icon and colour stay those of the status.

- **Description** (optional): one or two sentences in `text-muted-foreground` under the header: the why or the way out ("No release supports Laravel 14 yet: watch, replace or fork").
- **Chips** (optional): the items the step touches, as outline badges in a wrapping list: a `label`, an optional `value` ("5.1.5") or a change `previousValue → value` ("1.2.0 → 1.3.0"). Long names wrap, never widen the page.
- **Folding.** Past `visibleChipCount` (default 6) the other chips fold into a `Collapsible` with a ghost `sm` button below them, "Show N more" / "Show less". A single extra chip shows instead of a "Show 1 more" button. The app orders the chips (most important first).
- **Count** (optional): a muted badge next to the title with a total (`count`), for example when the app sends fewer chips than the step touches. `countLabel` tells screen readers what it counts.
- **Density:** `default` (32px markers, roomy gaps) for a page section; `compact` (24px markers) for a card or a side panel.
- **States.** The app renders no timeline when there are no steps (show the page's empty state instead); a loading plan is skeleton rows, not an empty list.
- The timeline is not interactive beyond folding: actions for a step (open a page, run a command) belong to the step's content or the page header.

## Keyboard and accessibility

- The steps are an `<ol>`: screen readers announce how many steps there are and the position of each. The visible number in the marker is `aria-hidden`, so it is not read twice.
- The `current` step carries `aria-current="step"`.
- The status is text inside the badge; its icon is `aria-hidden`.
- A change chip reads "from 1.2.0 to 1.3.0"; the drawn arrow is hidden.
- The count reads as its `countLabel` ("12 packages"), not as a bare number.
- "Show N more" is a real button (Radix `CollapsibleTrigger`) with `aria-expanded` and `aria-controls`; Enter or Space toggles it. It is the only control in the timeline, so Tab moves from one folded step to the next.
- Pass the list a name with `aria-label` or `aria-labelledby` (the section heading) when the page has more than one list.
- Responsive down to 390px: the content column shrinks, titles, descriptions and chips wrap.

## i18n

`timeline.status.done`, `timeline.status.current`, `timeline.status.pending`, `timeline.status.warning`, `timeline.status.blocked`, `timeline.showMore` (`{{count}}`), `timeline.showLess`, `timeline.valueChange` (`{{from}}`, `{{to}}`) and `timeline.itemCount_one` / `_other` (the count's fallback screen-reader text). Titles, descriptions, chip labels and values, `statusLabel` and `countLabel` come translated from the app.

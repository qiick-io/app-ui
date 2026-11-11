# Grouped view tabs

The core view tabs ([page.md](../page.md#views-tabs-under-the-header)) work up to about six views. Past that the row overflows, and every view looks equally important. Grouped tabs sort the views by the question they answer (what's wrong, is it healthy, what does it depend on) and show a count and a severity marker, so the tabs also say where to look.

**Use when:** a record has more than about six views.
**Skip when:** it has six or fewer. Plain line tabs stay the core rule.

**Registry:** `grouped-view-tabs` (`GroupedViewTabs`). **Playground:** the `grouped-view-tabs` section of the catalogue (both variants).
**Seen in:** excubia-app's project page (from v1.0.0).

## Variants

An app picks one and declares it (`grouped-tabs:sub-menu` or `grouped-tabs:two-rows`). Every record page of the app uses the same one.

- **`sub-menu`**: one row. A group with several views is a tab that opens a menu of them, and shows "Group: View" while one of its views is open. Pick it when most groups have two or three views and vertical space matters.
- **`two-rows`**: group tabs, then a second row with the active group's views. A group tab opens the view last open in it, or else its first view. Pick it when people switch often between views of the same group.

## Rules

- Everything in the core view-tab rules still holds: under the header, above `PageLayout`, every view with its own URL, the server passes the active view, no view state in the page.
- Group by question, not by data source. A typical order is Overview, Issues, Health, Dependencies, Alerts, History. Overview is always first and on its own. A group with one view shows that view's label.
- `count` is the number of **open** items in the view (unresolved, active), and is hidden at 0. `severity` is the worst open problem (`warning` or `critical`). A group shows the sum of its counts and its worst severity. Pass only values the page already loads: never one query per tab.
- Below `sm`, both variants become one native select of every view, grouped, that navigates on change.

## Keyboard and accessibility

- WAI-ARIA tabs: arrow keys move across the tab row, Enter or Space opens a link or a group's menu. The active view's link has `aria-current="page"`.
- Severity is an icon plus a screen-reader label (`viewTabs.severity.*`), never colour alone. Counts are text.
- `aria-label` names the views ("Project views"). The second row is labelled with the group's name.

## i18n

`viewTabs.severity.warning`, `viewTabs.severity.critical`. Group and view labels come translated from the app.

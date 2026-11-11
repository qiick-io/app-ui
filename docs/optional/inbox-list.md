# Inbox list

A work queue (exceptions, alerts, findings, tickets) is triaged, not browsed. People go through it one item at a time, act on each, and come back the next day to what's new. The core [list page](../list-page.md) gives the toolbar, selection bar and table. This pattern adds the parts triage needs, and the same rules on every queue of the app.

**Use when:** a list is a queue people work through and act on.
**Skip when:** it's a record list people search and open (users, roles, settings). The core list page is enough.

**Registry:** `inbox-list` (`InboxSavedViews`, `InboxDetailSheet`), on the core `data-table`, `data-table-toolbar` and `DataTableFacetedFilter`. **Playground:** the `inbox-list` section of the catalogue.
**Seen in:** excubia-app (exceptions, findings, alerts, from v1.0.0).

## Variants

Declared as `inbox-list:side-panel` or `inbox-list:full-page`. Every queue of the app uses the same one.

- **`side-panel`**: clicking a row opens the item in `InboxDetailSheet`, beside the list, with `?item=<id>` in the URL. The list keeps its scroll, filters and selection. "Open full page" leads to the item's own page. Pick it when people triage many items in a row.
- **`full-page`**: clicking a row opens the item's page, which uses the same layout as the sheet. Pick it when an item needs the whole width (long traces, side-by-side diffs).

## Rules

- **Saved views** (`InboxSavedViews`) sit above the toolbar, left-aligned. Each is a preset filter set with its own URL, such as "Unresolved", "Assigned to me" or "New in 24h", with an optional count. The view whose filters match the URL is active. Changing a filter by hand leaves none active. The first view is the default.
- **Filters in a fixed order**, in one row: status, severity, assignee, time range, then search. Facets are `DataTableFacetedFilter`. Every filter lives in the URL.
- **Bulk actions** come from the core selection bar (`DataTableToolbar` `bulkActions`): assign, resolve, mute, in that order, with destructive ones confirmed ([destructive-actions.md](../destructive-actions.md)). The server authorizes and logs **each** item, never the batch as a whole.
- **Item layout**, the same in the sheet and on the full page:
    1. the summary: status and severity badges, the title, one description line (type, occurrences, first and last seen), then the actions;
    2. **What to do** (`nextStep`): the ready command, prompt or next step;
    3. collapsed sections: trace, context, history. The app opens at most one by default.
- **Empty views** explain why they are empty and how to widen them ("No unresolved exceptions in the last 24 h. Widen the range"), using `page-empty-state`.
- **One vocabulary per app** for the actions (Resolve, Mute, Assign), in the locale files. Two words only when they mean two different things.

## Keyboard and accessibility

- Saved views are a `nav` of links with `aria-current="page"` on the active one.
- The sheet is a dialog: focus moves into it, Escape closes it, and focus returns to the row. Its title is the item's title.
- Sections are disclosure buttons (`Collapsible`) with their state announced.
- With [keyboard shortcuts](keyboard-shortcuts.md) adopted: `j` / `k` move between rows, Enter opens, `x` selects, and the app's action letters (`e` resolve, `a` assign).

## i18n

`inbox.savedViews`, `inbox.openFullPage`, `inbox.nextStep`, `inbox.detailDescription`. View labels, sections and actions come translated from the app.

## Backend

- Saved views are fixed sets of query parameters the controller already understands. No stored views.
- Counts for saved views come from one grouped query, never one query per view.
- The item for `?item=` loads as a partial reload of a single prop, so opening an item doesn't reload the list.

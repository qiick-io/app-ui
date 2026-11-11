# Command palette and global search

In an app with many records, people know what they want by name: a project, a user, a setting. The command palette reaches any of them, and any action, from anywhere, without clicking through lists.

**Use when:** users jump between many entities (projects, users, records), or the app has more pages than the sidebar shows comfortably.
**Skip when:** the app has a handful of pages and short lists.

**Registry:** `command-palette` (`CommandPalette`, `CommandPaletteTrigger`), on `command` and `keyboard-shortcuts`. **Playground:** the `command-palette` section of the catalogue.
**Seen in:** excubia-app (from v1.0.0).

## Rules

- Mount `CommandPalette` once in the authenticated layout, inside `ShortcutsProvider` (see [keyboard-shortcuts.md](keyboard-shortcuts.md)). It registers ⌘K / Ctrl+K itself. ⌘K is reserved for it in every qiick app.
- `CommandPaletteTrigger` sits in the header, as the **first** of the header actions on the right. It looks like a search field with the ⌘K hint from `sm` up, and an icon button below.
- Groups, in this order:
    1. **Recent**, kept by the palette, shown only before typing;
    2. **Navigation**, the sidebar modules the user can see;
    3. **records** from the server, one group per type (Projects, Users, …);
    4. **Actions**, such as "Pin project" or "Assigned to me".
       Navigation and actions are `groups`, filtered locally. Records come from `search`.
- A result has a `label`, an optional `description` (its type or parent), an optional lucide `icon`, and optional `meta` (a status badge, never colour alone). A link result has `href`; an action has `onSelect`.
- Enter opens a result with the app's `onNavigate` (Inertia `router.visit`). ⌘ / Ctrl+Enter opens a link in a new tab.
- `recentStorageKey` is per app (`<app>.palette.recent`). Only links are remembered (id, label, description, href), never actions.

## Keyboard and accessibility

- cmdk gives the listbox semantics: arrows move, Enter selects, Escape closes, and the active row is announced (`aria-activedescendant`). The dialog has a screen-reader title and description, and traps focus.
- Search status ("Searching…", "Search failed") is a `role="status"` line. A failed search keeps the local results.
- Inside a rich-text editor, ⌘K stays with the editor (insert link). The palette opens from the trigger there.

## i18n

`commandPalette.title`, `description`, `placeholder`, `empty`, `searching`, `searchFailed`, `recent`, `trigger`, `open`. Group headings and results come translated from the app.

## Backend

- **One search endpoint** per app (for example `GET /search?query=`) returning the record groups as JSON. It is throttled (`throttle:60,1`), returns nothing below two characters, and caps each group (5 to 8 results).
- **Scope by policy.** It returns only records the user may open: the same visibility scope and policies the index pages use. A palette must never reveal a record's existence to someone who can't view it.
- `search` receives an `AbortSignal`. Pass it to `fetch` so a stale request is cancelled while the person types. The palette debounces by 250 ms.

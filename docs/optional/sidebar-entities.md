# Sidebar filter, pinned and needs-attention entity lists

When an app's main entity (projects, workspaces, clients) has more records than the nav can list, people still return to a few of them, and need to notice the ones in trouble. This pattern puts both under the entity's nav item, so reaching them doesn't mean opening the index first.

**Use when:** the main entity has more than about ten records per user, and users return to a few of them or watch their health.
**Skip when:** the nav is static, or the entity has only a handful of records (link them directly).

**Registry:** `sidebar-entity-list` (`SidebarEntityList`, `SidebarEntityFlyout`, `PinToggleButton`, `SidebarFilterProvider`, `SidebarFilterInput`, `useSidebarFilter`). **Playground:** the `sidebar-entity-list` section of the catalogue.
**Seen in:** excubia-app (projects, from v1.0.0). externa-core has the related per-user ordering of sidebar modules (Settings → Appearance → Sidebar), the AI item pinned first, and the unread badge on a nav item.

## Rules

- **The parent nav item still links to the index.** The blocks sit under it, in `SidebarMenuSub`, and end with "View all".
- **Pinned** comes first. It holds the records the user starred with `PinToggleButton` (on list rows and in the record header), in a **stable order**: pin order or alphabetical, never by status, so items never move under the cursor. Cap it at about 8. With no pins, it shows the hint to pin one.
- **Needs attention** is optional. It holds non-pinned records with open problems, worst first, capped at about 5, and is hidden when empty. It is the one ordered block.
- Each record shows its status as an icon plus a screen-reader label (`good`, `warning`, `critical`), never a bare coloured dot. The active record has the sidebar's active bar and `aria-current="page"`.
- **Icon-only sidebar:** wrap the parent `SidebarMenuButton` in `SidebarEntityFlyout`. Clicking it then opens the same blocks as a menu beside the sidebar, with "View all" last.
- **Filter field** (`SidebarFilterInput`): optional, first in the sidebar content, hidden in the icon-only sidebar (⌘K takes over there). It filters entity lists, and the app's nav items when they call `useSidebarFilter(label)`. Escape clears it.
- Order and pinning of the nav **modules** themselves (externa-core's sidebar settings) is part of the same pattern. When an app offers it, it lives in Settings → Appearance → Sidebar, and the Assistant stays first.

## Keyboard and accessibility

- Every record is a link in the sidebar's tab order. Each block is a labelled list.
- `PinToggleButton` has `aria-pressed` and a label naming the record ("Pin Billing API").
- The flyout is a standard dropdown menu: arrow keys, Escape, focus returns to the trigger.

## i18n

`sidebarEntities.pinned`, `needsAttention`, `viewAll`, `pinHint`, `pin`, `unpin` (with `{{name}}`), `filter`, `filterPlaceholder`, `status.good`, `status.warning`, `status.critical`.

## Backend

- **Pins:** a per-user table (`user_id`, the record id, `position`, a unique pair, cascade on delete), with pin, unpin and (if kept in pin order) reorder endpoints. Forward-only migration.
- **Shared prop:** the blocks come as one shared Inertia prop. It is lazy or deferred so pages that don't render it pay nothing, and cached per user for a few seconds. No N+1 in the attention ranking.
- **Scope:** only records the user may view (the same visibility scope as the index). A pin the user can no longer see is dropped from the prop.

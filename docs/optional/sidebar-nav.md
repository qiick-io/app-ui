# Sidebar navigation with children

A flat "Platform" list stops working when an area has several pages of its own (collections, user management, settings sections) or when the app navigates a hierarchy (folders). This pattern nests them in the sidebar, the way the shadcn sidebar blocks do, without each app building its own submenu.

**Use when:** an area has 2–6 sub-pages that people reach directly, the nav would otherwise pass about ten items, or the app shows a folder hierarchy in the sidebar.
**Skip when:** the nav fits in a flat list, or the sub-pages are views of one record (use the record's tabs, `docs/detail-page.md`). Records under an entity (pinned, needs attention) are the [sidebar entities](sidebar-entities.md) pattern.

**Registry:** `sidebar-nav` (`SidebarNav`, `SidebarNavSection`, `SidebarNavTree`, `SidebarNavItem`, `hasActiveSidebarNavItem`). **Playground:** the `sidebar-nav` section of the catalogue.
**Seen in:** none yet. Upstream: ui.shadcn.com/blocks/sidebar, blocks sidebar-02, -03, -06, -07 and -11 (new-york-v4, read 2026-11-17).

## Rules

- **One component, three shapes.** `SidebarNav` renders the main nav: leaves are links, an item with `items` is a parent. `SidebarNavSection` is a group whose label folds its items (long navs split by area). `SidebarNavTree` is a folder tree of any depth (folders toggle, files link).
- **Children display**, per `SidebarNav`: `collapsible` (default; chevron on the right, rotates when open) or `open` (children always visible, the parent is a heading). Use one display per app.
- **A parent is a toggle, never a link.** Its first child is the area's landing page. A parent opens by itself when one of its children is the current page (`isActive`), so the active page is never hidden.
- **One level of children** in `SidebarNav`; deeper hierarchies are data and belong in `SidebarNavTree`.
- **Icon-only sidebar:** a parent shows its icon and, on click, a dropdown to the right with its title and children (shadcn sidebar-06), so children stay reachable when the sidebar is collapsed. The icon is active when a child is.
- **Active state:** the straight full-height bar of the core shell, on the child (`SidebarMenuSubButton`) and on the leaf. Never on a parent that only toggles.
- **Badges** (`badge`): counts or a short label at the end of the row (unread, invitations), muted text on children. Status colours only for status.
- **Order in the sidebar** stays the core one (`docs/shell.md`): logo → bell → pinned → nav groups → footer. Sections and trees go after the main nav group.

## Keyboard and accessibility

- Parents are buttons (`CollapsibleTrigger`): Enter or Space toggles; their state is exposed as `aria-expanded`.
- Children and leaves are links; the active one gets `data-active`, and in the icon-only dropdown `aria-current="page"`.
- In the icon-only sidebar, each parent keeps its tooltip with the title; the dropdown is a Radix menu (arrow keys, Escape returns focus to the icon).
- `open` display: the parent is a plain heading, not a control, so Tab goes straight to its children.

## i18n

No keys of its own: titles and badges come from the app, already translated.

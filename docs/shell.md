# App shell

The frame around every authenticated page: a two-tone sidebar on the left, a framed content panel with a header on the right.

**Registry:** `app-shell` (`AppShell`, `AppContent`, `AppSidebarHeader`, `Breadcrumbs`), `sidebar`, `tooltip`.

**Copy from externa-core:**

| What                                | File                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout composition                  | `layouts/app/app-sidebar-layout.tsx`                                                                                                              |
| Shell, inset panel, header          | `components/app-shell.tsx`, `components/app-content.tsx`, `components/app-sidebar-header.tsx`                                                     |
| Sidebar content                     | `components/app-sidebar.tsx`                                                                                                                      |
| Nav groups, footer links, user menu | `components/nav-main.tsx`, `components/nav-footer.tsx`, `components/nav-user.tsx`, `components/user-menu-content.tsx`, `components/user-info.tsx` |
| Sidebar primitive (active bar)      | `components/ui/sidebar.tsx`                                                                                                                       |
| Realtime dot on the avatar          | `components/realtime/connection-dot.tsx`                                                                                                          |
| Presence dot                        | `components/admin/user-avatar.tsx`                                                                                                                |

## Rules

- `<Sidebar collapsible="icon" variant="inset">`: the sidebar and the frame around the content share `--sidebar`; the content panel is `--background` with a light `border-sidebar-border/40` frame. In dark mode that is the two-tone shell (sidebar `#17232C` over background `#0E171E`).
- Sidebar order: logo (size `lg` menu button) → pinned items (Assistant first) → "Platform" group → footer (external links, notifications, user menu) → app version label (`text-xs text-muted-foreground`, centred) **under** the user menu.
- Active item: straight full-height bar on the left (`before:border-l-[3px] border-l-sidebar-primary`, square left corners) plus `bg-sidebar-accent` (externa-core #463). Do not use rounded pills or dots.
- The Assistant item has the `sidebar-ai-nav` class (1px primary outline, shimmer on hover) and the `⌘J` hint. Clicking it opens `/ai`; ⌘J / Ctrl+J opens the side panel (see [chat-and-assistant.md](chat-and-assistant.md)).
- Header: `h-16` (`h-12` when collapsed), sidebar trigger + breadcrumbs on the left, page actions on the right. Its bottom border runs edge to edge across the panel; it never floats.
- User menu: avatar with the realtime connection dot, name, chevron; dropdown items share one left edge (icon column aligned).
- Presence on avatars: `bg-success` when online, `bg-muted-foreground/30` when offline.

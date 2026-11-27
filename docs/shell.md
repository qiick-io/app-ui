# App shell

The frame around every authenticated page: a two-tone sidebar on the left, a framed content panel with a header on the right.

**Registry:** `app-shell` (`AppShell`, `AppContent`, `AppSidebarHeader`, `Breadcrumbs`), `sidebar`, `notifications` (`NotificationsBell`), `nav-user` (`NavUser`, `UserMenuContent`, `UserInfo`), `user-avatar` (`UserAvatar`, `ConnectionDot`), `avatar`, `assistant-panel`, `tooltip`.

**Copy from externa-core:**

| What                       | File                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Layout composition         | `layouts/app/app-sidebar-layout.tsx`                                                          |
| Shell, inset panel, header | `components/app-shell.tsx`, `components/app-content.tsx`, `components/app-sidebar-header.tsx` |
| Sidebar content            | `components/app-sidebar.tsx`                                                                  |
| Nav groups, footer links   | `components/nav-main.tsx`, `components/nav-footer.tsx`                                        |

## Rules

- `<Sidebar collapsible="icon" variant="inset">`: the sidebar and the frame around the content share `--sidebar`; the content panel is `--background` with a light `border-sidebar-border/40` frame. In dark mode that is the two-tone shell (sidebar `#17232C` over background `#0E171E`).
- Records under a nav item (pinned, needs attention) and a sidebar filter field: the optional [sidebar entities](optional/sidebar-entities.md) pattern.
- Sidebar order: logo (size `lg` menu button) → pinned items (Assistant first) → "Platform" group → footer (external links, notifications bell (`docs/notifications.md`), user menu) → app version label (`text-xs text-muted-foreground`, centred) **under** the user menu. See the version line below.
- **Version line:** `v<version> · <build>`, for example `v0.1.0-beta.1 · 3f9c2ab`. Never a placeholder such as `vdev` in production.
    - **Version:** the `version` of the app's `composer.json`, set by the release. Without it (local development) the line reads `dev`.
    - **Build ID:** it must describe the code that is running, so it comes from the first of these that has one: (1) `APP_BUILD` (`config('app.build')`), set **per deploy** by whatever deploys the app (CI, `docker build --build-arg APP_BUILD=$(git rev-parse HEAD)`, a deploy script that replaces the value each time), never a static value; the product's release workflow passes it to its published image; (2) a file written by the app's own build step when the app is the root of a git checkout, `bootstrap/cache/build.json` (commit and build time), written by an `<app>:record-build` command that Composer runs in `post-autoload-dump`, best effort (no git, no failure), which removes a stale file when it cannot record, and which `.dockerignore` excludes; (3) optionally a hosting platform's own commit variable, never required; (4) nothing: the line shows only the version.
    - A 7–40 character hex build ID is shortened to 7 and links to the commit in the product's own repository (`target="_blank"`, `aria-label` such as "Build 3f9c2ab: open the commit"); any other label is shown as is, unlinked. A fork that must not link upstream sets `APP_BUILD` to a label. Reference: excubia-app#425 (`SystemHealthService::appBuild()`, `excubia:record-build`, `docs/self-hosting.md#version-and-build-id`).
- Active item: straight full-height bar on the left (`before:border-l-[3px] border-l-sidebar-primary`, square left corners) plus `bg-sidebar-accent` (externa-core #463). Do not use rounded pills or dots.
- The Assistant item has the `sidebar-ai-nav` class (1px primary outline, shimmer on hover) and the `⌘J` hint. Clicking it opens `/ai`; ⌘J / Ctrl+J opens the side panel (see [chat-and-assistant.md](chat-and-assistant.md)).
- Header: `h-16` (`h-12` when collapsed), on the left the sidebar toggle, then `AppSidebarHeader`'s `leading` icons (the command palette's search, when the app adopts it), then the breadcrumbs; page actions on the right. Its bottom border runs edge to edge across the panel; it never floats.
- The sidebar toggle has a tooltip saying what a click does ("Collapse sidebar" / "Expand sidebar") with its shortcut (⌘B / Ctrl+B); header icon controls always name their shortcut in the tooltip rather than on the control.
- User menu (`nav-user`): avatar with the realtime connection dot, name, chevron; dropdown items share one left edge (icon column aligned). The app passes the user, its connection state (externa-core: `useEchoConnection()`), and `UserMenuContent` with its routes and hooks:

    ```tsx
    <NavUser user={user} connectionState={connectionState}>
        <UserMenuContent
            user={user}
            settingsHref={edit()}
            logoutHref={logout()}
            onNavigate={cleanup}
            onLogout={() => router.flushAll()}
            locale={{
                current: locale,
                options: availableLocales,
                onChange: changeLocale,
            }}
            appearance={{ value: appearance, onChange: updateAppearance }}
            accessibility={{
                highContrast,
                reduceMotion,
                onToggleHighContrast,
                onToggleReduceMotion,
            }}
        />
    </NavUser>
    ```

- Realtime dot (`ConnectionDot`): `bg-success` connected, pulsing `bg-warning` connecting, solid `bg-muted-foreground` off, `bg-destructive` offline.
- Presence on avatars (`UserAvatar isOnline`): `bg-success` when online, solid `bg-muted-foreground` when offline (never transparent).
- Avatars without a picture use the user's stable swatch (`avatar` with `userId`, theme tokens `--avatar-1` … `--avatar-10`).

# Notifications and messages

Two surfaces, one for the moment and one that lasts:

- **Toasts** react to what is happening now. They are gone after 3 to 5 s.
- The **notification centre** (bell and drawer) keeps what happened while the user was elsewhere: a failed background job, a new message, an alert. A notification stays until it is read.

When something deserves both (a background job finished while the user is on the page), the server stores the notification and the page may also show a toast; never only a toast for something the user must still see later.

## Toasts

**Registry items:** `@qiick/sonner` (the shadcn `sonner` Toaster) and `@qiick/toast` (`lib/toast.ts`, `lib/live-announcer.ts`).

The toasts have two channels, the same split as antd's `message` and `notification`:

| Channel      | Call                                               | Where                        | Look                                                             | Time |
| ------------ | -------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | ---- |
| Message      | `toast.success()`                                  | Top centre, below the header | Small, plain, green icon, no close button                        | 3 s  |
| Notification | `toast.error()`, `toast.warning()`, `toast.info()` | Top right, below the header  | Status colour (background and border), status icon, close button | 5 s  |

- A **message** confirms what the user just did ("Saved", "Copied", "Invitation sent"). One short line, no description.
- A **notification** tells the user something they have to read: a failure, a risk, news. A title and, if needed, a one-line `description` that says what to do.
- Both sit below the 4rem header (`offset`), so they never cover the header actions.
- A toast with an `action` (for example Undo) stays until it is closed, so the action can be reached with the keyboard; a success message with an action gets a close button.
- Errors are also announced assertively to screen readers (`lib/live-announcer.ts`); the others stay polite.
- Colour never carries the meaning alone: every notification has its icon and its text.

### Not a toast

- **Form validation** errors go under the field (`Field` / `FieldError`), not in a toast: the user has to see them next to what they have to fix. A toast is for a submit that failed for another reason (server error, conflict).
- **Long or blocking** content (a destructive confirmation, a choice) is a dialog. See [destructive-actions.md](destructive-actions.md).
- **State of the page** (a disabled feature, a missing setting) is an `Alert` in the page, not a toast.

### In an app

Mount the Toaster once, in `app.tsx`, with the app's resolved appearance:

```tsx
<Toaster theme={resolvedAppearance} />
```

Import `toast` from `@/lib/toast` everywhere else, never from `sonner`. Position, offset, duration, colours and the close button come from the item; do not pass them in `app.tsx`.

Source: externa-core `components/ui/sonner.tsx`, `lib/toast.ts`, `lib/live-announcer.ts` (the same in Excubia), on the shadcn `sonner` component.

## Notification centre

**Registry item:** `@qiick/notifications` (`components/notifications/notifications-bell.tsx`, `components/notifications/notifications-drawer.tsx`, `components/sidebar-unread-badge.tsx`, `lib/notifications-api.ts`, `lib/notification-sound.ts`). **Playground:** the `notifications` section of the catalogue.

### Rules

- **Bell:** a sidebar menu item (bell icon, "Notifications") with the red unread badge (`SidebarUnreadBadge`, capped at 99+). It sits in the **sidebar header**, under the logo, next to the search when the app has one (the sidebar filter or the ⌘K trigger). In the icon-only sidebar it stays an icon with the badge on it.
- **Drawer:** a `Sheet` on the **right**, `sm:max-w-md`: title and description, then "Mark all as read" right-aligned under them, then the list, newest first.
- **Item:** icon, title, body, time, in an outlined `Item`; unread items have the `bg-muted/40` tint and a "Mark as read" action, read ones "Mark as unread" (when the app has the endpoint). Clicking the item marks it read and opens its link; an item without a link is text only.
- **Item types are the app's.** The drawer knows only `{ id, icon, title, body, link, time, isRead }`; the app maps each of its notification types to an icon, a title and the page where the user acts (`toItem`). The drawer points elsewhere; it is not a second inbox.
- **Without realtime** the badge comes from a shared Inertia prop, so it updates on every navigation. **With realtime** (Reverb, `docs/realtime.md`) the app passes `subscribe`, and the badge and the open list update live.
- **Sound:** off by default; a user preference ("Sound for notifications", with a test button calling `playTestSound()`). It plays only for live notifications, with the drawer closed and the tab visible.
- **Screen readers:** the bell's label carries the count ("Notifications, 3 unread"); a rise is announced politely once (debounced over bursts) when the drawer is closed.

### In an app

```tsx
// lib/notifications.ts: create the source once, with the app's routes (Wayfinder or URLs).
export const notificationsSource = createNotificationsSource(
    {
        index: notifications.index(),
        unreadCount: notifications.unreadCount(),
        read: notifications.read(),
        unread: notifications.unread(),
    },
    toNotificationItem, // the app's mapping: icon, title, body, link per type
);

// app-sidebar.tsx, in <SidebarHeader> after the logo
const subscribe = useCallback(
    (onNotificationCreated: () => void) => {
        if (!isRealtimeEnabled(realtime)) {
            return () => undefined;
        }

        const channel = ensureEcho(true)?.private(`App.Models.User.${user.id}`);
        const event =
            '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated';
        channel?.listen(event, onNotificationCreated);

        return () => channel?.stopListening(event);
    },
    [realtime, user.id],
);

<NotificationsBell
    source={notificationsSource}
    unreadCount={notificationsProp.unread_count}
    subscribe={subscribe}
    isSoundEnabled={notificationsProp.sound_enabled}
/>;
```

Create the source once (module scope or `useMemo`) and keep `subscribe` stable (`useCallback`): a new one re-subscribes. Anything else in the app that changes read state calls `notifyNotificationsUpdated()`, and the bell re-reads the count.

### Backend contract

Laravel database notifications (`php artisan make:notifications-table`, the `Notifiable` trait on `User`); each notification's `toArray()` holds what the app's `toItem` reads (at least `type`, `title`, `body`, `url`, plus ids the link needs).

| Route (name)                                        | Request                              | Response                                                                                                   |
| --------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `GET /notifications` (`notifications.index`)        | `?page=`                             | `{ data: [{ id, type, data, read_at, created_at }], current_page, last_page, per_page, total }`, 20 a page |
| `GET /notifications/unread-count` (`…unread-count`) |                                      | `{ count }`                                                                                                |
| `POST /notifications/read` (`notifications.read`)   | `{ ids: uuid[] }` or `{ all: true }` | `{ unread_count }`                                                                                         |
| `POST /notifications/unread` (`…unread`), optional  | `{ ids: uuid[] }`                    | `{ unread_count }`                                                                                         |

- One `NotificationController` (four methods, thin), with `Mark*Request` form requests validating `ids.*` as `uuid`. Every query goes through `$request->user()->notifications()` / `unreadNotifications()`, so a user only ever reads or changes their own rows.
- Times are ISO 8601 (`toIso8601String()`).
- **Shared Inertia prop** (`HandleInertiaRequests`): `notifications: { unread_count }` for the badge, plus the user's sound preference.
- **Realtime** (optional): notifications go `via` `database`, plus `broadcast` only when `broadcasting.default` is a real driver (not `log` / `null`), sent with `->onConnection('sync')` so no queue worker is needed for the live update. The private channel is `App.Models.User.{id}` (`routes/channels.php`, the user's own id only); the client listens for `.Illuminate\Notifications\Events\BroadcastNotificationCreated`.
- Prune old rows on a schedule (for example 30 days), so the table does not grow forever.

Source: externa-core `components/notifications/notifications-bell.tsx`, `notifications-drawer.tsx`, `components/sidebar-unread-badge.tsx`, `lib/notifications-api.ts`, `lib/notification-sound.ts`; `app/Http/Controllers/NotificationController.php`, `app/Notifications/Concerns/BroadcastsWithDatabaseTrait.php`, `routes/web.php`, `routes/channels.php` (PHP, repo root).

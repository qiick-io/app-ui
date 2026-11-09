# Realtime

**Registry:** `user-avatar` (`ConnectionDot`), `user-hover-card`, `nav-user`.

**Copy from externa-core:** `resources/js/lib/echo.ts`, `resources/js/hooks/use-echo-connection.ts`, `resources/js/lib/online-presence.ts` + `hooks/use-online-users.ts`, `lib/item-presence.ts` + `hooks/use-item-presence.ts`; `routes/channels.php`, `app/Events/ItemChatMessageCreatedEvent.php`, `config/reverb.php`, `config/broadcasting.php` (PHP, repo root).

## Server

- Laravel Reverb; `BROADCAST_CONNECTION` defaults to `null`, and the app works fully without it. The shared prop `realtime: { enabled, broadcaster }` tells the UI.
- Events: `app/Events/<Thing><Verb>Event.php`, `implements ShouldBroadcastNow` (or `ShouldBroadcast` on the queue for heavy payloads), a stable `broadcastAs()` in PascalCase (`MessageCreated`, `ThreadUpserted`) and a small payload: ids and what the UI renders, never a whole model.
- Channels in `routes/channels.php`, every callback checking `$user->is_active` and the permission:

| Channel                         | Type     | For                                           |
| ------------------------------- | -------- | --------------------------------------------- |
| `App.Models.User.{id}`          | private  | the user's own notifications, unread counts   |
| `online`                        | presence | who is online (returns `{ id, name }`)        |
| `<resource>.{id}` (`chat.{id}`) | presence | people on one record: chat, co-editing, locks |

## Client

- `ensureEcho()` creates one `laravel-echo` + `pusher-js` client (`broadcaster: 'reverb'`, `VITE_REVERB_*`) only when realtime is enabled.
- `useEchoConnection()` returns `connected`, `connecting`, `disconnected` or `disabled`; the signed-in user's avatar shows it with `ConnectionDot` (green / amber / red only when lost / grey disabled, `docs/shell.md`).
- Listen with the leading dot: `channel.listen('.MessageCreated', …)`. Presence uses `echo.join('online').here().joining().leaving()`; co-editing hints use whispers (`item-lock`).
- Every realtime update is also correct after a reload: realtime refreshes what Inertia already loaded, it is never the only source.

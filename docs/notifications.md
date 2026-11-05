# Notifications and messages

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

## Not a toast

- **Form validation** errors go under the field (`Field` / `FieldError`), not in a toast: the user has to see them next to what they have to fix. A toast is for a submit that failed for another reason (server error, conflict).
- **Long or blocking** content (a destructive confirmation, a choice) is a dialog. See [destructive-actions.md](destructive-actions.md).
- **State of the page** (a disabled feature, a missing setting) is an `Alert` in the page, not a toast.

## In an app

Mount the Toaster once, in `app.tsx`, with the app's resolved appearance:

```tsx
<Toaster theme={resolvedAppearance} />
```

Import `toast` from `@/lib/toast` everywhere else, never from `sonner`. Position, offset, duration, colours and the close button come from the item; do not pass them in `app.tsx`.

Source: externa-core `components/ui/sonner.tsx`, `lib/toast.ts`, `lib/live-announcer.ts` (the same in Excubia), on the shadcn `sonner` component.

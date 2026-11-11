# Keyboard shortcuts

People who spend long sessions in an app (triaging issues, reviewing records) move faster with the keyboard. This pattern gives every qiick app the same shortcut engine and the same rules, so `j` / `k` and `?` behave identically everywhere and no screen breaks typing or a rich-text editor.

**Use when:** users work through lists for long stretches (triage queues, inboxes, review lists).
**Skip when:** the app is mostly forms and settings. The reserved ⌘K / ⌘J still apply to every app that has a command palette or the Assistant.

**Registry:** `keyboard-shortcuts` (`ShortcutsProvider`, `useShortcut`, `ShortcutHint`, `lib/shortcut-keys.ts`). **Playground:** the `keyboard-shortcuts` section of the catalogue.
**Seen in:** externa-core (⌘J for the Assistant panel, ⌘K for links in the rich-text field).

## Rules

- Wrap the authenticated layout once in `ShortcutsProvider`, next to `TooltipProvider`. Pass the user's `canUseSingleKeyShortcuts` setting.
- A component registers its shortcuts with `useShortcut({ keys, description, group, handler, isEnabled })`. They are active while it is mounted. The most recently mounted registration of the same keys wins, so a page overrides the shell.
- Definitions are strings: `mod+k` (⌘ on Apple platforms, Ctrl elsewhere), `shift+?`, `j`. Show a hint next to a control or in its tooltip with `<ShortcutHint keys="mod+k" />`; never hard-code `⌘`.
- **Reserved keys** (`RESERVED_SHORTCUTS`): `mod+k` the command palette, `mod+j` the Assistant panel, `?` the shortcuts help. An app never binds them to anything else.
- **List keys**, for apps with triage lists: `j` / `k` next / previous row, `Enter` open, `x` select. The app maps its actions to single letters and lists them in the page's docs (for example `e` resolve, `a` assign).
- Never bind a single key the browser or screen readers rely on (`Tab`, `Space` outside lists, arrows inside fields), nor ⌘ / Ctrl combinations the browser owns (`mod+t`, `mod+w`, `mod+l`, `mod+r`, `mod+f`).

## Keyboard and accessibility

- Single-key shortcuts never fire while the person types in a field, a select or a rich-text editor. The user can turn them off entirely in Appearance settings (WCAG 2.1.4, Character Key Shortcuts). The help dialog says when they are off.
- ⌘ / Ctrl shortcuts fire in plain fields, but not inside a rich-text editor. A key press another handler already took (`preventDefault`, for example ⌘K inserting a link in the editor) is left alone.
- `?` opens a dialog listing the active shortcuts by group, with platform key caps. It is a standard `Dialog` (focus trap, Escape closes).
- Every action a shortcut runs is also reachable with a visible control. Shortcuts are an accelerator, never the only way.

## i18n

`shortcuts.title`, `shortcuts.description`, `shortcuts.singleKeyOff`, `shortcuts.showHelp`, and `shortcuts.groupGeneral`, `shortcuts.groupNavigation`, `shortcuts.groupList` for the common groups. `description` and `group` passed to `useShortcut` are already translated.

## Backend

Only the user setting: a boolean preference (for example `single_key_shortcuts_enabled`, default true), saved with the other Appearance preferences and shared as an Inertia prop.

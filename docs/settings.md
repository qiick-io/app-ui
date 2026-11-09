# Settings page

**Registry:** `settings-form-actions`, `field`, `input`, `textarea`, `switch`, `select`, `sidebar` (nav menu primitives), `separator`.

**Copy from externa-core:** `layouts/settings/layout.tsx`, `pages/settings/project.tsx` (reference form), `components/settings-form-actions.tsx`, `components/heading.tsx`.

## Layout

- Page heading (title + description) at the top, then two columns on `lg`: secondary nav (`lg:w-48`) on the **left**, the form pane on the right (`max-w-xl`, `md:max-w-2xl`; `wide` → 4xl). On small screens the nav stacks above a separator.
- The form pane is the scroll container (sticky Save bars pin to it, not to the viewport).
- Secondary nav: `SidebarGroup` + `SidebarMenuButton size="sm"` with an icon, grouped and labelled **Account / Project / Access / AI**. All AI settings live in the AI group. A "Report a bug" link closes the nav.

## Form

- Sections: `Heading variant="small"` (title + description), then `FieldGroup className="gap-6"` of `Field`s (label, control, description, error).
- Booleans use `Switch` at its own size, never stretched or restyled.
- `SettingsFormActions` at the end: sticky bottom bar, top border, translucent background, **Save aligned right** ("Saved" appears to its left).

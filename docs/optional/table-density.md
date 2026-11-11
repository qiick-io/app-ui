# Table density

People who scan long tables every day want more rows on screen. Occasional users want air. Density is therefore a per-user preference, never a per-page choice, and the theme applies it to every table at once.

**Use when:** the app has long tables that power users scan daily (issues, logs, records).
**Skip when:** tables are short. The comfortable default is enough.

**Registry:** `table-density-toggle` (`TableDensityToggle`, `applyTableDensity`, `TABLE_DENSITY_ATTRIBUTE`). The rows themselves are in the `theme` item (`[data-density='compact']`). **Playground:** the `table-density-toggle` section of the catalogue.

## Rules

- Two values: `comfortable` (the default) and `compact` (8px shorter rows: a text row goes from 37px to 29px, the head from 40px to 32px). No third step, and no per-table override.
- The app stores the preference per user, next to high contrast and reduce motion. It sets `data-density` on `<html>` at boot (`applyTableDensity`) and again when the user changes it, the same way it sets the `high-contrast` class.
- The toggle lives in Settings → Appearance. A table toolbar may repeat it at the far right of the toolbar, before the overflow menu, only on pages that are mostly one long table.
- Only table rows change: the head height and the cell padding. Controls keep the qiick control scale, so row actions stay at `icon-sm` (24px) and targets stay at least 24px (WCAG 2.5.8). Font size never changes.

## Keyboard and accessibility

- `TableDensityToggle` is a segmented `ToggleGroup` with an accessible name. Arrow keys move between the two values.
- Compact keeps every contrast and focus rule. It is a spacing change only.

## i18n

`tableDensity.label`, `tableDensity.comfortable`, `tableDensity.compact`.

## Backend

A string preference (`table_density`, `comfortable` by default), saved with the other Appearance preferences and shared as an Inertia prop.

# Theme

**Registry:** `@qiick/theme` (the tokens) and one brand preset item; see [`packages/app-theme/README.md`](../packages/app-theme/README.md) for every token.

**Copy from externa-core:** `resources/css/app.css`, `config/theme-presets.php`, `app/Services/Settings/ThemePresetService.php`, `resources/js/lib/theme-css.ts`; tests `tests/Unit/AppCssThemeDefaultsTest.php`, `scripts/a11y-contrast.mjs`.

## Shared base + brand-only presets

- The **base** holds the 25 surface tokens every app shares: backgrounds, the two-tone shell, cards, popovers, borders, text, status colours. In dark mode the shell is two-tone: sidebar `#17232C` over background `#0E171E`.
- A **preset** sets the 13 brand tokens only: `primary`, `ring`, `chart-1`, `chart-2`, `sidebar-primary`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-ring`, and the five `ai` roles.
- Presets in externa-core: **Teal** (default, Externa), **Blue** (Excubia), Indigo, Violet, Rose, Slate. Violet re-points the `ai` roles to teal (`ai_override`), so AI never looks like the brand.
- `app.css` fallbacks equal Teal (`AppCssThemeDefaultsTest`). A custom brand hex wins over the preset; the ring follows it only when it reaches 3:1 on the background.
- An app chooses its preset. It never edits surface tokens.

## Colours in code

- Tokens only: `bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-sidebar-accent`, …
- No hex, no raw palette (`bg-teal-600`), no arbitrary font sizes: `scripts/check-ui-tokens.mjs`.
- AI: `ai`, `ai-hover`, `ai-foreground`, `ai-bg`, `ai-text`, `ai-border` (violet).
- Status: `success`, `warning`, `destructive`, `info` (+ `-foreground`) for status only.

## Control scale

`sm` 24px / default 32px / `lg` 40px (`h-control-sm`, `h-control`, `h-control-lg`), the same height for button, icon button, input, input group, native select, select trigger, toggle. Default everywhere; `sm` only for compact inline actions; `lg` for rare large CTAs.

## Accessibility

WCAG 2.2 AA: text 4.5:1, UI and focus 3:1, in light, dark, high contrast and high-contrast dark. `npm run a11y:contrast` checks every pair for every preset in CI.

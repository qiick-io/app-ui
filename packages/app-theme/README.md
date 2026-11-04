# @qiick/app-theme

Design tokens shared by the qiick apps, for Tailwind CSS v4. Extracted from externa-core 1.4.0 `resources/css/app.css` and `config/theme-presets.php`.

## Install

Import the theme once, right after Tailwind, in the app's CSS entry. Add a brand preset after it if the product is not teal:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import '@fontsource-variable/geist';
@import '@fontsource-variable/geist-mono';
@import '@qiick/app-theme/theme.css';
@import '@qiick/app-theme/presets/blue.css'; /* Excubia */
```

The theme names Geist as `--font-sans` / `--font-mono` but does not load it: the app imports the font (and `tw-animate-css`, used by the dialog and dropdown animations).

Dark mode is the `.dark` class on an ancestor (`@custom-variant dark (&:is(.dark *))`), high contrast is `html.high-contrast` or the OS `prefers-contrast: more`, reduced motion is `html.reduce-motion` or the OS `prefers-reduced-motion: reduce`.

## How it is layered

- `@theme { … }` (top level, as Tailwind requires): palette scales, the `--color-*` mappings that create the utilities (`bg-primary`, `text-ai`, `border-sidebar-border`, …), radius, shadows, fonts and the control-size spacing keys.
- `@layer base { … }`: the colour tokens for light (`:root`), dark (`.dark`) and high contrast, and the base element rules. Being in a layer, any **unlayered** rule in the app overrides them without `!important`:

    ```css
    :root {
        --radius: 0.375rem;
        --sidebar: #ffffff;
    }
    ```

- Unlayered: the Assistant sidebar item (`.sidebar-ai-nav`), the WCAG text-spacing and scroll-padding rules, and the reduced-motion overrides. They stay unlayered, as in externa-core, so they beat the component utility classes.

## Product accent

The shared base holds the neutral surfaces (backgrounds, the two-tone shell, cards, borders, text). A product changes only its brand colours, in one of two ways:

1. **A preset** (recommended): `presets/blue.css` sets `--primary`, `--ring`, `--chart-1`, `--chart-2` and the sidebar accents for light and dark. Teal is the default and needs no file. Presets are copied from externa-core `config/theme-presets.php`.
2. **A single brand colour**: set `--brand-primary` (and optionally `--brand-primary-dark`, `--brand-primary-foreground`, `--brand-primary-dark-foreground`) on `:root`. `--primary` and `--sidebar-primary` follow it.

Focus ring rule (externa-core #453): `--ring` and `--sidebar-ring` stay teal unless the brand colour reaches 3:1 on the page background (`#FFFFFF` light, `#0E171E` dark). If it does, set both rings to the brand colour too; otherwise leave them. The presets already do this.

The AI accent (`--ai-*`) is violet and never follows the brand. A brand whose hue is near violet should switch the AI tokens to teal (externa-core `ai_override_light` / `ai_override_dark`).

Run `npm run a11y:contrast` after adding a preset: the check covers every preset file.

## Tokens

### Palette (`@theme`)

| Scale                           | Steps  | Use                                                               |
| ------------------------------- | ------ | ----------------------------------------------------------------- |
| `teal`                          | 50–950 | Default brand, focus rings                                        |
| `ink`                           | 50–950 | Neutrals: text, surfaces, borders                                 |
| `red`, `amber`, `green`, `blue` | 50–950 | Destructive, warning, success, info (overrides Tailwind's scales) |
| `violet`                        | 50–900 | AI elements only                                                  |

### Semantic colours (`:root` / `.dark`)

Each `--x` also has a `--color-x` mapping, so `bg-x` / `text-x` utilities exist.

| Token                                                                 | Light                                 | Dark                                         | Use                                                                         |
| --------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `--background` / `--foreground`                                       | white / ink-950                       | ink-950 / ink-100                            | Page                                                                        |
| `--card` / `--card-foreground`                                        | white / ink-950                       | ink-900 / ink-100                            | Cards                                                                       |
| `--popover` / `--popover-foreground`                                  | white / ink-950                       | ink-800 / ink-100                            | Menus, popovers                                                             |
| `--primary` / `--primary-foreground`                                  | `--brand-primary` or teal-600 / white | `--brand-primary-dark` or teal-400 / ink-950 | Primary actions                                                             |
| `--primary-hover`                                                     | primary + 12% black                   | primary + 12% white                          | Primary hover; moves away from the foreground so contrast only grows (#449) |
| `--secondary`, `--muted`, `--accent` (+ `-foreground`)                | ink-100                               | ink-800                                      | Quiet surfaces                                                              |
| `--muted-foreground`                                                  | ink-600                               | ink-300                                      | Secondary text, placeholders                                                |
| `--destructive`, `--success`, `--warning`, `--info` (+ `-foreground`) | 600 step / white                      | 300–400 step / ink-950                       | Status                                                                      |
| `--overlay`                                                           | ink-950 60%                           | ink-950 70%                                  | Dialog backdrop                                                             |
| `--border`                                                            | ink-200                               | ink-800                                      | Dividers                                                                    |
| `--input`                                                             | ink-400                               | ink-500                                      | Control borders (≥3:1)                                                      |
| `--ring`                                                              | teal-600                              | teal-400                                     | Focus ring (≥3:1, see above)                                                |
| `--chart-1` … `--chart-5`                                             | brand, blue, amber, green, ink        |                                              | Charts                                                                      |
| `--radius`                                                            | 0.5rem                                |                                              | `rounded-sm/md/lg/xl` derive from it                                        |

### Sidebar (two-tone shell)

| Token                               | Light              | Dark                | Use                                            |
| ----------------------------------- | ------------------ | ------------------- | ---------------------------------------------- |
| `--sidebar`                         | ink-50             | ink-900             | Sidebar and the frame around the content panel |
| `--sidebar-foreground`              | ink-600            | ink-300             | Nav items                                      |
| `--sidebar-primary` / `-foreground` | primary            | primary             | Active bar, Assistant item border              |
| `--sidebar-accent` / `-foreground`  | teal-50 / teal-800 | teal-950 / teal-200 | Active and hovered item                        |
| `--sidebar-border`                  | ink-200            | ink-800             | Shell borders                                  |
| `--sidebar-ring`                    | teal-600           | teal-400            | Focus inside the sidebar                       |

### AI accent (externa-core #242)

`--ai`, `--ai-hover`, `--ai-foreground`, `--ai-bg`, `--ai-text`, `--ai-border`: violet-600/700, white, violet-50/800/500 in light; violet-300/200, ink-950, violet-900/200/400 in dark. Utilities: `bg-ai`, `text-ai-text`, `border-ai-border`, …

### Control size (externa-core #462, #472)

One height per size for every control (button, icon button, input, input group, native select, select trigger and items, toggle and toggle group), on the antd scale. Exposed as spacing keys: `h-control`, `size-control-sm`, `min-w-control-lg`, …

| Token                  | Size | Use                                                                          |
| ---------------------- | ---- | ---------------------------------------------------------------------------- |
| `--spacing-control-sm` | 24px | Compact inline actions only (table row icons, chips); the WCAG 2.5.8 minimum |
| `--spacing-control`    | 32px | Default everywhere: headers, toolbars, forms, settings                       |
| `--spacing-control-lg` | 40px | Rare large CTAs                                                              |

The registry `cn()` knows these keys, so `cn('h-control', 'h-8')` keeps `h-8`.

### Other

`--font-sans` / `--font-mono` (Geist), `--shadow-xs` … `--shadow-xl` (ink-tinted), `--radius-sm` … `--radius-xl`.

### High contrast

`html.high-contrast` and `prefers-contrast: more` strengthen `--foreground`, `--muted-foreground`, `--border`, `--input`, `--ring`, the sidebar foreground, border and ring, and the card, popover, secondary and accent foregrounds (ink-950 / ink-700 / ink-500 in light; white / ink-200 / ink-400 in dark).

## Contrast check

`npm run a11y:contrast` (repo root) resolves every token to a hex and checks the text pairs at 4.5:1 and the UI pairs (input, ring, active bar, Assistant border) at 3:1, in light, dark, high contrast and high contrast dark, for teal and every preset. CI runs it on every PR.

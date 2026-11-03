# qiick app UI

Shared admin UI for the open-source, installable [qiick](https://qiick.io) apps: [Externa](https://github.com/qiick-io/externa-core), [Excubia](https://github.com/qiick-io/excubia-app), and the apps that follow.

> **Status:** early development. Nothing is published yet.

## What it is

Two parts, so that every app looks the same while staying fully customizable:

- **`@qiick/app-theme`** is a versioned CSS file with the design tokens: colours with a per-product accent, the control size scale (`sm` 32px / default 36px / `lg` 40px), focus-ring and contrast rules, and the AI accent tokens. Apps import it once and can override any variable.
- **A [shadcn](https://ui.shadcn.com) component registry** holds the components: button, input, select, segmented control, sidebar, page header, toolbar, empty state and the `cn` helper. Apps install them with `npx shadcn add <registry-url>/<name>.json`, so the code lives in the app and can be changed freely.

Each app's CI checks its components against the registry. Intentional overrides are listed in the app, so differences stay visible instead of drifting silently.

## Not in scope

The qiick websites. They are built on licensed Tailwind Plus templates, which cannot be redistributed, and they are not part of this repo.

## License

MIT

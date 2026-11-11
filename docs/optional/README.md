# Optional patterns

The pages in [`docs/`](../README.md) are **core** patterns: every qiick app follows them. The pages here are **optional** patterns: accepted, shared solutions that an app adopts only when they fit the product. A monitoring app with hundreds of items needs a command palette and triage lists; a small admin panel does not.

Optional patterns keep the apps from mirroring each other. A new solution lands once here, in the registry and on a page in this folder. Each app adopts it (or not) on its own schedule, when it bumps its app-ui `ref`.

## Adopting one

1. Pick the pattern, and its variant when it has variants, from the table in [`standards/patterns.json`](../../standards/patterns.json) (also in the app's `.qiick/standards/ui.md`).
2. Add it to `patterns` in the app's `qiick-standards.json`: `"patterns": ["command-palette", "grouped-tabs:sub-menu"]`.
3. Re-run the standards sync. The app's agent files then name the pattern, so every agent follows it on those screens. An unknown name, or a pattern with variants listed without one, fails the sync and the CI check.
4. Install the registry items the page names (`npx shadcn add @qiick/<name>`). The drift check covers them like any installed item.

Dropping a pattern is the reverse: remove it from `patterns`, re-sync, and remove its items.

## Writing one

A new optional pattern is a PR to app-ui with its registry items, a playground route, an entry in `standards/patterns.json` (`title`, `page`, and `variants` when there is more than one accepted way), and a page in this folder with these sections, in this order:

```markdown
# <Pattern name>

One paragraph: the problem it solves.

**Use when:** product traits that make it a fit (for example "lists with more than ~20 records", "users jump between many entities").
**Skip when:** the traits that make it noise.

**Registry:** `<item>`, `<item>`. **Playground:** `#/<route>`.
**Seen in:** the apps that adopted it, as references (never as the source to copy).

## Variants

Only when there is more than one accepted way: each variant's name (as in `patterns`), when to pick it, and how it differs.

## Rules

Positions, behaviour, states (loading, empty, error), what the app passes in.

## Keyboard and accessibility

The keyboard contract, ARIA roles, focus handling, what screen readers announce.

## i18n

The locale keys the items use.

## Backend

Only when the pattern needs one: endpoints, authorization, caching.
```

Rules for every optional pattern:

- It builds on core patterns and never contradicts them. An app that adopts it still passes every core rule.
- Its items work with or without the other optional patterns. Where two cooperate (the command palette and keyboard shortcuts share the reserved keys), each page says how.
- A variant is a documented choice, never a per-app fork: an app picks one of the listed variants or proposes a new one here.

# Stack

Every qiick app runs the same stack, so code, rules and registry items move between apps unchanged. A new app starts here; an existing app that differs converges on it, one PR per change. Steps from an empty repo to a green CI: https://github.com/qiick-io/app-ui/blob/develop/docs/new-product.md

## Bootstrap

```bash
laravel new <app> --react --pest --npm --database=sqlite --git
```

The Laravel installer with the official **React starter kit** (Inertia, React, TypeScript, Tailwind, shadcn, Fortify, Wayfinder). Same result without the installer: `composer create-project laravel/react-starter-kit <app>`. Do not start from another kit, template or a copy of an existing app.

## Versions (majors are pinned; minors float)

| Layer       | Package                                                                  | Major   |
| ----------- | ------------------------------------------------------------------------ | ------- |
| Runtime     | PHP                                                                      | `^8.4`  |
| Framework   | `laravel/framework`                                                      | 13      |
| Auth        | `laravel/fortify` (+ passkeys, 2FA from the kit)                         | 1       |
| Routes      | `laravel/wayfinder` + `@laravel/vite-plugin-wayfinder`                   | 0.1     |
| Server ↔ UI | `inertiajs/inertia-laravel`, `@inertiajs/react`                          | 3       |
| UI          | `react` / `react-dom`, Tailwind CSS, TypeScript (the kit's major)        | 19 / 4  |
| Primitives  | shadcn (`radix-ui`), `lucide-react`, `sonner` through `@/lib/toast` only | —       |
| i18n        | `i18next` + `react-i18next`                                              | 26 / 17 |
| Tests       | `pestphp/pest`, `pest-plugin-laravel`, `pest-plugin-browser`             | 5       |
| Static      | `larastan/larastan`, `laravel/pint`                                      | 3 / 1   |
| Node        | Node.js (`.nvmrc` `24`, `"engines": { "node": "24.x" }`), npm            | 24      |
| Agents      | `laravel/boost` (dev)                                                    | 2       |

Composer and npm keep caret ranges inside the pinned major; Dependabot (or Renovate) proposes minors and patches; a major bump is its own PR with the maintainer's OK.

## One lint and format toolchain

**ESLint 9 (flat config) + Prettier 3** for TypeScript / React, **Pint** (`laravel` preset) and **Larastan** for PHP. ESLint loads the pack's `qiick-standards.eslint.js` (`"eslint": true` in `qiick-standards.json`), `typescript-eslint`, `eslint-plugin-react`, `react-hooks`, `jsx-a11y`, `import`, `@stylistic` and `i18next`; Prettier uses `prettier-plugin-tailwindcss`. externa-core is the reference (`eslint.config.js`, `.prettierrc`).

Why ESLint and not oxlint / Vite+ `vp check`: the shared rules (boolean prefixes through type-aware `@typescript-eslint/naming-convention`, restricted imports, `padding-line-between-statements`, `jsx-a11y`, the i18n ratchet) exist and are tested in ESLint. A starter kit that ships Vite+ keeps `vite` for the build; lint and format run through ESLint and Prettier. Excubia converges by replacing `vp check` / oxlint with this toolchain.

The quality gate every app exposes as npm scripts: `lint` (ESLint `--max-warnings=0` + `check-ui-tokens`), `format:check`, `types:check` (`tsc --noEmit`), `knip`, `lint:i18n`; and in PHP `vendor/bin/pint --test`, `vendor/bin/phpstan analyse`, `php artisan test`.

## Runtime defaults

- **Database:** SQLite by default (install, tests, CI); MySQL 8 and PostgreSQL 17 supported and tested in CI. No vendor-specific SQL outside a driver check.
- **Queue:** the `database` driver by default; **Horizon** (`laravel/horizon`) when Redis is configured. Slow work (mail, AI, imports, webhooks) is a queued `*Job`.
- **Realtime:** **Reverb** (`laravel/reverb`) with `laravel-echo` + `pusher-js`; broadcasting is optional and the UI works without it (realtime badge grey).
- **Cache / session:** `database` by default, Redis when configured.
- **Locales:** `en`, `it`, `de` from the first commit: every UI string through `t('…')`, every key in all three locale files.
- **Self-hosting:** an app is installed with `composer create-project` and `php artisan <app>:install`, updated with `<app>:upgrade` (see the distribution rules).

## Local development

**Laravel Herd** serves the app at `https://<app>.test` (`herd link`, `herd secure`); `composer run dev` starts Vite, the queue worker and Pail. No Sail or Docker for day-to-day work: Docker is the distribution image, not the dev environment.

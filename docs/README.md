# qiick app UI patterns

New product? Start with [new-product.md](new-product.md).

These are the **core** patterns: every qiick app follows them. **Optional** patterns, which an app adopts only when they fit the product, are in [`optional/`](optional/README.md).

One page per pattern. Each names the registry item (when it exists) and the exact externa-core `develop` files to copy (paths under `resources/js/` unless noted). The playground renders the full screens: `npm run dev`, then `#/users`, `#/settings`, `#/assistant`, `#/chat`, `#/files` (add `/dark`).

| Pattern                                                          | Page                                             |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| App shell: two-tone sidebar, header, user menu, presence         | [shell.md](shell.md)                             |
| Page: `PageLayout`, header actions, view tabs, segmented filters | [page.md](page.md)                               |
| List page: toolbar, selection bar, overflow, table, pagination   | [list-page.md](list-page.md)                     |
| Settings page: secondary nav, form, Save bar                     | [settings.md](settings.md)                       |
| Forms: page vs drawer vs dialog, `Field`, validation errors      | [forms.md](forms.md)                             |
| Detail page: record header, status, fields                       | [detail-page.md](detail-page.md)                 |
| Auth pages and SSO                                               | [auth.md](auth.md)                               |
| Error pages 403 / 404 / 500 / 503                                | [error-pages.md](error-pages.md)                 |
| Empty states                                                     | [empty-states.md](empty-states.md)               |
| Destructive actions                                              | [destructive-actions.md](destructive-actions.md) |
| Dashboard cards                                                  | [dashboard.md](dashboard.md)                     |
| Notifications: toasts, bell and drawer                           | [notifications.md](notifications.md)             |
| Chat and Assistant                                               | [chat-and-assistant.md](chat-and-assistant.md)   |
| Files grid                                                       | [files-grid.md](files-grid.md)                   |
| Theme: tokens, presets, control scale                            | [theme.md](theme.md)                             |

Optional patterns: [`optional/README.md`](optional/README.md) explains adopting one (`patterns` in `qiick-standards.json`) and the page template; the list is in [`standards/patterns.json`](../standards/patterns.json).

Backend conventions (with the summary in [`standards/rules/backend.md`](../standards/rules/backend.md)): [roles and permissions](roles-and-permissions.md), [API](api.md), [realtime](realtime.md), [security headers](security-headers.md), [logging and activity log](logging-and-audit.md), [AI backend](ai-backend.md).

Rules for all of them: [`../AGENTS.md`](../AGENTS.md). Copy the code and the positions; if a screen needs something not listed here and externa-core has no equivalent, ask the maintainer.

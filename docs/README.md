# qiick app UI patterns

One page per pattern. Each names the registry item (when it exists) and the exact externa-core `develop` files to copy (paths under `resources/js/` unless noted). The playground renders the full screens: `npm run dev`, then `#/users`, `#/settings`, `#/assistant`, `#/chat`, `#/files` (add `/dark`).

| Pattern                                                          | Page                                             |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| App shell: two-tone sidebar, header, user menu, presence         | [shell.md](shell.md)                             |
| Page: `PageLayout`, header actions, view tabs, segmented filters | [page.md](page.md)                               |
| List page: toolbar, selection bar, overflow, table, pagination   | [list-page.md](list-page.md)                     |
| Settings page: secondary nav, form, Save bar                     | [settings.md](settings.md)                       |
| Empty states                                                     | [empty-states.md](empty-states.md)               |
| Destructive actions                                              | [destructive-actions.md](destructive-actions.md) |
| Dashboard cards                                                  | [dashboard.md](dashboard.md)                     |
| Chat and Assistant                                               | [chat-and-assistant.md](chat-and-assistant.md)   |
| Files grid                                                       | [files-grid.md](files-grid.md)                   |
| Theme: tokens, presets, control scale                            | [theme.md](theme.md)                             |

Rules for all of them: [`../AGENTS.md`](../AGENTS.md). Copy the code and the positions; if a screen needs something not listed here and externa-core has no equivalent, ask Luca.

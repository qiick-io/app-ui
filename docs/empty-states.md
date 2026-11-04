# Empty states

**Registry:** `page-empty-state`, `empty`.

**Copy from externa-core:** `components/admin/page-empty-state.tsx`, `components/empty-status.tsx`, reference use in `pages/admin/users/index.tsx`.

- One component: lucide icon in a `bg-primary/10 text-primary` tile, title, **one** sentence, **one** primary CTA, optional docs link (link button with `ArrowUpRight`). Dashed light border.
- **No records yet:** hide the list chrome (toolbar, table, pagination); the CTA creates the first record.
- **No results** (search or filters active): keep the toolbar, icon `SearchX`, CTA "Clear filters". Wrap the title in `EmptyStatus` so screen readers hear the change.
- **Trash empty:** icon `Trash2`, CTA "Back".
- Inside columns and panels (chat list, thread pane) use the `Empty` primitive with the same icon tile, `compact` spacing, no CTA. AI empty states tint with `bg-ai/10 text-ai`.

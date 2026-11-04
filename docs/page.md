# Page

Every admin page renders inside the shell as `AppLayout` → `PageLayout`.

**Registry:** `page-layout`, `page-header`, `header-icon-button`, `toggle-group`.

**Copy from externa-core:** `components/layout/page-layout.tsx`, `components/layout/page-header.tsx`, `components/admin/header-icon-button.tsx`, `layouts/app-layout.tsx`.

## Structure

```
AppLayout breadcrumbs headerActions
└─ PageLayout description? subheader? filters? filtersRight? footer? scrollContent?
   ├─ PageHeader: description, subheader, filter row (filters left, filtersRight right)
   ├─ body (children)
   └─ footer (centred)
```

- `PageLayout` is `p-4 gap-4`, flat: no card around the page. Lists sit on the panel in a `TablePanel` (no box inside a box).
- `scrollContent` makes the body the scroll container. Use it for panes that must scroll inside the panel (dashboard, files grid, long forms); lists use `TablePanel`, which scrolls itself with a sticky table head.
- Filter row: search and filters on the left (`filters`), view/sort/segmented controls on the right (`filtersRight`). In selection mode pass `filtersRight={null}`.

## Header actions

- Page actions go in `AppLayout`'s `headerActions`, in the header, **right-aligned**. The primary action (e.g. "New user", "New chat") is the **rightmost**, default variant, with a lucide icon before the label.
- Icon-only actions use `HeaderIconButton` (tooltip = accessible label), `variant="outline"` in filter rows, `ghost` in the header.
- Do not add a second page title or header inside the panel: the breadcrumb is the title.

## Tabs in a header

A page with views (Dashboard Overview / Health) uses a segmented control, not tabs: `ToggleGroup type="single" variant="outline"` with icon + label items, placed in `headerActions` (top right). Source: `pages/dashboard.tsx` (the `ToggleGroup` passed as `headerActions`).

Segmented filters in a filter row (Users active/trash, Chat Collections/Users) use the same control in `filtersRight`: `pages/admin/users/index.tsx`, `pages/chat/index.tsx`.

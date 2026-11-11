# Page

Every admin page renders inside the shell as `AppLayout` → `PageLayout`.

**Registry:** `page-layout`, `page-header`, `header-icon-button`, `tabs`, `toggle-group`.

**Copy from externa-core:** `components/layout/page-layout.tsx`, `components/layout/page-header.tsx`, `components/admin/header-icon-button.tsx`, `layouts/app-layout.tsx`.

## Structure

```
AppLayout breadcrumbs headerActions
└─ PageLayout description? subheader? filters? filtersRight? footer? scrollContent?
   ├─ PageHeader: description, subheader, filter row (filters left, filtersRight right; below sm it wraps: search on its own row, then the rest)
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
- A page without actions leaves the header's right side empty. Never fill it with views or filters.

## Tabs or segmented control?

Ask one question: **does the choice change the content of the page, or only which rows it shows?**

- It changes the content (other sections, other components): these are **views**, shown as tabs under the header, each with its own URL. See [Views](#views-tabs-under-the-header).
- It shows the same list or chart with other data: this is a **filter**, shown as a segmented control in the filter row. See [Segmented filters](#segmented-filters).

Tabs cost one row of height. That is accepted for views, so nobody has to choose a layout. A page with a single view has no tabs.

| Page                                           | Choice                           | Control                   |
| ---------------------------------------------- | -------------------------------- | ------------------------- |
| Excubia project: Overview, Findings, Runtime … | Views                            | Tabs under the header     |
| Dashboard: Overview / Health (externa-core)    | Views                            | Tabs under the header     |
| Users: active / trash                          | Filter (same list)               | Segmented, `filtersRight` |
| Chat: Collections / Users (externa-core)       | Filter (same chat list)          | Segmented, `filtersRight` |
| Dashboard period: 7 / 14 / 30 days             | Filter (same cards, other range) | Segmented, `filtersRight` |
| Exceptions: open / resolved / ignored / all    | Filter (same table)              | Segmented, `filtersRight` |

## Views: tabs under the header

Views are navigation, not actions: they never go in `headerActions`. A page with views (the Overview, Findings, Runtime … of one record, or the Overview / Health of a dashboard) uses line tabs **under the header**, above the `PageLayout`. The header keeps only the page actions.

- `Tabs value={view} activationMode="manual"` with `className="overflow-x-auto border-b px-4"`, so the tabs scroll on narrow screens instead of being cut off. Inside, `TabsList variant="line"` with an `aria-label` that names the views.
- One `TabsTrigger asChild aria-controls={undefined}` per view, wrapping the router `Link`, with a lucide icon then the label. The page has no `TabsContent` (each view is its own page), so Radix's `aria-controls` would point at a missing id: axe reports it as critical (`aria-valid-attr-value`).
- **Each view has its own URL** (`/projects/{slug}` for the first view, `/projects/{slug}/{view}` for the others), so back, links and bookmarks work. The server passes the view to the page; the page keeps no view state. Old `?view=` links redirect to the new URLs.
- Links from other pages (dashboard, lists) go straight to the right view's URL.
- A list row of a record opens the record (the row and its name link to the first view). Editing becomes a row action (`HeaderIconButton` with a pencil), next to the other row actions.
- The sidebar item stays active on every view: match the section prefix (`/projects/*`).

More than about six views: the optional [grouped view tabs](optional/grouped-tabs.md) pattern groups them, with counts and severity markers.

Source: Excubia `pages/projects/show.tsx` (`ProjectTabs`), `pages/projects/index.tsx` (row link and edit action), `routes/web.php` (`projects.view`).

## Segmented filters

A segmented control filters the data of one view; it does not switch views. It sits in the filter row's `filtersRight`: `ToggleGroup type="single" variant="outline"`, with icon + label items or icon-only items with an `aria-label`. Examples are Users active/trash, Chat Collections/Users, a dashboard's period and the status of a list. Sources: externa-core `pages/admin/users/index.tsx`, `pages/chat/index.tsx`.

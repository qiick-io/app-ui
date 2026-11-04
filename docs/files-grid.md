# Files grid

**Copy from externa-core:** `pages/admin/files/index.tsx`, `components/admin/files/file-grid.tsx`, `components/admin/files/files-selection-toolbar.tsx`, `lib/files-api.ts`; page size in `app/Http/Controllers/Admin/FileController.php` (`PAGE_SIZE = 48`). Not in the registry yet.

- `PageLayout scrollContent`: the grid scrolls inside the panel.
- Page size **48** (divisible by 2, 3, 4, 6 and 8 columns, so every row is full).
- An `IntersectionObserver` sentinel loads the next page on scroll, rooted on the scrolling panel with a **400px** look-ahead (`rootMargin: '0px 0px 400px 0px'`). The "Load more" button stays as a fallback.
- Refresh reloads **all loaded pages**; it never resets to page 1.
- Selection uses the selection bar from [list-page.md](list-page.md).

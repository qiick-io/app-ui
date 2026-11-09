# Files grid

**Registry:** `files-grid` (`FileGrid`, `FileCard`), `actions-overflow`, `page-layout`, `page-empty-state`, `context-menu`.

**Copy from externa-core:** `components/admin/files/file-card.tsx`, `file-grid.tsx`, `file-action-menu-items.tsx` (#592, #596; the registry item follows them), `pages/admin/files/index.tsx` (data loading, upload, drag and drop, details panel), `components/admin/files/files-selection-toolbar.tsx`, `lib/files-api.ts`; page size in `app/Http/Controllers/Admin/FileController.php` (`PAGE_SIZE = 48`). The playground `#/files` screen shows the page.

```tsx
<PageLayout scrollContent filters={selection ? <SelectionBar … /> : <FilterSearch … />}>
    <FileGrid
        items={files}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadNextPage}
        onClearSelection={clearSelection}
        empty={<PageEmptyState … className="min-h-64 flex-1 bg-muted/20" />}
        backgroundMenu={<ContextMenuItem …>New folder</ContextMenuItem>}
        renderItem={(file) => (
            <FileCard key={file.id} id={file.id} name={file.title || file.name} preview={…} … />
        )}
    />
</PageLayout>
```

- `PageLayout scrollContent`: the grid scrolls inside the panel.
- Page size **48** (divisible by 2, 3, 4, 6 and 8 columns, so every row is full).
- An `IntersectionObserver` sentinel loads the next page on scroll, rooted on the scrolling panel with a **400px** look-ahead (`rootMargin: '0px 0px 400px 0px'`). The "Load more" button stays as a fallback.
- Auto-load is guarded on the **array identity** of `items`: a failed or empty load leaves the same array, so scrolling stops loading (the button still retries) instead of looping; any new array (upload, move, refresh) can load again. Always pass a new array when the list changes.
- Refresh reloads **all loaded pages**; it never resets to page 1.
- `FileCard`: the **whole card is square** (`aspect-square`), files and folders alike. The preview fills the area above a **40px name row**, edge to edge; with `cover` (images, videos) it is `object-cover` on the focal point, otherwise the icon sits centred in a third of the area on `bg-muted`. On the preview only: the selection checkbox (top left, on hover, selection or focus), the favourite star (top right, `fill-favorite text-favorite`) and the "Private" badge (bottom left). Never a blurred strip over the image.
- **Name row:** the name on one line (truncated, full name in a `Tooltip`; on folders it opens the folder), then on the right a ghost `icon-xs` tag button **only when the file has tags**, whose `HoverCard` lists them as `Badge variant="secondary"` on hover or focus (a click neither opens a menu nor selects the card), and a ghost `icon-xs` ⋮ button whose `DropdownMenu` shows **the same actions as the right-click** `ContextMenu` (both render one `FileActionMenuItems`, so they never drift; destructive entries after a separator, `disabledReason` under the label). No file-type icon in the name row.
- Card click selects, ⌘/Ctrl/Shift extend, double click opens. The card surface has no role or tab stop (axe nested-interactive): keyboard users reach the checkbox, the name, the tag button and the ⋮ menu. The selection ring is an inset overlay (`after:ring-inset`), so the scroll container does not cut it. Drag and drop props pass through to the card.
- **Grid:** 2 columns on phones, `repeat(auto-fill, minmax(15rem, 1fr))` from `sm`.
- **Focal point** (details panel, images only): click the preview to set it, a crosshair marks it, arrow keys nudge it, "Reset to centre" clears it. It drives the crop of every transform. Folders and non-image files show no focal point.
- Selection uses the selection bar from [list-page.md](list-page.md).

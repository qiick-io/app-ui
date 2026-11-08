# Files grid

**Registry:** `files-grid` (`FileGrid`, `FileCard`), `actions-overflow`, `page-layout`, `page-empty-state`, `context-menu`.

**Copy from externa-core:** `pages/admin/files/index.tsx` (data loading, upload, drag and drop, details panel), `components/admin/files/files-selection-toolbar.tsx`, `lib/files-api.ts`; page size in `app/Http/Controllers/Admin/FileController.php` (`PAGE_SIZE = 48`). The playground `#/files` screen shows the page.

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
- `FileCard`: preview (icon, or `cover` for images and videos), title as its own button (opens folders), tags, corner badges (`topRight` favourite star in `text-warning`, `bottomLeft` "Private"), checkbox on hover / selection, context menu from `actions` (destructive entries after a separator, `disabledReason` under the label). Card click selects, ⌘/Ctrl/Shift extend, double click opens. Drag and drop props pass through to the card.
- **Square file cards, nothing over the image.** A file card is itself a 1:1 `AspectRatio`. The preview fills the top of the card edge to edge (no padding or inset frame), `object-cover` positioned on the focal point, with only the selection checkbox (top left) and the corner badges on it. Below it, one header row: the file-type icon, the name on one line (truncated, full name in a `Tooltip`), then on the right a tag icon button (only when the file has tags) whose `DropdownMenu` lists the tags, and a ⋮ button whose `DropdownMenu` shows the same actions as the right-click `ContextMenu`. Both menus render from one actions definition, so they never drift. Never a blurred strip with name and tags over the image.
- **Folders** keep their layout: the folder icon in a square, name and tags (`Badge variant="secondary"`, first tag + "+N") below.
- **Registry note:** the `files-grid` item's `FileCard` still ships the 1.4.0 "name and tags below the image" footer; externa-core moved to the square card above (qiick-io/externa-core#592: `components/admin/files/file-card.tsx`, `file-action-menu-items.tsx`). Port it into the registry item on the next registry pull.
- **Focal point** (details panel, images only): click the preview to set it, a crosshair marks it, arrow keys nudge it, "Reset to centre" clears it. It drives the crop of every transform. Folders and non-image files show no focal point.
- Selection uses the selection bar from [list-page.md](list-page.md).

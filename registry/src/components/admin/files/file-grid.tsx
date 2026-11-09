import { useEffect, useRef } from 'react';
import type { ComponentProps, PointerEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';

type FileGridProps<Item> = {
    /** Every loaded page, in order. Pass a new array when it changes. */
    items: Item[];
    /** One keyed card per item, normally a {@link FileCard}. */
    renderItem: (item: Item) => ReactNode;
    /** Shown instead of the grid when `items` is empty (a `PageEmptyState`). */
    empty: ReactNode;
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
    /** A click or tap on the empty area between cards. */
    onClearSelection?: () => void;
    /** Context menu items for the empty area (New folder, Upload, …). */
    backgroundMenu?: ReactNode;
    /** Props for the grid element, e.g. `onDragOver` / `onDrop` to drop on the grid. */
    gridProps?: ComponentProps<'div'>;
};

function isInteractiveGridClickTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
        return false;
    }

    // Cards, load-more, and other controls must not clear selection.
    return (
        target.closest('[data-slot="file-card"]') !== null ||
        target.closest('button') !== null ||
        target.closest('[role="checkbox"]') !== null ||
        target.closest('[role="menuitem"]') !== null
    );
}

function BackgroundContextMenu({
    menu,
    children,
}: {
    menu?: ReactNode;
    children: ReactNode;
}) {
    if (!menu) {
        return children;
    }

    return (
        <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent data-testid="files-empty-area-context-menu">
                {menu}
            </ContextMenuContent>
        </ContextMenu>
    );
}

/**
 * Files grid (externa-core `file-grid.tsx`): 2 → 8 columns, infinite scroll
 * with a "Load more" fallback, empty-area click clears the selection.
 *
 * Load the next page with a page size of 48 (full rows at 2, 3, 4, 6 and 8
 * columns) and render it inside a scrolling panel (`PageLayout scrollContent`).
 */
export function FileGrid<Item>({
    items,
    renderItem,
    empty,
    hasMore,
    loadingMore,
    onLoadMore,
    onClearSelection,
    backgroundMenu,
    gridProps,
}: FileGridProps<Item>) {
    const { t } = useTranslation();
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
    // The list at the last automatic load: a failed or empty load leaves the same
    // array, so auto-loading stops (the button still retries) instead of looping,
    // while any refreshed list (upload, move, reload) can load again.
    const lastAutoLoadItemsRef = useRef<Item[] | null>(null);
    // Parents pass an inline callback; read the latest one without re-observing.
    const onLoadMoreRef = useRef(onLoadMore);

    useEffect(() => {
        onLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    // Load the next page whenever the sentinel under the grid is on screen, so a
    // tall window fills up without a gap and scrolling keeps loading (Drive-style).
    useEffect(() => {
        const sentinel = loadMoreSentinelRef.current;

        if (!sentinel || !hasMore || loadingMore) {
            return;
        }

        // Observe against the panel that scrolls (not the window), so the 400px
        // look-ahead starts loading before the user reaches the end.
        let scrollRoot: HTMLElement | null = sentinel.parentElement;

        while (
            scrollRoot &&
            !/(auto|scroll)/.test(getComputedStyle(scrollRoot).overflowY)
        ) {
            scrollRoot = scrollRoot.parentElement;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries.some((entry) => entry.isIntersecting) &&
                    lastAutoLoadItemsRef.current !== items
                ) {
                    lastAutoLoadItemsRef.current = items;
                    onLoadMoreRef.current();
                }
            },
            { root: scrollRoot, rootMargin: '0px 0px 400px 0px' },
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [items, hasMore, loadingMore]);

    const handleBackgroundPointerDown = (
        event: PointerEvent<HTMLDivElement>,
    ): void => {
        if (isInteractiveGridClickTarget(event.target)) {
            return;
        }

        onClearSelection?.();
    };

    if (items.length === 0) {
        return (
            <BackgroundContextMenu menu={backgroundMenu}>
                <div
                    data-testid="files-grid-area"
                    className="flex flex-1 flex-col"
                    onPointerDown={handleBackgroundPointerDown}
                >
                    {empty}
                </div>
            </BackgroundContextMenu>
        );
    }

    return (
        <BackgroundContextMenu menu={backgroundMenu}>
            <div
                data-testid="files-grid-area"
                className="flex flex-1 flex-col gap-3"
                onPointerDown={handleBackgroundPointerDown}
            >
                <div
                    {...gridProps}
                    className="grid flex-1 grid-cols-2 content-start items-start gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
                >
                    {items.map(renderItem)}
                </div>

                {hasMore && (
                    <div
                        ref={loadMoreSentinelRef}
                        data-testid="files-load-more"
                        className="flex justify-center py-2"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loadingMore}
                            onClick={onLoadMore}
                        >
                            {loadingMore
                                ? t('files.loading')
                                : t('files.loadMore')}
                        </Button>
                    </div>
                )}
            </div>
        </BackgroundContextMenu>
    );
}

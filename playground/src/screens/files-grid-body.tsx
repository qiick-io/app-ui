import {
    Download,
    FileText,
    Folder,
    FolderPlus,
    Image,
    Pencil,
    Star,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import { FileCard } from '@/components/admin/files/file-card';
import type {
    FileCardAction,
    FileSelectModifiers,
} from '@/components/admin/files/file-card';
import { FileGrid } from '@/components/admin/files/file-grid';
import { PageEmptyState } from '@/components/admin/page-empty-state';
import { Button } from '@/components/ui/button';
import { ContextMenuItem } from '@/components/ui/context-menu';

type DemoFile = {
    id: number;
    name: string;
    isFolder: boolean;
    tags: string[];
    isFavorite: boolean;
    isPrivate: boolean;
};

// The apps load 48 per page; 12 keeps the demo short.
const PAGE_SIZE = 12;
const TOTAL = 30;

function makePage(page: number): DemoFile[] {
    return Array.from({ length: PAGE_SIZE }, (_, index) => {
        const id = page * PAGE_SIZE + index + 1;

        return {
            id,
            name: id % 5 === 1 ? `Folder ${id}` : `document-${id}.pdf`,
            isFolder: id % 5 === 1,
            tags: id % 4 === 0 ? ['Invoices', 'Q3', '2026'] : [],
            isFavorite: id % 7 === 0,
            isPrivate: id % 6 === 0,
        };
    }).filter((file) => file.id <= TOTAL);
}

const ACTIONS: FileCardAction[] = [
    { key: 'download', label: 'Download', icon: Download },
    { key: 'rename', label: 'Rename', icon: Pencil },
    { key: 'trash', label: 'Move to trash', icon: Trash2, destructive: true },
];

/**
 * externa-core `/admin/files` grid on fake pages, inside a scrolling parent:
 * the next page loads 400px before the end.
 */
export function FilesGridBody({
    isEmpty = false,
    selectedIds,
    onSelectedIdsChange,
}: {
    isEmpty?: boolean;
    selectedIds: number[];
    onSelectedIdsChange: (ids: number[]) => void;
}) {
    const [files, setFiles] = useState<DemoFile[]>(() => makePage(0));
    const [loadingMore, setLoadingMore] = useState(false);
    const items = isEmpty ? [] : files;

    const loadMore = () => {
        setLoadingMore(true);
        window.setTimeout(() => {
            setFiles((current) => [
                ...current,
                ...makePage(current.length / PAGE_SIZE),
            ]);
            setLoadingMore(false);
        }, 400);
    };

    const select = (id: number, modifiers: FileSelectModifiers) =>
        onSelectedIdsChange(
            modifiers.metaKey || modifiers.ctrlKey || modifiers.shiftKey
                ? selectedIds.includes(id)
                    ? selectedIds.filter((selectedId) => selectedId !== id)
                    : [...selectedIds, id]
                : [id],
        );

    return (
        <FileGrid
            items={items}
            hasMore={files.length < TOTAL}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onClearSelection={() => onSelectedIdsChange([])}
            backgroundMenu={
                <>
                    <ContextMenuItem>
                        <FolderPlus className="size-4" />
                        New folder
                    </ContextMenuItem>
                    <ContextMenuItem>
                        <Upload className="size-4" />
                        Upload file
                    </ContextMenuItem>
                </>
            }
            empty={
                <PageEmptyState
                    icon={Upload}
                    title="Drop files here"
                    description="Or upload them from your computer."
                    action={
                        <Button type="button">
                            <Upload className="size-4" />
                            Upload
                        </Button>
                    }
                    className="min-h-64 flex-1 bg-muted/20"
                />
            }
            renderItem={(file) => (
                <FileCard
                    key={file.id}
                    id={file.id}
                    name={file.name}
                    isFolder={file.isFolder}
                    cover={file.id % 9 === 0}
                    preview={
                        file.isFolder ? (
                            <Folder className="size-10 text-muted-foreground" />
                        ) : file.id % 9 === 0 ? (
                            <div className="flex size-full items-center justify-center bg-muted">
                                <Image className="size-10 text-muted-foreground" />
                            </div>
                        ) : (
                            <FileText className="size-10 text-muted-foreground" />
                        )
                    }
                    tags={file.tags}
                    topRight={
                        file.isFavorite ? (
                            <Star
                                className="size-3.5 fill-warning text-warning drop-shadow-sm"
                                aria-label="Favourite"
                            />
                        ) : null
                    }
                    bottomLeft={
                        file.isPrivate ? (
                            <span className="rounded bg-background/90 px-2 py-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase shadow-sm">
                                Private
                            </span>
                        ) : null
                    }
                    selected={selectedIds.includes(file.id)}
                    multiSelectMode={selectedIds.length > 1}
                    actions={ACTIONS}
                    onSelect={(modifiers) => select(file.id, modifiers)}
                    onOpen={() => console.info('open', file.name)}
                    onAction={(key) => console.info(key, file.name)}
                />
            )}
        />
    );
}

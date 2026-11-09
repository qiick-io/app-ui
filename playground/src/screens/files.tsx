import { Download, FolderInput, Trash2, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { ActionsOverflow } from '@/components/admin/actions-overflow';
import type { OverflowActionDefinition } from '@/components/admin/actions-overflow';
import { FilterSearch } from '@/components/layout/page-header';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { DemoShell } from './demo-shell';
import { FilesGridBody } from './files-grid-body';

const SELECTION_ACTIONS: OverflowActionDefinition[] = [
    { key: 'download', label: 'Download', icon: Download },
    { key: 'move', label: 'Move', icon: FolderInput },
    { key: 'trash', label: 'Move to trash', icon: Trash2, destructive: true },
];

/**
 * externa-core `/admin/files`: search, or the selection bar (count, clear,
 * actions that spill into ⋯) while files are selected; scrolling grid.
 */
export function FilesScreen() {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    return (
        <DemoShell
            active="files"
            breadcrumbs={[{ title: 'Files', href: '#/files' }]}
            headerActions={
                <Button>
                    <Upload className="size-4" />
                    Upload
                </Button>
            }
        >
            <PageLayout
                scrollContent
                filters={
                    selectedIds.length > 0 ? (
                        <div className="flex w-full min-w-0 items-center justify-between gap-3">
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="text-sm font-medium">
                                    {selectedIds.length} selected
                                </span>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setSelectedIds([])}
                                    aria-label="Clear selection"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                            {/* flex-1: the overflow measures this slot, so it must span the free width. */}
                            <ActionsOverflow
                                actions={SELECTION_ACTIONS}
                                iconOnly
                                className="justify-end"
                                onAction={(key) =>
                                    console.info(key, selectedIds)
                                }
                            />
                        </div>
                    ) : (
                        <FilterSearch
                            value={search}
                            onChange={setSearch}
                            placeholder="Search files"
                        />
                    )
                }
            >
                <FilesGridBody
                    selectedIds={selectedIds}
                    onSelectedIdsChange={setSelectedIds}
                />
            </PageLayout>
        </DemoShell>
    );
}

import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import {
    CircleCheck,
    CircleDashed,
    CircleX,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
    DataTable,
    DataTableRowActions,
    dataTableSelectColumn,
} from '@/components/admin/data-table';
import type { DataTableSort } from '@/components/admin/data-table';
import { DataTableColumnHeader } from '@/components/admin/data-table-column-header';
import { DataTableFacetedFilter } from '@/components/admin/data-table-faceted-filter';
import { HeaderIconButton } from '@/components/admin/header-icon-button';
import { Badge } from '@/components/ui/badge';

type Job = {
    id: number;
    name: string;
    status: 'done' | 'failed' | 'queued';
    queue: string;
    attempts: number;
    startedAt: string;
};

const JOBS: Job[] = [
    {
        id: 1,
        name: 'ImportCollectionJob',
        status: 'done',
        queue: 'imports',
        attempts: 1,
        startedAt: 'Nov 27, 2026, 9:11 AM',
    },
    {
        id: 2,
        name: 'SendDigestJob',
        status: 'failed',
        queue: 'mail',
        attempts: 3,
        startedAt: 'Nov 27, 2026, 8:02 AM',
    },
    {
        id: 3,
        name: 'IndexItemsJob',
        status: 'queued',
        queue: 'search',
        attempts: 0,
        startedAt: 'Nov 26, 2026, 8:02 PM',
    },
    {
        id: 4,
        name: 'PruneRevisionsJob',
        status: 'done',
        queue: 'default',
        attempts: 1,
        startedAt: 'Nov 26, 2026, 6:45 PM',
    },
];

const STATUS_OPTIONS = [
    { value: 'done', label: 'Done', icon: CircleCheck },
    { value: 'failed', label: 'Failed', icon: CircleX },
    { value: 'queued', label: 'Queued', icon: CircleDashed },
];

const COLUMNS: ColumnDef<Job>[] = [
    dataTableSelectColumn<Job>({
        selectAllLabel: 'Select all jobs',
        getRowLabel: (job) => `Select ${job.name}`,
    }),
    {
        accessorKey: 'name',
        enableSorting: true,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Job" />
        ),
    },
    {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge
                variant={
                    row.original.status === 'failed'
                        ? 'destructive'
                        : row.original.status === 'done'
                          ? 'success'
                          : 'muted'
                }
            >
                {row.original.status}
            </Badge>
        ),
    },
    { accessorKey: 'queue', header: 'Queue' },
    {
        accessorKey: 'attempts',
        header: 'Attempts',
        meta: {
            headerClassName: 'text-right',
            cellClassName: 'text-right tabular-nums',
        },
    },
    {
        accessorKey: 'startedAt',
        header: 'Started',
        meta: { cellClassName: 'text-muted-foreground tabular-nums' },
    },
    {
        id: 'actions',
        // Two icon-sm buttons + padding; used as rightPinnedWidth for the primary max-width.
        size: 72,
        header: 'Actions',
        meta: {
            headerClassName: 'w-[1%] text-right',
            cellClassName: 'text-right',
            isRowClickIgnored: true,
        },
        cell: ({ row }) => (
            <DataTableRowActions label="Actions">
                <HeaderIconButton
                    size="icon-sm"
                    label={`Retry ${row.original.name}`}
                >
                    <RotateCcw className="size-3.5" />
                </HeaderIconButton>
                <HeaderIconButton
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    label={`Delete ${row.original.name}`}
                >
                    <Trash2 className="size-3.5" />
                </HeaderIconButton>
            </DataTableRowActions>
        ),
    },
];

/** Select and job name stay on the left, the actions on the right, while the rest scrolls. */
const COLUMN_PINNING = { left: ['select', 'name'], right: ['actions'] };

/**
 * Column sort dropdown, a faceted filter, pinned columns and hover row actions in a card
 * narrower than the table; the full list page is on the Users screen.
 */
export default function DataTableDemo() {
    const [sort, setSort] = useState<DataTableSort>({
        id: 'name',
        direction: 'asc',
    });
    const [statuses, setStatuses] = useState<string[]>([]);
    const [openedJob, setOpenedJob] = useState<Job>();
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    // The server sorts and filters in the apps; the demo does it on a fixed page.
    const rows = JOBS.filter(
        (job) => statuses.length === 0 || statuses.includes(job.status),
    ).sort(
        (first, second) =>
            first.name.localeCompare(second.name) *
            (sort.direction === 'asc' ? 1 : -1),
    );

    return (
        <div className="flex flex-col gap-3">
            <DataTableFacetedFilter
                title="Status"
                options={STATUS_OPTIONS}
                selectedValues={statuses}
                onSelectedValuesChange={setStatuses}
                className="self-start"
            />
            <DataTable
                columns={COLUMNS}
                data={rows}
                getRowId={(job) => String(job.id)}
                sort={sort}
                onSortChange={setSort}
                onRowClick={setOpenedJob}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                columnPinning={COLUMN_PINNING}
                className="max-w-xl rounded-md border"
            />
            <output className="text-sm text-muted-foreground">
                {openedJob ? `Opened ${openedJob.name}` : null}
            </output>
        </div>
    );
}

import type { ColumnDef } from '@tanstack/react-table';
import { CircleCheck, CircleDashed, CircleX } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/admin/data-table';
import type { DataTableSort } from '@/components/admin/data-table';
import { DataTableColumnHeader } from '@/components/admin/data-table-column-header';
import { DataTableFacetedFilter } from '@/components/admin/data-table-faceted-filter';
import { Badge } from '@/components/ui/badge';

type Job = { id: number; name: string; status: 'done' | 'failed' | 'queued' };

const JOBS: Job[] = [
    { id: 1, name: 'ImportCollectionJob', status: 'done' },
    { id: 2, name: 'SendDigestJob', status: 'failed' },
    { id: 3, name: 'IndexItemsJob', status: 'queued' },
    { id: 4, name: 'PruneRevisionsJob', status: 'done' },
];

const STATUS_OPTIONS = [
    { value: 'done', label: 'Done', icon: CircleCheck },
    { value: 'failed', label: 'Failed', icon: CircleX },
    { value: 'queued', label: 'Queued', icon: CircleDashed },
];

const COLUMNS: ColumnDef<Job>[] = [
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
];

/** Column sort dropdown and a faceted filter; the full list page is on the Users screen. */
export default function DataTableDemo() {
    const [sort, setSort] = useState<DataTableSort>({
        id: 'name',
        direction: 'asc',
    });
    const [statuses, setStatuses] = useState<string[]>([]);
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
            />
        </div>
    );
}

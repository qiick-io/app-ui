import { UserCheck } from 'lucide-react';
import { useState } from 'react';
import { DataTableFacetedFilter } from '@/components/admin/data-table-faceted-filter';
import { DataTableToolbar } from '@/components/admin/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const STATUSES = ['Open', 'Resolved', 'Ignored', 'All'];
const RANGES = ['1h', '6h', '24h', '7d', '14d'];
const ASSIGNEES = [
    { value: 'ada', label: 'Ada Lovelace' },
    { value: 'grace', label: 'Grace Hopper' },
];

/**
 * The list toolbar at two widths: search left and filters grouped right in one row, and the
 * same toolbar in a narrow card, where the secondary filters move behind "Filters" with
 * their active count.
 */
export default function DataTableToolbarDemo() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Open');
    const [isMine, setIsMine] = useState(false);
    const [assignees, setAssignees] = useState<string[]>([]);
    const [range, setRange] = useState('24h');
    const activeFilterCount =
        Number(isMine) + Number(assignees.length > 0) + Number(range !== '24h');

    const toolbar = (
        <DataTableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search exceptions…"
            trailing={
                <ToggleGroup
                    type="single"
                    variant="outline"
                    value={status}
                    onValueChange={(value) => value && setStatus(value)}
                    aria-label="Status"
                >
                    {STATUSES.map((item) => (
                        <ToggleGroupItem key={item} value={item}>
                            {item}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            }
            collapsibleFilters={
                <>
                    <Toggle
                        variant="outline"
                        pressed={isMine}
                        onPressedChange={setIsMine}
                    >
                        <UserCheck aria-hidden="true" />
                        Assigned to me
                    </Toggle>
                    <DataTableFacetedFilter
                        title="Assignee"
                        options={ASSIGNEES}
                        selectedValues={assignees}
                        onSelectedValuesChange={setAssignees}
                    />
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={range}
                        onValueChange={(value) => value && setRange(value)}
                        aria-label="Time range"
                    >
                        {RANGES.map((item) => (
                            <ToggleGroupItem key={item} value={item}>
                                {item}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </>
            }
            collapsibleFilterCount={activeFilterCount}
        />
    );

    return (
        <div className="flex flex-col gap-4">
            {toolbar}
            <div className="max-w-md rounded-md border p-3">{toolbar}</div>
            <DataTableToolbar
                search=""
                onSearchChange={() => undefined}
                selectedCount={3}
                onClearSelection={() => undefined}
                bulkActions={
                    <Button variant="destructive-outline">Delete</Button>
                }
            />
        </div>
    );
}

import { useState } from 'react';
import { DataTableToolbar } from '@/components/admin/data-table-toolbar';
import { Button } from '@/components/ui/button';

export default function DataTableToolbarDemo() {
    const [search, setSearch] = useState('');

    return (
        <div className="flex flex-col gap-3">
            <DataTableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search users…"
                trailing={<Button variant="outline">Export</Button>}
            />
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

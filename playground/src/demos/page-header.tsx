import { useState } from 'react';
import { FilterSearch, PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';

export default function PageHeaderDemo() {
    const [search, setSearch] = useState('');

    return (
        <PageHeader
            description="Groups give their members the same permissions."
            filters={
                <FilterSearch
                    value={search}
                    onChange={setSearch}
                    placeholder="Search groups…"
                />
            }
            filtersRight={<Button variant="outline">Export</Button>}
        />
    );
}

import { useState } from 'react';
import type { TableDensity } from '@/components/table-density-toggle';
import { TableDensityToggle } from '@/components/table-density-toggle';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const ROWS = [
    ['TypeError in CheckoutController', '12', '2 min ago'],
    ['Queue worker timed out', '3', '1 h ago'],
    ['Slow query on orders', '41', '3 h ago'],
];

/** The toggle drives `data-density` on the table's container here; apps set it on <html>. */
export default function TableDensityToggleDemo() {
    const [density, setDensity] = useState<TableDensity>('comfortable');

    return (
        <div className="grid gap-3" data-density={density}>
            <TableDensityToggle value={density} onChange={setDensity} />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Issue</TableHead>
                        <TableHead>Events</TableHead>
                        <TableHead>Last seen</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ROWS.map(([issue, events, lastSeen]) => (
                        <TableRow key={issue}>
                            <TableCell>{issue}</TableCell>
                            <TableCell className="tabular-nums">
                                {events}
                            </TableCell>
                            <TableCell>{lastSeen}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

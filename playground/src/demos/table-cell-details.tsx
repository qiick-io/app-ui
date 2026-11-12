import { TableCellDetails } from '@/components/table-cell-details';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const LARGEST_TABLES = [
    { id: 'jobs', label: 'jobs', value: 0.08, valueLabel: '0.08 MB' },
    { id: 'sessions', label: 'sessions', value: 0.08, valueLabel: '0.08 MB' },
    { id: 'cache', label: 'cache', value: 0.06, valueLabel: '0.06 MB' },
    { id: 'users', label: 'users', value: 0.03, valueLabel: '0.03 MB' },
    {
        id: 'migrations',
        label: 'migrations',
        value: 0.01,
        valueLabel: '0.01 MB',
    },
];

const BLOCKING_PACKAGES = [
    'laravel/horizon',
    'spatie/laravel-backup',
    'inertiajs/inertia-laravel',
    'laravel/sanctum',
    'spatie/laravel-permission',
    'laravel/telescope',
    'barryvdh/laravel-dompdf',
    'league/flysystem-aws-s3-v3',
    'predis/predis',
    'laravel/socialite',
    'maatwebsite/excel',
    'guzzlehttp/guzzle',
].map((name) => ({ id: name, label: name }));

const BACKUP_DISKS = [
    { id: 's3', label: 's3' },
    { id: 'local', label: 'local' },
];

/** A report table: a bar breakdown, a long list that scrolls, a short list. */
export default function TableCellDetailsDemo() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Database</TableHead>
                    <TableHead>Upgrade</TableHead>
                    <TableHead>Backups</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell className="font-medium">
                        shop.example.com
                    </TableCell>
                    <TableCell>
                        <TableCellDetails
                            variant="bar"
                            items={LARGEST_TABLES}
                            summary="0.26 MB"
                            title="Largest tables"
                            triggerLabel="Show 5 largest tables"
                        />
                    </TableCell>
                    <TableCell>
                        <TableCellDetails
                            items={BLOCKING_PACKAGES}
                            summary="12 packages"
                            title="Packages blocking the upgrade"
                            triggerLabel="Show 12 packages blocking the upgrade"
                        />
                    </TableCell>
                    <TableCell>
                        <TableCellDetails
                            items={BACKUP_DISKS}
                            title="Backup disks"
                            triggerLabel="Show 2 backup disks"
                        />
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

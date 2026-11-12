import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const ROWS = [
    ['Lars Holm', 'lars.holm@example.com', 'super-admin'],
    ['Giulia Ferri', 'giulia.ferri@example.com', 'editor'],
    ['Carolina Bogan', 'carolina.bogan@example.com', 'author'],
];

const RUNTIME_ROWS = [
    ['GET /api/projects', '1,204', '38 ms', '112 ms', '240 ms', '0.2%'],
    ['POST /api/checks', '873', '64 ms', '190 ms', '410 ms', '1.1%'],
    ['GET /dashboard', '2,310', '22 ms', '80 ms', '150 ms', '0.0%'],
];

/**
 * A table that fits, then a wide one in a phone-width card: the second fades
 * out on the side that hides columns (the scroll cue) and Tab reaches it.
 */
export default function TableDemo() {
    return (
        <div className="flex flex-col gap-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ROWS.map(([name, email, role]) => (
                        <TableRow key={email}>
                            <TableCell className="font-medium">
                                {name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {email}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary">{role}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div
                data-test="table-scroll-cue-demo"
                className="w-full max-w-[358px] rounded-lg border bg-card p-2"
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Route</TableHead>
                            <TableHead className="text-right">
                                Requests
                            </TableHead>
                            <TableHead className="text-right">p50</TableHead>
                            <TableHead className="text-right">p95</TableHead>
                            <TableHead className="text-right">p99</TableHead>
                            <TableHead className="text-right">Errors</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {RUNTIME_ROWS.map(([route, ...values]) => (
                            <TableRow key={route}>
                                <TableCell className="font-mono">
                                    {route}
                                </TableCell>
                                {values.map((value, index) => (
                                    <TableCell
                                        key={index}
                                        className="text-right tabular-nums"
                                    >
                                        {value}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

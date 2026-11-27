import { CardTableScroll } from '@/components/layout/card-table-scroll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const CHECKS = Array.from({ length: 14 }, (_, index) => ({
    id: `check-${index + 1}`,
    findings: (index * 7) % 5,
}));

/**
 * Card grids (docs/dashboard.md): a table with a fixed maximum height, its rows scrolling under
 * the sticky header row.
 */
export default function CardTableScrollDemo() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle>Checks</CardTitle>
            </CardHeader>
            <CardContent>
                <CardTableScroll className="max-h-64">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Check</TableHead>
                                <TableHead className="text-right">
                                    Findings
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {CHECKS.map((check) => (
                                <TableRow key={check.id}>
                                    <TableCell className="font-mono text-xs">
                                        {check.id}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {check.findings}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardTableScroll>
            </CardContent>
        </Card>
    );
}

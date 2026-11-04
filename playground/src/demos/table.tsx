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

export default function TableDemo() {
    return (
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
                        <TableCell className="font-medium">{name}</TableCell>
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
    );
}

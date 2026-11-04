import { ArrowDownAZ, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { DataTableToolbar } from '@/components/admin/data-table-toolbar';
import {
    PageLayout,
    TablePanel,
    TablePaginationFooter,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DemoShell } from './demo-shell';

const FIRST_NAMES = [
    'Lars',
    'Giulia',
    'Carolina',
    'Billie',
    'Jessi',
    'Gunnar',
    'Xavier',
    'Maynard',
    'Eve',
    'Rodrigo',
    'Adriel',
    'Wade',
    'Alice',
    'Woodrow',
    'Curt',
    'Maeve',
    'Dana',
    'Candace',
    'Anna',
    'Karianne',
];
const LAST_NAMES = [
    'Holm',
    'Ferri',
    'Bogan',
    'Lemke',
    'Schinner',
    'Heller',
    'Tromp',
    'Muller',
    'Rautzer',
    'Frami',
    'Bruen',
    'Dubuque',
    'Hills',
    'Stark',
    'Koss',
    "O'Reilly",
    'Cole',
    'Kihn',
    'Lynch',
    'Feil',
];
const ROLES = [
    'super-admin',
    'editor',
    'author',
    'reader',
    'admin',
    'reviewer',
];

const USERS = FIRST_NAMES.map((first, index) => ({
    id: index + 1,
    name: `${first} ${LAST_NAMES[index]}`,
    email: `${first.toLowerCase()}.${LAST_NAMES[index].toLowerCase().replace("'", '')}@example.com`,
    role: ROLES[index % ROLES.length],
    isActive: index !== 11,
}));

const PAGINATION = {
    current_page: 1,
    last_page: 4,
    per_page: 20,
    total: 67,
    links: [
        { url: null, label: '&laquo; Previous', active: false },
        { url: '#/users', label: '1', active: true },
        { url: '#/users', label: '2', active: false },
        { url: '#/users', label: '3', active: false },
        { url: '#/users', label: '4', active: false },
        { url: '#/users', label: 'Next &raquo;', active: false },
    ],
};

/** externa-core `/users` (pages/admin/users/index.tsx). */
export function UsersScreen() {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number[]>([]);

    const toggle = (id: number, isChecked: boolean) =>
        setSelected((current) =>
            isChecked
                ? [...current, id]
                : current.filter((selectedId) => selectedId !== id),
        );

    return (
        <DemoShell
            active="users"
            breadcrumbs={[{ title: 'Users', href: '#/users' }]}
            headerActions={
                <Button type="button">
                    <UserPlus className="size-4" />
                    New user
                </Button>
            }
        >
            <PageLayout
                filters={
                    <DataTableToolbar
                        search={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search users…"
                        selectedCount={selected.length}
                        onClearSelection={() => setSelected([])}
                        bulkActions={
                            <Button type="button" variant="destructive-outline">
                                Delete
                            </Button>
                        }
                    />
                }
                filtersRight={
                    selected.length > 0 ? null : (
                        <div className="flex items-center gap-1.5">
                            <Select defaultValue="created_at">
                                <SelectTrigger
                                    aria-label="Sort by"
                                    className="w-[7.5rem]"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="created_at">
                                        Created
                                    </SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Sort descending"
                            >
                                <ArrowDownAZ className="size-4" />
                            </Button>
                            <ToggleGroup
                                variant="outline"
                                type="single"
                                defaultValue="active"
                            >
                                <ToggleGroupItem
                                    value="active"
                                    aria-label="Active users"
                                    className="px-2.5"
                                >
                                    <Users className="size-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="trashed"
                                    aria-label="Trash"
                                    className="px-2.5"
                                >
                                    <Trash2 className="size-4" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    )
                }
            >
                <TablePanel
                    footer={<TablePaginationFooter pagination={PAGINATION} />}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        aria-label="Select all"
                                        checked={
                                            selected.length === USERS.length
                                        }
                                        onCheckedChange={(checked) =>
                                            setSelected(
                                                checked === true
                                                    ? USERS.map(
                                                          (user) => user.id,
                                                      )
                                                    : [],
                                            )
                                        }
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {USERS.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Checkbox
                                            aria-label={`Select ${user.name}`}
                                            checked={selected.includes(user.id)}
                                            onCheckedChange={(checked) =>
                                                toggle(
                                                    user.id,
                                                    checked === true,
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-2 font-medium">
                                            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs">
                                                {user.name
                                                    .split(' ')
                                                    .map((part) => part[0])
                                                    .join('')}
                                            </span>
                                            {user.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                user.isActive
                                                    ? 'success'
                                                    : 'muted'
                                            }
                                        >
                                            {user.isActive
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Edit ${user.name}`}
                                        >
                                            <Pencil />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TablePanel>
            </PageLayout>
        </DemoShell>
    );
}

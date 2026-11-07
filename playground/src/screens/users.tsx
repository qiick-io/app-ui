import type { ColumnDef } from '@tanstack/react-table';
import type { RowSelectionState } from '@tanstack/react-table';
import { ArrowDownAZ, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import {
    DataTable,
    dataTableSelectColumn,
} from '@/components/admin/data-table';
import type { DataTableSort } from '@/components/admin/data-table';
import { DataTableColumnHeader } from '@/components/admin/data-table-column-header';
import { DataTableToolbar } from '@/components/admin/data-table-toolbar';
import { HeaderIconButton } from '@/components/admin/header-icon-button';
import { UserAvatar } from '@/components/admin/user-avatar';
import { PageLayout } from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

type DemoUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
};

const USERS: DemoUser[] = FIRST_NAMES.map((first, index) => ({
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

const COLUMNS: ColumnDef<DemoUser>[] = [
    dataTableSelectColumn<DemoUser>({
        selectAllLabel: 'Select all',
        getRowLabel: (user) => `Select ${user.name}`,
    }),
    {
        accessorKey: 'name',
        enableSorting: true,
        meta: { cellClassName: 'font-medium' },
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
            <span className="inline-flex items-center gap-2">
                <UserAvatar
                    userId={row.original.id}
                    name={row.original.name}
                    isOnline={row.original.id % 3 === 0}
                />
                {row.original.name}
            </span>
        ),
    },
    {
        accessorKey: 'email',
        enableSorting: true,
        meta: { cellClassName: 'text-muted-foreground' },
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
    },
    {
        id: 'roles',
        header: 'Roles',
        cell: ({ row }) => (
            <Badge variant="secondary">{row.original.role}</Badge>
        ),
    },
    {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? 'success' : 'muted'}>
                {row.original.isActive ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
    {
        id: 'actions',
        header: 'Actions',
        meta: {
            headerClassName: 'w-[1%] text-right',
            cellClassName: 'text-right',
            isRowClickIgnored: true,
        },
        // Row actions: outline icon buttons in a ButtonGroup, delete last in the destructive colour.
        cell: ({ row }) => (
            <ButtonGroup aria-label="Actions" className="ml-auto">
                <HeaderIconButton
                    variant="outline"
                    size="icon-sm"
                    label={`Edit ${row.original.name}`}
                >
                    <Pencil className="size-3.5" />
                </HeaderIconButton>
                <HeaderIconButton
                    variant="outline"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    label={`Delete ${row.original.name}`}
                >
                    <Trash2 className="size-3.5" />
                </HeaderIconButton>
            </ButtonGroup>
        ),
    },
];

/** externa-core `/users` (pages/admin/users/index.tsx): the server-driven DataTable. */
export function UsersScreen() {
    const [search, setSearch] = useState('');
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [sort, setSort] = useState<DataTableSort>({
        id: 'name',
        direction: 'asc',
    });
    const selectedCount = Object.keys(rowSelection).length;
    // The server sorts in the apps; the playground sorts its fixed page.
    const rows = [...USERS].sort((first, second) => {
        const key = sort.id as 'name' | 'email';
        const order = first[key].localeCompare(second[key]);

        return sort.direction === 'asc' ? order : -order;
    });

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
                        selectedCount={selectedCount}
                        onClearSelection={() => setRowSelection({})}
                        bulkActions={
                            <Button type="button" variant="destructive-outline">
                                Delete
                            </Button>
                        }
                    />
                }
                filtersRight={
                    selectedCount > 0 ? null : (
                        <div className="flex items-center gap-1.5">
                            <Select
                                value={sort.id}
                                onValueChange={(id) =>
                                    setSort((current) => ({ ...current, id }))
                                }
                            >
                                <SelectTrigger
                                    aria-label="Sort by"
                                    className="w-[7.5rem]"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Reverse sort"
                                onClick={() =>
                                    setSort((current) => ({
                                        ...current,
                                        direction:
                                            current.direction === 'asc'
                                                ? 'desc'
                                                : 'asc',
                                    }))
                                }
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
                                >
                                    <Users className="size-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="trashed"
                                    aria-label="Trash"
                                >
                                    <Trash2 className="size-4" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    )
                }
            >
                <DataTable
                    columns={COLUMNS}
                    data={rows}
                    getRowId={(user) => String(user.id)}
                    sort={sort}
                    onSortChange={setSort}
                    rowSelection={rowSelection}
                    onRowSelectionChange={setRowSelection}
                    pagination={PAGINATION}
                    onRowClick={() => undefined}
                />
            </PageLayout>
        </DemoShell>
    );
}

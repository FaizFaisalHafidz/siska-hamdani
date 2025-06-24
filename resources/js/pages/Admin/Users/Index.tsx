import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Edit, Filter, KeyRound, MoreHorizontal, Plus, Power, Search, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import UserForm from './Form';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manajemen User',
        href: '/admin/users',
    },
];

interface User {
    id: number;
    kode_user: string;
    name: string;
    nama_lengkap: string;
    email: string;
    nomor_telepon: string;
    alamat: string;
    tanggal_bergabung: string;
    status_aktif: boolean;
    terakhir_login: string;
    roles: string[];
    role_names: string;
    created_at: string;
}

interface Role {
    id: number;
    name: string;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    roles: Role[];
    filters: {
        search?: string;
        role?: string;
        status?: boolean;
    };
}

export default function Index({ users, roles, filters }: Props) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    
    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
        open: false,
        user: null
    });
    
    // Filter states
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [statusFilter, setStatusFilter] = useState(filters.status?.toString() || '');

    const columns: ColumnDef<User>[] = useMemo(() => [
        {
            accessorKey: 'kode_user',
            header: 'Kode User',
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue('kode_user')}</div>
            ),
        },
        {
            accessorKey: 'nama_lengkap',
            header: 'Nama Lengkap',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.getValue('nama_lengkap')}</div>
                    <div className="text-sm text-muted-foreground">{row.original.name}</div>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'role_names',
            header: 'Role',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.getValue('role_names')}
                </Badge>
            ),
        },
        {
            accessorKey: 'nomor_telepon',
            header: 'No. Telepon',
            cell: ({ row }) => (
                <div>{row.getValue('nomor_telepon') || '-'}</div>
            ),
        },
        {
            accessorKey: 'status_aktif',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.getValue('status_aktif') ? 'default' : 'secondary'}>
                    {row.getValue('status_aktif') ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            accessorKey: 'terakhir_login',
            header: 'Terakhir Login',
            cell: ({ row }) => (
                <div className="text-sm">{row.getValue('terakhir_login') || 'Belum pernah'}</div>
            ),
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const user = row.original;
                
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {/* <DropdownMenuItem onClick={() => handleView(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </DropdownMenuItem> */}
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                <Power className="mr-2 h-4 w-4" />
                                {user.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ open: true, user })}
                                className="text-red-600"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], []);

    const table = useReactTable({
        data: users.data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const handleCreate = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleView = (user: User) => {
        router.visit(route('admin.users.show', user.id));
    };

    const handleToggleStatus = (user: User) => {
        router.patch(route('admin.users.toggle-status', user.id), {}, {
            onSuccess: () => {
                toast.success(`User berhasil ${user.status_aktif ? 'dinonaktifkan' : 'diaktifkan'}`);
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat mengubah status user');
            }
        });
    };

    const handleResetPassword = (user: User) => {
        router.patch(route('admin.users.reset-password', user.id), {}, {
            onSuccess: () => {
                toast.success('Password berhasil direset');
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat reset password');
            }
        });
    };

    const handleDelete = () => {
        if (!deleteDialog.user) return;

        router.delete(route('admin.users.destroy', deleteDialog.user.id), {
            onSuccess: () => {
                toast.success('User berhasil dihapus');
                setDeleteDialog({ open: false, user: null });
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat menghapus user');
            }
        });
    };

    const handleSearch = () => {
        router.get(route('admin.users.index'), {
            search: searchValue,
            role: roleFilter,
            status: statusFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchValue('');
        setRoleFilter('');
        setStatusFilter('');
        router.get(route('admin.users.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            
            <div className="container mx-auto py-6 p-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>User Management</CardTitle>
                                <CardDescription>
                                    Kelola data pengguna sistem
                                </CardDescription>
                            </div>
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah User
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Cari user..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            
                            {/* Role Filter - Native Select */}
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-[180px] px-3 py-2 border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                            >
                                <option value="">Semua Role</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {/* Status Filter - Native Select */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-[180px] px-3 py-2 border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                            >
                                <option value="">Semua Status</option>
                                <option value="true">Aktif</option>
                                <option value="false">Nonaktif</option>
                            </select>

                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Cari
                            </Button>
                            <Button variant="outline" onClick={clearFilters}>
                                <Filter className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                Tidak ada data.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {users.data.length} dari {users.total} data
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* User Form Modal */}
                <UserForm
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    user={editingUser}
                    roles={roles}
                />

                {/* Delete Dialog */}
                <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus User</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus user "{deleteDialog.user?.nama_lengkap}"? 
                                Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Toaster />
        </AppLayout>
    );
}
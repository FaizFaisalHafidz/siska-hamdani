import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
    ArrowUpDown,
    Calendar,
    Crown,
    Edit,
    Eye,
    Filter,
    Mail,
    MoreHorizontal,
    Phone,
    Power,
    Search,
    Shield,
    User,
    UserCheck,
    UserPlus,
    Users
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import CustomerForm from './Form';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Data Pelanggan',
        href: '/kasir/pelanggan',
    },
];

interface Customer {
    id: number;
    kode_pelanggan: string;
    nama_pelanggan: string;
    nomor_telepon: string;
    email_pelanggan: string;
    alamat_pelanggan: string;
    tanggal_bergabung: string;
    status_aktif: boolean;
    created_at: string;
    total_pembelian: number;
    jumlah_transaksi: number;
    total_pembelian_format: string;
}

interface Statistics {
    total_pelanggan: number;
    pelanggan_aktif: number;
}

interface Props {
    customers: {
        data: Customer[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    filters: {
        search?: string;
        status?: boolean;
    };
    statistics: Statistics;
}

export default function Index({ customers, filters, statistics }: Props) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    
    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    
    // Filter states
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status?.toString() || '');

    const getCustomerTypeIcon = (jenis: string) => {
        switch (jenis) {
            case 'vip':
                return <Crown className="w-4 h-4 text-yellow-500" />;
            case 'member':
                return <Shield className="w-4 h-4 text-blue-500" />;
            default:
                return <User className="w-4 h-4 text-gray-500" />;
        }
    };

    const getCustomerTypeBadge = (jenis: string) => {
        switch (jenis) {
            case 'vip':
                return <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">VIP</Badge>;
            case 'member':
                return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">Member</Badge>;
            default:
                return <Badge variant="outline">Reguler</Badge>;
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const columns: ColumnDef<Customer>[] = useMemo(() => [
        {
            accessorKey: 'avatar',
            header: '',
            cell: ({ row }) => {
                const customer = row.original;
                return (
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white font-semibold">
                            {getInitials(customer.nama_pelanggan)}
                        </AvatarFallback>
                    </Avatar>
                );
            },
        },
        {
            accessorKey: 'kode_pelanggan',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Kode Pelanggan
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium text-sm text-green-600">{row.getValue('kode_pelanggan')}</div>
            ),
        },
        {
            accessorKey: 'nama_pelanggan',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Nama Pelanggan
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const customer = row.original;
                return (
                    <div className="space-y-1">
                        <div className="font-medium">{customer.nama_pelanggan}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {customer.jenis_kelamin && (
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {customer.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'jenis_pelanggan',
            header: 'Tipe',
            cell: ({ row }) => {
                const jenis = row.getValue('jenis_pelanggan') as string;
                return (
                    <div className="flex items-center gap-2">
                        {getCustomerTypeIcon(jenis)}
                        {getCustomerTypeBadge(jenis)}
                    </div>
                );
            },
        },
        {
            accessorKey: 'contact',
            header: 'Kontak',
            cell: ({ row }) => {
                const customer = row.original;
                return (
                    <div className="space-y-1">
                        {customer.nomor_telepon && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-green-500" />
                                <span>{customer.nomor_telepon}</span>
                            </div>
                        )}
                        {customer.email_pelanggan && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-3 h-3 text-blue-500" />
                                <span className="truncate max-w-[150px]">{customer.email_pelanggan}</span>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'statistics',
            header: 'Statistik',
            cell: ({ row }) => {
                const customer = row.original;
                return (
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-green-600">
                            {customer.total_pembelian_format}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {customer.jumlah_transaksi} transaksi
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'tanggal_bergabung',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Bergabung
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {row.getValue('tanggal_bergabung')}
                </div>
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
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const customer = row.original;
                
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi Pelanggan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleView(customer)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Pelanggan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(customer)}>
                                <Power className="mr-2 h-4 w-4" />
                                {customer.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], []);

    const table = useReactTable({
        data: customers.data,
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
        setEditingCustomer(null);
        setIsFormOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsFormOpen(true);
    };

    const handleView = (customer: Customer) => {
        router.visit(route('kasir.pelanggan.show', customer.id));
    };

    const handleToggleStatus = (customer: Customer) => {
        router.patch(route('kasir.pelanggan.toggle-status', customer.id), {}, {
            onSuccess: () => {
                toast.success(`Pelanggan berhasil ${customer.status_aktif ? 'dinonaktifkan' : 'diaktifkan'}`);
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat mengubah status pelanggan');
            }
        });
    };

    const handleSearch = () => {
        router.get(route('kasir.pelanggan.index'), {
            search: searchValue,
            jenis_pelanggan: jenisFilter,
            status: statusFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchValue('');
        setJenisFilter('');
        setStatusFilter('');
        router.get(route('kasir.pelanggan.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    // Kasir hanya bisa melihat customer yang aktif untuk transaksi
    const activeCustomersCount = customers.data.filter(c => c.status_aktif).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Pelanggan" />
            
            <div className="container mx-auto py-6 space-y-6 p-6">
                {/* Statistics Cards - Simplified for Kasir */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
                            <Users className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_pelanggan}</div>
                            <p className="text-xs opacity-80">Pelanggan terdaftar</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
                            <UserCheck className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.pelanggan_aktif}</div>
                            <p className="text-xs opacity-80">Siap bertransaksi</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Member</CardTitle>
                            <Shield className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.pelanggan_member}</div>
                            <p className="text-xs opacity-80">Pelanggan member</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">VIP</CardTitle>
                            <Crown className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.pelanggan_vip}</div>
                            <p className="text-xs opacity-80">Pelanggan VIP</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Data Pelanggan
                                </CardTitle>
                                <CardDescription>
                                    Kelola data pelanggan untuk proses transaksi
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleCreate} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Tambah Pelanggan
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters - Simplified for Kasir */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-[250px]">
                                <Input
                                    placeholder="Cari nama, kode, atau nomor telepon..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="bg-white"
                                />
                            </div>
                            
                            <select
                                value={jenisFilter}
                                onChange={(e) => setJenisFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-w-[130px]"
                            >
                                <option value="">Semua Tipe</option>
                                <option value="reguler">Reguler</option>
                                <option value="member">Member</option>
                                <option value="vip">VIP</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-w-[120px]"
                            >
                                <option value="">Semua Status</option>
                                <option value="true">Aktif</option>
                                <option value="false">Nonaktif</option>
                            </select>

                            <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
                                <Search className="mr-2 h-4 w-4" />
                                Cari
                            </Button>
                            <Button variant="outline" onClick={clearFilters}>
                                <Filter className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        </div>

                        {/* Quick Stats */}
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-green-700 font-medium">
                                    Info: {activeCustomersCount} pelanggan aktif siap untuk transaksi
                                </span>
                                <span className="text-green-600">
                                    Total data: {customers.total} pelanggan
                                </span>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="bg-gray-50">
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id} className="font-semibold">
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
                                                className="hover:bg-gray-50"
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
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Users className="h-8 w-8 text-gray-400" />
                                                    <p className="text-gray-500">Tidak ada pelanggan ditemukan</p>
                                                    <Button 
                                                        onClick={handleCreate} 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="mt-2"
                                                    >
                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                        Tambah Pelanggan Pertama
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {customers.data.length} dari {customers.total} pelanggan
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

                {/* Customer Form Modal */}
                <CustomerForm
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    customer={editingCustomer}
                    isKasir={true}
                />
            </div>

            <Toaster />
        </AppLayout>
    );
}
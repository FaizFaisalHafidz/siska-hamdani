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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    Building2,
    CheckSquare,
    Download,
    Edit,
    Filter,
    Mail,
    MapPin,
    MoreHorizontal,
    Phone,
    Plus,
    Power,
    Search,
    Square,
    Trash,
    TruckIcon,
    User,
    Users
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import SupplierForm from './Form';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manajemen Supplier',
        href: '/admin/supplier',
    },
];

interface Supplier {
    id: number;
    kode_supplier: string;
    nama_supplier: string;
    nama_kontak: string;
    nomor_telepon: string;
    email_supplier: string;
    alamat_supplier: string;
    kota_supplier: string;
    status_aktif: boolean;
    created_at: string;
    updated_at: string;
}

interface Statistics {
    total_supplier: number;
    supplier_aktif: number;
    supplier_nonaktif: number;
    total_kota: number;
}

interface Props {
    suppliers: {
        data: Supplier[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    filters: {
        search?: string;
        kota?: string;
        status?: boolean;
    };
    cities: string[];
    statistics: Statistics;
}

export default function Index({ suppliers, filters, cities, statistics }: Props) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    
    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; supplier: Supplier | null }>({
        open: false,
        supplier: null
    });
    const [bulkActionDialog, setBulkActionDialog] = useState<{ open: boolean; action: string }>({
        open: false,
        action: ''
    });
    
    // Filter states
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [kotaFilter, setKotaFilter] = useState(filters.kota || '');
    const [statusFilter, setStatusFilter] = useState(filters.status?.toString() || '');

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const columns: ColumnDef<Supplier>[] = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'avatar',
            header: '',
            cell: ({ row }) => {
                const supplier = row.original;
                return (
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-semibold">
                            {getInitials(supplier.nama_supplier)}
                        </AvatarFallback>
                    </Avatar>
                );
            },
        },
        {
            accessorKey: 'kode_supplier',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Kode Supplier
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium text-sm text-orange-600">{row.getValue('kode_supplier')}</div>
            ),
        },
        {
            accessorKey: 'nama_supplier',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Nama Supplier
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const supplier = row.original;
                return (
                    <div className="space-y-1">
                        <div className="font-medium">{supplier.nama_supplier}</div>
                        {supplier.nama_kontak && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>PIC: {supplier.nama_kontak}</span>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'contact',
            header: 'Kontak',
            cell: ({ row }) => {
                const supplier = row.original;
                return (
                    <div className="space-y-1">
                        {supplier.nomor_telepon && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-green-500" />
                                <span>{supplier.nomor_telepon}</span>
                            </div>
                        )}
                        {supplier.email_supplier && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-3 h-3 text-blue-500" />
                                <span className="truncate max-w-[150px]">{supplier.email_supplier}</span>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'location',
            header: 'Lokasi',
            cell: ({ row }) => {
                const supplier = row.original;
                return (
                    <div className="space-y-1">
                        {supplier.kota_supplier && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-3 h-3 text-red-500" />
                                <span className="font-medium">{supplier.kota_supplier}</span>
                            </div>
                        )}
                        {supplier.alamat_supplier && (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                                {supplier.alamat_supplier}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Dibuat
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue('created_at')}
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
                const supplier = row.original;
                
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi Supplier</DropdownMenuLabel>
                            {/* <DropdownMenuItem onClick={() => handleView(supplier)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </DropdownMenuItem> */}
                            <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Supplier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(supplier)}>
                                <Power className="mr-2 h-4 w-4" />
                                {supplier.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ open: true, supplier })}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Hapus Supplier
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], []);

    const table = useReactTable({
        data: suppliers.data,
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
        setEditingSupplier(null);
        setIsFormOpen(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsFormOpen(true);
    };

    const handleView = (supplier: Supplier) => {
        router.visit(route('admin.supplier.show', supplier.id));
    };

    const handleToggleStatus = (supplier: Supplier) => {
        router.patch(route('admin.supplier.toggle-status', supplier.id), {}, {
            onSuccess: () => {
                toast.success(`Supplier berhasil ${supplier.status_aktif ? 'dinonaktifkan' : 'diaktifkan'}`);
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat mengubah status supplier');
            }
        });
    };

    const handleDelete = () => {
        if (!deleteDialog.supplier) return;

        router.delete(route('admin.supplier.destroy', deleteDialog.supplier.id), {
            onSuccess: () => {
                toast.success('Supplier berhasil dihapus');
                setDeleteDialog({ open: false, supplier: null });
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat menghapus supplier');
            }
        });
    };

    const handleBulkAction = (action: string) => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const supplierIds = selectedRows.map(row => row.original.id);

        if (supplierIds.length === 0) {
            toast.error('Pilih minimal satu supplier');
            return;
        }

        router.post(route('admin.supplier.bulk-action'), {
            action,
            supplier_ids: supplierIds
        }, {
            onSuccess: () => {
                const actionText = action === 'activate' ? 'diaktifkan' : 
                                 action === 'deactivate' ? 'dinonaktifkan' : 'dihapus';
                toast.success(`${supplierIds.length} supplier berhasil ${actionText}`);
                setRowSelection({});
                setBulkActionDialog({ open: false, action: '' });
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat melakukan aksi bulk');
            }
        });
    };

    const handleExport = () => {
        router.get(route('admin.supplier.export'));
    };

    const handleSearch = () => {
        router.get(route('admin.supplier.index'), {
            search: searchValue,
            kota: kotaFilter,
            status: statusFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchValue('');
        setKotaFilter('');
        setStatusFilter('');
        router.get(route('admin.supplier.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const selectedCount = table.getFilteredSelectedRowModel().rows.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Supplier" />
            
            <div className="container mx-auto py-6 space-y-6 p-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Supplier</CardTitle>
                            <TruckIcon className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_supplier}</div>
                            <p className="text-xs opacity-80">Semua supplier terdaftar</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Supplier Aktif</CardTitle>
                            <Building2 className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.supplier_aktif}</div>
                            <p className="text-xs opacity-80">Siap untuk kerja sama</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Supplier Nonaktif</CardTitle>
                            <Users className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.supplier_nonaktif}</div>
                            <p className="text-xs opacity-80">Belum aktif</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Kota</CardTitle>
                            <MapPin className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_kota}</div>
                            <p className="text-xs opacity-80">Sebaran lokasi</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <TruckIcon className="h-5 w-5" />
                                    Manajemen Supplier
                                </CardTitle>
                                <CardDescription>
                                    Kelola data supplier dan informasi kerjasama
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    onClick={handleExport}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                                <Button onClick={handleCreate} className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Supplier
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-[250px]">
                                <Input
                                    placeholder="Cari nama, kode, kontak, telepon, email, atau kota..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="bg-white"
                                />
                            </div>
                            
                            <select
                                value={kotaFilter}
                                onChange={(e) => setKotaFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-w-[150px]"
                            >
                                <option value="">Semua Kota</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
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

                            <Button onClick={handleSearch} className="bg-orange-600 hover:bg-orange-700">
                                <Search className="mr-2 h-4 w-4" />
                                Cari
                            </Button>
                            <Button variant="outline" onClick={clearFilters}>
                                <Filter className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        </div>

                        {/* Bulk Actions */}
                        {selectedCount > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-blue-700">
                                        {selectedCount} supplier dipilih
                                    </span>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => setBulkActionDialog({ open: true, action: 'activate' })}
                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                        >
                                            <CheckSquare className="mr-2 h-4 w-4" />
                                            Aktifkan
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => setBulkActionDialog({ open: true, action: 'deactivate' })}
                                            className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                        >
                                            <Square className="mr-2 h-4 w-4" />
                                            Nonaktifkan
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => setBulkActionDialog({ open: true, action: 'delete' })}
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Hapus
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                                    <TruckIcon className="h-8 w-8 text-gray-400" />
                                                    <p className="text-gray-500">Tidak ada supplier ditemukan</p>
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
                                Menampilkan {suppliers.data.length} dari {suppliers.total} supplier
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

                {/* Supplier Form Modal */}
                <SupplierForm
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    supplier={editingSupplier}
                />

                {/* Delete Dialog */}
                <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Supplier</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus supplier "{deleteDialog.supplier?.nama_supplier}"? 
                                Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDelete} 
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Bulk Action Dialog */}
                <AlertDialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog({ ...bulkActionDialog, open })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {bulkActionDialog.action === 'activate' && 'Aktifkan Supplier'}
                                {bulkActionDialog.action === 'deactivate' && 'Nonaktifkan Supplier'}
                                {bulkActionDialog.action === 'delete' && 'Hapus Supplier'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin {' '}
                                {bulkActionDialog.action === 'activate' && 'mengaktifkan'}
                                {bulkActionDialog.action === 'deactivate' && 'menonaktifkan'}
                                {bulkActionDialog.action === 'delete' && 'menghapus'}
                                {' '} {selectedCount} supplier yang dipilih?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleBulkAction(bulkActionDialog.action)}
                                className={bulkActionDialog.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
                            >
                                Konfirmasi
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Toaster />
        </AppLayout>
    );
}
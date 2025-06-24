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
import {
    AlertTriangle,
    Archive,
    ArrowUpDown,
    Edit,
    Filter,
    Image,
    MoreHorizontal,
    Package,
    Plus,
    Power,
    Search,
    Trash,
    TrendingDown,
    Warehouse
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import ProductForm from './Form';
import StockUpdateForm from './StockUpdateForm';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manajemen Produk',
        href: '/admin/produk',
    },
];

interface Product {
    id: number;
    kode_produk: string;
    nama_produk: string;
    deskripsi_produk: string;
    kategori: {
        id: number;
        nama: string;
    };
    harga_jual: number;
    harga_jual_format: string;
    harga_beli: number;
    stok_tersedia: number;
    stok_minimum: number;
    satuan: string;
    merk_produk: string;
    gambar_produk: string | null;
    status_aktif: boolean;
    tanggal_input: string;
    created_at: string;
    is_stok_rendah: boolean;
}

interface Kategori {
    id: number;
    nama_kategori: string;
}

interface Statistics {
    total_produk: number;
    produk_aktif: number;
    stok_rendah: number;
    total_kategori: number;
}

interface Props {
    products: {
        data: Product[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    kategoris: Kategori[];
    filters: {
        search?: string;
        kategori?: string;
        status?: boolean;
        stok_rendah?: boolean;
    };
    statistics: Statistics;
}

export default function Index({ products, kategoris, filters, statistics }: Props) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    
    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isStockFormOpen, setIsStockFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [stockProduct, setStockProduct] = useState<Product | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
        open: false,
        product: null
    });
    
    // Filter states
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [kategoriFilter, setKategoriFilter] = useState(filters.kategori || '');
    const [statusFilter, setStatusFilter] = useState(filters.status?.toString() || '');
    const [stokRendahFilter, setStokRendahFilter] = useState(filters.stok_rendah ? 'true' : '');

    // Fix for dropdown menu states to prevent aria-hidden conflicts
    const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});

    const handleDropdownOpenChange = (productId: number, open: boolean) => {
        setOpenDropdowns(prev => ({
            ...prev,
            [productId]: open
        }));
    };

    const columns: ColumnDef<Product>[] = useMemo(() => [
        {
            accessorKey: 'gambar_produk',
            header: '',
            cell: ({ row }) => (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {row.original.gambar_produk ? (
                        <img 
                            src={row.original.gambar_produk} 
                            alt={row.original.nama_produk}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'kode_produk',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Kode Produk
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium text-sm">{row.getValue('kode_produk')}</div>
            ),
        },
        {
            accessorKey: 'nama_produk',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Nama Produk
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <div className="font-medium truncate">{row.getValue('nama_produk')}</div>
                    <div className="text-sm text-muted-foreground truncate">
                        {row.original.merk_produk || 'Tanpa merk'}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'kategori',
            header: 'Kategori',
            cell: ({ row }) => (
                <Badge variant="outline" className="text-xs">
                    {row.original.kategori.nama}
                </Badge>
            ),
        },
        {
            accessorKey: 'harga_jual',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Harga Jual
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-right font-medium">
                    {row.original.harga_jual_format}
                </div>
            ),
        },
        {
            accessorKey: 'stok_tersedia',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2"
                >
                    Stok
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="text-center">
                        <div className={`font-medium ${product.is_stok_rendah ? 'text-red-600' : ''}`}>
                            {product.stok_tersedia} {product.satuan}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Min: {product.stok_minimum}
                        </div>
                        {product.is_stok_rendah && (
                            <Badge variant="destructive" className="text-xs mt-1">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Stok Rendah
                            </Badge>
                        )}
                    </div>
                );
            },
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
            accessorKey: 'tanggal_input',
            header: 'Tanggal Input',
            cell: ({ row }) => (
                <div className="text-sm">{row.getValue('tanggal_input')}</div>
            ),
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const product = row.original;
                
                return (
                    <DropdownMenu 
                        open={openDropdowns[product.id] || false}
                        onOpenChange={(open) => handleDropdownOpenChange(product.id, open)}
                        modal={false} // Prevent modal behavior that causes aria-hidden issues
                    >
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                aria-label={`Aksi untuk ${product.nama_produk}`}
                            >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="end" 
                            className="w-48"
                            sideOffset={5}
                            onCloseAutoFocus={(e) => {
                                // Prevent auto focus issues
                                e.preventDefault();
                            }}
                        >
                            <DropdownMenuLabel>Aksi Produk</DropdownMenuLabel>
                            {/* <DropdownMenuItem 
                                onClick={() => {
                                    handleView(product);
                                    handleDropdownOpenChange(product.id, false);
                                }}
                                className="cursor-pointer"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </DropdownMenuItem> */}
                            <DropdownMenuItem 
                                onClick={() => {
                                    handleEdit(product);
                                    handleDropdownOpenChange(product.id, false);
                                }}
                                className="cursor-pointer"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Produk
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => {
                                    handleStockUpdate(product);
                                    handleDropdownOpenChange(product.id, false);
                                }}
                                className="cursor-pointer"
                            >
                                <Warehouse className="mr-2 h-4 w-4" />
                                Update Stok
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => {
                                    handleToggleStatus(product);
                                    handleDropdownOpenChange(product.id, false);
                                }}
                                className="cursor-pointer"
                            >
                                <Power className="mr-2 h-4 w-4" />
                                {product.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => {
                                    setDeleteDialog({ open: true, product });
                                    handleDropdownOpenChange(product.id, false);
                                }}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Hapus Produk
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [openDropdowns]);

    const table = useReactTable({
        data: products.data,
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
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleView = (product: Product) => {
        router.visit(route('admin.produk.show', product.id));
    };

    const handleStockUpdate = (product: Product) => {
        setStockProduct(product);
        setIsStockFormOpen(true);
    };

    const handleToggleStatus = (product: Product) => {
        router.patch(route('admin.produk.toggle-status', product.id), {}, {
            onSuccess: () => {
                toast.success(`Produk berhasil ${product.status_aktif ? 'dinonaktifkan' : 'diaktifkan'}`);
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat mengubah status produk');
            }
        });
    };

    const handleDelete = () => {
        if (!deleteDialog.product) return;

        router.delete(route('admin.produk.destroy', deleteDialog.product.id), {
            onSuccess: () => {
                toast.success('Produk berhasil dihapus');
                setDeleteDialog({ open: false, product: null });
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat menghapus produk');
            }
        });
    };

    const handleSearch = () => {
        router.get(route('admin.produk.index'), {
            search: searchValue,
            kategori: kategoriFilter,
            status: statusFilter,
            stok_rendah: stokRendahFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchValue('');
        setKategoriFilter('');
        setStatusFilter('');
        setStokRendahFilter('');
        router.get(route('admin.produk.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Produk" />
            
            <div className="container mx-auto py-6 space-y-6 p-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                            <Package className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_produk}</div>
                            <p className="text-xs opacity-80">Semua produk terdaftar</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
                            <Archive className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.produk_aktif}</div>
                            <p className="text-xs opacity-80">Produk yang dapat dijual</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
                            <TrendingDown className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.stok_rendah}</div>
                            <p className="text-xs opacity-80">Perlu restock segera</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
                            <Package className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_kategori}</div>
                            <p className="text-xs opacity-80">Kategori produk aktif</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Manajemen Produk
                                </CardTitle>
                                <CardDescription>
                                    Kelola semua produk dalam sistem POS
                                </CardDescription>
                            </div>
                            <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Produk
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-[250px]">
                                <Input
                                    placeholder="Cari produk, kode, atau merk..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="bg-white"
                                />
                            </div>
                            
                            <select
                                value={kategoriFilter}
                                onChange={(e) => setKategoriFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-w-[150px]"
                            >
                                <option value="">Semua Kategori</option>
                                {kategoris.map((kategori) => (
                                    <option key={kategori.id} value={kategori.id}>
                                        {kategori.nama_kategori}
                                    </option>
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

                            <select
                                value={stokRendahFilter}
                                onChange={(e) => setStokRendahFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-w-[140px]"
                            >
                                <option value="">Semua Stok</option>
                                <option value="true">Stok Rendah</option>
                            </select>

                            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                                <Search className="mr-2 h-4 w-4" />
                                Cari
                            </Button>
                            <Button variant="outline" onClick={clearFilters}>
                                <Filter className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
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
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                    <p className="text-gray-500">Tidak ada produk ditemukan</p>
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
                                Menampilkan {products.data.length} dari {products.total} produk
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

                {/* Product Form Modal */}
                <ProductForm
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    product={editingProduct}
                    kategoris={kategoris}
                />

                {/* Stock Update Modal */}
                <StockUpdateForm
                    open={isStockFormOpen}
                    onClose={() => setIsStockFormOpen(false)}
                    product={stockProduct}
                />

                {/* Delete Dialog */}
                <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus produk "{deleteDialog.product?.nama_produk}"? 
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
            </div>

            <Toaster />
        </AppLayout>
    );
}
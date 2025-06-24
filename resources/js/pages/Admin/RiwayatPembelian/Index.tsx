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
    CalendarDays,
    Clock,
    CreditCard,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    History,
    MoreHorizontal,
    Package,
    Receipt,
    Search,
    ShoppingCart,
    TrendingUp,
    X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Riwayat Pembelian',
        href: '/admin/riwayat-pembelian',
    },
];

interface Transaction {
    id: number;
    nomor_invoice: string;
    pelanggan: {
        id: number;
        kode: string;
        nama: string;
    } | null;
    kasir: {
        id: number;
        nama: string;
    };
    tanggal_penjualan: string;
    total_item: number;
    total_belanja: number;
    total_belanja_format: string;
    diskon_nominal: number;
    diskon_format: string;
    total_bayar: number;
    total_bayar_format: string;
    metode_pembayaran: string;
    status_transaksi: string;
    created_at: string;
}

interface Pelanggan {
    id: number;
    kode_pelanggan: string;
    nama_pelanggan: string;
}

interface Kasir {
    id: number;
    name: string;
}

interface Statistics {
    total_transaksi: number;
    total_pendapatan: number;
    total_pendapatan_format: string;
    transaksi_hari_ini: number;
    pendapatan_hari_ini: number;
    pendapatan_hari_ini_format: string;
    rata_rata_transaksi: number;
    rata_rata_transaksi_format: string;
}

interface Props {
    transactions: {
        data: Transaction[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    pelanggans: Pelanggan[];
    kasirs: Kasir[];
    filters: {
        search?: string;
        pelanggan_id?: string;
        kasir_id?: string;
        metode_pembayaran?: string;
        status_transaksi?: string;
        tanggal_mulai?: string;
        tanggal_akhir?: string;
    };
    statistics: Statistics;
}

export default function Index({ transactions, pelanggans, kasirs, filters, statistics }: Props) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    
    // Filter states
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [pelangganFilter, setPelangganFilter] = useState(filters.pelanggan_id || '');
    const [kasirFilter, setKasirFilter] = useState(filters.kasir_id || '');
    const [metodeFilter, setMetodeFilter] = useState(filters.metode_pembayaran || '');
    const [statusFilter, setStatusFilter] = useState(filters.status_transaksi || '');
    const [tanggalMulai, setTanggalMulai] = useState(filters.tanggal_mulai || '');
    const [tanggalAkhir, setTanggalAkhir] = useState(filters.tanggal_akhir || '');

    // Dropdown states
    const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});

    const handleDropdownOpenChange = (transactionId: number, open: boolean) => {
        setOpenDropdowns(prev => ({
            ...prev,
            [transactionId]: open
        }));
    };

    const columns: ColumnDef<Transaction>[] = useMemo(() => [
        {
            accessorKey: 'nomor_invoice',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 font-semibold"
                >
                    Invoice
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-mono text-sm font-medium">
                    {row.getValue('nomor_invoice')}
                </div>
            ),
        },
        {
            accessorKey: 'pelanggan',
            header: 'Pelanggan',
            cell: ({ row }) => {
                const pelanggan = row.original.pelanggan;
                return (
                    <div className="min-w-[150px]">
                        {pelanggan ? (
                            <div>
                                <div className="font-medium text-sm">{pelanggan.nama}</div>
                                <div className="text-xs text-muted-foreground">{pelanggan.kode}</div>
                            </div>
                        ) : (
                            <Badge variant="secondary" className="text-xs">
                                Walk-in Customer
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'kasir',
            header: 'Kasir',
            cell: ({ row }) => (
                <div className="min-w-[120px]">
                    <div className="font-medium text-sm">{row.original.kasir.nama}</div>
                </div>
            ),
        },
        {
            accessorKey: 'tanggal_penjualan',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 font-semibold"
                >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Tanggal
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-sm">
                    {row.getValue('tanggal_penjualan')}
                </div>
            ),
        },
        {
            accessorKey: 'total_item',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 font-semibold"
                >
                    <Package className="mr-2 h-4 w-4" />
                    Item
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-center font-medium">
                    {row.getValue('total_item')} item
                </div>
            ),
        },
        {
            accessorKey: 'total_bayar',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 font-semibold"
                >
                    Total Bayar
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-right">
                    <div className="font-semibold text-green-600">
                        {row.original.total_bayar_format}
                    </div>
                    {row.original.diskon_nominal > 0 && (
                        <div className="text-xs text-red-500">
                            Diskon: {row.original.diskon_format}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'metode_pembayaran',
            header: 'Pembayaran',
            cell: ({ row }) => {
                const metode = row.getValue('metode_pembayaran') as string;
                const getPaymentBadge = (method: string) => {
                    switch (method.toLowerCase()) {
                        case 'tunai':
                            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Tunai
                            </Badge>;
                        case 'debit':
                            return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Debit
                            </Badge>;
                        case 'kredit':
                            return <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Kredit
                            </Badge>;
                        case 'transfer':
                            return <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Transfer
                            </Badge>;
                        default:
                            return <Badge variant="outline">{method}</Badge>;
                    }
                };
                
                return getPaymentBadge(metode);
            },
        },
        {
            accessorKey: 'status_transaksi',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status_transaksi') as string;
                const getStatusBadge = (status: string) => {
                    switch (status.toLowerCase()) {
                        case 'selesai':
                            return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Selesai</Badge>;
                        case 'pending':
                            return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
                        case 'dibatalkan':
                            return <Badge variant="destructive">Dibatalkan</Badge>;
                        case 'void':
                            return <Badge variant="secondary">Void</Badge>;
                        default:
                            return <Badge variant="outline">{status}</Badge>;
                    }
                };
                
                return getStatusBadge(status);
            },
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const transaction = row.original;
                
                return (
                    <DropdownMenu 
                        open={openDropdowns[transaction.id] || false}
                        onOpenChange={(open) => handleDropdownOpenChange(transaction.id, open)}
                        modal={false}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                aria-label={`Aksi untuk transaksi ${transaction.nomor_invoice}`}
                            >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="end" 
                            className="w-48"
                            sideOffset={5}
                            onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <DropdownMenuLabel>Aksi Transaksi</DropdownMenuLabel>
                            <DropdownMenuItem 
                                onClick={() => {
                                    handleView(transaction.id);
                                    handleDropdownOpenChange(transaction.id, false);
                                }}
                                className="cursor-pointer"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => {
                                    handlePrint(transaction.id);
                                    handleDropdownOpenChange(transaction.id, false);
                                }}
                                className="cursor-pointer"
                            >
                                <Receipt className="mr-2 h-4 w-4" />
                                Print Struk
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => {
                                    handleDailyReport();
                                    handleDropdownOpenChange(transaction.id, false);
                                }}
                                className="cursor-pointer"
                            >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Laporan Harian
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [openDropdowns]);

    const table = useReactTable({
        data: transactions.data,
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

    const handleView = (id: number) => {
        router.visit(route('admin.riwayat-pembelian.show', id));
    };

    const handlePrint = (id: number) => {
        window.open(route('pos.print', id), '_blank');
    };

    const handleDailyReport = () => {
        router.visit(route('admin.riwayat-pembelian.daily-report'));
    };

    const handleMonthlyReport = () => {
        router.visit(route('admin.riwayat-pembelian.monthly-report'));
    };

    const handleExport = (exportType: string) => {
        const params = new URLSearchParams({
            export_type: exportType,
            search: searchValue,
            pelanggan_id: pelangganFilter,
            kasir_id: kasirFilter,
            metode_pembayaran: metodeFilter,
            status_transaksi: statusFilter,
            tanggal_mulai: tanggalMulai,
            tanggal_akhir: tanggalAkhir,
        });

        // Remove empty parameters
        for (const [key, value] of Array.from(params.entries())) {
            if (!value) {
                params.delete(key);
            }
        }

        window.open(route('admin.riwayat-pembelian.export') + '?' + params.toString(), '_blank');
        toast.success(`Export ${exportType} sedang diproses...`);
    };

    const handleExportCsv = () => {
        const params = new URLSearchParams({
            search: searchValue,
            pelanggan_id: pelangganFilter,
            kasir_id: kasirFilter,
            metode_pembayaran: metodeFilter,
            status_transaksi: statusFilter,
            tanggal_mulai: tanggalMulai,
            tanggal_akhir: tanggalAkhir,
        });

        // Remove empty parameters
        for (const [key, value] of Array.from(params.entries())) {
            if (!value) {
                params.delete(key);
            }
        }

        window.open(route('admin.riwayat-pembelian.export-csv') + '?' + params.toString(), '_blank');
        toast.success('Export CSV sedang diproses...');
    };

    const handleSearch = () => {
        router.get(route('admin.riwayat-pembelian.index'), {
            search: searchValue,
            pelanggan_id: pelangganFilter,
            kasir_id: kasirFilter,
            metode_pembayaran: metodeFilter,
            status_transaksi: statusFilter,
            tanggal_mulai: tanggalMulai,
            tanggal_akhir: tanggalAkhir,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchValue('');
        setPelangganFilter('');
        setKasirFilter('');
        setMetodeFilter('');
        setStatusFilter('');
        setTanggalMulai('');
        setTanggalAkhir('');
        router.get(route('admin.riwayat-pembelian.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Pembelian" />
            
            <div className="container mx-auto py-6 space-y-6 p-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                            <ShoppingCart className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_transaksi.toLocaleString()}</div>
                            <p className="text-xs opacity-80">Semua periode</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                            <TrendingUp className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_pendapatan_format}</div>
                            <p className="text-xs opacity-80">Dari semua transaksi</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
                            <CalendarDays className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.transaksi_hari_ini}</div>
                            <p className="text-xs opacity-80">{statistics.pendapatan_hari_ini_format}</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
                            <TrendingUp className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.rata_rata_transaksi_format}</div>
                            <p className="text-xs opacity-80">Per transaksi</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Riwayat Pembelian
                                </CardTitle>
                                <CardDescription>
                                    Kelola dan pantau semua transaksi penjualan
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={handleDailyReport} 
                                    variant="outline"
                                    className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                                >
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Laporan Harian
                                </Button>
                                <Button 
                                    onClick={handleMonthlyReport}
                                    variant="outline"
                                    className="bg-green-50 hover:bg-green-100 border-green-200"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Laporan Bulanan
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200">
                                            <Download className="mr-2 h-4 w-4" />
                                            Export Data
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Format Export</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleExport('summary')}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Excel - Ringkasan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('detailed')}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Excel - Detail Lengkap
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('items')}>
                                            <Package className="mr-2 h-4 w-4" />
                                            Excel - Detail Item
                                        </DropdownMenuItem>
                                        {/* <DropdownMenuItem onClick={() => handleExport('products')}>
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            Excel - Ringkasan Produk
                                        </DropdownMenuItem> */}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleExportCsv()}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            CSV Format
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                
                                <Badge variant="outline" className="text-sm">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Last updated: {new Date().toLocaleTimeString('id-ID')}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Advanced Filters */}
                        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Search */}
                                <div className="md:col-span-2">
                                    <Input
                                        placeholder="Cari invoice, pelanggan..."
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="bg-white"
                                    />
                                </div>
                                
                                {/* Date Range */}
                                <div>
                                    <Input
                                        type="date"
                                        placeholder="Tanggal Mulai"
                                        value={tanggalMulai}
                                        onChange={(e) => setTanggalMulai(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="date"
                                        placeholder="Tanggal Akhir"
                                        value={tanggalAkhir}
                                        onChange={(e) => setTanggalAkhir(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {/* Customer Filter */}
                                <select
                                    value={pelangganFilter}
                                    onChange={(e) => setPelangganFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                >
                                    <option value="">Semua Pelanggan</option>
                                    {pelanggans.map((pelanggan) => (
                                        <option key={pelanggan.id} value={pelanggan.id}>
                                            {pelanggan.kode_pelanggan} - {pelanggan.nama_pelanggan}
                                        </option>
                                    ))}
                                </select>

                                {/* Kasir Filter */}
                                <select
                                    value={kasirFilter}
                                    onChange={(e) => setKasirFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                >
                                    <option value="">Semua Kasir</option>
                                    {kasirs.map((kasir) => (
                                        <option key={kasir.id} value={kasir.id}>
                                            {kasir.name}
                                        </option>
                                    ))}
                                </select>

                                {/* Payment Method Filter */}
                                <select
                                    value={metodeFilter}
                                    onChange={(e) => setMetodeFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                >
                                    <option value="">Semua Metode</option>
                                    <option value="tunai">Tunai</option>
                                    <option value="debit">Debit</option>
                                    <option value="kredit">Kredit</option>
                                    <option value="transfer">Transfer</option>
                                </select>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="selesai">Selesai</option>
                                    <option value="pending">Pending</option>
                                    <option value="dibatalkan">Dibatalkan</option>
                                    <option value="void">Void</option>
                                </select>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 flex-1">
                                        <Search className="mr-2 h-4 w-4" />
                                        Cari
                                    </Button>
                                    <Button variant="outline" onClick={clearFilters}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
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
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleView(row.original.id)}
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
                                                    <History className="h-8 w-8 text-gray-400" />
                                                    <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
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
                                Menampilkan {transactions.data.length} dari {transactions.total} transaksi
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
            </div>

            <Toaster />
        </AppLayout>
    );
}
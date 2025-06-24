import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Calendar,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Package,
    RefreshCw,
    ShoppingCart,
    Target,
    TrendingUp,
    Users
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Penjualan',
        href: '/admin/laporan',
    },
];

interface Statistics {
    total_revenue: number;
    total_revenue_format: string;
    total_transactions: number;
    total_items: number;
    avg_transaction_value: number;
    avg_transaction_value_format: string;
    avg_items_per_transaction: number;
}

interface DailyTrend {
    date: string;
    date_formatted: string;
    day_name: string;
    total_transactions: number;
    total_revenue: number;
    total_revenue_format: string;
    avg_transaction_value: number;
    avg_transaction_value_format: string;
}

interface TopProduct {
    rank: number;
    kode: string;
    nama: string;
    kategori: string;
    total_sold: number;
    total_revenue: number;
    total_revenue_format: string;
    total_transactions: number;
    avg_qty_per_transaction: number;
}

interface TopCustomer {
    rank: number;
    id: number;
    kode: string;
    nama: string;
    jenis: string;
    total_transactions: number;
    total_spent: number;
    total_spent_format: string;
    avg_transaction_value: number;
    avg_transaction_value_format: string;
    last_transaction: string;
}

interface PaymentBreakdown {
    method: string;
    total_transactions: number;
    total_amount: number;
    total_amount_format: string;
    avg_amount: number;
    avg_amount_format: string;
}

interface HourlySales {
    hour: number;
    hour_formatted: string;
    total_transactions: number;
    total_revenue: number;
    total_revenue_format: string;
    avg_transaction_value: number;
    avg_transaction_value_format: string;
}

interface CashierPerformance {
    rank: number;
    id: number;
    name: string;
    email: string;
    total_transactions: number;
    total_revenue: number;
    total_revenue_format: string;
    avg_transaction_value: number;
    avg_transaction_value_format: string;
}

interface Props {
    statistics: Statistics;
    dailyTrend: DailyTrend[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    paymentBreakdown: PaymentBreakdown[];
    hourlySales: HourlySales[];
    cashierPerformance: CashierPerformance[];
    dateRange: {
        start_date: string;
        end_date: string;
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Index({
    statistics,
    dailyTrend,
    topProducts,
    topCustomers,
    paymentBreakdown,
    hourlySales,
    cashierPerformance,
    dateRange,
}: Props) {
    const [startDate, setStartDate] = useState(dateRange.start_date);
    const [endDate, setEndDate] = useState(dateRange.end_date);
    const [isLoading, setIsLoading] = useState(false);

    const handleDateFilter = () => {
        setIsLoading(true);
        router.get(route('admin.laporan.index'), {
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const handleRefresh = () => {
        setIsLoading(true);
        router.reload({
            onFinish: () => setIsLoading(false),
        });
    };

    const handleExport = (type: string, format: string) => {
        const params = new URLSearchParams({
            type: type,
            format: format,
            start_date: dateRange.start_date,
            end_date: dateRange.end_date,
        });

        // Remove empty parameters
        for (const [key, value] of Array.from(params.entries())) {
            if (!value) {
                params.delete(key);
            }
        }

        // Create a temporary link element for download
        const link = document.createElement('a');
        link.href = route('admin.laporan-penjualan.export') + '?' + params.toString();
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Export ${type} ${format.toUpperCase()} sedang diproses...`);
    };

    const handleDailyReport = () => {
        router.visit(route('admin.laporan.daily'));
    };

    const handleMonthlyReport = () => {
        router.visit(route('admin.laporan.monthly'));
    };

    const handleProductReport = () => {
        router.visit(route('admin.laporan.product'));
    };

    const handleCustomerReport = () => {
        router.visit(route('admin.laporan.customer'));
    };

    // Chart data formatting
    const salesTrendData = useMemo(() => {
        return dailyTrend.map(item => ({
            date: item.date_formatted,
            revenue: item.total_revenue,
            transactions: item.total_transactions,
            avg_value: item.avg_transaction_value,
        }));
    }, [dailyTrend]);

    const hourlyData = useMemo(() => {
        return hourlySales.map(item => ({
            hour: item.hour_formatted,
            transactions: item.total_transactions,
            revenue: item.total_revenue,
        }));
    }, [hourlySales]);

    const paymentData = useMemo(() => {
        return paymentBreakdown.map((item, index) => ({
            name: item.method,
            value: item.total_amount,
            transactions: item.total_transactions,
            fill: COLORS[index % COLORS.length],
        }));
    }, [paymentBreakdown]);

    const getPaymentIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'tunai':
                return '💵';
            case 'debit':
                return '💳';
            case 'kredit':
                return '💳';
            case 'transfer':
                return '🏦';
            default:
                return '💰';
        }
    };

    const getCustomerTypeBadge = (type: string) => {
        switch (type.toLowerCase()) {
            case 'vip':
                return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">VIP</Badge>;
            case 'member':
                return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Member</Badge>;
            case 'reguler':
                return <Badge variant="outline">Reguler</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Penjualan" />
            
            <div className="container mx-auto py-6 space-y-6 p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard Laporan Penjualan</h1>
                        <p className="text-gray-600 mt-1">
                            Analisis komprehensif performa penjualan dan bisnis
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={handleRefresh} 
                            variant="outline"
                            disabled={isLoading}
                            className="bg-gray-50 hover:bg-gray-100"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Laporan
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel>Pilih Jenis Export</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem onClick={() => handleExport('overview', 'excel')}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Excel - Ringkasan Overview
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem onClick={() => handleExport('daily', 'excel')}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Excel - Trend Harian
                                    </DropdownMenuItem>
                                    
                                    {/* <DropdownMenuItem onClick={() => handleExport('product', 'excel')}>
                                        <Package className="mr-2 h-4 w-4" />
                                        Excel - Performa Produk
                                    </DropdownMenuItem> */}
                                    
                                    <DropdownMenuItem onClick={() => handleExport('customer', 'excel')}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Excel - Analisis Pelanggan
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuSeparator />
                                    
                                    {/* <DropdownMenuItem onClick={() => handleExport('complete', 'excel')}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Excel - Laporan Lengkap (All Sheets)
                                    </DropdownMenuItem> */}
                                    
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem onClick={() => handleExport('overview', 'csv')}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        CSV Format
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Date Filter Section */}
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter Periode
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-40"
                                />
                            </div>
                            <span className="text-gray-500">sampai</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-40"
                                />
                            </div>
                            <Button 
                                onClick={handleDateFilter}
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Terapkan Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Total Pendapatan</CardTitle>
                            <DollarSign className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_revenue_format}</div>
                            <p className="text-xs opacity-80 mt-1">
                                Dari {statistics.total_transactions.toLocaleString()} transaksi
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Total Transaksi</CardTitle>
                            <ShoppingCart className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_transactions.toLocaleString()}</div>
                            <p className="text-xs opacity-80 mt-1">
                                {statistics.total_items.toLocaleString()} item terjual
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Rata-rata Transaksi</CardTitle>
                            <Target className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.avg_transaction_value_format}</div>
                            <p className="text-xs opacity-80 mt-1">
                                {statistics.avg_items_per_transaction.toFixed(1)} item per transaksi
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Total Item</CardTitle>
                            <Package className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_items.toLocaleString()}</div>
                            <p className="text-xs opacity-80 mt-1">
                                Item yang terjual
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button 
                        onClick={handleDailyReport}
                        variant="outline" 
                        className="h-16 bg-blue-50 hover:bg-blue-100 border-blue-200 flex flex-col gap-1"
                    >
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-700">Laporan Harian</span>
                    </Button>
                    <Button 
                        onClick={handleMonthlyReport}
                        variant="outline" 
                        className="h-16 bg-green-50 hover:bg-green-100 border-green-200 flex flex-col gap-1"
                    >
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700">Laporan Bulanan</span>
                    </Button>
                    <Button 
                        onClick={handleProductReport}
                        variant="outline" 
                        className="h-16 bg-purple-50 hover:bg-purple-100 border-purple-200 flex flex-col gap-1"
                    >
                        <Package className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-700">Analisis Produk</span>
                    </Button>
                    <Button 
                        onClick={handleCustomerReport}
                        variant="outline" 
                        className="h-16 bg-orange-50 hover:bg-orange-100 border-orange-200 flex flex-col gap-1"
                    >
                        <Users className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-700">Analisis Pelanggan</span>
                    </Button>
                </div> */}

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Trend Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Trend Penjualan Harian
                            </CardTitle>
                            <CardDescription>
                                Grafik pendapatan dan jumlah transaksi dalam periode yang dipilih
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="date" 
                                            fontSize={12}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis fontSize={12} />
                                        <Tooltip 
                                            formatter={(value, name) => [
                                                name === 'revenue' ? `Rp ${value.toLocaleString()}` : value,
                                                name === 'revenue' ? 'Pendapatan' : 'Transaksi'
                                            ]}
                                        />
                                        <Legend />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stackId="1"
                                            stroke="#3B82F6" 
                                            fill="#3B82F6" 
                                            fillOpacity={0.6}
                                            name="Pendapatan"
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="transactions" 
                                            stackId="2"
                                            stroke="#10B981" 
                                            fill="#10B981" 
                                            fillOpacity={0.6}
                                            name="Transaksi"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hourly Sales Pattern */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Pola Penjualan Per Jam
                            </CardTitle>
                            <CardDescription>
                                Distribusi transaksi berdasarkan jam operasional
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" fontSize={12} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="transactions" fill="#3B82F6" name="Transaksi" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Methods Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Metode Pembayaran
                            </CardTitle>
                            <CardDescription>
                                Distribusi pendapatan berdasarkan metode pembayaran
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {paymentBreakdown.map((method, index) => (
                                    <div key={method.method} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span>{getPaymentIcon(method.method)} {method.method}</span>
                                        </div>
                                        <span className="font-medium">{method.total_amount_format}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Tables */}
                <Tabs defaultValue="products" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="products">Top Produk</TabsTrigger>
                        <TabsTrigger value="customers">Top Pelanggan</TabsTrigger>
                        <TabsTrigger value="cashiers">Performa Kasir</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="products" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Produk Terlaris
                                </CardTitle>
                                <CardDescription>
                                    Daftar produk dengan penjualan terbaik dalam periode ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead className="text-center">Qty Terjual</TableHead>
                                                <TableHead className="text-right">Total Pendapatan</TableHead>
                                                <TableHead className="text-center">Transaksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {topProducts.map((product) => (
                                                <TableRow key={product.rank} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center justify-center">
                                                            {product.rank <= 3 ? (
                                                                <span className="text-lg">
                                                                    {product.rank === 1 ? '🥇' : product.rank === 2 ? '🥈' : '🥉'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500">#{product.rank}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{product.nama}</div>
                                                            <div className="text-sm text-muted-foreground">{product.kode}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{product.kategori}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {product.total_sold.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-green-600">
                                                        {product.total_revenue_format}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {product.total_transactions}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="customers" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Pelanggan Terbaik
                                </CardTitle>
                                <CardDescription>
                                    Daftar pelanggan dengan total pembelian tertinggi
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Pelanggan</TableHead>
                                                <TableHead>Jenis</TableHead>
                                                <TableHead className="text-center">Transaksi</TableHead>
                                                <TableHead className="text-right">Total Belanja</TableHead>
                                                <TableHead className="text-right">Rata-rata</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {topCustomers.map((customer) => (
                                                <TableRow key={customer.rank} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center justify-center">
                                                            {customer.rank <= 3 ? (
                                                                <span className="text-lg">
                                                                    {customer.rank === 1 ? '🥇' : customer.rank === 2 ? '🥈' : '🥉'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500">#{customer.rank}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{customer.nama}</div>
                                                            <div className="text-sm text-muted-foreground">{customer.kode}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getCustomerTypeBadge(customer.jenis)}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {customer.total_transactions}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-green-600">
                                                        {customer.total_spent_format}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {customer.avg_transaction_value_format}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="cashiers" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Performa Kasir
                                </CardTitle>
                                <CardDescription>
                                    Evaluasi kinerja kasir berdasarkan transaksi dan pendapatan
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Kasir</TableHead>
                                                <TableHead className="text-center">Transaksi</TableHead>
                                                <TableHead className="text-right">Total Pendapatan</TableHead>
                                                <TableHead className="text-right">Rata-rata</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cashierPerformance.map((cashier) => (
                                                <TableRow key={cashier.rank} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center justify-center">
                                                            {cashier.rank <= 3 ? (
                                                                <span className="text-lg">
                                                                    {cashier.rank === 1 ? '🥇' : cashier.rank === 2 ? '🥈' : '🥉'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500">#{cashier.rank}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{cashier.name}</div>
                                                            <div className="text-sm text-muted-foreground">{cashier.email}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {cashier.total_transactions.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-green-600">
                                                        {cashier.total_revenue_format}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {cashier.avg_transaction_value_format}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Calendar,
    CreditCard,
    DollarSign,
    Package,
    ShoppingCart,
    Star,
    TrendingDown,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    userRole: string;
    statistics?: {
        total_products: number;
        total_customers: number;
        total_suppliers: number;
        low_stock_products: number;
    };
    salesStats?: {
        today_sales: number;
        yesterday_sales: number;
        month_sales: number;
        year_sales: number;
        today_transactions: number;
        month_transactions: number;
        growth: number;
    };
    kasirStats?: {
        today_sales: number;
        today_transactions: number;
        month_sales: number;
        month_transactions: number;
    };
    recentTransactions: Array<{
        id: number;
        kode_transaksi: string;
        tanggal: string;
        total_harga: number;
        kasir?: string;
        jumlah_item: number;
    }>;
    topProducts: Array<{
        nama_produk: string;
        kode_produk: string;
        total_sold: number;
        total_revenue: number;
        harga_jual: number;
    }>;
    lowStockProducts: Array<{
        id: number;
        nama_produk: string;
        kode_produk: string;
        stok_tersedia: number;
        stok_minimum: number;
        kategori: string;
    }>;
    topCustomers: Array<{
        nama_pelanggan: string;
        email: string;
        total_transactions: number;
        total_spent: number;
    }>;
    activeRecommendations: Array<{
        produk_utama: string;
        produk_rekomendasi: string;
        skor_rekomendasi: number;
        frekuensi_bersamaan: number;
    }>;
    quickProducts?: Array<{
        id: number;
        nama_produk: string;
        kode_produk: string;
        harga_jual: number;
        stok_tersedia: number;
        frequency: number;
    }>;
    charts: {
        daily_sales?: Array<{
            date: string;
            sales: number;
            day: string;
        }>;
        monthly_sales?: Array<{
            month: string;
            sales: number;
        }>;
        performance?: Array<{
            date: string;
            sales: number;
            transactions: number;
            day: string;
        }>;
    };
}

export default function Dashboard({
    userRole,
    statistics,
    salesStats,
    kasirStats,
    recentTransactions = [],
    topProducts = [],
    lowStockProducts = [],
    topCustomers = [],
    activeRecommendations = [],
    quickProducts = [],
    charts,
}: DashboardProps) {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const getGrowthColor = (growth: number) => {
        if (growth > 0) return 'text-green-600';
        if (growth < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getGrowthIcon = (growth: number) => {
        if (growth > 0) return <TrendingUp className="h-4 w-4" />;
        if (growth < 0) return <TrendingDown className="h-4 w-4" />;
        return <Activity className="h-4 w-4" />;
    };

    const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

    if (userRole === 'admin') {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard Admin" />
                
                <div className="container mx-auto py-6 space-y-6 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                            <p className="text-gray-600 mt-1">
                                Selamat datang! Berikut adalah ringkasan bisnis Anda hari ini.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date().toLocaleDateString('id-ID', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </Badge>
                        </div>
                    </div>

                    {/* Main Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Penjualan Hari Ini</CardTitle>
                                <DollarSign className="h-4 w-4 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(salesStats?.today_sales || 0)}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`flex items-center text-xs ${getGrowthColor(salesStats?.growth || 0)}`}>
                                        {getGrowthIcon(salesStats?.growth || 0)}
                                        <span className="ml-1">
                                            {salesStats?.growth ? Math.abs(salesStats.growth).toFixed(1) : '0'}%
                                        </span>
                                    </div>
                                    <span className="text-xs opacity-80">vs kemarin</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Transaksi Hari Ini</CardTitle>
                                <ShoppingCart className="h-4 w-4 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{salesStats?.today_transactions || 0}</div>
                                <p className="text-xs opacity-80 mt-1">
                                    {salesStats?.month_transactions || 0} transaksi bulan ini
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Total Produk</CardTitle>
                                <Package className="h-4 w-4 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(statistics?.total_products || 0)}</div>
                                <p className="text-xs opacity-80 mt-1">
                                    {statistics?.low_stock_products || 0} stok menipis
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Total Pelanggan</CardTitle>
                                <Users className="h-4 w-4 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(statistics?.total_customers || 0)}</div>
                                <p className="text-xs opacity-80 mt-1">
                                    {statistics?.total_suppliers || 0} supplier aktif
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Sales Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Penjualan 7 Hari Terakhir
                                </CardTitle>
                                <CardDescription>
                                    Trend penjualan harian dalam seminggu terakhir
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={charts?.daily_sales || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                            <Tooltip 
                                                formatter={(value: number) => [formatCurrency(value), 'Penjualan']}
                                                labelFormatter={(label) => `Tanggal: ${label}`}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="sales" 
                                                stroke="#3B82F6" 
                                                strokeWidth={3}
                                                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Monthly Sales Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Penjualan 6 Bulan Terakhir
                                </CardTitle>
                                <CardDescription>
                                    Perbandingan penjualan bulanan
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={charts?.monthly_sales || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                            <Tooltip 
                                                formatter={(value: number) => [formatCurrency(value), 'Penjualan']}
                                            />
                                            <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Transactions */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Transaksi Terbaru
                                </CardTitle>
                                <CardDescription>
                                    10 transaksi terakhir yang berhasil
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{transaction.kode_transaksi}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {transaction.tanggal} • {transaction.kasir}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">
                                                    {formatCurrency(transaction.total_harga)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {transaction.jumlah_item} item
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Belum ada transaksi hari ini
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Low Stock Alert */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    Stok Menipis
                                </CardTitle>
                                <CardDescription>
                                    Produk yang perlu segera direstok
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
                                        <div key={product.id} className="flex items-center justify-between p-2 border rounded border-orange-200 bg-orange-50">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{product.nama_produk}</div>
                                                <div className="text-xs text-gray-600">{product.kode_produk}</div>
                                                <Badge variant="outline" className="text-xs mt-1">
                                                    {product.kategori}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-orange-600">
                                                    {product.stok_tersedia}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Min: {product.stok_minimum}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-4 text-gray-500">
                                            Semua produk stok aman
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5" />
                                    Produk Terlaris Bulan Ini
                                </CardTitle>
                                <CardDescription>
                                    5 produk dengan penjualan tertinggi
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topProducts.length > 0 ? topProducts.map((product, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{product.nama_produk}</div>
                                                <div className="text-sm text-gray-600">{product.kode_produk}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">
                                                    {formatCurrency(product.total_revenue)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatNumber(product.total_sold)} terjual
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-4 text-gray-500">
                                            Belum ada data penjualan
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Customers */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Pelanggan Teratas
                                </CardTitle>
                                <CardDescription>
                                    Pelanggan dengan pembelian tertinggi bulan ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topCustomers.length > 0 ? topCustomers.map((customer, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-white font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{customer.nama_pelanggan}</div>
                                                <div className="text-sm text-gray-600">{customer.email}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-blue-600">
                                                    {formatCurrency(customer.total_spent)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {customer.total_transactions} transaksi
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-4 text-gray-500">
                                            Belum ada data pelanggan
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Recommendations */}
                    {activeRecommendations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-purple-500" />
                                    Rekomendasi AI Produk
                                </CardTitle>
                                <CardDescription>
                                    Rekomendasi produk berdasarkan algoritma Apriori
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activeRecommendations.map((rec, index) => (
                                        <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium text-sm">{rec.produk_utama}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-medium text-sm text-blue-600">{rec.produk_rekomendasi}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                                                    {rec.skor_rekomendasi}% confidence
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {rec.frekuensi_bersamaan} kali bersamaan
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </AppLayout>
        );
    }

    if (userRole === 'kasir') {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard Kasir" />
                
                <div className="container mx-auto py-6 space-y-6 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard Kasir</h1>
                            <p className="text-gray-600 mt-1">
                                Selamat bekerja! Berikut adalah ringkasan kinerja Anda hari ini.
                            </p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Activity className="mr-1 h-3 w-3" />
                            Kasir Aktif
                        </Badge>
                    </div>

                    {/* Kasir Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Penjualan Hari Ini</CardTitle>
                                <DollarSign className="h-4 w-4 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(kasirStats?.today_sales || 0)}</div>
                                <p className="text-xs opacity-80 mt-1">
                                    Target harian tercapai
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Transaksi Hari Ini</CardTitle>
                                <ShoppingCart className="h-4 w-4 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kasirStats?.today_transactions || 0}</div>
                                <p className="text-xs opacity-80 mt-1">
                                    Transaksi berhasil
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Penjualan Bulan Ini</CardTitle>
                                <BarChart3 className="h-4 w-4 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(kasirStats?.month_sales || 0)}</div>
                                <p className="text-xs opacity-80 mt-1">
                                    {kasirStats?.month_transactions || 0} transaksi total
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Rata-rata per Transaksi</CardTitle>
                                <Activity className="h-4 w-4 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {kasirStats?.today_transactions 
                                        ? formatCurrency((kasirStats.today_sales || 0) / kasirStats.today_transactions)
                                        : formatCurrency(0)
                                    }
                                </div>
                                <p className="text-xs opacity-80 mt-1">
                                    Per transaksi hari ini
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Kinerja 7 Hari Terakhir
                            </CardTitle>
                            <CardDescription>
                                Penjualan dan transaksi harian Anda
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts?.performance || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip 
                                            formatter={(value: number, name: string) => [
                                                name === 'sales' ? formatCurrency(value) : value,
                                                name === 'sales' ? 'Penjualan' : 'Transaksi'
                                            ]}
                                            labelFormatter={(label) => `Tanggal: ${label}`}
                                        />
                                        <Legend />
                                        <Line 
                                            yAxisId="left"
                                            type="monotone" 
                                            dataKey="sales" 
                                            stroke="#3B82F6" 
                                            strokeWidth={3}
                                            name="Penjualan"
                                        />
                                        <Line 
                                            yAxisId="right"
                                            type="monotone" 
                                            dataKey="transactions" 
                                            stroke="#10B981" 
                                            strokeWidth={3}
                                            name="Transaksi"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Transactions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Transaksi Terbaru Saya
                                </CardTitle>
                                <CardDescription>
                                    10 transaksi terakhir yang Anda lakukan
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <ShoppingCart className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{transaction.kode_transaksi}</div>
                                                    <div className="text-sm text-gray-600">{transaction.tanggal}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">
                                                    {formatCurrency(transaction.total_harga)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {transaction.jumlah_item} item
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Belum ada transaksi hari ini
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Access Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Produk Favorit Saya
                                </CardTitle>
                                <CardDescription>
                                    Produk yang sering Anda jual
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {quickProducts.length > 0 ? quickProducts.map((product) => (
                                        <div 
                                            key={product.id} 
                                            className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                                            onClick={() => router.visit(route('pos.index'))}
                                        >
                                            <div className="font-medium text-sm">{product.nama_produk}</div>
                                            <div className="text-xs text-gray-600 mb-2">{product.kode_produk}</div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-bold text-blue-600">
                                                    {formatCurrency(product.harga_jual)}
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    Stok: {product.stok_tersedia}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {product.frequency}x terjual
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-2 text-center py-4 text-gray-500">
                                            Belum ada data produk favorit
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Default dashboard for other roles
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="text-center py-8">
                    <h1 className="text-2xl font-bold text-gray-900">Selamat Datang</h1>
                    <p className="text-gray-600 mt-2">
                        Sistem Point of Sale SISKA
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

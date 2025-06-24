import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AprioriInfo, InfoTooltip } from '@/components/ui/info-tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Head, router, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    BarChart3,
    Bot,
    Brain,
    CheckCircle,
    Clock,
    Eye,
    Filter,
    GitBranch,
    Lightbulb,
    Package,
    RefreshCw,
    Search,
    Star,
    Target,
    TrendingUp,
    Users,
    XCircle,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Rekomendasi Produk',
        href: '/admin/rekomendasi',
    },
];

interface Statistics {
    total_rekomendasi: number;
    rekomendasi_aktif: number;
    rekomendasi_nonaktif: number;
    rata_rata_skor: number;
    rata_rata_skor_percent: number;
    analisis_recent: number;
}

interface TopRekomendasi {
    rank: number;
    produk_utama: string;
    produk_rekomendasi: string;
    skor_rekomendasi: number;
    skor_rekomendasi_percent: number;
    frekuensi_bersamaan: number;
}

interface RecentAnalysis {
    id: number;
    jenis_analisis: string;
    tanggal_analisis: string;
    periode: string;
    total_transaksi: number;
}

interface Category {
    id: number;
    nama_kategori: string;
}

interface Rekomendasi {
    id: number;
    produk_utama: {
        id: number;
        kode_produk: string;
        nama_produk: string;
        kategori?: {
            nama_kategori: string;
        };
    };
    produk_rekomendasi: {
        id: number;
        kode_produk: string;
        nama_produk: string;
        kategori?: {
            nama_kategori: string;
        };
    };
    skor_rekomendasi: number;
    frekuensi_bersamaan: number;
    tanggal_analisis: string;
    status_aktif: boolean;
    keterangan?: string;
}

interface Props {
    rekomendasi: {
        data: Rekomendasi[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    statistics: Statistics;
    topRekomendasi: TopRekomendasi[];
    categories: Category[];
    recentAnalysis: RecentAnalysis[];
    filters: {
        search?: string;
        kategori_id?: number;
        status_aktif?: boolean;
    };
}

export default function Index({
    rekomendasi,
    statistics,
    topRekomendasi,
    categories,
    recentAnalysis,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [kategoriId, setKategoriId] = useState(filters.kategori_id?.toString() || 'all');
    const [statusAktif, setStatusAktif] = useState(filters.status_aktif?.toString() || 'all');
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        periode_awal: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periode_akhir: new Date().toISOString().split('T')[0],
        min_support: 0.05,
        min_confidence: 0.3,
        kategori_id: 'all',
    });

    const handleFilter = () => {
        router.get(route('admin.rekomendasi.index'), {
            search: search || undefined,
            kategori_id: kategoriId === 'all' ? undefined : kategoriId,
            status_aktif: statusAktif === 'all' ? undefined : statusAktif,
        }, {
            preserveState: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setKategoriId('all');
        setStatusAktif('all');
        router.get(route('admin.rekomendasi.index'));
    };

    const handleGenerateRekomendasi = () => {
        const submitData = {
            ...data,
            kategori_id: data.kategori_id === 'all' ? '' : data.kategori_id,
        };

        post(route('admin.rekomendasi.generate'), {
            data: submitData,
            onSuccess: () => {
                setIsGenerateDialogOpen(false);
                reset();
                toast.success('Rekomendasi berhasil di-generate menggunakan algoritma Apriori!');
            },
            onError: () => {
                toast.error('Gagal generate rekomendasi. Silakan coba lagi.');
            },
        });
    };

    const handleViewAprioriAnalysis = () => {
        router.visit(route('admin.rekomendasi.apriori'));
    };

    const handleViewDetail = (id: number) => {
        router.visit(route('admin.rekomendasi.show', id));
    };

    const getScoreColor = (skor: number) => {
        if (skor >= 0.8) return 'text-green-600 bg-green-100';
        if (skor >= 0.6) return 'text-blue-600 bg-blue-100';
        if (skor >= 0.4) return 'text-yellow-600 bg-yellow-100';
        if (skor >= 0.2) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    const getScoreLabel = (skor: number) => {
        if (skor >= 0.8) return 'Sangat Tinggi';
        if (skor >= 0.6) return 'Tinggi';
        if (skor >= 0.4) return 'Sedang';
        if (skor >= 0.2) return 'Rendah';
        return 'Sangat Rendah';
    };

    const getAnalysisTypeIcon = (type: string) => {
        switch (type) {
            case 'frequent_itemset':
                return <BarChart3 className="h-4 w-4" />;
            case 'association_rule':
                return <GitBranch className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    const getAnalysisTypeName = (type: string) => {
        switch (type) {
            case 'frequent_itemset':
                return 'Frequent Itemset';
            case 'association_rule':
                return 'Association Rule';
            default:
                return type;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekomendasi Produk" />
            
            <div className="container mx-auto py-6 space-y-6 p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            Rekomendasi Produk
                            <AprioriInfo type="apriori_algorithm" variant="primary" />
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Sistem rekomendasi cerdas menggunakan algoritma Apriori untuk analisis market basket
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={handleViewAprioriAnalysis}
                            variant="outline"
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:from-indigo-100 hover:to-purple-100"
                        >
                            <BarChart3 className="mr-2 h-4 w-4 text-indigo-600" />
                            Analisis Apriori
                        </Button>
                        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                                    <Bot className="mr-2 h-4 w-4" />
                                    Generate Rekomendasi
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-purple-600" />
                                        Generate Rekomendasi dengan Apriori
                                    </DialogTitle>
                                    <DialogDescription>
                                        Konfigurasikan parameter untuk menjalankan algoritma Apriori dan menghasilkan rekomendasi produk baru.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="periode_awal">Periode Awal</Label>
                                            <Input
                                                id="periode_awal"
                                                type="date"
                                                value={data.periode_awal}
                                                onChange={(e) => setData('periode_awal', e.target.value)}
                                                className="mt-1"
                                            />
                                            {errors.periode_awal && (
                                                <p className="text-sm text-red-600 mt-1">{errors.periode_awal}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="periode_akhir">Periode Akhir</Label>
                                            <Input
                                                id="periode_akhir"
                                                type="date"
                                                value={data.periode_akhir}
                                                onChange={(e) => setData('periode_akhir', e.target.value)}
                                                className="mt-1"
                                            />
                                            {errors.periode_akhir && (
                                                <p className="text-sm text-red-600 mt-1">{errors.periode_akhir}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="min_support" className="flex items-center gap-1">
                                                Minimum Support
                                                <AprioriInfo type="support" variant="primary" />
                                            </Label>
                                            <Input
                                                id="min_support"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max="1"
                                                value={data.min_support}
                                                onChange={(e) => setData('min_support', parseFloat(e.target.value))}
                                                className="mt-1"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Nilai antara 0.01 - 1.0 (5% = 0.05)</p>
                                            {errors.min_support && (
                                                <p className="text-sm text-red-600 mt-1">{errors.min_support}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="min_confidence" className="flex items-center gap-1">
                                                Minimum Confidence
                                                <AprioriInfo type="confidence" variant="primary" />
                                            </Label>
                                            <Input
                                                id="min_confidence"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max="1"
                                                value={data.min_confidence}
                                                onChange={(e) => setData('min_confidence', parseFloat(e.target.value))}
                                                className="mt-1"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Nilai antara 0.01 - 1.0 (30% = 0.3)</p>
                                            {errors.min_confidence && (
                                                <p className="text-sm text-red-600 mt-1">{errors.min_confidence}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="kategori_id">Filter Kategori (Opsional)</Label>
                                        <Select value={data.kategori_id} onValueChange={(value) => setData('kategori_id', value)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Pilih kategori..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Kategori</SelectItem>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        {category.nama_kategori}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsGenerateDialogOpen(false)}
                                        disabled={processing}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleGenerateRekomendasi}
                                        disabled={processing}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="mr-2 h-4 w-4" />
                                                Generate
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-1">
                                Total Rekomendasi
                                <InfoTooltip 
                                    title="Total Rekomendasi"
                                    content="Jumlah keseluruhan rekomendasi produk yang dihasilkan dari analisis algoritma Apriori berdasarkan data transaksi historis."
                                    variant="default"
                                />
                            </CardTitle>
                            <Target className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_rekomendasi.toLocaleString()}</div>
                            <div className="flex items-center gap-4 mt-2 text-xs opacity-80">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    {statistics.rekomendasi_aktif} aktif
                                </span>
                                <span className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    {statistics.rekomendasi_nonaktif} nonaktif
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-1">
                                Rata-rata Skor
                                <InfoTooltip 
                                    title="Rata-rata Skor Confidence"
                                    content="Nilai rata-rata confidence dari semua rekomendasi. Semakin tinggi skor, semakin akurat prediksi pembelian produk rekomendasi."
                                    variant="default"
                                />
                            </CardTitle>
                            <Star className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.rata_rata_skor_percent}%</div>
                            <p className="text-xs opacity-80 mt-1">
                                Confidence score rata-rata dari semua rekomendasi
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Analisis Terbaru</CardTitle>
                            <Clock className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.analisis_recent}</div>
                            <p className="text-xs opacity-80 mt-1">
                                Rekomendasi dalam 7 hari terakhir
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Section */}
                <Card className="shadow-sm border-l-4 border-l-purple-500">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter & Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="search">Cari Produk</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="search"
                                        placeholder="Nama atau kode produk..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Kategori</Label>
                                <Select value={kategoriId} onValueChange={setKategoriId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Pilih kategori..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Kategori</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.nama_kategori}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select value={statusAktif} onValueChange={setStatusAktif}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Pilih status..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="true">Aktif</SelectItem>
                                        <SelectItem value="false">Nonaktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} className="flex-1 bg-purple-600 hover:bg-purple-700">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>
                                <Button onClick={handleReset} variant="outline">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Tabs */}
                <Tabs defaultValue="rekomendasi" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="rekomendasi" className="flex items-center gap-1">
                            Daftar Rekomendasi
                            <AprioriInfo type="association_rule" variant="primary" />
                        </TabsTrigger>
                        <TabsTrigger value="top">Top Rekomendasi</TabsTrigger>
                        <TabsTrigger value="analisis">Riwayat Analisis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="rekomendasi" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5" />
                                    Daftar Rekomendasi Produk
                                </CardTitle>
                                <CardDescription>
                                    Rekomendasi produk yang dihasilkan dari analisis algoritma Apriori
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead>Produk Utama</TableHead>
                                                <TableHead>Produk Rekomendasi</TableHead>
                                                <TableHead className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        Skor Confidence
                                                        <AprioriInfo type="confidence" variant="primary" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        Frekuensi
                                                        <InfoTooltip 
                                                            title="Frekuensi Bersamaan"
                                                            content="Jumlah transaksi dimana kedua produk dibeli bersamaan. Semakin tinggi frekuensi, semakin kuat hubungan antar produk."
                                                            variant="primary"
                                                        />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-center">Tanggal Analisis</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rekomendasi.data.length > 0 ? rekomendasi.data.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-gray-50">
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.produk_utama.nama_produk}</div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                {item.produk_utama.kode_produk}
                                                                {item.produk_utama.kategori && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {item.produk_utama.kategori.nama_kategori}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <ArrowRight className="h-4 w-4 text-gray-400" />
                                                            <div>
                                                                <div className="font-medium">{item.produk_rekomendasi.nama_produk}</div>
                                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                    {item.produk_rekomendasi.kode_produk}
                                                                    {item.produk_rekomendasi.kategori && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {item.produk_rekomendasi.kategori.nama_kategori}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getScoreColor(item.skor_rekomendasi)}`}>
                                                            {(item.skor_rekomendasi * 100).toFixed(1)}%
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {getScoreLabel(item.skor_rekomendasi)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {item.frekuensi_bersamaan}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item.status_aktif ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">
                                                                <XCircle className="mr-1 h-3 w-3" />
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm">
                                                        {item.tanggal_analisis}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            onClick={() => handleViewDetail(item.produk_utama.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                                                        >
                                                            <Eye className="mr-1 h-3 w-3" />
                                                            Detail
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Package className="h-8 w-8 text-gray-400" />
                                                            <p className="text-gray-500">Belum ada rekomendasi produk</p>
                                                            <p className="text-sm text-gray-400">Generate rekomendasi menggunakan algoritma Apriori</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Pagination */}
                                {rekomendasi.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="text-sm text-gray-700">
                                            Menampilkan {((rekomendasi.current_page - 1) * rekomendasi.per_page) + 1} sampai{' '}
                                            {Math.min(rekomendasi.current_page * rekomendasi.per_page, rekomendasi.total)} dari{' '}
                                            {rekomendasi.total} hasil
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {rekomendasi.links.map((link, index) => (
                                                <Button
                                                    key={index}
                                                    onClick={() => link.url && router.visit(link.url)}
                                                    variant={link.active ? "default" : "outline"}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    className={link.active ? "bg-purple-600 hover:bg-purple-700" : ""}
                                                >
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="top" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Top Rekomendasi Produk
                                </CardTitle>
                                <CardDescription>
                                    Rekomendasi dengan skor confidence tertinggi
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topRekomendasi.length > 0 ? topRekomendasi.map((item) => (
                                        <div key={item.rank} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white font-bold">
                                                {item.rank <= 3 ? (
                                                    <span className="text-lg">
                                                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                                                    </span>
                                                ) : (
                                                    item.rank
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">{item.produk_utama}</span>
                                                    <ArrowRight className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium text-blue-600">{item.produk_rekomendasi}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Star className="h-3 w-3" />
                                                        {item.skor_rekomendasi_percent}% confidence
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {item.frekuensi_bersamaan} transaksi
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8">
                                            <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500">Belum ada rekomendasi top</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="analisis" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Riwayat Analisis Apriori
                                </CardTitle>
                                <CardDescription>
                                    Catatan proses analisis algoritma Apriori yang telah dijalankan
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentAnalysis.length > 0 ? recentAnalysis.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                {getAnalysisTypeIcon(item.jenis_analisis)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium mb-1">
                                                    {getAnalysisTypeName(item.jenis_analisis)}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <div>Periode: {item.periode}</div>
                                                    <div>Total Transaksi: {item.total_transaksi.toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium">{item.tanggal_analisis}</div>
                                                <Badge variant="outline" className="mt-1">
                                                    {getAnalysisTypeName(item.jenis_analisis)}
                                                </Badge>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8">
                                            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500">Belum ada riwayat analisis</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
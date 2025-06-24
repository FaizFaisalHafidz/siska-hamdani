import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    BarChart3,
    Brain,
    Calendar,
    CheckCircle2,
    Database,
    Filter,
    GitBranch,
    Info,
    Lightbulb,
    RefreshCw,
    Settings,
    Target,
    TrendingUp,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Rekomendasi Produk',
        href: '/admin/rekomendasi',
    },
    {
        title: 'Analisis Apriori',
        href: '/admin/rekomendasi/analisis/apriori',
    },
];

interface AnalysisStats {
    frequent_itemsets: number;
    association_rules: number;
    avg_confidence: number;
    avg_confidence_percent: number;
    avg_lift: number;
}

interface FrequentItemset {
    nama_produk: string;
    support: number;
    count: number;
}

interface StrongRule {
    nama_produk: string;
    confidence: number;
    lift: number;
    support: number;
    strength: string;
}

interface AnalysisResult {
    id: number;
    kumpulan_item: string[];
    nama_produk: string;
    nilai_support: number;
    nilai_support_percent: number;
    nilai_confidence: number;
    nilai_confidence_percent: number;
    nilai_lift: number;
    jumlah_transaksi: number;
    total_transaksi_periode: number;
    tanggal_analisis: string;
    periode_awal: string;
    periode_akhir: string;
    jenis_analisis: string;
    deskripsi_hasil: string;
    strength_level: string;
}

interface Props {
    analysisResults: {
        data: AnalysisResult[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    analysisStats: AnalysisStats;
    frequentItemsets: FrequentItemset[];
    strongRules: StrongRule[];
    filters: {
        periode_awal: string;
        periode_akhir: string;
        jenis_analisis: string;
    };
}

export default function AprioriAnalysis({
    analysisResults,
    analysisStats,
    frequentItemsets,
    strongRules,
    filters,
}: Props) {
    const [periodeAwal, setPeriodeAwal] = useState(filters.periode_awal);
    const [periodeAkhir, setPeriodeAkhir] = useState(filters.periode_akhir);
    const [jenisAnalisis, setJenisAnalisis] = useState(filters.jenis_analisis || 'all');

    const handleFilter = () => {
        router.get(route('admin.rekomendasi.apriori'), {
            periode_awal: periodeAwal,
            periode_akhir: periodeAkhir,
            jenis_analisis: jenisAnalisis === 'all' ? undefined : jenisAnalisis,
        }, {
            preserveState: true,
        });
    };

    const handleReset = () => {
        setPeriodeAwal(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setPeriodeAkhir(new Date().toISOString().split('T')[0]);
        setJenisAnalisis('all');
        router.get(route('admin.rekomendasi.apriori'));
    };

    const handleBackToRekomendasi = () => {
        router.visit(route('admin.rekomendasi.index'));
    };

    const getAnalysisTypeIcon = (type: string) => {
        switch (type) {
            case 'frequent_itemset':
                return <BarChart3 className="h-4 w-4 text-blue-600" />;
            case 'association_rule':
                return <GitBranch className="h-4 w-4 text-purple-600" />;
            default:
                return <Activity className="h-4 w-4 text-gray-600" />;
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

    const getAnalysisTypeBadge = (type: string) => {
        switch (type) {
            case 'frequent_itemset':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Frequent Itemset</Badge>;
            case 'association_rule':
                return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Association Rule</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    const getStrengthColor = (strength: string) => {
        switch (strength.toLowerCase()) {
            case 'very strong':
                return 'text-green-600 bg-green-100';
            case 'strong':
                return 'text-blue-600 bg-blue-100';
            case 'medium':
                return 'text-yellow-600 bg-yellow-100';
            case 'weak':
                return 'text-orange-600 bg-orange-100';
            case 'very weak':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStrengthIcon = (strength: string) => {
        switch (strength.toLowerCase()) {
            case 'very strong':
            case 'strong':
                return <CheckCircle2 className="h-3 w-3" />;
            case 'medium':
                return <AlertCircle className="h-3 w-3" />;
            case 'weak':
            case 'very weak':
                return <XCircle className="h-3 w-3" />;
            default:
                return <AlertCircle className="h-3 w-3" />;
        }
    };

    // Prepare chart data
    const supportConfidenceData = analysisResults.data
        .filter(item => item.jenis_analisis === 'association_rule')
        .map(item => ({
            support: item.nilai_support_percent,
            confidence: item.nilai_confidence_percent,
            lift: item.nilai_lift,
            name: item.nama_produk,
        }));

    const frequentItemsetsData = frequentItemsets.map(item => ({
        name: item.nama_produk.length > 20 ? item.nama_produk.substring(0, 20) + '...' : item.nama_produk,
        support: item.support,
        count: item.count,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analisis Apriori" />
            
            <div className="container mx-auto py-6 space-y-6 p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                onClick={handleBackToRekomendasi}
                                variant="outline"
                                size="sm"
                                className="bg-gray-50 hover:bg-gray-100"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            Analisis Algoritma Apriori
                            <AprioriInfo type="apriori_algorithm" variant="primary" />
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Hasil detail dari analisis frequent itemsets dan association rules
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleReset} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reset Filter
                        </Button>
                    </div>
                </div>

                {/* Information Panel */}
                <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <Info className="h-5 w-5" />
                            Tentang Algoritma Apriori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <BarChart3 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Support</h4>
                                    <p className="text-gray-600">Mengukur seberapa sering item/kombinasi muncul dalam transaksi</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Target className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Confidence</h4>
                                    <p className="text-gray-600">Mengukur akurasi prediksi: "Jika beli A, maka beli B"</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <TrendingUp className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Lift</h4>
                                    <p className="text-gray-600">Mengukur kekuatan hubungan dibanding kejadian acak</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-1">
                                Frequent Itemsets
                                <InfoTooltip 
                                    title="Frequent Itemsets"
                                    content="Jumlah kombinasi item yang memenuhi minimum support threshold. Ini adalah dasar untuk menghasilkan association rules."
                                    variant="default"
                                />
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analysisStats.frequent_itemsets.toLocaleString()}</div>
                            <p className="text-xs opacity-80 mt-1">
                                Item sets yang memenuhi minimum support
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-1">
                                Association Rules
                                <InfoTooltip 
                                    title="Association Rules"
                                    content="Jumlah aturan asosiasi yang memenuhi minimum confidence. Rules ini menunjukkan hubungan 'jika-maka' antar produk."
                                    variant="default"
                                />
                            </CardTitle>
                            <GitBranch className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analysisStats.association_rules.toLocaleString()}</div>
                            <p className="text-xs opacity-80 mt-1">
                                Rules yang memenuhi minimum confidence
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-1">
                                Avg Confidence
                                <InfoTooltip 
                                    title="Average Confidence"
                                    content="Rata-rata confidence dari semua association rules. Menunjukkan tingkat akurasi prediksi secara keseluruhan."
                                    variant="default"
                                />
                            </CardTitle>
                            <Target className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analysisStats.avg_confidence_percent}%</div>
                            <p className="text-xs opacity-80 mt-1">
                                Rata-rata confidence semua rules
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-1">
                                Avg Lift
                                <InfoTooltip 
                                    title="Average Lift"
                                    content="Rata-rata lift ratio dari semua rules. Lift > 1 menunjukkan hubungan positif antar produk, semakin tinggi semakin kuat."
                                    variant="default"
                                />
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analysisStats.avg_lift}</div>
                            <p className="text-xs opacity-80 mt-1">
                                Rata-rata lift ratio semua rules
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Section */}
                <Card className="shadow-sm border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter Analisis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="periode_awal">Periode Awal</Label>
                                <div className="relative mt-1">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="periode_awal"
                                        type="date"
                                        value={periodeAwal}
                                        onChange={(e) => setPeriodeAwal(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="periode_akhir">Periode Akhir</Label>
                                <div className="relative mt-1">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="periode_akhir"
                                        type="date"
                                        value={periodeAkhir}
                                        onChange={(e) => setPeriodeAkhir(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Jenis Analisis</Label>
                                <Select value={jenisAnalisis} onValueChange={setJenisAnalisis}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Pilih jenis analisis..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Jenis</SelectItem>
                                        <SelectItem value="frequent_itemset">Frequent Itemset</SelectItem>
                                        <SelectItem value="association_rule">Association Rule</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Support vs Confidence Scatter Plot */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Support vs Confidence
                                <AprioriInfo type="confidence" variant="primary" />
                            </CardTitle>
                            <CardDescription>
                                Distribusi association rules berdasarkan support dan confidence. 
                                Posisi kanan atas menunjukkan rules dengan kualitas terbaik.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart data={supportConfidenceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="support" 
                                            name="Support %" 
                                            label={{ value: 'Support (%)', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis 
                                            dataKey="confidence" 
                                            name="Confidence %" 
                                            label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip 
                                            formatter={(value, name) => [
                                                `${value}%`,
                                                name === 'support' ? 'Support' : name === 'confidence' ? 'Confidence' : 'Lift'
                                            ]}
                                            labelFormatter={(label) => `Rule: ${label}`}
                                        />
                                        <Scatter dataKey="confidence" fill="#8884d8" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Frequent Itemsets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Top Frequent Itemsets
                                <AprioriInfo type="frequent_itemset" variant="primary" />
                            </CardTitle>
                            <CardDescription>
                                Item sets dengan support tertinggi. Menunjukkan kombinasi produk yang paling sering dibeli bersamaan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={frequentItemsetsData} layout="horizontal">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip 
                                            formatter={(value, name) => [
                                                name === 'support' ? `${(value * 100).toFixed(2)}%` : value,
                                                name === 'support' ? 'Support' : 'Count'
                                            ]}
                                        />
                                        <Bar dataKey="support" fill="#3B82F6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="results" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="results" className="flex items-center gap-1">
                            Hasil Analisis
                            <InfoTooltip 
                                title="Hasil Analisis"
                                content="Gabungan hasil frequent itemsets dan association rules dari analisis Apriori"
                                variant="primary"
                            />
                        </TabsTrigger>
                        <TabsTrigger value="itemsets" className="flex items-center gap-1">
                            Frequent Itemsets
                            <AprioriInfo type="frequent_itemset" variant="primary" />
                        </TabsTrigger>
                        <TabsTrigger value="rules" className="flex items-center gap-1">
                            Strong Rules
                            <AprioriInfo type="association_rule" variant="primary" />
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="results" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5" />
                                    Hasil Analisis Apriori
                                </CardTitle>
                                <CardDescription>
                                    Detail hasil analisis frequent itemsets dan association rules
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead>
                                                    <div className="flex items-center gap-1">
                                                        Jenis
                                                        <InfoTooltip 
                                                            title="Jenis Analisis"
                                                            content="Tipe hasil analisis: Frequent Itemset (pola item yang sering muncul) atau Association Rule (aturan hubungan antar item)"
                                                            variant="primary"
                                                        />
                                                    </div>
                                                </TableHead>
                                                <TableHead>Produk/Rule</TableHead>
                                                <TableHead className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        Support
                                                        <AprioriInfo type="support" variant="primary" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        Confidence
                                                        <AprioriInfo type="confidence" variant="primary" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        Lift
                                                        <AprioriInfo type="lift" variant="primary" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">Transaksi</TableHead>
                                                <TableHead className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        Strength
                                                        <AprioriInfo type="strength_level" variant="primary" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">Periode</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analysisResults.data.length > 0 ? analysisResults.data.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-gray-50">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getAnalysisTypeIcon(item.jenis_analisis)}
                                                            {getAnalysisTypeBadge(item.jenis_analisis)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.nama_produk}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {item.deskripsi_hasil}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="font-medium">{item.nilai_support_percent}%</div>
                                                        <div className="text-xs text-gray-500">
                                                            {item.jumlah_transaksi}/{item.total_transaksi_periode}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item.nilai_confidence ? (
                                                            <div className="font-medium">{item.nilai_confidence_percent}%</div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item.nilai_lift ? (
                                                            <div className="font-medium">{item.nilai_lift}</div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {item.jumlah_transaksi}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item.strength_level ? (
                                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStrengthColor(item.strength_level)}`}>
                                                                {getStrengthIcon(item.strength_level)}
                                                                <span className="ml-1">{item.strength_level}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm">
                                                        <div>{item.periode_awal}</div>
                                                        <div className="text-gray-500">s/d {item.periode_akhir}</div>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-8">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Brain className="h-8 w-8 text-gray-400" />
                                                            <p className="text-gray-500">Belum ada hasil analisis</p>
                                                            <p className="text-sm text-gray-400">Ubah filter periode untuk melihat data</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Pagination */}
                                {analysisResults.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="text-sm text-gray-700">
                                            Menampilkan {((analysisResults.current_page - 1) * analysisResults.per_page) + 1} sampai{' '}
                                            {Math.min(analysisResults.current_page * analysisResults.per_page, analysisResults.total)} dari{' '}
                                            {analysisResults.total} hasil
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {analysisResults.links.map((link, index) => (
                                                <Button
                                                    key={index}
                                                    onClick={() => link.url && router.visit(link.url)}
                                                    variant={link.active ? "default" : "outline"}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    className={link.active ? "bg-indigo-600 hover:bg-indigo-700" : ""}
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
                    
                    <TabsContent value="itemsets" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Frequent Itemsets
                                </CardTitle>
                                <CardDescription>
                                    Item sets yang memenuhi minimum support threshold
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {frequentItemsets.length > 0 ? frequentItemsets.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium mb-1">{item.nama_produk}</div>
                                                <div className="text-sm text-gray-600">
                                                    Support: {item.support}% • Count: {item.count} transaksi
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-blue-600">{item.support}%</div>
                                                <div className="text-sm text-gray-500">Support</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8">
                                            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500">Tidak ada frequent itemsets</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="rules" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GitBranch className="h-5 w-5" />
                                    Strong Association Rules
                                </CardTitle>
                                <CardDescription>
                                    Association rules dengan confidence dan lift yang tinggi
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {strongRules.length > 0 ? strongRules.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium mb-1">{item.nama_produk}</div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span>Confidence: {item.confidence}%</span>
                                                    <span>Lift: {item.lift}</span>
                                                    <span>Support: {item.support}%</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStrengthColor(item.strength)}`}>
                                                    {getStrengthIcon(item.strength)}
                                                    <span className="ml-1">{item.strength}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8">
                                            <GitBranch className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500">Tidak ada strong rules</p>
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
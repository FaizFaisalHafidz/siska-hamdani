import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    BarChart3,
    CheckCircle,
    Eye,
    Package,
    ShoppingCart,
    Star,
    Target,
    Trash2,
    TrendingUp,
    Users,
    XCircle,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface Produk {
    id: number;
    kode: string;
    nama: string;
    kategori: string;
    harga_jual: number;
    harga_jual_format: string;
    stok_tersedia: number;
    deskripsi_produk?: string;
}

interface Rekomendasi {
    id: number;
    produk_rekomendasi: {
        id: number;
        kode: string;
        nama: string;
        kategori: string;
        harga_jual: number;
        harga_jual_format: string;
        stok_tersedia: number;
    };
    skor_rekomendasi: number;
    skor_rekomendasi_percent: number;
    frekuensi_bersamaan: number;
    tanggal_analisis: string;
    status_aktif: boolean;
    keterangan?: string;
    confidence_level: string;
}

interface SalesAnalysis {
    penjualan_30_hari: number;
    total_penjualan: number;
    rata_rata_harian: number;
}

interface FrequentlyTogether {
    nama_produk: string;
    frekuensi: number;
    skor: number;
}

interface AssociationRule {
    kumpulan_item: string;
    support: number;
    confidence: number;
    lift: number;
    strength: string;
}

interface Props {
    produk: Produk;
    rekomendasi: Rekomendasi[];
    salesAnalysis: SalesAnalysis;
    frequentlyTogether: FrequentlyTogether[];
    associationRules: AssociationRule[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Rekomendasi Produk',
        href: '/admin/rekomendasi',
    },
    {
        title: 'Detail Produk',
        href: '',
    },
];

export default function Show({ 
    produk, 
    rekomendasi, 
    salesAnalysis, 
    frequentlyTogether, 
    associationRules 
}: Props) {
    const [processing, setProcessing] = useState(false);

    const getConfidenceBadgeColor = (level: string) => {
        switch (level) {
            case 'Very High':
                return 'bg-green-600';
            case 'High':
                return 'bg-blue-600';
            case 'Medium':
                return 'bg-yellow-600';
            case 'Low':
                return 'bg-orange-600';
            default:
                return 'bg-red-600';
        }
    };

    const getStrengthBadgeColor = (strength: string) => {
        switch (strength) {
            case 'Very Strong':
                return 'bg-emerald-600';
            case 'Strong':
                return 'bg-blue-600';
            case 'Medium':
                return 'bg-yellow-600';
            case 'Weak':
                return 'bg-orange-600';
            default:
                return 'bg-red-600';
        }
    };

    const handleToggleStatus = (rekomendasiId: number, currentStatus: boolean) => {
        setProcessing(true);
        
        router.put(route('admin.rekomendasi.update-status', rekomendasiId), {
            status_aktif: !currentStatus,
            keterangan: `Status ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'} pada ${new Date().toLocaleString('id-ID')}`
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Rekomendasi berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
            },
            onError: () => {
                toast.error('Gagal mengubah status rekomendasi');
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handleDeleteRekomendasi = (rekomendasiId: number, namaProduk: string) => {
        if (confirm(`Yakin ingin menghapus rekomendasi "${namaProduk}"?`)) {
            setProcessing(true);
            
            router.delete(route('admin.rekomendasi.destroy', rekomendasiId), {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Rekomendasi berhasil dihapus');
                },
                onError: () => {
                    toast.error('Gagal menghapus rekomendasi');
                },
                onFinish: () => {
                    setProcessing(false);
                }
            });
        }
    };

    return (
        <AppLayout
            title={`Detail Rekomendasi - ${produk.nama}`}
            breadcrumbs={breadcrumbs}
        >
            <Head title={`Detail Rekomendasi - ${produk.nama}`} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('admin.rekomendasi.index')}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Daftar
                        </Link>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Detail Rekomendasi Produk</h1>
                            <p className="text-gray-600">Analisis mendalam untuk {produk.nama}</p>
                        </div>
                    </div>
                </div>

                {/* Product Info Card */}
                <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-l-4 border-l-blue-500">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{produk.nama}</CardTitle>
                                <CardDescription>
                                    {produk.kode} • {produk.kategori}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Harga Jual</div>
                                <div className="font-bold text-lg text-green-600">{produk.harga_jual_format}</div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Stok Tersedia</div>
                                <div className="font-bold text-lg text-blue-600">{produk.stok_tersedia} unit</div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Penjualan 30 Hari</div>
                                <div className="font-bold text-lg text-purple-600">{salesAnalysis.penjualan_30_hari} unit</div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Rata-rata Harian</div>
                                <div className="font-bold text-lg text-orange-600">{salesAnalysis.rata_rata_harian} unit</div>
                            </div>
                        </div>
                        {produk.deskripsi_produk && (
                            <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg">
                                <div className="text-sm text-gray-600 mb-2">Deskripsi Produk</div>
                                <p className="text-gray-800">{produk.deskripsi_produk}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tabs Content */}
                <Tabs defaultValue="rekomendasi" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="rekomendasi" className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Rekomendasi ({rekomendasi.length})
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="frequently" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Frequently Together
                        </TabsTrigger>
                        <TabsTrigger value="rules" className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Association Rules
                        </TabsTrigger>
                    </TabsList>

                    {/* Rekomendasi Tab */}
                    <TabsContent value="rekomendasi" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-600" />
                                    Daftar Rekomendasi Produk
                                </CardTitle>
                                <CardDescription>
                                    Produk yang direkomendasikan berdasarkan analisis Apriori
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {rekomendasi.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-2">Belum ada rekomendasi untuk produk ini</p>
                                        <p className="text-sm text-gray-500">Generate rekomendasi untuk melihat hasil analisis</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {rekomendasi.map((item, index) => (
                                            <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                {item.produk_rekomendasi.nama}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {item.produk_rekomendasi.kode} • {item.produk_rekomendasi.kategori}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <span className="text-sm text-green-600 font-medium">
                                                                    {item.produk_rekomendasi.harga_jual_format}
                                                                </span>
                                                                <span className="text-sm text-gray-500">
                                                                    Stok: {item.produk_rekomendasi.stok_tersedia}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-600 mb-1">Confidence Score</div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-20">
                                                                    <Progress value={item.skor_rekomendasi_percent} className="h-2" />
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-900">
                                                                    {item.skor_rekomendasi_percent}%
                                                                </span>
                                                            </div>
                                                            <div className="mt-1">
                                                                <Badge className={`text-xs ${getConfidenceBadgeColor(item.confidence_level)}`}>
                                                                    {item.confidence_level}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-600 mb-1">Frekuensi</div>
                                                            <div className="text-lg font-bold text-purple-600">
                                                                {item.frekuensi_bersamaan}x
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {item.tanggal_analisis}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleToggleStatus(item.id, item.status_aktif)}
                                                                disabled={processing}
                                                                className={item.status_aktif ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}
                                                            >
                                                                {item.status_aktif ? (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Aktif
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-4 w-4 mr-1" />
                                                                        Nonaktif
                                                                    </>
                                                                )}
                                                            </Button>
                                                            
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.visit(route('admin.rekomendasi.show', item.produk_rekomendasi.id))}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteRekomendasi(item.id, item.produk_rekomendasi.nama)}
                                                                disabled={processing}
                                                                className="text-red-600 border-red-300 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {item.keterangan && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                                        <p className="text-sm text-gray-700">{item.keterangan}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                        Penjualan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm text-gray-600">Total Penjualan</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {salesAnalysis.total_penjualan} unit
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">30 Hari Terakhir</div>
                                            <div className="text-xl font-semibold text-blue-600">
                                                {salesAnalysis.penjualan_30_hari} unit
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Rata-rata Harian</div>
                                            <div className="text-lg font-medium text-purple-600">
                                                {salesAnalysis.rata_rata_harian} unit
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Star className="h-5 w-5 text-yellow-600" />
                                        Rekomendasi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm text-gray-600">Total Rekomendasi</div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {rekomendasi.length}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Rekomendasi Aktif</div>
                                            <div className="text-xl font-semibold text-green-600">
                                                {rekomendasi.filter(r => r.status_aktif).length}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Avg. Confidence</div>
                                            <div className="text-lg font-medium text-purple-600">
                                                {rekomendasi.length > 0 
                                                    ? Math.round(rekomendasi.reduce((sum, r) => sum + r.skor_rekomendasi_percent, 0) / rekomendasi.length)
                                                    : 0
                                                }%
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Activity className="h-5 w-5 text-red-600" />
                                        Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm text-gray-600">Tingkat Kepercayaan</div>
                                            <div className="text-xl font-semibold text-blue-600">
                                                {rekomendasi.length > 0 
                                                    ? rekomendasi.filter(r => r.confidence_level === 'High' || r.confidence_level === 'Very High').length
                                                    : 0
                                                } / {rekomendasi.length}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Frekuensi Tertinggi</div>
                                            <div className="text-xl font-semibold text-green-600">
                                                {rekomendasi.length > 0 
                                                    ? Math.max(...rekomendasi.map(r => r.frekuensi_bersamaan))
                                                    : 0
                                                }x
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Frequently Together Tab */}
                    <TabsContent value="frequently" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-purple-600" />
                                    Produk yang Sering Dibeli Bersamaan
                                </CardTitle>
                                <CardDescription>
                                    Produk yang paling sering dibeli bersamaan dengan {produk.nama}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {frequentlyTogether.length === 0 ? (
                                    <div className="text-center py-8">
                                        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">Belum ada data pembelian bersamaan</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {frequentlyTogether.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{item.nama_produk}</h4>
                                                        <p className="text-sm text-gray-600">Skor: {item.skor}%</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-purple-600">{item.frekuensi}x</div>
                                                    <div className="text-xs text-gray-500">Frekuensi</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Association Rules Tab */}
                    <TabsContent value="rules" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-600" />
                                    Association Rules
                                </CardTitle>
                                <CardDescription>
                                    Aturan asosiasi yang melibatkan {produk.nama}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {associationRules.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">Belum ada association rules</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {associationRules.map((rule, index) => (
                                            <div key={index} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-900">{rule.kumpulan_item}</h4>
                                                    <Badge className={`${getStrengthBadgeColor(rule.strength)} text-white`}>
                                                        {rule.strength}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-sm text-gray-600">Support</div>
                                                        <div className="font-semibold text-blue-600">{rule.support}%</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600">Confidence</div>
                                                        <div className="font-semibold text-green-600">{rule.confidence}%</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600">Lift</div>
                                                        <div className="font-semibold text-purple-600">{rule.lift}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
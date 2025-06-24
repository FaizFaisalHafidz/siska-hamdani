// filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/js/pages/Kasir/RiwayatPembelian/Show.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    ArrowLeft,
    CalendarDays,
    CreditCard,
    Download,
    Package,
    Printer,
    ShoppingCart,
    User,
    UserCheck
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Riwayat Pembelian',
        href: '/kasir/riwayat-pembelian',
    },
    {
        title: 'Detail Transaksi',
        href: '#',
    },
];

interface TransactionDetail {
    id: number;
    produk: {
        id: number | null;
        kode: string;
        nama: string;
        satuan: string;
    };
    jumlah_beli: number;
    harga_satuan: number;
    harga_satuan_format: string;
    diskon_item: number;
    diskon_item_format: string;
    subtotal: number;
    subtotal_format: string;
    catatan_item: string | null;
}

interface Transaction {
    id: number;
    nomor_invoice: string;
    pelanggan: {
        id: number;
        kode: string;
        nama: string;
        nomor_telepon: string | null;
        email: string | null;
    } | null;
    kasir: {
        id: number;
        nama: string;
        email: string;
    };
    tanggal_penjualan: string;
    total_belanja: number;
    total_belanja_format: string;
    diskon_persen: number;
    diskon_nominal: number;
    diskon_format: string;
    pajak_persen: number;
    pajak_nominal: number;
    pajak_format: string;
    total_bayar: number;
    total_bayar_format: string;
    jumlah_dibayar: number;
    jumlah_dibayar_format: string;
    kembalian: number;
    kembalian_format: string;
    metode_pembayaran: string;
    status_transaksi: string;
    catatan_penjualan: string | null;
    created_at: string;
    detail_items: TransactionDetail[];
}

interface Props {
    transaction: Transaction;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function Show({ transaction, auth }: Props) {
    const handleBack = () => {
        router.visit(route('kasir.riwayat-pembelian.index'));
    };

    const handlePrint = () => {
        window.open(route('pos.print-receipt', transaction.id), '_blank');
    };

    const handleDownload = () => {
        window.open(route('pos.download-receipt', transaction.id), '_blank');
    };

    const handleNewTransaction = () => {
        router.visit(route('pos.index'));
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'selesai':
                return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Selesai</Badge>;
            case 'pending':
                return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
            case 'batal':
                return <Badge variant="destructive">Dibatalkan</Badge>;
            case 'void':
                return <Badge variant="secondary">Void</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentBadge = (method: string) => {
        switch (method.toLowerCase()) {
            case 'tunai':
                return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CreditCard className="w-3 h-3 mr-1" />
                    Tunai
                </Badge>;
            case 'kartu_debit':
                return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                    <CreditCard className="w-3 h-3 mr-1" />
                    Debit
                </Badge>;
            case 'kartu_kredit':
                return <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
                    <CreditCard className="w-3 h-3 mr-1" />
                    Kredit
                </Badge>;
            case 'transfer':
                return <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">
                    <CreditCard className="w-3 h-3 mr-1" />
                    Transfer
                </Badge>;
            case 'qris':
                return <Badge variant="default" className="bg-pink-100 text-pink-800 border-pink-200">
                    <CreditCard className="w-3 h-3 mr-1" />
                    QRIS
                </Badge>;
            default:
                return <Badge variant="outline">{method}</Badge>;
        }
    };

    return (
        <AppLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="hover:bg-gray-100"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Detail Transaksi
                            </h2>
                            <p className="text-sm text-gray-600">Invoice: {transaction.nomor_invoice}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handlePrint}
                            variant="outline"
                            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print Struk
                        </Button>
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 border-green-200"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button
                            onClick={handleNewTransaction}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Transaksi Baru
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Detail Transaksi - ${transaction.nomor_invoice}`} />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Transaction Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Info Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        Informasi Transaksi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Invoice</label>
                                            <p className="font-mono font-semibold">{transaction.nomor_invoice}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                            <div className="mt-1">
                                                {getStatusBadge(transaction.status_transaksi)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Tanggal Transaksi</label>
                                            <p className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4" />
                                                {transaction.tanggal_penjualan}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Metode Pembayaran</label>
                                            <div className="mt-1">
                                                {getPaymentBadge(transaction.metode_pembayaran)}
                                            </div>
                                        </div>
                                    </div>
                                    {transaction.catatan_penjualan && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                                            <p className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                                                {transaction.catatan_penjualan}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Items Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Daftar Item ({transaction.detail_items.length} item)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="font-semibold">Produk</TableHead>
                                                    <TableHead className="font-semibold text-center">Qty</TableHead>
                                                    <TableHead className="font-semibold text-right">Harga</TableHead>
                                                    <TableHead className="font-semibold text-right">Diskon</TableHead>
                                                    <TableHead className="font-semibold text-right">Subtotal</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {transaction.detail_items.map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-gray-50">
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {item.produk.nama}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    Kode: {item.produk.kode}
                                                                </div>
                                                                {item.catatan_item && (
                                                                    <div className="text-xs text-blue-600 mt-1">
                                                                        Note: {item.catatan_item}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="font-medium">
                                                                {item.jumlah_beli} {item.produk.satuan}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {item.harga_satuan_format}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {item.diskon_item > 0 ? (
                                                                <span className="text-red-600">
                                                                    {item.diskon_item_format}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold text-green-600">
                                                            {item.subtotal_format}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Informasi Pelanggan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {transaction.pelanggan ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Nama</label>
                                                <p className="font-medium">{transaction.pelanggan.nama}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Kode</label>
                                                <p className="font-mono text-sm">{transaction.pelanggan.kode}</p>
                                            </div>
                                            {transaction.pelanggan.nomor_telepon && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Telepon</label>
                                                    <p>{transaction.pelanggan.nomor_telepon}</p>
                                                </div>
                                            )}
                                            {transaction.pelanggan.email && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                                    <p className="text-sm">{transaction.pelanggan.email}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">Walk-in Customer</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Kasir Info */}
                            <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-900">
                                        <UserCheck className="h-5 w-5" />
                                        Kasir
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Nama</label>
                                        <p className="font-medium text-blue-900">{transaction.kasir.nama}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Email</label>
                                        <p className="text-sm text-blue-800">{transaction.kasir.email}</p>
                                    </div>
                                    {auth.user.id === transaction.kasir.id && (
                                        <Badge className="bg-blue-600 text-white">
                                            Transaksi Anda
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Ringkasan Pembayaran
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">{transaction.total_belanja_format}</span>
                                    </div>
                                    
                                    {transaction.diskon_nominal > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Diskon {transaction.diskon_persen > 0 && `(${transaction.diskon_persen}%)`}
                                            </span>
                                            <span className="font-medium text-red-600">
                                                -{transaction.diskon_format}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {transaction.pajak_nominal > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Pajak {transaction.pajak_persen > 0 && `(${transaction.pajak_persen}%)`}
                                            </span>
                                            <span className="font-medium">{transaction.pajak_format}</span>
                                        </div>
                                    )}
                                    
                                    <Separator />
                                    
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Bayar</span>
                                        <span className="text-green-600">{transaction.total_bayar_format}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Jumlah Dibayar</span>
                                        <span className="font-medium">{transaction.jumlah_dibayar_format}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Kembalian</span>
                                        <span className="font-medium text-blue-600">{transaction.kembalian_format}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timestamp */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center text-sm text-muted-foreground">
                                        <p>Transaksi dibuat pada:</p>
                                        <p className="font-medium text-foreground mt-1">{transaction.created_at}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
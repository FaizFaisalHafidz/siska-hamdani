import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    Download,
    FileText,
    Package,
    Printer,
    Receipt,
    RefreshCw,
    Trash2,
    User,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AuthenticatedLayout from '@/layouts/authenticated-layout';

interface TransactionItem {
    id: number;
    produk_id: number;
    nama_produk: string;
    kode_produk: string;
    kategori: string;
    merk?: string;
    satuan?: string;
    jumlah: number;
    harga_satuan: number;
    harga_satuan_format: string;
    diskon_item: number;
    diskon_item_format: string;
    subtotal: number;
    subtotal_format: string;
    catatan_item?: string;
}

interface Customer {
    id: number;
    kode: string;
    nama: string;
    telepon?: string;
    jenis: string;
    alamat?: string;
}

interface Cashier {
    id: number;
    nama: string;
    email: string;
}

interface Transaction {
    id: number;
    nomor_invoice: string;
    tanggal_penjualan: string;
    tanggal_penjualan_format: string;
    tanggal_penjualan_simple: string;
    waktu_penjualan: string;
    pelanggan?: Customer;
    kasir: Cashier;
    items: TransactionItem[];
    total_belanja: number;
    total_belanja_format: string;
    diskon_persen: number;
    diskon_nominal: number;
    diskon_nominal_format: string;
    pajak_persen: number;
    pajak_nominal: number;
    pajak_nominal_format: string;
    total_bayar: number;
    total_bayar_format: string;
    jumlah_dibayar: number;
    jumlah_dibayar_format: string;
    kembalian: number;
    kembalian_format: string;
    metode_pembayaran: string;
    metode_pembayaran_label: string;
    catatan_penjualan?: string;
    status_transaksi: string;
    status_transaksi_label: string;
    status_badge_color: string;
}

interface Props {
    transaction: Transaction;
    userRole: string;
    canVoid: boolean;
}

export default function TransactionDetail({ transaction, userRole, canVoid }: Props) {
    const [processing, setProcessing] = useState(false);

    const handlePrintReceipt = () => {
        window.open(route('pos.print-receipt', transaction.id), '_blank');
    };

    const handleDownloadReceipt = () => {
        window.open(route('pos.download-receipt', transaction.id), '_blank');
    };

    const handleVoidTransaction = () => {
        if (!canVoid) {
            toast.error('Anda tidak memiliki akses untuk membatalkan transaksi ini');
            return;
        }

        const confirmMessage = `Yakin ingin membatalkan transaksi ${transaction.nomor_invoice}?\n\nTindakan ini akan:\n- Mengembalikan semua stok produk\n- Mengubah status menjadi 'Batal'\n- Tidak dapat diurungkan`;

        if (confirm(confirmMessage)) {
            setProcessing(true);
            
            router.post(route('pos.void-transaction', transaction.id), {}, {
                preserveState: false,
                onSuccess: () => {
                    toast.success('Transaksi berhasil dibatalkan');
                },
                onError: (errors) => {
                    const errorMessage = errors.message || 'Gagal membatalkan transaksi';
                    toast.error(errorMessage);
                },
                onFinish: () => {
                    setProcessing(false);
                }
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'selesai':
                return <CheckCircle className="h-4 w-4" />;
            case 'batal':
                return <XCircle className="h-4 w-4" />;
            case 'pending':
                return <Clock className="h-4 w-4" />;
            default:
                return <AlertTriangle className="h-4 w-4" />;
        }
    };

    const getBadgeVariant = (color: string) => {
        switch (color) {
            case 'green':
                return 'bg-green-600 text-white';
            case 'red':
                return 'bg-red-600 text-white';
            case 'yellow':
                return 'bg-yellow-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('pos.index')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke POS
                        </Link>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Detail Transaksi
                            </h2>
                            <p className="text-sm text-gray-600">{transaction.nomor_invoice}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={getBadgeVariant(transaction.status_badge_color)}>
                            {getStatusIcon(transaction.status_transaksi)}
                            <span className="ml-2">{transaction.status_transaksi_label}</span>
                        </Badge>
                    </div>
                </div>
            }
        >
            <Head title={`Detail Transaksi - ${transaction.nomor_invoice}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Transaction Info Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-bold">{transaction.nomor_invoice}</CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Detail lengkap transaksi penjualan
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={handlePrintReceipt}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print Struk
                                    </Button>
                                    <Button variant="outline" onClick={handleDownloadReceipt}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </Button>
                                    {canVoid && (
                                        <Button 
                                            variant="destructive" 
                                            onClick={handleVoidTransaction}
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 mr-2" />
                                            )}
                                            Void Transaksi
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Transaction Info */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-blue-600" />
                                        Informasi Transaksi
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-600">Tanggal:</span>
                                            <span className="font-medium">{transaction.tanggal_penjualan_simple}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-600">Waktu:</span>
                                            <span className="font-medium">{transaction.waktu_penjualan}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CreditCard className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-600">Pembayaran:</span>
                                            <span className="font-medium">{transaction.metode_pembayaran_label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-green-600" />
                                        Informasi Pelanggan
                                    </h3>
                                    {transaction.pelanggan ? (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="font-medium">{transaction.pelanggan.nama}</p>
                                                <p className="text-sm text-gray-600">{transaction.pelanggan.kode}</p>
                                            </div>
                                            {transaction.pelanggan.telepon && (
                                                <p className="text-sm text-gray-600">
                                                    📞 {transaction.pelanggan.telepon}
                                                </p>
                                            )}
                                            <Badge variant="outline">
                                                {transaction.pelanggan.jenis}
                                            </Badge>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Walk-in Customer</p>
                                        </div>
                                    )}
                                </div>

                                {/* Cashier Info */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-purple-600" />
                                        Informasi Kasir
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium">{transaction.kasir.nama}</p>
                                            <p className="text-sm text-gray-600">{transaction.kasir.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {transaction.catatan_penjualan && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">Catatan Transaksi:</p>
                                            <p className="text-sm text-blue-800 mt-1">{transaction.catatan_penjualan}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-orange-600" />
                                Daftar Item ({transaction.items.length})
                            </CardTitle>
                            <CardDescription>
                                Detail produk yang dibeli dalam transaksi ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">No</TableHead>
                                            <TableHead>Produk</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Harga Satuan</TableHead>
                                            <TableHead className="text-right">Diskon</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transaction.items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.nama_produk}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <span>{item.kode_produk}</span>
                                                            <span>•</span>
                                                            <span>{item.kategori}</span>
                                                            {item.merk && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{item.merk}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {item.catatan_item && (
                                                            <p className="text-xs text-blue-600 italic mt-1">
                                                                💬 {item.catatan_item}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">
                                                        {item.jumlah} {item.satuan || 'pcs'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {item.harga_satuan_format}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.diskon_item > 0 ? (
                                                        <span className="text-red-600">-{item.diskon_item_format}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {item.subtotal_format}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-green-600" />
                                Ringkasan Pembayaran
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-md ml-auto space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">{transaction.total_belanja_format}</span>
                                </div>
                                
                                {transaction.diskon_nominal > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Diskon {transaction.diskon_persen > 0 ? `(${transaction.diskon_persen}%)` : ''}:
                                        </span>
                                        <span className="font-medium text-red-600">-{transaction.diskon_nominal_format}</span>
                                    </div>
                                )}
                                
                                {transaction.pajak_nominal > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Pajak ({transaction.pajak_persen}%):</span>
                                        <span className="font-medium">{transaction.pajak_nominal_format}</span>
                                    </div>
                                )}
                                
                                <Separator />
                                
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Bayar:</span>
                                    <span className="text-green-600">{transaction.total_bayar_format}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Jumlah Dibayar:</span>
                                    <span className="font-medium">{transaction.jumlah_dibayar_format}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Kembalian:</span>
                                    <span className="font-medium text-blue-600">{transaction.kembalian_format}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Void Warning for Cancelled Transactions */}
                    {transaction.status_transaksi === 'batal' && (
                        <Alert className="border-red-200 bg-red-50">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                <strong>Transaksi Dibatalkan:</strong> Transaksi ini telah dibatalkan dan semua stok produk telah dikembalikan ke inventory.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
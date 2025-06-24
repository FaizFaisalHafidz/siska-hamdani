import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CheckCircle,
    Info,
    Plus,
    Printer
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TransactionData {
    id: number;
    nomor_invoice: string;
    tanggal_penjualan: string;
    pelanggan: {
        kode: string;
        nama: string;
        telepon: string;
        jenis: string;
    } | null;
    kasir: {
        nama: string;
    };
    items: Array<{
        nama_produk: string;
        kode_produk: string;
        kategori: string;
        jumlah: number;
        harga_satuan: number;
        harga_satuan_format: string;
        diskon_item: number;
        diskon_item_format: string;
        subtotal: number;
        subtotal_format: string;
        catatan_item: string;
    }>;
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
    catatan_penjualan: string;
    status_transaksi: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    transactionId: number | null;
}

export default function ReceiptDialog({ open, onClose, transactionId }: Props) {
    const [transaction, setTransaction] = useState<TransactionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        if (open && transactionId) {
            fetchTransaction();
        }
    }, [open, transactionId]);

    const fetchTransaction = async () => {
        if (!transactionId) return;

        setLoading(true);
        try {
            const response = await fetch(`/pos/transaction/${transactionId}`);
            const result = await response.json();

            if (result.success) {
                setTransaction(result.data);
            } else {
                toast.error('Gagal memuat data transaksi');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat memuat data transaksi');
            console.error('Fetch transaction error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!transaction) return;

        setPrinting(true);
        try {
            // Open print page in new tab
            const printUrl = `/pos/print/${transaction.id}`;
            const printWindow = window.open(printUrl, '_blank', 'width=400,height=600,scrollbars=yes');
            
            if (printWindow) {
                printWindow.focus();
                toast.success('Struk dibuka untuk pencetakan');
                
                // Show instructions
                toast.info('Klik tombol Print di halaman yang terbuka atau tekan Ctrl+P', {
                    duration: 5000,
                });
            } else {
                toast.error('Gagal membuka jendela print. Pastikan popup tidak diblokir.');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat membuka struk');
            console.error('Print error:', error);
        } finally {
            setPrinting(false);
        }
    };

    const handleNewTransaction = () => {
        onClose();
        // Clear any cart data or reset form if needed
        window.location.reload();
    };

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Memuat Struk...</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!transaction) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Data Tidak Ditemukan</DialogTitle>
                    </DialogHeader>
                    <p>Transaksi tidak ditemukan atau terjadi kesalahan.</p>
                    <DialogFooter>
                        <Button onClick={onClose}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Transaksi Berhasil
                    </DialogTitle>
                    <DialogDescription>
                        Transaksi telah berhasil diproses. Anda dapat mencetak struk atau memulai transaksi baru.
                    </DialogDescription>
                </DialogHeader>

                {/* Print Instructions */}
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                        <strong>Cara Print Thermal Receipt:</strong>
                        <br />
                        1. Klik "Print Struk" untuk membuka halaman print
                        <br />
                        2. Di halaman yang terbuka, klik tombol Print atau tekan Ctrl+P
                        <br />
                        3. Pilih printer thermal Anda dan pastikan ukuran kertas adalah 80mm
                        <br />
                        4. Klik Print untuk mencetak struk
                    </AlertDescription>
                </Alert>

                {/* Transaction Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                    <div className="text-center mb-4">
                        <h3 className="text-2xl font-bold text-green-600">{transaction.total_bayar_format}</h3>
                        <p className="text-sm text-gray-600">Total Pembayaran</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium">No. Invoice:</p>
                            <p className="text-blue-600 font-mono">{transaction.nomor_invoice}</p>
                        </div>
                        <div>
                            <p className="font-medium">Tanggal:</p>
                            <p>{transaction.tanggal_penjualan}</p>
                        </div>
                        <div>
                            <p className="font-medium">Kasir:</p>
                            <p>{transaction.kasir.nama}</p>
                        </div>
                        <div>
                            <p className="font-medium">Metode Bayar:</p>
                            <p className="capitalize">{transaction.metode_pembayaran.replace('_', ' ')}</p>
                        </div>
                        {transaction.pelanggan && (
                            <>
                                <div>
                                    <p className="font-medium">Pelanggan:</p>
                                    <p>{transaction.pelanggan.nama}</p>
                                </div>
                                <div>
                                    <p className="font-medium">Kode:</p>
                                    <p>{transaction.pelanggan.kode}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Items Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Item yang Dibeli ({transaction.items.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start text-sm">
                                <div className="flex-1">
                                    <p className="font-medium">{item.nama_produk}</p>
                                    <p className="text-gray-500 text-xs">{item.kode_produk}</p>
                                    <p className="text-xs">{item.jumlah} x {item.harga_satuan_format}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{item.subtotal_format}</p>
                                    {item.diskon_item > 0 && (
                                        <p className="text-xs text-red-600">Disc: {item.diskon_item_format}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Ringkasan Pembayaran</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{transaction.total_belanja_format}</span>
                        </div>
                        {transaction.diskon_nominal > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>
                                    Diskon
                                    {transaction.diskon_persen > 0 && ` (${transaction.diskon_persen}%)`}:
                                </span>
                                <span>-{transaction.diskon_nominal_format}</span>
                            </div>
                        )}
                        {transaction.pajak_nominal > 0 && (
                            <div className="flex justify-between">
                                <span>Pajak ({transaction.pajak_persen}%):</span>
                                <span>{transaction.pajak_nominal_format}</span>
                            </div>
                        )}
                        <div className="border-t pt-1 font-bold">
                            <div className="flex justify-between">
                                <span>Total:</span>
                                <span>{transaction.total_bayar_format}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Dibayar:</span>
                                <span>{transaction.jumlah_dibayar_format}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Kembalian:</span>
                                <span>{transaction.kembalian_format}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <div className="flex flex-wrap gap-2 w-full justify-between">
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={handlePrint}
                                disabled={printing}
                                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                            >
                                {printing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                                ) : (
                                    <Printer className="h-4 w-4" />
                                )}
                                {printing ? 'Membuka...' : 'Print Struk'}
                            </Button>
                            
                            {/* Detail Transaction Link */}
                            {/* <Link 
                                href={route('pos.transaction.show', transaction.id)} 
                                className="flex items-center gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                Lihat Detail
                            </Link> */}

                            {/* Atau dengan button
                            <Button 
                                variant="outline" 
                                onClick={() => router.visit(route('pos.transaction.show', transaction.id))}
                                className="flex items-center gap-2"
                            >
                                <Receipt className="h-4 w-4 mr-2" />
                                Detail Transaksi
                            </Button>
                            */}
                        </div>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={onClose}
                            >
                                Tutup
                            </Button>
                            <Button 
                                onClick={handleNewTransaction}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Transaksi Baru
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
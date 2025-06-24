import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Package } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

interface Product {
    id: number;
    kode_produk: string;
    nama_produk: string;
    stok_tersedia: number;
    satuan: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    product?: Product | null;
}

interface FormData {
    jenis_transaksi: string;
    jumlah_stok: string;
    keterangan: string;
}

export default function StockUpdateForm({ open, onClose, product }: Props) {
    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm<FormData>({
        jenis_transaksi: 'masuk',
        jumlah_stok: '',
        keterangan: '',
    });

    useEffect(() => {
        if (open) {
            reset();
            clearErrors();
        }
    }, [open, product]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!product) return;

        patch(route('admin.produk.update-stock', product.id), {
            onSuccess: () => {
                toast.success('Stok berhasil diperbarui');
                onClose();
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat memperbarui stok');
            }
        });
    };

    const handleClose = () => {
        if (!processing) {
            reset();
            clearErrors();
            onClose();
        }
    };

    const getNewStock = () => {
        if (!product || !data.jumlah_stok) return product?.stok_tersedia || 0;
        
        const jumlah = parseInt(data.jumlah_stok);
        const currentStock = product.stok_tersedia;
        
        switch (data.jenis_transaksi) {
            case 'masuk':
                return currentStock + jumlah;
            case 'keluar':
                return Math.max(0, currentStock - jumlah);
            case 'penyesuaian':
                return jumlah;
            default:
                return currentStock;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Update Stok Produk
                    </DialogTitle>
                    <DialogDescription>
                        Kelola stok untuk produk: <strong>{product?.nama_produk}</strong>
                    </DialogDescription>
                </DialogHeader>

                {product && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Kode Produk:</span>
                            <span className="text-sm font-medium">{product.kode_produk}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Stok Saat Ini:</span>
                            <span className="text-sm font-medium">{product.stok_tersedia} {product.satuan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Stok Setelah Update:</span>
                            <span className="text-sm font-medium text-blue-600">
                                {getNewStock()} {product.satuan}
                            </span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Jenis Transaksi */}
                    <div className="space-y-2">
                        <Label htmlFor="jenis_transaksi">Jenis Transaksi *</Label>
                        <select
                            id="jenis_transaksi"
                            value={data.jenis_transaksi}
                            onChange={(e) => setData('jenis_transaksi', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                                errors.jenis_transaksi ? 'border-red-500' : 'border-input'
                            } focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent`}
                        >
                            <option value="masuk">Stok Masuk (+)</option>
                            <option value="keluar">Stok Keluar (-)</option>
                            <option value="penyesuaian">Penyesuaian Stok (=)</option>
                        </select>
                        {errors.jenis_transaksi && (
                            <p className="text-sm text-red-500">{errors.jenis_transaksi}</p>
                        )}
                    </div>

                    {/* Jumlah Stok */}
                    <div className="space-y-2">
                        <Label htmlFor="jumlah_stok">
                            {data.jenis_transaksi === 'penyesuaian' ? 'Stok Baru' : 'Jumlah'} *
                        </Label>
                        <Input
                            id="jumlah_stok"
                            type="number"
                            min="1"
                            value={data.jumlah_stok}
                            onChange={(e) => setData('jumlah_stok', e.target.value)}
                            placeholder={data.jenis_transaksi === 'penyesuaian' ? 'Masukkan stok baru' : 'Masukkan jumlah'}
                            className={errors.jumlah_stok ? 'border-red-500' : ''}
                        />
                        {errors.jumlah_stok && (
                            <p className="text-sm text-red-500">{errors.jumlah_stok}</p>
                        )}
                    </div>

                    {/* Keterangan */}
                    <div className="space-y-2">
                        <Label htmlFor="keterangan">Keterangan</Label>
                        <Textarea
                            id="keterangan"
                            value={data.keterangan}
                            onChange={(e) => setData('keterangan', e.target.value)}
                            placeholder="Masukkan keterangan (opsional)"
                            className={errors.keterangan ? 'border-red-500' : ''}
                            rows={3}
                        />
                        {errors.keterangan && (
                            <p className="text-sm text-red-500">{errors.keterangan}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Memperbarui...' : 'Update Stok'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
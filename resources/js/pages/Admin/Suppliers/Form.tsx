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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Building2, Mail, MapPin, Phone, TruckIcon, User } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

interface Supplier {
    id: number;
    kode_supplier: string;
    nama_supplier: string;
    nama_kontak: string;
    nomor_telepon: string;
    email_supplier: string;
    alamat_supplier: string;
    kota_supplier: string;
    status_aktif: boolean;
}

interface Props {
    open: boolean;
    onClose: () => void;
    supplier?: Supplier | null;
}

interface FormData {
    nama_supplier: string;
    nama_kontak: string;
    nomor_telepon: string;
    email_supplier: string;
    alamat_supplier: string;
    kota_supplier: string;
    status_aktif: boolean;
}

export default function SupplierForm({ open, onClose, supplier }: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        nama_supplier: '',
        nama_kontak: '',
        nomor_telepon: '',
        email_supplier: '',
        alamat_supplier: '',
        kota_supplier: '',
        status_aktif: true,
    });

    const isEdit = !!supplier;

    useEffect(() => {
        if (open) {
            if (supplier) {
                // Edit mode
                setData({
                    nama_supplier: supplier.nama_supplier,
                    nama_kontak: supplier.nama_kontak || '',
                    nomor_telepon: supplier.nomor_telepon || '',
                    email_supplier: supplier.email_supplier || '',
                    alamat_supplier: supplier.alamat_supplier || '',
                    kota_supplier: supplier.kota_supplier || '',
                    status_aktif: supplier.status_aktif,
                });
            } else {
                // Create mode
                reset();
            }
            clearErrors();
        }
    }, [open, supplier]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && supplier) {
            put(route('admin.supplier.update', supplier.id), {
                onSuccess: () => {
                    toast.success('Supplier berhasil diperbarui');
                    onClose();
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat memperbarui supplier');
                }
            });
        } else {
            post(route('admin.supplier.store'), {
                onSuccess: () => {
                    toast.success('Supplier berhasil ditambahkan');
                    onClose();
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat menambahkan supplier');
                }
            });
        }
    };

    const handleClose = () => {
        if (!processing) {
            reset();
            clearErrors();
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TruckIcon className="h-5 w-5" />
                        {isEdit ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit 
                            ? 'Perbarui informasi supplier di bawah ini.' 
                            : 'Isi informasi supplier baru di bawah ini.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nama Supplier */}
                    <div className="space-y-2">
                        <Label htmlFor="nama_supplier" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Nama Supplier *
                        </Label>
                        <Input
                            id="nama_supplier"
                            value={data.nama_supplier}
                            onChange={(e) => setData('nama_supplier', e.target.value)}
                            placeholder="Masukkan nama perusahaan supplier"
                            className={errors.nama_supplier ? 'border-red-500' : ''}
                        />
                        {errors.nama_supplier && (
                            <p className="text-sm text-red-500">{errors.nama_supplier}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Nama Kontak */}
                        <div className="space-y-2">
                            <Label htmlFor="nama_kontak" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Nama Kontak (PIC)
                            </Label>
                            <Input
                                id="nama_kontak"
                                value={data.nama_kontak}
                                onChange={(e) => setData('nama_kontak', e.target.value)}
                                placeholder="Contoh: John Doe"
                                className={errors.nama_kontak ? 'border-red-500' : ''}
                            />
                            {errors.nama_kontak && (
                                <p className="text-sm text-red-500">{errors.nama_kontak}</p>
                            )}
                        </div>

                        {/* Nomor Telepon */}
                        <div className="space-y-2">
                            <Label htmlFor="nomor_telepon" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Nomor Telepon
                            </Label>
                            <Input
                                id="nomor_telepon"
                                value={data.nomor_telepon}
                                onChange={(e) => setData('nomor_telepon', e.target.value)}
                                placeholder="Contoh: 021-1234567"
                                className={errors.nomor_telepon ? 'border-red-500' : ''}
                            />
                            {errors.nomor_telepon && (
                                <p className="text-sm text-red-500">{errors.nomor_telepon}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email_supplier" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Supplier
                            </Label>
                            <Input
                                id="email_supplier"
                                type="email"
                                value={data.email_supplier}
                                onChange={(e) => setData('email_supplier', e.target.value)}
                                placeholder="Contoh: supplier@company.com"
                                className={errors.email_supplier ? 'border-red-500' : ''}
                            />
                            {errors.email_supplier && (
                                <p className="text-sm text-red-500">{errors.email_supplier}</p>
                            )}
                        </div>

                        {/* Kota */}
                        <div className="space-y-2">
                            <Label htmlFor="kota_supplier" className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Kota
                            </Label>
                            <Input
                                id="kota_supplier"
                                value={data.kota_supplier}
                                onChange={(e) => setData('kota_supplier', e.target.value)}
                                placeholder="Contoh: Jakarta"
                                className={errors.kota_supplier ? 'border-red-500' : ''}
                            />
                            {errors.kota_supplier && (
                                <p className="text-sm text-red-500">{errors.kota_supplier}</p>
                            )}
                        </div>
                    </div>

                    {/* Alamat */}
                    <div className="space-y-2">
                        <Label htmlFor="alamat_supplier" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Alamat Lengkap
                        </Label>
                        <Textarea
                            id="alamat_supplier"
                            value={data.alamat_supplier}
                            onChange={(e) => setData('alamat_supplier', e.target.value)}
                            placeholder="Masukkan alamat lengkap supplier"
                            className={errors.alamat_supplier ? 'border-red-500' : ''}
                            rows={3}
                        />
                        {errors.alamat_supplier && (
                            <p className="text-sm text-red-500">{errors.alamat_supplier}</p>
                        )}
                    </div>

                    {/* Status Aktif */}
                    <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                        <Switch
                            id="status_aktif"
                            checked={data.status_aktif}
                            onCheckedChange={(checked) => setData('status_aktif', checked)}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="status_aktif" className="text-sm font-medium">
                                Status Aktif
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Supplier aktif dapat digunakan untuk transaksi pembelian
                            </p>
                        </div>
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
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                        >
                            {processing ? 'Menyimpan...' : (isEdit ? 'Perbarui' : 'Simpan')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
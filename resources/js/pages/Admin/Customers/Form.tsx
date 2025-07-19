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
import { Mail, Phone, User } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    kode_pelanggan: string;
    nama_pelanggan: string;
    nomor_telepon: string;
    email_pelanggan: string;
    alamat_pelanggan: string;
    status_aktif: boolean;
}

interface Props {
    open: boolean;
    onClose: () => void;
    customer?: Customer | null;
}

interface FormData {
    nama_pelanggan: string;
    nomor_telepon: string;
    email_pelanggan: string;
    alamat_pelanggan: string;
    status_aktif: boolean;
}

export default function CustomerForm({ open, onClose, customer }: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        nama_pelanggan: '',
        nomor_telepon: '',
        email_pelanggan: '',
        alamat_pelanggan: '',
        status_aktif: true,
    });

    const isEdit = !!customer;

    useEffect(() => {
        if (open) {
            if (customer) {
                // Edit mode
                setData({
                    nama_pelanggan: customer.nama_pelanggan,
                    nomor_telepon: customer.nomor_telepon || '',
                    email_pelanggan: customer.email_pelanggan || '',
                    alamat_pelanggan: customer.alamat_pelanggan || '',
                    status_aktif: customer.status_aktif,
                });
            } else {
                // Create mode
                reset();
            }
            clearErrors();
        }
    }, [open, customer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && customer) {
            put(route('admin.pelanggan.update', customer.id), {
                onSuccess: () => {
                    toast.success('Pelanggan berhasil diperbarui');
                    onClose();
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat memperbarui pelanggan');
                }
            });
        } else {
            post(route('admin.pelanggan.store'), {
                onSuccess: () => {
                    toast.success('Pelanggan berhasil ditambahkan');
                    onClose();
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat menambahkan pelanggan');
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
                        <User className="h-5 w-5" />
                        {isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit 
                            ? 'Perbarui informasi pelanggan di bawah ini.' 
                            : 'Isi informasi pelanggan baru di bawah ini.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nama Pelanggan */}
                    <div className="space-y-2">
                        <Label htmlFor="nama_pelanggan" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Nama Pelanggan *
                        </Label>
                        <Input
                            id="nama_pelanggan"
                            value={data.nama_pelanggan}
                            onChange={(e) => setData('nama_pelanggan', e.target.value)}
                            placeholder="Masukkan nama lengkap pelanggan"
                            className={errors.nama_pelanggan ? 'border-red-500' : ''}
                        />
                        {errors.nama_pelanggan && (
                            <p className="text-sm text-red-500">{errors.nama_pelanggan}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                                placeholder="Contoh: 081234567890"
                                className={errors.nomor_telepon ? 'border-red-500' : ''}
                            />
                            {errors.nomor_telepon && (
                                <p className="text-sm text-red-500">{errors.nomor_telepon}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email_pelanggan" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </Label>
                            <Input
                                id="email_pelanggan"
                                type="email"
                                value={data.email_pelanggan}
                                onChange={(e) => setData('email_pelanggan', e.target.value)}
                                placeholder="Contoh: customer@email.com"
                                className={errors.email_pelanggan ? 'border-red-500' : ''}
                            />
                            {errors.email_pelanggan && (
                                <p className="text-sm text-red-500">{errors.email_pelanggan}</p>
                            )}
                        </div>
                    </div>

                    {/* Alamat */}
                    <div className="space-y-2">
                        <Label htmlFor="alamat_pelanggan">Alamat</Label>
                        <Textarea
                            id="alamat_pelanggan"
                            value={data.alamat_pelanggan}
                            onChange={(e) => setData('alamat_pelanggan', e.target.value)}
                            placeholder="Masukkan alamat lengkap"
                            className={errors.alamat_pelanggan ? 'border-red-500' : ''}
                            rows={3}
                        />
                        {errors.alamat_pelanggan && (
                            <p className="text-sm text-red-500">{errors.alamat_pelanggan}</p>
                        )}
                    </div>

                    {/* Status Aktif */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="status_aktif"
                            checked={data.status_aktif}
                            onCheckedChange={(checked) => setData('status_aktif', checked)}
                        />
                        <Label htmlFor="status_aktif">Status Aktif</Label>
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
                            {processing ? 'Menyimpan...' : (isEdit ? 'Perbarui' : 'Simpan')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
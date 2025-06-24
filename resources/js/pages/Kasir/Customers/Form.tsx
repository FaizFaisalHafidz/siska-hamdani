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
import { Calendar, Crown, Mail, Phone, Shield, User } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    kode_pelanggan: string;
    nama_pelanggan: string;
    nomor_telepon: string;
    email_pelanggan: string;
    alamat_pelanggan: string;
    tanggal_lahir: string | null;
    jenis_kelamin: string;
    jenis_pelanggan: string;
    status_aktif: boolean;
}

interface Props {
    open: boolean;
    onClose: () => void;
    customer?: Customer | null;
    isKasir?: boolean;
}

interface FormData {
    nama_pelanggan: string;
    nomor_telepon: string;
    email_pelanggan: string;
    alamat_pelanggan: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    jenis_pelanggan: string;
    status_aktif: boolean;
}

export default function CustomerForm({ open, onClose, customer, isKasir = false }: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        nama_pelanggan: '',
        nomor_telepon: '',
        email_pelanggan: '',
        alamat_pelanggan: '',
        tanggal_lahir: '',
        jenis_kelamin: '',
        jenis_pelanggan: 'reguler',
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
                    tanggal_lahir: customer.tanggal_lahir ? new Date(customer.tanggal_lahir).toISOString().split('T')[0] : '',
                    jenis_kelamin: customer.jenis_kelamin || '',
                    jenis_pelanggan: customer.jenis_pelanggan,
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

        const routePrefix = isKasir ? 'kasir' : 'admin';

        if (isEdit && customer) {
            put(route(`${routePrefix}.pelanggan.update`, customer.id), {
                onSuccess: () => {
                    toast.success('Pelanggan berhasil diperbarui');
                    onClose();
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat memperbarui pelanggan');
                }
            });
        } else {
            post(route(`${routePrefix}.pelanggan.store`), {
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

                    <div className="grid grid-cols-2 gap-4">
                        {/* Tanggal Lahir */}
                        <div className="space-y-2">
                            <Label htmlFor="tanggal_lahir" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Tanggal Lahir
                            </Label>
                            <Input
                                id="tanggal_lahir"
                                type="date"
                                value={data.tanggal_lahir}
                                onChange={(e) => setData('tanggal_lahir', e.target.value)}
                                className={errors.tanggal_lahir ? 'border-red-500' : ''}
                            />
                            {errors.tanggal_lahir && (
                                <p className="text-sm text-red-500">{errors.tanggal_lahir}</p>
                            )}
                        </div>

                        {/* Jenis Kelamin */}
                        <div className="space-y-2">
                            <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                            <select
                                id="jenis_kelamin"
                                value={data.jenis_kelamin}
                                onChange={(e) => setData('jenis_kelamin', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                                    errors.jenis_kelamin ? 'border-red-500' : 'border-input'
                                } focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent`}
                            >
                                <option value="">Pilih jenis kelamin</option>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                            {errors.jenis_kelamin && (
                                <p className="text-sm text-red-500">{errors.jenis_kelamin}</p>
                            )}
                        </div>
                    </div>

                    {/* Jenis Pelanggan - Simplified for Kasir */}
                    <div className="space-y-2">
                        <Label htmlFor="jenis_pelanggan">Jenis Pelanggan *</Label>
                        {isKasir ? (
                            // Kasir hanya bisa memilih Reguler dan Member
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { value: 'reguler', label: 'Reguler', icon: <User className="w-4 h-4" />, color: 'border-gray-300' },
                                    { value: 'member', label: 'Member', icon: <Shield className="w-4 h-4" />, color: 'border-blue-300' },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            data.jenis_pelanggan === option.value
                                                ? `${option.color} bg-opacity-10`
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="jenis_pelanggan"
                                            value={option.value}
                                            checked={data.jenis_pelanggan === option.value}
                                            onChange={(e) => setData('jenis_pelanggan', e.target.value)}
                                            className="sr-only"
                                        />
                                        {option.icon}
                                        <span className="font-medium">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            // Admin bisa memilih semua tipe
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { value: 'reguler', label: 'Reguler', icon: <User className="w-4 h-4" />, color: 'border-gray-300' },
                                    { value: 'member', label: 'Member', icon: <Shield className="w-4 h-4" />, color: 'border-blue-300' },
                                    { value: 'vip', label: 'VIP', icon: <Crown className="w-4 h-4" />, color: 'border-yellow-300' },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            data.jenis_pelanggan === option.value
                                                ? `${option.color} bg-opacity-10`
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="jenis_pelanggan"
                                            value={option.value}
                                            checked={data.jenis_pelanggan === option.value}
                                            onChange={(e) => setData('jenis_pelanggan', e.target.value)}
                                            className="sr-only"
                                        />
                                        {option.icon}
                                        <span className="font-medium">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {isKasir && (
                            <p className="text-xs text-muted-foreground">
                                Catatan: Untuk upgrade ke VIP, hubungi Admin
                            </p>
                        )}
                        {errors.jenis_pelanggan && (
                            <p className="text-sm text-red-500">{errors.jenis_pelanggan}</p>
                        )}
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
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className={isKasir ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {processing ? 'Menyimpan...' : (isEdit ? 'Perbarui' : 'Simpan')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
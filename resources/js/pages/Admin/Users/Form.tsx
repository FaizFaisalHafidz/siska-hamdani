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
import { Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    kode_user: string;
    name: string;
    nama_lengkap: string;
    email: string;
    nomor_telepon: string;
    alamat: string;
    status_aktif: boolean;
    current_role: string;
}

interface Role {
    id: number;
    name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    user?: User | null;
    roles: Role[];
}

interface FormData {
    name: string;
    nama_lengkap: string;
    email: string;
    password: string;
    password_confirmation: string;
    nomor_telepon: string;
    alamat: string;
    role: string;
    status_aktif: boolean;
}

export default function UserForm({ open, onClose, user, roles }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        name: '',
        nama_lengkap: '',
        email: '',
        password: '',
        password_confirmation: '',
        nomor_telepon: '',
        alamat: '',
        role: '',
        status_aktif: true,
    });

    const isEdit = !!user;

    useEffect(() => {
        if (open) {
            if (user) {
                // Edit mode
                setData({
                    name: user.name,
                    nama_lengkap: user.nama_lengkap,
                    email: user.email,
                    password: '',
                    password_confirmation: '',
                    nomor_telepon: user.nomor_telepon || '',
                    alamat: user.alamat || '',
                    role: user.current_role,
                    status_aktif: user.status_aktif,
                });
            } else {
                // Create mode
                reset();
            }
            clearErrors();
        }
    }, [open, user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = { ...data };
        
        // Remove password fields if empty in edit mode
        if (isEdit && !data.password) {
            delete submitData.password;
            delete submitData.password_confirmation;
        }

        if (isEdit && user) {
            put(route('admin.users.update', user.id), {
                onSuccess: () => {
                    toast.success('User berhasil diperbarui');
                    onClose();
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat memperbarui user');
                }
            });
        } else {
            post(route('admin.users.store'), {
                onSuccess: () => {
                    toast.success('User berhasil ditambahkan');
                    onClose();
                },
                onError: () => {
                    toast.error('Terjadi kesalahan saat menambahkan user');
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit User' : 'Tambah User Baru'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit 
                            ? 'Perbarui informasi user di bawah ini.' 
                            : 'Isi informasi user baru di bawah ini.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Username *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Masukkan username"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    {/* Nama Lengkap */}
                    <div className="space-y-2">
                        <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                        <Input
                            id="nama_lengkap"
                            value={data.nama_lengkap}
                            onChange={(e) => setData('nama_lengkap', e.target.value)}
                            placeholder="Masukkan nama lengkap"
                            className={errors.nama_lengkap ? 'border-red-500' : ''}
                        />
                        {errors.nama_lengkap && (
                            <p className="text-sm text-red-500">{errors.nama_lengkap}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Masukkan email"
                            className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            Password {!isEdit && '*'}
                            {isEdit && (
                                <span className="text-sm font-normal text-muted-foreground">
                                    (Kosongkan jika tidak ingin mengubah)
                                </span>
                            )}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Masukkan password"
                                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password}</p>
                        )}
                    </div>

                    {/* Password Confirmation */}
                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">
                            Konfirmasi Password {!isEdit && '*'}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type={showPasswordConfirmation ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Konfirmasi password"
                                className={errors.password_confirmation ? 'border-red-500 pr-10' : 'pr-10'}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                            >
                                {showPasswordConfirmation ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {errors.password_confirmation && (
                            <p className="text-sm text-red-500">{errors.password_confirmation}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <select
                            id="role"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                                errors.role ? 'border-red-500' : 'border-input'
                            } focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent`}
                        >
                            <option value="">Pilih role</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.name}>
                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                </option>
                            ))}
                        </select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role}</p>
                        )}
                    </div>

                    {/* Nomor Telepon */}
                    <div className="space-y-2">
                        <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                        <Input
                            id="nomor_telepon"
                            value={data.nomor_telepon}
                            onChange={(e) => setData('nomor_telepon', e.target.value)}
                            placeholder="Masukkan nomor telepon"
                            className={errors.nomor_telepon ? 'border-red-500' : ''}
                        />
                        {errors.nomor_telepon && (
                            <p className="text-sm text-red-500">{errors.nomor_telepon}</p>
                        )}
                    </div>

                    {/* Alamat */}
                    <div className="space-y-2">
                        <Label htmlFor="alamat">Alamat</Label>
                        <Textarea
                            id="alamat"
                            value={data.alamat}
                            onChange={(e) => setData('alamat', e.target.value)}
                            placeholder="Masukkan alamat"
                            className={errors.alamat ? 'border-red-500' : ''}
                            rows={3}
                        />
                        {errors.alamat && (
                            <p className="text-sm text-red-500">{errors.alamat}</p>
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
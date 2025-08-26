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
import { router, useForm } from '@inertiajs/react';
import { ImagePlus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Product {
    id: number;
    kode_produk: string;
    nama_produk: string;
    deskripsi_produk: string | null;
    kategori_id?: number; // From direct edit
    kategori?: { // From index list
        id: number;
        nama: string;
    };
    harga_jual: number;
    harga_beli: number | null;
    stok_tersedia: number;
    stok_minimum: number;
    satuan: string;
    merk_produk: string | null;
    gambar_produk: string | null;
    status_aktif: boolean;
}

interface Kategori {
    id: number;
    nama_kategori: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    product?: Product | null;
    kategoris: Kategori[];
}

interface FormData {
    nama_produk: string;
    deskripsi_produk: string;
    kategori_id: string;
    harga_jual: string;
    harga_beli: string;
    stok_tersedia: string;
    stok_minimum: string;
    satuan: string;
    merk_produk: string;
    gambar_produk: File | null;
    status_aktif: boolean;
    _method?: string; // For Laravel method spoofing
    [key: string]: any; // Add index signature
}

export default function ProductForm({ open, onClose, product, kategoris }: Props) {
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        nama_produk: '',
        deskripsi_produk: '',
        kategori_id: '',
        harga_jual: '',
        harga_beli: '',
        stok_tersedia: '',
        stok_minimum: '',
        satuan: '',
        merk_produk: '',
        gambar_produk: null,
        status_aktif: true,
    });

    const isEdit = !!product;

    useEffect(() => {
        if (open) {
            clearErrors(); // Clear errors first
            
            if (product) {
                // Edit mode - Add null checks and provide fallbacks
                // Handle both kategori_id (direct edit) and kategori.id (from index list)
                const kategoriId = product.kategori_id || product.kategori?.id;
                
                setData({
                    nama_produk: product.nama_produk || '',
                    deskripsi_produk: product.deskripsi_produk || '',
                    kategori_id: kategoriId ? kategoriId.toString() : '',
                    harga_jual: product.harga_jual ? product.harga_jual.toString() : '',
                    harga_beli: product.harga_beli ? product.harga_beli.toString() : '',
                    stok_tersedia: product.stok_tersedia ? product.stok_tersedia.toString() : '0',
                    stok_minimum: product.stok_minimum ? product.stok_minimum.toString() : '1',
                    satuan: product.satuan || '',
                    merk_produk: product.merk_produk || '',
                    gambar_produk: null,
                    status_aktif: product.status_aktif ?? true,
                });
                setPreview(product.gambar_produk || null);
                
                // Clear errors again after data is set
                setTimeout(() => {
                    clearErrors();
                }, 100);
            } else {
                // Create mode
                reset();
                setPreview(null);
            }
        }
    }, [open, product]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('gambar_produk', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setData('gambar_produk', null);
        setPreview(null);
        
        // Reset file input
        const fileInput = document.getElementById('gambar_produk') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && product) {
            // Add _method for Laravel method spoofing
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (key === 'gambar_produk' && data[key]) {
                    formData.append(key, data[key] as File);
                } else if (data[key] !== null && data[key] !== undefined) {
                    // Convert boolean to string properly for Laravel
                    if (key === 'status_aktif') {
                        formData.append(key, data[key] ? '1' : '0');
                    } else {
                        formData.append(key, data[key].toString());
                    }
                }
            });
            formData.append('_method', 'PUT');
            
            // Use router.post for manual FormData
            router.post(route('admin.produk.update', product.id), formData, {
                onBefore: () => {
                    console.log('Submitting edit form with FormData');
                },
                onSuccess: () => {
                    toast.success('Produk berhasil diperbarui');
                    onClose();
                },
                onError: (errors: Record<string, string>) => {
                    console.log('Edit form errors:', errors);
                    toast.error('Terjadi kesalahan saat memperbarui produk');
                }
            });
        } else {
            post(route('admin.produk.store'), {
                forceFormData: true,
                onBefore: () => {
                    console.log('Submitting create form with data:', data);
                },
                onSuccess: () => {
                    toast.success('Produk berhasil ditambahkan');
                    onClose();
                },
                onError: (errors: Record<string, string>) => {
                    console.log('Create form errors:', errors);
                    toast.error('Terjadi kesalahan saat menambahkan produk');
                }
            });
        }
    };

    const handleClose = () => {
        if (!processing) {
            reset();
            clearErrors();
            setPreview(null);
            onClose();
        }
    };

    // Don't show validation errors when form is being populated with data
    const shouldShowError = (field: keyof FormData) => {
        // In edit mode, only show errors after user interaction
        if (isEdit) {
            // Don't show errors for fields that have values (populated from existing data)
            const value = data[field];
            const fieldName = field as string;
            
            if (fieldName === 'kategori_id') {
                // For kategori_id, don't show error if it has a valid numeric value
                return !value || value === '' ? !!errors[field] : false;
            }
            // For other required fields, don't show error if they have content
            if (['nama_produk', 'harga_jual', 'stok_minimum', 'satuan'].includes(fieldName)) {
                return !value || value === '' ? !!errors[field] : false;
            }
            // For optional fields, never show error in edit mode if they have any value
            return false;
        }
        // In create mode, show all errors normally
        return !!errors[field];
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit 
                            ? 'Perbarui informasi produk di bawah ini.' 
                            : 'Isi informasi produk baru di bawah ini.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Gambar Produk</Label>
                        <div className="flex items-center space-x-4">
                            {preview ? (
                                <div className="relative">
                                    <img 
                                        src={preview} 
                                        alt="Preview" 
                                        className="w-24 h-24 object-cover rounded-lg border"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                        onClick={removeImage}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <ImagePlus className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1">
                                <Input
                                    id="gambar_produk"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className={shouldShowError('gambar_produk') ? 'border-red-500' : ''}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Format: JPG, PNG, GIF. Maksimal 2MB
                                </p>
                            </div>
                        </div>
                        {shouldShowError('gambar_produk') && (
                            <p className="text-sm text-red-500">{errors.gambar_produk}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Nama Produk */}
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="nama_produk">Nama Produk *</Label>
                            <Input
                                id="nama_produk"
                                value={data.nama_produk}
                                onChange={(e) => setData('nama_produk', e.target.value)}
                                placeholder="Masukkan nama produk"
                                className={shouldShowError('nama_produk') ? 'border-red-500' : ''}
                            />
                            {shouldShowError('nama_produk') && (
                                <p className="text-sm text-red-500">{errors.nama_produk}</p>
                            )}
                        </div>

                        {/* Kategori */}
                        <div className="space-y-2">
                            <Label htmlFor="kategori_id">Kategori *</Label>
                            <select
                                id="kategori_id"
                                value={data.kategori_id}
                                onChange={(e) => setData('kategori_id', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                                    shouldShowError('kategori_id') ? 'border-red-500' : 'border-input'
                                } focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent`}
                            >
                                <option value="">Pilih kategori</option>
                                {kategoris.map((kategori) => (
                                    <option key={kategori.id} value={kategori.id}>
                                        {kategori.nama_kategori}
                                    </option>
                                ))}
                            </select>
                            {shouldShowError('kategori_id') && (
                                <p className="text-sm text-red-500">{errors.kategori_id}</p>
                            )}
                        </div>

                        {/* Merk */}
                        <div className="space-y-2">
                            <Label htmlFor="merk_produk">Merk</Label>
                            <Input
                                id="merk_produk"
                                value={data.merk_produk}
                                onChange={(e) => setData('merk_produk', e.target.value)}
                                placeholder="Masukkan merk produk"
                                className={shouldShowError('merk_produk') ? 'border-red-500' : ''}
                            />
                            {shouldShowError('merk_produk') && (
                                <p className="text-sm text-red-500">{errors.merk_produk}</p>
                            )}
                        </div>

                        {/* Harga Jual */}
                        <div className="space-y-2">
                            <Label htmlFor="harga_jual">Harga Jual *</Label>
                            <Input
                                id="harga_jual"
                                type="number"
                                value={data.harga_jual}
                                onChange={(e) => setData('harga_jual', e.target.value)}
                                placeholder="0"
                                className={shouldShowError('harga_jual') ? 'border-red-500' : ''}
                            />
                            {shouldShowError('harga_jual') && (
                                <p className="text-sm text-red-500">{errors.harga_jual}</p>
                            )}
                        </div>

                        {/* Harga Beli */}
                        <div className="space-y-2">
                            <Label htmlFor="harga_beli">Harga Beli</Label>
                            <Input
                                id="harga_beli"
                                type="number"
                                value={data.harga_beli}
                                onChange={(e) => setData('harga_beli', e.target.value)}
                                placeholder="0"
                                className={shouldShowError('harga_beli') ? 'border-red-500' : ''}
                            />
                            {shouldShowError('harga_beli') && (
                                <p className="text-sm text-red-500">{errors.harga_beli}</p>
                            )}
                        </div>

                        {/* Stok Tersedia (hanya untuk create) */}
                        {!isEdit && (
                            <div className="space-y-2">
                                <Label htmlFor="stok_tersedia">Stok Awal *</Label>
                                <Input
                                    id="stok_tersedia"
                                    type="number"
                                    value={data.stok_tersedia}
                                    onChange={(e) => setData('stok_tersedia', e.target.value)}
                                    placeholder="0"
                                    className={shouldShowError('stok_tersedia') ? 'border-red-500' : ''}
                                />
                                {shouldShowError('stok_tersedia') && (
                                    <p className="text-sm text-red-500">{errors.stok_tersedia}</p>
                                )}
                            </div>
                        )}

                        {/* Stok Minimum */}
                        <div className="space-y-2">
                            <Label htmlFor="stok_minimum">Stok Minimum *</Label>
                            <Input
                                id="stok_minimum"
                                type="number"
                                value={data.stok_minimum}
                                onChange={(e) => setData('stok_minimum', e.target.value)}
                                placeholder="1"
                                className={shouldShowError('stok_minimum') ? 'border-red-500' : ''}
                            />
                            {shouldShowError('stok_minimum') && (
                                <p className="text-sm text-red-500">{errors.stok_minimum}</p>
                            )}
                        </div>

                        {/* Satuan */}
                        <div className="space-y-2">
                            <Label htmlFor="satuan">Satuan *</Label>
                            <Input
                                id="satuan"
                                value={data.satuan}
                                onChange={(e) => setData('satuan', e.target.value)}
                                placeholder="pcs, kg, liter, dll"
                                className={shouldShowError('satuan') ? 'border-red-500' : ''}
                            />
                            {shouldShowError('satuan') && (
                                <p className="text-sm text-red-500">{errors.satuan}</p>
                            )}
                        </div>
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-2">
                        <Label htmlFor="deskripsi_produk">Deskripsi</Label>
                        <Textarea
                            id="deskripsi_produk"
                            value={data.deskripsi_produk}
                            onChange={(e) => setData('deskripsi_produk', e.target.value)}
                            placeholder="Masukkan deskripsi produk"
                            className={shouldShowError('deskripsi_produk') ? 'border-red-500' : ''}
                            rows={3}
                        />
                        {shouldShowError('deskripsi_produk') && (
                            <p className="text-sm text-red-500">{errors.deskripsi_produk}</p>
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
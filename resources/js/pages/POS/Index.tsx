import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Calculator,
    DollarSign,
    Gift,
    Minus,
    Package,
    Percent,
    Plus,
    Receipt,
    Search,
    ShoppingCart,
    Trash2,
    TrendingUp,
    Users,
    X
} from 'lucide-react';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import CustomerSelector from './components/CustomerSelector';
import PaymentDialog from './components/PaymentDialog';
import ProductCard from './components/ProductCard';
import ReceiptDialog from './components/ReceiptDialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Point of Sale',
        href: '/pos',
    },
];

interface Product {
    id: number;
    kode_produk: string;
    nama_produk: string;
    kategori_id: number;
    kategori_nama: string;
    harga_jual: number;
    harga_jual_format: string;
    stok_tersedia: number;
    gambar_produk: string;
    deskripsi_produk: string;
    satuan: string;
    merk_produk: string;
}

interface Customer {
    id: number;
    kode: string;
    nama: string;
    telepon: string;
    jenis: string;
    display: string;
}

interface Category {
    id: number;
    nama: string;
}

interface CartItem {
    id: number;
    product: Product;
    quantity: number;
    price: number;
    discount: number;
    note: string;
    subtotal: number;
}

interface TodayStats {
    total_transaksi: number;
    total_penjualan: number;
    total_penjualan_format: string;
    total_item_terjual: number;
}

interface Props {
    products: Product[];
    categories: Category[];
    customers: Customer[];
    todayStats: TodayStats;
    userRole: string;
    filters: {
        search?: string;
        kategori?: string;
    };
}

export default function POSIndex({ products, categories, customers, todayStats, userRole, filters }: Props) {
    // State management
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.kategori || '');
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [taxPercent, setTaxPercent] = useState<number>(0);
    const [note, setNote] = useState('');

    // Dialog states
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [lastTransactionId, setLastTransactionId] = useState<number | null>(null);

    // Helper function to ensure number
    const ensureNumber = (value: any): number => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };

    // Helper function to format currency
    const formatCurrency = (amount: number): string => {
        const validAmount = ensureNumber(amount);
        return validAmount.toLocaleString('id-ID');
    };

    // Calculations with proper validation
    const subtotal = cart.reduce((sum, item) => {
        const itemSubtotal = ensureNumber(item.subtotal);
        return sum + itemSubtotal;
    }, 0);

    const discountValue = ensureNumber(discountAmount) || (subtotal * ensureNumber(discountPercent) / 100);
    const afterDiscount = Math.max(0, subtotal - discountValue);
    const taxValue = afterDiscount * ensureNumber(taxPercent) / 100;
    const total = afterDiscount + taxValue;
    const totalItems = cart.reduce((sum, item) => sum + ensureNumber(item.quantity), 0);

    // Filtered products
    const filteredProducts = products.filter(product => {
        const matchesSearch = !searchTerm || 
            product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.kode_produk.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = !selectedCategory || product.kategori_id.toString() === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    // Add product to cart
    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
            if (existingItem.quantity >= product.stok_tersedia) {
                toast.error(`Stok ${product.nama_produk} tidak mencukupi!`);
                return;
            }
            updateCartItem(existingItem.id, { quantity: existingItem.quantity + 1 });
        } else {
            const newItem: CartItem = {
                id: Date.now(),
                product,
                quantity: 1,
                price: ensureNumber(product.harga_jual),
                discount: 0,
                note: '',
                subtotal: ensureNumber(product.harga_jual)
            };
            setCart([...cart, newItem]);
        }
        
        toast.success(`${product.nama_produk} ditambahkan ke keranjang`);
    };

    // Update cart item with proper calculation
    const updateCartItem = (itemId: number, updates: Partial<CartItem>) => {
        setCart(cart.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, ...updates };
                const quantity = ensureNumber(updatedItem.quantity);
                const price = ensureNumber(updatedItem.price);
                const discount = ensureNumber(updatedItem.discount);
                
                updatedItem.subtotal = Math.max(0, (quantity * price) - discount);
                return updatedItem;
            }
            return item;
        }));
    };

    // Remove from cart
    const removeFromCart = (itemId: number) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        setDiscountPercent(0);
        setDiscountAmount(0);
        setTaxPercent(0);
        setNote('');
        toast.success('Keranjang berhasil dikosongkan');
    };

    // Handle search
    const handleSearch = () => {
        router.get('/pos', {
            search: searchTerm,
            kategori: selectedCategory,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Get CSRF token helper
    const getCSRFToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) {
            console.error('CSRF token not found');
            toast.error('Session expired. Please refresh the page.');
            return null;
        }
        return token;
    };

    // Process payment with better error handling
    const processPayment = async (paymentData: any) => {
        if (cart.length === 0) {
            toast.error('Keranjang masih kosong!');
            return;
        }

        // Validate totals before sending
        if (isNaN(total) || total <= 0) {
            toast.error('Total pembayaran tidak valid!');
            return;
        }

        const csrfToken = getCSRFToken();
        if (!csrfToken) {
            return;
        }

        const transactionData = {
            _token: csrfToken, // Add explicit CSRF token
            pelanggan_id: selectedCustomer?.id || null,
            items: cart.map(item => ({
                produk_id: item.product.id,
                jumlah: ensureNumber(item.quantity),
                harga_satuan: ensureNumber(item.price),
                diskon_item: ensureNumber(item.discount),
                catatan_item: item.note || null,
            })),
            diskon_persen: ensureNumber(discountPercent),
            diskon_nominal: ensureNumber(discountAmount),
            pajak_persen: ensureNumber(taxPercent),
            metode_pembayaran: paymentData.method,
            jumlah_dibayar: ensureNumber(paymentData.amount),
            catatan_penjualan: note || null,
        };

        try {
            const response = await fetch('/pos/transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify(transactionData),
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If not JSON, it might be a redirect (419 error page)
                if (response.status === 419) {
                    toast.error('Session expired. Please refresh the page.');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                    return;
                }
                throw new Error(`Server returned non-JSON response: ${response.status}`);
            }

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success('Transaksi berhasil diproses!');
                setLastTransactionId(result.data.penjualan_id);
                setPaymentDialogOpen(false);
                setReceiptDialogOpen(true);
                clearCart();
            } else {
                toast.error(result.message || 'Terjadi kesalahan saat memproses transaksi');
            }
        } catch (error) {
            console.error('Transaction error:', error);
            
            if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
                toast.error('Session expired. Please refresh the page.');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                toast.error('Terjadi kesalahan saat memproses transaksi');
            }
        }
    };

    // Handle discount input changes
    const handleDiscountPercentChange = (value: string) => {
        const numValue = ensureNumber(value);
        setDiscountPercent(Math.min(100, Math.max(0, numValue)));
        setDiscountAmount(0); // Reset nominal discount
    };

    const handleDiscountAmountChange = (value: string) => {
        const numValue = ensureNumber(value);
        setDiscountAmount(Math.max(0, numValue));
        setDiscountPercent(0); // Reset percent discount
    };

    const handleTaxPercentChange = (value: string) => {
        const numValue = ensureNumber(value);
        setTaxPercent(Math.min(100, Math.max(0, numValue)));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Point of Sale" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="container mx-auto p-4 lg:p-6">
                    {/* Header Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium">Transaksi Hari Ini</p>
                                        <p className="text-2xl font-bold">{todayStats.total_transaksi}</p>
                                    </div>
                                    <Receipt className="h-8 w-8 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm font-medium">Penjualan Hari Ini</p>
                                        <p className="text-xl font-bold">{todayStats.total_penjualan_format}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm font-medium">Item Terjual</p>
                                        <p className="text-2xl font-bold">{todayStats.total_item_terjual}</p>
                                    </div>
                                    <Package className="h-8 w-8 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-orange-100 text-sm font-medium">Keranjang</p>
                                        <p className="text-2xl font-bold">{totalItems}</p>
                                    </div>
                                    <ShoppingCart className="h-8 w-8 text-orange-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Products Section */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Search and Filters */}
                            <Card className="shadow-lg border-0">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Produk
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                <Input
                                                    placeholder="Cari produk atau kode..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="px-3 py-2 border rounded-md bg-white min-w-[150px]"
                                        >
                                            <option value="">Semua Kategori</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>{category.nama}</option>
                                            ))}
                                        </select>

                                        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Products Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={() => addToCart(product)}
                                        inCart={cart.some(item => item.product.id === product.id)}
                                    />
                                ))}
                            </div>

                            {filteredProducts.length === 0 && (
                                <Card className="p-8 text-center">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Tidak ada produk ditemukan</p>
                                </Card>
                            )}
                        </div>

                        {/* Cart Section */}
                        <div className="space-y-6">
                            {/* Customer Selection */}
                            <Card className="shadow-lg border-0">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Pelanggan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CustomerSelector
                                        customers={customers}
                                        selectedCustomer={selectedCustomer}
                                        onCustomerSelect={setSelectedCustomer}
                                    />
                                </CardContent>
                            </Card>

                            {/* Cart */}
                            <Card className="shadow-lg border-0">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <ShoppingCart className="h-5 w-5" />
                                            Keranjang ({totalItems})
                                        </CardTitle>
                                        {cart.length > 0 && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={clearCart}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {cart.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Keranjang masih kosong</p>
                                            <p className="text-sm">Pilih produk untuk mulai transaksi</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-64">
                                            <div className="space-y-3">
                                                {cart.map((item) => (
                                                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-sm">{item.product.nama_produk}</h4>
                                                                <p className="text-xs text-gray-500">{item.product.kode_produk}</p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </Button>
                                                                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (item.quantity < item.product.stok_tersedia) {
                                                                            updateCartItem(item.id, { quantity: item.quantity + 1 });
                                                                        } else {
                                                                            toast.error('Stok tidak mencukupi!');
                                                                        }
                                                                    }}
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium">
                                                                    Rp {formatCurrency(item.subtotal)}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    @ Rp {formatCurrency(item.price)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Discount & Tax */}
                            {cart.length > 0 && (
                                <Card className="shadow-lg border-0">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2">
                                            <Gift className="h-5 w-5" />
                                            Diskon & Pajak
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Diskon (%)</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={discountPercent}
                                                        onChange={(e) => handleDiscountPercentChange(e.target.value)}
                                                        className="pr-8"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                    />
                                                    <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Diskon (Rp)</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={discountAmount}
                                                        onChange={(e) => handleDiscountAmountChange(e.target.value)}
                                                        className="pr-8"
                                                        min="0"
                                                        step="1000"
                                                    />
                                                    <DollarSign className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <Label className="text-xs">Pajak (%)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={taxPercent}
                                                    onChange={(e) => handleTaxPercentChange(e.target.value)}
                                                    className="pr-8"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                />
                                                <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-xs">Catatan</Label>
                                            <Textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Catatan transaksi (opsional)"
                                                rows={2}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Summary & Checkout */}
                            {cart.length > 0 && (
                                <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
                                    <CardContent className="p-6">
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span>Subtotal:</span>
                                                <span>Rp {formatCurrency(subtotal)}</span>
                                            </div>
                                            {discountValue > 0 && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Diskon:</span>
                                                    <span>-Rp {formatCurrency(discountValue)}</span>
                                                </div>
                                            )}
                                            {taxValue > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span>Pajak:</span>
                                                    <span>Rp {formatCurrency(taxValue)}</span>
                                                </div>
                                            )}
                                            <Separator />
                                            <div className="flex justify-between text-lg font-bold">
                                                <span>Total:</span>
                                                <span>Rp {formatCurrency(total)}</span>
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            onClick={() => setPaymentDialogOpen(true)}
                                            disabled={isNaN(total) || total <= 0}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                                            size="lg"
                                        >
                                            <Calculator className="mr-2 h-5 w-5" />
                                            Proses Pembayaran
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment Dialog */}
                <PaymentDialog
                    open={paymentDialogOpen}
                    onClose={() => setPaymentDialogOpen(false)}
                    total={total}
                    onPayment={processPayment}
                />

                {/* Receipt Dialog */}
                <ReceiptDialog
                    open={receiptDialogOpen}
                    onClose={() => setReceiptDialogOpen(false)}
                    transactionId={lastTransactionId}
                />
            </div>

            <Toaster />
        </AppLayout>
    );
}
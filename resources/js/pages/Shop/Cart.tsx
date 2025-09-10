import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CreditCard, Minus, Plus, Shield, ShoppingCart, Trash2, Truck } from 'lucide-react';
import { useState } from 'react';

interface Product {
  id: number;
  kode_produk: string;
  nama_produk: string;
  kategori: {
    id: number;
    nama_kategori: string;
  };
  deskripsi_produk?: string;
  harga_jual: number;
  stok_tersedia: number;
  gambar_produk?: string;
  merk_produk?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface PromoCode {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_amount?: number;
}

interface Props {
  cartItems: CartItem[];
  availablePromoCodes: PromoCode[];
  shippingOptions: {
    id: number;
    name: string;
    price: number;
    estimated_days: string;
  }[];
}

export default function CartPage({ cartItems = [], availablePromoCodes = [], shippingOptions = [] }: Props) {
  const { auth } = usePage().props as any;
  const [cart, setCart] = useState<CartItem[]>(cartItems);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    try {
      const response = await fetch(`/api/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: newQuantity
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cartItems);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (productId: number) => {
    try {
      const response = await fetch(`/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cartItems || []);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const applyPromoCode = () => {
    const promo = availablePromoCodes.find(p => p.code.toLowerCase() === promoCode.toLowerCase());
    if (promo) {
      const subtotal = getSubtotal();
      if (promo.minimum_amount && subtotal < promo.minimum_amount) {
        alert(`Minimum pembelian untuk kode promo ini adalah ${formatPrice(promo.minimum_amount)}`);
        return;
      }
      setAppliedPromo(promo);
      setPromoCode('');
    } else {
      alert('Kode promo tidak valid');
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const getDiscount = () => {
    if (!appliedPromo) return 0;
    
    const subtotal = getSubtotal();
    if (appliedPromo.discount_type === 'percentage') {
      return (subtotal * appliedPromo.discount_value) / 100;
    } else {
      return appliedPromo.discount_value;
    }
  };

  const getShippingCost = () => {
    if (!selectedShipping) return 0;
    const shipping = shippingOptions.find(s => s.id === selectedShipping);
    return shipping ? shipping.price : 0;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscount() + getShippingCost();
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const proceedToCheckout = () => {
    if (!auth.user) {
      router.visit('/customer/login');
      return;
    }

    router.visit('/customer/checkout');
  };

  if (cart.length === 0) {
    return (
      <ShopLayout cartItemsCount={0}>
        <Head title="Keranjang Belanja - Siska Copy" />
        
        <div className="bg-gray-50 min-h-screen">
          <div className="container mx-auto px-6 py-24">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8 p-6 bg-white rounded-full w-32 h-32 mx-auto flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-16 w-16 text-gray-300" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Keranjang Belanja Anda Kosong
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                Sepertinya Anda belum menambahkan produk apapun ke keranjang belanja Anda.
                Mari mulai berbelanja dan temukan produk-produk menarik!
              </p>
              <Link href="/shop">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  <ArrowLeft className="mr-3 h-6 w-6" />
                  Mulai Belanja
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout cartItemsCount={getTotalItems()}>
      <Head title="Keranjang Belanja - Siska Copy" />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Keranjang Belanja</h1>
              <p className="text-blue-100 text-lg">{getTotalItems()} item dalam keranjang Anda</p>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3 text-lg font-semibold rounded-xl transition-all duration-200 hover:shadow-lg">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Lanjut Belanja
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <div className="lg:grid lg:grid-cols-3 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-100 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                    Item dalam Keranjang
                    <span className="text-lg font-normal text-gray-500">({cart.length} item)</span>
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                          {/* Product Image */}
                          <div className="w-full sm:w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                            {item.product.gambar_produk ? (
                              <img
                                src={`/storage/${item.product.gambar_produk}`}
                                alt={item.product.nama_produk}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`text-4xl text-gray-300 ${item.product.gambar_produk ? 'hidden' : ''}`}>
                              📦
                            </div>
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 space-y-4">
                            {/* Product Info & Remove Button */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="space-y-2">
                                <h3 className="font-bold text-xl text-gray-900">{item.product.nama_produk}</h3>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {item.product.kategori.nama_kategori}
                                  </Badge>
                                  {item.product.merk_produk && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.product.merk_produk}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-10 w-10"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                            
                            {/* Quantity Controls & Price */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                              <div className="flex items-center gap-4">
                                <Label className="text-sm font-medium text-gray-700">Jumlah:</Label>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    className="h-8 w-8 rounded-md hover:bg-white"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-bold text-lg min-w-[3rem] text-center text-gray-900">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.product.stok_tersedia}
                                    className="h-8 w-8 rounded-md hover:bg-white disabled:opacity-50"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Stok: {item.product.stok_tersedia}
                                </span>
                              </div>
                              
                              <div className="text-right space-y-1">
                                <p className="text-sm text-gray-500">
                                  {formatPrice(item.product.harga_jual)} × {item.quantity}
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {formatPrice(item.subtotal)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-8 lg:mt-0">
              <div className="space-y-6">
                {/* Promo Code */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="border-b border-gray-100 p-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        🎫
                      </div>
                      Kode Promo
                    </h3>
                  </div>
                  <div className="p-6">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div>
                          <p className="font-bold text-green-800 text-lg">{appliedPromo.code}</p>
                          <p className="text-sm text-green-600">
                            Diskon {appliedPromo.discount_type === 'percentage' 
                              ? `${appliedPromo.discount_value}%` 
                              : formatPrice(appliedPromo.discount_value)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removePromoCode}
                          className="text-green-600 hover:text-green-800 rounded-full"
                        >
                          Hapus
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Input
                            placeholder="Masukkan kode promo"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={applyPromoCode}
                            disabled={!promoCode.trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Gunakan
                          </Button>
                        </div>
                        {availablePromoCodes.length > 0 && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">Kode promo tersedia:</p>
                            <div className="flex flex-wrap gap-2">
                              {availablePromoCodes.map((promo) => (
                                <Badge
                                  key={promo.code}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                  onClick={() => setPromoCode(promo.code)}
                                >
                                  {promo.code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Options */}
                {shippingOptions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-100 p-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <Truck className="h-6 w-6 text-orange-600" />
                        </div>
                        Pilih Pengiriman
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {shippingOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedShipping === option.id
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedShipping(option.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-900">{option.name}</p>
                              <p className="text-sm text-gray-600">
                                Estimasi: {option.estimated_days}
                              </p>
                            </div>
                            <p className="font-bold text-lg text-blue-600">
                              {option.price === 0 ? 'Gratis' : formatPrice(option.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                  <div className="border-b border-gray-100 p-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <CreditCard className="h-6 w-6 text-purple-600" />
                      </div>
                      Ringkasan Pesanan
                    </h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Subtotal ({getTotalItems()} item)</span>
                        <span className="font-semibold text-gray-900">{formatPrice(getSubtotal())}</span>
                      </div>
                      
                      {appliedPromo && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-green-600">Diskon ({appliedPromo.code})</span>
                          <span className="font-semibold text-green-600">-{formatPrice(getDiscount())}</span>
                        </div>
                      )}
                      
                      {selectedShipping && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Ongkos Kirim</span>
                          <span className="font-semibold text-gray-900">
                            {getShippingCost() === 0 ? 'Gratis' : formatPrice(getShippingCost())}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-blue-600">{formatPrice(getTotal())}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <Button 
                        onClick={proceedToCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                      >
                        <CreditCard className="mr-3 h-6 w-6" />
                        {auth.user ? 'Lanjut ke Pembayaran' : 'Login & Checkout'}
                      </Button>
                      
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 py-3 rounded-lg">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Transaksi 100% aman & terpercaya</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

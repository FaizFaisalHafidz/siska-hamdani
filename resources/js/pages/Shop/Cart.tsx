import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { 
              ...item, 
              quantity: Math.min(newQuantity, item.product.stok_tersedia),
              subtotal: item.product.harga_jual * Math.min(newQuantity, item.product.stok_tersedia)
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
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

    // Navigate to customer checkout page
    router.visit('/customer/checkout');
  };

  if (cart.length === 0) {
    return (
      <ShopLayout cartItemsCount={0}>
        <Head title="Keranjang Belanja - Siska Copy" />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <ShoppingCart className="mx-auto h-24 w-24 text-gray-300" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Keranjang Belanja Anda Kosong
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Sepertinya Anda belum menambahkan produk apapun ke keranjang belanja Anda.
            </p>
            <Link href="/shop">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Mulai Belanja
              </Button>
            </Link>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout cartItemsCount={getTotalItems()}>
      <Head title="Keranjang Belanja - Siska Copy" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Keranjang Belanja</h1>
              <p className="text-blue-100">{getTotalItems()} item dalam keranjang Anda</p>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Lanjut Belanja
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Item dalam Keranjang ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
                    <div className="w-full sm:w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product.gambar_produk ? (
                        <img
                          src={`/storage/${item.product.gambar_produk}`}
                          alt={item.product.nama_produk}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-2xl text-gray-400">📄</div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{item.product.nama_produk}</h3>
                          <Badge variant="outline" className="text-xs">
                            {item.product.kategori.nama_kategori}
                          </Badge>
                          {item.product.merk_produk && (
                            <p className="text-sm text-gray-600 mt-1">{item.product.merk_produk}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Label className="text-sm font-medium">Jumlah:</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-semibold text-lg min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stok_tersedia}
                              className="h-8 w-8"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm text-gray-500">
                            (Stok: {item.product.stok_tersedia})
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.product.harga_jual)} x {item.quantity}
                          </p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="space-y-6">
              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kode Promo</CardTitle>
                </CardHeader>
                <CardContent>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-semibold text-green-800">{appliedPromo.code}</p>
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
                        className="text-green-600 hover:text-green-800"
                      >
                        Hapus
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Masukkan kode promo"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                        />
                        <Button 
                          onClick={applyPromoCode}
                          disabled={!promoCode.trim()}
                        >
                          Gunakan
                        </Button>
                      </div>
                      {availablePromoCodes.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <p>Kode promo tersedia:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {availablePromoCodes.map((promo) => (
                              <Badge
                                key={promo.code}
                                variant="outline"
                                className="cursor-pointer hover:bg-gray-100"
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
                </CardContent>
              </Card>

              {/* Shipping Options */}
              {shippingOptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Pilih Pengiriman
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {shippingOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedShipping === option.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedShipping(option.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{option.name}</p>
                            <p className="text-sm text-gray-600">
                              Estimasi: {option.estimated_days}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {option.price === 0 ? 'Gratis' : formatPrice(option.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal ({getTotalItems()} item)</span>
                      <span>{formatPrice(getSubtotal())}</span>
                    </div>
                    
                    {appliedPromo && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon ({appliedPromo.code})</span>
                        <span>-{formatPrice(getDiscount())}</span>
                      </div>
                    )}
                    
                    {selectedShipping && (
                      <div className="flex justify-between">
                        <span>Ongkos Kirim</span>
                        <span>
                          {getShippingCost() === 0 ? 'Gratis' : formatPrice(getShippingCost())}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(getTotal())}</span>
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <Button 
                      onClick={proceedToCheckout}
                      disabled={cart.length === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      {auth.user ? 'Lanjut ke Pembayaran' : 'Login & Checkout'}
                    </Button>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4" />
                      <span>Transaksi 100% aman & terpercaya</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

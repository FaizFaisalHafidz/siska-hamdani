import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft,
  Banknote,
  Building,
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  Shield,
  Wallet
} from 'lucide-react';
import React, { useState } from 'react';

interface Product {
  id: number;
  nama_produk: string;
  harga_jual: number;
  gambar_produk?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface PaymentMethod {
  id: number;
  name: string;
  type: 'bank_transfer' | 'e_wallet' | 'cash_on_delivery' | 'credit_card';
  icon: string;
  description: string;
  fee?: number;
}

interface Props {
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  promoCode?: string;
  shippingId: number;
  paymentMethods: PaymentMethod[];
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function CheckoutPage({ 
  cartItems = [], 
  subtotal, 
  discount = 0, 
  shippingCost = 0, 
  total, 
  promoCode,
  shippingId,
  paymentMethods = [],
  user 
}: Props) {
  const [selectedPayment, setSelectedPayment] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Debug user data
  console.log('User data:', user);
  
  // Detect pickup based on selected payment method (Cash on Delivery = Pickup)
  const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPayment);
  const isPickup = selectedPaymentMethod?.type === 'cash_on_delivery';
  
  const [formData, setFormData] = useState({
    recipient_name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    postal_code: '',
    province: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return <Building className="h-5 w-5" />;
      case 'e_wallet':
        return <Wallet className="h-5 w-5" />;
      case 'cash_on_delivery':
        return <Banknote className="h-5 w-5" />;
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const isFormValid = () => {
    if (!selectedPayment) {
      console.log('No payment method selected');
      return false;
    }
    
    console.log('Form validation check:');
    console.log('- selectedPayment:', selectedPayment);
    console.log('- isPickup:', isPickup);
    console.log('- recipient_name:', `"${formData.recipient_name}"`);
    console.log('- phone:', `"${formData.phone}"`);
    console.log('- address:', `"${formData.address}"`);
    console.log('- city:', `"${formData.city}"`);
    
    if (isPickup) {
      // For pickup, only need name and phone
      const isValid = !!(formData.recipient_name.trim() && formData.phone.trim());
      console.log('Pickup validation result:', isValid);
      return isValid;
    } else {
      // For delivery, need full address
      const isValid = !!(formData.recipient_name.trim() && 
               formData.phone.trim() && 
               formData.address.trim() && 
               formData.city.trim());
      console.log('Delivery validation result:', isValid);
      return isValid;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayment) {
      alert('Silakan pilih metode pembayaran');
      return;
    }

    // Only validate shipping fields if not pickup
    if (!isPickup) {
      const requiredFields = ['recipient_name', 'phone', 'address', 'city'];
      const newErrors: Record<string, string> = {};
      
      requiredFields.forEach(field => {
        if (!formData[field as keyof typeof formData].trim()) {
          newErrors[field] = 'Field ini wajib diisi';
        }
      });
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    } else {
      // For pickup, only validate basic fields
      const newErrors: Record<string, string> = {};
      
      if (!formData.recipient_name.trim()) {
        newErrors.recipient_name = 'Nama penerima wajib diisi';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Nomor telepon wajib diisi';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setProcessing(true);
    
    const submitData: any = {
      ...formData,
      payment_method_id: selectedPayment,
      promo_code: promoCode || '',
      pickup_option: isPickup,
      items: JSON.stringify(cartItems)
    };

    // Only add shipping data if not pickup
    if (!isPickup) {
      submitData.shipping_id = shippingId;
    }
    
    router.post('/shop/process-order', submitData, {
      onFinish: () => setProcessing(false),
      onError: (errors) => {
        setErrors(errors);
        setProcessing(false);
      }
    });
  };

  return (
    <ShopLayout cartItemsCount={getTotalItems()}>
      <Head title="Checkout - Siska Copy" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Checkout</h1>
              <p className="text-blue-100">Selesaikan pesanan Anda</p>
            </div>
            <Link href="/shop/cart">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Keranjang
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {isPickup ? 'Informasi Pemesan' : 'Alamat Pengiriman'}
                  </CardTitle>
                  {isPickup && (
                    <p className="text-sm text-gray-600">
                      Anda memilih pickup di tempat. Pesanan akan siap diambil dalam 30 menit setelah konfirmasi pembayaran.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipient_name">Nama Penerima *</Label>
                      <Input
                        id="recipient_name"
                        value={formData.recipient_name}
                        onChange={(e) => updateFormData('recipient_name', e.target.value)}
                        className={errors.recipient_name ? 'border-red-500' : ''}
                        placeholder="Masukkan nama penerima"
                        required
                      />
                      {errors.recipient_name && (
                        <p className="text-sm text-red-500 mt-1">{errors.recipient_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">No. Telepon *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className={errors.phone ? 'border-red-500' : ''}
                        placeholder="Masukkan nomor telepon"
                        required
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  {!isPickup && (
                    <>
                      <div>
                        <Label htmlFor="address">Alamat Lengkap *</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => updateFormData('address', e.target.value)}
                          className={errors.address ? 'border-red-500' : ''}
                          placeholder="Jl. Nama Jalan No. XX, RT/RW, Kelurahan"
                          rows={3}
                          required
                        />
                        {errors.address && (
                          <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">Kota *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => updateFormData('city', e.target.value)}
                            className={errors.city ? 'border-red-500' : ''}
                            required
                          />
                          {errors.city && (
                            <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="postal_code">Kode Pos</Label>
                          <Input
                            id="postal_code"
                            value={formData.postal_code}
                            onChange={(e) => updateFormData('postal_code', e.target.value)}
                            className={errors.postal_code ? 'border-red-500' : ''}
                          />
                          {errors.postal_code && (
                            <p className="text-sm text-red-500 mt-1">{errors.postal_code}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="province">Provinsi</Label>
                          <Input
                            id="province"
                            value={formData.province}
                            onChange={(e) => updateFormData('province', e.target.value)}
                            className={errors.province ? 'border-red-500' : ''}
                          />
                          {errors.province && (
                            <p className="text-sm text-red-500 mt-1">{errors.province}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                                    <div>
                    <Label htmlFor="notes">Catatan Pesanan</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      placeholder="Catatan khusus untuk pesanan Anda (opsional)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>


              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPayment === method.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getPaymentMethodIcon(method.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{method.name}</h4>
                            <p className="text-sm text-gray-600">{method.description}</p>
                            {method.fee && method.fee > 0 && (
                              <p className="text-sm text-red-600">
                                Biaya admin: {formatPrice(method.fee)}
                              </p>
                            )}
                          </div>
                          {selectedPayment === method.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.payment_method_id && (
                    <p className="text-sm text-red-500 mt-2">{errors.payment_method_id}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="mt-8 lg:mt-0">
              <div className="space-y-6">
                {/* Items Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.product.id} className="flex gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            {item.product.gambar_produk ? (
                              <img
                                src={`/storage/${item.product.gambar_produk}`}
                                alt={item.product.nama_produk}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="text-sm text-gray-400">📄</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {item.product.nama_produk}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatPrice(item.product.harga_jual)} x {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              {formatPrice(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal ({getTotalItems()} item)</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Diskon{promoCode ? ` (${promoCode})` : ''}</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Ongkos Kirim</span>
                        <span>
                          {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                        </span>
                      </div>

                      {selectedPayment && (
                        (() => {
                          const method = paymentMethods.find(m => m.id === selectedPayment);
                          return method?.fee && method.fee > 0 ? (
                            <div className="flex justify-between text-red-600">
                              <span>Biaya Admin</span>
                              <span>{formatPrice(method.fee)}</span>
                            </div>
                          ) : null;
                        })()
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Pembayaran</span>
                      <span className="text-blue-600">
                        {formatPrice(total + (selectedPayment ? 
                          (paymentMethods.find(m => m.id === selectedPayment)?.fee || 0) : 0))}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Place Order Button */}
                <Card>
                  <CardContent className="p-6">
                    <Button 
                      type="submit"
                      disabled={processing || !isFormValid()}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      {processing ? (
                        <>
                          <Clock className="mr-2 h-5 w-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          Buat Pesanan
                        </>
                      )}
                    </Button>
                    
                    {/* Debug info */}
                    <div className="mt-2 p-2 bg-gray-100 text-xs">
                      <p>Debug: Form Valid = {isFormValid() ? 'YES' : 'NO'}</p>
                      <p>Payment Selected = {selectedPayment || 'NONE'}</p>
                      <p>Is Pickup = {isPickup ? 'YES' : 'NO'}</p>
                      <p>Name = "{formData.recipient_name}"</p>
                      <p>Phone = "{formData.phone}"</p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-3">
                      <Shield className="h-4 w-4" />
                      <span>Transaksi 100% aman & terpercaya</span>
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Dengan melakukan pembayaran, Anda setuju dengan syarat dan ketentuan yang berlaku.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ShopLayout>
  );
}

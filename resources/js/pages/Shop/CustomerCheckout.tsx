import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import ShopLayout from '@/layouts/shop-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Calculator, CreditCard, MapPin, Package, Truck } from 'lucide-react';
import { useState } from 'react';

interface CartItem {
  id: number;
  quantity: number;
  harga_satuan: number;
  total_price: number;
  produk: {
    id: number;
    nama_produk: string;
    harga_jual: number;
    gambar_produk?: string;
    kategori: {
      nama_kategori: string;
    };
  };
}

interface CustomerProfile {
  id: number;
  nama_pelanggan: string;
  nomor_telepon: string;
  alamat: string;
}

interface Props {
  cartItems: CartItem[];
  subtotal: number;
  customerProfile: CustomerProfile;
  tokoLocation: {
    lat: number;
    lng: number;
    address: string;
  };
}

export default function Checkout({ cartItems, subtotal, customerProfile, tokoLocation }: Props) {
  const [form, setForm] = useState({
    alamat_pengiriman: customerProfile?.alamat || '',
    customer_lat: 0,
    customer_lng: 0,
    metode_pembayaran: 'cod',
    catatan_pesanan: '',
    bukti_transfer: null as File | null,
    is_pickup: false // Tambah opsi pickup
  });

  const [shipping, setShipping] = useState({
    distance: 0,
    cost: 0,
    method: '',
    estimated_time: ''
  });

  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationError, setLocationError] = useState('');

  const formatPrice = (price: number | undefined | null) => {
    const validPrice = price && !isNaN(price) ? price : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(validPrice);
  };

  const handlePickupToggle = (isPickup: boolean) => {
    setForm(prev => ({ ...prev, is_pickup: isPickup }));
    
    if (isPickup) {
      // Pickup langsung tanpa perlu lokasi
      calculateShipping(0, 0, true);
    } else {
      // Reset shipping dan minta lokasi lagi
      setShipping({ distance: 0, cost: 0, method: '', estimated_time: '' });
      if (form.customer_lat && form.customer_lng) {
        calculateShipping(form.customer_lat, form.customer_lng, false);
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser ini');
      return;
    }

    setIsCalculatingShipping(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setForm(prev => ({
          ...prev,
          customer_lat: lat,
          customer_lng: lng
        }));

        calculateShipping(lat, lng, form.is_pickup);
      },
      (error) => {
        setIsCalculatingShipping(false);
        setLocationError('Gagal mengambil lokasi. Silakan coba lagi.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const calculateShipping = async (lat: number, lng: number, isPickup: boolean = false) => {
    try {
      const response = await fetch('/customer/calculate-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          customer_lat: lat,
          customer_lng: lng,
          pickup_option: isPickup
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setShipping({
          distance: data.distance,
          cost: data.shipping_cost || 0, // Ensure it's a number
          method: data.shipping_method,
          estimated_time: data.estimated_time
        });
      } else {
        setLocationError(data.error || 'Gagal menghitung ongkir');
      }
    } catch (error) {
      setLocationError('Gagal menghitung ongkir');
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.customer_lat || !form.customer_lng) {
      setLocationError('Silakan dapatkan lokasi terlebih dahulu');
      return;
    }

    if (form.metode_pembayaran === 'transfer' && !form.bukti_transfer) {
      alert('Silakan upload bukti transfer');
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('alamat_pengiriman', form.alamat_pengiriman);
    formData.append('customer_lat', form.customer_lat.toString());
    formData.append('customer_lng', form.customer_lng.toString());
    formData.append('metode_pembayaran', form.metode_pembayaran);
    formData.append('catatan_pesanan', form.catatan_pesanan);
    
    if (form.bukti_transfer) {
      formData.append('bukti_transfer', form.bukti_transfer);
    }

    router.post('/customer/process-order', formData, {
      onFinish: () => setIsProcessing(false),
      onError: () => {
        alert('Gagal memproses pesanan');
        setIsProcessing(false);
      }
    });
  };

  const total = subtotal + (form.is_pickup ? 0 : shipping.cost);

  return (
    <ShopLayout>
      <Head title="Checkout - Hamdani Stationery" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.visit('/shop/cart')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="space-y-6">
              {/* Delivery Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Pilihan Pengambilan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="pickup"
                        name="delivery_option"
                        checked={form.is_pickup}
                        onChange={() => handlePickupToggle(true)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label htmlFor="pickup" className="text-sm font-medium">
                        🏪 Ambil di Toko (Gratis)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="delivery"
                        name="delivery_option"
                        checked={!form.is_pickup}
                        onChange={() => handlePickupToggle(false)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label htmlFor="delivery" className="text-sm font-medium">
                        🚚 Kirim ke Alamat
                      </label>
                    </div>
                  </div>
                  
                  {form.is_pickup && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Alamat Toko</span>
                      </div>
                      <p className="text-sm text-green-600">
                        {tokoLocation.address}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Siap diambil dalam 30 menit setelah konfirmasi
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Address - Only show if not pickup */}
              {!form.is_pickup && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Alamat Pengiriman
                    </CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="alamat_pengiriman">Alamat Lengkap</Label>
                    <Textarea
                      id="alamat_pengiriman"
                      value={form.alamat_pengiriman}
                      onChange={(e) => setForm(prev => ({ ...prev, alamat_pengiriman: e.target.value }))}
                      placeholder="Masukkan alamat lengkap untuk pengiriman"
                      required
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isCalculatingShipping}
                      className="w-full"
                      variant="outline"
                    >
                      {isCalculatingShipping ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                          Menghitung Lokasi...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Dapatkan Lokasi & Hitung Ongkir
                        </div>
                      )}
                    </Button>
                    
                    {locationError && (
                      <Alert variant="destructive">
                        <AlertDescription>{locationError}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {(shipping.distance > 0 || form.is_pickup) && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">Informasi Pengiriman</span>
                      </div>
                      <div className="text-sm text-blue-600">
                        {form.is_pickup ? (
                          <>
                            <p>Metode: Ambil di Toko</p>
                            <p>Estimasi: {shipping.estimated_time || 'Siap diambil dalam 30 menit'}</p>
                            <p className="font-medium">Ongkir: Gratis</p>
                          </>
                        ) : (
                          <>
                            <p>Jarak: {shipping.distance} km</p>
                            <p>Metode: {shipping.method === 'antar_sendiri' ? 'Antar Sendiri' : shipping.method === 'gojek' ? 'Gojek' : 'Pengiriman'}</p>
                            <p>Estimasi: {shipping.estimated_time}</p>
                            <p className="font-medium">Ongkir: {formatPrice(shipping.cost)}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select 
                    value={form.metode_pembayaran} 
                    onValueChange={(value) => setForm(prev => ({ ...prev, metode_pembayaran: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">COD (Bayar di Tempat)</SelectItem>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>

                  {form.metode_pembayaran === 'transfer' && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Informasi Transfer</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Bank BCA</strong></p>
                          <p>No. Rek: 1234567890</p>
                          <p>A.n: Hamdani Stationery</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="bukti_transfer">Upload Bukti Transfer</Label>
                        <Input
                          id="bukti_transfer"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            bukti_transfer: e.target.files?.[0] || null 
                          }))}
                          required
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Catatan Pesanan (Opsional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={form.catatan_pesanan}
                    onChange={(e) => setForm(prev => ({ ...prev, catatan_pesanan: e.target.value }))}
                    placeholder="Tambahkan catatan untuk pesanan..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Ringkasan Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.produk.nama_produk}</h4>
                          <p className="text-xs text-gray-500">
                            {item.quantity} x {formatPrice(item.harga_satuan)}
                          </p>
                        </div>
                        <div className="font-medium text-sm">
                          {formatPrice(item.total_price)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ongkos Kirim</span>
                      <span>{formatPrice(shipping.cost)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmit}
                    disabled={isProcessing || shipping.cost === 0}
                    className="w-full h-12"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Memproses Pesanan...
                      </div>
                    ) : (
                      'Buat Pesanan'
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Dengan melanjutkan, Anda menyetujui syarat dan ketentuan kami
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

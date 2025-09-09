import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, Clock, CreditCard, MapPin, Package, Truck } from 'lucide-react';

interface Product {
  id: number;
  nama_produk: string;
  harga_jual: number;
}

interface OrderDetail {
  id: number;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  produk: Product;
}

interface Order {
  id: number;
  tanggal_penjualan: string;
  total_harga: number;
  metode_pembayaran: string;
  status_pembayaran: string;
  status_pesanan: string;
  alamat_pengiriman: string;
  ongkos_kirim: number;
  metode_pengiriman: string;
  jarak_km: number;
  catatan_pesanan?: string;
  details: OrderDetail[];
}

interface Props {
  order: Order;
}

export default function OrderSuccess({ order }: Props) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'Menunggu', variant: 'secondary' as const },
      'processing': { label: 'Diproses', variant: 'default' as const },
      'shipped': { label: 'Dikirim', variant: 'default' as const },
      'delivered': { label: 'Diterima', variant: 'default' as const },
      'cancelled': { label: 'Dibatalkan', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'Menunggu', variant: 'secondary' as const },
      'paid': { label: 'Lunas', variant: 'default' as const },
      'failed': { label: 'Gagal', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const subtotal = order.details.reduce((sum, detail) => sum + detail.subtotal, 0);

  return (
    <ShopLayout>
      <Head title="Pesanan Berhasil - Hamdani Stationery" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Berhasil Dibuat!</h1>
            <p className="text-gray-600">
              Terima kasih! Pesanan Anda telah berhasil diterima dan sedang diproses.
            </p>
            <div className="mt-4">
              <span className="text-sm text-gray-500">Nomor Pesanan: </span>
              <span className="font-bold text-lg">#{order.id.toString().padStart(6, '0')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detail Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {order.details.map((detail) => (
                      <div key={detail.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{detail.produk.nama_produk}</h4>
                          <p className="text-sm text-gray-500">
                            {detail.jumlah} x {formatPrice(detail.harga_satuan)}
                          </p>
                        </div>
                        <div className="font-medium">
                          {formatPrice(detail.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ongkos Kirim ({order.jarak_km} km)</span>
                      <span>{formatPrice(order.ongkos_kirim)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(order.total_harga)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Informasi Pengiriman
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Alamat Pengiriman</Label>
                    <p className="text-sm text-gray-900 mt-1">{order.alamat_pengiriman}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Metode Pengiriman</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          {order.metode_pengiriman === 'antar_sendiri' ? 'Antar Sendiri' : 'Gojek'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Estimasi</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          {order.metode_pengiriman === 'antar_sendiri' ? '30-60 menit' : '45-90 menit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.catatan_pesanan && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Catatan Pesanan</Label>
                      <p className="text-sm text-gray-900 mt-1">{order.catatan_pesanan}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Status */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status Pesanan</span>
                      {getStatusBadge(order.status_pesanan)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status Pembayaran</span>
                      {getPaymentStatusBadge(order.status_pembayaran)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tanggal Pesanan</span>
                      <span className="text-sm">{formatDate(order.tanggal_penjualan)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Informasi Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Metode Pembayaran</span>
                      <span className="text-sm">
                        {order.metode_pembayaran === 'cod' ? 'COD (Bayar di Tempat)' : 'Transfer Bank'}
                      </span>
                    </div>
                    
                    {order.metode_pembayaran === 'transfer' && order.status_pembayaran === 'pending' && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Menunggu Pembayaran</h4>
                        <div className="text-sm text-yellow-700 space-y-1">
                          <p><strong>Bank BCA</strong></p>
                          <p>No. Rek: 1234567890</p>
                          <p>A.n: Hamdani Stationery</p>
                          <p className="mt-2">Silakan transfer sebesar <strong>{formatPrice(order.total_harga)}</strong></p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/customer/orders">Lihat Semua Pesanan</Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/shop">Lanjut Belanja</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

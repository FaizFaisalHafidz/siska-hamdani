import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Eye, Package, Receipt } from 'lucide-react';

interface Order {
  id: number;
  kode_transaksi: string;
  tanggal_transaksi: string;
  total_harga: number;
  metode_pembayaran: string;
  status_pembayaran: string;
  shipping_method: string;
  shipping_cost: number;
  delivery_address: string;
  items: Array<{
    id: number;
    produk: {
      nama_produk: string;
      gambar_produk: string;
    };
    jumlah_produk: number;
    harga_satuan: number;
    subtotal: number;
  }>;
}

interface Props {
  orders: Order[];
}

export default function OrderHistory({ orders }: Props) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'processing':
        return 'Diproses';
      case 'shipped':
        return 'Dikirim';
      case 'delivered':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  return (
    <ShopLayout>
      <Head title="Pesanan Saya" />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Pesanan Saya</h1>
            <p className="text-gray-600 mt-2">Kelola dan lacak semua pesanan Anda</p>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum Ada Pesanan
                </h3>
                <p className="text-gray-500 mb-6">
                  Anda belum memiliki pesanan. Mulai berbelanja sekarang!
                </p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Link href="/shop">Mulai Belanja</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          #{order.kode_transaksi}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.tanggal_transaksi)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusBadgeVariant(order.status_pembayaran)}>
                          {getStatusText(order.status_pembayaran)}
                        </Badge>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {formatPrice(order.total_harga)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.produk.gambar_produk ? (
                              <img
                                src={item.produk.gambar_produk}
                                alt={item.produk.nama_produk}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.produk.nama_produk}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.jumlah_produk}x {formatPrice(item.harga_satuan)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatPrice(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-500 pl-15">
                          +{order.items.length - 2} produk lainnya
                        </p>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="space-y-1">
                          <p><span className="text-gray-500">Pembayaran:</span> {order.metode_pembayaran}</p>
                          <p><span className="text-gray-500">Pengiriman:</span> {order.shipping_method}</p>
                          {order.delivery_address && (
                            <p><span className="text-gray-500">Alamat:</span> {order.delivery_address}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/customer/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Detail
                            </Link>
                          </Button>
                          {order.status_pembayaran === 'delivered' && (
                            <Button variant="outline" size="sm">
                              <Receipt className="h-4 w-4 mr-2" />
                              Beli Lagi
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Package, Receipt } from 'lucide-react';

interface Order {
  id: number;
  nomor_invoice: string;
  tanggal_penjualan: string;
  total_harga: number;
  metode_pembayaran: string;
  status_transaksi: string;
  alamat_pengiriman: string;
  biaya_pengiriman: number;
  details: Array<{
    id: number;
    produk: {
      nama_produk: string;
      gambar_produk: string;
    };
    jumlah_beli: number;
    harga_satuan: number;
    subtotal: number;
  }>;
}

interface Props {
  orders: Order[] | { data: Order[]; [key: string]: any };
}

export default function OrderHistory({ orders }: Props) {
  // Debug: Log the orders data structure
  console.log('Orders received:', orders);
  console.log('Orders type:', typeof orders);
  console.log('Orders.data exists?', orders && typeof orders === 'object' && 'data' in orders);
  
  // Handle both paginated and direct array
  const ordersList = Array.isArray(orders) ? orders : (orders && orders.data ? orders.data : []);
  
  console.log('Final ordersList:', ordersList);

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
          {ordersList.length === 0 ? (
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
              {ordersList.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          #{order.nomor_invoice}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.tanggal_penjualan)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusBadgeVariant(order.status_transaksi)}>
                          {getStatusText(order.status_transaksi)}
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
                      {order.details.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.produk.gambar_produk ? (
                              <img
                                src={`/storage/${item.produk.gambar_produk}`}
                                alt={item.produk.nama_produk}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {item.produk.nama_produk}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {item.jumlah_beli}x • {formatPrice(item.harga_satuan)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(item.subtotal)}</p>
                          </div>
                        </div>
                      ))}
                      
                      {order.details.length > 2 && (
                        <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
                          +{order.details.length - 2} produk lainnya
                        </div>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-sm">
                        {/* <div className="space-y-1">
                          <p><span className="text-gray-500">Pembayaran:</span> {order.metode_pembayaran}</p>
                          <p><span className="text-gray-500">Ongkir:</span> {formatPrice(order.biaya_pengiriman)}</p>
                          {order.alamat_pengiriman && (
                            <p><span className="text-gray-500">Alamat:</span> {order.alamat_pengiriman}</p>
                          )}
                        </div> */}
                        <div className="flex gap-2">
                          {/* <Button variant="outline" size="sm" asChild>
                            <Link href={`/customer/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Detail
                            </Link>
                          </Button> */}
                          {order.status_transaksi === 'completed' && (
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

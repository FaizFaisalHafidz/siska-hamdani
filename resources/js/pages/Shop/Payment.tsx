import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    CreditCard,
    Download,
    Home,
    Package,
    Receipt,
    XCircle
} from 'lucide-react';

interface Product {
  id: number;
  nama_produk: string;
  harga_jual: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  payment_method: {
    name: string;
    type: string;
    instructions?: string;
    account_number?: string;
    account_name?: string;
  };
  items: Product[];
  shipping_address: {
    recipient_name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
  };
  created_at: string;
  payment_deadline?: string;
  virtual_account?: string;
  payment_code?: string;
}

interface Props {
  order: Order;
  success?: boolean;
  message?: string;
}

export default function PaymentPage({ order, success = false, message }: Props) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    alert('Berhasil disalin ke clipboard!');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Menunggu Pembayaran' },
      paid: { variant: 'default' as const, icon: CheckCircle, text: 'Terbayar' },
      processing: { variant: 'default' as const, icon: Package, text: 'Diproses' },
      shipped: { variant: 'default' as const, icon: Package, text: 'Dikirim' },
      delivered: { variant: 'default' as const, icon: CheckCircle, text: 'Selesai' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, text: 'Dibatalkan' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-2">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getPaymentInstructions = () => {
    const { payment_method } = order;
    
    if (payment_method.type === 'bank_transfer') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Instruksi Transfer Bank
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Bank:</span>
                <span className="font-semibold">{payment_method.name}</span>
              </div>
              {payment_method.account_number && (
                <div className="flex justify-between items-center">
                  <span>No. Rekening:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{payment_method.account_number}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(payment_method.account_number!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {payment_method.account_name && (
                <div className="flex justify-between items-center">
                  <span>Nama Penerima:</span>
                  <span className="font-semibold">{payment_method.account_name}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Jumlah Transfer:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600">{formatPrice(order.total_amount)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(order.total_amount.toString())}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {order.payment_deadline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Batas waktu pembayaran: {formatDateTime(order.payment_deadline)}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (payment_method.type === 'e_wallet') {
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              Pembayaran {payment_method.name}
            </h4>
            <div className="space-y-2 text-sm">
              {order.payment_code && (
                <div className="flex justify-between items-center">
                  <span>Kode Pembayaran:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-lg">{order.payment_code}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(order.payment_code!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Total Bayar:</span>
                <span className="font-bold text-green-600">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (payment_method.type === 'cash_on_delivery') {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            Bayar di Tempat (COD)
          </h4>
          <p className="text-sm text-gray-700">
            Pembayaran akan dilakukan saat barang tiba di tujuan. 
            Pastikan Anda menyiapkan uang pas sejumlah <strong>{formatPrice(order.total_amount)}</strong>
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <ShopLayout cartItemsCount={0}>
      <Head title={`Pembayaran - Order #${order.order_number}`} />
      
      {/* Header */}
      <div className={`py-12 ${success ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white`}>
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            {success ? (
              <>
                <CheckCircle className="mx-auto h-16 w-16 mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Pesanan Berhasil Dibuat!
                </h1>
                <p className="text-green-100 text-lg">
                  {message || 'Terima kasih atas pesanan Anda. Silakan lakukan pembayaran untuk memproses pesanan.'}
                </p>
              </>
            ) : (
              <>
                <Receipt className="mx-auto h-16 w-16 mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Detail Pembayaran
                </h1>
                <p className="text-blue-100 text-lg">
                  Order #{order.order_number}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Payment Instructions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Status Pesanan</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        Dibuat pada {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Instructions */}
              {order.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Cara Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getPaymentInstructions()}
                  </CardContent>
                </Card>
              )}

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Alamat Pengiriman
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-semibold">{order.shipping_address.recipient_name}</p>
                    <p className="text-sm text-gray-600">{order.shipping_address.phone}</p>
                    <p className="text-sm">{order.shipping_address.address}</p>
                    <p className="text-sm">
                      {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="mt-8 lg:mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2">{item.nama_produk}</p>
                          <p className="text-gray-600">
                            {formatPrice(item.harga_jual)} x {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold ml-4">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(order.total_amount)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {order.status === 'pending' && (
                  <Button className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh Invoice
                  </Button>
                )}
                
                <Link href="/shop">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Home className="mr-2 h-4 w-4" />
                    Kembali Berbelanja
                  </Button>
                </Link>

                <Link href="/shop/orders">
                  <Button variant="outline" className="w-full">
                    <Receipt className="mr-2 h-4 w-4" />
                    Lihat Semua Pesanan
                  </Button>
                </Link>
              </div>

              {/* Help Section */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Butuh Bantuan?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>Hubungi customer service kami:</p>
                  <div className="space-y-1">
                    <p><strong>WhatsApp:</strong> +62 812-3456-7890</p>
                    <p><strong>Email:</strong> cs@siskacopy.com</p>
                    <p><strong>Jam Operasional:</strong> 08:00 - 20:00 WIB</p>
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

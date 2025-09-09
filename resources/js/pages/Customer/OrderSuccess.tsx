import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';

interface OrderDetail {
    id: number;
    produk: {
        nama_produk: string;
        harga: number;
    };
    jumlah_beli: number;
    harga_satuan: number;
    subtotal: number;
}

interface Customer {
    nama_pelanggan: string;
    nomor_hp: string;
    alamat: string;
}

interface Order {
    id: number;
    nomor_invoice: string;
    total_harga: number;
    ongkos_kirim: number;
    metode_pengiriman: 'delivery' | 'pickup';
    alamat_pengiriman?: string;
    jarak_km?: number;
    metode_pembayaran: string;
    catatan_pesanan?: string;
    tanggal_penjualan: string;
    details: OrderDetail[];
    pelanggan: Customer | null;
}

interface Props {
    order: Order;
}

export default function OrderSuccess({ order }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <ShopLayout>
            <Head title={`Pesanan Berhasil - ${order.nomor_invoice}`} />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Success Message */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="bg-green-500 px-6 py-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h1 className="text-xl font-bold text-white">
                                        Pesanan Berhasil Dibuat!
                                    </h1>
                                    <p className="text-green-100">
                                        Terima kasih atas pesanan Anda. Kami akan segera memproses pesanan ini.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pesanan</h2>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Nomor Invoice:</span>
                                            <p className="text-lg font-bold text-gray-900">{order.nomor_invoice}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Tanggal Pesanan:</span>
                                            <p className="text-gray-900">{formatDate(order.tanggal_penjualan)}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Metode Pembayaran:</span>
                                            <p className="text-gray-900 capitalize">{order.metode_pembayaran}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Jenis Pengiriman:</span>
                                            <p className="text-gray-900 capitalize">
                                                {order.metode_pengiriman === 'pickup' ? 'Ambil di Toko' : 'Delivery'}
                                                {order.metode_pengiriman === 'delivery' && order.jarak_km && (
                                                    <span className="text-sm text-gray-500 ml-2">
                                                        ({order.jarak_km.toFixed(2)} km)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pengiriman</h2>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Nama Penerima:</span>
                                            <p className="text-gray-900">{order.pelanggan?.nama_pelanggan || 'Tidak tersedia'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">No. Telepon:</span>
                                            <p className="text-gray-900">{order.pelanggan?.nomor_hp || 'Tidak tersedia'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Alamat:</span>
                                            <p className="text-gray-900">
                                                {order.metode_pengiriman === 'pickup' 
                                                    ? 'Ambil di toko (Jl. Terusan Kopo No. 30, Bandung)'
                                                    : (order.alamat_pengiriman || order.pelanggan?.alamat || 'Alamat tidak tersedia')
                                                }
                                            </p>
                                        </div>
                                        {order.catatan_pesanan && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Catatan:</span>
                                                <p className="text-gray-900">{order.catatan_pesanan}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="border-t pt-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Pesanan</h2>
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Produk
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Harga Satuan
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Jumlah
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Subtotal
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {order.details.map((detail) => (
                                                <tr key={detail.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {detail.produk.nama_produk}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(detail.harga_satuan)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {detail.jumlah_beli}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(detail.subtotal)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t pt-6 mt-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-500">Subtotal Produk:</span>
                                        <span className="text-sm text-gray-900">
                                            {formatCurrency(order.total_harga - order.ongkos_kirim)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-500">Ongkos Kirim:</span>
                                        <span className="text-sm text-gray-900">
                                            {formatCurrency(order.ongkos_kirim)}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-900">Total Pembayaran:</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(order.total_harga)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-6">
                                <Link
                                    href="/customer/orders"
                                    className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                                >
                                    Lihat Semua Pesanan
                                </Link>
                                <Link
                                    href="/customer/shop"
                                    className="flex-1 bg-gray-600 text-white text-center py-3 px-4 rounded-md hover:bg-gray-700 transition duration-200"
                                >
                                    Belanja Lagi
                                </Link>
                            </div>

                            {/* Information Box */}
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-blue-800 mb-2">Informasi Penting:</h3>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Simpan nomor invoice untuk referensi pesanan Anda</li>
                                    {order.metode_pembayaran === 'transfer' && (
                                        <li>• Bukti transfer Anda sedang diverifikasi oleh admin</li>
                                    )}
                                    {order.metode_pengiriman === 'delivery' ? (
                                        <li>• Pesanan akan dikirim ke alamat yang telah Anda tentukan</li>
                                    ) : (
                                        <li>• Silakan datang ke toko untuk mengambil pesanan Anda</li>
                                    )}
                                    <li>• Hubungi customer service jika ada pertanyaan</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}

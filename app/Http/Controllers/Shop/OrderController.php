<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\TtDataPenjualan;
use App\Models\TtDetailPenjualan;
use App\Models\TmDataProduk;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login')
                ->with('error', 'Silakan login untuk melihat pesanan Anda');
        }

        // In a real implementation, you would have an orders table linked to users
        // For now, we'll show empty orders
        $orders = [];

        return Inertia::render('Shop/Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function create()
    {
        $checkoutData = session()->get('checkout_data');
        
        if (!$checkoutData) {
            return redirect()->route('shop.checkout')
                ->with('error', 'Data checkout tidak ditemukan');
        }

        $cart = session()->get('cart', []);
        
        if (empty($cart)) {
            return redirect()->route('shop.cart.index')
                ->with('error', 'Keranjang belanja kosong');
        }

        try {
            DB::beginTransaction();

            // Create order in penjualan table
            $orderNumber = $this->generateOrderNumber();
            
            $cartItems = array_values($cart);
            $subtotal = collect($cart)->sum('subtotal');
            $appliedPromo = session()->get('applied_promo');
            $discount = $this->calculateDiscount($subtotal, $appliedPromo);
            $shippingId = session()->get('selected_shipping', 1);
            $shippingCost = $this->getShippingCost($shippingId, $subtotal);
            $total = $subtotal - $discount + $shippingCost;

            // Create main sales record
            $penjualan = TtDataPenjualan::create([
                'nomor_transaksi' => $orderNumber,
                'tanggal_transaksi' => now(),
                'total_harga' => $total,
                'metode_pembayaran' => $this->getPaymentMethodName($checkoutData['payment_method']),
                'status' => 'pending',
                'catatan' => $checkoutData['notes'] ?? '',
                'alamat_pengiriman' => $this->formatShippingAddress($checkoutData),
                'biaya_pengiriman' => $shippingCost,
                'diskon' => $discount,
                'kode_promo' => $appliedPromo['code'] ?? null,
            ]);

            // Create order details
            foreach ($cartItems as $item) {
                TtDetailPenjualan::create([
                    'id_penjualan' => $penjualan->id,
                    'id_produk' => $item['id'],
                    'jumlah_produk' => $item['quantity'],
                    'harga_satuan' => $item['price'],
                    'subtotal' => $item['subtotal'],
                    'catatan_item' => $item['notes'] ?? '',
                ]);

                // Update product stock if available
                $product = TmDataProduk::find($item['id']);
                if ($product && isset($product->stok)) {
                    $product->decrement('stok', $item['quantity']);
                }
            }

            DB::commit();

            // Clear cart and checkout data
            session()->forget(['cart', 'checkout_data', 'applied_promo', 'selected_shipping']);

            // Redirect to order confirmation
            return redirect()->route('shop.order.show', $penjualan->id)
                ->with('success', 'Pesanan berhasil dibuat!');

        } catch (\Exception $e) {
            DB::rollback();
            
            return redirect()->route('shop.checkout')
                ->with('error', 'Terjadi kesalahan saat membuat pesanan: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $order = TtDataPenjualan::with(['details.produk'])
            ->findOrFail($id);

        return Inertia::render('Shop/Orders/Show', [
            'order' => [
                'id' => $order->id,
                'nomor_transaksi' => $order->nomor_transaksi,
                'tanggal_transaksi' => $order->tanggal_transaksi,
                'status' => $order->status,
                'total_harga' => $order->total_harga,
                'metode_pembayaran' => $order->metode_pembayaran,
                'alamat_pengiriman' => $order->alamat_pengiriman,
                'biaya_pengiriman' => $order->biaya_pengiriman,
                'diskon' => $order->diskon,
                'kode_promo' => $order->kode_promo,
                'catatan' => $order->catatan,
                'items' => $order->details->map(function ($detail) {
                    return [
                        'id' => $detail->id,
                        'produk' => $detail->produk,
                        'jumlah_produk' => $detail->jumlah_produk,
                        'harga_satuan' => $detail->harga_satuan,
                        'subtotal' => $detail->subtotal,
                        'catatan_item' => $detail->catatan_item,
                    ];
                }),
            ],
        ]);
    }

    public function track($orderNumber)
    {
        $order = TtDataPenjualan::where('nomor_transaksi', $orderNumber)
            ->with(['details.produk'])
            ->firstOrFail();

        $trackingSteps = $this->getTrackingSteps($order->status);

        return Inertia::render('Shop/Orders/Track', [
            'order' => [
                'id' => $order->id,
                'nomor_transaksi' => $order->nomor_transaksi,
                'status' => $order->status,
                'tanggal_transaksi' => $order->tanggal_transaksi,
                'total_harga' => $order->total_harga,
            ],
            'trackingSteps' => $trackingSteps,
        ]);
    }

    public function invoice($id)
    {
        $order = TtDataPenjualan::with(['details.produk'])
            ->findOrFail($id);

        return Inertia::render('Shop/Orders/Invoice', [
            'order' => [
                'id' => $order->id,
                'nomor_transaksi' => $order->nomor_transaksi,
                'tanggal_transaksi' => $order->tanggal_transaksi,
                'status' => $order->status,
                'total_harga' => $order->total_harga,
                'metode_pembayaran' => $order->metode_pembayaran,
                'alamat_pengiriman' => $order->alamat_pengiriman,
                'biaya_pengiriman' => $order->biaya_pengiriman,
                'diskon' => $order->diskon,
                'kode_promo' => $order->kode_promo,
                'items' => $order->details->map(function ($detail) {
                    return [
                        'produk' => $detail->produk,
                        'jumlah_produk' => $detail->jumlah_produk,
                        'harga_satuan' => $detail->harga_satuan,
                        'subtotal' => $detail->subtotal,
                    ];
                }),
            ],
        ]);
    }

    private function generateOrderNumber()
    {
        $prefix = 'ORD';
        $date = now()->format('ymd');
        $randomNumber = rand(1000, 9999);
        
        return $prefix . $date . $randomNumber;
    }

    private function calculateDiscount($subtotal, $appliedPromo)
    {
        if (!$appliedPromo) {
            return 0;
        }

        if ($appliedPromo['discount_type'] === 'percentage') {
            return ($subtotal * $appliedPromo['discount_value']) / 100;
        } else {
            return $appliedPromo['discount_value'];
        }
    }

    private function getShippingCost($shippingId, $subtotal)
    {
        $shippingOptions = [
            1 => ['price' => 15000, 'free_threshold' => null],
            2 => ['price' => 25000, 'free_threshold' => null],
            3 => ['price' => 35000, 'free_threshold' => null],
            4 => ['price' => 0, 'free_threshold' => 100000],
        ];

        $option = $shippingOptions[$shippingId] ?? $shippingOptions[1];

        if ($option['free_threshold'] && $subtotal >= $option['free_threshold']) {
            return 0;
        }

        return $option['price'];
    }

    private function getPaymentMethodName($methodId)
    {
        $methods = [
            1 => 'Transfer Bank BCA',
            2 => 'Transfer Bank Mandiri',
            3 => 'GoPay',
            4 => 'OVO',
            5 => 'DANA',
            6 => 'COD',
        ];

        return $methods[$methodId] ?? 'Unknown';
    }

    private function formatShippingAddress($checkoutData)
    {
        return implode(', ', [
            $checkoutData['shipping_address']['street'] ?? '',
            $checkoutData['shipping_address']['city'] ?? '',
            $checkoutData['shipping_address']['state'] ?? '',
            $checkoutData['shipping_address']['postal_code'] ?? '',
        ]);
    }

    private function getTrackingSteps($currentStatus)
    {
        $allSteps = [
            'pending' => [
                'title' => 'Pesanan Diterima',
                'description' => 'Pesanan Anda telah diterima dan sedang diproses',
                'completed' => true,
            ],
            'processing' => [
                'title' => 'Sedang Diproses',
                'description' => 'Pesanan sedang disiapkan',
                'completed' => in_array($currentStatus, ['processing', 'shipped', 'delivered']),
            ],
            'shipped' => [
                'title' => 'Dikirim',
                'description' => 'Pesanan sedang dalam perjalanan',
                'completed' => in_array($currentStatus, ['shipped', 'delivered']),
            ],
            'delivered' => [
                'title' => 'Terkirim',
                'description' => 'Pesanan telah sampai di tujuan',
                'completed' => $currentStatus === 'delivered',
            ],
        ];

        return array_values($allSteps);
    }
}

<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\TmDataPelanggan;
use App\Models\TmDataProduk;
use App\Models\TtDataPenjualan;
use App\Models\TtDetailPenjualan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CustomerOrderController extends Controller
{
    // Koordinat toko (Jl. Terusan Kopo No. 30, Bandung)
    private $tokoLat = -6.968859902177227;
    private $tokoLng = 107.57466169818552;

    /**
     * Display the checkout page.
     */
    public function checkout()
    {
        // Temporary: Allow access without customer session for testing
        // if (!session()->has('customer_id')) {
        //     return redirect('/customer/login');
        // }

        // Get cart items from session
        $cartData = session()->get('cart', []);

        // For now, allow access even if cart is empty for testing
        // if (empty($cartData)) {
        //     return redirect('/shop')->with('error', 'Keranjang kosong. Silakan tambahkan produk terlebih dahulu.');
        // }

        // If cart is empty, create dummy data for testing
        if (empty($cartData)) {
            $product = \App\Models\TmDataProduk::first();
            if ($product) {
                $cartData = [
                    $product->id => [
                        'product' => $product,
                        'quantity' => 1,
                        'subtotal' => $product->harga_jual
                    ]
                ];
                session(['cart' => $cartData]);
            }
        }

        // Transform cart data for frontend
        $cartItems = collect($cartData)->map(function ($item) {
            return [
                'id' => $item['product']->id,
                'produk' => $item['product'],
                'quantity' => $item['quantity'],
                'harga_satuan' => $item['product']->harga_jual,
                'total_price' => $item['subtotal']
            ];
        })->values();

        $subtotal = $cartItems->sum('total_price');
        
        $customerProfile = \App\Models\TmDataPelanggan::find(session('customer_id'));

        // Get customer auth for navbar
        $customerAuth = null;
        if (session()->has('customer_id')) {
            $customerAuth = \App\Models\TmDataPelanggan::find(session('customer_id'));
        }

        return Inertia::render('Shop/CustomerCheckout', [
            'cartItems' => $cartItems,
            'subtotal' => $subtotal,
            'shippingCost' => 0, // Default shipping cost
            'discount' => 0, // Default discount
            'total' => $subtotal, // Initial total without shipping
            'paymentMethods' => [
                [
                    'id' => 1,
                    'name' => 'Transfer Bank',
                    'type' => 'bank_transfer',
                    'description' => 'Transfer ke rekening BCA/Mandiri'
                ],
                [
                    'id' => 2,
                    'name' => 'E-Wallet',
                    'type' => 'e_wallet', 
                    'description' => 'OVO, GoPay, DANA'
                ],
                [
                    'id' => 3,
                    'name' => 'Bayar Ditempat (Pickup)',
                    'type' => 'cash_on_delivery',
                    'description' => 'Bayar saat ambil pesanan'
                ]
            ],
            'customerProfile' => $customerProfile,
            'tokoLocation' => [
                'lat' => $this->tokoLat,
                'lng' => $this->tokoLng,
                'address' => 'Hamdani Stationery Store, Jl. Terusan Kopo No. 30, Bandung'
            ],
            'auth' => [
                'customer' => $customerAuth,
                'user' => $customerAuth // Alias for compatibility
            ]
        ]);
    }

    /**
     * Calculate shipping cost based on distance.
     */
    public function calculateShipping(Request $request)
    {
        $request->validate([
            'customer_lat' => 'required|numeric',
            'customer_lng' => 'required|numeric',
            'pickup_option' => 'nullable|boolean' // Optional pickup option
        ]);

        // If customer chooses pickup
        if ($request->pickup_option) {
            return response()->json([
                'distance' => 0,
                'shipping_cost' => 0,
                'shipping_method' => 'pickup',
                'estimated_time' => 'Siap diambil dalam 30 menit'
            ]);
        }

        $distance = $this->calculateDistance(
            $this->tokoLat,
            $this->tokoLng,
            (float) $request->customer_lat,
            (float) $request->customer_lng
        );

        // Debug: Log koordinat untuk debugging
        Log::info('Shipping calculation:', [
            'toko_lat' => $this->tokoLat,
            'toko_lng' => $this->tokoLng,
            'customer_lat' => (float) $request->customer_lat,
            'customer_lng' => (float) $request->customer_lng,
            'distance' => $distance
        ]);

        $shippingCost = 0;
        $shippingMethod = '';
        $estimatedTime = '';

        if ($distance <= 1) {
            // Antar sendiri untuk jarak kurang dari 1km
            $shippingCost = 5000; // Rp 5.000
            $shippingMethod = 'antar_sendiri';
            $estimatedTime = '30-60 menit';
        } else {
            // Gojek untuk jarak lebih dari 1km
            $shippingCost = max(8000, round($distance * 3000)); // Minimum Rp 8.000, atau Rp 3.000/km
            $shippingMethod = 'gojek';
            $estimatedTime = '45-90 menit';
        }

        return response()->json([
            'distance' => round($distance, 2),
            'shipping_cost' => (int) $shippingCost, // Ensure integer
            'shipping_method' => $shippingMethod,
            'estimated_time' => $estimatedTime
        ]);
    }

    /**
     * Process the order.
     */
    public function processOrder(Request $request)
    {
        Log::info('ProcessOrder started', ['request_data' => $request->all()]);
        
        // Debug session and auth
        Log::info('Session debug', [
            'customer_id' => session('customer_id'),
            'auth_check' => Auth::check(),
            'auth_id' => Auth::id(),
            'auth_user' => Auth::user() ? Auth::user()->name : 'none',
            'session_id' => session()->getId(),
            'all_session' => session()->all()
        ]);
        
        // Temporary: Use session customer_id instead of Auth::check()
        $customerId = session('customer_id');
        if (!$customerId) {
            Log::error('ProcessOrder: No customer session');
            return response()->json(['error' => 'No customer session found'], 401);
        }

        // Get cart items from session instead of database
        $cartData = session()->get('cart', []);
        Log::info('Cart data retrieved', ['cart_count' => count($cartData)]);

        if (empty($cartData)) {
            Log::error('ProcessOrder: Cart is empty');
            return redirect()->back()->withErrors(['error' => 'Keranjang kosong']);
        }

        // Transform cart data
        $cartItems = collect($cartData)->map(function ($item) {
            return (object) [
                'produk' => $item['product'],
                'produk_id' => $item['product']->id,
                'quantity' => $item['quantity'],
                'harga_satuan' => $item['product']->harga_jual,
                'total_price' => $item['subtotal']
            ];
        });

        // Calculate shipping based on delivery option
        $distance = 0;
        $shippingCost = 0;
        $shippingMethod = 'pickup';
        
        if ($request->delivery_option === 'delivery') {
            // Calculate distance for delivery
            $distance = $this->calculateDistance(
                $this->tokoLat,
                $this->tokoLng,
                $request->customer_lat,
                $request->customer_lng
            );

            if ($distance <= 1) {
                $shippingCost = 5000;
                $shippingMethod = 'antar_sendiri';
            } else {
                $shippingCost = max(8000, $distance * 3000);
                $shippingMethod = 'gojek';
            }
        }
        // For pickup, everything stays 0

        $subtotal = $cartItems->sum('total_price');
        $total = $subtotal + $shippingCost;

        // Handle file upload
        $buktiTransferPath = null;
        if ($request->hasFile('bukti_transfer')) {
            $buktiTransferPath = $request->file('bukti_transfer')->store('bukti_transfer', 'public');
        }

        try {
            DB::beginTransaction();
            Log::info('Database transaction started');

            // Get customer data to get the user_id for customer_id FK
            $customer = TmDataPelanggan::find($customerId);
            if (!$customer) {
                throw new \Exception("Customer tidak ditemukan");
            }

            // Prepare order data with all required fields
            $orderData = [
                'nomor_invoice' => $this->generateInvoiceNumber(),
                'tanggal_penjualan' => now(),
                'customer_id' => $customer->user_id, // FK to users.id
                'pelanggan_id' => $customerId, // FK to tm_data_pelanggan.id
                'kasir_id' => 1, // Default for online orders
                'total_harga' => $total,
                'total_belanja' => $subtotal,
                'total_bayar' => $total,
                'jumlah_dibayar' => $request->metode_pembayaran === 'cod' ? 0 : $total,
                'kembalian' => 0,
                'metode_pembayaran' => $request->metode_pembayaran,
                'status_pembayaran' => $request->metode_pembayaran === 'cod' ? 'pending' : 'pending',
                'status_pesanan' => 'pending',
                'alamat_pengiriman' => $request->pickup_option ? null : $request->alamat_pengiriman,
                'ongkos_kirim' => $shippingCost,
                'metode_pengiriman' => $shippingMethod,
                'jarak_km' => $distance,
                'catatan_pesanan' => $request->catatan_pesanan,
                'bukti_transfer' => $buktiTransferPath,
            ];
            
            Log::info('Order data prepared', $orderData);

            // Create order
            $order = TtDataPenjualan::create($orderData);
            Log::info('Order created', ['order_id' => $order->id]);

            // Create order details and update stock
            foreach ($cartItems as $cartItem) {
                // Check stock again
                $produk = TmDataProduk::lockForUpdate()->find($cartItem->produk_id);
                
                if ($produk->stok_tersedia < $cartItem->quantity) {
                    throw new \Exception("Stok produk {$produk->nama_produk} tidak mencukupi");
                }

                // Create order detail
                TtDetailPenjualan::create([
                    'penjualan_id' => $order->id,
                    'produk_id' => $cartItem->produk_id,
                    'jumlah_beli' => $cartItem->quantity,
                    'harga_satuan' => $cartItem->harga_satuan,
                    'subtotal' => $cartItem->total_price,
                ]);

                // Update stock
                $produk->decrement('stok_tersedia', $cartItem->quantity);
            }

            // Clear cart from session
            session()->forget('cart');
            Log::info('Cart cleared from session');

            DB::commit();

        return redirect()->route('customer.order-success', $order->id)
            ->with('success', 'Pesanan berhasil dibuat!');        } catch (\Exception $e) {
            DB::rollback();
            Log::error('ProcessOrder failed', [
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors([
                'error' => 'Gagal memproses pesanan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Show order success page.
     */
    public function orderSuccess($orderId)
    {
        $order = TtDataPenjualan::with(['details.produk', 'customer'])
            ->where('id', $orderId)
            ->firstOrFail();

        // Debug: Log the order data to see what's being sent
        Log::info('Order data for OrderSuccess:', $order->toArray());

        // Transform data to match frontend interface
        $transformedOrder = [
            'id' => $order->id,
            'nomor_invoice' => $order->nomor_invoice,
            'total_harga' => $order->total_harga,
            'ongkos_kirim' => $order->biaya_pengiriman ?? 0, // Map biaya_pengiriman to ongkos_kirim
            'metode_pengiriman' => $order->metode_pengiriman,
            'alamat_pengiriman' => $order->alamat_pengiriman,
            'jarak_km' => $order->jarak_km,
            'metode_pembayaran' => $order->metode_pembayaran,
            'catatan_pesanan' => $order->catatan_pesanan,
            'tanggal_penjualan' => $order->tanggal_penjualan,
            'details' => $order->details->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'produk' => [
                        'nama_produk' => $detail->produk->nama_produk,
                        'harga' => $detail->produk->harga,
                    ],
                    'jumlah_beli' => $detail->jumlah_beli,
                    'harga_satuan' => $detail->harga_satuan,
                    'subtotal' => $detail->subtotal,
                ];
            }),
            'pelanggan' => $order->customer ? [
                'nama_pelanggan' => $order->customer->nama_pelanggan,
                'nomor_hp' => $order->customer->nomor_hp, // Now uses accessor
                'alamat' => $order->customer->alamat, // Now uses accessor
            ] : null,
        ];

        return Inertia::render('Customer/OrderSuccess', [
            'order' => $transformedOrder
        ]);
    }

    /**
     * Get customer order history.
     */
    public function orderHistory()
    {
        // Use session customer_id for consistency with processOrder
        $customerId = session('customer_id');
        
        // Debug information
        Log::info('OrderHistory Debug', [
            'session_customer_id' => $customerId,
            'session_all' => session()->all(),
            'auth_check' => Auth::check(),
            'auth_user' => Auth::user() ? Auth::user()->name : null
        ]);
        
        if (!$customerId) {
            Log::warning('No customer session found, redirecting to login');
            return redirect()->route('customer.login');
        }

        // Get customer data for auth context
        $customer = \App\Models\TmDataPelanggan::find($customerId);
        
        // Debug customer data
        Log::info('Customer found', ['customer' => $customer ? $customer->toArray() : null]);

        // Get all orders for debugging
        $allOrders = TtDataPenjualan::all(['id', 'customer_id', 'nomor_invoice', 'total_harga']);
        Log::info('All orders in database', ['orders' => $allOrders->toArray()]);

        $orders = TtDataPenjualan::with(['details.produk'])
            ->where('customer_id', $customerId)
            ->orderBy('created_at', 'desc')
            ->get(); // Use get() instead of paginate() for debugging

        Log::info('Orders for customer', [
            'customer_id' => $customerId,
            'orders_count' => $orders->count(),
            'orders' => $orders->toArray()
        ]);

        return Inertia::render('Shop/OrderHistory', [
            'orders' => $orders,
            'auth' => [
                'customer' => $customer
            ]
        ]);
    }

    /**
     * Show order detail.
     */
    public function orderDetail($orderId)
    {
        // Use session customer_id for consistency
        $customerId = session('customer_id');
        
        if (!$customerId) {
            return redirect()->route('customer.login');
        }

        // Get customer data for auth context
        $customer = \App\Models\TmDataPelanggan::find($customerId);

        $order = TtDataPenjualan::with(['details.produk', 'customer'])
            ->where('id', $orderId)
            ->where('customer_id', $customerId)
            ->firstOrFail();

        return Inertia::render('Shop/OrderDetail', [
            'order' => $order,
            'auth' => [
                'customer' => $customer
            ]
        ]);
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371; // Earth radius in kilometers

        $lat1Rad = deg2rad($lat1);
        $lng1Rad = deg2rad($lng1);
        $lat2Rad = deg2rad($lat2);
        $lng2Rad = deg2rad($lng2);

        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLng = $lng2Rad - $lng1Rad;

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) + 
             cos($lat1Rad) * cos($lat2Rad) * 
             sin($deltaLng / 2) * sin($deltaLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Generate unique invoice number.
     */
    private function generateInvoiceNumber()
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        
        // Get the last invoice number for today
        $lastInvoice = TtDataPenjualan::where('nomor_invoice', 'like', $prefix . $date . '%')
            ->orderBy('nomor_invoice', 'desc')
            ->first();

        if ($lastInvoice) {
            $lastNumber = intval(substr($lastInvoice->nomor_invoice, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . $date . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}

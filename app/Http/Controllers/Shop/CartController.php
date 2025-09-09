<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\TmDataProduk;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    public function index()
    {
        $cartItems = $this->getCartItems();
        $availablePromoCodes = $this->getAvailablePromoCodes();
        $shippingOptions = $this->getShippingOptions();

        return Inertia::render('Shop/Cart', [
            'cartItems' => $cartItems,
            'availablePromoCodes' => $availablePromoCodes,
            'shippingOptions' => $shippingOptions,
        ]);
    }

    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:tm_data_produk,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = TmDataProduk::with('kategori')->find($request->product_id);
        
        if (!$product || !$product->status_aktif || $product->stok_tersedia < $request->quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Product tidak tersedia atau stok tidak mencukupi'
            ], 400);
        }

        $cart = session()->get('cart', []);
        $productId = $request->product_id;
        
        if (isset($cart[$productId])) {
            $newQuantity = $cart[$productId]['quantity'] + $request->quantity;
            if ($newQuantity > $product->stok_tersedia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jumlah melebihi stok yang tersedia'
                ], 400);
            }
            $cart[$productId]['quantity'] = $newQuantity;
            $cart[$productId]['subtotal'] = $cart[$productId]['quantity'] * $product->harga_jual;
        } else {
            $cart[$productId] = [
                'product' => $product,
                'quantity' => $request->quantity,
                'subtotal' => $request->quantity * $product->harga_jual,
            ];
        }

        session()->put('cart', $cart);

        // For Inertia requests, redirect back with flash message
        if ($request->header('X-Inertia')) {
            return redirect()->back()->with([
                'success' => true,
                'message' => 'Product berhasil ditambahkan ke keranjang',
                'cartCount' => collect($cart)->sum('quantity')
            ]);
        }

        // For regular AJAX requests
        return response()->json([
            'success' => true,
            'message' => 'Product berhasil ditambahkan ke keranjang',
            'cartCount' => collect($cart)->sum('quantity')
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:tm_data_produk,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = TmDataProduk::find($request->product_id);
        
        if ($request->quantity > $product->stok_tersedia) {
            return response()->json([
                'success' => false,
                'message' => 'Jumlah melebihi stok yang tersedia'
            ], 400);
        }

        $cart = session()->get('cart', []);
        $productId = $request->product_id;

        if (isset($cart[$productId])) {
            $cart[$productId]['quantity'] = $request->quantity;
            $cart[$productId]['subtotal'] = $request->quantity * $product->harga_jual;
            session()->put('cart', $cart);
        }

        return response()->json([
            'success' => true,
            'message' => 'Keranjang berhasil diperbarui',
            'cartCount' => collect($cart)->sum('quantity')
        ]);
    }

    public function remove($id)
    {
        $cart = session()->get('cart', []);
        
        if (isset($cart[$id])) {
            unset($cart[$id]);
            session()->put('cart', $cart);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product berhasil dihapus dari keranjang',
            'cartCount' => collect($cart)->sum('quantity')
        ]);
    }

    public function clear()
    {
        session()->forget('cart');
        session()->forget('applied_promo');

        return response()->json([
            'success' => true,
            'message' => 'Keranjang berhasil dikosongkan'
        ]);
    }

    public function applyPromo(Request $request)
    {
        $request->validate([
            'promo_code' => 'required|string',
        ]);

        $availablePromoCodes = $this->getAvailablePromoCodes();
        $promoCode = collect($availablePromoCodes)->firstWhere('code', strtoupper($request->promo_code));

        if (!$promoCode) {
            return response()->json([
                'success' => false,
                'message' => 'Kode promo tidak valid'
            ], 400);
        }

        $cart = session()->get('cart', []);
        $subtotal = collect($cart)->sum('subtotal');

        if (isset($promoCode['minimum_amount']) && $subtotal < $promoCode['minimum_amount']) {
            return response()->json([
                'success' => false,
                'message' => "Minimum pembelian untuk kode promo ini adalah Rp " . number_format($promoCode['minimum_amount'], 0, ',', '.')
            ], 400);
        }

        session()->put('applied_promo', $promoCode);

        return response()->json([
            'success' => true,
            'message' => 'Kode promo berhasil diterapkan',
            'promo' => $promoCode
        ]);
    }

    public function removePromo()
    {
        session()->forget('applied_promo');

        return response()->json([
            'success' => true,
            'message' => 'Kode promo berhasil dihapus'
        ]);
    }

    private function getCartItems()
    {
        $cart = session()->get('cart', []);
        return array_values($cart);
    }

    private function getAvailablePromoCodes()
    {
        // This should be from database in real implementation
        return [
            [
                'code' => 'WELCOME10',
                'discount_type' => 'percentage',
                'discount_value' => 10,
                'minimum_amount' => 50000,
            ],
            [
                'code' => 'SAVE20K',
                'discount_type' => 'fixed',
                'discount_value' => 20000,
                'minimum_amount' => 100000,
            ],
            [
                'code' => 'NEWUSER',
                'discount_type' => 'percentage',
                'discount_value' => 15,
                'minimum_amount' => 75000,
            ],
        ];
    }

    private function getShippingOptions()
    {
        // This should be from database or shipping provider API
        return [
            [
                'id' => 1,
                'name' => 'Regular (3-5 hari kerja)',
                'price' => 15000,
                'estimated_days' => '3-5 hari kerja',
            ],
            [
                'id' => 2,
                'name' => 'Express (1-2 hari kerja)',
                'price' => 25000,
                'estimated_days' => '1-2 hari kerja',
            ],
            [
                'id' => 3,
                'name' => 'Same Day (hari ini)',
                'price' => 35000,
                'estimated_days' => 'Hari ini',
            ],
            [
                'id' => 4,
                'name' => 'Gratis Ongkir (min. Rp 100k)',
                'price' => 0,
                'estimated_days' => '3-7 hari kerja',
            ],
        ];
    }
}

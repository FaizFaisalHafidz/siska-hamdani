<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function index()
    {
        $cart = session()->get('cart', []);
        
        if (empty($cart)) {
            return redirect()->route('shop.cart.index')
                ->with('error', 'Keranjang belanja Anda kosong');
        }

        $cartItems = array_values($cart);
        $subtotal = collect($cart)->sum('subtotal');
        $appliedPromo = session()->get('applied_promo');
        $discount = $this->calculateDiscount($subtotal, $appliedPromo);
        $shippingId = session()->get('selected_shipping', 1);
        $shippingCost = $this->getShippingCost($shippingId, $subtotal);
        $total = $subtotal - $discount + $shippingCost;

        $paymentMethods = $this->getPaymentMethods();

        return Inertia::render('Shop/Checkout', [
            'cartItems' => $cartItems,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'shippingCost' => $shippingCost,
            'total' => $total,
            'promoCode' => $appliedPromo['code'] ?? null,
            'shippingId' => $shippingId,
            'paymentMethods' => $paymentMethods,
            'user' => Auth::user(),
        ]);
    }

    public function process(Request $request)
    {
        // This will redirect to the order creation process
        return redirect()->route('shop.order.create')
            ->with('checkout_data', $request->all());
    }

    public function shipping(Request $request)
    {
        $request->validate([
            'shipping_id' => 'required|integer',
        ]);

        session()->put('selected_shipping', $request->shipping_id);

        return response()->json([
            'success' => true,
            'message' => 'Metode pengiriman berhasil dipilih'
        ]);
    }

    public function calculateShipping(Request $request)
    {
        $request->validate([
            'shipping_id' => 'required|integer',
            'city' => 'required|string',
            'postal_code' => 'required|string',
        ]);

        // In real implementation, this would call shipping provider API
        $cart = session()->get('cart', []);
        $subtotal = collect($cart)->sum('subtotal');
        $cost = $this->getShippingCost($request->shipping_id, $subtotal);

        return response()->json([
            'success' => true,
            'shipping_cost' => $cost,
        ]);
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

    private function getPaymentMethods()
    {
        return [
            [
                'id' => 1,
                'name' => 'Transfer Bank BCA',
                'type' => 'bank_transfer',
                'icon' => 'bca.png',
                'description' => 'Transfer ke rekening BCA',
                'account_number' => '1234567890',
                'account_name' => 'Siska Copy Center',
                'fee' => 0,
            ],
            [
                'id' => 2,
                'name' => 'Transfer Bank Mandiri',
                'type' => 'bank_transfer',
                'icon' => 'mandiri.png',
                'description' => 'Transfer ke rekening Mandiri',
                'account_number' => '0987654321',
                'account_name' => 'Siska Copy Center',
                'fee' => 0,
            ],
            [
                'id' => 3,
                'name' => 'GoPay',
                'type' => 'e_wallet',
                'icon' => 'gopay.png',
                'description' => 'Bayar dengan GoPay',
                'fee' => 2500,
            ],
            [
                'id' => 4,
                'name' => 'OVO',
                'type' => 'e_wallet',
                'icon' => 'ovo.png',
                'description' => 'Bayar dengan OVO',
                'fee' => 2500,
            ],
            [
                'id' => 5,
                'name' => 'DANA',
                'type' => 'e_wallet',
                'icon' => 'dana.png',
                'description' => 'Bayar dengan DANA',
                'fee' => 2500,
            ],
            [
                'id' => 6,
                'name' => 'Bayar di Tempat (COD)',
                'type' => 'cash_on_delivery',
                'icon' => 'cod.png',
                'description' => 'Bayar saat barang tiba',
                'fee' => 5000,
            ],
        ];
    }
}

<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\TtDataPenjualan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index($orderId)
    {
        $order = TtDataPenjualan::findOrFail($orderId);

        if ($order->status !== 'pending') {
            return redirect()->route('shop.order.show', $orderId)
                ->with('info', 'Pembayaran untuk pesanan ini telah diproses');
        }

        $paymentMethods = $this->getPaymentMethods();
        $selectedMethod = collect($paymentMethods)->firstWhere('id', session()->get('payment_method_id'));

        return Inertia::render('Shop/Payment', [
            'order' => [
                'id' => $order->id,
                'nomor_transaksi' => $order->nomor_transaksi,
                'total_harga' => $order->total_harga,
                'metode_pembayaran' => $order->metode_pembayaran,
                'status' => $order->status,
            ],
            'paymentMethod' => $selectedMethod,
            'paymentInstructions' => $this->getPaymentInstructions($selectedMethod),
        ]);
    }

    public function process(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:tt_data_penjualan,id',
            'payment_method' => 'required|integer',
            'payment_proof' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $order = TtDataPenjualan::findOrFail($request->order_id);

        if ($order->status !== 'pending') {
            return redirect()->route('shop.order.show', $request->order_id)
                ->with('error', 'Pesanan ini sudah diproses');
        }

        try {
            // Handle payment proof upload if provided
            $paymentProofPath = null;
            if ($request->hasFile('payment_proof')) {
                $paymentProofPath = $request->file('payment_proof')->store('payment_proofs', 'public');
            }

            // Update order with payment information
            $order->update([
                'status' => 'paid',
                'payment_proof' => $paymentProofPath,
                'payment_date' => now(),
                'payment_notes' => $request->payment_notes,
            ]);

            Log::info('Payment processed for order: ' . $order->nomor_transaksi);

            return redirect()->route('shop.payment.success', $order->id)
                ->with('success', 'Pembayaran berhasil diproses!');

        } catch (\Exception $e) {
            Log::error('Payment processing error: ' . $e->getMessage());
            
            return redirect()->back()
                ->with('error', 'Terjadi kesalahan saat memproses pembayaran');
        }
    }

    public function success($orderId)
    {
        $order = TtDataPenjualan::findOrFail($orderId);

        return Inertia::render('Shop/PaymentSuccess', [
            'order' => [
                'id' => $order->id,
                'nomor_transaksi' => $order->nomor_transaksi,
                'total_harga' => $order->total_harga,
                'status' => $order->status,
                'payment_date' => $order->payment_date,
            ],
        ]);
    }

    public function webhook(Request $request)
    {
        // Handle payment gateway webhooks
        Log::info('Payment webhook received', $request->all());

        $paymentStatus = $request->input('status');
        $orderNumber = $request->input('order_id');
        $signature = $request->input('signature');

        // Verify webhook signature (implement based on payment gateway)
        if (!$this->verifyWebhookSignature($signature, $request->all())) {
            Log::warning('Invalid webhook signature');
            return response()->json(['status' => 'error', 'message' => 'Invalid signature'], 400);
        }

        $order = TtDataPenjualan::where('nomor_transaksi', $orderNumber)->first();

        if (!$order) {
            Log::warning('Order not found for webhook: ' . $orderNumber);
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        // Update order status based on payment status
        switch ($paymentStatus) {
            case 'success':
                $order->update([
                    'status' => 'paid',
                    'payment_date' => now(),
                ]);
                Log::info('Order marked as paid via webhook: ' . $orderNumber);
                break;
            
            case 'failed':
                $order->update([
                    'status' => 'payment_failed',
                ]);
                Log::info('Order marked as payment failed via webhook: ' . $orderNumber);
                break;
            
            case 'expired':
                $order->update([
                    'status' => 'expired',
                ]);
                Log::info('Order marked as expired via webhook: ' . $orderNumber);
                break;
        }

        return response()->json(['status' => 'success']);
    }

    public function cancel($orderId)
    {
        $order = TtDataPenjualan::findOrFail($orderId);

        if (!in_array($order->status, ['pending', 'payment_failed'])) {
            return redirect()->route('shop.order.show', $orderId)
                ->with('error', 'Pesanan ini tidak dapat dibatalkan');
        }

        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        // Restore product stock
        foreach ($order->details as $detail) {
            $product = $detail->produk;
            if ($product && isset($product->stok)) {
                $product->increment('stok', $detail->jumlah_produk);
            }
        }

        return redirect()->route('shop.order.show', $orderId)
            ->with('success', 'Pesanan berhasil dibatalkan');
    }

    private function getPaymentMethods()
    {
        return [
            [
                'id' => 1,
                'name' => 'Transfer Bank BCA',
                'type' => 'bank_transfer',
                'icon' => 'bca.png',
                'account_number' => '1234567890',
                'account_name' => 'Siska Copy Center',
                'fee' => 0,
            ],
            [
                'id' => 2,
                'name' => 'Transfer Bank Mandiri',
                'type' => 'bank_transfer',
                'icon' => 'mandiri.png',
                'account_number' => '0987654321',
                'account_name' => 'Siska Copy Center',
                'fee' => 0,
            ],
            [
                'id' => 3,
                'name' => 'GoPay',
                'type' => 'e_wallet',
                'icon' => 'gopay.png',
                'fee' => 2500,
            ],
            [
                'id' => 4,
                'name' => 'OVO',
                'type' => 'e_wallet',
                'icon' => 'ovo.png',
                'fee' => 2500,
            ],
            [
                'id' => 5,
                'name' => 'DANA',
                'type' => 'e_wallet',
                'icon' => 'dana.png',
                'fee' => 2500,
            ],
            [
                'id' => 6,
                'name' => 'COD',
                'type' => 'cash_on_delivery',
                'icon' => 'cod.png',
                'fee' => 5000,
            ],
        ];
    }

    private function getPaymentInstructions($paymentMethod)
    {
        if (!$paymentMethod) {
            return [];
        }

        switch ($paymentMethod['type']) {
            case 'bank_transfer':
                return [
                    'title' => 'Instruksi Transfer Bank',
                    'steps' => [
                        'Login ke aplikasi mobile banking atau internet banking Anda',
                        'Pilih menu Transfer ke Rekening Bank',
                        'Masukkan nomor rekening: ' . $paymentMethod['account_number'],
                        'Masukkan nama penerima: ' . $paymentMethod['account_name'],
                        'Masukkan jumlah transfer sesuai total pembayaran',
                        'Konfirmasi dan selesaikan transaksi',
                        'Simpan bukti transfer dan upload di halaman ini'
                    ],
                ];

            case 'e_wallet':
                return [
                    'title' => 'Instruksi Pembayaran ' . $paymentMethod['name'],
                    'steps' => [
                        'Buka aplikasi ' . $paymentMethod['name'] . ' di ponsel Anda',
                        'Pilih menu "Bayar" atau "Pay"',
                        'Scan QR Code yang ditampilkan di halaman ini',
                        'Konfirmasi pembayaran sesuai total yang tertera',
                        'Selesaikan pembayaran dengan PIN atau fingerprint',
                        'Simpan bukti pembayaran'
                    ],
                ];

            case 'cash_on_delivery':
                return [
                    'title' => 'Instruksi Bayar di Tempat (COD)',
                    'steps' => [
                        'Pesanan Anda akan diproses dan dikirim',
                        'Kurir akan menghubungi Anda sebelum pengiriman',
                        'Siapkan uang tunai sesuai total pembayaran',
                        'Lakukan pembayaran kepada kurir saat barang tiba',
                        'Periksa kondisi barang sebelum pembayaran',
                        'Simpan bukti pengiriman sebagai kwitansi'
                    ],
                ];

            default:
                return [];
        }
    }

    private function verifyWebhookSignature($signature, $payload)
    {
        // Implement webhook signature verification based on your payment gateway
        // This is a placeholder implementation
        $secretKey = config('app.payment_webhook_secret', 'your-secret-key');
        $expectedSignature = hash_hmac('sha256', json_encode($payload), $secretKey);
        
        return hash_equals($expectedSignature, $signature);
    }
}

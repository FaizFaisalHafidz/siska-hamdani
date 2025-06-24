<?php

namespace App\Exports\Sheets;

use App\Models\TtDataPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanPaymentMethodSheet extends BaseSheet implements FromView, WithTitle
{
    protected $startDate;
    protected $endDate;

    public function __construct($startDate, $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function view(): View
    {
        $paymentMethods = TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $this->startDate . ' 00:00:00', 
                $this->endDate . ' 23:59:59'
            ])
            ->where('status_transaksi', 'selesai')
            ->select(
                'metode_pembayaran',
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total_bayar) as total_revenue'),
                DB::raw('AVG(total_bayar) as avg_transaction_value')
            )
            ->groupBy('metode_pembayaran')
            ->orderBy('total_revenue', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'method' => ucfirst(str_replace('_', ' ', $payment->metode_pembayaran)),
                    'total_transactions' => $payment->total_transactions,
                    'total_revenue' => $payment->total_revenue,
                    'avg_transaction_value' => $payment->avg_transaction_value,
                    'percentage' => 0, // Will be calculated in view
                ];
            });

        // Calculate percentages
        $totalRevenue = $paymentMethods->sum('total_revenue');
        $paymentMethods = $paymentMethods->map(function ($payment) use ($totalRevenue) {
            $payment['percentage'] = $totalRevenue > 0 ? ($payment['total_revenue'] / $totalRevenue) * 100 : 0;
            return $payment;
        });

        return view('exports.laporan-payment-methods', [
            'paymentMethods' => $paymentMethods,
            'periode' => Carbon::parse($this->startDate)->format('d/m/Y') . ' - ' . Carbon::parse($this->endDate)->format('d/m/Y'),
        ]);
    }

    public function title(): string
    {
        return 'Metode Pembayaran';
    }

    protected function getHeaderColor(): string
    {
        return '6F42C1'; // Purple
    }
}
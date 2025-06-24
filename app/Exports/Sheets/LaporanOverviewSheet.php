<?php

namespace App\Exports\Sheets;

use App\Models\TtDataPenjualan;
use App\Models\User;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanOverviewSheet extends BaseSheet implements FromView, WithTitle
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
        // Get overall statistics
        $transactions = TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $this->startDate . ' 00:00:00', 
                $this->endDate . ' 23:59:59'
            ])
            ->where('status_transaksi', 'selesai')
            ->with(['detailPenjualan', 'kasir'])
            ->get();

        $statistics = [
            'periode' => Carbon::parse($this->startDate)->format('d/m/Y') . ' - ' . Carbon::parse($this->endDate)->format('d/m/Y'),
            'total_revenue' => $transactions->sum('total_bayar'),
            'total_transactions' => $transactions->count(),
            'total_items' => $transactions->sum(function ($transaction) {
                return $transaction->detailPenjualan->sum('jumlah_beli');
            }),
            'avg_transaction_value' => $transactions->count() > 0 ? $transactions->sum('total_bayar') / $transactions->count() : 0,
            'total_discount' => $transactions->sum('diskon_nominal'),
            'total_tax' => $transactions->sum('pajak_nominal'),
            'unique_customers' => $transactions->whereNotNull('pelanggan_id')->unique('pelanggan_id')->count(),
            'generated_at' => Carbon::now()->format('d/m/Y H:i:s'),
        ];

        // Get cashier performance dengan struktur yang benar
        $cashierPerformance = [];
        $cashierGroups = $transactions->groupBy('kasir_id');
        
        foreach ($cashierGroups as $kasirId => $group) {
            $kasir = $group->first()->kasir;
            $totalTransactions = $group->count();
            $totalRevenue = $group->sum('total_bayar');
            
            $cashierPerformance[] = (object) [
                'kasir' => (object) [
                    'name' => $kasir ? $kasir->name : 'Unknown'
                ],
                'total_transactions' => $totalTransactions,
                'total_revenue' => $totalRevenue,
                'avg_transaction_value' => $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0
            ];
        }

        // Sort by total revenue descending
        usort($cashierPerformance, function($a, $b) {
            return $b->total_revenue - $a->total_revenue;
        });

        // Get hourly sales pattern dengan struktur yang benar
        $hourlySales = [];
        $hourlyGroups = $transactions->groupBy(function ($transaction) {
            return Carbon::parse($transaction->tanggal_penjualan)->format('H');
        });

        foreach ($hourlyGroups as $hour => $group) {
            $totalTransactions = $group->count();
            $totalRevenue = $group->sum('total_bayar');
            
            $hourlySales[] = (object) [
                'hour' => (int) $hour,
                'total_transactions' => $totalTransactions,
                'total_revenue' => $totalRevenue
            ];
        }

        // Sort by hour
        usort($hourlySales, function($a, $b) {
            return $a->hour - $b->hour;
        });

        return view('exports.laporan-overview', [
            'statistics' => $statistics,
            'cashierPerformance' => $cashierPerformance,
            'hourlySales' => $hourlySales,
        ]);
    }

    public function title(): string
    {
        return 'Overview';
    }

    protected function getHeaderColor(): string
    {
        return '4472C4'; // Blue
    }
}
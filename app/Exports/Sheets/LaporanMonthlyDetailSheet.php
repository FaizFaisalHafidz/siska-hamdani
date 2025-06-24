<?php

namespace App\Exports\Sheets;

use App\Models\TtDataPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanMonthlyDetailSheet extends BaseSheet implements FromView, WithTitle
{
    protected $month;

    public function __construct($month)
    {
        $this->month = $month; // Format: Y-m-d (first day of month)
    }

    public function view(): View
    {
        $startOfMonth = Carbon::parse($this->month)->startOfMonth();
        $endOfMonth = Carbon::parse($this->month)->endOfMonth();

        $monthlyData = TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $startOfMonth->format('Y-m-d H:i:s'),
                $endOfMonth->format('Y-m-d H:i:s')
            ])
            ->where('status_transaksi', 'selesai')
            ->select(
                DB::raw('DATE(tanggal_penjualan) as date'),
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total_bayar) as total_revenue'),
                DB::raw('AVG(total_bayar) as avg_transaction_value')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('d/m/Y'),
                    'day_name' => Carbon::parse($item->date)->translatedFormat('l'),
                    'total_transactions' => $item->total_transactions,
                    'total_revenue' => $item->total_revenue,
                    'avg_transaction_value' => $item->avg_transaction_value,
                ];
            });

        return view('exports.laporan-monthly-detail', [
            'monthlyData' => $monthlyData,
            'month' => $startOfMonth->translatedFormat('F Y'),
        ]);
    }

    public function title(): string
    {
        return 'Detail ' . Carbon::parse($this->month)->translatedFormat('F Y');
    }

    protected function getHeaderColor(): string
    {
        return '6610F2'; // Indigo
    }
}
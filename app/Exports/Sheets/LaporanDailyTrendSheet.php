<?php

namespace App\Exports\Sheets;

use App\Models\TtDataPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanDailyTrendSheet extends BaseSheet implements FromView, WithTitle
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
        $dailyTrend = TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $this->startDate . ' 00:00:00', 
                $this->endDate . ' 23:59:59'
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
                    'date' => $item->date,
                    'date_formatted' => Carbon::parse($item->date)->format('d/m/Y'),
                    'day_name' => Carbon::parse($item->date)->translatedFormat('l'),
                    'total_transactions' => $item->total_transactions,
                    'total_revenue' => $item->total_revenue,
                    'avg_transaction_value' => $item->avg_transaction_value,
                ];
            });

        return view('exports.laporan-daily-trend', [
            'dailyTrend' => $dailyTrend,
            'periode' => Carbon::parse($this->startDate)->format('d/m/Y') . ' - ' . Carbon::parse($this->endDate)->format('d/m/Y'),
        ]);
    }

    public function title(): string
    {
        return 'Trend Harian';
    }

    protected function getHeaderColor(): string
    {
        return '28A745'; // Green
    }
}
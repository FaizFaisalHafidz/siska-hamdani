<?php

namespace App\Exports\Sheets;

use App\Models\TtDataPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanTopCustomersSheet extends BaseSheet implements FromView, WithTitle
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
        $topCustomers = TtDataPenjualan::with('pelanggan')
            ->whereBetween('tanggal_penjualan', [
                $this->startDate . ' 00:00:00', 
                $this->endDate . ' 23:59:59'
            ])
            ->where('status_transaksi', 'selesai')
            ->whereNotNull('pelanggan_id')
            ->select(
                'pelanggan_id',
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total_bayar) as total_spent'),
                DB::raw('AVG(total_bayar) as avg_transaction_value'),
                DB::raw('MAX(tanggal_penjualan) as last_transaction')
            )
            ->groupBy('pelanggan_id')
            ->orderBy('total_spent', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($customer) {
                return [
                    'kode' => $customer->pelanggan ? $customer->pelanggan->kode_pelanggan : 'N/A',
                    'nama' => $customer->pelanggan ? $customer->pelanggan->nama_pelanggan : 'Unknown',
                    'email' => $customer->pelanggan ? $customer->pelanggan->email : '',
                    'total_transactions' => $customer->total_transactions,
                    'total_spent' => $customer->total_spent,
                    'avg_transaction_value' => $customer->avg_transaction_value,
                    'last_transaction' => Carbon::parse($customer->last_transaction)->format('d/m/Y'),
                ];
            });

        return view('exports.laporan-top-customers', [
            'topCustomers' => $topCustomers,
            'periode' => Carbon::parse($this->startDate)->format('d/m/Y') . ' - ' . Carbon::parse($this->endDate)->format('d/m/Y'),
        ]);
    }

    public function title(): string
    {
        return 'Top Pelanggan';
    }

    protected function getHeaderColor(): string
    {
        return '17A2B8'; // Cyan
    }
}
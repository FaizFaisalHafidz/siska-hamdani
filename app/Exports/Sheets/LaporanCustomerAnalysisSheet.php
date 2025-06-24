<?php

namespace App\Exports\Sheets;

use App\Models\TtDataPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanCustomerAnalysisSheet extends BaseSheet implements FromView, WithTitle
{
    protected $startDate;
    protected $endDate;
    protected $additionalData;

    public function __construct($startDate, $endDate, $additionalData = [])
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->additionalData = $additionalData;
    }

    public function view(): View
    {
        $customerAnalysis = TtDataPenjualan::with('pelanggan')
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
                DB::raw('MIN(tanggal_penjualan) as first_transaction'),
                DB::raw('MAX(tanggal_penjualan) as last_transaction')
            )
            ->groupBy('pelanggan_id')
            ->orderBy('total_spent', 'desc')
            ->get()
            ->map(function ($customer) {
                $daysBetween = Carbon::parse($customer->first_transaction)->diffInDays(Carbon::parse($customer->last_transaction));
                
                return [
                    'kode' => $customer->pelanggan ? $customer->pelanggan->kode_pelanggan : 'N/A',
                    'nama' => $customer->pelanggan ? $customer->pelanggan->nama_pelanggan : 'Unknown',
                    'email' => $customer->pelanggan ? $customer->pelanggan->email : '',
                    'nomor_telepon' => $customer->pelanggan ? $customer->pelanggan->nomor_telepon : '',
                    'total_transactions' => $customer->total_transactions,
                    'total_spent' => $customer->total_spent,
                    'avg_transaction_value' => $customer->avg_transaction_value,
                    'first_transaction' => Carbon::parse($customer->first_transaction)->format('d/m/Y'),
                    'last_transaction' => Carbon::parse($customer->last_transaction)->format('d/m/Y'),
                    'customer_lifetime_days' => $daysBetween,
                    'frequency' => $daysBetween > 0 ? round($customer->total_transactions / ($daysBetween / 30), 2) : 0, // transactions per month
                ];
            });

        return view('exports.laporan-customer-analysis', [
            'customerAnalysis' => $customerAnalysis,
            'periode' => Carbon::parse($this->startDate)->format('d/m/Y') . ' - ' . Carbon::parse($this->endDate)->format('d/m/Y'),
        ]);
    }

    public function title(): string
    {
        return 'Analisis Pelanggan';
    }

    protected function getHeaderColor(): string
    {
        return 'DC3545'; // Red
    }
}
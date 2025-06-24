<?php
namespace App\Exports\Sheets;

use App\Models\TtDataPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;

class LaporanDailyDetailSheet extends BaseSheet implements FromView, WithTitle
{
    protected $date;

    public function __construct($date)
    {
        $this->date = $date;
    }

    public function view(): View
    {
        $transactions = TtDataPenjualan::with(['pelanggan', 'kasir', 'detailPenjualan.produk'])
            ->whereDate('tanggal_penjualan', $this->date)
            ->where('status_transaksi', 'selesai')
            ->orderBy('tanggal_penjualan', 'desc')
            ->get();

        return view('exports.laporan-daily-detail', [
            'transactions' => $transactions,
            'date' => Carbon::parse($this->date)->format('d/m/Y'),
        ]);
    }

    public function title(): string
    {
        return 'Detail Harian ' . Carbon::parse($this->date)->format('d-m-Y');
    }

    protected function getHeaderColor(): string
    {
        return '20C997'; // Teal
    }
}
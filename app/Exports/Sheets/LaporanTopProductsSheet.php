<?php

namespace App\Exports\Sheets;

use App\Models\TtDetailPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanTopProductsSheet extends BaseSheet implements FromView, WithTitle
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
        $topProducts = DB::table('tt_detail_penjualan')
            ->join('tt_data_penjualan', 'tt_detail_penjualan.penjualan_id', '=', 'tt_data_penjualan.id')
            ->join('tm_data_produk', 'tt_detail_penjualan.produk_id', '=', 'tm_data_produk.id')
            ->leftJoin('tm_data_kategori', 'tm_data_produk.kategori_id', '=', 'tm_data_kategori.id')
            ->whereBetween('tt_data_penjualan.tanggal_penjualan', [
                $this->startDate . ' 00:00:00', 
                $this->endDate . ' 23:59:59'
            ])
            ->where('tt_data_penjualan.status_transaksi', 'selesai')
            ->select(
                'tm_data_produk.kode_produk',
                'tm_data_produk.nama_produk',
                'tm_data_kategori.nama_kategori',
                DB::raw('SUM(tt_detail_penjualan.jumlah_beli) as total_sold'),
                DB::raw('SUM(tt_detail_penjualan.subtotal) as total_revenue'),
                DB::raw('COUNT(DISTINCT tt_data_penjualan.id) as total_transactions'),
                DB::raw('AVG(tt_detail_penjualan.jumlah_beli) as avg_qty_per_transaction')
            )
            ->groupBy(
                'tm_data_produk.id',
                'tm_data_produk.kode_produk',
                'tm_data_produk.nama_produk',
                'tm_data_kategori.nama_kategori'
            )
            ->orderBy('total_revenue', 'desc')
            ->limit(50)
            ->get();

        return view('exports.laporan-top-products', [
            'topProducts' => $topProducts,
            'periode' => Carbon::parse($this->startDate)->format('d/m/Y') . ' - ' . Carbon::parse($this->endDate)->format('d/m/Y'),
        ]);
    }

    public function title(): string
    {
        return 'Top Produk';
    }

    protected function getHeaderColor(): string
    {
        return 'FFC107'; // Yellow
    }
}
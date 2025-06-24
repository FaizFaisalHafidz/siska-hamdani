<?php

namespace App\Exports\Sheets;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanProductPerformanceSheet extends BaseSheet implements FromView, WithTitle
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
        $query = DB::table('tt_detail_penjualan')
            ->join('tt_data_penjualan', 'tt_detail_penjualan.penjualan_id', '=', 'tt_data_penjualan.id')
            ->join('tm_data_produk', 'tt_detail_penjualan.produk_id', '=', 'tm_data_produk.id')
            ->leftJoin('tm_data_kategori', 'tm_data_produk.kategori_id', '=', 'tm_data_kategori.id')
            ->whereBetween('tt_data_penjualan.tanggal_penjualan', [
                $this->startDate . ' 00:00:00', 
                $this->endDate . ' 23:59:59'
            ])
            ->where('tt_data_penjualan.status_transaksi', 'selesai');

        if (!empty($this->additionalData['category_id'])) {
            $query->where('tm_data_produk.kategori_id', $this->additionalData['category_id']);
        }

        $productPerformance = $query
            ->select(
                'tm_data_produk.kode_produk',
                'tm_data_produk.nama_produk',
                'tm_data_kategori.nama_kategori',
                'tm_data_produk.harga_jual',
                'tm_data_produk.stok_tersedia',
                DB::raw('COUNT(tt_detail_penjualan.id) as total_transaksi'),
                DB::raw('SUM(tt_detail_penjualan.jumlah_beli) as total_terjual'),
                DB::raw('SUM(tt_detail_penjualan.subtotal) as total_pendapatan'),
                DB::raw('AVG(tt_detail_penjualan.jumlah_beli) as rata_rata_qty'),
                DB::raw('MAX(tt_data_penjualan.tanggal_penjualan) as last_sold')
            )
            ->groupBy(
                'tm_data_produk.id', 
                'tm_data_produk.kode_produk', 
                'tm_data_produk.nama_produk', 
                'tm_data_kategori.nama_kategori',
                'tm_data_produk.harga_jual', 
                'tm_data_produk.stok_tersedia'
            )
            ->orderBy('total_pendapatan', 'desc')
            ->get();

        return view('exports.laporan-product-performance', [
            'productPerformance' => $productPerformance,
            'periode' => Carbon::parse($this->startDate)->format('d/m/Y') . ' - ' . Carbon::parse($this->endDate)->format('d/m/Y'),
        ]);
    }

    public function title(): string
    {
        return 'Performa Produk';
    }

    protected function getHeaderColor(): string
    {
        return 'FD7E14'; // Orange
    }
}
<?php

namespace App\Exports;

use App\Models\TtDataPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class DetailTransaksiExport implements FromView, WithStyles, WithTitle, ShouldAutoSize, WithColumnWidths
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function view(): View
    {
        $query = TtDataPenjualan::with(['pelanggan', 'kasir', 'detailPenjualan.produk']);

        // Apply same filters as main export
        if (!empty($this->filters['search'])) {
            $query->where('nomor_invoice', 'like', "%{$this->filters['search']}%")
                  ->orWhereHas('pelanggan', function ($q) {
                      $q->where('nama_pelanggan', 'like', "%{$this->filters['search']}%")
                        ->orWhere('kode_pelanggan', 'like', "%{$this->filters['search']}%");
                  });
        }

        if (!empty($this->filters['pelanggan_id'])) {
            $query->where('pelanggan_id', $this->filters['pelanggan_id']);
        }

        if (!empty($this->filters['kasir_id'])) {
            $query->where('kasir_id', $this->filters['kasir_id']);
        }

        if (!empty($this->filters['metode_pembayaran'])) {
            $query->where('metode_pembayaran', $this->filters['metode_pembayaran']);
        }

        if (!empty($this->filters['status_transaksi'])) {
            $query->where('status_transaksi', $this->filters['status_transaksi']);
        }

        if (!empty($this->filters['tanggal_mulai'])) {
            $query->whereDate('tanggal_penjualan', '>=', $this->filters['tanggal_mulai']);
        }

        if (!empty($this->filters['tanggal_akhir'])) {
            $query->whereDate('tanggal_penjualan', '<=', $this->filters['tanggal_akhir']);
        }

        $transactions = $query->latest('tanggal_penjualan')->get();

        // Flatten transaction details
        $details = collect();
        foreach ($transactions as $transaction) {
            foreach ($transaction->detailPenjualan as $detail) {
                $details->push([
                    'transaction' => $transaction,
                    'detail' => $detail,
                ]);
            }
        }

        $exportInfo = [
            'periode' => $this->getPeriodeText(),
            'generated_at' => Carbon::now()->format('d/m/Y H:i:s'),
            'generated_by' => auth()->user()->name ?? 'System',
        ];

        return view('exports.detail-transaksi', [
            'details' => $details,
            'exportInfo' => $exportInfo,
        ]);
    }

    public function styles(Worksheet $sheet)
    {
        // Header style
        $sheet->getStyle('A1:L1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '28A745'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);

        // Data rows style
        $highestRow = $sheet->getHighestRow();
        $sheet->getStyle("A2:L{$highestRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC'],
                ],
            ],
        ]);

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,  // No
            'B' => 20,  // Invoice
            'C' => 15,  // Tanggal
            'D' => 20,  // Pelanggan
            'E' => 15,  // Kasir
            'F' => 15,  // Kode Produk
            'G' => 30,  // Nama Produk
            'H' => 10,  // Qty
            'I' => 15,  // Harga Satuan
            'J' => 12,  // Diskon
            'K' => 15,  // Subtotal
            'L' => 25,  // Catatan
        ];
    }

    public function title(): string
    {
        return 'Detail Item Transaksi';
    }

    private function getPeriodeText()
    {
        if (!empty($this->filters['tanggal_mulai']) && !empty($this->filters['tanggal_akhir'])) {
            return Carbon::parse($this->filters['tanggal_mulai'])->format('d/m/Y') . ' s/d ' . 
                   Carbon::parse($this->filters['tanggal_akhir'])->format('d/m/Y');
        } elseif (!empty($this->filters['tanggal_mulai'])) {
            return 'Sejak ' . Carbon::parse($this->filters['tanggal_mulai'])->format('d/m/Y');
        } elseif (!empty($this->filters['tanggal_akhir'])) {
            return 'Sampai ' . Carbon::parse($this->filters['tanggal_akhir'])->format('d/m/Y');
        }
        return 'Semua Periode';
    }
}
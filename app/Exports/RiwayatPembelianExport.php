<?php

namespace App\Exports;

use App\Models\TtDataPenjualan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class RiwayatPembelianExport implements FromView, WithStyles, WithTitle, ShouldAutoSize, WithColumnWidths
{
    protected $filters;
    protected $exportType;

    public function __construct($filters = [], $exportType = 'summary')
    {
        $this->filters = $filters;
        $this->exportType = $exportType;
    }

    public function view(): View
    {
        $query = TtDataPenjualan::with(['pelanggan', 'kasir', 'detailPenjualan.produk']);

        // Apply filters
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

        // Calculate statistics
        $statistics = [
            'total_transaksi' => $transactions->count(),
            'total_pendapatan' => $transactions->where('status_transaksi', 'selesai')->sum('total_bayar'),
            'total_diskon' => $transactions->where('status_transaksi', 'selesai')->sum('diskon_nominal'),
            'total_pajak' => $transactions->where('status_transaksi', 'selesai')->sum('pajak_nominal'),
            'rata_rata_transaksi' => $transactions->where('status_transaksi', 'selesai')->count() > 0 
                ? $transactions->where('status_transaksi', 'selesai')->sum('total_bayar') / $transactions->where('status_transaksi', 'selesai')->count() 
                : 0,
        ];

        // Get summary data for different export types
        $summaryData = [];
        if ($this->exportType === 'detailed') {
            $summaryData = $this->getDetailedSummary($transactions);
        } elseif ($this->exportType === 'products') {
            $summaryData = $this->getProductSummary($transactions);
        }

        $exportInfo = [
            'periode' => $this->getPeriodeText(),
            'generated_at' => Carbon::now()->format('d/m/Y H:i:s'),
            'generated_by' => auth()->user()->name ?? 'System',
            'filters_applied' => $this->getFiltersText(),
        ];

        return view('exports.riwayat-pembelian', [
            'transactions' => $transactions,
            'statistics' => $statistics,
            'summaryData' => $summaryData,
            'exportInfo' => $exportInfo,
            'exportType' => $this->exportType,
        ]);
    }

    public function styles(Worksheet $sheet)
    {
        // Header style
        $sheet->getStyle('A1:K1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'],
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
        $sheet->getStyle("A2:K{$highestRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC'],
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Number format for currency columns
        $sheet->getStyle("F2:I{$highestRow}")->getNumberFormat()
              ->setFormatCode('#,##0');

        // Zebra striping
        for ($i = 2; $i <= $highestRow; $i += 2) {
            $sheet->getStyle("A{$i}:K{$i}")->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F8F9FA'],
                ],
            ]);
        }

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,  // No
            'B' => 20,  // Invoice
            'C' => 25,  // Pelanggan
            'D' => 20,  // Kasir
            'E' => 18,  // Tanggal
            'F' => 12,  // Total Item
            'G' => 18,  // Subtotal
            'H' => 15,  // Diskon
            'I' => 18,  // Total Bayar
            'J' => 15,  // Metode
            'K' => 12,  // Status
        ];
    }

    public function title(): string
    {
        return 'Riwayat Pembelian';
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

    private function getFiltersText()
    {
        $filters = [];
        
        if (!empty($this->filters['pelanggan_id'])) {
            $filters[] = 'Pelanggan: ' . $this->filters['pelanggan_id'];
        }
        
        if (!empty($this->filters['kasir_id'])) {
            $filters[] = 'Kasir: ' . $this->filters['kasir_id'];
        }
        
        if (!empty($this->filters['metode_pembayaran'])) {
            $filters[] = 'Metode: ' . ucfirst($this->filters['metode_pembayaran']);
        }
        
        if (!empty($this->filters['status_transaksi'])) {
            $filters[] = 'Status: ' . ucfirst($this->filters['status_transaksi']);
        }

        return !empty($filters) ? implode(', ', $filters) : 'Tidak ada filter';
    }

    private function getDetailedSummary($transactions)
    {
        return [
            'per_kasir' => $transactions->groupBy(function ($transaction) {
                return $transaction->kasir->name;
            })->map(function ($group, $kasir) {
                return [
                    'kasir' => $kasir,
                    'total_transaksi' => $group->count(),
                    'total_pendapatan' => $group->where('status_transaksi', 'selesai')->sum('total_bayar'),
                ];
            })->values(),
            
            'per_metode' => $transactions->where('status_transaksi', 'selesai')->groupBy('metode_pembayaran')->map(function ($group, $metode) {
                return [
                    'metode' => $metode,
                    'total_transaksi' => $group->count(),
                    'total_pendapatan' => $group->sum('total_bayar'),
                ];
            })->values(),
        ];
    }

    private function getProductSummary($transactions)
    {
        $products = collect();
        
        foreach ($transactions->where('status_transaksi', 'selesai') as $transaction) {
            foreach ($transaction->detailPenjualan as $detail) {
                if ($detail->produk) {
                    $key = $detail->produk->id;
                    if (!$products->has($key)) {
                        $products->put($key, [
                            'nama_produk' => $detail->produk->nama_produk,
                            'kode_produk' => $detail->produk->kode_produk,
                            'total_qty' => 0,
                            'total_pendapatan' => 0,
                        ]);
                    }
                    
                    $products[$key]['total_qty'] += $detail->jumlah_beli;
                    $products[$key]['total_pendapatan'] += $detail->subtotal;
                }
            }
        }

        return $products->sortByDesc('total_qty')->take(20)->values();
    }
}
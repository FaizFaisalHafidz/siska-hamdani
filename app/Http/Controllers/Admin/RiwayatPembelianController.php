<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TtDataPenjualan;
use App\Models\TmDataPelanggan;
use App\Models\TmDataProduk;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Exports\RiwayatPembelianExport;
use App\Exports\DetailTransaksiExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Response;

class RiwayatPembelianController extends Controller
{
    /**
     * Display a listing of purchase history
     */
    public function index(Request $request)
    {
        $query = TtDataPenjualan::with(['pelanggan', 'kasir', 'detailPenjualan.produk'])
            ->when($request->search, function ($query, $search) {
                return $query->where('nomor_invoice', 'like', "%{$search}%")
                           ->orWhereHas('pelanggan', function ($q) use ($search) {
                               $q->where('nama_pelanggan', 'like', "%{$search}%")
                                 ->orWhere('kode_pelanggan', 'like', "%{$search}%");
                           });
            })
            ->when($request->pelanggan_id, function ($query, $pelangganId) {
                return $query->where('pelanggan_id', $pelangganId);
            })
            ->when($request->kasir_id, function ($query, $kasirId) {
                return $query->where('kasir_id', $kasirId);
            })
            ->when($request->metode_pembayaran, function ($query, $metode) {
                return $query->where('metode_pembayaran', $metode);
            })
            ->when($request->status_transaksi, function ($query, $status) {
                return $query->where('status_transaksi', $status);
            })
            ->when($request->tanggal_mulai, function ($query, $tanggalMulai) {
                return $query->whereDate('tanggal_penjualan', '>=', $tanggalMulai);
            })
            ->when($request->tanggal_akhir, function ($query, $tanggalAkhir) {
                return $query->whereDate('tanggal_penjualan', '<=', $tanggalAkhir);
            })
            ->latest('tanggal_penjualan');

        $transactions = $query->paginate(20)->withQueryString();

        // Transform data
        $transactions->getCollection()->transform(function ($transaction) {
            return [
                'id' => $transaction->id,
                'nomor_invoice' => $transaction->nomor_invoice,
                'pelanggan' => $transaction->pelanggan ? [
                    'id' => $transaction->pelanggan->id,
                    'kode' => $transaction->pelanggan->kode_pelanggan,
                    'nama' => $transaction->pelanggan->nama_pelanggan,
                ] : null,
                'kasir' => [
                    'id' => $transaction->kasir->id,
                    'nama' => $transaction->kasir->name,
                ],
                'tanggal_penjualan' => $transaction->tanggal_penjualan->format('d/m/Y H:i'),
                'total_item' => $transaction->detailPenjualan->sum('jumlah_beli'),
                'total_belanja' => $transaction->total_belanja,
                'total_belanja_format' => 'Rp ' . number_format($transaction->total_belanja, 0, ',', '.'),
                'diskon_nominal' => $transaction->diskon_nominal,
                'diskon_format' => 'Rp ' . number_format($transaction->diskon_nominal, 0, ',', '.'),
                'total_bayar' => $transaction->total_bayar,
                'total_bayar_format' => 'Rp ' . number_format($transaction->total_bayar, 0, ',', '.'),
                'metode_pembayaran' => $transaction->metode_pembayaran,
                'status_transaksi' => $transaction->status_transaksi,
                'created_at' => $transaction->created_at->format('d/m/Y H:i'),
            ];
        });

        // Get filter options
        $pelanggans = TmDataPelanggan::aktif()
            ->select('id', 'kode_pelanggan', 'nama_pelanggan')
            ->orderBy('nama_pelanggan')
            ->get();

        $kasirs = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'kasir']);
            })
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get statistics
        $statistics = $this->getStatistics($request);

        return Inertia::render('Admin/RiwayatPembelian/Index', [
            'transactions' => $transactions,
            'pelanggans' => $pelanggans,
            'kasirs' => $kasirs,
            'filters' => $request->only([
                'search', 'pelanggan_id', 'kasir_id', 'metode_pembayaran', 
                'status_transaksi', 'tanggal_mulai', 'tanggal_akhir'
            ]),
            'statistics' => $statistics,
        ]);
    }

    /**
     * Display the specified transaction
     */
    public function show($id)
    {
        $transaction = TtDataPenjualan::with([
                'pelanggan', 
                'kasir', 
                'detailPenjualan.produk'
            ])
            ->findOrFail($id);

        $transactionData = [
            'id' => $transaction->id,
            'nomor_invoice' => $transaction->nomor_invoice,
            'pelanggan' => $transaction->pelanggan ? [
                'id' => $transaction->pelanggan->id,
                'kode' => $transaction->pelanggan->kode_pelanggan,
                'nama' => $transaction->pelanggan->nama_pelanggan,
                'nomor_telepon' => $transaction->pelanggan->nomor_telepon,
                'email' => $transaction->pelanggan->email_pelanggan,
            ] : null,
            'kasir' => [
                'id' => $transaction->kasir->id,
                'nama' => $transaction->kasir->name,
                'email' => $transaction->kasir->email,
            ],
            'tanggal_penjualan' => $transaction->tanggal_penjualan->format('d/m/Y H:i'),
            'total_belanja' => $transaction->total_belanja,
            'total_belanja_format' => 'Rp ' . number_format($transaction->total_belanja, 0, ',', '.'),
            'diskon_persen' => $transaction->diskon_persen,
            'diskon_nominal' => $transaction->diskon_nominal,
            'diskon_format' => 'Rp ' . number_format($transaction->diskon_nominal, 0, ',', '.'),
            'pajak_persen' => $transaction->pajak_persen,
            'pajak_nominal' => $transaction->pajak_nominal,
            'pajak_format' => 'Rp ' . number_format($transaction->pajak_nominal, 0, ',', '.'),
            'total_bayar' => $transaction->total_bayar,
            'total_bayar_format' => 'Rp ' . number_format($transaction->total_bayar, 0, ',', '.'),
            'jumlah_dibayar' => $transaction->jumlah_dibayar,
            'jumlah_dibayar_format' => 'Rp ' . number_format($transaction->jumlah_dibayar, 0, ',', '.'),
            'kembalian' => $transaction->kembalian,
            'kembalian_format' => 'Rp ' . number_format($transaction->kembalian, 0, ',', '.'),
            'metode_pembayaran' => $transaction->metode_pembayaran,
            'status_transaksi' => $transaction->status_transaksi,
            'catatan_penjualan' => $transaction->catatan_penjualan,
            'created_at' => $transaction->created_at->format('d/m/Y H:i'),
            'detail_items' => $transaction->detailPenjualan->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'produk' => $detail->produk ? [
                        'id' => $detail->produk->id,
                        'kode' => $detail->produk->kode_produk,
                        'nama' => $detail->produk->nama_produk,
                        'satuan' => $detail->produk->satuan,
                    ] : [
                        'id' => null,
                        'kode' => 'DELETED',
                        'nama' => 'Produk Tidak Ditemukan',
                        'satuan' => 'pcs',
                    ],
                    'jumlah_beli' => $detail->jumlah_beli,
                    'harga_satuan' => $detail->harga_satuan,
                    'harga_satuan_format' => 'Rp ' . number_format($detail->harga_satuan, 0, ',', '.'),
                    'diskon_item' => $detail->diskon_item,
                    'diskon_item_format' => 'Rp ' . number_format($detail->diskon_item, 0, ',', '.'),
                    'subtotal' => $detail->subtotal,
                    'subtotal_format' => 'Rp ' . number_format($detail->subtotal, 0, ',', '.'),
                    'catatan_item' => $detail->catatan_item,
                ];
            }),
        ];

        return Inertia::render('Admin/RiwayatPembelian/Show', [
            'transaction' => $transactionData,
        ]);
    }

    /**
     * Export transactions to Excel
     */
    public function export(Request $request)
    {
        $exportType = $request->export_type ?? 'summary';
        $filters = $request->only([
            'search', 'pelanggan_id', 'kasir_id', 'metode_pembayaran', 
            'status_transaksi', 'tanggal_mulai', 'tanggal_akhir'
        ]);

        $filename = $this->generateExportFilename($exportType, $filters);

        try {
            switch ($exportType) {
                case 'summary':
                    return Excel::download(new RiwayatPembelianExport($filters, 'summary'), $filename);
                    
                case 'detailed':
                    return Excel::download(new RiwayatPembelianExport($filters, 'detailed'), $filename);
                    
                case 'items':
                    return Excel::download(new DetailTransaksiExport($filters), $filename);
                    
                case 'products':
                    return Excel::download(new RiwayatPembelianExport($filters, 'products'), $filename);
                    
                default:
                    return back()->with('error', 'Tipe export tidak valid');
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal export data: ' . $e->getMessage());
        }
    }

    /**
     * Export transactions to CSV
     */
    public function exportCsv(Request $request)
    {
        $filters = $request->only([
            'search', 'pelanggan_id', 'kasir_id', 'metode_pembayaran', 
            'status_transaksi', 'tanggal_mulai', 'tanggal_akhir'
        ]);

        $query = TtDataPenjualan::with(['pelanggan', 'kasir', 'detailPenjualan.produk']);

        // Apply filters (same as index method)
        if (!empty($filters['search'])) {
            $query->where('nomor_invoice', 'like', "%{$filters['search']}%")
                  ->orWhereHas('pelanggan', function ($q) use ($filters) {
                      $q->where('nama_pelanggan', 'like', "%{$filters['search']}%")
                        ->orWhere('kode_pelanggan', 'like', "%{$filters['search']}%");
                  });
        }

        if (!empty($filters['pelanggan_id'])) {
            $query->where('pelanggan_id', $filters['pelanggan_id']);
        }

        if (!empty($filters['kasir_id'])) {
            $query->where('kasir_id', $filters['kasir_id']);
        }

        if (!empty($filters['metode_pembayaran'])) {
            $query->where('metode_pembayaran', $filters['metode_pembayaran']);
        }

        if (!empty($filters['status_transaksi'])) {
            $query->where('status_transaksi', $filters['status_transaksi']);
        }

        if (!empty($filters['tanggal_mulai'])) {
            $query->whereDate('tanggal_penjualan', '>=', $filters['tanggal_mulai']);
        }

        if (!empty($filters['tanggal_akhir'])) {
            $query->whereDate('tanggal_penjualan', '<=', $filters['tanggal_akhir']);
        }

        $transactions = $query->latest('tanggal_penjualan')->get();

        $filename = 'riwayat-pembelian-' . Carbon::now()->format('Y-m-d-H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function() use ($transactions) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Header
            fputcsv($file, [
                'No',
                'Invoice',
                'Pelanggan',
                'Kasir',
                'Tanggal',
                'Total Item',
                'Subtotal',
                'Diskon',
                'Total Bayar',
                'Metode Pembayaran',
                'Status'
            ]);

            // Data
            foreach ($transactions as $index => $transaction) {
                fputcsv($file, [
                    $index + 1,
                    $transaction->nomor_invoice,
                    $transaction->pelanggan ? $transaction->pelanggan->nama_pelanggan : 'Walk-in Customer',
                    $transaction->kasir->name,
                    $transaction->tanggal_penjualan->format('d/m/Y H:i'),
                    $transaction->detailPenjualan->sum('jumlah_beli'),
                    $transaction->total_belanja,
                    $transaction->diskon_nominal,
                    $transaction->total_bayar,
                    ucfirst(str_replace('_', ' ', $transaction->metode_pembayaran)),
                    ucfirst($transaction->status_transaksi),
                ]);
            }

            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }

    /**
     * Generate export filename based on filters
     */
    private function generateExportFilename($exportType, $filters)
    {
        $baseFilename = 'riwayat-pembelian';
        
        if ($exportType === 'items') {
            $baseFilename = 'detail-item-transaksi';
        } elseif ($exportType === 'products') {
            $baseFilename = 'ringkasan-produk';
        } elseif ($exportType === 'detailed') {
            $baseFilename = 'riwayat-pembelian-detail';
        }

        // Add date range to filename if available
        if (!empty($filters['tanggal_mulai']) && !empty($filters['tanggal_akhir'])) {
            $mulai = Carbon::parse($filters['tanggal_mulai'])->format('Y-m-d');
            $akhir = Carbon::parse($filters['tanggal_akhir'])->format('Y-m-d');
            $baseFilename .= "-{$mulai}-to-{$akhir}";
        } elseif (!empty($filters['tanggal_mulai'])) {
            $mulai = Carbon::parse($filters['tanggal_mulai'])->format('Y-m-d');
            $baseFilename .= "-from-{$mulai}";
        } elseif (!empty($filters['tanggal_akhir'])) {
            $akhir = Carbon::parse($filters['tanggal_akhir'])->format('Y-m-d');
            $baseFilename .= "-until-{$akhir}";
        } else {
            $baseFilename .= '-' . Carbon::now()->format('Y-m-d');
        }

        return $baseFilename . '.xlsx';
    }

    /**
     * Get daily sales report
     */
    public function dailyReport(Request $request)
    {
        $tanggal = $request->tanggal ?? Carbon::today()->format('Y-m-d');
        
        $transactions = TtDataPenjualan::with(['pelanggan', 'kasir', 'detailPenjualan.produk'])
            ->whereDate('tanggal_penjualan', $tanggal)
            ->where('status_transaksi', 'selesai')
            ->get();

        $report = [
            'tanggal' => Carbon::parse($tanggal)->format('d/m/Y'),
            'total_transaksi' => $transactions->count(),
            'total_pendapatan' => $transactions->sum('total_bayar'),
            'total_pendapatan_format' => 'Rp ' . number_format($transactions->sum('total_bayar'), 0, ',', '.'),
            'total_item_terjual' => $transactions->sum(function ($transaction) {
                return $transaction->detailPenjualan->sum('jumlah_beli');
            }),
            'rata_rata_transaksi' => $transactions->count() > 0 ? 
                $transactions->sum('total_bayar') / $transactions->count() : 0,
            'rata_rata_transaksi_format' => $transactions->count() > 0 ? 
                'Rp ' . number_format($transactions->sum('total_bayar') / $transactions->count(), 0, ',', '.') : 'Rp 0',
            'transaksi_per_jam' => $transactions->groupBy(function ($transaction) {
                return $transaction->tanggal_penjualan->format('H');
            })->map(function ($group, $hour) {
                return [
                    'jam' => $hour . ':00',
                    'jumlah' => $group->count(),
                    'total' => $group->sum('total_bayar'),
                    'total_format' => 'Rp ' . number_format($group->sum('total_bayar'), 0, ',', '.'),
                ];
            })->values(),
            'top_products' => $this->getTopProducts($tanggal),
            'metode_pembayaran' => $transactions->groupBy('metode_pembayaran')->map(function ($group, $metode) {
                return [
                    'metode' => $metode,
                    'jumlah' => $group->count(),
                    'total' => $group->sum('total_bayar'),
                    'total_format' => 'Rp ' . number_format($group->sum('total_bayar'), 0, ',', '.'),
                ];
            })->values(),
        ];

        return Inertia::render('Admin/RiwayatPembelian/DailyReport', [
            'report' => $report,
            'tanggal' => $tanggal,
        ]);
    }

    /**
     * Get monthly sales report
     */
    public function monthlyReport(Request $request)
    {
        $bulan = $request->bulan ?? Carbon::now()->format('Y-m');
        $startDate = Carbon::parse($bulan . '-01')->startOfMonth();
        $endDate = Carbon::parse($bulan . '-01')->endOfMonth();
        
        $transactions = TtDataPenjualan::with(['detailPenjualan.produk'])
            ->whereBetween('tanggal_penjualan', [$startDate, $endDate])
            ->where('status_transaksi', 'selesai')
            ->get();

        $report = [
            'periode' => $startDate->format('F Y'),
            'total_transaksi' => $transactions->count(),
            'total_pendapatan' => $transactions->sum('total_bayar'),
            'total_pendapatan_format' => 'Rp ' . number_format($transactions->sum('total_bayar'), 0, ',', '.'),
            'total_item_terjual' => $transactions->sum(function ($transaction) {
                return $transaction->detailPenjualan->sum('jumlah_beli');
            }),
            'rata_rata_harian' => $transactions->sum('total_bayar') / $startDate->daysInMonth,
            'rata_rata_harian_format' => 'Rp ' . number_format($transactions->sum('total_bayar') / $startDate->daysInMonth, 0, ',', '.'),
            'penjualan_harian' => $transactions->groupBy(function ($transaction) {
                return $transaction->tanggal_penjualan->format('Y-m-d');
            })->map(function ($group, $date) {
                return [
                    'tanggal' => Carbon::parse($date)->format('d/m/Y'),
                    'jumlah' => $group->count(),
                    'total' => $group->sum('total_bayar'),
                    'total_format' => 'Rp ' . number_format($group->sum('total_bayar'), 0, ',', '.'),
                ];
            })->values(),
            'top_products_monthly' => $this->getTopProducts($startDate->format('Y-m-d'), $endDate->format('Y-m-d')),
        ];

        return Inertia::render('Admin/RiwayatPembelian/MonthlyReport', [
            'report' => $report,
            'bulan' => $bulan,
        ]);
    }

    /**
     * Get statistics for the index page
     */
    private function getStatistics($request)
    {
        $query = TtDataPenjualan::where('status_transaksi', 'selesai');

        // Apply same filters as index
        if ($request->tanggal_mulai) {
            $query->whereDate('tanggal_penjualan', '>=', $request->tanggal_mulai);
        }
        if ($request->tanggal_akhir) {
            $query->whereDate('tanggal_penjualan', '<=', $request->tanggal_akhir);
        }

        $transactions = $query->get();
        $today = Carbon::today();

        return [
            'total_transaksi' => $transactions->count(),
            'total_pendapatan' => $transactions->sum('total_bayar'),
            'total_pendapatan_format' => 'Rp ' . number_format($transactions->sum('total_bayar'), 0, ',', '.'),
            'transaksi_hari_ini' => TtDataPenjualan::whereDate('tanggal_penjualan', $today)
                ->where('status_transaksi', 'selesai')->count(),
            'pendapatan_hari_ini' => TtDataPenjualan::whereDate('tanggal_penjualan', $today)
                ->where('status_transaksi', 'selesai')->sum('total_bayar'),
            'pendapatan_hari_ini_format' => 'Rp ' . number_format(
                TtDataPenjualan::whereDate('tanggal_penjualan', $today)
                    ->where('status_transaksi', 'selesai')->sum('total_bayar'), 
                0, ',', '.'
            ),
            'rata_rata_transaksi' => $transactions->count() > 0 ? 
                $transactions->sum('total_bayar') / $transactions->count() : 0,
            'rata_rata_transaksi_format' => $transactions->count() > 0 ? 
                'Rp ' . number_format($transactions->sum('total_bayar') / $transactions->count(), 0, ',', '.') : 'Rp 0',
        ];
    }

    /**
     * Get top selling products
     */
    private function getTopProducts($startDate, $endDate = null)
    {
        $endDate = $endDate ?? $startDate;
        
        return DB::table('tt_detail_penjualan')
            ->join('tt_data_penjualan', 'tt_detail_penjualan.penjualan_id', '=', 'tt_data_penjualan.id')
            ->join('tm_data_produk', 'tt_detail_penjualan.produk_id', '=', 'tm_data_produk.id')
            ->whereBetween('tt_data_penjualan.tanggal_penjualan', [$startDate, $endDate . ' 23:59:59'])
            ->where('tt_data_penjualan.status_transaksi', 'selesai')
            ->select(
                'tm_data_produk.kode_produk',
                'tm_data_produk.nama_produk',
                DB::raw('SUM(tt_detail_penjualan.jumlah_beli) as total_terjual'),
                DB::raw('SUM(tt_detail_penjualan.subtotal) as total_pendapatan')
            )
            ->groupBy('tm_data_produk.id', 'tm_data_produk.kode_produk', 'tm_data_produk.nama_produk')
            ->orderBy('total_terjual', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($product) {
                return [
                    'kode' => $product->kode_produk,
                    'nama' => $product->nama_produk,
                    'total_terjual' => $product->total_terjual,
                    'total_pendapatan' => $product->total_pendapatan,
                    'total_pendapatan_format' => 'Rp ' . number_format($product->total_pendapatan, 0, ',', '.'),
                ];
            });
    }
}
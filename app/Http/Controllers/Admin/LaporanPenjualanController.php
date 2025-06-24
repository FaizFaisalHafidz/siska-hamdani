<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TtDataPenjualan;
use App\Models\TtDetailPenjualan;
use App\Models\TmDataProduk;
use App\Models\TmDataKategori;
use App\Models\TmDataPelanggan;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Exports\LaporanPenjualanExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Response;

class LaporanPenjualanController extends Controller
{
    /**
     * Display sales report dashboard
     */
    public function index(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? Carbon::now()->format('Y-m-d');
        
        // Get overall statistics
        $statistics = $this->getOverallStatistics($startDate, $endDate);
        
        // Get daily sales trend
        $dailyTrend = $this->getDailySalesTrend($startDate, $endDate);
        
        // Get top products
        $topProducts = $this->getTopProducts($startDate, $endDate, 10);
        
        // Get top customers
        $topCustomers = $this->getTopCustomers($startDate, $endDate, 10);
        
        // Get payment method breakdown
        $paymentBreakdown = $this->getPaymentMethodBreakdown($startDate, $endDate);
        
        // Get hourly sales pattern
        $hourlySales = $this->getHourlySalesPattern($startDate, $endDate);
        
        // Get cashier performance
        $cashierPerformance = $this->getCashierPerformance($startDate, $endDate);

        return Inertia::render('Admin/LaporanPenjualan/Index', [
            'statistics' => $statistics,
            'dailyTrend' => $dailyTrend,
            'topProducts' => $topProducts,
            'topCustomers' => $topCustomers,
            'paymentBreakdown' => $paymentBreakdown,
            'hourlySales' => $hourlySales,
            'cashierPerformance' => $cashierPerformance,
            'dateRange' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Daily sales report
     */
    public function dailyReport(Request $request)
    {
        $date = $request->date ?? Carbon::today()->format('Y-m-d');
        $carbonDate = Carbon::parse($date);
        
        // Get daily statistics
        $statistics = $this->getDailyStatistics($date);
        
        // Get hourly breakdown
        $hourlyBreakdown = $this->getHourlyBreakdown($date);
        
        // Get transactions list
        $transactions = TtDataPenjualan::with(['pelanggan', 'kasir', 'detailPenjualan'])
            ->whereDate('tanggal_penjualan', $date)
            ->where('status_transaksi', 'selesai')
            ->orderBy('tanggal_penjualan', 'desc')
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'nomor_invoice' => $transaction->nomor_invoice,
                    'pelanggan' => $transaction->pelanggan ? [
                        'nama' => $transaction->pelanggan->nama_pelanggan,
                        'kode' => $transaction->pelanggan->kode_pelanggan,
                    ] : null,
                    'kasir' => $transaction->kasir->name,
                    'waktu' => $transaction->tanggal_penjualan->format('H:i'),
                    'total_item' => $transaction->detailPenjualan->sum('jumlah_beli'),
                    'total_bayar' => $transaction->total_bayar,
                    'total_bayar_format' => 'Rp ' . number_format($transaction->total_bayar, 0, ',', '.'),
                    'metode_pembayaran' => $transaction->metode_pembayaran,
                ];
            });

        // Get top products for the day
        $topProductsDaily = $this->getTopProducts($date, $date, 10);
        
        // Get payment methods for the day
        $paymentMethodsDaily = $this->getPaymentMethodBreakdown($date, $date);

        return Inertia::render('Admin/LaporanPenjualan/DailyReport', [
            'date' => $date,
            'dateFormatted' => $carbonDate->translatedFormat('l, d F Y'),
            'statistics' => $statistics,
            'hourlyBreakdown' => $hourlyBreakdown,
            'transactions' => $transactions,
            'topProducts' => $topProductsDaily,
            'paymentMethods' => $paymentMethodsDaily,
        ]);
    }

    /**
     * Monthly sales report
     */
    public function monthlyReport(Request $request)
    {
        $month = $request->month ?? Carbon::now()->format('Y-m');
        $carbonMonth = Carbon::parse($month . '-01');
        $startDate = $carbonMonth->startOfMonth()->format('Y-m-d');
        $endDate = $carbonMonth->endOfMonth()->format('Y-m-d');
        
        // Get monthly statistics
        $statistics = $this->getMonthlyStatistics($month);
        
        // Get daily breakdown for the month
        $dailyBreakdown = $this->getDailySalesTrend($startDate, $endDate);
        
        // Get weekly summary
        $weeklyBreakdown = $this->getWeeklyBreakdown($month);
        
        // Get top products for the month
        $topProductsMonthly = $this->getTopProducts($startDate, $endDate, 15);
        
        // Get top customers for the month
        $topCustomersMonthly = $this->getTopCustomers($startDate, $endDate, 15);
        
        // Get comparison with previous month
        $previousMonth = $carbonMonth->copy()->subMonth();
        $previousMonthStats = $this->getMonthlyStatistics($previousMonth->format('Y-m'));
        $comparison = $this->calculateComparison($statistics, $previousMonthStats);

        return Inertia::render('Admin/LaporanPenjualan/MonthlyReport', [
            'month' => $month,
            'monthFormatted' => $carbonMonth->translatedFormat('F Y'),
            'statistics' => $statistics,
            'dailyBreakdown' => $dailyBreakdown,
            'weeklyBreakdown' => $weeklyBreakdown,
            'topProducts' => $topProductsMonthly,
            'topCustomers' => $topCustomersMonthly,
            'comparison' => $comparison,
            'previousMonth' => $previousMonth->translatedFormat('F Y'),
        ]);
    }

    /**
     * Product performance report
     */
    public function productReport(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? Carbon::now()->format('Y-m-d');
        $categoryId = $request->category_id;
        
        // Get product performance data
        $query = DB::table('tt_detail_penjualan')
            ->join('tt_data_penjualan', 'tt_detail_penjualan.penjualan_id', '=', 'tt_data_penjualan.id')
            ->join('tm_data_produk', 'tt_detail_penjualan.produk_id', '=', 'tm_data_produk.id')
            ->leftJoin('tm_data_kategori', 'tm_data_produk.kategori_id', '=', 'tm_data_kategori.id')
            ->whereBetween('tt_data_penjualan.tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('tt_data_penjualan.status_transaksi', 'selesai');

        if ($categoryId) {
            $query->where('tm_data_produk.kategori_id', $categoryId);
        }

        $productPerformance = $query
            ->select(
                'tm_data_produk.id',
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
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'kode' => $product->kode_produk,
                    'nama' => $product->nama_produk,
                    'kategori' => $product->nama_kategori ?? 'Tanpa Kategori',
                    'harga_jual' => $product->harga_jual,
                    'harga_jual_format' => 'Rp ' . number_format($product->harga_jual, 0, ',', '.'),
                    'stok_tersedia' => $product->stok_tersedia,
                    'total_transaksi' => $product->total_transaksi,
                    'total_terjual' => $product->total_terjual,
                    'total_pendapatan' => $product->total_pendapatan,
                    'total_pendapatan_format' => 'Rp ' . number_format($product->total_pendapatan, 0, ',', '.'),
                    'rata_rata_qty' => round($product->rata_rata_qty, 2),
                    'last_sold' => $product->last_sold ? Carbon::parse($product->last_sold)->format('d/m/Y') : '-',
                    'performance_score' => $this->calculateProductPerformanceScore($product),
                ];
            });

        // Get categories for filter
        $categories = TmDataKategori::aktif()
            ->select('id', 'nama_kategori')
            ->orderBy('nama_kategori')
            ->get();

        // Get summary statistics
        $summary = [
            'total_products_sold' => $productPerformance->count(),
            'total_quantity_sold' => $productPerformance->sum('total_terjual'),
            'total_revenue' => $productPerformance->sum('total_pendapatan'),
            'total_revenue_format' => 'Rp ' . number_format($productPerformance->sum('total_pendapatan'), 0, ',', '.'),
            'avg_product_revenue' => $productPerformance->avg('total_pendapatan'),
            'avg_product_revenue_format' => 'Rp ' . number_format($productPerformance->avg('total_pendapatan'), 0, ',', '.'),
        ];

        return Inertia::render('Admin/LaporanPenjualan/ProductReport', [
            'productPerformance' => $productPerformance,
            'categories' => $categories,
            'summary' => $summary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'category_id' => $categoryId,
            ],
        ]);
    }

    /**
     * Customer analysis report
     */
    public function customerReport(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? Carbon::now()->format('Y-m-d');
        $jenisPelanggan = $request->jenis_pelanggan;
        
        // Get customer analysis data
        $query = TmDataPelanggan::with(['penjualan' => function ($q) use ($startDate, $endDate) {
            $q->whereBetween('tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
              ->where('status_transaksi', 'selesai');
        }]);

        if ($jenisPelanggan) {
            $query->where('jenis_pelanggan', $jenisPelanggan);
        }

        $customerAnalysis = $query->get()
            ->filter(function ($customer) {
                return $customer->penjualan->count() > 0;
            })
            ->map(function ($customer) {
                $totalPembelian = $customer->penjualan->sum('total_bayar');
                $jumlahTransaksi = $customer->penjualan->count();
                $rataRataTransaksi = $jumlahTransaksi > 0 ? $totalPembelian / $jumlahTransaksi : 0;
                $lastTransaction = $customer->penjualan->max('tanggal_penjualan');

                return [
                    'id' => $customer->id,
                    'kode' => $customer->kode_pelanggan,
                    'nama' => $customer->nama_pelanggan,
                    'jenis_pelanggan' => $customer->jenis_pelanggan,
                    'tanggal_bergabung' => $customer->tanggal_bergabung ? 
                        $customer->tanggal_bergabung->format('d/m/Y') : '-',
                    'total_pembelian' => $totalPembelian,
                    'total_pembelian_format' => 'Rp ' . number_format($totalPembelian, 0, ',', '.'),
                    'jumlah_transaksi' => $jumlahTransaksi,
                    'rata_rata_transaksi' => $rataRataTransaksi,
                    'rata_rata_transaksi_format' => 'Rp ' . number_format($rataRataTransaksi, 0, ',', '.'),
                    'last_transaction' => $lastTransaction ? Carbon::parse($lastTransaction)->format('d/m/Y') : '-',
                    'customer_value_score' => $this->calculateCustomerValueScore($totalPembelian, $jumlahTransaksi),
                ];
            })
            ->sortByDesc('total_pembelian')
            ->values();

        // Get customer segments
        $segments = [
            'vip' => $customerAnalysis->where('jenis_pelanggan', 'vip')->count(),
            'member' => $customerAnalysis->where('jenis_pelanggan', 'member')->count(),
            'reguler' => $customerAnalysis->where('jenis_pelanggan', 'reguler')->count(),
        ];

        // Get customer value segments
        $valueSegments = $this->getCustomerValueSegments($customerAnalysis);

        // Get summary
        $summary = [
            'total_customers' => $customerAnalysis->count(),
            'total_revenue' => $customerAnalysis->sum('total_pembelian'),
            'total_revenue_format' => 'Rp ' . number_format($customerAnalysis->sum('total_pembelian'), 0, ',', '.'),
            'avg_customer_value' => $customerAnalysis->avg('total_pembelian'),
            'avg_customer_value_format' => 'Rp ' . number_format($customerAnalysis->avg('total_pembelian'), 0, ',', '.'),
            'avg_transactions_per_customer' => $customerAnalysis->avg('jumlah_transaksi'),
        ];

        return Inertia::render('Admin/LaporanPenjualan/CustomerReport', [
            'customerAnalysis' => $customerAnalysis,
            'segments' => $segments,
            'valueSegments' => $valueSegments,
            'summary' => $summary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'jenis_pelanggan' => $jenisPelanggan,
            ],
        ]);
    }

    /**
     * Export sales report
     */
    public function export(Request $request)
    {
        $type = $request->type ?? 'overview';
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? Carbon::now()->format('Y-m-d');
        $format = $request->format ?? 'excel';
        
        // Additional data for specific reports
        $additionalData = [];
        if ($type === 'product') {
            $additionalData['category_id'] = $request->category_id;
        } elseif ($type === 'customer') {
            $additionalData['jenis_pelanggan'] = $request->jenis_pelanggan;
        }

        $filename = $this->generateExportFilename($type, $startDate, $endDate, $format);

        try {
            if ($format === 'excel') {
                return Excel::download(
                    new LaporanPenjualanExport($type, $startDate, $endDate, $additionalData), 
                    $filename,
                    \Maatwebsite\Excel\Excel::XLSX,
                    [
                        'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                        'Cache-Control' => 'max-age=0',
                        'Cache-Control' => 'max-age=1',
                        'Expires' => 'Mon, 26 Jul 1997 05:00:00 GMT',
                        'Last-Modified' => gmdate('D, d M Y H:i:s') . ' GMT',
                        'Cache-Control' => 'cache, must-revalidate',
                        'Pragma' => 'public',
                    ]
                );
            } elseif ($format === 'csv') {
                return $this->exportCsv($type, $startDate, $endDate, $additionalData);
            } else {
                return response()->json(['error' => 'Format export tidak valid'], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Export error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal export data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export specific report types to CSV
     */
    public function exportCsv($type, $startDate, $endDate, $additionalData = [])
    {
        $filename = $this->generateExportFilename($type, $startDate, $endDate, 'csv');
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'max-age=0',
            'Cache-Control' => 'max-age=1',
            'Expires' => 'Mon, 26 Jul 1997 05:00:00 GMT',
            'Last-Modified' => gmdate('D, d M Y H:i:s') . ' GMT',
            'Cache-Control' => 'cache, must-revalidate',
            'Pragma' => 'public',
        ];

        $callback = function() use ($type, $startDate, $endDate, $additionalData) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            switch ($type) {
                case 'overview':
                    $this->exportOverviewCsv($file, $startDate, $endDate);
                    break;
                case 'daily':
                    $this->exportDailyCsv($file, $startDate, $endDate);
                    break;
                case 'product':
                    $this->exportProductCsv($file, $startDate, $endDate, $additionalData);
                    break;
                case 'customer':
                    $this->exportCustomerCsv($file, $startDate, $endDate, $additionalData);
                    break;
                default:
                    $this->exportOverviewCsv($file, $startDate, $endDate);
            }

            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }

    /**
     * Export daily report to Excel
     */
    public function exportDaily(Request $request)
    {
        $date = $request->date ?? Carbon::today()->format('Y-m-d');
        $format = $request->format ?? 'excel';
        
        $filename = 'laporan-harian-' . $date . '.' . ($format === 'excel' ? 'xlsx' : 'csv');

        try {
            if ($format === 'excel') {
                return Excel::download(
                    new LaporanPenjualanExport('daily', $date, $date), 
                    $filename
                );
            } else {
                return $this->exportCsv('daily', $date, $date);
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal export data: ' . $e->getMessage());
        }
    }

    /**
     * Export monthly report to Excel
     */
    public function exportMonthly(Request $request)
    {
        $month = $request->month ?? Carbon::now()->format('Y-m');
        $carbonMonth = Carbon::parse($month . '-01');
        $startDate = $carbonMonth->startOfMonth()->format('Y-m-d');
        $endDate = $carbonMonth->endOfMonth()->format('Y-m-d');
        $format = $request->format ?? 'excel';
        
        $filename = 'laporan-bulanan-' . $month . '.' . ($format === 'excel' ? 'xlsx' : 'csv');

        try {
            if ($format === 'excel') {
                return Excel::download(
                    new LaporanPenjualanExport('monthly', $startDate, $endDate), 
                    $filename
                );
            } else {
                return $this->exportCsv('monthly', $startDate, $endDate);
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal export data: ' . $e->getMessage());
        }
    }

    /**
     * Export product performance report
     */
    public function exportProduct(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? Carbon::now()->format('Y-m-d');
        $categoryId = $request->category_id;
        $format = $request->format ?? 'excel';
        
        $additionalData = ['category_id' => $categoryId];
        $filename = 'laporan-produk-' . $startDate . '-to-' . $endDate . '.' . ($format === 'excel' ? 'xlsx' : 'csv');

        try {
            if ($format === 'excel') {
                return Excel::download(
                    new LaporanPenjualanExport('product', $startDate, $endDate, $additionalData), 
                    $filename
                );
            } else {
                return $this->exportCsv('product', $startDate, $endDate, $additionalData);
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal export data: ' . $e->getMessage());
        }
    }

    /**
     * Export customer analysis report
     */
    public function exportCustomer(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? Carbon::now()->format('Y-m-d');
        $jenisPelanggan = $request->jenis_pelanggan;
        $format = $request->format ?? 'excel';
        
        $additionalData = ['jenis_pelanggan' => $jenisPelanggan];
        $filename = 'laporan-pelanggan-' . $startDate . '-to-' . $endDate . '.' . ($format === 'excel' ? 'xlsx' : 'csv');

        try {
            if ($format === 'excel') {
                return Excel::download(
                    new LaporanPenjualanExport('customer', $startDate, $endDate, $additionalData), 
                    $filename
                );
            } else {
                return $this->exportCsv('customer', $startDate, $endDate, $additionalData);
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal export data: ' . $e->getMessage());
        }
    }

    /**
     * Export complete report (all sheets)
     */
    public function exportComplete(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? Carbon::now()->format('Y-m-d');
        
        $filename = 'laporan-lengkap-' . $startDate . '-to-' . $endDate . '.xlsx';

        try {
            return Excel::download(
                new LaporanPenjualanExport('complete', $startDate, $endDate), 
                $filename
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal export data: ' . $e->getMessage());
        }
    }

    /**
     * Generate export filename
     */
    private function generateExportFilename($type, $startDate, $endDate, $format)
    {
        $typeNames = [
            'overview' => 'ringkasan',
            'daily' => 'harian',
            'monthly' => 'bulanan',
            'product' => 'produk',
            'customer' => 'pelanggan',
            'complete' => 'lengkap',
        ];

        $typeName = $typeNames[$type] ?? 'laporan';
        $extension = $format === 'excel' ? 'xlsx' : 'csv';
        
        if ($startDate === $endDate) {
            return "laporan-{$typeName}-{$startDate}.{$extension}";
        } else {
            return "laporan-{$typeName}-{$startDate}-to-{$endDate}.{$extension}";
        }
    }

    /**
     * CSV Export Helper Methods
     */
    private function exportOverviewCsv($file, $startDate, $endDate)
    {
        // Header
        fputcsv($file, ['LAPORAN PENJUALAN OVERVIEW']);
        fputcsv($file, ['Periode: ' . Carbon::parse($startDate)->format('d/m/Y') . ' - ' . Carbon::parse($endDate)->format('d/m/Y')]);
        fputcsv($file, []); // Empty row
        
        // Statistics
        $statistics = $this->getOverallStatistics($startDate, $endDate);
        fputcsv($file, ['RINGKASAN STATISTIK']);
        fputcsv($file, ['Total Pendapatan', $statistics['total_revenue_format']]);
        fputcsv($file, ['Total Transaksi', $statistics['total_transactions']]);
        fputcsv($file, ['Total Item', $statistics['total_items']]);
        fputcsv($file, ['Rata-rata per Transaksi', $statistics['avg_transaction_value_format']]);
        
        fputcsv($file, []); // Empty row
        
        // Cashier Performance
        fputcsv($file, ['PERFORMA KASIR']);
        fputcsv($file, ['Kasir', 'Total Transaksi', 'Total Pendapatan', 'Rata-rata per Transaksi']);
        
        $cashierPerformance = $this->getCashierPerformance($startDate, $endDate);
        foreach ($cashierPerformance as $cashier) {
            fputcsv($file, [
                $cashier['name'],
                $cashier['total_transactions'],
                $cashier['total_revenue_format'],
                $cashier['avg_transaction_value_format'],
            ]);
        }
    }

    private function exportProductCsv($file, $startDate, $endDate, $additionalData)
    {
        // Header
        fputcsv($file, ['LAPORAN PERFORMA PRODUK']);
        fputcsv($file, ['Periode: ' . Carbon::parse($startDate)->format('d/m/Y') . ' - ' . Carbon::parse($endDate)->format('d/m/Y')]);
        fputcsv($file, []); // Empty row
    
        fputcsv($file, [
            'Kode Produk',
            'Nama Produk', 
            'Kategori',
            'Harga Jual',
            'Stok Tersedia',
            'Total Transaksi',
            'Total Terjual',
            'Total Pendapatan',
            'Rata-rata Qty',
            'Terakhir Terjual'
        ]);

        // Get product performance data (reuse existing method logic)
        $query = DB::table('tt_detail_penjualan')
            ->join('tt_data_penjualan', 'tt_detail_penjualan.penjualan_id', '=', 'tt_data_penjualan.id')
            ->join('tm_data_produk', 'tt_detail_penjualan.produk_id', '=', 'tm_data_produk.id')
            ->leftJoin('tm_data_kategori', 'tm_data_produk.kategori_id', '=', 'tm_data_kategori.id')
            ->whereBetween('tt_data_penjualan.tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('tt_data_penjualan.status_transaksi', 'selesai');

        if (!empty($additionalData['category_id'])) {
            $query->where('tm_data_produk.kategori_id', $additionalData['category_id']);
        }

        $products = $query
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

        foreach ($products as $product) {
            fputcsv($file, [
                $product->kode_produk,
                $product->nama_produk,
                $product->nama_kategori ?? 'Tanpa Kategori',
                $product->harga_jual,
                $product->stok_tersedia,
                $product->total_transaksi,
                $product->total_terjual,
                $product->total_pendapatan,
                round($product->rata_rata_qty, 2),
                $product->last_sold ? Carbon::parse($product->last_sold)->format('d/m/Y') : '-',
            ]);
        }
    }

    private function exportDailyCsv($file, $startDate, $endDate)
    {
        // Header
        fputcsv($file, ['TREND PENJUALAN HARIAN']);
        fputcsv($file, ['Periode: ' . Carbon::parse($startDate)->format('d/m/Y') . ' - ' . Carbon::parse($endDate)->format('d/m/Y')]);
        fputcsv($file, []); // Empty row
        
        fputcsv($file, ['Tanggal', 'Hari', 'Total Transaksi', 'Total Pendapatan', 'Rata-rata per Transaksi']);

        $dailyTrend = $this->getDailySalesTrend($startDate, $endDate);
        foreach ($dailyTrend as $day) {
            fputcsv($file, [
                $day['date_formatted'],
                $day['day_name'],
                $day['total_transactions'],
                $day['total_revenue_format'],
                $day['avg_transaction_value_format'],
            ]);
        }
    }

    private function exportCustomerCsv($file, $startDate, $endDate, $additionalData)
    {
        // Implementation for customer CSV export
        fputcsv($file, ['LAPORAN ANALISIS PELANGGAN']);
        fputcsv($file, ['Periode: ' . Carbon::parse($startDate)->format('d/m/Y') . ' - ' . Carbon::parse($endDate)->format('d/m/Y')]);
        fputcsv($file, []); // Empty row
        
        fputcsv($file, [
            'Kode Pelanggan',
            'Nama Pelanggan',
            'Jenis Pelanggan',
            'Total Pembelian',
            'Jumlah Transaksi',
            'Rata-rata per Transaksi',
            'Transaksi Terakhir'
        ]);

        // Get customer data (reuse existing logic)
        $customers = $this->getTopCustomers($startDate, $endDate, 1000); // Get all customers
        foreach ($customers as $customer) {
            fputcsv($file, [
                $customer['kode'],
                $customer['nama'],
                $customer['jenis'],
                $customer['total_spent_format'],
                $customer['total_transactions'],
                $customer['avg_transaction_value_format'],
                $customer['last_transaction'],
            ]);
        }
    }

    /**
     * Get overall statistics
     */
    private function getOverallStatistics($startDate, $endDate)
    {
        $transactions = TtDataPenjualan::whereBetween('tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status_transaksi', 'selesai')
            ->with('detailPenjualan')
            ->get();

        $totalRevenue = $transactions->sum('total_bayar');
        $totalTransactions = $transactions->count();
        $totalItems = $transactions->sum(function ($transaction) {
            return $transaction->detailPenjualan->sum('jumlah_beli');
        });

        return [
            'total_revenue' => $totalRevenue,
            'total_revenue_format' => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
            'total_transactions' => $totalTransactions,
            'total_items' => $totalItems,
            'avg_transaction_value' => $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0,
            'avg_transaction_value_format' => $totalTransactions > 0 ? 'Rp ' . number_format($totalRevenue / $totalTransactions, 0, ',', '.') : 'Rp 0',
            'avg_items_per_transaction' => $totalTransactions > 0 ? $totalItems / $totalTransactions : 0,
        ];
    }

    /**
     * Get daily sales trend
     */
    private function getDailySalesTrend($startDate, $endDate)
    {
        return TtDataPenjualan::whereBetween('tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
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
                    'total_revenue_format' => 'Rp ' . number_format($item->total_revenue, 0, ',', '.'),
                    'avg_transaction_value' => $item->avg_transaction_value,
                    'avg_transaction_value_format' => 'Rp ' . number_format($item->avg_transaction_value, 0, ',', '.'),
                ];
            });
    }

    /**
     * Get top selling products
     */
    private function getTopProducts($startDate, $endDate, $limit = 10)
    {
        return DB::table('tt_detail_penjualan')
            ->join('tt_data_penjualan', 'tt_detail_penjualan.penjualan_id', '=', 'tt_data_penjualan.id')
            ->join('tm_data_produk', 'tt_detail_penjualan.produk_id', '=', 'tm_data_produk.id')
            ->leftJoin('tm_data_kategori', 'tm_data_produk.kategori_id', '=', 'tm_data_kategori.id')
            ->whereBetween('tt_data_penjualan.tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('tt_data_penjualan.status_transaksi', 'selesai')
            ->select(
                'tm_data_produk.kode_produk',
                'tm_data_produk.nama_produk',
                'tm_data_kategori.nama_kategori',
                DB::raw('SUM(tt_detail_penjualan.jumlah_beli) as total_sold'),
                DB::raw('SUM(tt_detail_penjualan.subtotal) as total_revenue'),
                DB::raw('COUNT(DISTINCT tt_data_penjualan.id) as total_transactions')
            )
            ->groupBy('tm_data_produk.id', 'tm_data_produk.kode_produk', 'tm_data_produk.nama_produk', 'tm_data_kategori.nama_kategori')
            ->orderBy('total_sold', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($product, $index) {
                return [
                    'rank' => $index + 1,
                    'kode' => $product->kode_produk,
                    'nama' => $product->nama_produk,
                    'kategori' => $product->nama_kategori ?? 'Tanpa Kategori',
                    'total_sold' => $product->total_sold,
                    'total_revenue' => $product->total_revenue,
                    'total_revenue_format' => 'Rp ' . number_format($product->total_revenue, 0, ',', '.'),
                    'total_transactions' => $product->total_transactions,
                    'avg_qty_per_transaction' => $product->total_transactions > 0 ? 
                        round($product->total_sold / $product->total_transactions, 2) : 0,
                ];
            });
    }

    /**
     * Get top customers
     */
    private function getTopCustomers($startDate, $endDate, $limit = 10)
    {
        return TtDataPenjualan::with('pelanggan')
            ->whereBetween('tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
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
            ->limit($limit)
            ->get()
            ->map(function ($customer, $index) {
                return [
                    'rank' => $index + 1,
                    'id' => $customer->pelanggan_id,
                    'kode' => $customer->pelanggan->kode_pelanggan ?? '-',
                    'nama' => $customer->pelanggan->nama_pelanggan ?? 'Pelanggan Tidak Ditemukan',
                    'jenis' => $customer->pelanggan->jenis_pelanggan ?? '-',
                    'total_transactions' => $customer->total_transactions,
                    'total_spent' => $customer->total_spent,
                    'total_spent_format' => 'Rp ' . number_format($customer->total_spent, 0, ',', '.'),
                    'avg_transaction_value' => $customer->avg_transaction_value,
                    'avg_transaction_value_format' => 'Rp ' . number_format($customer->avg_transaction_value, 0, ',', '.'),
                    'last_transaction' => Carbon::parse($customer->last_transaction)->format('d/m/Y'),
                ];
            });
    }

    /**
     * Get payment method breakdown
     */
    private function getPaymentMethodBreakdown($startDate, $endDate)
    {
        return TtDataPenjualan::whereBetween('tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status_transaksi', 'selesai')
            ->select(
                'metode_pembayaran',
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total_bayar) as total_amount'),
                DB::raw('AVG(total_bayar) as avg_amount')
            )
            ->groupBy('metode_pembayaran')
            ->orderBy('total_amount', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'method' => $payment->metode_pembayaran,
                    'total_transactions' => $payment->total_transactions,
                    'total_amount' => $payment->total_amount,
                    'total_amount_format' => 'Rp ' . number_format($payment->total_amount, 0, ',', '.'),
                    'avg_amount' => $payment->avg_amount,
                    'avg_amount_format' => 'Rp ' . number_format($payment->avg_amount, 0, ',', '.'),
                ];
            });
    }

    /**
     * Get hourly sales pattern
     */
    private function getHourlySalesPattern($startDate, $endDate)
    {
        return TtDataPenjualan::whereBetween('tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status_transaksi', 'selesai')
            ->select(
                DB::raw('HOUR(tanggal_penjualan) as hour'),
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total_bayar) as total_revenue'),
                DB::raw('AVG(total_bayar) as avg_transaction_value')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($item) {
                return [
                    'hour' => $item->hour,
                    'hour_formatted' => sprintf('%02d:00', $item->hour),
                    'total_transactions' => $item->total_transactions,
                    'total_revenue' => $item->total_revenue,
                    'total_revenue_format' => 'Rp ' . number_format($item->total_revenue, 0, ',', '.'),
                    'avg_transaction_value' => $item->avg_transaction_value,
                    'avg_transaction_value_format' => 'Rp ' . number_format($item->avg_transaction_value, 0, ',', '.'),
                ];
            });
    }

    /**
     * Get cashier performance
     */
    private function getCashierPerformance($startDate, $endDate)
    {
        return TtDataPenjualan::with('kasir')
            ->whereBetween('tanggal_penjualan', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status_transaksi', 'selesai')
            ->select(
                'kasir_id',
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total_bayar) as total_revenue'),
                DB::raw('AVG(total_bayar) as avg_transaction_value')
            )
            ->groupBy('kasir_id')
            ->orderBy('total_revenue', 'desc')
            ->get()
            ->map(function ($cashier, $index) {
                return [
                    'rank' => $index + 1,
                    'id' => $cashier->kasir_id,
                    'name' => $cashier->kasir->name ?? 'Kasir Tidak Ditemukan',
                    'email' => $cashier->kasir->email ?? '-',
                    'total_transactions' => $cashier->total_transactions,
                    'total_revenue' => $cashier->total_revenue,
                    'total_revenue_format' => 'Rp ' . number_format($cashier->total_revenue, 0, ',', '.'),
                    'avg_transaction_value' => $cashier->avg_transaction_value,
                    'avg_transaction_value_format' => 'Rp ' . number_format($cashier->avg_transaction_value, 0, ',', '.'),
                ];
            });
    }

    /**
     * Calculate additional helper methods
     */
    private function getDailyStatistics($date)
    {
        $transactions = TtDataPenjualan::whereDate('tanggal_penjualan', $date)
            ->where('status_transaksi', 'selesai')
            ->with('detailPenjualan')
            ->get();

        $totalRevenue = $transactions->sum('total_bayar');
        $totalTransactions = $transactions->count();
        $totalItems = $transactions->sum(function ($transaction) {
            return $transaction->detailPenjualan->sum('jumlah_beli');
        });

        return [
            'total_revenue' => $totalRevenue,
            'total_revenue_format' => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
            'total_transactions' => $totalTransactions,
            'total_items' => $totalItems,
            'avg_transaction_value' => $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0,
            'avg_transaction_value_format' => $totalTransactions > 0 ? 'Rp ' . number_format($totalRevenue / $totalTransactions, 0, ',', '.') : 'Rp 0',
        ];
    }

    private function getHourlyBreakdown($date)
    {
        return TtDataPenjualan::whereDate('tanggal_penjualan', $date)
            ->where('status_transaksi', 'selesai')
            ->select(
                DB::raw('HOUR(tanggal_penjualan) as hour'),
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total_bayar) as total_revenue')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($item) {
                return [
                    'hour' => $item->hour,
                    'hour_formatted' => sprintf('%02d:00', $item->hour),
                    'total_transactions' => $item->total_transactions,
                    'total_revenue' => $item->total_revenue,
                    'total_revenue_format' => 'Rp ' . number_format($item->total_revenue, 0, ',', '.'),
                ];
            });
    }

    private function getMonthlyStatistics($month)
    {
        $carbonMonth = Carbon::parse($month . '-01');
        $startDate = $carbonMonth->startOfMonth()->format('Y-m-d');
        $endDate = $carbonMonth->endOfMonth()->format('Y-m-d');

        return $this->getOverallStatistics($startDate, $endDate);
    }

    private function getWeeklyBreakdown($month)
    {
        $carbonMonth = Carbon::parse($month . '-01');
        $startDate = $carbonMonth->startOfMonth();
        $endDate = $carbonMonth->endOfMonth();
        
        $weeks = [];
        $current = $startDate->copy()->startOfWeek();
        
        while ($current->lte($endDate)) {
            $weekStart = $current->copy();
            $weekEnd = $current->copy()->endOfWeek();
            
            // Adjust if week extends beyond month
            if ($weekEnd->gt($endDate)) {
                $weekEnd = $endDate->copy();
            }
            
            $weekRevenue = TtDataPenjualan::whereBetween('tanggal_penjualan', 
                [$weekStart->format('Y-m-d H:i:s'), $weekEnd->format('Y-m-d H:i:s')])
                ->where('status_transaksi', 'selesai')
                ->sum('total_bayar');
            
            $weekTransactions = TtDataPenjualan::whereBetween('tanggal_penjualan', 
                [$weekStart->format('Y-m-d H:i:s'), $weekEnd->format('Y-m-d H:i:s')])
                ->where('status_transaksi', 'selesai')
                ->count();
            
            $weeks[] = [
                'week_start' => $weekStart->format('d/m'),
                'week_end' => $weekEnd->format('d/m'),
                'week_label' => 'Minggu ' . (count($weeks) + 1),
                'total_transactions' => $weekTransactions,
                'total_revenue' => $weekRevenue,
                'total_revenue_format' => 'Rp ' . number_format($weekRevenue, 0, ',', '.'),
            ];
            
            $current->addWeek();
        }
        
        return collect($weeks);
    }

    private function calculateComparison($current, $previous)
    {
        $revenueChange = $previous['total_revenue'] > 0 ? 
            (($current['total_revenue'] - $previous['total_revenue']) / $previous['total_revenue']) * 100 : 0;
        
        $transactionChange = $previous['total_transactions'] > 0 ? 
            (($current['total_transactions'] - $previous['total_transactions']) / $previous['total_transactions']) * 100 : 0;

        return [
            'revenue_change' => $revenueChange,
            'revenue_change_formatted' => number_format($revenueChange, 1) . '%',
            'transaction_change' => $transactionChange,
            'transaction_change_formatted' => number_format($transactionChange, 1) . '%',
            'revenue_trend' => $revenueChange > 0 ? 'up' : ($revenueChange < 0 ? 'down' : 'stable'),
            'transaction_trend' => $transactionChange > 0 ? 'up' : ($transactionChange < 0 ? 'down' : 'stable'),
        ];
    }

    private function calculateProductPerformanceScore($product)
    {
        // Simple scoring algorithm based on sales volume and revenue
        $volumeScore = min(($product->total_terjual / 100) * 50, 50); // Max 50 points for volume
        $revenueScore = min(($product->total_pendapatan / 1000000) * 50, 50); // Max 50 points for revenue (per 1M)
        
        return round($volumeScore + $revenueScore, 1);
    }

    private function calculateCustomerValueScore($totalPembelian, $jumlahTransaksi)
    {
        // RFM-like scoring
        $monetaryScore = min(($totalPembelian / 1000000) * 50, 50); // Max 50 for monetary
        $frequencyScore = min($jumlahTransaksi * 5, 50); // Max 50 for frequency
        
        return round($monetaryScore + $frequencyScore, 1);
    }

    private function getCustomerValueSegments($customers)
    {
        $high = $customers->where('customer_value_score', '>=', 70)->count();
        $medium = $customers->whereBetween('customer_value_score', [40, 69])->count();
        $low = $customers->where('customer_value_score', '<', 40)->count();

        return [
            'high_value' => $high,
            'medium_value' => $medium,
            'low_value' => $low,
        ];
    }
}
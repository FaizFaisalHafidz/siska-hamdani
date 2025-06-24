<?php

namespace App\Http\Controllers;

use App\Models\TmDataProduk;
use App\Models\TmDataPelanggan;
use App\Models\TmDataSupplier;
use App\Models\TtDataPenjualan;
use App\Models\TtDetailPenjualan;
use App\Models\TtRekomendasiProduk;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $isAdmin = $user->hasRole('admin');
        $isKasir = $user->hasRole('kasir');

        // Get data based on user role
        if ($isAdmin) {
            return $this->getAdminDashboard();
        } else if ($isKasir) {
            return $this->getKasirDashboard();
        }

        // Default dashboard for other roles
        return $this->getDefaultDashboard();
    }

    private function getAdminDashboard()
    {
        // Date ranges
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        $thisYear = Carbon::now()->startOfYear();

        // Main Statistics
        $statistics = [
            'total_products' => TmDataProduk::where('status_aktif', true)->count(),
            'total_customers' => TmDataPelanggan::where('status_aktif', true)->count(),
            'total_suppliers' => TmDataSupplier::where('status_aktif', true)->count(),
            'low_stock_products' => TmDataProduk::where('stok_tersedia', '<=', DB::raw('stok_minimum'))
                ->where('status_aktif', true)->count(),
        ];

        // Sales Statistics - FIXED FIELD NAMES
        $salesStats = [
            'today_sales' => TtDataPenjualan::whereDate('tanggal_penjualan', $today)
                ->where('status_transaksi', 'selesai')
                ->sum('total_bayar'), // Changed from total_harga to total_bayar
            'yesterday_sales' => TtDataPenjualan::whereDate('tanggal_penjualan', $yesterday)
                ->where('status_transaksi', 'selesai')
                ->sum('total_bayar'), // Changed from total_harga to total_bayar
            'month_sales' => TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $thisMonth, $today->endOfDay()
            ])->where('status_transaksi', 'selesai')->sum('total_bayar'), // Changed
            'year_sales' => TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $thisYear, $today->endOfDay()
            ])->where('status_transaksi', 'selesai')->sum('total_bayar'), // Changed
            'today_transactions' => TtDataPenjualan::whereDate('tanggal_penjualan', $today)
                ->where('status_transaksi', 'selesai')->count(),
            'month_transactions' => TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $thisMonth, $today->endOfDay()
            ])->where('status_transaksi', 'selesai')->count(),
        ];

        // Growth calculations
        $salesGrowth = $salesStats['yesterday_sales'] > 0 
            ? (($salesStats['today_sales'] - $salesStats['yesterday_sales']) / $salesStats['yesterday_sales']) * 100
            : 0;

        // Recent transactions - FIXED FIELD NAMES
        $recentTransactions = TtDataPenjualan::with(['detailPenjualan.produk', 'kasir'])
            ->where('status_transaksi', 'selesai')
            ->orderBy('tanggal_penjualan', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'kode_transaksi' => $transaction->nomor_invoice, // Changed from kode_transaksi to nomor_invoice
                    'tanggal' => $transaction->tanggal_penjualan->format('d/m/Y H:i'),
                    'total_harga' => $transaction->total_bayar, // Changed from total_harga to total_bayar
                    'kasir' => $transaction->kasir->name ?? 'Unknown', // Changed from user to kasir
                    'jumlah_item' => $transaction->detailPenjualan->sum('jumlah_beli'),
                ];
            });

        // Top selling products
        $topProducts = TtDetailPenjualan::select('produk_id')
            ->selectRaw('SUM(jumlah_beli) as total_sold')
            ->selectRaw('SUM(subtotal) as total_revenue')
            ->with('produk')
            ->whereHas('penjualan', function ($query) use ($thisMonth, $today) {
                $query->whereBetween('tanggal_penjualan', [$thisMonth, $today->endOfDay()])
                    ->where('status_transaksi', 'selesai');
            })
            ->groupBy('produk_id')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'nama_produk' => $item->produk->nama_produk ?? 'Unknown',
                    'kode_produk' => $item->produk->kode_produk ?? 'Unknown',
                    'total_sold' => $item->total_sold,
                    'total_revenue' => $item->total_revenue,
                    'harga_jual' => $item->produk->harga_jual ?? 0,
                ];
            });

        // Low stock alerts
        $lowStockProducts = TmDataProduk::where('stok_tersedia', '<=', DB::raw('stok_minimum'))
            ->where('status_aktif', true)
            ->orderBy('stok_tersedia', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'nama_produk' => $product->nama_produk,
                    'kode_produk' => $product->kode_produk,
                    'stok_tersedia' => $product->stok_tersedia,
                    'stok_minimum' => $product->stok_minimum,
                    'kategori' => $product->kategori->nama_kategori ?? 'Uncategorized',
                ];
            });

        // Sales chart data (last 7 days) - FIXED FIELD NAME
        $salesChart = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $sales = TtDataPenjualan::whereDate('tanggal_penjualan', $date)
                ->where('status_transaksi', 'selesai')
                ->sum('total_bayar'); // Changed from total_harga to total_bayar
            
            $salesChart->push([
                'date' => $date->format('d/m'),
                'sales' => $sales,
                'day' => $date->format('l'),
            ]);
        }

        // Monthly comparison chart - FIXED FIELD NAME
        $monthlyChart = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $sales = TtDataPenjualan::whereYear('tanggal_penjualan', $month->year)
                ->whereMonth('tanggal_penjualan', $month->month)
                ->where('status_transaksi', 'selesai')
                ->sum('total_bayar'); // Changed from total_harga to total_bayar
            
            $monthlyChart->push([
                'month' => $month->format('M Y'),
                'sales' => $sales,
            ]);
        }

        // Top customers - FIXED FIELD NAME
        $topCustomers = TtDataPenjualan::select('pelanggan_id')
            ->selectRaw('COUNT(*) as total_transactions')
            ->selectRaw('SUM(total_bayar) as total_spent') // Changed from total_harga to total_bayar
            ->with('pelanggan')
            ->where('status_transaksi', 'selesai')
            ->whereNotNull('pelanggan_id')
            ->whereBetween('tanggal_penjualan', [$thisMonth, $today->endOfDay()])
            ->groupBy('pelanggan_id')
            ->orderBy('total_spent', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'nama_pelanggan' => $item->pelanggan->nama_pelanggan ?? 'Unknown',
                    'email' => $item->pelanggan->email ?? '-',
                    'total_transactions' => $item->total_transactions,
                    'total_spent' => $item->total_spent,
                ];
            });

        // Active recommendations
        $activeRecommendations = TtRekomendasiProduk::with(['produkUtama', 'produkRekomendasi'])
            ->where('status_aktif', true)
            ->orderBy('skor_rekomendasi', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($rec) {
                return [
                    'produk_utama' => $rec->produkUtama->nama_produk ?? 'Unknown',
                    'produk_rekomendasi' => $rec->produkRekomendasi->nama_produk ?? 'Unknown',
                    'skor_rekomendasi' => round($rec->skor_rekomendasi * 100, 1),
                    'frekuensi_bersamaan' => $rec->frekuensi_bersamaan,
                ];
            });

        return Inertia::render('dashboard', [
            'statistics' => $statistics,
            'salesStats' => array_merge($salesStats, ['growth' => $salesGrowth]),
            'recentTransactions' => $recentTransactions,
            'topProducts' => $topProducts,
            'lowStockProducts' => $lowStockProducts,
            'topCustomers' => $topCustomers,
            'activeRecommendations' => $activeRecommendations,
            'charts' => [
                'daily_sales' => $salesChart,
                'monthly_sales' => $monthlyChart,
            ],
            'userRole' => 'admin',
        ]);
    }

    private function getKasirDashboard()
    {
        $user = Auth::user();
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        // Kasir specific statistics - FIXED FIELD NAMES
        $kasirStats = [
            'today_sales' => TtDataPenjualan::whereDate('tanggal_penjualan', $today)
                ->where('kasir_id', $user->id) // Changed from user_id to kasir_id
                ->where('status_transaksi', 'selesai')
                ->sum('total_bayar'), // Changed from total_harga to total_bayar
            'today_transactions' => TtDataPenjualan::whereDate('tanggal_penjualan', $today)
                ->where('kasir_id', $user->id) // Changed from user_id to kasir_id
                ->where('status_transaksi', 'selesai')
                ->count(),
            'month_sales' => TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $thisMonth, $today->endOfDay()
            ])->where('kasir_id', $user->id) // Changed from user_id to kasir_id
              ->where('status_transaksi', 'selesai')
              ->sum('total_bayar'), // Changed from total_harga to total_bayar
            'month_transactions' => TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $thisMonth, $today->endOfDay()
            ])->where('kasir_id', $user->id) // Changed from user_id to kasir_id
              ->where('status_transaksi', 'selesai')
              ->count(),
        ];

        // Recent transactions by this kasir - FIXED FIELD NAMES
        $recentTransactions = TtDataPenjualan::with(['detailPenjualan.produk'])
            ->where('kasir_id', $user->id) // Changed from user_id to kasir_id
            ->where('status_transaksi', 'selesai')
            ->orderBy('tanggal_penjualan', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'kode_transaksi' => $transaction->nomor_invoice, // Changed from kode_transaksi to nomor_invoice
                    'tanggal' => $transaction->tanggal_penjualan->format('d/m/Y H:i'),
                    'total_harga' => $transaction->total_bayar, // Changed from total_harga to total_bayar
                    'jumlah_item' => $transaction->detailPenjualan->sum('jumlah_beli'),
                ];
            });

        // Daily performance chart (last 7 days) - FIXED FIELD NAMES
        $performanceChart = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $sales = TtDataPenjualan::whereDate('tanggal_penjualan', $date)
                ->where('kasir_id', $user->id) // Changed from user_id to kasir_id
                ->where('status_transaksi', 'selesai')
                ->sum('total_bayar'); // Changed from total_harga to total_bayar
            
            $transactions = TtDataPenjualan::whereDate('tanggal_penjualan', $date)
                ->where('kasir_id', $user->id) // Changed from user_id to kasir_id
                ->where('status_transaksi', 'selesai')
                ->count();
            
            $performanceChart->push([
                'date' => $date->format('d/m'),
                'sales' => $sales,
                'transactions' => $transactions,
                'day' => $date->format('l'),
            ]);
        }

        // Quick access products (most sold by this kasir) - FIXED FIELD NAMES
        $quickProducts = TtDetailPenjualan::select('produk_id')
            ->selectRaw('COUNT(*) as frequency')
            ->with('produk')
            ->whereHas('penjualan', function ($query) use ($user, $thisMonth, $today) {
                $query->where('kasir_id', $user->id) // Changed from user_id to kasir_id
                    ->whereBetween('tanggal_penjualan', [$thisMonth, $today->endOfDay()])
                    ->where('status_transaksi', 'selesai');
            })
            ->groupBy('produk_id')
            ->orderBy('frequency', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->produk->id,
                    'nama_produk' => $item->produk->nama_produk,
                    'kode_produk' => $item->produk->kode_produk,
                    'harga_jual' => $item->produk->harga_jual,
                    'stok_tersedia' => $item->produk->stok_tersedia,
                    'frequency' => $item->frequency,
                ];
            });

        return Inertia::render('dashboard', [
            'kasirStats' => $kasirStats,
            'recentTransactions' => $recentTransactions,
            'quickProducts' => $quickProducts,
            'charts' => [
                'performance' => $performanceChart,
            ],
            'userRole' => 'kasir',
        ]);
    }

    private function getDefaultDashboard()
    {
        return Inertia::render('dashboard', [
            'userRole' => 'user',
        ]);
    }
}
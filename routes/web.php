<?php

use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Kasir\CustomerController as KasirCustomerController;
use App\Http\Controllers\PenjualanController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

// Admin routes with authentication and role middleware
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    
    // User Management Routes
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{user}', [UserController::class, 'show'])->name('show');
        Route::put('/{user}', [UserController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
        Route::patch('/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('toggle-status');
        Route::patch('/{user}/reset-password', [UserController::class, 'resetPassword'])->name('reset-password');
    });
    
    // Product Management Routes
    Route::prefix('produk')->name('produk.')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('index');
        Route::get('/create', [ProductController::class, 'create'])->name('create');
        Route::post('/', [ProductController::class, 'store'])->name('store');
        Route::get('/{produk}', [ProductController::class, 'show'])->name('show');
        Route::get('/{produk}/edit', [ProductController::class, 'edit'])->name('edit');
        Route::put('/{produk}', [ProductController::class, 'update'])->name('update');
        Route::delete('/{produk}', [ProductController::class, 'destroy'])->name('destroy');
        Route::patch('/{produk}/toggle-status', [ProductController::class, 'toggleStatus'])->name('toggle-status');
        Route::patch('/{produk}/update-stock', [ProductController::class, 'updateStock'])->name('update-stock');
        Route::get('/api/products', [ProductController::class, 'getProducts'])->name('api.products');
    });
    
    // Customer Management Routes (Admin)
    Route::prefix('pelanggan')->name('pelanggan.')->group(function () {
        Route::get('/', [AdminCustomerController::class, 'index'])->name('index');
        Route::get('/create', [AdminCustomerController::class, 'create'])->name('create');
        Route::post('/', [AdminCustomerController::class, 'store'])->name('store');
        Route::get('/{pelanggan}', [AdminCustomerController::class, 'show'])->name('show');
        Route::get('/{pelanggan}/edit', [AdminCustomerController::class, 'edit'])->name('edit');
        Route::put('/{pelanggan}', [AdminCustomerController::class, 'update'])->name('update');
        Route::delete('/{pelanggan}', [AdminCustomerController::class, 'destroy'])->name('destroy');
        Route::patch('/{pelanggan}/toggle-status', [AdminCustomerController::class, 'toggleStatus'])->name('toggle-status');
        Route::get('/export/excel', [AdminCustomerController::class, 'export'])->name('export');
        Route::get('/api/customers', [AdminCustomerController::class, 'getCustomers'])->name('api.customers');
    });
    
    // Supplier Management Routes (Admin Only)
    Route::prefix('supplier')->name('supplier.')->group(function () {
        Route::get('/', [SupplierController::class, 'index'])->name('index');
        Route::get('/create', [SupplierController::class, 'create'])->name('create');
        Route::post('/', [SupplierController::class, 'store'])->name('store');
        Route::get('/{supplier}', [SupplierController::class, 'show'])->name('show');
        Route::get('/{supplier}/edit', [SupplierController::class, 'edit'])->name('edit');
        Route::put('/{supplier}', [SupplierController::class, 'update'])->name('update');
        Route::delete('/{supplier}', [SupplierController::class, 'destroy'])->name('destroy');
        Route::patch('/{supplier}/toggle-status', [SupplierController::class, 'toggleStatus'])->name('toggle-status');
        Route::post('/bulk-action', [SupplierController::class, 'bulkAction'])->name('bulk-action');
        Route::get('/export/excel', [SupplierController::class, 'export'])->name('export');
        
        // API routes
        Route::get('/api/suppliers', [SupplierController::class, 'getSuppliers'])->name('api.suppliers');
        Route::get('/api/statistics', [SupplierController::class, 'getStatistics'])->name('api.statistics');
    });
    
    // POS/Penjualan Routes for Admin
    Route::prefix('penjualan')->name('penjualan.')->group(function () {
        Route::get('/', [PenjualanController::class, 'index'])->name('index');
        Route::post('/', [PenjualanController::class, 'store'])->name('store');
        Route::get('/{id}/transaction', [PenjualanController::class, 'getTransaction'])->name('transaction');
        Route::get('/{id}/print', [PenjualanController::class, 'printReceipt'])->name('print');
        Route::patch('/{id}/void', [PenjualanController::class, 'voidTransaction'])->name('void');
        
        // API routes
        Route::get('/api/search-products', [PenjualanController::class, 'searchProducts'])->name('api.search-products');
        Route::get('/api/recent-transactions', [PenjualanController::class, 'getRecentTransactions'])->name('api.recent-transactions');
        Route::get('/api/daily-summary', [PenjualanController::class, 'getDailySummary'])->name('api.daily-summary');
    });
    
    // Riwayat Pembelian Routes (Admin)
    Route::prefix('riwayat-pembelian')->name('riwayat-pembelian.')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\RiwayatPembelianController::class, 'index'])->name('index');
        Route::get('/{id}', [App\Http\Controllers\Admin\RiwayatPembelianController::class, 'show'])->name('show');
        Route::get('/export/excel', [App\Http\Controllers\Admin\RiwayatPembelianController::class, 'export'])->name('export');
        Route::get('/export/csv', [App\Http\Controllers\Admin\RiwayatPembelianController::class, 'exportCsv'])->name('export-csv');
        Route::get('/reports/daily', [App\Http\Controllers\Admin\RiwayatPembelianController::class, 'dailyReport'])->name('daily-report');
        Route::get('/reports/monthly', [App\Http\Controllers\Admin\RiwayatPembelianController::class, 'monthlyReport'])->name('monthly-report');
    });
    
    // Laporan Penjualan Routes (Admin Only)
    Route::prefix('laporan')->name('laporan.')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'index'])->name('index');
        Route::get('/harian', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'dailyReport'])->name('daily');
        Route::get('/bulanan', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'monthlyReport'])->name('monthly');
        Route::get('/produk', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'productReport'])->name('product');
        Route::get('/pelanggan', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'customerReport'])->name('customer');
        Route::get('/export', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'export'])->name('export');
    });
    
    // Rekomendasi Produk Routes (Admin Only)
    Route::prefix('rekomendasi')->name('rekomendasi.')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\RekomendasiProdukController::class, 'index'])->name('index');
        Route::get('/{id}', [App\Http\Controllers\Admin\RekomendasiProdukController::class, 'show'])->name('show');
        Route::post('/generate', [App\Http\Controllers\Admin\RekomendasiProdukController::class, 'generateRekomendasi'])->name('generate');
        Route::put('/{id}/status', [App\Http\Controllers\Admin\RekomendasiProdukController::class, 'updateStatus'])->name('update-status');
        Route::delete('/{id}', [App\Http\Controllers\Admin\RekomendasiProdukController::class, 'destroy'])->name('destroy');
        Route::get('/analisis/apriori', [App\Http\Controllers\Admin\RekomendasiProdukController::class, 'aprioriAnalysis'])->name('apriori');
    });
    
    Route::prefix('laporan-penjualan')->name('laporan-penjualan.')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'index'])->name('index');
        Route::get('/daily', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'dailyReport'])->name('daily');
        Route::get('/monthly', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'monthlyReport'])->name('monthly');
        Route::get('/product', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'productReport'])->name('product');
        Route::get('/customer', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'customerReport'])->name('customer');
        
        // Export routes
        Route::get('/export', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'export'])->name('export');
        Route::get('/export/daily', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'exportDaily'])->name('export-daily');
        Route::get('/export/monthly', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'exportMonthly'])->name('export-monthly');
        Route::get('/export/product', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'exportProduct'])->name('export-product');
        Route::get('/export/customer', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'exportCustomer'])->name('export-customer');
        Route::get('/export/complete', [App\Http\Controllers\Admin\LaporanPenjualanController::class, 'exportComplete'])->name('export-complete');
    });
});

// Kasir routes with authentication and role middleware
Route::middleware(['auth', 'role:kasir'])->prefix('kasir')->name('kasir.')->group(function () {
    
    // Customer Management Routes for Kasir (Limited functionality)
    Route::prefix('pelanggan')->name('pelanggan.')->group(function () {
        Route::get('/', [KasirCustomerController::class, 'index'])->name('index');
        Route::get('/create', [KasirCustomerController::class, 'create'])->name('create');
        Route::post('/', [KasirCustomerController::class, 'store'])->name('store');
        Route::get('/{pelanggan}', [KasirCustomerController::class, 'show'])->name('show');
        Route::get('/{pelanggan}/edit', [KasirCustomerController::class, 'edit'])->name('edit');
        Route::put('/{pelanggan}', [KasirCustomerController::class, 'update'])->name('update');
        Route::patch('/{pelanggan}/toggle-status', [KasirCustomerController::class, 'toggleStatus'])->name('toggle-status');
        
        // API routes for kasir
        Route::get('/api/customers', [KasirCustomerController::class, 'getCustomers'])->name('api.customers');
        Route::get('/api/search', [KasirCustomerController::class, 'searchForTransaction'])->name('api.search');
        Route::get('/api/quick-stats', [KasirCustomerController::class, 'quickStats'])->name('api.quick-stats');
    });
    
    // POS/Penjualan Routes for Kasir (Same functionality but no void)
    Route::prefix('penjualan')->name('penjualan.')->group(function () {
        Route::get('/', [PenjualanController::class, 'index'])->name('index');
        Route::post('/', [PenjualanController::class, 'store'])->name('store');
        Route::get('/{id}/transaction', [PenjualanController::class, 'getTransaction'])->name('transaction');
        Route::get('/{id}/print', [PenjualanController::class, 'printReceipt'])->name('print');
        
        // API routes (limited to kasir's own transactions)
        Route::get('/api/search-products', [PenjualanController::class, 'searchProducts'])->name('api.search-products');
        Route::get('/api/recent-transactions', [PenjualanController::class, 'getRecentTransactions'])->name('api.recent-transactions');
        Route::get('/api/daily-summary', [PenjualanController::class, 'getDailySummary'])->name('api.daily-summary');
    });
    
    // Riwayat Pembelian Routes for Kasir (Limited functionality)
    Route::prefix('riwayat-pembelian')->name('riwayat-pembelian.')->group(function () {
        Route::get('/', [App\Http\Controllers\Kasir\RiwayatPembelianController::class, 'index'])->name('index');
        Route::get('/{id}', [App\Http\Controllers\Kasir\RiwayatPembelianController::class, 'show'])->name('show');
        Route::get('/kinerja/harian', [App\Http\Controllers\Kasir\RiwayatPembelianController::class, 'dailyPerformance'])->name('daily-performance');
    });
    
});

// POS routes with proper middleware
Route::middleware(['auth', 'role:admin,kasir'])->prefix('pos')->name('pos.')->group(function () {
    Route::get('/', [PenjualanController::class, 'index'])->name('index');
    Route::post('/transaction', [PenjualanController::class, 'store'])->name('transaction.store');
    Route::get('/transaction/{id}', [PenjualanController::class, 'getTransaction'])->name('transaction.show');
    
    // Multiple print options
    Route::get('/print/{id}', [PenjualanController::class, 'printReceipt'])->name('print'); // Original print
    Route::get('/thermal/{id}', [PenjualanController::class, 'printThermal'])->name('thermal'); // Thermal print
    Route::get('/thermal-text/{id}', [PenjualanController::class, 'thermalText'])->name('thermal-text'); // Thermal text
    Route::get('/download/{id}', [PenjualanController::class, 'downloadReceipt'])->name('download'); // PDF download
    
    // API routes
    Route::get('/api/search-products', [PenjualanController::class, 'searchProducts'])->name('api.search-products');
    Route::get('/api/recent-transactions', [PenjualanController::class, 'getRecentTransactions'])->name('api.recent-transactions');
    Route::get('/api/daily-summary', [PenjualanController::class, 'getDailySummary'])->name('api.daily-summary');
    
    // Admin only routes
    Route::middleware('role:admin')->group(function () {
        Route::patch('/transaction/{id}/void', [PenjualanController::class, 'voidTransaction'])->name('transaction.void');
    });
});
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

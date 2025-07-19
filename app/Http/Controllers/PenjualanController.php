<?php

namespace App\Http\Controllers;

use App\Models\TmDataPelanggan;
use App\Models\TmDataProduk;
use App\Models\TmDataKategori;
use App\Models\TtDataPenjualan;
use App\Models\TtDetailPenjualan;
use App\Models\TtDataStok;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf; // This should work now after installation

class PenjualanController extends Controller
{
    /**
     * Display the POS interface
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $userRole = $user->roles->first()->name ?? 'kasir';

        // Get active products with stock and their categories
        $products = TmDataProduk::with('kategori')
            ->aktif()
            ->where('stok_tersedia', '>', 0)
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_produk', 'like', "%{$search}%")
                           ->orWhere('kode_produk', 'like', "%{$search}%");
            })
            ->when($request->kategori, function ($query, $kategoriId) {
                return $query->where('kategori_id', $kategoriId);
            })
            ->orderBy('nama_produk')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'kode_produk' => $product->kode_produk,
                    'nama_produk' => $product->nama_produk,
                    'kategori_id' => $product->kategori_id,
                    'kategori_nama' => $product->kategori ? $product->kategori->nama_kategori : 'Tanpa Kategori',
                    'harga_jual' => $product->harga_jual,
                    'harga_jual_format' => 'Rp ' . number_format($product->harga_jual, 0, ',', '.'),
                    'stok_tersedia' => $product->stok_tersedia,
                    'gambar_produk' => $product->gambar_produk ? Storage::url($product->gambar_produk) : null,
                    'deskripsi_produk' => $product->deskripsi_produk,
                    'satuan' => $product->satuan,
                    'merk_produk' => $product->merk_produk,
                ];
            });

        // Get active categories for filter
        $categories = TmDataKategori::aktif()
            ->orderBy('nama_kategori')
            ->get()
            ->map(function ($kategori) {
                return [
                    'id' => $kategori->id,
                    'nama' => $kategori->nama_kategori,
                ];
            });

        // Get active customers for quick selection
        $customers = TmDataPelanggan::aktif()
            ->select('id', 'kode_pelanggan', 'nama_pelanggan', 'nomor_telepon', 'jenis_pelanggan')
            ->orderBy('nama_pelanggan')
            ->limit(100)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'kode' => $customer->kode_pelanggan,
                    'nama' => $customer->nama_pelanggan,
                    'telepon' => $customer->nomor_telepon,
                    'jenis' => $customer->jenis_pelanggan,
                    'display' => $customer->kode_pelanggan . ' - ' . $customer->nama_pelanggan,
                ];
            });

        // Quick stats for today
        $todayStats = [
            'total_transaksi' => TtDataPenjualan::hariIni()->selesai()->count(),
            'total_penjualan' => TtDataPenjualan::hariIni()->selesai()->sum('total_bayar'),
            'total_penjualan_format' => 'Rp ' . number_format(TtDataPenjualan::hariIni()->selesai()->sum('total_bayar'), 0, ',', '.'),
            'total_item_terjual' => TtDetailPenjualan::whereHas('penjualan', function ($query) {
                $query->hariIni()->selesai();
            })->sum('jumlah_beli'),
        ];

        return Inertia::render('POS/Index', [
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'todayStats' => $todayStats,
            'userRole' => $userRole,
            'filters' => $request->only(['search', 'kategori']),
        ]);
    }

    /**
     * Process the sale transaction
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pelanggan_id' => 'nullable|exists:tm_data_pelanggan,id',
            'items' => 'required|array|min:1',
            'items.*.produk_id' => 'required|exists:tm_data_produk,id',
            'items.*.jumlah' => 'required|integer|min:1',
            'items.*.harga_satuan' => 'required|numeric|min:0',
            'items.*.diskon_item' => 'nullable|numeric|min:0',
            'items.*.catatan_item' => 'nullable|string|max:255',
            'diskon_persen' => 'nullable|numeric|min:0|max:100',
            'diskon_nominal' => 'nullable|numeric|min:0',
            'pajak_persen' => 'nullable|numeric|min:0|max:100',
            'metode_pembayaran' => 'required|in:tunai,kartu_debit,kartu_kredit,transfer,qris',
            'jumlah_dibayar' => 'required|numeric|min:0',
            'catatan_penjualan' => 'nullable|string|max:500',
        ], [
            'items.required' => 'Minimal harus ada 1 item',
            'items.*.produk_id.required' => 'Produk harus dipilih',
            'items.*.produk_id.exists' => 'Produk tidak ditemukan',
            'items.*.jumlah.required' => 'Jumlah harus diisi',
            'items.*.jumlah.min' => 'Jumlah minimal 1',
            'items.*.harga_satuan.required' => 'Harga satuan harus diisi',
            'metode_pembayaran.required' => 'Metode pembayaran harus dipilih',
            'jumlah_dibayar.required' => 'Jumlah dibayar harus diisi',
            'jumlah_dibayar.min' => 'Jumlah dibayar tidak boleh minus',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            // Validate stock availability
            foreach ($request->items as $item) {
                $product = TmDataProduk::find($item['produk_id']);
                if (!$product) {
                    throw new \Exception("Produk dengan ID {$item['produk_id']} tidak ditemukan");
                }
                
                if (!$product->status_aktif) {
                    throw new \Exception("Produk {$product->nama_produk} sedang tidak aktif");
                }
                
                if ($product->stok_tersedia < $item['jumlah']) {
                    throw new \Exception("Stok produk {$product->nama_produk} tidak mencukupi. Stok tersedia: {$product->stok_tersedia}");
                }
            }

            // Calculate totals
            $totalBelanja = 0;
            foreach ($request->items as $item) {
                $subtotal = ($item['jumlah'] * $item['harga_satuan']) - ($item['diskon_item'] ?? 0);
                $totalBelanja += $subtotal;
            }

            $diskonNominal = $request->diskon_nominal ?? 0;
            if ($request->diskon_persen > 0) {
                $diskonNominal = ($totalBelanja * $request->diskon_persen) / 100;
            }

            $totalSetelahDiskon = $totalBelanja - $diskonNominal;
            
            $pajakNominal = 0;
            if ($request->pajak_persen > 0) {
                $pajakNominal = ($totalSetelahDiskon * $request->pajak_persen) / 100;
            }

            $totalBayar = $totalSetelahDiskon + $pajakNominal;
            $kembalian = $request->jumlah_dibayar - $totalBayar;

            if ($kembalian < 0) {
                throw new \Exception('Jumlah pembayaran kurang dari total yang harus dibayar');
            }

            // Generate nomor invoice
            $nomorInvoice = TtDataPenjualan::generateNomorInvoice();

            // Create penjualan record
            $penjualan = TtDataPenjualan::create([
                'nomor_invoice' => $nomorInvoice,
                'pelanggan_id' => $request->pelanggan_id,
                'kasir_id' => Auth::id(),
                'total_belanja' => $totalBelanja,
                'diskon_persen' => $request->diskon_persen ?? 0,
                'diskon_nominal' => $diskonNominal,
                'pajak_persen' => $request->pajak_persen ?? 0,
                'pajak_nominal' => $pajakNominal,
                'total_bayar' => $totalBayar,
                'jumlah_dibayar' => $request->jumlah_dibayar,
                'kembalian' => $kembalian,
                'metode_pembayaran' => $request->metode_pembayaran,
                'catatan_penjualan' => $request->catatan_penjualan,
                'tanggal_penjualan' => now(),
                'status_transaksi' => 'selesai',
            ]);

            // Create detail penjualan and update stock
            foreach ($request->items as $item) {
                $product = TmDataProduk::find($item['produk_id']);
                $subtotal = ($item['jumlah'] * $item['harga_satuan']) - ($item['diskon_item'] ?? 0);

                // Create detail penjualan
                TtDetailPenjualan::create([
                    'penjualan_id' => $penjualan->id,
                    'produk_id' => $item['produk_id'],
                    'jumlah_beli' => $item['jumlah'],
                    'harga_satuan' => $item['harga_satuan'],
                    'diskon_item' => $item['diskon_item'] ?? 0,
                    'subtotal' => $subtotal,
                    'catatan_item' => $item['catatan_item'] ?? null,
                ]);

                // Update product stock
                $stokSebelum = $product->stok_tersedia;
                $stokSesudah = $stokSebelum - $item['jumlah'];
                
                $product->update([
                    'stok_tersedia' => $stokSesudah
                ]);

                // Create stock transaction record
                TtDataStok::create([
                    'produk_id' => $item['produk_id'],
                    'jenis_transaksi' => 'keluar',
                    'jumlah_stok' => $item['jumlah'],
                    'stok_sebelum' => $stokSebelum,
                    'stok_sesudah' => $stokSesudah,
                    'referensi_transaksi' => $nomorInvoice,
                    'keterangan' => 'Penjualan - ' . $nomorInvoice,
                    'tanggal_transaksi' => now(),
                    'user_id' => Auth::id(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil diproses',
                'data' => [
                    'penjualan_id' => $penjualan->id,
                    'nomor_invoice' => $nomorInvoice,
                    'total_bayar' => $totalBayar,
                    'kembalian' => $kembalian,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get transaction details for receipt
     */
    public function getTransaction($id)
    {
        try {
            $penjualan = TtDataPenjualan::with([
                'pelanggan',
                'kasir',
                'detailPenjualan.produk.kategori'
            ])->findOrFail($id);

            $transactionData = [
                'id' => $penjualan->id,
                'nomor_invoice' => $penjualan->nomor_invoice,
                'tanggal_penjualan' => $penjualan->tanggal_penjualan->format('d/m/Y H:i:s'),
                'pelanggan' => $penjualan->pelanggan ? [
                    'kode' => $penjualan->pelanggan->kode_pelanggan,
                    'nama' => $penjualan->pelanggan->nama_pelanggan,
                    'telepon' => $penjualan->pelanggan->nomor_telepon,
                    'jenis' => $penjualan->pelanggan->jenis_pelanggan,
                ] : null,
                'kasir' => [
                    'nama' => $penjualan->kasir->name,
                ],
                'items' => $penjualan->detailPenjualan->map(function ($detail) {
                    return [
                        'nama_produk' => $detail->produk->nama_produk,
                        'kode_produk' => $detail->produk->kode_produk,
                        'kategori' => $detail->produk->kategori ? $detail->produk->kategori->nama_kategori : 'Tanpa Kategori',
                        'jumlah' => $detail->jumlah_beli,
                        'harga_satuan' => $detail->harga_satuan,
                        'harga_satuan_format' => 'Rp ' . number_format($detail->harga_satuan, 0, ',', '.'),
                        'diskon_item' => $detail->diskon_item,
                        'diskon_item_format' => 'Rp ' . number_format($detail->diskon_item, 0, ',', '.'),
                        'subtotal' => $detail->subtotal,
                        'subtotal_format' => 'Rp ' . number_format($detail->subtotal, 0, ',', '.'),
                        'catatan_item' => $detail->catatan_item,
                    ];
                }),
                'total_belanja' => $penjualan->total_belanja,
                'total_belanja_format' => 'Rp ' . number_format($penjualan->total_belanja, 0, ',', '.'),
                'diskon_persen' => $penjualan->diskon_persen,
                'diskon_nominal' => $penjualan->diskon_nominal,
                'diskon_nominal_format' => 'Rp ' . number_format($penjualan->diskon_nominal, 0, ',', '.'),
                'pajak_persen' => $penjualan->pajak_persen,
                'pajak_nominal' => $penjualan->pajak_nominal,
                'pajak_nominal_format' => 'Rp ' . number_format($penjualan->pajak_nominal, 0, ',', '.'),
                'total_bayar' => $penjualan->total_bayar,
                'total_bayar_format' => 'Rp ' . number_format($penjualan->total_bayar, 0, ',', '.'),
                'jumlah_dibayar' => $penjualan->jumlah_dibayar,
                'jumlah_dibayar_format' => 'Rp ' . number_format($penjualan->jumlah_dibayar, 0, ',', '.'),
                'kembalian' => $penjualan->kembalian,
                'kembalian_format' => 'Rp ' . number_format($penjualan->kembalian, 0, ',', '.'),
                'metode_pembayaran' => $penjualan->metode_pembayaran,
                'catatan_penjualan' => $penjualan->catatan_penjualan,
                'status_transaksi' => $penjualan->status_transaksi,
            ];

            return response()->json([
                'success' => true,
                'data' => $transactionData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
        }
    }

    /**
     * Generate unique invoice number
     */
    private function generateNomorInvoice()
    {
        $today = Carbon::now()->format('Ymd');
        $prefix = 'INV-' . $today . '-';
        
        $lastInvoice = TtDataPenjualan::where('nomor_invoice', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();
        
        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->nomor_invoice, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Print receipt - Open in new tab for printing
     */
    public function printReceipt($id)
    {
        try {
            $penjualan = TtDataPenjualan::with([
                'pelanggan',
                'kasir',
                'detailPenjualan.produk.kategori'
            ])->findOrFail($id);

            $data = [
                'penjualan' => $penjualan,
                'toko' => [
                    'nama' => 'Hamdani Canon',
                    'alamat' => 'Jl. Contoh No. 123, Kota',
                    'telepon' => '021-12345678',
                    'email' => 'info@hamdanicanon.com',
                ]
            ];

            // Return HTML view directly for printing in browser
            return view('receipt.thermal', $data);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat struk: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download receipt as PDF (optional method)
     */
    public function downloadReceipt($id)
    {
        try {
            $penjualan = TtDataPenjualan::with([
                'pelanggan',
                'kasir',
                'detailPenjualan.produk.kategori'
            ])->findOrFail($id);

            $data = [
                'penjualan' => $penjualan,
                'toko' => [
                    'nama' => 'Hamdani Canon',
                    'alamat' => 'Jl. Contoh No. 123, Kota',
                    'telepon' => '021-12345678',
                    'email' => 'info@hamdanicanon.com',
                ]
            ];

            $pdf = Pdf::loadView('receipt.thermal-pdf', $data);
            $pdf->setPaper([0, 0, 226.77, 566.93], 'portrait'); // 80mm thermal paper

            return $pdf->download('receipt-' . $penjualan->nomor_invoice . '.pdf');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunduh struk: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Print thermal receipt - Optimized for thermal printer
     */
    public function printThermal($id)
    {
        try {
            $penjualan = TtDataPenjualan::with([
                'pelanggan',
                'kasir',
                'detailPenjualan.produk.kategori'
            ])->findOrFail($id);

            $data = [
                'penjualan' => $penjualan,
                'toko' => [
                    'nama' => 'Hamdani Canon',
                    'alamat' => 'Jl. Contoh No. 123, Kota',
                    'telepon' => '021-12345678',
                    'email' => 'info@hamdanicanon.com',
                ]
            ];

            // Return thermal-specific view
            return view('receipt.thermal-print', $data);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat struk thermal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate thermal receipt text for direct printer
     */
    public function thermalText($id)
    {
        try {
            $penjualan = TtDataPenjualan::with([
                'pelanggan',
                'kasir',
                'detailPenjualan.produk.kategori'
            ])->findOrFail($id);

            $thermalText = $this->generateThermalText($penjualan);

            return response($thermalText)
                ->header('Content-Type', 'text/plain')
                ->header('Content-Disposition', 'attachment; filename="thermal-' . $penjualan->nomor_invoice . '.txt"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate thermal text: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate thermal printer commands (ESC/POS)
     */
    private function generateThermalText($penjualan)
    {
        $text = "";
        $width = 32; // 80mm thermal paper character width
        
        // ESC/POS Commands
        $esc = chr(27);
        $init = $esc . "@"; // Initialize printer
        $center = $esc . "a" . chr(1); // Center align
        $left = $esc . "a" . chr(0); // Left align
        $bold = $esc . "E" . chr(1); // Bold on
        $boldOff = $esc . "E" . chr(0); // Bold off
        $cut = $esc . "m"; // Cut paper
        
        $text .= $init;
        $text .= $center . $bold;
        $text .= "Hamdani Canon\n";
        $text .= $boldOff;
        $text .= "Jl. Contoh No. 123, Kota\n";
        $text .= "Tel: 021-12345678\n";
        $text .= "info@hamdanicanon.com\n";
        $text .= str_repeat("-", $width) . "\n";
        
        $text .= $left;
        $text .= "No. Invoice: " . $penjualan->nomor_invoice . "\n";
        $text .= "Tanggal: " . $penjualan->tanggal_penjualan->format('d/m/Y H:i') . "\n";
        $text .= "Kasir: " . $penjualan->kasir->name . "\n";
        
        if ($penjualan->pelanggan) {
            $text .= "Pelanggan: " . $penjualan->pelanggan->nama_pelanggan . "\n";
        }
        
        $text .= str_repeat("-", $width) . "\n";
        
        // Items
        foreach ($penjualan->detailPenjualan as $detail) {
            $text .= $bold . $detail->produk->nama_produk . $boldOff . "\n";
            $text .= $detail->produk->kode_produk . "\n";
            
            $qtyPrice = $detail->jumlah_beli . " x " . number_format($detail->harga_satuan, 0, ',', '.');
            $subtotal = "Rp " . number_format($detail->subtotal, 0, ',', '.');
            
            $spaces = $width - strlen($qtyPrice) - strlen($subtotal);
            $text .= $qtyPrice . str_repeat(" ", max(1, $spaces)) . $subtotal . "\n";
            
            if ($detail->diskon_item > 0) {
                $text .= "  Disc: -Rp " . number_format($detail->diskon_item, 0, ',', '.') . "\n";
            }
            
            $text .= "\n";
        }
        
        $text .= str_repeat("-", $width) . "\n";
        
        // Totals
        $text .= "Subtotal: " . str_repeat(" ", $width - 20) . "Rp " . number_format($penjualan->total_belanja, 0, ',', '.') . "\n";
        
        if ($penjualan->diskon_nominal > 0) {
            $text .= "Diskon: " . str_repeat(" ", $width - 18) . "-Rp " . number_format($penjualan->diskon_nominal, 0, ',', '.') . "\n";
        }
        
        if ($penjualan->pajak_nominal > 0) {
            $text .= "Pajak: " . str_repeat(" ", $width - 17) . "Rp " . number_format($penjualan->pajak_nominal, 0, ',', '.') . "\n";
        }
        
        $text .= $bold . "TOTAL: " . str_repeat(" ", $width - 17) . "Rp " . number_format($penjualan->total_bayar, 0, ',', '.') . $boldOff . "\n";
        $text .= "Dibayar: " . str_repeat(" ", $width - 19) . "Rp " . number_format($penjualan->jumlah_dibayar, 0, ',', '.') . "\n";
        $text .= $bold . "Kembalian: " . str_repeat(" ", $width - 21) . "Rp " . number_format($penjualan->kembalian, 0, ',', '.') . $boldOff . "\n";
        
        $text .= str_repeat("-", $width) . "\n";
        $text .= $center;
        $text .= "Terima kasih atas kunjungan Anda!\n";
        $text .= "Barang yang sudah dibeli\n";
        $text .= "tidak dapat dikembalikan\n";
        $text .= "\n";
        $text .= $penjualan->nomor_invoice . "\n";
        $text .= "Powered by SISKA POS\n";
        $text .= "\n\n\n";
        $text .= $cut; // Cut paper
        
        return $text;
    }

    /**
     * Get daily sales summary for cashier
     */
    public function getDailySummary()
    {
        $user = Auth::user();
        $today = Carbon::today();

        $summary = [
            'tanggal' => $today->format('d/m/Y'),
            'kasir' => $user->name,
            'total_transaksi' => TtDataPenjualan::where('kasir_id', $user->id)
                ->whereDate('tanggal_penjualan', $today)
                ->selesai()
                ->count(),
            'total_penjualan' => TtDataPenjualan::where('kasir_id', $user->id)
                ->whereDate('tanggal_penjualan', $today)
                ->selesai()
                ->sum('total_bayar'),
            'metode_pembayaran' => TtDataPenjualan::where('kasir_id', $user->id)
                ->whereDate('tanggal_penjualan', $today)
                ->selesai()
                ->selectRaw('metode_pembayaran, COUNT(*) as jumlah, SUM(total_bayar) as total')
                ->groupBy('metode_pembayaran')
                ->get()
                ->map(function ($item) {
                    return [
                        'metode' => $item->metode_pembayaran,
                        'jumlah' => $item->jumlah,
                        'total' => $item->total,
                        'total_format' => 'Rp ' . number_format($item->total, 0, ',', '.'),
                    ];
                }),
        ];

        $summary['total_penjualan_format'] = 'Rp ' . number_format($summary['total_penjualan'], 0, ',', '.');

        return response()->json([
            'success' => true,
            'data' => $summary
        ]);
    }

    /**
     * Search products for POS
     */
    public function searchProducts(Request $request)
    {
        $search = $request->get('q', '');
        
        $products = TmDataProduk::with('kategori')
            ->aktif()
            ->where('stok_tersedia', '>', 0)
            ->where(function ($query) use ($search) {
                $query->where('nama_produk', 'like', "%{$search}%")
                      ->orWhere('kode_produk', 'like', "%{$search}%");
            })
            ->limit(20)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'kode' => $product->kode_produk,
                    'nama' => $product->nama_produk,
                    'harga' => $product->harga_jual,
                    'harga_format' => 'Rp ' . number_format($product->harga_jual, 0, ',', '.'),
                    'stok' => $product->stok_tersedia,
                    'kategori' => $product->kategori ? $product->kategori->nama_kategori : 'Tanpa Kategori',
                ];
            });

        return response()->json($products);
    }

    /**
     * Get recent transactions
     */
    public function getRecentTransactions()
    {
        $user = Auth::user();
        $userRole = $user->roles->first()->name ?? 'kasir';

        $query = TtDataPenjualan::with(['pelanggan', 'kasir'])
            ->selesai()
            ->latest();

        // If kasir, only show their own transactions
        if ($userRole === 'kasir') {
            $query->where('kasir_id', $user->id);
        }

        $transactions = $query->limit(10)->get()->map(function ($penjualan) {
            return [
                'id' => $penjualan->id,
                'nomor_invoice' => $penjualan->nomor_invoice,
                'tanggal' => $penjualan->tanggal_penjualan->format('d/m/Y H:i'),
                'pelanggan' => $penjualan->pelanggan ? $penjualan->pelanggan->nama_pelanggan : 'Umum',
                'kasir' => $penjualan->kasir->name,
                'total_bayar' => $penjualan->total_bayar,
                'total_bayar_format' => 'Rp ' . number_format($penjualan->total_bayar, 0, ',', '.'),
                'metode_pembayaran' => $penjualan->metode_pembayaran,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Void/Cancel transaction (Admin only)
     */
    public function voidTransaction($id)
    {
        $user = Auth::user();
        $userRole = $user->roles->first()->name ?? 'kasir';

        if ($userRole !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya admin yang dapat membatalkan transaksi'
            ], 403);
        }

        DB::beginTransaction();
        
        try {
            $penjualan = TtDataPenjualan::with('detailPenjualan.produk')->findOrFail($id);
            
            if ($penjualan->status_transaksi !== 'selesai') {
                throw new \Exception('Transaksi sudah dibatalkan atau belum selesai');
            }

            // Restore stock for each item
            foreach ($penjualan->detailPenjualan as $detail) {
                $product = $detail->produk;
                $stokSebelum = $product->stok_tersedia;
                $stokSesudah = $stokSebelum + $detail->jumlah_beli;
                
                $product->update([
                    'stok_tersedia' => $stokSesudah
                ]);

                // Create stock transaction record
                TtDataStok::create([
                    'produk_id' => $detail->produk_id,
                    'jenis_transaksi' => 'masuk',
                    'jumlah_stok' => $detail->jumlah_beli,
                    'stok_sebelum' => $stokSebelum,
                    'stok_sesudah' => $stokSesudah,
                    'referensi_transaksi' => $penjualan->nomor_invoice,
                    'keterangan' => 'Void Transaksi - ' . $penjualan->nomor_invoice,
                    'tanggal_transaksi' => now(),
                    'user_id' => Auth::id(),
                ]);
            }

            // Update transaction status
            $penjualan->update([
                'status_transaksi' => 'batal'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan dan stok dikembalikan'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}

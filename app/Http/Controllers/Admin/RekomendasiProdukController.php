<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TtRekomendasiProduk;
use App\Models\TtAnalisisApriori;
use App\Models\TmDataProduk;
use App\Models\TtDataPenjualan;
use App\Models\TtDetailPenjualan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RekomendasiProdukController extends Controller
{
    /**
     * Display rekomendasi produk dashboard
     */
    public function index(Request $request)
    {
        $search = $request->search;
        $kategoriId = $request->kategori_id;
        $statusAktif = $request->status_aktif;
        
        // Get rekomendasi with filters
        $query = TtRekomendasiProduk::with(['produkUtama.kategori', 'produkRekomendasi.kategori']);
        
        if ($search) {
            $query->whereHas('produkUtama', function ($q) use ($search) {
                $q->where('nama_produk', 'like', "%{$search}%")
                  ->orWhere('kode_produk', 'like', "%{$search}%");
            })->orWhereHas('produkRekomendasi', function ($q) use ($search) {
                $q->where('nama_produk', 'like', "%{$search}%")
                  ->orWhere('kode_produk', 'like', "%{$search}%");
            });
        }
        
        if ($kategoriId) {
            $query->whereHas('produkUtama', function ($q) use ($kategoriId) {
                $q->where('kategori_id', $kategoriId);
            });
        }
        
        if ($statusAktif !== null) {
            $query->where('status_aktif', $statusAktif);
        }
        
        $rekomendasi = $query->orderBy('skor_rekomendasi', 'desc')
            ->paginate(15)
            ->withQueryString();
        
        // Get statistics
        $statistics = $this->getRekomendasiStatistics();
        
        // Get top recommendations
        $topRekomendasi = $this->getTopRekomendasi(10);
        
        // Get categories for filter
        $categories = $this->getCategories();
        
        // Get recent analysis
        $recentAnalysis = $this->getRecentAnalysis(5);
        
        return Inertia::render('Admin/RekomendasiProduk/Index', [
            'rekomendasi' => $rekomendasi,
            'statistics' => $statistics,
            'topRekomendasi' => $topRekomendasi,
            'categories' => $categories,
            'recentAnalysis' => $recentAnalysis,
            'filters' => [
                'search' => $search,
                'kategori_id' => $kategoriId,
                'status_aktif' => $statusAktif,
            ],
        ]);
    }

    /**
     * Show detailed product recommendations
     */
    public function show($id)
    {
        $produk = TmDataProduk::with(['kategori', 'detailPenjualan.penjualan'])
            ->findOrFail($id);
        
        // Get rekomendasi untuk produk ini
        $rekomendasi = TtRekomendasiProduk::where('produk_utama_id', $id)
            ->with(['produkRekomendasi.kategori'])
            ->orderBy('skor_rekomendasi', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'produk_rekomendasi' => [
                        'id' => $item->produkRekomendasi->id,
                        'kode' => $item->produkRekomendasi->kode_produk,
                        'nama' => $item->produkRekomendasi->nama_produk,
                        'kategori' => $item->produkRekomendasi->kategori->nama_kategori ?? 'Tanpa Kategori',
                        'harga_jual' => $item->produkRekomendasi->harga_jual,
                        'harga_jual_format' => 'Rp ' . number_format($item->produkRekomendasi->harga_jual, 0, ',', '.'),
                        'stok_tersedia' => $item->produkRekomendasi->stok_tersedia,
                    ],
                    'skor_rekomendasi' => $item->skor_rekomendasi,
                    'skor_rekomendasi_percent' => round($item->skor_rekomendasi * 100, 2),
                    'frekuensi_bersamaan' => $item->frekuensi_bersamaan,
                    'tanggal_analisis' => $item->tanggal_analisis->format('d/m/Y'),
                    'status_aktif' => $item->status_aktif,
                    'keterangan' => $item->keterangan,
                    'confidence_level' => $this->getConfidenceLevel($item->skor_rekomendasi),
                ];
            });
        
        // Get sales analysis for this product
        $salesAnalysis = $this->getProductSalesAnalysis($id);
        
        // Get frequently bought together
        $frequentlyTogether = $this->getFrequentlyBoughtTogether($id);
        
        // Get association rules
        $associationRules = $this->getAssociationRules($id);
        
        return Inertia::render('Admin/RekomendasiProduk/Show', [
            'produk' => [
                'id' => $produk->id,
                'kode' => $produk->kode_produk,
                'nama' => $produk->nama_produk,
                'kategori' => $produk->kategori->nama_kategori ?? 'Tanpa Kategori',
                'harga_jual' => $produk->harga_jual,
                'harga_jual_format' => 'Rp ' . number_format($produk->harga_jual, 0, ',', '.'),
                'stok_tersedia' => $produk->stok_tersedia,
                'deskripsi_produk' => $produk->deskripsi_produk,
            ],
            'rekomendasi' => $rekomendasi,
            'salesAnalysis' => $salesAnalysis,
            'frequentlyTogether' => $frequentlyTogether,
            'associationRules' => $associationRules,
        ]);
    }

    /**
     * Generate new recommendations with enhanced validation and messaging
     */
    public function generateRekomendasi(Request $request)
    {
        Log::info('=== GENERATE REKOMENDASI START ===', $request->all());
        
        $request->validate([
            'periode_awal' => 'required|date',
            'periode_akhir' => 'required|date|after_or_equal:periode_awal',
            'min_support' => 'required|numeric|min:0.01|max:1',
            'min_confidence' => 'required|numeric|min:0.01|max:1',
            'kategori_id' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();
            
            $periodeAwal = Carbon::parse($request->periode_awal);
            $periodeAkhir = Carbon::parse($request->periode_akhir);
            $minSupport = $request->min_support;
            $minConfidence = $request->min_confidence;
            $kategoriId = $request->kategori_id === 'all' ? null : $request->kategori_id;
            
            Log::info('Parameters parsed', [
                'periode_awal' => $periodeAwal->format('Y-m-d'),
                'periode_akhir' => $periodeAkhir->format('Y-m-d'),
                'min_support' => $minSupport,
                'min_confidence' => $minConfidence,
                'kategori_id' => $kategoriId
            ]);
            
            // Pre-validation: Check if there are any transactions in the period
            $rawTransactionCount = TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $periodeAwal->startOfDay(),
                $periodeAkhir->endOfDay()
            ])->count();
            
            $completedTransactionCount = TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $periodeAwal->startOfDay(),
                $periodeAkhir->endOfDay()
            ])->where('status_transaksi', 'selesai')->count();
            
            Log::info('Transaction pre-check', [
                'raw_transactions' => $rawTransactionCount,
                'completed_transactions' => $completedTransactionCount
            ]);
            
            // Check if no transactions at all
            if ($rawTransactionCount === 0) {
                DB::rollBack();
                return redirect()->back()->withErrors([
                    'error' => "❌ Tidak ada transaksi sama sekali dalam periode {$periodeAwal->format('d/m/Y')} - {$periodeAkhir->format('d/m/Y')}. Silakan pilih periode yang berbeda atau buat transaksi terlebih dahulu."
                ]);
            }
            
            // Check if no completed transactions
            if ($completedTransactionCount === 0) {
                DB::rollBack();
                return redirect()->back()->withErrors([
                    'error' => "❌ Tidak ada transaksi dengan status 'selesai' dalam periode {$periodeAwal->format('d/m/Y')} - {$periodeAkhir->format('d/m/Y')}. Ditemukan {$rawTransactionCount} transaksi dengan status lain. Pastikan transaksi sudah diselesaikan."
                ]);
            }
            
            // Step 1: Get transaction data with detailed validation
            $transactions = $this->getTransactionData($periodeAwal, $periodeAkhir, $kategoriId);
            
            Log::info('Transactions processed', ['count' => $transactions->count()]);
            
            if ($transactions->isEmpty()) {
                // Get more specific error message
                $errorMessage = $this->getSpecificErrorMessage($periodeAwal, $periodeAkhir, $kategoriId, $completedTransactionCount);
                DB::rollBack();
                return redirect()->back()->withErrors(['error' => $errorMessage]);
            }
            
            // Check if transactions have enough items for analysis
            $validTransactionCount = $transactions->filter(function($t) {
                return count($t['items']) >= 2;
            })->count();
            
            if ($validTransactionCount === 0) {
                DB::rollBack();
                return redirect()->back()->withErrors([
                    'error' => "❌ Tidak ada transaksi dengan minimal 2 produk untuk analisis kombinasi. Algoritma Apriori membutuhkan transaksi yang berisi minimal 2 produk berbeda. Ditemukan {$transactions->count()} transaksi, tetapi semuanya hanya berisi 1 produk."
                ]);
            }
            
            // Calculate minimum required occurrences
            $minSupportCount = ceil($minSupport * $validTransactionCount);
            $recommendedSupport = max(0.01, 2 / $validTransactionCount); // At least 2 occurrences
            
            Log::info('Analysis parameters', [
                'valid_transactions' => $validTransactionCount,
                'min_support_count' => $minSupportCount,
                'recommended_support' => $recommendedSupport
            ]);
            
            // Warning if parameters might be too strict
            if ($minSupportCount > $validTransactionCount * 0.5) {
                return redirect()->back()->withErrors([
                    'warning' => "⚠️ Parameter minimum support ({$minSupport}) mungkin terlalu tinggi untuk {$validTransactionCount} transaksi. Disarankan menggunakan support ≤ " . round($recommendedSupport, 3) . " untuk mendapatkan hasil yang optimal."
                ]);
            }
            
            // Step 2: Run Apriori algorithm
            $aprioriResults = $this->runAprioriAlgorithm(
                $transactions, 
                $minSupport, 
                $minConfidence,
                $periodeAwal,
                $periodeAkhir
            );
            
            Log::info('Apriori algorithm completed', [
                'frequent_itemsets' => count($aprioriResults['frequent_itemsets']),
                'association_rules' => count($aprioriResults['association_rules'])
            ]);
            
            // Check if any rules were generated
            if (empty($aprioriResults['association_rules'])) {
                DB::rollBack();
                $suggestion = $this->getParameterSuggestion($validTransactionCount, $minSupport, $minConfidence);
                return redirect()->back()->withErrors([
                    'error' => "❌ Tidak ada association rules yang memenuhi kriteria (Min Support: {$minSupport}, Min Confidence: {$minConfidence}) dari {$validTransactionCount} transaksi valid. {$suggestion}"
                ]);
            }
            
            // Step 3: Generate recommendations
            $generatedCount = $this->generateRecommendations(
                $aprioriResults['association_rules'],
                $periodeAwal,
                $periodeAkhir
            );
            
            Log::info('Recommendations generated', ['count' => $generatedCount]);
            
            DB::commit();
            
            // Success message with details
            $successMessage = "✅ Berhasil generate {$generatedCount} rekomendasi produk! ";
            $successMessage .= "📊 Dianalisis dari {$validTransactionCount} transaksi valid ";
            $successMessage .= "dengan {" . count($aprioriResults['frequent_itemsets']) . "} frequent itemsets ";
            $successMessage .= "dan {" . count($aprioriResults['association_rules']) . "} association rules.";
            
            return redirect()->back()->with('success', $successMessage);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error generating recommendations', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->withErrors([
                'error' => "❌ Gagal generate rekomendasi: " . $e->getMessage() . " Silakan coba lagi atau hubungi administrator."
            ]);
        }
    }
    
    /**
     * Get specific error message based on the situation
     */
    private function getSpecificErrorMessage($periodeAwal, $periodeAkhir, $kategoriId, $completedTransactionCount)
    {
        $kategoriName = 'Semua Kategori';
        if ($kategoriId) {
            $kategori = \App\Models\TmDataKategori::find($kategoriId);
            $kategoriName = $kategori ? $kategori->nama_kategori : "Kategori ID: {$kategoriId}";
        }
        
        // Check transactions in category
        if ($kategoriId) {
            $categoryTransactionCount = TtDataPenjualan::whereBetween('tanggal_penjualan', [
                $periodeAwal->startOfDay(),
                $periodeAkhir->endOfDay()
            ])
            ->where('status_transaksi', 'selesai')
            ->whereHas('detailPenjualan.produk', function ($q) use ($kategoriId) {
                $q->where('kategori_id', $kategoriId);
            })
            ->count();
            
            if ($categoryTransactionCount === 0) {
                return "❌ Tidak ada transaksi untuk kategori '{$kategoriName}' dalam periode {$periodeAwal->format('d/m/Y')} - {$periodeAkhir->format('d/m/Y')}. Ditemukan {$completedTransactionCount} transaksi selesai untuk kategori lain. Coba pilih 'Semua Kategori' atau periode yang berbeda.";
            }
        }
        
        // Check multi-item transactions
        $multiItemTransactions = TtDataPenjualan::whereBetween('tanggal_penjualan', [
            $periodeAwal->startOfDay(),
            $periodeAkhir->endOfDay()
        ])
        ->where('status_transaksi', 'selesai')
        ->whereHas('detailPenjualan', function($q) {
            $q->select(DB::raw('data_penjualan_id'))
              ->groupBy('data_penjualan_id')
              ->havingRaw('COUNT(DISTINCT produk_id) >= 2');
        })
        ->count();
        
        if ($multiItemTransactions === 0) {
            return "❌ Tidak ada transaksi dengan minimal 2 produk berbeda dalam periode {$periodeAwal->format('d/m/Y')} - {$periodeAkhir->format('d/m/Y')} untuk kategori '{$kategoriName}'. Algoritma Apriori membutuhkan transaksi dengan kombinasi produk. Coba periode yang lebih panjang atau kategori yang berbeda.";
        }
        
        return "❌ Tidak ada data transaksi yang valid untuk analisis dalam periode dan kategori yang dipilih. Silakan coba parameter yang berbeda.";
    }
    
    /**
     * Get parameter suggestion based on data
     */
    private function getParameterSuggestion($validTransactionCount, $currentSupport, $currentConfidence)
    {
        $recommendedSupport = max(0.01, 2 / $validTransactionCount);
        $recommendedConfidence = max(0.1, 0.3);
        
        $suggestions = [];
        
        if ($currentSupport > $recommendedSupport) {
            $suggestions[] = "Turunkan Min Support ke " . round($recommendedSupport, 3);
        }
        
        if ($currentConfidence > 0.5) {
            $suggestions[] = "Turunkan Min Confidence ke {$recommendedConfidence}";
        }
        
        if (!empty($suggestions)) {
            return "💡 Saran: " . implode(" dan ", $suggestions) . " untuk hasil yang lebih optimal.";
        }
        
        return "💡 Coba perluas periode analisis atau gunakan parameter yang lebih rendah.";
    }
    
    /**
     * Show Apriori analysis dashboard
     */
    public function aprioriAnalysis(Request $request)
    {
        $periodeAwal = $request->periode_awal ?? Carbon::now()->subDays(30)->format('Y-m-d');
        $periodeAkhir = $request->periode_akhir ?? Carbon::now()->format('Y-m-d');
        $jenisAnalisis = $request->jenis_analisis ?? 'association_rule';
        
        // Get Apriori analysis results
        $query = TtAnalisisApriori::whereBetween('periode_awal', [$periodeAwal, $periodeAkhir]);
        
        if ($jenisAnalisis) {
            $query->where('jenis_analisis', $jenisAnalisis);
        }
        
        $analysisResults = $query->orderBy('tanggal_analisis', 'desc')
            ->orderBy('nilai_confidence', 'desc')
            ->paginate(20)
            ->withQueryString();
        
        // Transform data for frontend
        $analysisResults->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'kumpulan_item' => $item->kumpulan_item,
                'nama_produk' => $item->nama_produk,
                'nilai_support' => $item->nilai_support,
                'nilai_support_percent' => round($item->nilai_support * 100, 2),
                'nilai_confidence' => $item->nilai_confidence,
                'nilai_confidence_percent' => round($item->nilai_confidence * 100, 2),
                'nilai_lift' => $item->nilai_lift,
                'jumlah_transaksi' => $item->jumlah_transaksi,
                'total_transaksi_periode' => $item->total_transaksi_periode,
                'tanggal_analisis' => $item->tanggal_analisis->format('d/m/Y'),
                'periode_awal' => $item->periode_awal->format('d/m/Y'),
                'periode_akhir' => $item->periode_akhir->format('d/m/Y'),
                'jenis_analisis' => $item->jenis_analisis,
                'deskripsi_hasil' => $item->deskripsi_hasil,
                'strength_level' => $this->getStrengthLevel($item->nilai_confidence, $item->nilai_lift),
            ];
        });
        
        // Get analysis statistics
        $analysisStats = $this->getAnalysisStatistics($periodeAwal, $periodeAkhir);
        
        // Get frequent itemsets
        $frequentItemsets = $this->getFrequentItemsets($periodeAwal, $periodeAkhir, 10);
        
        // Get strong association rules
        $strongRules = $this->getStrongAssociationRules($periodeAwal, $periodeAkhir, 10);
        
        return Inertia::render('Admin/RekomendasiProduk/AprioriAnalysis', [
            'analysisResults' => $analysisResults,
            'analysisStats' => $analysisStats,
            'frequentItemsets' => $frequentItemsets,
            'strongRules' => $strongRules,
            'filters' => [
                'periode_awal' => $periodeAwal,
                'periode_akhir' => $periodeAkhir,
                'jenis_analisis' => $jenisAnalisis,
            ],
        ]);
    }

    /**
     * Update recommendation status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_aktif' => 'required|boolean',
            'keterangan' => 'nullable|string|max:255',
        ]);

        $rekomendasi = TtRekomendasiProduk::findOrFail($id);
        $rekomendasi->update([
            'status_aktif' => $request->status_aktif,
            'keterangan' => $request->keterangan,
        ]);

        return back()->with('success', 'Status rekomendasi berhasil diupdate.');
    }

    /**
     * Delete recommendation
     */
    public function destroy($id)
    {
        $rekomendasi = TtRekomendasiProduk::findOrFail($id);
        $rekomendasi->delete();

        return back()->with('success', 'Rekomendasi berhasil dihapus.');
    }

    /**
     * Get transaction data for Apriori analysis
     */
    private function getTransactionData($periodeAwal, $periodeAkhir, $kategoriId = null)
    {
        Log::info('Getting transaction data', [
            'periode_awal' => $periodeAwal->format('Y-m-d'),
            'periode_akhir' => $periodeAkhir->format('Y-m-d'),
            'kategori_id' => $kategoriId
        ]);

        $query = TtDataPenjualan::with(['detailPenjualan.produk.kategori'])
            ->whereBetween('tanggal_penjualan', [
                $periodeAwal->startOfDay(),
                $periodeAkhir->endOfDay()
            ])
            ->where('status_transaksi', 'selesai');

        if ($kategoriId) {
            $query->whereHas('detailPenjualan.produk', function ($q) use ($kategoriId) {
                $q->where('kategori_id', $kategoriId);
            });
        }

        $transactions = $query->get();
        
        Log::info('Raw transactions found', ['count' => $transactions->count()]);

        $processedTransactions = $transactions->map(function ($transaction) {
            $items = $transaction->detailPenjualan->pluck('produk_id')->unique()->values()->toArray();
            return [
                'transaction_id' => $transaction->id,
                'items' => $items,
                'tanggal' => $transaction->tanggal_penjualan,
                'item_count' => count($items),
            ];
        })->filter(function ($transaction) {
            return count($transaction['items']) >= 2; // Only transactions with 2+ items
        });

        Log::info('Processed transactions', [
            'total_transactions' => $processedTransactions->count(),
            'sample_transaction' => $processedTransactions->first()
        ]);

        return $processedTransactions;
    }

    /**
     * Run Apriori algorithm - FIXED VERSION
     */
    private function runAprioriAlgorithm($transactions, $minSupport, $minConfidence, $periodeAwal, $periodeAkhir)
    {
        $totalTransactions = $transactions->count();
        Log::info('Starting Apriori algorithm', [
            'total_transactions' => $totalTransactions,
            'min_support' => $minSupport,
            'min_confidence' => $minConfidence
        ]);
        
        if ($totalTransactions == 0) {
            return [
                'frequent_itemsets' => [],
                'association_rules' => [],
            ];
        }
        
        $frequentItemsets = [];
        $associationRules = [];
        
        // Step 1: Find frequent 1-itemsets
        $itemCounts = [];
        foreach ($transactions as $transaction) {
            foreach ($transaction['items'] as $item) {
                $itemCounts[$item] = ($itemCounts[$item] ?? 0) + 1;
            }
        }
        
        Log::info('Item counts calculated', ['unique_items' => count($itemCounts)]);
        
        $frequent1Itemsets = [];
        $minSupportCount = ceil($minSupport * $totalTransactions);
        
        foreach ($itemCounts as $item => $count) {
            $support = $count / $totalTransactions;
            if ($count >= $minSupportCount) {
                $frequent1Itemsets[] = [$item];
                $frequentItemsets[] = [
                    'itemset' => [$item],
                    'support' => $support,
                    'count' => $count,
                ];
                
                // Get product name safely
                $produk = TmDataProduk::find($item);
                $namaProduk = $produk ? $produk->nama_produk : "Produk ID: {$item}";
                
                // Save to database with proper escaping
                try {
                    TtAnalisisApriori::create([
                        'kumpulan_item' => [$item], // Let Laravel handle JSON encoding
                        'nama_produk' => $namaProduk,
                        'nilai_support' => $support,
                        'nilai_confidence' => null,
                        'nilai_lift' => null,
                        'jumlah_transaksi' => $count,
                        'total_transaksi_periode' => $totalTransactions,
                        'tanggal_analisis' => now(),
                        'periode_awal' => $periodeAwal->format('Y-m-d'),
                        'periode_akhir' => $periodeAkhir->format('Y-m-d'),
                        'jenis_analisis' => 'frequent_itemset',
                        'deskripsi_hasil' => "Frequent 1-itemset: {$namaProduk} dengan support " . round($support * 100, 2) . "%",
                    ]);
                    
                    Log::info('Frequent 1-itemset saved', [
                        'item' => $item,
                        'nama_produk' => $namaProduk,
                        'support' => $support
                    ]);
                    
                } catch (\Exception $e) {
                    Log::error('Error saving frequent 1-itemset', [
                        'item' => $item,
                        'nama_produk' => $namaProduk,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }
        
        Log::info('Frequent 1-itemsets found', ['count' => count($frequent1Itemsets)]);
        
        // Step 2: Find frequent 2-itemsets and generate association rules
        $frequent2Itemsets = [];
        foreach ($frequent1Itemsets as $i => $itemset1) {
            foreach ($frequent1Itemsets as $j => $itemset2) {
                if ($i >= $j) continue;
                
                $candidateItemset = array_merge($itemset1, $itemset2);
                sort($candidateItemset);
                
                $count = 0;
                foreach ($transactions as $transaction) {
                    if (count(array_intersect($candidateItemset, $transaction['items'])) == count($candidateItemset)) {
                        $count++;
                    }
                }
                
                $support = $count / $totalTransactions;
                if ($count >= $minSupportCount) {
                    $frequent2Itemsets[] = $candidateItemset;
                    $frequentItemsets[] = [
                        'itemset' => $candidateItemset,
                        'support' => $support,
                        'count' => $count,
                    ];
                    
                    // Get product names safely
                    $produk1 = TmDataProduk::find($candidateItemset[0]);
                    $produk2 = TmDataProduk::find($candidateItemset[1]);
                    $nama1 = $produk1 ? $produk1->nama_produk : "Produk ID: {$candidateItemset[0]}";
                    $nama2 = $produk2 ? $produk2->nama_produk : "Produk ID: {$candidateItemset[1]}";
                    $namaCombined = "{$nama1} + {$nama2}";
                    
                    // Save to database safely
                    try {
                        TtAnalisisApriori::create([
                            'kumpulan_item' => $candidateItemset, // Let Laravel handle JSON encoding
                            'nama_produk' => $namaCombined,
                            'nilai_support' => $support,
                            'nilai_confidence' => null,
                            'nilai_lift' => null,
                            'jumlah_transaksi' => $count,
                            'total_transaksi_periode' => $totalTransactions,
                            'tanggal_analisis' => now(),
                            'periode_awal' => $periodeAwal->format('Y-m-d'),
                            'periode_akhir' => $periodeAkhir->format('Y-m-d'),
                            'jenis_analisis' => 'frequent_itemset',
                            'deskripsi_hasil' => "Frequent 2-itemset: {$namaCombined} dengan support " . round($support * 100, 2) . "%",
                        ]);
                        
                        Log::info('Frequent 2-itemset saved', [
                            'itemset' => $candidateItemset,
                            'nama_produk' => $namaCombined,
                            'support' => $support
                        ]);
                        
                    } catch (\Exception $e) {
                        Log::error('Error saving frequent 2-itemset', [
                            'itemset' => $candidateItemset,
                            'nama_produk' => $namaCombined,
                            'error' => $e->getMessage()
                        ]);
                    }
                    
                    // Generate association rules for this 2-itemset
                    $this->generateRulesFor2Itemset(
                        $candidateItemset, 
                        $count, 
                        $totalTransactions, 
                        $itemCounts, 
                        $minConfidence,
                        $periodeAwal,
                        $periodeAkhir,
                        $associationRules
                    );
                }
            }
        }
        
        Log::info('Frequent 2-itemsets found', ['count' => count($frequent2Itemsets)]);
        Log::info('Association rules generated', ['count' => count($associationRules)]);
        
        return [
            'frequent_itemsets' => $frequentItemsets,
            'association_rules' => $associationRules,
        ];
    }

    /**
     * Generate association rules for 2-itemset
     */
    private function generateRulesFor2Itemset($itemset, $itemsetCount, $totalTransactions, $itemCounts, $minConfidence, $periodeAwal, $periodeAkhir, &$associationRules)
    {
        if (count($itemset) != 2) return;
        
        $item1 = $itemset[0];
        $item2 = $itemset[1];
        
        // Get product names safely
        $produk1 = TmDataProduk::find($item1);
        $produk2 = TmDataProduk::find($item2);
        $nama1 = $produk1 ? $produk1->nama_produk : "Produk ID: {$item1}";
        $nama2 = $produk2 ? $produk2->nama_produk : "Produk ID: {$item2}";
        
        // Rule: item1 -> item2
        $antecedentCount1 = $itemCounts[$item1];
        $confidence1 = $itemsetCount / $antecedentCount1;
        $support = $itemsetCount / $totalTransactions;
        $consequentSupport1 = $itemCounts[$item2] / $totalTransactions;
        $lift1 = $confidence1 / $consequentSupport1;
        
        if ($confidence1 >= $minConfidence) {
            $associationRules[] = [
                'antecedent' => [$item1],
                'consequent' => [$item2],
                'support' => $support,
                'confidence' => $confidence1,
                'lift' => $lift1,
                'count' => $itemsetCount,
            ];
            
            // Save to database safely
            try {
                TtAnalisisApriori::create([
                    'kumpulan_item' => $itemset, // Let Laravel handle JSON encoding
                    'nama_produk' => "{$nama1} → {$nama2}",
                    'nilai_support' => $support,
                    'nilai_confidence' => $confidence1,
                    'nilai_lift' => $lift1,
                    'jumlah_transaksi' => $itemsetCount,
                    'total_transaksi_periode' => $totalTransactions,
                    'tanggal_analisis' => now(),
                    'periode_awal' => $periodeAwal->format('Y-m-d'),
                    'periode_akhir' => $periodeAkhir->format('Y-m-d'),
                    'jenis_analisis' => 'association_rule',
                    'deskripsi_hasil' => "Association rule: {$nama1} → {$nama2} (Confidence: " . round($confidence1 * 100, 2) . "%, Lift: " . round($lift1, 2) . ")",
                ]);
            } catch (\Exception $e) {
                Log::error('Error saving association rule', [
                    'rule' => "{$nama1} → {$nama2}",
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        // Rule: item2 -> item1
        $antecedentCount2 = $itemCounts[$item2];
        $confidence2 = $itemsetCount / $antecedentCount2;
        $consequentSupport2 = $itemCounts[$item1] / $totalTransactions;
        $lift2 = $confidence2 / $consequentSupport2;
        
        if ($confidence2 >= $minConfidence) {
            $associationRules[] = [
                'antecedent' => [$item2],
                'consequent' => [$item1],
                'support' => $support,
                'confidence' => $confidence2,
                'lift' => $lift2,
                'count' => $itemsetCount,
            ];
            
            // Save to database safely
            try {
                TtAnalisisApriori::create([
                    'kumpulan_item' => array_reverse($itemset), // Let Laravel handle JSON encoding
                    'nama_produk' => "{$nama2} → {$nama1}",
                    'nilai_support' => $support,
                    'nilai_confidence' => $confidence2,
                    'nilai_lift' => $lift2,
                    'jumlah_transaksi' => $itemsetCount,
                    'total_transaksi_periode' => $totalTransactions,
                    'tanggal_analisis' => now(),
                    'periode_awal' => $periodeAwal->format('Y-m-d'),
                    'periode_akhir' => $periodeAkhir->format('Y-m-d'),
                    'jenis_analisis' => 'association_rule',
                    'deskripsi_hasil' => "Association rule: {$nama2} → {$nama1} (Confidence: " . round($confidence2 * 100, 2) . "%, Lift: " . round($lift2, 2) . ")",
                ]);
            } catch (\Exception $e) {
                Log::error('Error saving association rule', [
                    'rule' => "{$nama2} → {$nama1}",
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Generate recommendations from association rules - IMPROVED VERSION
     */
    private function generateRecommendations($associationRules, $periodeAwal, $periodeAkhir)
    {
        $generatedCount = 0;
        
        Log::info('Generating recommendations from rules', ['rule_count' => count($associationRules)]);
        
        foreach ($associationRules as $rule) {
            if (count($rule['antecedent']) == 1 && count($rule['consequent']) == 1) {
                $produkUtamaId = $rule['antecedent'][0];
                $produkRekomendasiId = $rule['consequent'][0];
                
                // Validate products exist
                $produkUtama = TmDataProduk::find($produkUtamaId);
                $produkRekomendasi = TmDataProduk::find($produkRekomendasiId);
                
                if (!$produkUtama || !$produkRekomendasi) {
                    Log::warning('Product not found', [
                        'produk_utama_id' => $produkUtamaId,
                        'produk_rekomendasi_id' => $produkRekomendasiId
                    ]);
                    continue;
                }
                
                // Check if recommendation already exists
                $existing = TtRekomendasiProduk::where('produk_utama_id', $produkUtamaId)
                    ->where('produk_rekomendasi_id', $produkRekomendasiId)
                    ->first();
                
                if (!$existing) {
                    TtRekomendasiProduk::create([
                        'produk_utama_id' => $produkUtamaId,
                        'produk_rekomendasi_id' => $produkRekomendasiId,
                        'skor_rekomendasi' => $rule['confidence'],
                        'frekuensi_bersamaan' => $rule['count'],
                        'tanggal_analisis' => now(),
                        'status_aktif' => true,
                        'keterangan' => "Generated by Apriori algorithm - Support: " . round($rule['support'] * 100, 2) . "%, Confidence: " . round($rule['confidence'] * 100, 2) . "%, Lift: " . round($rule['lift'], 2),
                    ]);
                    
                    $generatedCount++;
                    Log::info('New recommendation created', [
                        'produk_utama' => $produkUtama->nama_produk,
                        'produk_rekomendasi' => $produkRekomendasi->nama_produk,
                        'confidence' => $rule['confidence']
                    ]);
                } else {
                    // Update existing recommendation if new score is better
                    if ($rule['confidence'] > $existing->skor_rekomendasi) {
                        $existing->update([
                            'skor_rekomendasi' => $rule['confidence'],
                            'frekuensi_bersamaan' => $rule['count'],
                            'tanggal_analisis' => now(),
                            'keterangan' => "Updated by Apriori algorithm - Support: " . round($rule['support'] * 100, 2) . "%, Confidence: " . round($rule['confidence'] * 100, 2) . "%, Lift: " . round($rule['lift'], 2),
                        ]);
                        
                        Log::info('Recommendation updated', [
                            'produk_utama' => $produkUtama->nama_produk,
                            'produk_rekomendasi' => $produkRekomendasi->nama_produk,
                            'old_confidence' => $existing->skor_rekomendasi,
                            'new_confidence' => $rule['confidence']
                        ]);
                    }
                }
            }
        }
        
        Log::info('Recommendation generation completed', ['generated_count' => $generatedCount]);
        
        return $generatedCount;
    }

    /**
     * Get helper methods for statistics and data
     */
    private function getRekomendasiStatistics()
    {
        $total = TtRekomendasiProduk::count();
        $aktif = TtRekomendasiProduk::where('status_aktif', true)->count();
        $avgScore = TtRekomendasiProduk::avg('skor_rekomendasi');
        $recentAnalysis = TtRekomendasiProduk::where('tanggal_analisis', '>=', Carbon::now()->subDays(7))->count();
        
        return [
            'total_rekomendasi' => $total,
            'rekomendasi_aktif' => $aktif,
            'rekomendasi_nonaktif' => $total - $aktif,
            'rata_rata_skor' => round($avgScore, 4),
            'rata_rata_skor_percent' => round($avgScore * 100, 2),
            'analisis_recent' => $recentAnalysis,
        ];
    }

    private function getTopRekomendasi($limit)
    {
        return TtRekomendasiProduk::with(['produkUtama', 'produkRekomendasi'])
            ->where('status_aktif', true)
            ->orderBy('skor_rekomendasi', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item, $index) {
                return [
                    'rank' => $index + 1,
                    'produk_utama' => $item->produkUtama->nama_produk,
                    'produk_rekomendasi' => $item->produkRekomendasi->nama_produk,
                    'skor_rekomendasi' => $item->skor_rekomendasi,
                    'skor_rekomendasi_percent' => round($item->skor_rekomendasi * 100, 2),
                    'frekuensi_bersamaan' => $item->frekuensi_bersamaan,
                ];
            });
    }

    private function getCategories()
    {
        return \App\Models\TmDataKategori::aktif()
            ->select('id', 'nama_kategori')
            ->orderBy('nama_kategori')
            ->get();
    }

    private function getRecentAnalysis($limit)
    {
        return TtAnalisisApriori::orderBy('tanggal_analisis', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'jenis_analisis' => $item->jenis_analisis,
                    'tanggal_analisis' => $item->tanggal_analisis->format('d/m/Y H:i'),
                    'periode' => $item->periode_awal->format('d/m/Y') . ' - ' . $item->periode_akhir->format('d/m/Y'),
                    'total_transaksi' => $item->total_transaksi_periode,
                ];
            });
    }

    private function getConfidenceLevel($skor)
    {
        if ($skor >= 0.8) return 'Very High';
        if ($skor >= 0.6) return 'High';
        if ($skor >= 0.4) return 'Medium';
        if ($skor >= 0.2) return 'Low';
        return 'Very Low';
    }

    private function getStrengthLevel($confidence, $lift)
    {
        if ($confidence >= 0.8 && $lift >= 2) return 'Very Strong';
        if ($confidence >= 0.6 && $lift >= 1.5) return 'Strong';
        if ($confidence >= 0.4 && $lift >= 1.2) return 'Medium';
        if ($confidence >= 0.2 && $lift >= 1) return 'Weak';
        return 'Very Weak';
    }

    private function getProductSalesAnalysis($produkId)
    {
        $last30Days = TtDetailPenjualan::where('produk_id', $produkId)
            ->whereHas('penjualan', function ($q) {
                $q->where('tanggal_penjualan', '>=', Carbon::now()->subDays(30))
                  ->where('status_transaksi', 'selesai');
            })
            ->sum('jumlah_beli');

        $totalSales = TtDetailPenjualan::where('produk_id', $produkId)
            ->whereHas('penjualan', function ($q) {
                $q->where('status_transaksi', 'selesai');
            })
            ->sum('jumlah_beli');

        return [
            'penjualan_30_hari' => $last30Days,
            'total_penjualan' => $totalSales,
            'rata_rata_harian' => round($last30Days / 30, 2),
        ];
    }

    private function getFrequentlyBoughtTogether($produkId)
    {
        return TtRekomendasiProduk::where('produk_utama_id', $produkId)
            ->with('produkRekomendasi')
            ->orderBy('frekuensi_bersamaan', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'nama_produk' => $item->produkRekomendasi->nama_produk,
                    'frekuensi' => $item->frekuensi_bersamaan,
                    'skor' => round($item->skor_rekomendasi * 100, 2),
                ];
            });
    }

    private function getAssociationRules($produkId)
    {
        return TtAnalisisApriori::where('kumpulan_item', 'like', "%{$produkId}%")
            ->where('jenis_analisis', 'association_rule')
            ->orderBy('nilai_confidence', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'kumpulan_item' => $item->nama_produk,
                    'support' => round($item->nilai_support * 100, 2),
                    'confidence' => round($item->nilai_confidence * 100, 2),
                    'lift' => round($item->nilai_lift, 2),
                    'strength' => $this->getStrengthLevel($item->nilai_confidence, $item->nilai_lift),
                ];
            });
    }

    private function getAnalysisStatistics($periodeAwal, $periodeAkhir)
    {
        $frequentItemsets = TtAnalisisApriori::whereBetween('periode_awal', [$periodeAwal, $periodeAkhir])
            ->where('jenis_analisis', 'frequent_itemset')
            ->count();

        $associationRules = TtAnalisisApriori::whereBetween('periode_awal', [$periodeAwal, $periodeAkhir])
            ->where('jenis_analisis', 'association_rule')
            ->count();

        $avgConfidence = TtAnalisisApriori::whereBetween('periode_awal', [$periodeAwal, $periodeAkhir])
            ->where('jenis_analisis', 'association_rule')
            ->avg('nilai_confidence');

        $avgLift = TtAnalisisApriori::whereBetween('periode_awal', [$periodeAwal, $periodeAkhir])
            ->where('jenis_analisis', 'association_rule')
            ->avg('nilai_lift');

        return [
            'frequent_itemsets' => $frequentItemsets,
            'association_rules' => $associationRules,
            'avg_confidence' => round($avgConfidence, 4),
            'avg_confidence_percent' => round($avgConfidence * 100, 2),
            'avg_lift' => round($avgLift, 2),
        ];
    }

    private function getFrequentItemsets($periodeAwal, $periodeAkhir, $limit)
    {
        return TtAnalisisApriori::whereBetween('periode_awal', [$periodeAwal, $periodeAkhir])
            ->where('jenis_analisis', 'frequent_itemset')
            ->orderBy('nilai_support', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'nama_produk' => $item->nama_produk,
                    'support' => round($item->nilai_support * 100, 2),
                    'count' => $item->jumlah_transaksi,
                ];
            });
    }

    private function getStrongAssociationRules($periodeAwal, $periodeAkhir, $limit)
    {
        return TtAnalisisApriori::whereBetween('periode_awal', [$periodeAwal, $periodeAkhir])
            ->where('jenis_analisis', 'association_rule')
            ->where('nilai_confidence', '>=', 0.5)
            ->orderBy('nilai_confidence', 'desc')
            ->orderBy('nilai_lift', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'nama_produk' => $item->nama_produk,
                    'confidence' => round($item->nilai_confidence * 100, 2),
                    'lift' => round($item->nilai_lift, 2),
                    'support' => round($item->nilai_support * 100, 2),
                    'strength' => $this->getStrengthLevel($item->nilai_confidence, $item->nilai_lift),
                ];
            });
    }
}
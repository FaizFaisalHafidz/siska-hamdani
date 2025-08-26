<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TmDataKategori;
use App\Models\TmDataProduk;
use App\Models\TtDataStok;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = TmDataProduk::with(['kategori'])
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_produk', 'like', "%{$search}%")
                           ->orWhere('kode_produk', 'like', "%{$search}%")
                           ->orWhere('merk_produk', 'like', "%{$search}%")
                           ->orWhereHas('kategori', function ($q) use ($search) {
                               $q->where('nama_kategori', 'like', "%{$search}%");
                           });
            })
            ->when($request->kategori, function ($query, $kategori) {
                return $query->where('kategori_id', $kategori);
            })
            ->when($request->status !== null, function ($query) use ($request) {
                return $query->where('status_aktif', $request->status);
            })
            ->when($request->stok_rendah, function ($query) {
                return $query->whereColumn('stok_tersedia', '<=', 'stok_minimum');
            })
            ->latest();

        $products = $query->paginate(15)->withQueryString();

        // Transform products data with proper null checks
        $products->getCollection()->transform(function ($product) {
            return [
                'id' => $product->id,
                'kode_produk' => $product->kode_produk,
                'nama_produk' => $product->nama_produk,
                'deskripsi_produk' => $product->deskripsi_produk,
                'kategori' => [
                    'id' => $product->kategori ? $product->kategori->id : null,
                    'nama' => $product->kategori ? $product->kategori->nama_kategori : 'Tanpa Kategori',
                ],
                'harga_jual' => $product->harga_jual,
                'harga_jual_format' => 'Rp ' . number_format($product->harga_jual ?? 0, 0, ',', '.'),
                'harga_beli' => $product->harga_beli,
                'harga_beli_format' => 'Rp ' . number_format($product->harga_beli ?? 0, 0, ',', '.'),
                'stok_tersedia' => $product->stok_tersedia ?? 0,
                'stok_minimum' => $product->stok_minimum ?? 0,
                'satuan' => $product->satuan,
                'merk_produk' => $product->merk_produk,
                'gambar_produk' => $product->gambar_produk ? Storage::url($product->gambar_produk) : null,
                'status_aktif' => $product->status_aktif,
                'tanggal_input' => $product->tanggal_input ? 
                    Carbon::parse($product->tanggal_input)->format('d/m/Y') : 
                    ($product->created_at ? $product->created_at->format('d/m/Y') : '-'),
                'created_at' => $product->created_at ? $product->created_at->format('d/m/Y H:i') : '-',
                'updated_at' => $product->updated_at ? $product->updated_at->format('d/m/Y H:i') : '-',
                'is_stok_rendah' => ($product->stok_tersedia ?? 0) <= ($product->stok_minimum ?? 0),
            ];
        });

        $kategoris = TmDataKategori::aktif()->get(['id', 'nama_kategori']);

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'kategoris' => $kategoris,
            'filters' => $request->only(['search', 'kategori', 'status', 'stok_rendah']),
            'statistics' => [
                'total_produk' => TmDataProduk::count(),
                'produk_aktif' => TmDataProduk::where('status_aktif', true)->count(),
                'stok_rendah' => TmDataProduk::whereColumn('stok_tersedia', '<=', 'stok_minimum')->count(),
                'total_kategori' => TmDataKategori::where('status_aktif', true)->count(),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $kategoris = TmDataKategori::where('status_aktif', true)->get(['id', 'nama_kategori']);
        
        return Inertia::render('Admin/Products/Create', [
            'kategoris' => $kategoris,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_produk' => 'required|string|max:200',
            'deskripsi_produk' => 'nullable|string',
            'kategori_id' => 'required|exists:tm_data_kategori,id',
            'harga_jual' => 'required|numeric|min:0',
            'harga_beli' => 'nullable|numeric|min:0',
            'stok_tersedia' => 'required|integer|min:0',
            'stok_minimum' => 'required|integer|min:1',
            'satuan' => 'required|string|max:20',
            'merk_produk' => 'nullable|string|max:100',
            'gambar_produk' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status_aktif' => 'boolean',
        ], [
            'nama_produk.required' => 'Nama produk harus diisi',
            'kategori_id.required' => 'Kategori harus dipilih',
            'kategori_id.exists' => 'Kategori tidak valid',
            'harga_jual.required' => 'Harga jual harus diisi',
            'harga_jual.numeric' => 'Harga jual harus berupa angka',
            'harga_jual.min' => 'Harga jual tidak boleh minus',
            'stok_tersedia.required' => 'Stok tersedia harus diisi',
            'stok_tersedia.integer' => 'Stok tersedia harus berupa angka',
            'stok_minimum.required' => 'Stok minimum harus diisi',
            'stok_minimum.min' => 'Stok minimum minimal 1',
            'satuan.required' => 'Satuan harus diisi',
            'gambar_produk.image' => 'File harus berupa gambar',
            'gambar_produk.max' => 'Ukuran gambar maksimal 2MB',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        DB::beginTransaction();
        try {
            // Generate kode produk
            $kodeProduk = $this->generateKodeProduk();

            // Handle file upload
            $gambarPath = null;
            if ($request->hasFile('gambar_produk')) {
                $gambarPath = $request->file('gambar_produk')->store('products', 'public');
            }

            $product = TmDataProduk::create([
                'kode_produk' => $kodeProduk,
                'nama_produk' => $request->nama_produk,
                'deskripsi_produk' => $request->deskripsi_produk,
                'kategori_id' => $request->kategori_id,
                'harga_jual' => $request->harga_jual,
                'harga_beli' => $request->harga_beli,
                'stok_tersedia' => $request->stok_tersedia,
                'stok_minimum' => $request->stok_minimum,
                'satuan' => $request->satuan,
                'merk_produk' => $request->merk_produk,
                'gambar_produk' => $gambarPath,
                'status_aktif' => $request->status_aktif ?? true,
                'tanggal_input' => Carbon::now(),
            ]);

            // Record stock movement
            if ($request->stok_tersedia > 0) {
                TtDataStok::create([
                    'produk_id' => $product->id,
                    'jenis_transaksi' => 'masuk',
                    'jumlah_stok' => $request->stok_tersedia,
                    'stok_sebelum' => 0,
                    'stok_sesudah' => $request->stok_tersedia,
                    'referensi_transaksi' => 'INITIAL_STOCK',
                    'keterangan' => 'Stok awal produk baru',
                    'tanggal_transaksi' => Carbon::now(),
                    'user_id' => Auth::id(),
                ]);
            }

            DB::commit();

            return redirect()
                ->route('admin.produk.index')
                ->with('success', 'Produk berhasil ditambahkan');

        } catch (\Exception $e) {
            DB::rollback();
            
            // Delete uploaded file if exists
            if ($gambarPath && Storage::disk('public')->exists($gambarPath)) {
                Storage::disk('public')->delete($gambarPath);
            }

            return back()
                ->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(TmDataProduk $produk)
    {
        $produk->load(['kategori']);
        
        // Get product statistics
        $totalTerjual = DB::table('tt_detail_penjualan')
            ->join('tt_data_penjualan', 'tt_detail_penjualan.penjualan_id', '=', 'tt_data_penjualan.id')
            ->where('tt_detail_penjualan.produk_id', $produk->id)
            ->where('tt_data_penjualan.status_transaksi', 'selesai')
            ->sum('tt_detail_penjualan.jumlah_beli');

        $pendapatan = DB::table('tt_detail_penjualan')
            ->join('tt_data_penjualan', 'tt_detail_penjualan.penjualan_id', '=', 'tt_data_penjualan.id')
            ->where('tt_detail_penjualan.produk_id', $produk->id)
            ->where('tt_data_penjualan.status_transaksi', 'selesai')
            ->sum('tt_detail_penjualan.subtotal');

        // Get stock history
        $stockHistory = TtDataStok::where('produk_id', $produk->id)
            ->with('user')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'jenis_transaksi' => $stock->jenis_transaksi,
                    'jumlah_stok' => $stock->jumlah_stok,
                    'stok_sebelum' => $stock->stok_sebelum,
                    'stok_sesudah' => $stock->stok_sesudah,
                    'referensi_transaksi' => $stock->referensi_transaksi,
                    'keterangan' => $stock->keterangan,
                    'tanggal_transaksi' => $stock->tanggal_transaksi ? 
                        Carbon::parse($stock->tanggal_transaksi)->format('d/m/Y H:i') : '-',
                    'user' => $stock->user ? $stock->user->name : 'System',
                ];
            });

        $productData = [
            'id' => $produk->id,
            'kode_produk' => $produk->kode_produk,
            'nama_produk' => $produk->nama_produk,
            'deskripsi_produk' => $produk->deskripsi_produk,
            'kategori' => [
                'id' => $produk->kategori ? $produk->kategori->id : null,
                'nama' => $produk->kategori ? $produk->kategori->nama_kategori : 'Tanpa Kategori',
            ],
            'harga_jual' => $produk->harga_jual,
            'harga_jual_format' => 'Rp ' . number_format($produk->harga_jual ?? 0, 0, ',', '.'),
            'harga_beli' => $produk->harga_beli,
            'harga_beli_format' => 'Rp ' . number_format($produk->harga_beli ?? 0, 0, ',', '.'),
            'stok_tersedia' => $produk->stok_tersedia ?? 0,
            'stok_minimum' => $produk->stok_minimum ?? 0,
            'satuan' => $produk->satuan,
            'merk_produk' => $produk->merk_produk,
            'gambar_produk' => $produk->gambar_produk ? Storage::url($produk->gambar_produk) : null,
            'status_aktif' => $produk->status_aktif,
            'tanggal_input' => $produk->tanggal_input ? 
                Carbon::parse($produk->tanggal_input)->format('d/m/Y') : 
                ($produk->created_at ? $produk->created_at->format('d/m/Y') : '-'),
            'created_at' => $produk->created_at ? $produk->created_at->format('d/m/Y H:i') : '-',
            'statistics' => [
                'total_terjual' => $totalTerjual ?? 0,
                'pendapatan' => 'Rp ' . number_format($pendapatan ?? 0, 0, ',', '.'),
                'margin' => $produk->harga_beli && $produk->harga_beli > 0 ? 
                    round((($produk->harga_jual - $produk->harga_beli) / $produk->harga_beli * 100), 2) : 0,
            ],
            'stock_history' => $stockHistory,
        ];

        return Inertia::render('Admin/Products/Show', [
            'product' => $productData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TmDataProduk $produk)
    {
        $produk->load('kategori');
        $kategoris = TmDataKategori::where('status_aktif', true)->get(['id', 'nama_kategori']);
        
        $productData = [
            'id' => $produk->id,
            'kode_produk' => $produk->kode_produk,
            'nama_produk' => $produk->nama_produk,
            'deskripsi_produk' => $produk->deskripsi_produk,
            'kategori_id' => $produk->kategori_id,
            'harga_jual' => $produk->harga_jual,
            'harga_beli' => $produk->harga_beli,
            'stok_tersedia' => $produk->stok_tersedia,
            'stok_minimum' => $produk->stok_minimum,
            'satuan' => $produk->satuan,
            'merk_produk' => $produk->merk_produk,
            'gambar_produk' => $produk->gambar_produk ? Storage::url($produk->gambar_produk) : null,
            'status_aktif' => $produk->status_aktif,
        ];

        return Inertia::render('Admin/Products/Edit', [
            'product' => $productData,
            'kategoris' => $kategoris,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TmDataProduk $produk)
    {
        // Debug: Log all incoming request data
        Log::info('Product Update Request Received', [
            'product_id' => $produk->id,
            'method' => $request->method(),
            'all_data' => $request->all(),
            'input_data' => $request->input(),
            'files' => $request->allFiles(),
            'content_type' => $request->header('Content-Type'),
            'has_json' => $request->isJson(),
        ]);

        // For update, make validation more flexible - only validate fields that are being updated
        $rules = [
            'nama_produk' => 'sometimes|required|string|max:200',
            'deskripsi_produk' => 'nullable|string',
            'kategori_id' => 'sometimes|required|exists:tm_data_kategori,id',
            'harga_jual' => 'sometimes|required|numeric|min:0',
            'harga_beli' => 'nullable|numeric|min:0',
            'stok_minimum' => 'sometimes|required|integer|min:1',
            'satuan' => 'sometimes|required|string|max:20',
            'merk_produk' => 'nullable|string|max:100',
            'gambar_produk' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status_aktif' => 'nullable|boolean',
        ];

        $messages = [
            'nama_produk.required' => 'Nama produk harus diisi',
            'kategori_id.required' => 'Kategori harus dipilih',
            'kategori_id.exists' => 'Kategori tidak valid',
            'harga_jual.required' => 'Harga jual harus diisi',
            'harga_jual.numeric' => 'Harga jual harus berupa angka',
            'harga_jual.min' => 'Harga jual tidak boleh minus',
            'stok_minimum.required' => 'Stok minimum harus diisi',
            'stok_minimum.min' => 'Stok minimum minimal 1',
            'satuan.required' => 'Satuan harus diisi',
            'gambar_produk.image' => 'File harus berupa gambar',
            'gambar_produk.max' => 'Ukuran gambar maksimal 2MB',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            Log::info('Product Update Validation Failed', [
                'product_id' => $produk->id,
                'errors' => $validator->errors()->toArray(),
                'input_data' => $request->all()
            ]);
            
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        Log::info('Product Update Started', [
            'product_id' => $produk->id,
            'input_data' => $request->all()
        ]);

        try {
            Log::info('Building update data array', [
                'product_id' => $produk->id,
                'request_data' => [
                    'nama_produk' => $request->nama_produk,
                    'kategori_id' => $request->kategori_id,
                    'harga_jual' => $request->harga_jual,
                    'status_aktif' => $request->status_aktif
                ]
            ]);

            $updateData = [
                'nama_produk' => $request->nama_produk,
                'deskripsi_produk' => $request->deskripsi_produk,
                'kategori_id' => $request->kategori_id,
                'harga_jual' => $request->harga_jual,
                'harga_beli' => $request->harga_beli,
                'stok_minimum' => $request->stok_minimum,
                'satuan' => $request->satuan,
                'merk_produk' => $request->merk_produk,
                'status_aktif' => $request->status_aktif ?? true,
            ];

            Log::info('Update data prepared', [
                'product_id' => $produk->id,
                'update_data' => $updateData
            ]);

            // Handle file upload
            if ($request->hasFile('gambar_produk')) {
                Log::info('Processing image upload', ['product_id' => $produk->id]);
                
                // Delete old image
                if ($produk->gambar_produk && Storage::disk('public')->exists($produk->gambar_produk)) {
                    Storage::disk('public')->delete($produk->gambar_produk);
                    Log::info('Old image deleted', ['old_image' => $produk->gambar_produk]);
                }
                
                $updateData['gambar_produk'] = $request->file('gambar_produk')->store('products', 'public');
                Log::info('New image uploaded', ['new_image' => $updateData['gambar_produk']]);
            }

            Log::info('Attempting to update product', [
                'product_id' => $produk->id,
                'final_update_data' => $updateData
            ]);

            $produk->update($updateData);

            Log::info('Product updated successfully', ['product_id' => $produk->id]);

            return redirect()
                ->route('admin.produk.index')
                ->with('success', 'Produk berhasil diperbarui');

        } catch (\Exception $e) {
            Log::error('Product Update Failed', [
                'product_id' => $produk->id,
                'error_message' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return back()
                ->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TmDataProduk $produk)
    {
        try {
            // Check if product has transactions
            $hasTransactions = DB::table('tt_detail_penjualan')
                ->where('produk_id', $produk->id)
                ->exists();

            if ($hasTransactions) {
                return back()->withErrors([
                    'error' => 'Produk tidak dapat dihapus karena memiliki data transaksi'
                ]);
            }

            // Delete image file
            if ($produk->gambar_produk && Storage::disk('public')->exists($produk->gambar_produk)) {
                Storage::disk('public')->delete($produk->gambar_produk);
            }

            $produk->delete();

            return redirect()
                ->route('admin.produk.index')
                ->with('success', 'Produk berhasil dihapus');

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Toggle product status
     */
    public function toggleStatus(TmDataProduk $produk)
    {
        try {
            $produk->update([
                'status_aktif' => !$produk->status_aktif
            ]);

            $status = $produk->status_aktif ? 'diaktifkan' : 'dinonaktifkan';

            return back()->with('success', "Produk berhasil {$status}");

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update stock
     */
    public function updateStock(Request $request, TmDataProduk $produk)
    {
        $validator = Validator::make($request->all(), [
            'jenis_transaksi' => 'required|in:masuk,keluar,penyesuaian',
            'jumlah_stok' => 'required|integer|min:1',
            'keterangan' => 'nullable|string|max:500',
        ], [
            'jenis_transaksi.required' => 'Jenis transaksi harus dipilih',
            'jumlah_stok.required' => 'Jumlah stok harus diisi',
            'jumlah_stok.min' => 'Jumlah stok minimal 1',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        DB::beginTransaction();
        try {
            $stokSebelum = $produk->stok_tersedia ?? 0;
            $jumlahStok = $request->jumlah_stok;
            
            if ($request->jenis_transaksi === 'masuk') {
                $stokSesudah = $stokSebelum + $jumlahStok;
            } elseif ($request->jenis_transaksi === 'keluar') {
                if ($stokSebelum < $jumlahStok) {
                    return back()->withErrors([
                        'error' => 'Stok tidak mencukupi. Stok tersedia: ' . $stokSebelum
                    ]);
                }
                $stokSesudah = $stokSebelum - $jumlahStok;
            } else { // penyesuaian
                $stokSesudah = $jumlahStok;
                $jumlahStok = abs($stokSesudah - $stokSebelum);
            }

            // Update stock
            $produk->update(['stok_tersedia' => $stokSesudah]);

            // Record stock movement
            TtDataStok::create([
                'produk_id' => $produk->id,
                'jenis_transaksi' => $request->jenis_transaksi,
                'jumlah_stok' => $jumlahStok,
                'stok_sebelum' => $stokSebelum,
                'stok_sesudah' => $stokSesudah,
                'referensi_transaksi' => 'MANUAL_ADJUSTMENT',
                'keterangan' => $request->keterangan ?: 'Penyesuaian manual',
                'tanggal_transaksi' => Carbon::now(),
                'user_id' => Auth::id(),
            ]);

            DB::commit();

            return back()->with('success', 'Stok berhasil diperbarui');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Generate kode produk
     */
    private function generateKodeProduk()
    {
        $prefix = 'PRD';
        $tanggal = now()->format('Ymd');
        
        $lastProduct = TmDataProduk::where('kode_produk', 'like', $prefix . $tanggal . '%')
            ->orderBy('kode_produk', 'desc')
            ->first();

        if ($lastProduct) {
            $lastNumber = (int) substr($lastProduct->kode_produk, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . $tanggal . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get products for select options
     */
    public function getProducts(Request $request)
    {
        $products = TmDataProduk::where('status_aktif', true)
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_produk', 'like', "%{$search}%")
                           ->orWhere('kode_produk', 'like', "%{$search}%");
            })
            ->select('id', 'kode_produk', 'nama_produk', 'harga_jual', 'stok_tersedia', 'satuan')
            ->limit(20)
            ->get()
            ->map(function ($product) {
                return [
                    'value' => $product->id,
                    'label' => $product->kode_produk . ' - ' . $product->nama_produk,
                    'harga' => $product->harga_jual,
                    'stok' => $product->stok_tersedia,
                    'satuan' => $product->satuan,
                ];
            });

        return response()->json($products);
    }
}

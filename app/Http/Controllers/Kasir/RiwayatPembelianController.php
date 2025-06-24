<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Models\TtDataPenjualan;
use App\Models\TmDataPelanggan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class RiwayatPembelianController extends Controller
{
    /**
     * Display a listing of purchase history for kasir
     * Kasir only sees their own transactions
     */
    public function index(Request $request)
    {
        $query = TtDataPenjualan::with(['pelanggan', 'detailPenjualan.produk'])
            ->where('kasir_id', Auth::id()) // Only show kasir's own transactions
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

        // Get statistics for kasir
        $statistics = $this->getKasirStatistics($request);

        return Inertia::render('Kasir/RiwayatPembelian/Index', [
            'transactions' => $transactions,
            'pelanggans' => $pelanggans,
            'filters' => $request->only([
                'search', 'pelanggan_id', 'metode_pembayaran', 
                'status_transaksi', 'tanggal_mulai', 'tanggal_akhir'
            ]),
            'statistics' => $statistics,
        ]);
    }

    /**
     * Display the specified transaction
     * Kasir can only view their own transactions
     */
    public function show($id)
    {
        $transaction = TtDataPenjualan::with([
                'pelanggan', 
                'kasir', 
                'detailPenjualan.produk'
            ])
            ->where('kasir_id', Auth::id()) // Security check
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

        return Inertia::render('Kasir/RiwayatPembelian/Show', [
            'transaction' => $transactionData,
        ]);
    }

    /**
     * Get daily performance for kasir
     */
    public function dailyPerformance(Request $request)
    {
        $tanggal = $request->tanggal ?? Carbon::today()->format('Y-m-d');
        
        $transactions = TtDataPenjualan::with(['pelanggan', 'detailPenjualan.produk'])
            ->where('kasir_id', Auth::id())
            ->whereDate('tanggal_penjualan', $tanggal)
            ->where('status_transaksi', 'selesai')
            ->get();

        $performance = [
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
            'metode_pembayaran' => $transactions->groupBy('metode_pembayaran')->map(function ($group, $metode) {
                return [
                    'metode' => $metode,
                    'jumlah' => $group->count(),
                    'total' => $group->sum('total_bayar'),
                    'total_format' => 'Rp ' . number_format($group->sum('total_bayar'), 0, ',', '.'),
                ];
            })->values(),
        ];

        return Inertia::render('Kasir/RiwayatPembelian/DailyPerformance', [
            'performance' => $performance,
            'tanggal' => $tanggal,
        ]);
    }

    /**
     * Get statistics for kasir
     */
    private function getKasirStatistics($request)
    {
        $query = TtDataPenjualan::where('kasir_id', Auth::id())
            ->where('status_transaksi', 'selesai');

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
            'transaksi_hari_ini' => TtDataPenjualan::where('kasir_id', Auth::id())
                ->whereDate('tanggal_penjualan', $today)
                ->where('status_transaksi', 'selesai')->count(),
            'pendapatan_hari_ini' => TtDataPenjualan::where('kasir_id', Auth::id())
                ->whereDate('tanggal_penjualan', $today)
                ->where('status_transaksi', 'selesai')->sum('total_bayar'),
            'pendapatan_hari_ini_format' => 'Rp ' . number_format(
                TtDataPenjualan::where('kasir_id', Auth::id())
                    ->whereDate('tanggal_penjualan', $today)
                    ->where('status_transaksi', 'selesai')->sum('total_bayar'), 
                0, ',', '.'
            ),
            'rata_rata_transaksi' => $transactions->count() > 0 ? 
                $transactions->sum('total_bayar') / $transactions->count() : 0,
            'rata_rata_transaksi_format' => $transactions->count() > 0 ? 
                'Rp ' . number_format($transactions->sum('total_bayar') / $transactions->count(), 0, ',', '.') : 'Rp 0',
        ];
    }
}
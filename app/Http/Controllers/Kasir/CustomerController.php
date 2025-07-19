<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Models\TmDataPelanggan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = TmDataPelanggan::query()
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_pelanggan', 'like', "%{$search}%")
                           ->orWhere('kode_pelanggan', 'like', "%{$search}%")
                           ->orWhere('nomor_telepon', 'like', "%{$search}%");
            })
            ->when($request->status !== null, function ($query) use ($request) {
                return $query->where('status_aktif', $request->status);
            })
            ->latest();

        $customers = $query->paginate(15)->withQueryString();

        // Transform customers data with safe date formatting
        $customers->getCollection()->transform(function ($customer) {
            return [
                'id' => $customer->id,
                'kode_pelanggan' => $customer->kode_pelanggan,
                'nama_pelanggan' => $customer->nama_pelanggan,
                'nomor_telepon' => $customer->nomor_telepon,
                'email_pelanggan' => $customer->email_pelanggan,
                'alamat_pelanggan' => $customer->alamat_pelanggan,
                'tanggal_lahir' => $this->formatTanggalLahir($customer->tanggal_lahir),
                'jenis_kelamin' => $customer->jenis_kelamin,
                'jenis_pelanggan' => $customer->jenis_pelanggan,
                'tanggal_bergabung' => $customer->tanggal_bergabung ? 
                    $customer->tanggal_bergabung->format('d/m/Y') : 
                    ($customer->created_at ? $customer->created_at->format('d/m/Y') : '-'),
                'status_aktif' => $customer->status_aktif,
                'created_at' => $customer->created_at ? $customer->created_at->format('d/m/Y H:i') : '-',
                'total_pembelian' => $customer->getTotalPembelian(),
                'jumlah_transaksi' => $customer->getJumlahTransaksi(),
                'total_pembelian_format' => 'Rp ' . number_format($customer->getTotalPembelian(), 0, ',', '.'),
            ];
        });

        return Inertia::render('Kasir/Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'status']),
            'statistics' => [
                'total_pelanggan' => TmDataPelanggan::count(),
                'pelanggan_aktif' => TmDataPelanggan::aktif()->count(),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Kasir/Customers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_pelanggan' => 'required|string|max:100',
            'nomor_telepon' => 'nullable|string|max:15|unique:tm_data_pelanggan,nomor_telepon',
            'email_pelanggan' => 'nullable|email|max:100|unique:tm_data_pelanggan,email_pelanggan',
            'alamat_pelanggan' => 'nullable|string',
            'status_aktif' => 'boolean',
        ], [
            'nama_pelanggan.required' => 'Nama pelanggan harus diisi',
            'nama_pelanggan.max' => 'Nama pelanggan maksimal 100 karakter',
            'nomor_telepon.unique' => 'Nomor telepon sudah terdaftar',
            'email_pelanggan.email' => 'Format email tidak valid',
            'email_pelanggan.unique' => 'Email sudah terdaftar',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            // Generate kode pelanggan
            $kodePelanggan = $this->generateKodePelanggan();

            TmDataPelanggan::create([
                'kode_pelanggan' => $kodePelanggan,
                'nama_pelanggan' => $request->nama_pelanggan,
                'nomor_telepon' => $request->nomor_telepon,
                'email_pelanggan' => $request->email_pelanggan,
                'alamat_pelanggan' => $request->alamat_pelanggan,
                'tanggal_bergabung' => Carbon::now(),
                'status_aktif' => $request->status_aktif ?? true,
            ]);

            return redirect()
                ->route('kasir.pelanggan.index')
                ->with('success', 'Pelanggan berhasil ditambahkan');

        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(TmDataPelanggan $pelanggan)
    {
        $pelanggan->load(['penjualan' => function ($query) {
            $query->where('status_transaksi', 'selesai')
                  ->with(['detailPenjualan.produk'])
                  ->latest()
                  ->limit(10);
        }]);

        // Get customer statistics
        $totalPembelian = $pelanggan->getTotalPembelian();
        $jumlahTransaksi = $pelanggan->getJumlahTransaksi();
        
        // Get recent transactions
        $recentTransactions = $pelanggan->penjualan()
            ->where('status_transaksi', 'selesai')
            ->with(['detailPenjualan.produk'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($penjualan) {
                return [
                    'id' => $penjualan->id,
                    'kode_transaksi' => $penjualan->kode_transaksi,
                    'tanggal_transaksi' => $penjualan->tanggal_transaksi ? 
                        $penjualan->tanggal_transaksi->format('d/m/Y H:i') : '-',
                    'total_bayar' => $penjualan->total_bayar,
                    'total_bayar_format' => 'Rp ' . number_format($penjualan->total_bayar, 0, ',', '.'),
                    'total_item' => $penjualan->detailPenjualan->sum('jumlah_beli'),
                ];
            });

        $customerData = [
            'id' => $pelanggan->id,
            'kode_pelanggan' => $pelanggan->kode_pelanggan,
            'nama_pelanggan' => $pelanggan->nama_pelanggan,
            'nomor_telepon' => $pelanggan->nomor_telepon,
            'email_pelanggan' => $pelanggan->email_pelanggan,
            'alamat_pelanggan' => $pelanggan->alamat_pelanggan,
            'tanggal_lahir' => $this->formatTanggalLahir($pelanggan->tanggal_lahir),
            'tanggal_lahir_raw' => $this->formatTanggalLahirForForm($pelanggan->tanggal_lahir),
            'jenis_kelamin' => $pelanggan->jenis_kelamin,
            'jenis_pelanggan' => $pelanggan->jenis_pelanggan,
            'tanggal_bergabung' => $pelanggan->tanggal_bergabung ? 
                $pelanggan->tanggal_bergabung->format('d/m/Y') : 
                ($pelanggan->created_at ? $pelanggan->created_at->format('d/m/Y') : '-'),
            'status_aktif' => $pelanggan->status_aktif,
            'statistics' => [
                'total_pembelian' => $totalPembelian,
                'total_pembelian_format' => 'Rp ' . number_format($totalPembelian, 0, ',', '.'),
                'jumlah_transaksi' => $jumlahTransaksi,
                'rata_rata_pembelian' => $jumlahTransaksi > 0 ? $totalPembelian / $jumlahTransaksi : 0,
                'rata_rata_pembelian_format' => $jumlahTransaksi > 0 ? 'Rp ' . number_format($totalPembelian / $jumlahTransaksi, 0, ',', '.') : 'Rp 0',
            ],
            'recent_transactions' => $recentTransactions,
        ];

        return Inertia::render('Kasir/Customers/Show', [
            'customer' => $customerData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TmDataPelanggan $pelanggan)
    {
        $customerData = [
            'id' => $pelanggan->id,
            'kode_pelanggan' => $pelanggan->kode_pelanggan,
            'nama_pelanggan' => $pelanggan->nama_pelanggan,
            'nomor_telepon' => $pelanggan->nomor_telepon,
            'email_pelanggan' => $pelanggan->email_pelanggan,
            'alamat_pelanggan' => $pelanggan->alamat_pelanggan,
            'status_aktif' => $pelanggan->status_aktif,
        ];

        return Inertia::render('Kasir/Customers/Edit', [
            'customer' => $customerData,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TmDataPelanggan $pelanggan)
    {
        $validator = Validator::make($request->all(), [
            'nama_pelanggan' => 'required|string|max:100',
            'nomor_telepon' => [
                'nullable',
                'string',
                'max:15',
                Rule::unique('tm_data_pelanggan', 'nomor_telepon')->ignore($pelanggan->id),
            ],
            'email_pelanggan' => [
                'nullable',
                'email',
                'max:100',
                Rule::unique('tm_data_pelanggan', 'email_pelanggan')->ignore($pelanggan->id),
            ],
            'alamat_pelanggan' => 'nullable|string',
            'status_aktif' => 'boolean',
        ], [
            'nama_pelanggan.required' => 'Nama pelanggan harus diisi',
            'nama_pelanggan.max' => 'Nama pelanggan maksimal 100 karakter',
            'nomor_telepon.unique' => 'Nomor telepon sudah terdaftar',
            'email_pelanggan.email' => 'Format email tidak valid',
            'email_pelanggan.unique' => 'Email sudah terdaftar',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $pelanggan->update([
                'nama_pelanggan' => $request->nama_pelanggan,
                'nomor_telepon' => $request->nomor_telepon,
                'email_pelanggan' => $request->email_pelanggan,
                'alamat_pelanggan' => $request->alamat_pelanggan,
                'status_aktif' => $request->status_aktif,
            ]);

            return redirect()
                ->route('kasir.pelanggan.index')
                ->with('success', 'Pelanggan berhasil diperbarui');

        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Toggle customer status
     */
    public function toggleStatus(TmDataPelanggan $pelanggan)
    {
        try {
            $pelanggan->update([
                'status_aktif' => !$pelanggan->status_aktif
            ]);

            $status = $pelanggan->status_aktif ? 'diaktifkan' : 'dinonaktifkan';

            return back()->with('success', "Pelanggan berhasil {$status}");

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get customers for select options
     */
    public function getCustomers(Request $request)
    {
        $customers = TmDataPelanggan::aktif()
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_pelanggan', 'like', "%{$search}%")
                           ->orWhere('kode_pelanggan', 'like', "%{$search}%")
                           ->orWhere('nomor_telepon', 'like', "%{$search}%");
            })
            ->select('id', 'kode_pelanggan', 'nama_pelanggan', 'nomor_telepon', 'jenis_pelanggan')
            ->limit(20)
            ->get()
            ->map(function ($customer) {
                return [
                    'value' => $customer->id,
                    'label' => $customer->kode_pelanggan . ' - ' . $customer->nama_pelanggan,
                    'nama' => $customer->nama_pelanggan,
                    'telepon' => $customer->nomor_telepon,
                    'jenis' => $customer->jenis_pelanggan,
                ];
            });

        return response()->json($customers);
    }

    /**
     * Generate kode pelanggan
     */
    private function generateKodePelanggan()
    {
        $prefix = 'CUST';
        $tanggal = now()->format('Ymd');
        
        $lastCustomer = TmDataPelanggan::where('kode_pelanggan', 'like', $prefix . $tanggal . '%')
            ->orderBy('kode_pelanggan', 'desc')
            ->first();

        if ($lastCustomer) {
            $lastNumber = (int) substr($lastCustomer->kode_pelanggan, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . $tanggal . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Quick stats for kasir dashboard
     */
    public function quickStats()
    {
        $today = Carbon::today();
        
        return response()->json([
            'customers_today' => TmDataPelanggan::whereDate('created_at', $today)->count(),
            'active_customers' => TmDataPelanggan::aktif()->count(),
            'total_customers' => TmDataPelanggan::count(),
            'member_customers' => TmDataPelanggan::jenisPelanggan('member')->count(),
            'vip_customers' => TmDataPelanggan::jenisPelanggan('vip')->count(),
        ]);
    }

    /**
     * Search customers for transaction
     */
    public function searchForTransaction(Request $request)
    {
        $search = $request->get('q', '');
        
        $customers = TmDataPelanggan::aktif()
            ->where(function ($query) use ($search) {
                $query->where('nama_pelanggan', 'like', "%{$search}%")
                      ->orWhere('kode_pelanggan', 'like', "%{$search}%")
                      ->orWhere('nomor_telepon', 'like', "%{$search}%");
            })
            ->select('id', 'kode_pelanggan', 'nama_pelanggan', 'nomor_telepon', 'jenis_pelanggan', 'email_pelanggan')
            ->limit(10)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'kode' => $customer->kode_pelanggan,
                    'nama' => $customer->nama_pelanggan,
                    'telepon' => $customer->nomor_telepon,
                    'email' => $customer->email_pelanggan,
                    'jenis' => $customer->jenis_pelanggan,
                    'display' => $customer->kode_pelanggan . ' - ' . $customer->nama_pelanggan,
                ];
            });

        return response()->json($customers);
    }

    /**
     * Helper method to safely format tanggal_lahir for display (d/m/Y)
     */
    private function formatTanggalLahir($tanggalLahir)
    {
        if (!$tanggalLahir) {
            return null;
        }

        try {
            // If it's already a Carbon instance
            if ($tanggalLahir instanceof Carbon) {
                return $tanggalLahir->format('d/m/Y');
            }

            // If it's a string, parse it
            if (is_string($tanggalLahir)) {
                return Carbon::parse($tanggalLahir)->format('d/m/Y');
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Helper method to safely format tanggal_lahir for form input (Y-m-d)
     */
    private function formatTanggalLahirForForm($tanggalLahir)
    {
        if (!$tanggalLahir) {
            return null;
        }

        try {
            // If it's already a Carbon instance
            if ($tanggalLahir instanceof Carbon) {
                return $tanggalLahir->format('Y-m-d');
            }

            // If it's a string, parse it
            if (is_string($tanggalLahir)) {
                return Carbon::parse($tanggalLahir)->format('Y-m-d');
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }
}

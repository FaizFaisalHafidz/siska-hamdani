<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TmDataSupplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = TmDataSupplier::query()
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_supplier', 'like', "%{$search}%")
                           ->orWhere('kode_supplier', 'like', "%{$search}%")
                           ->orWhere('nama_kontak', 'like', "%{$search}%")
                           ->orWhere('nomor_telepon', 'like', "%{$search}%")
                           ->orWhere('email_supplier', 'like', "%{$search}%")
                           ->orWhere('kota_supplier', 'like', "%{$search}%");
            })
            ->when($request->kota, function ($query, $kota) {
                return $query->where('kota_supplier', $kota);
            })
            ->when($request->status !== null, function ($query) use ($request) {
                return $query->where('status_aktif', $request->status);
            })
            ->latest();

        $suppliers = $query->paginate(15)->withQueryString();

        // Transform suppliers data
        $suppliers->getCollection()->transform(function ($supplier) {
            return [
                'id' => $supplier->id,
                'kode_supplier' => $supplier->kode_supplier,
                'nama_supplier' => $supplier->nama_supplier,
                'nama_kontak' => $supplier->nama_kontak,
                'nomor_telepon' => $supplier->nomor_telepon,
                'email_supplier' => $supplier->email_supplier,
                'alamat_supplier' => $supplier->alamat_supplier,
                'kota_supplier' => $supplier->kota_supplier,
                'status_aktif' => $supplier->status_aktif,
                'created_at' => $supplier->created_at->format('d/m/Y H:i'),
                'updated_at' => $supplier->updated_at->format('d/m/Y H:i'),
            ];
        });

        // Get unique cities for filter
        $cities = TmDataSupplier::distinct('kota_supplier')
            ->whereNotNull('kota_supplier')
            ->where('kota_supplier', '!=', '')
            ->pluck('kota_supplier')
            ->sort()
            ->values();

        return Inertia::render('Admin/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'kota', 'status']),
            'cities' => $cities,
            'statistics' => [
                'total_supplier' => TmDataSupplier::count(),
                'supplier_aktif' => TmDataSupplier::aktif()->count(),
                'supplier_nonaktif' => TmDataSupplier::where('status_aktif', false)->count(),
                'total_kota' => TmDataSupplier::distinct('kota_supplier')
                    ->whereNotNull('kota_supplier')
                    ->where('kota_supplier', '!=', '')
                    ->count(),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Suppliers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_supplier' => 'required|string|max:100',
            'nama_kontak' => 'nullable|string|max:100',
            'nomor_telepon' => 'nullable|string|max:15',
            'email_supplier' => 'nullable|email|max:100|unique:tm_data_supplier,email_supplier',
            'alamat_supplier' => 'nullable|string',
            'kota_supplier' => 'nullable|string|max:50',
            'status_aktif' => 'boolean',
        ], [
            'nama_supplier.required' => 'Nama supplier harus diisi',
            'nama_supplier.max' => 'Nama supplier maksimal 100 karakter',
            'nama_kontak.max' => 'Nama kontak maksimal 100 karakter',
            'nomor_telepon.max' => 'Nomor telepon maksimal 15 karakter',
            'email_supplier.email' => 'Format email tidak valid',
            'email_supplier.unique' => 'Email sudah terdaftar',
            'email_supplier.max' => 'Email maksimal 100 karakter',
            'kota_supplier.max' => 'Nama kota maksimal 50 karakter',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            // Generate kode supplier
            $kodeSupplier = $this->generateKodeSupplier();

            TmDataSupplier::create([
                'kode_supplier' => $kodeSupplier,
                'nama_supplier' => $request->nama_supplier,
                'nama_kontak' => $request->nama_kontak,
                'nomor_telepon' => $request->nomor_telepon,
                'email_supplier' => $request->email_supplier,
                'alamat_supplier' => $request->alamat_supplier,
                'kota_supplier' => $request->kota_supplier,
                'status_aktif' => $request->status_aktif ?? true,
            ]);

            return redirect()
                ->route('admin.supplier.index')
                ->with('success', 'Supplier berhasil ditambahkan');

        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(TmDataSupplier $supplier)
    {
        $supplierData = [
            'id' => $supplier->id,
            'kode_supplier' => $supplier->kode_supplier,
            'nama_supplier' => $supplier->nama_supplier,
            'nama_kontak' => $supplier->nama_kontak,
            'nomor_telepon' => $supplier->nomor_telepon,
            'email_supplier' => $supplier->email_supplier,
            'alamat_supplier' => $supplier->alamat_supplier,
            'kota_supplier' => $supplier->kota_supplier,
            'status_aktif' => $supplier->status_aktif,
            'created_at' => $supplier->created_at->format('d/m/Y H:i'),
            'updated_at' => $supplier->updated_at->format('d/m/Y H:i'),
        ];

        return Inertia::render('Admin/Suppliers/Show', [
            'supplier' => $supplierData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TmDataSupplier $supplier)
    {
        $supplierData = [
            'id' => $supplier->id,
            'kode_supplier' => $supplier->kode_supplier,
            'nama_supplier' => $supplier->nama_supplier,
            'nama_kontak' => $supplier->nama_kontak,
            'nomor_telepon' => $supplier->nomor_telepon,
            'email_supplier' => $supplier->email_supplier,
            'alamat_supplier' => $supplier->alamat_supplier,
            'kota_supplier' => $supplier->kota_supplier,
            'status_aktif' => $supplier->status_aktif,
        ];

        return Inertia::render('Admin/Suppliers/Edit', [
            'supplier' => $supplierData,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TmDataSupplier $supplier)
    {
        $validator = Validator::make($request->all(), [
            'nama_supplier' => 'required|string|max:100',
            'nama_kontak' => 'nullable|string|max:100',
            'nomor_telepon' => 'nullable|string|max:15',
            'email_supplier' => [
                'nullable',
                'email',
                'max:100',
                Rule::unique('tm_data_supplier', 'email_supplier')->ignore($supplier->id),
            ],
            'alamat_supplier' => 'nullable|string',
            'kota_supplier' => 'nullable|string|max:50',
            'status_aktif' => 'boolean',
        ], [
            'nama_supplier.required' => 'Nama supplier harus diisi',
            'nama_supplier.max' => 'Nama supplier maksimal 100 karakter',
            'nama_kontak.max' => 'Nama kontak maksimal 100 karakter',
            'nomor_telepon.max' => 'Nomor telepon maksimal 15 karakter',
            'email_supplier.email' => 'Format email tidak valid',
            'email_supplier.unique' => 'Email sudah terdaftar',
            'email_supplier.max' => 'Email maksimal 100 karakter',
            'kota_supplier.max' => 'Nama kota maksimal 50 karakter',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $supplier->update([
                'nama_supplier' => $request->nama_supplier,
                'nama_kontak' => $request->nama_kontak,
                'nomor_telepon' => $request->nomor_telepon,
                'email_supplier' => $request->email_supplier,
                'alamat_supplier' => $request->alamat_supplier,
                'kota_supplier' => $request->kota_supplier,
                'status_aktif' => $request->status_aktif,
            ]);

            return redirect()
                ->route('admin.supplier.index')
                ->with('success', 'Supplier berhasil diperbarui');

        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TmDataSupplier $supplier)
    {
        try {
            // Check if supplier has products (if you have products table with supplier relation)
            // Uncomment this if you have product-supplier relationship
            /*
            if ($supplier->products()->exists()) {
                return back()->withErrors([
                    'error' => 'Supplier tidak dapat dihapus karena memiliki produk terkait'
                ]);
            }
            */

            $supplier->delete();

            return redirect()
                ->route('admin.supplier.index')
                ->with('success', 'Supplier berhasil dihapus');

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Toggle supplier status
     */
    public function toggleStatus(TmDataSupplier $supplier)
    {
        try {
            $supplier->update([
                'status_aktif' => !$supplier->status_aktif
            ]);

            $status = $supplier->status_aktif ? 'diaktifkan' : 'dinonaktifkan';

            return back()->with('success', "Supplier berhasil {$status}");

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Export suppliers data
     */
    public function export(Request $request)
    {
        // Implementation for export functionality
        // This can be implemented later with Excel export
        
        return back()->with('info', 'Fitur export sedang dalam pengembangan');
    }

    /**
     * Get suppliers for select options
     */
    public function getSuppliers(Request $request)
    {
        $suppliers = TmDataSupplier::aktif()
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_supplier', 'like', "%{$search}%")
                           ->orWhere('kode_supplier', 'like', "%{$search}%")
                           ->orWhere('nama_kontak', 'like', "%{$search}%");
            })
            ->select('id', 'kode_supplier', 'nama_supplier', 'nama_kontak', 'nomor_telepon', 'kota_supplier')
            ->limit(20)
            ->get()
            ->map(function ($supplier) {
                return [
                    'value' => $supplier->id,
                    'label' => $supplier->kode_supplier . ' - ' . $supplier->nama_supplier,
                    'nama' => $supplier->nama_supplier,
                    'kontak' => $supplier->nama_kontak,
                    'telepon' => $supplier->nomor_telepon,
                    'kota' => $supplier->kota_supplier,
                ];
            });

        return response()->json($suppliers);
    }

    /**
     * Get supplier statistics
     */
    public function getStatistics()
    {
        $stats = [
            'total_supplier' => TmDataSupplier::count(),
            'supplier_aktif' => TmDataSupplier::aktif()->count(),
            'supplier_nonaktif' => TmDataSupplier::where('status_aktif', false)->count(),
            'supplier_bulan_ini' => TmDataSupplier::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'kota_terbanyak' => TmDataSupplier::selectRaw('kota_supplier, COUNT(*) as total')
                ->whereNotNull('kota_supplier')
                ->where('kota_supplier', '!=', '')
                ->groupBy('kota_supplier')
                ->orderByDesc('total')
                ->first(),
        ];

        return response()->json($stats);
    }

    /**
     * Bulk actions for suppliers
     */
    public function bulkAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:activate,deactivate,delete',
            'supplier_ids' => 'required|array|min:1',
            'supplier_ids.*' => 'exists:tm_data_supplier,id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $suppliers = TmDataSupplier::whereIn('id', $request->supplier_ids);
            $count = $suppliers->count();

            switch ($request->action) {
                case 'activate':
                    $suppliers->update(['status_aktif' => true]);
                    $message = "{$count} supplier berhasil diaktifkan";
                    break;
                
                case 'deactivate':
                    $suppliers->update(['status_aktif' => false]);
                    $message = "{$count} supplier berhasil dinonaktifkan";
                    break;
                
                case 'delete':
                    $suppliers->delete();
                    $message = "{$count} supplier berhasil dihapus";
                    break;
            }

            return back()->with('success', $message);

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Generate kode supplier
     */
    private function generateKodeSupplier()
    {
        $prefix = 'SUP';
        $tanggal = now()->format('Ymd');
        
        $lastSupplier = TmDataSupplier::where('kode_supplier', 'like', $prefix . $tanggal . '%')
            ->orderBy('kode_supplier', 'desc')
            ->first();

        if ($lastSupplier) {
            $lastNumber = (int) substr($lastSupplier->kode_supplier, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . $tanggal . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }
}

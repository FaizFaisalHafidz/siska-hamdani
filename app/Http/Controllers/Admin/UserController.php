<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Carbon\Carbon;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::with('roles')
            ->when($request->search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%")
                           ->orWhere('nama_lengkap', 'like', "%{$search}%")
                           ->orWhere('kode_user', 'like', "%{$search}%");
            })
            ->when($request->role, function ($query, $role) {
                return $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->when($request->status !== null, function ($query) use ($request) {
                return $query->where('status_aktif', $request->status);
            })
            ->latest();

        $users = $query->paginate(10)->withQueryString();

        // Transform users data
        $users->getCollection()->transform(function ($user) {
            return [
                'id' => $user->id,
                'kode_user' => $user->kode_user,
                'name' => $user->name,
                'nama_lengkap' => $user->nama_lengkap,
                'email' => $user->email,
                'nomor_telepon' => $user->nomor_telepon,
                'alamat' => $user->alamat,
                'tanggal_bergabung' => $user->tanggal_bergabung?->format('d/m/Y'),
                'status_aktif' => $user->status_aktif,
                'terakhir_login' => $user->terakhir_login?->format('d/m/Y H:i'),
                'roles' => $user->roles->pluck('name'),
                'role_names' => $user->roles->pluck('name')->join(', '),
                'created_at' => $user->created_at->format('d/m/Y H:i'),
            ];
        });

        $roles = Role::all(['id', 'name']);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $roles = Role::all(['id', 'name']);
        
        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:users',
            'nama_lengkap' => 'required|string|max:200',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'nomor_telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'role' => 'required|exists:roles,name',
            'status_aktif' => 'boolean',
        ], [
            'name.required' => 'Username harus diisi',
            'name.unique' => 'Username sudah digunakan',
            'nama_lengkap.required' => 'Nama lengkap harus diisi',
            'email.required' => 'Email harus diisi',
            'email.unique' => 'Email sudah digunakan',
            'password.required' => 'Password harus diisi',
            'password.min' => 'Password minimal 8 karakter',
            'password.confirmed' => 'Konfirmasi password tidak sesuai',
            'role.required' => 'Role harus dipilih',
            'role.exists' => 'Role tidak valid',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            // Generate kode user
            $kodeUser = $this->generateKodeUser($request->role);

            $user = User::create([
                'kode_user' => $kodeUser,
                'name' => $request->name,
                'nama_lengkap' => $request->nama_lengkap,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'nomor_telepon' => $request->nomor_telepon,
                'alamat' => $request->alamat,
                'tanggal_bergabung' => Carbon::now(),
                'status_aktif' => $request->status_aktif ?? true,
            ]);

            // Assign role
            $user->assignRole($request->role);

            return redirect()
                ->route('admin.users.index')
                ->with('success', 'User berhasil ditambahkan');

        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        $user->load('roles');
        
        // Get user statistics
        $totalPenjualan = $user->penjualan()->where('status_transaksi', 'selesai')->count();
        $totalNilaiPenjualan = $user->penjualan()
            ->where('status_transaksi', 'selesai')
            ->sum('total_bayar');

        $userData = [
            'id' => $user->id,
            'kode_user' => $user->kode_user,
            'name' => $user->name,
            'nama_lengkap' => $user->nama_lengkap,
            'email' => $user->email,
            'nomor_telepon' => $user->nomor_telepon,
            'alamat' => $user->alamat,
            'tanggal_bergabung' => $user->tanggal_bergabung?->format('d/m/Y'),
            'status_aktif' => $user->status_aktif,
            'terakhir_login' => $user->terakhir_login?->format('d/m/Y H:i'),
            'roles' => $user->roles->pluck('name'),
            'role_names' => $user->roles->pluck('name')->join(', '),
            'created_at' => $user->created_at->format('d/m/Y H:i'),
            'statistics' => [
                'total_penjualan' => $totalPenjualan,
                'total_nilai_penjualan' => 'Rp ' . number_format($totalNilaiPenjualan, 0, ',', '.'),
            ]
        ];

        return Inertia::render('Admin/Users/Show', [
            'user' => $userData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        $user->load('roles');
        $roles = Role::all(['id', 'name']);
        
        $userData = [
            'id' => $user->id,
            'kode_user' => $user->kode_user,
            'name' => $user->name,
            'nama_lengkap' => $user->nama_lengkap,
            'email' => $user->email,
            'nomor_telepon' => $user->nomor_telepon,
            'alamat' => $user->alamat,
            'tanggal_bergabung' => $user->tanggal_bergabung,
            'status_aktif' => $user->status_aktif,
            'current_role' => $user->roles->first()?->name,
        ];

        return Inertia::render('Admin/Users/Edit', [
            'user' => $userData,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user)],
            'nama_lengkap' => 'required|string|max:200',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'password' => 'nullable|string|min:8|confirmed',
            'nomor_telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'role' => 'required|exists:roles,name',
            'status_aktif' => 'boolean',
        ], [
            'name.required' => 'Username harus diisi',
            'name.unique' => 'Username sudah digunakan',
            'nama_lengkap.required' => 'Nama lengkap harus diisi',
            'email.required' => 'Email harus diisi',
            'email.unique' => 'Email sudah digunakan',
            'password.min' => 'Password minimal 8 karakter',
            'password.confirmed' => 'Konfirmasi password tidak sesuai',
            'role.required' => 'Role harus dipilih',
            'role.exists' => 'Role tidak valid',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $updateData = [
                'name' => $request->name,
                'nama_lengkap' => $request->nama_lengkap,
                'email' => $request->email,
                'nomor_telepon' => $request->nomor_telepon,
                'alamat' => $request->alamat,
                'status_aktif' => $request->status_aktif,
            ];

            // Update password jika diisi
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            // Update role jika berubah
            $currentRole = $user->roles->first()?->name;
            if ($currentRole !== $request->role) {
                $user->syncRoles([$request->role]);
                
                // Update kode user jika role berubah
                $user->update(['kode_user' => $this->generateKodeUser($request->role)]);
            }

            return redirect()
                ->route('admin.users.index')
                ->with('success', 'User berhasil diperbarui');

        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        try {
            // Check if user has transactions
            if ($user->penjualan()->exists()) {
                return back()->withErrors([
                    'error' => 'User tidak dapat dihapus karena memiliki data transaksi'
                ]);
            }

            $user->delete();

            return redirect()
                ->route('admin.users.index')
                ->with('success', 'User berhasil dihapus');

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Toggle user status
     */
    public function toggleStatus(User $user)
    {
        try {
            $user->update([
                'status_aktif' => !$user->status_aktif
            ]);

            $status = $user->status_aktif ? 'diaktifkan' : 'dinonaktifkan';

            return back()->with('success', "User berhasil {$status}");

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(User $user)
    {
        try {
            $defaultPassword = 'password123';
            
            $user->update([
                'password' => Hash::make($defaultPassword)
            ]);

            return back()->with('success', "Password user berhasil direset ke: {$defaultPassword}");

        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Generate kode user berdasarkan role
     */
    private function generateKodeUser($role)
    {
        $prefix = match($role) {
            'admin' => 'ADM',
            'kasir' => 'KSR',
            default => 'USR'
        };

        $lastUser = User::where('kode_user', 'like', $prefix . '%')
            ->orderBy('kode_user', 'desc')
            ->first();

        if ($lastUser) {
            $lastNumber = (int) substr($lastUser->kode_user, 3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get users for select options
     */
    public function getUsers(Request $request)
    {
        $users = User::aktif()
            ->when($request->role, function ($query, $role) {
                return $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->select('id', 'kode_user', 'nama_lengkap')
            ->get()
            ->map(function ($user) {
                return [
                    'value' => $user->id,
                    'label' => $user->kode_user . ' - ' . $user->nama_lengkap,
                ];
            });

        return response()->json($users);
    }
}
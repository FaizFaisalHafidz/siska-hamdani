<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TmDataPelanggan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class CustomerAuthController extends Controller
{
    /**
     * Display the customer registration form.
     */
    public function showRegisterForm()
    {
        return Inertia::render('auth/CustomerRegister');
    }

    /**
     * Handle customer registration.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        try {
            DB::beginTransaction();

            // Create user account
            $user = User::create([
                'kode_user' => $this->generateUserCode(),
                'name' => $request->name,
                'nama_lengkap' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'nomor_telepon' => $request->phone,
                'alamat' => $request->address,
                'tanggal_bergabung' => now(),
                'status_aktif' => true,
            ]);

            // Assign customer role using Spatie
            $user->assignRole('customer');

            // Create customer profile
            $customerData = [
                'user_id' => $user->id,
                'kode_pelanggan' => $this->generateCustomerCode(),
                'nama_pelanggan' => $request->name,
                'nomor_telepon' => $request->phone,
                'email_pelanggan' => $request->email,
                'alamat_pelanggan' => $request->address,
                'jenis_pelanggan' => 'online',
                'tanggal_bergabung' => now(),
                'status_aktif' => true,
            ];

            TmDataPelanggan::create($customerData);

            DB::commit();

            // Log in the user
            Auth::login($user);

            return redirect()->route('shop.index')->with('success', 'Akun berhasil dibuat! Selamat datang di Hamdani Stationery.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Terjadi kesalahan saat membuat akun. Silakan coba lagi.']);
        }
    }

    /**
     * Display the customer login form.
     */
    public function showLoginForm()
    {
        return Inertia::render('auth/CustomerLogin');
    }

    /**
     * Handle customer login.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate();

            $user = Auth::user();
            
            // Check if user has customer role or customer profile
            if ($user->customerProfile) {
                // Set customer session
                $request->session()->put('customer_id', $user->customerProfile->id);
                
                // Update last login time
                User::where('id', $user->id)->update(['terakhir_login' => now()]);
                
                return redirect('/shop')->with('success', 'Selamat datang kembali!');
            } else {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Akun ini bukan akun pelanggan.',
                ]);
            }
        }

        return back()->withErrors([
            'email' => 'Email atau password salah.',
        ]);
    }

    /**
     * Handle customer logout.
     */
    public function logout(Request $request)
    {
        // Clear customer session
        $request->session()->forget('customer_id');
        $request->session()->forget('cart');
        
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/shop')->with('success', 'Anda telah berhasil keluar.');
    }

    /**
     * Generate unique customer code.
     */
    private function generateCustomerCode()
    {
        $prefix = 'CUS';
        $date = now()->format('Ymd');
        
        // Get the last customer code for today
        $lastCustomer = TmDataPelanggan::where('kode_pelanggan', 'like', $prefix . $date . '%')
            ->orderBy('kode_pelanggan', 'desc')
            ->first();

        if ($lastCustomer) {
            $lastNumber = intval(substr($lastCustomer->kode_pelanggan, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . $date . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate unique user code for customer.
     */
    private function generateUserCode()
    {
        $prefix = 'CUS';
        
        // Get the last customer user code
        $lastUser = User::where('kode_user', 'like', $prefix . '%')
            ->orderBy('kode_user', 'desc')
            ->first();

        if ($lastUser) {
            $lastNumber = intval(substr($lastUser->kode_user, -3));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }
}

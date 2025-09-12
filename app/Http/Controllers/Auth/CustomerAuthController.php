<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TmDataPelanggan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        Log::info('Customer registration attempt', $request->all());
        
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:500',
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            Log::info('Validation passed, creating user');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', [
                'errors' => $e->errors(),
                'message' => $e->getMessage()
            ]);
            return back()->withErrors($e->errors())->withInput();
        }

        try {
            DB::beginTransaction();
            Log::info('Starting database transaction');

            // Create user account
            $userCode = $this->generateUserCode();
            Log::info('Generated user code', ['code' => $userCode]);
            
            $user = User::create([
                'kode_user' => $userCode,
                'name' => $request->name,
                'nama_lengkap' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'nomor_telepon' => $request->phone,
                'alamat' => $request->address,
                'tanggal_bergabung' => now(),
                'status_aktif' => true,
            ]);
            
            Log::info('User created successfully', ['user_id' => $user->id]);

            // Assign customer role using Spatie
            $user->assignRole('customer');
            Log::info('Customer role assigned');

            // Create customer profile
            $customerCode = $this->generateCustomerCode();
            Log::info('Generated customer code', ['code' => $customerCode]);
            
            $customerData = [
                'user_id' => $user->id,
                'kode_pelanggan' => $customerCode,
                'nama_pelanggan' => $request->name,
                'nomor_telepon' => $request->phone,
                'email_pelanggan' => $request->email,
                'alamat_pelanggan' => $request->address,
                'jenis_pelanggan' => 'member', // Changed from 'online' to 'member'
                'tanggal_bergabung' => now()->toDateString(), // Convert to date string
                'status_aktif' => true,
            ];

            Log::info('Customer data to be created', $customerData);
            
            $customer = TmDataPelanggan::create($customerData);
            Log::info('Customer profile created', ['customer_id' => $customer->id]);

            DB::commit();
            Log::info('Customer registration successful', ['user_id' => $user->id, 'email' => $user->email]);

            // Redirect to login page instead of auto-login
            return redirect()->route('customer.login')->with('success', 'Akun berhasil dibuat! Silakan masuk untuk melanjutkan.');

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Customer registration failed', [
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Terjadi kesalahan saat membuat akun: ' . $e->getMessage()]);
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
            
            // Force regenerate CSRF token for clean session
            $request->session()->regenerateToken();

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
        $prefix = 'PLG';
        $date = date('Ymd');
        
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

        // Generate new code and check for uniqueness
        do {
            $newCode = $prefix . $date . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
            $exists = TmDataPelanggan::where('kode_pelanggan', $newCode)->exists();
            if ($exists) {
                $newNumber++;
            }
        } while ($exists);

        return $newCode;
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
            // Extract number from the last code (e.g., CUS001 -> 1)
            $lastNumber = intval(substr($lastUser->kode_user, strlen($prefix)));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Generate new code and check for uniqueness
        do {
            $newCode = $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
            $exists = User::where('kode_user', $newCode)->exists();
            if ($exists) {
                $newNumber++;
            }
        } while ($exists);

        return $newCode;
    }

    /**
     * Clear session for CSRF token issues
     */
    public function clearSession(Request $request)
    {
        // Force logout if authenticated
        if (Auth::check()) {
            Auth::logout();
        }
        
        // Clear all session data
        $request->session()->flush();
        $request->session()->regenerate();
        $request->session()->regenerateToken();
        
        return redirect()->route('customer.login')->with('success', 'Session dibersihkan. Silakan login kembali.');
    }
}

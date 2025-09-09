<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CustomerMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if customer is logged in via session
        if (!$request->session()->has('customer_id')) {
            return redirect('/customer/login');
        }

        // Verify customer exists
        $customerId = $request->session()->get('customer_id');
        $customer = \App\Models\TmDataPelanggan::find($customerId);
        
        if (!$customer || !$customer->status_aktif) {
            $request->session()->forget('customer_id');
            return redirect('/customer/login')->withErrors([
                'email' => 'Akses ditolak. Silakan login kembali.',
            ]);
        }

        return $next($request);
    }
}

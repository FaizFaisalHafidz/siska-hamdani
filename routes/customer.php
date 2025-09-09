<?php

use App\Http\Controllers\Auth\CustomerAuthController;
use App\Http\Controllers\Shop\CustomerOrderController;
use App\Http\Controllers\Shop\CartController;
use Illuminate\Support\Facades\Route;

// Customer Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/customer/register', [CustomerAuthController::class, 'showRegisterForm'])->name('customer.register');
    Route::post('/customer/register', [CustomerAuthController::class, 'register']);
    
    Route::get('/customer/login', [CustomerAuthController::class, 'showLoginForm'])->name('customer.login');
    Route::post('/customer/login', [CustomerAuthController::class, 'login']);
});

// Customer Checkout Routes (without middleware for testing)
Route::get('/customer/checkout', [CustomerOrderController::class, 'checkout'])->name('customer.checkout');
Route::post('/customer/calculate-shipping', [CustomerOrderController::class, 'calculateShipping'])->name('customer.calculate-shipping');
Route::post('/customer/process-order', [CustomerOrderController::class, 'processOrder'])->name('customer.process-order');
Route::get('/customer/order-success/{order}', [CustomerOrderController::class, 'orderSuccess'])->name('customer.order-success');

// Cart Management (without middleware for testing)
Route::get('/shop/cart', [CartController::class, 'index'])->name('shop.cart');
Route::post('/api/cart/add', [CartController::class, 'add'])->name('api.cart.add');
Route::put('/api/cart/{id}', [CartController::class, 'update'])->name('api.cart.update');
Route::delete('/api/cart/{id}', [CartController::class, 'remove'])->name('api.cart.remove');
Route::delete('/api/cart', [CartController::class, 'clear'])->name('api.cart.clear');
Route::get('/api/cart/count', [CartController::class, 'count'])->name('api.cart.count');

// Customer Protected Routes
Route::middleware(['customer'])->group(function () {
    Route::post('/customer/logout', [CustomerAuthController::class, 'logout'])->name('customer.logout');
    
    // Order History
    Route::get('/customer/orders', [CustomerOrderController::class, 'orderHistory'])->name('customer.orders');
    Route::get('/customer/orders/{order}', [CustomerOrderController::class, 'orderDetail'])->name('customer.order-detail');
});

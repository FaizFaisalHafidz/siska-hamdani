import { Link, router, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

interface User {
    id: number;
    email: string;
    nama_pelanggan: string;
}

interface Props {
    children: React.ReactNode;
}

export default function CustomerLayout({ children }: Props) {
    const { auth } = usePage().props as any;
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        router.post('/customer/logout');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link href="/customer/shop" className="text-2xl font-bold text-gray-900">
                                Toko Siska
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex space-x-8">
                            <Link 
                                href="/customer/shop" 
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Belanja
                            </Link>
                            <Link 
                                href="/customer/orders" 
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Pesanan Saya
                            </Link>
                        </nav>

                        {/* User Menu */}
                        <div className="relative">
                            {auth?.user ? (
                                <div>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                                    >
                                        <span className="mr-2">{auth.user.nama_pelanggan || auth.user.email}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                            <Link
                                                href="/customer/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Profil Saya
                                            </Link>
                                            <Link
                                                href="/customer/orders"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Pesanan Saya
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-x-4">
                                    <Link
                                        href="/customer/login"
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/customer/register"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button className="text-gray-600 hover:text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Toko Siska</h3>
                            <p className="text-gray-300">
                                Toko terpercaya untuk semua kebutuhan Anda.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Kontak</h3>
                            <div className="text-gray-300 space-y-2">
                                <p>Alamat: Jl. Terusan Kopo No. 30, Bandung</p>
                                <p>Telepon: (022) 123-4567</p>
                                <p>Email: info@tokosiska.com</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Jam Operasional</h3>
                            <div className="text-gray-300 space-y-2">
                                <p>Senin - Jumat: 08:00 - 17:00</p>
                                <p>Sabtu: 08:00 - 15:00</p>
                                <p>Minggu: Tutup</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
                        <p>&copy; 2024 Toko Siska. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

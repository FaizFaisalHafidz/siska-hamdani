import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Facebook,
    Heart,
    Instagram,
    LogOut,
    Mail,
    MapPin,
    Menu,
    Package,
    Phone,
    Search,
    ShoppingCart,
    Twitter
} from 'lucide-react';
import React, { useState } from 'react';

interface ShopLayoutProps {
  children: React.ReactNode;
  cartItemsCount?: number;
  cartItems?: CartItem[];
}

interface UserData {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface CartItem {
  product: {
    id: number;
    nama_produk: string;
    harga_jual: number;
    gambar_produk?: string;
  };
  quantity: number;
}

export default function ShopLayout({ children, cartItemsCount = 0, cartItems = [] }: ShopLayoutProps) {
  const { auth } = usePage().props as any;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleLogout = () => {
    router.post('/customer/logout');
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.visit('/customer/checkout');
  };

  const handleViewCart = () => {
    setIsCartOpen(false);
    router.visit('/shop/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-10 text-sm">
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>(021) 8765-4321</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>info@hamdanistationery.com</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span>✨ Promo spesial: Gratis pengiriman untuk pembelian alat tulis di atas Rp 100.000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/shop" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xl">HC</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">Hamdani Stationery</h1>
                <p className="text-xs text-gray-500 font-medium">Alat Tulis & Perlengkapan Kantor</p>
              </div>
            </Link>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari produk..."
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Wishlist */}
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  2
                </Badge>
              </Button>

              {/* Cart */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemsCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                        {cartItemsCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col h-full overflow-hidden">
                  <SheetHeader className="pb-4 border-b flex-shrink-0">
                    <SheetTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Keranjang Belanja
                    </SheetTitle>
                    <SheetDescription>
                      {cartItemsCount === 0 ? 'Keranjang kosong' : `${cartItemsCount} item dalam keranjang`}
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto py-4 min-h-0">
                    {cartItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                          <ShoppingCart className="h-16 w-16 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Keranjang Kosong</h3>
                        <p className="text-gray-600 mb-8 max-w-sm leading-relaxed">
                          Belum ada produk di keranjang Anda. 
                          <br />
                          <span className="text-blue-600 font-medium">Yuk, mulai berbelanja sekarang! 🛍️</span>
                        </p>
                        <Button 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          onClick={() => {
                            setIsCartOpen(false);
                            router.visit('/shop');
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Mulai Belanja
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cartItems.map((item, index) => (
                          <div key={index} className="group flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:shadow-md transition-shadow">
                              {item.product.gambar_produk ? (
                                <img
                                  src={item.product.gambar_produk}
                                  alt={item.product.nama_produk}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-blue-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {item.product.nama_produk}
                              </h4>
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-blue-600">
                                  {new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                  }).format(item.product.harga_jual)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                    ×{item.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="border-t pt-4 mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex-shrink-0">
                      <div className="space-y-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                          <span className="text-lg font-bold text-gray-900">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(
                              cartItems.reduce((total, item) => total + (item.product.harga_jual * item.quantity), 0)
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-lg text-center">
                          <span className="font-medium">💡 Ongkos kirim akan dihitung berdasarkan lokasi Anda</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg font-semibold py-3 text-base transform hover:scale-105 transition-all duration-200"
                          onClick={handleCheckout}
                        >
                          🚀 Checkout Sekarang
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          Klik untuk melanjutkan ke pembayaran
                        </p>
                      </div>
                    </div>
                  )}
                </SheetContent>
              </Sheet>

              {/* User menu or login */}
              {auth?.customer ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={auth.customer.avatar} alt={auth.customer.nama_pelanggan} />
                        <AvatarFallback>
                          {auth.customer.nama_pelanggan.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{auth.customer.nama_pelanggan}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {auth.customer.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/customer/orders">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Pesanan Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/customer/login">Masuk</Link>
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600" asChild>
                    <Link href="/customer/register">Daftar</Link>
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari produk..."
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <div className="container mx-auto px-4 py-4">
              <nav className="space-y-2">
                {!auth?.user && (
                  <div className="pt-4 space-y-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                      <Link href="/customer/login">Masuk</Link>
                    </Button>
                    <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600" asChild>
                      <Link href="/customer/register">Daftar</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-xl">HC</span>
                </div>
                <div>
                  <h3 className="text-xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">Hamdani Stationery</h3>
                  <p className="text-sm text-gray-400 font-medium">Alat Tulis & Perlengkapan Kantor</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Menyediakan alat tulis berkualitas tinggi dan perlengkapan kantor terlengkap dengan harga terjangkau untuk mendukung produktivitas dan kreativitas Anda.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Twitter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/shop/orders" className="text-gray-400 hover:text-white transition-colors">Lacak Pesanan</Link></li>
                <li><Link href="/shop/returns" className="text-gray-400 hover:text-white transition-colors">Pengembalian</Link></li>
                <li><Link href="/shop/shipping" className="text-gray-400 hover:text-white transition-colors">Info Pengiriman</Link></li>
                <li><Link href="/shop/terms" className="text-gray-400 hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="/shop/privacy" className="text-gray-400 hover:text-white transition-colors">Kebijakan Privasi</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak Kami</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                  <div className="text-gray-400">
                    <p>Jl. Merdeka Stationery No. 88</p>
                    <p>Jakarta Pusat 10110</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">(021) 8765-4321</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">info@hamdanistationery.com</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-400">Jam Operasional:</p>
                <p className="text-sm text-gray-300">Senin - Jumat: 09:00 - 21:00</p>
                <p className="text-sm text-gray-300">Sabtu: 09:00 - 19:00</p>
                <p className="text-sm text-gray-300">Minggu: 10:00 - 17:00</p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
                © 2025 Hamdani Stationery. All rights reserved. Alat Tulis & Perlengkapan Kantor Terpercaya.
              </p>
              <div className="flex gap-6 text-sm">
                <Link href="/shop/terms" className="text-gray-400 hover:text-white transition-colors">
                  Syarat & Ketentuan
                </Link>
                <Link href="/shop/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Kebijakan Privasi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

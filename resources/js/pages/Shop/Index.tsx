import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ShopLayout from '@/layouts/shop-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Book, FileText, Grid3X3, Heart, List, Minus, PenTool, Plus, Search, ShoppingCart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  kode_produk: string;
  nama_produk: string;
  kategori: {
    id: number;
    nama_kategori: string;
  };
  deskripsi_produk?: string;
  harga_jual: number;
  stok_tersedia: number;
  gambar_produk?: string;
  merk_produk?: string;
  rating?: number;
  reviews_count?: number;
}

interface Category {
  id: number;
  nama_kategori: string;
  product_count?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  products: {
    data: Product[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  categories: Category[];
  cartItems?: CartItem[];
  filters?: {
    search?: string;
    category?: string;
    price_range?: string;
    sort?: string;
  };
}

export default function ShopIndex({ products, categories, cartItems = [], filters }: Props) {
  const { auth } = usePage().props as any;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [selectedCategory, setSelectedCategory] = useState(filters?.category || 'all');
  const [sortBy, setSortBy] = useState(filters?.sort || 'newest');
  const [cart, setCart] = useState<CartItem[]>(cartItems);
  const [wishlist, setWishlist] = useState<number[]>([]);

  // Sync cart state with props when cartItems changes
  useEffect(() => {
    setCart(cartItems);
  }, [cartItems]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const addToCart = (product: Product) => {
    // Check if customer is logged in
    if (!auth?.customer) {
      router.visit('/customer/login');
      return;
    }

    // Send to backend
    router.post('/api/cart/add', {
      product_id: product.id,
      quantity: 1
    }, {
      preserveState: false,
      preserveScroll: true,
      onSuccess: () => {
        // Data will be refreshed from server automatically
        // The cart state will be updated from props
      },
      onError: (errors) => {
        console.error('Failed to add to cart:', errors);
      }
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const getCartQuantity = (productId: number) => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredProducts = (products.data || []).filter((product: Product) => {
    const matchesSearch = product.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.deskripsi_produk?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.kategori.id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.harga_jual - b.harga_jual;
      case 'price_high':
        return b.harga_jual - a.harga_jual;
      case 'name':
        return a.nama_produk.localeCompare(b.nama_produk);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return b.id - a.id; // newest first
    }
  });

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('pulpen') || name.includes('pen') || name.includes('bolpoin')) return <PenTool className="h-4 w-4" />;
    if (name.includes('buku') || name.includes('notebook') || name.includes('catatan')) return <Book className="h-4 w-4" />;
    if (name.includes('kertas') || name.includes('paper') || name.includes('hvs')) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <ShopLayout cartItemsCount={getTotalCartItems()} cartItems={cart}>
      <Head title="Hamdani Stationery - Toko Alat Tulis Terpercaya" />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4=')] opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Toko Alat Tulis & Perlengkapan Kantor Terpercaya
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              Hamdani Stationery
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-gray-300 font-light leading-relaxed">
              Melayani kebutuhan alat tulis, perlengkapan kantor, dan keperluan stationery berkualitas untuk mendukung produktivitas Anda
            </p>
            <div className="max-w-2xl mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-2">
                <div className="flex items-center">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                  <Input
                    placeholder="Cari alat tulis, buku, pulpen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 pr-6 py-4 bg-transparent border-0 text-white placeholder:text-gray-400 text-lg focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="border-b border-gray-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-60 h-12 bg-gradient-to-r from-gray-50 to-white border-gray-200 hover:border-blue-300 transition-colors shadow-sm">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-xl">
                    <SelectItem value="all" className="font-medium">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
                        Semua Kategori
                      </div>
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()} className="hover:bg-blue-50">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            {getCategoryIcon(category.nama_kategori)}
                            <span className="ml-2">{category.nama_kategori}</span>
                          </div>
                          {category.product_count && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {category.product_count}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-52 h-12 bg-gradient-to-r from-gray-50 to-white border-gray-200 hover:border-blue-300 transition-colors shadow-sm">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-xl">
                    <SelectItem value="newest" className="hover:bg-blue-50">Terbaru</SelectItem>
                    <SelectItem value="price_low" className="hover:bg-blue-50">Harga: Rendah ke Tinggi</SelectItem>
                    <SelectItem value="price_high" className="hover:bg-blue-50">Harga: Tinggi ke Rendah</SelectItem>
                    <SelectItem value="name" className="hover:bg-blue-50">Nama: A-Z</SelectItem>
                    <SelectItem value="rating" className="hover:bg-blue-50">Rating Tertinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-none border-0 ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'hover:bg-blue-50'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-none border-0 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'hover:bg-blue-50'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Produk Premium</h2>
                <p className="text-gray-600 text-lg">
                  Menampilkan <span className="font-semibold text-blue-600">{sortedProducts.length}</span> dari <span className="font-semibold text-blue-600">{products.total}</span> produk berkualitas tinggi
                </p>
              </div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {sortedProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 flex items-center justify-center">
                        {product.gambar_produk ? (
                          <img
                            src={`/storage/${product.gambar_produk}`}
                            alt={product.nama_produk}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="text-6xl text-gradient-to-r from-blue-400 to-purple-400">📄</div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleWishlist(product.id)}
                        className={`absolute top-3 right-3 ${
                          wishlist.includes(product.id) 
                            ? 'text-red-500 bg-white/95 shadow-lg' 
                            : 'text-gray-600 bg-white/90 hover:text-red-500 shadow-md'
                        } backdrop-blur-sm border border-white/20 hover:scale-110 transition-all duration-300`}
                      >
                        <Heart className={`h-4 w-4 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                      </Button>
                      {product.stok_tersedia <= 5 && product.stok_tersedia > 0 && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                          Stok Terbatas
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0">
                        {product.kategori.nama_kategori}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.nama_produk}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.deskripsi_produk || 'Alat tulis berkualitas tinggi dan perlengkapan kantor'}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatPrice(product.harga_jual)}
                        </div>
                        <div className="text-xs text-gray-500">Stok: {product.stok_tersedia}</div>
                      </div>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{product.rating || 4.8}</span>
                      </div>
                    </div>
                    
                    {getCartQuantity(product.id) > 0 ? (
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 border border-blue-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(product.id, getCartQuantity(product.id) - 1)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-lg text-blue-700">{getCartQuantity(product.id)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(product.id, getCartQuantity(product.id) + 1)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => addToCart(product)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={product.stok_tersedia === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.stok_tersedia === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                  <div className="flex p-6">
                    <div className="w-48 h-48 flex-shrink-0 mr-6">
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.gambar_produk ? (
                          <img
                            src={`/storage/${product.gambar_produk}`}
                            alt={product.nama_produk}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-8xl text-gradient-to-r from-blue-400 to-purple-400">📄</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0 mb-2">
                            {product.kategori.nama_kategori}
                          </Badge>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {product.nama_produk}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {product.deskripsi_produk || 'Alat tulis berkualitas tinggi dan perlengkapan kantor untuk mendukung produktivitas Anda'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleWishlist(product.id)}
                          className={`${
                            wishlist.includes(product.id) 
                              ? 'text-red-500' 
                              : 'text-gray-400 hover:text-red-500'
                          } hover:scale-110 transition-all duration-300`}
                        >
                          <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {formatPrice(product.harga_jual)}
                            </div>
                            <div className="text-sm text-gray-500">Stok: {product.stok_tersedia}</div>
                          </div>
                          <div className="flex items-center text-yellow-500">
                            <Star className="h-5 w-5 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">{product.rating || 4.8}</span>
                            <span className="text-xs text-gray-500 ml-1">({product.reviews_count || 25} ulasan)</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {getCartQuantity(product.id) > 0 ? (
                            <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 border border-blue-200">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(product.id, getCartQuantity(product.id) - 1)}
                                className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-semibold text-lg text-blue-700 px-3">{getCartQuantity(product.id)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(product.id, getCartQuantity(product.id) + 1)}
                                className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => addToCart(product)}
                              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                              disabled={product.stok_tersedia === 0}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {product.stok_tersedia === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {sortedProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto w-64 h-64 bg-gradient-to-br from-gray-100 to-blue-50 rounded-full flex items-center justify-center mb-8">
                <Search className="h-24 w-24 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Produk Tidak Ditemukan</h3>
              <p className="text-gray-600 mb-8">Maaf, tidak ada produk yang sesuai dengan pencarian Anda. Coba ubah filter atau kata kunci pencarian.</p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}

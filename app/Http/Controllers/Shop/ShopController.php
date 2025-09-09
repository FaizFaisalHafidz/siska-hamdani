<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\TmDataProduk;
use App\Models\TmDataKategori;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShopController extends Controller
{
    public function index(Request $request)
    {
        $products = TmDataProduk::with(['kategori'])
            ->where('status_aktif', true)
            ->where('stok_tersedia', '>', 0)
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_produk', 'like', "%{$search}%")
                           ->orWhere('deskripsi_produk', 'like', "%{$search}%");
            })
            ->when($request->category, function ($query, $category) {
                return $query->where('kategori_id', $category);
            })
            ->when($request->sort, function ($query, $sort) {
                switch ($sort) {
                    case 'price_low':
                        return $query->orderBy('harga_jual', 'asc');
                    case 'price_high':
                        return $query->orderBy('harga_jual', 'desc');
                    case 'name':
                        return $query->orderBy('nama_produk', 'asc');
                    default:
                        return $query->orderBy('created_at', 'desc');
                }
            })
            ->paginate(24);

        $categories = TmDataKategori::withCount('produk')
            ->orderBy('nama_kategori')
            ->get();

        // Get cart items from session
        $cartItems = session()->get('cart', []);
        $cartCount = collect($cartItems)->sum('quantity');
        
        // Transform cart items to match frontend structure
        $formattedCartItems = collect($cartItems)->map(function ($item) {
            return [
                'product' => $item['product'],
                'quantity' => $item['quantity']
            ];
        })->values()->all();

        // Get customer auth
        $customerAuth = null;
        if (session()->has('customer_id')) {
            $customerAuth = \App\Models\TmDataPelanggan::find(session('customer_id'));
        }

        return Inertia::render('Shop/Index', [
            'products' => [
                'data' => $products->items(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
                'per_page' => $products->perPage(),
            ],
            'categories' => $categories,
            'cartItems' => $formattedCartItems,
            'cartCount' => $cartCount,
            'filters' => [
                'search' => $request->search,
                'category' => $request->category,
                'sort' => $request->sort ?? 'newest',
            ],
            'auth' => [
                'customer' => $customerAuth
            ],
        ]);
    }

    public function products(Request $request)
    {
        return $this->index($request);
    }

    public function show($id)
    {
        $product = TmDataProduk::with(['kategori'])
            ->where('status_aktif', true)
            ->findOrFail($id);

        // Get related products from same category
        $relatedProducts = TmDataProduk::with(['kategori'])
            ->where('kategori_id', $product->kategori_id)
            ->where('id', '!=', $product->id)
            ->where('status_aktif', true)
            ->where('stok_tersedia', '>', 0)
            ->limit(8)
            ->get();

        return Inertia::render('Shop/Product', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function categories()
    {
        $categories = TmDataKategori::withCount([
            'produk' => function ($query) {
                $query->where('status_aktif', true)
                      ->where('stok_tersedia', '>', 0);
            }
        ])->orderBy('nama_kategori')->get();

        return Inertia::render('Shop/Categories', [
            'categories' => $categories,
        ]);
    }

    public function category($categoryId)
    {
        $category = TmDataKategori::findOrFail($categoryId);
        
        $products = TmDataProduk::with(['kategori'])
            ->where('kategori_id', $categoryId)
            ->where('status_aktif', true)
            ->where('stok_tersedia', '>', 0)
            ->paginate(24);

        return Inertia::render('Shop/Category', [
            'category' => $category,
            'products' => $products,
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->get('q');
        
        $products = TmDataProduk::with(['kategori'])
            ->where('status_aktif', true)
            ->where('stok_tersedia', '>', 0)
            ->where(function ($q) use ($query) {
                $q->where('nama_produk', 'like', "%{$query}%")
                  ->orWhere('deskripsi_produk', 'like', "%{$query}%")
                  ->orWhere('merk_produk', 'like', "%{$query}%");
            })
            ->paginate(24);

        return Inertia::render('Shop/Search', [
            'products' => $products,
            'query' => $query,
        ]);
    }

    public function wishlist()
    {
        $wishlistIds = session()->get('wishlist', []);
        
        $products = TmDataProduk::with(['kategori'])
            ->whereIn('id', $wishlistIds)
            ->where('status_aktif', true)
            ->get();

        return Inertia::render('Shop/Wishlist', [
            'products' => $products,
        ]);
    }

    public function addToWishlist($id)
    {
        $wishlist = session()->get('wishlist', []);
        
        if (!in_array($id, $wishlist)) {
            $wishlist[] = $id;
            session()->put('wishlist', $wishlist);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product added to wishlist',
            'count' => count($wishlist)
        ]);
    }

    public function removeFromWishlist($id)
    {
        $wishlist = session()->get('wishlist', []);
        $wishlist = array_diff($wishlist, [$id]);
        session()->put('wishlist', $wishlist);

        return response()->json([
            'success' => true,
            'message' => 'Product removed from wishlist',
            'count' => count($wishlist)
        ]);
    }

    // API endpoints
    public function getProducts(Request $request)
    {
        $products = TmDataProduk::with(['kategori'])
            ->where('status_aktif', true)
            ->where('stok_tersedia', '>', 0)
            ->when($request->search, function ($query, $search) {
                return $query->where('nama_produk', 'like', "%{$search}%");
            })
            ->limit(20)
            ->get();

        return response()->json($products);
    }

    public function getCategories()
    {
        $categories = TmDataKategori::withCount('produk')
            ->orderBy('nama_kategori')
            ->get();

        return response()->json($categories);
    }

    public function apiSearch(Request $request)
    {
        $query = $request->get('q');
        
        $products = TmDataProduk::where('nama_produk', 'like', "%{$query}%")
            ->where('status_aktif', true)
            ->limit(10)
            ->get(['id', 'nama_produk', 'harga_jual']);

        return response()->json($products);
    }

    // Static pages
    public function about()
    {
        return Inertia::render('Shop/About');
    }

    public function contact()
    {
        return Inertia::render('Shop/Contact');
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
        ]);

        // Here you can send email or save to database
        // For now, just return success response

        return back()->with('success', 'Pesan Anda telah terkirim. Kami akan segera menghubungi Anda.');
    }

    public function faq()
    {
        return Inertia::render('Shop/FAQ');
    }

    public function terms()
    {
        return Inertia::render('Shop/Terms');
    }

    public function privacy()
    {
        return Inertia::render('Shop/Privacy');
    }

    public function shippingInfo()
    {
        return Inertia::render('Shop/ShippingInfo');
    }

    public function returnPolicy()
    {
        return Inertia::render('Shop/ReturnPolicy');
    }
}

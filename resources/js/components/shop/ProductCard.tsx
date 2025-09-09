import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react';

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

interface Props {
  product: Product;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: number) => void;
  cartQuantity: number;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number) => void;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onRemoveFromCart, 
  cartQuantity, 
  isWishlisted, 
  onToggleWishlist, 
  viewMode = 'grid' 
}: Props) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {product.gambar_produk ? (
                <img
                  src={`/storage/${product.gambar_produk}`}
                  alt={product.nama_produk}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl text-gray-400">📄</div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {product.kategori.nama_kategori}
                  </Badge>
                  <h3 className="text-xl font-semibold">{product.nama_produk}</h3>
                  {product.merk_produk && (
                    <p className="text-gray-600">{product.merk_produk}</p>
                  )}
                  {product.deskripsi_produk && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {product.deskripsi_produk}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(product.harga_jual)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Stok: {product.stok_tersedia}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  {product.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{product.rating}</span>
                      {product.reviews_count && (
                        <span className="text-xs text-gray-500">({product.reviews_count} ulasan)</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isWishlisted ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}
                    onClick={() => onToggleWishlist(product.id)}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </Button>
                  
                  {cartQuantity > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onRemoveFromCart(product.id)}
                        className="h-8 w-8"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold text-lg min-w-[2rem] text-center">
                        {cartQuantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onAddToCart(product)}
                        disabled={cartQuantity >= product.stok_tersedia}
                        className="h-8 w-8"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => onAddToCart(product)}
                      disabled={product.stok_tersedia === 0}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Tambah ke Keranjang
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            {product.gambar_produk ? (
              <img
                src={`/storage/${product.gambar_produk}`}
                alt={product.nama_produk}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-6xl text-gray-400">📄</div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 ${
              isWishlisted 
                ? 'text-red-500 bg-white/90' 
                : 'text-gray-600 bg-white/90 hover:text-red-500'
            }`}
            onClick={() => onToggleWishlist(product.id)}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>
          {product.stok_tersedia < 10 && product.stok_tersedia > 0 && (
            <Badge variant="destructive" className="absolute top-3 left-3">
              Stok Terbatas
            </Badge>
          )}
          {product.stok_tersedia === 0 && (
            <Badge variant="secondary" className="absolute top-3 left-3">
              Habis
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs">
            {product.kategori.nama_kategori}
          </Badge>
          <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.nama_produk}
          </CardTitle>
          {product.merk_produk && (
            <p className="text-sm text-gray-600">{product.merk_produk}</p>
          )}
          <div className="flex items-center gap-2">
            {product.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">{product.rating}</span>
                {product.reviews_count && (
                  <span className="text-xs text-gray-500">({product.reviews_count})</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatPrice(product.harga_jual)}
              </p>
              <p className="text-sm text-gray-500">
                Stok: {product.stok_tersedia}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          {cartQuantity > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onRemoveFromCart(product.id)}
                className="h-8 w-8"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-semibold text-lg min-w-[2rem] text-center">
                {cartQuantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onAddToCart(product)}
                disabled={cartQuantity >= product.stok_tersedia}
                className="h-8 w-8"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => onAddToCart(product)}
              disabled={product.stok_tersedia === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Tambah ke Keranjang
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

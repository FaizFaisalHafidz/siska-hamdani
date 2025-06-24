import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Plus, ShoppingCart } from 'lucide-react';

interface Product {
    id: number;
    kode_produk: string;
    nama_produk: string;
    kategori_id: number;
    kategori_nama: string;
    harga_jual: number;
    harga_jual_format: string;
    stok_tersedia: number;
    gambar_produk: string;
    deskripsi_produk: string;
    satuan: string;
    merk_produk: string;
}

interface Props {
    product: Product;
    onAddToCart: () => void;
    inCart: boolean;
}

export default function ProductCard({ product, onAddToCart, inCart }: Props) {
    return (
        <Card className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${inCart ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
            <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {product.gambar_produk ? (
                        <img 
                            src={product.gambar_produk} 
                            alt={product.nama_produk}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                    ) : (
                        <Package className="h-12 w-12 text-gray-400" />
                    )}
                </div>
                
                <div className="space-y-2">
                    <div>
                        <Badge variant="secondary" className="text-xs mb-1">
                            {product.kategori_nama}
                        </Badge>
                        <h3 className="font-medium text-sm line-clamp-2 h-10">
                            {product.nama_produk}
                        </h3>
                        <p className="text-xs text-gray-500">{product.kode_produk}</p>
                        {product.merk_produk && (
                            <p className="text-xs text-gray-400">{product.merk_produk}</p>
                        )}
                    </div>
                    
                    <div className="space-y-1">
                        <p className="font-bold text-blue-600">{product.harga_jual_format}</p>
                        <div className="flex items-center justify-between">
                            <Badge 
                                variant={product.stok_tersedia > 10 ? "default" : "destructive"}
                                className="text-xs"
                            >
                                Stok: {product.stok_tersedia} {product.satuan}
                            </Badge>
                            <Button
                                size="sm"
                                onClick={onAddToCart}
                                disabled={product.stok_tersedia === 0}
                                className={`h-8 px-3 ${inCart ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {inCart ? (
                                    <ShoppingCart className="h-3 w-3" />
                                ) : (
                                    <Plus className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
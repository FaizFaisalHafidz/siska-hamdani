<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'produk_id', 
        'quantity',
        'harga_satuan',
    ];

    protected $casts = [
        'harga_satuan' => 'decimal:2',
    ];

    /**
     * Get the user that owns the cart item.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product for this cart item.
     */
    public function produk()
    {
        return $this->belongsTo(TmDataProduk::class, 'produk_id');
    }

    /**
     * Get the total price for this cart item.
     */
    public function getTotalPriceAttribute()
    {
        return $this->quantity * $this->harga_satuan;
    }
}

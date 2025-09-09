<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TtDetailPenjualan extends Model
{
    use HasFactory;

    protected $table = 'tt_detail_penjualan';

    protected $fillable = [
        'penjualan_id',
        'id_penjualan', // Alias for e-commerce
        'produk_id',
        'id_produk', // Alias for e-commerce
        'jumlah_beli',
        'jumlah_produk', // Alias for e-commerce
        'harga_satuan',
        'diskon_item',
        'subtotal',
        'catatan_item',
    ];

    protected $casts = [
        'jumlah_beli' => 'integer',
        'harga_satuan' => 'decimal:0',
        'diskon_item' => 'decimal:0',
        'subtotal' => 'decimal:0',
    ];

    /**
     * Relationship to penjualan
     */
    public function penjualan(): BelongsTo
    {
        return $this->belongsTo(TtDataPenjualan::class, 'penjualan_id');
    }

    /**
     * Relationship to produk
     */
    public function produk(): BelongsTo
    {
        return $this->belongsTo(TmDataProduk::class, 'produk_id');
    }

    /**
     * Get total before discount
     */
    public function getTotalSebelumDiskonAttribute()
    {
        return $this->jumlah_beli * $this->harga_satuan;
    }
}
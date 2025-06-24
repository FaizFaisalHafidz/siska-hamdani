<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class TmDataProduk extends Model
{
    use HasFactory;

    protected $table = 'tm_data_produk';

    protected $fillable = [
        'kode_produk',
        'nama_produk',
        'kategori_id',
        'deskripsi_produk',
        'harga_beli',
        'harga_jual',
        'stok_tersedia',
        'stok_minimum',
        'satuan',
        'merk_produk',
        'gambar_produk',
        'status_aktif',
        'tanggal_input',
    ];

    protected $casts = [
        'harga_beli' => 'decimal:0',
        'harga_jual' => 'decimal:0',
        'stok_tersedia' => 'integer',
        'stok_minimum' => 'integer',
        'status_aktif' => 'boolean',
        'tanggal_input' => 'datetime',
    ];

    /**
     * Relationship to kategori
     */
    public function kategori(): BelongsTo
    {
        return $this->belongsTo(TmDataKategori::class, 'kategori_id');
    }

    /**
     * Relationship to detail penjualan
     */
    public function detailPenjualan(): HasMany
    {
        return $this->hasMany(TtDetailPenjualan::class, 'produk_id');
    }

    /**
     * Relationship to data stok
     */
    public function dataStok(): HasMany
    {
        return $this->hasMany(TtDataStok::class, 'produk_id');
    }

    /**
     * Scope for active products
     */
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true);
    }

    /**
     * Scope for low stock products
     */
    public function scopeStokRendah($query)
    {
        return $query->whereColumn('stok_tersedia', '<=', 'stok_minimum');
    }

    /**
     * Get formatted harga jual
     */
    public function getHargaJualFormatAttribute()
    {
        return 'Rp ' . number_format($this->harga_jual ?? 0, 0, ',', '.');
    }

    /**
     * Get formatted harga beli
     */
    public function getHargaBeliFormatAttribute()
    {
        return 'Rp ' . number_format($this->harga_beli ?? 0, 0, ',', '.');
    }

    /**
     * Check if stock is low
     */
    public function getIsStokRendahAttribute()
    {
        return ($this->stok_tersedia ?? 0) <= ($this->stok_minimum ?? 0);
    }

    /**
     * Get profit margin percentage
     */
    public function getMarginAttribute()
    {
        if (!$this->harga_beli || $this->harga_beli <= 0) {
            return 0;
        }
        
        return round((($this->harga_jual - $this->harga_beli) / $this->harga_beli * 100), 2);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TmDataKategori extends Model
{
    use HasFactory;

    protected $table = 'tm_data_kategori';

    protected $fillable = [
        'nama_kategori',
        'deskripsi_kategori',
        'status_aktif',
    ];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];

    /**
     * Relasi ke produk
     */
    public function produk(): HasMany
    {
        return $this->hasMany(TmDataProduk::class, 'kategori_id');
    }

    /**
     * Scope untuk kategori aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true);
    }
}
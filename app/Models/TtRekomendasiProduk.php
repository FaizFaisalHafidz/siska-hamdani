<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TtRekomendasiProduk extends Model
{
    use HasFactory;

    protected $table = 'tt_rekomendasi_produk';

    protected $fillable = [
        'produk_utama_id',
        'produk_rekomendasi_id',
        'skor_rekomendasi',
        'frekuensi_bersamaan',
        'tanggal_analisis',
        'status_aktif',
        'keterangan',
    ];

    protected $casts = [
        'skor_rekomendasi' => 'decimal:6',
        'frekuensi_bersamaan' => 'integer',
        'tanggal_analisis' => 'date',
        'status_aktif' => 'boolean',
    ];

    /**
     * Relasi ke produk utama
     */
    public function produkUtama(): BelongsTo
    {
        return $this->belongsTo(TmDataProduk::class, 'produk_utama_id');
    }

    /**
     * Relasi ke produk rekomendasi
     */
    public function produkRekomendasi(): BelongsTo
    {
        return $this->belongsTo(TmDataProduk::class, 'produk_rekomendasi_id');
    }

    /**
     * Scope untuk rekomendasi aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true);
    }

    /**
     * Scope untuk rekomendasi berdasarkan produk
     */
    public function scopeUntukProduk($query, $produkId)
    {
        return $query->where('produk_utama_id', $produkId);
    }

    /**
     * Get rekomendasi terbaik untuk produk tertentu
     */
    public static function getRekomendasiTerbaik($produkId, $limit = 5)
    {
        return self::where('produk_utama_id', $produkId)
                   ->where('status_aktif', true)
                   ->orderBy('skor_rekomendasi', 'desc')
                   ->limit($limit)
                   ->with('produkRekomendasi')
                   ->get();
    }
}
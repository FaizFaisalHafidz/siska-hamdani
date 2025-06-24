<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TtDataStok extends Model
{
    use HasFactory;

    protected $table = 'tt_data_stok';

    protected $fillable = [
        'produk_id',
        'jenis_transaksi',
        'jumlah_stok',
        'stok_sebelum',
        'stok_sesudah',
        'referensi_transaksi',
        'keterangan',
        'tanggal_transaksi',
        'user_id',
    ];

    protected $casts = [
        'jumlah_stok' => 'integer',
        'stok_sebelum' => 'integer',
        'stok_sesudah' => 'integer',
        'tanggal_transaksi' => 'datetime',
    ];

    /**
     * Relasi ke produk
     */
    public function produk(): BelongsTo
    {
        return $this->belongsTo(TmDataProduk::class, 'produk_id');
    }

    /**
     * Relasi ke user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope untuk transaksi masuk
     */
    public function scopeMasuk($query)
    {
        return $query->where('jenis_transaksi', 'masuk');
    }

    /**
     * Scope untuk transaksi keluar
     */
    public function scopeKeluar($query)
    {
        return $query->where('jenis_transaksi', 'keluar');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class TtDataPenjualan extends Model
{
    use HasFactory;

    protected $table = 'tt_data_penjualan';

    protected $fillable = [
        'nomor_invoice',
        'pelanggan_id',
        'kasir_id',
        'total_belanja',
        'diskon_persen',
        'diskon_nominal',
        'pajak_persen',
        'pajak_nominal',
        'total_bayar',
        'jumlah_dibayar',
        'kembalian',
        'metode_pembayaran',
        'catatan_penjualan',
        'tanggal_penjualan',
        'status_transaksi',
    ];

    protected $casts = [
        'tanggal_penjualan' => 'datetime',
        'total_belanja' => 'decimal:0',
        'diskon_persen' => 'decimal:2',
        'diskon_nominal' => 'decimal:0',
        'pajak_persen' => 'decimal:2',
        'pajak_nominal' => 'decimal:0',
        'total_bayar' => 'decimal:0',
        'jumlah_dibayar' => 'decimal:0',
        'kembalian' => 'decimal:0',
    ];

    /**
     * Relationship to pelanggan
     */
    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(TmDataPelanggan::class, 'pelanggan_id');
    }

    /**
     * Relationship to kasir (user)
     */
    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kasir_id');
    }

    /**
     * Relationship to detail penjualan
     */
    public function detailPenjualan(): HasMany
    {
        return $this->hasMany(TtDetailPenjualan::class, 'penjualan_id');
    }

    /**
     * Scope for today's transactions
     */
    public function scopeHariIni($query)
    {
        return $query->whereDate('tanggal_penjualan', Carbon::today());
    }

    /**
     * Scope for completed transactions
     */
    public function scopeSelesai($query)
    {
        return $query->where('status_transaksi', 'selesai');
    }

    /**
     * Generate unique invoice number
     */
    public static function generateNomorInvoice()
    {
        $today = Carbon::now()->format('Ymd');
        $prefix = 'INV-' . $today . '-';
        
        $lastInvoice = self::where('nomor_invoice', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();
        
        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->nomor_invoice, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
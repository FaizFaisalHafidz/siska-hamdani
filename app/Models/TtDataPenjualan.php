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
        'nomor_transaksi', // For e-commerce order number
        'pelanggan_id',
        'customer_id', // For e-commerce customer
        'kasir_id',
        'total_belanja',
        'total_harga', // Alias for e-commerce
        'diskon_persen',
        'diskon_nominal',
        'diskon', // For e-commerce
        'pajak_persen',
        'pajak_nominal',
        'total_bayar',
        'jumlah_dibayar',
        'kembalian',
        'metode_pembayaran',
        'catatan_penjualan',
        'catatan', // For e-commerce
        'tanggal_penjualan',
        'tanggal_transaksi', // For e-commerce
        'status_transaksi',
        'status', // For e-commerce
        'alamat_pengiriman', // E-commerce shipping address
        'biaya_pengiriman', // E-commerce shipping cost
        'kode_promo', // E-commerce promo code
        'payment_proof', // E-commerce payment proof
        'payment_date', // E-commerce payment date
        'payment_notes', // E-commerce payment notes
        'cancelled_at', // E-commerce cancellation timestamp
    ];

    protected $casts = [
        'tanggal_penjualan' => 'datetime',
        'tanggal_transaksi' => 'datetime',
        'payment_date' => 'datetime',
        'cancelled_at' => 'datetime',
        'total_belanja' => 'decimal:0',
        'total_harga' => 'decimal:0',
        'diskon_persen' => 'decimal:2',
        'diskon_nominal' => 'decimal:0',
        'diskon' => 'decimal:0',
        'pajak_persen' => 'decimal:2',
        'pajak_nominal' => 'decimal:0',
        'total_bayar' => 'decimal:0',
        'jumlah_dibayar' => 'decimal:0',
        'kembalian' => 'decimal:0',
        'biaya_pengiriman' => 'decimal:0',
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
     * Alias for e-commerce customer relationship
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(TmDataPelanggan::class, 'customer_id');
    }

    /**
     * Relationship to detail penjualan
     */
    public function detailPenjualan(): HasMany
    {
        return $this->hasMany(TtDetailPenjualan::class, 'penjualan_id');
    }

    /**
     * Alias for e-commerce details relationship
     */
    public function details(): HasMany
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
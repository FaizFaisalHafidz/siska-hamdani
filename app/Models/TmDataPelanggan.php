<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TmDataPelanggan extends Model
{
    use HasFactory;

    protected $table = 'tm_data_pelanggan';

    protected $fillable = [
        'user_id',
        'kode_pelanggan',
        'nama_pelanggan',
        'nomor_telepon',
        'email_pelanggan',
        'alamat_pelanggan',
        'tanggal_lahir',
        'jenis_kelamin',
        'jenis_pelanggan',
        'tanggal_bergabung',
        'status_aktif',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'tanggal_bergabung' => 'datetime',
        'status_aktif' => 'boolean',
    ];

    /**
     * Relationship to penjualan
     */
    public function penjualan(): HasMany
    {
        return $this->hasMany(TtDataPenjualan::class, 'pelanggan_id');
    }

    /**
     * Scope for active customers
     */
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true);
    }

    /**
     * Scope for customer type
     */
    public function scopeJenisPelanggan($query, $jenis)
    {
        return $query->where('jenis_pelanggan', $jenis);
    }

    /**
     * Get total pembelian
     */
    public function getTotalPembelian()
    {
        return $this->penjualan()
            ->where('status_transaksi', 'selesai')
            ->sum('total_bayar') ?? 0;
    }

    /**
     * Get jumlah transaksi
     */
    public function getJumlahTransaksi()
    {
        return $this->penjualan()
            ->where('status_transaksi', 'selesai')
            ->count();
    }

    /**
     * Get age from tanggal_lahir
     */
    public function getUmurAttribute()
    {
        if (!$this->tanggal_lahir) {
            return null;
        }

        try {
            $tanggalLahir = $this->tanggal_lahir instanceof Carbon 
                ? $this->tanggal_lahir 
                : Carbon::parse($this->tanggal_lahir);
            
            return $tanggalLahir->age;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get formatted tanggal lahir
     */
    public function getTanggalLahirFormatAttribute()
    {
        if (!$this->tanggal_lahir) {
            return null;
        }

        try {
            $tanggalLahir = $this->tanggal_lahir instanceof Carbon 
                ? $this->tanggal_lahir 
                : Carbon::parse($this->tanggal_lahir);
            
            return $tanggalLahir->format('d/m/Y');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get jenis kelamin text
     */
    public function getJenisKelaminTextAttribute()
    {
        return match($this->jenis_kelamin) {
            'L' => 'Laki-laki',
            'P' => 'Perempuan',
            default => 'Tidak Diketahui'
        };
    }

    /**
     * Get jenis pelanggan badge color
     */
    public function getJenisPelangganColorAttribute()
    {
        return match($this->jenis_pelanggan) {
            'reguler' => 'gray',
            'member' => 'blue',
            'vip' => 'yellow',
            default => 'gray'
        };
    }

    /**
     * Get customer display name with code
     */
    public function getDisplayNameAttribute()
    {
        return $this->kode_pelanggan . ' - ' . $this->nama_pelanggan;
    }

    /**
     * Get recent transactions
     */
    public function getRecentTransactions($limit = 5)
    {
        return $this->penjualan()
            ->where('status_transaksi', 'selesai')
            ->with(['detailPenjualan.produk'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get customer statistics
     */
    public function getStatistics()
    {
        $totalPembelian = $this->getTotalPembelian();
        $jumlahTransaksi = $this->getJumlahTransaksi();

        return [
            'total_pembelian' => $totalPembelian,
            'total_pembelian_format' => 'Rp ' . number_format($totalPembelian, 0, ',', '.'),
            'jumlah_transaksi' => $jumlahTransaksi,
            'rata_rata_pembelian' => $jumlahTransaksi > 0 ? $totalPembelian / $jumlahTransaksi : 0,
            'rata_rata_pembelian_format' => $jumlahTransaksi > 0 ? 
                'Rp ' . number_format($totalPembelian / $jumlahTransaksi, 0, ',', '.') : 'Rp 0',
        ];
    }

    /**
     * Get the user associated with this customer.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Accessor for consistent field naming - nomor_hp
     */
    public function getNomorHpAttribute()
    {
        return $this->nomor_telepon;
    }

    /**
     * Accessor for consistent field naming - alamat
     */
    public function getAlamatAttribute()
    {
        return $this->alamat_pelanggan;
    }

    /**
     * Accessor for consistent field naming - email
     */
    public function getEmailAttribute()
    {
        return $this->email_pelanggan;
    }
}
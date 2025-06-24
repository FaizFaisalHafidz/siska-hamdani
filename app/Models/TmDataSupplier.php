<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TmDataSupplier extends Model
{
    use HasFactory;

    protected $table = 'tm_data_supplier';

    protected $fillable = [
        'kode_supplier',
        'nama_supplier',
        'nama_kontak',
        'nomor_telepon',
        'email_supplier',
        'alamat_supplier',
        'kota_supplier',
        'status_aktif',
    ];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];

    /**
     * Scope untuk supplier aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true);
    }

    /**
     * Accessor untuk nama lengkap dengan kode
     */
    public function getNamaLengkapAttribute()
    {
        return $this->kode_supplier . ' - ' . $this->nama_supplier;
    }
}
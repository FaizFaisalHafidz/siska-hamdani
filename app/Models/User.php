<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kode_user',
        'name',
        'nama_lengkap',
        'email',
        'password',
        'nomor_telepon',
        'alamat',
        'tanggal_bergabung',
        'status_aktif',
        'terakhir_login',
        'terakhir_login',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'tanggal_bergabung' => 'date',
            'status_aktif' => 'boolean',
            'terakhir_login' => 'datetime',
        ];
    }

    /**
     * Relasi ke penjualan sebagai kasir
     */
    public function penjualan(): HasMany
    {
        return $this->hasMany(TtDataPenjualan::class, 'kasir_id');
    }

    /**
     * Relasi ke data stok
     */
    public function dataStok(): HasMany
    {
        return $this->hasMany(TtDataStok::class, 'user_id');
    }

    /**
     * Scope untuk user aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true);
    }

    /**
     * Check apakah user adalah admin
     */
    public function isAdmin()
    {
        return $this->hasRole('admin');
    }

    /**
     * Check apakah user adalah kasir
     */
    public function isKasir()
    {
        return $this->hasRole('kasir');
    }

    /**
     * Update last login
     */
    public function updateLastLogin()
    {
        $this->update(['terakhir_login' => now()]);
    }

    /**
     * Get the customer profile associated with this user.
     */
    public function customerProfile()
    {
        return $this->hasOne(TmDataPelanggan::class, 'user_id');
    }

    /**
     * Get the cart items for this user.
     */
    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Get the orders for this user.
     */
    public function orders()
    {
        return $this->hasMany(TtDataPenjualan::class, 'customer_id');
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Roles
        DB::table('roles')->insert([
            ['name' => 'admin', 'guard_name' => 'web', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'kasir', 'guard_name' => 'web', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Seed Users
        $admin = \App\Models\User::create([
            'kode_user' => 'ADM001',
            'name' => 'admin',
            'nama_lengkap' => 'Administrator Sistem',
            'email' => 'admin@hamdanicanon.com',
            'password' => Hash::make('password'),
            'nomor_telepon' => '081234567890',
            'tanggal_bergabung' => Carbon::now(),
            'status_aktif' => true,
        ]);
        $admin->assignRole('admin');

        $kasir = \App\Models\User::create([
            'kode_user' => 'KSR001',
            'name' => 'kasir',
            'nama_lengkap' => 'Kasir Utama',
            'email' => 'kasir@hamdanicanon.com',
            'password' => Hash::make('password'),
            'nomor_telepon' => '081234567891',
            'tanggal_bergabung' => Carbon::now(),
            'status_aktif' => true,
        ]);
        $kasir->assignRole('kasir');

        // Seed Kategori
        DB::table('tm_data_kategori')->insert([
            [
                'nama_kategori' => 'Alat Tulis',
                'deskripsi_kategori' => 'Berbagai macam alat tulis kantor',
                'status_aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama_kategori' => 'Kertas & Buku',
                'deskripsi_kategori' => 'Berbagai jenis kertas dan buku tulis',
                'status_aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama_kategori' => 'Alat Kantor',
                'deskripsi_kategori' => 'Peralatan kantor dan aksesoris',
                'status_aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Seed Sample Products
        DB::table('tm_data_produk')->insert([
            [
                'kode_produk' => 'ATK001',
                'nama_produk' => 'Pulpen Standard Hitam',
                'deskripsi_produk' => 'Pulpen tinta hitam untuk kebutuhan sehari-hari',
                'kategori_id' => 1,
                'harga_jual' => 2500.00,
                'harga_beli' => 2000.00,
                'stok_tersedia' => 100,
                'stok_minimum' => 10,
                'satuan' => 'pcs',
                'merk_produk' => 'Standard',
                'status_aktif' => true,
                'tanggal_input' => Carbon::now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kode_produk' => 'ATK002',
                'nama_produk' => 'Pensil 2B',
                'deskripsi_produk' => 'Pensil dengan ketebalan 2B',
                'kategori_id' => 1,
                'harga_jual' => 1500.00,
                'harga_beli' => 1200.00,
                'stok_tersedia' => 50,
                'stok_minimum' => 5,
                'satuan' => 'pcs',
                'merk_produk' => 'Faber Castell',
                'status_aktif' => true,
                'tanggal_input' => Carbon::now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}

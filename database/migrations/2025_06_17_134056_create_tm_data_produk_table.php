<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tm_data_produk', function (Blueprint $table) {
            $table->id();
            $table->string('kode_produk', 50)->unique();
            $table->string('nama_produk', 200);
            $table->text('deskripsi_produk')->nullable();
            $table->foreignId('kategori_id')->constrained('tm_data_kategori')->onDelete('cascade');
            $table->decimal('harga_jual', 12, 2);
            $table->decimal('harga_beli', 12, 2)->nullable();
            $table->integer('stok_tersedia')->default(0);
            $table->integer('stok_minimum')->default(5);
            $table->string('satuan', 20)->default('pcs');
            $table->string('merk_produk', 100)->nullable();
            $table->string('gambar_produk')->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->date('tanggal_input');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tm_data_produk');
    }
};

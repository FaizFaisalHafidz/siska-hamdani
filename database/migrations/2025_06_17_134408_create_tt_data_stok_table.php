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
        Schema::create('tt_data_stok', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produk_id')->constrained('tm_data_produk')->onDelete('cascade');
            $table->enum('jenis_transaksi', ['masuk', 'keluar', 'penyesuaian']);
            $table->integer('jumlah_stok');
            $table->integer('stok_sebelum');
            $table->integer('stok_sesudah');
            $table->string('referensi_transaksi', 100)->nullable(); // bisa invoice penjualan atau nomor pembelian
            $table->text('keterangan')->nullable();
            $table->datetime('tanggal_transaksi');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tt_data_stok');
    }
};

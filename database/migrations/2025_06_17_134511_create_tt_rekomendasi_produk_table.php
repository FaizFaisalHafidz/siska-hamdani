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
        Schema::create('tt_rekomendasi_produk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produk_utama_id')->constrained('tm_data_produk')->onDelete('cascade');
            $table->foreignId('produk_rekomendasi_id')->constrained('tm_data_produk')->onDelete('cascade');
            $table->decimal('skor_rekomendasi', 8, 6);
            $table->integer('frekuensi_bersamaan');
            $table->date('tanggal_analisis');
            $table->boolean('status_aktif')->default(true);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tt_rekomendasi_produk');
    }
};

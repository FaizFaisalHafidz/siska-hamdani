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
        Schema::create('tt_detail_penjualan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penjualan_id')->constrained('tt_data_penjualan')->onDelete('cascade');
            $table->foreignId('produk_id')->constrained('tm_data_produk')->onDelete('cascade');
            $table->integer('jumlah_beli');
            $table->decimal('harga_satuan', 12, 2);
            $table->decimal('diskon_item', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2);
            $table->text('catatan_item')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tt_detail_penjualan');
    }
};

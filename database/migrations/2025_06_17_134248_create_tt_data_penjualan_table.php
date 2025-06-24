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
        Schema::create('tt_data_penjualan', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_invoice', 50)->unique();
            $table->foreignId('pelanggan_id')->nullable()->constrained('tm_data_pelanggan')->onDelete('set null');
            $table->foreignId('kasir_id')->constrained('users')->onDelete('cascade');
            $table->decimal('total_belanja', 15, 2);
            $table->decimal('diskon_persen', 5, 2)->default(0);
            $table->decimal('diskon_nominal', 12, 2)->default(0);
            $table->decimal('pajak_persen', 5, 2)->default(0);
            $table->decimal('pajak_nominal', 12, 2)->default(0);
            $table->decimal('total_bayar', 15, 2);
            $table->decimal('jumlah_dibayar', 15, 2);
            $table->decimal('kembalian', 12, 2)->default(0);
            $table->enum('metode_pembayaran', ['tunai', 'transfer', 'qris', 'kartu_debit']);
            $table->text('catatan_penjualan')->nullable();
            $table->datetime('tanggal_penjualan');
            $table->enum('status_transaksi', ['selesai', 'pending', 'dibatalkan'])->default('selesai');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tt_data_penjualan');
    }
};

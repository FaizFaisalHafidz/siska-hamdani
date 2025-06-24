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
        Schema::create('tt_analisis_apriori', function (Blueprint $table) {
            $table->id();
            $table->json('kumpulan_item'); // Array product IDs yang sering dibeli bersamaan
            $table->decimal('nilai_support', 8, 6);
            $table->decimal('nilai_confidence', 8, 6)->nullable();
            $table->decimal('nilai_lift', 8, 4)->nullable();
            $table->integer('jumlah_transaksi');
            $table->integer('total_transaksi_periode');
            $table->date('tanggal_analisis');
            $table->date('periode_awal');
            $table->date('periode_akhir');
            $table->enum('jenis_analisis', ['frequent_itemset', 'association_rule']);
            $table->text('deskripsi_hasil')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tt_analisis_apriori');
    }
};

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
        Schema::table('tt_analisis_apriori', function (Blueprint $table) {
            // Add missing column
            $table->string('nama_produk', 500)->nullable()->after('kumpulan_item');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tt_analisis_apriori', function (Blueprint $table) {
            $table->dropColumn('nama_produk');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update ENUM to include 'cod' (Cash on Delivery)
        DB::statement("ALTER TABLE tt_data_penjualan MODIFY COLUMN metode_pembayaran ENUM('tunai','transfer','qris','kartu_debit','cod') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert ENUM to original values
        DB::statement("ALTER TABLE tt_data_penjualan MODIFY COLUMN metode_pembayaran ENUM('tunai','transfer','qris','kartu_debit') NOT NULL");
    }
};

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
        Schema::table('tt_data_penjualan', function (Blueprint $table) {
            // E-commerce specific columns
            if (!Schema::hasColumn('tt_data_penjualan', 'nomor_transaksi')) {
                $table->string('nomor_transaksi')->nullable()->unique()->after('nomor_invoice');
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'total_harga')) {
                $table->decimal('total_harga', 15, 0)->nullable()->after('total_belanja');
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'diskon')) {
                $table->decimal('diskon', 15, 0)->nullable()->default(0)->after('diskon_nominal');
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'catatan')) {
                $table->text('catatan')->nullable()->after('catatan_penjualan');
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'tanggal_transaksi')) {
                $table->timestamp('tanggal_transaksi')->nullable()->after('tanggal_penjualan');
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'status')) {
                $table->string('status')->nullable()->default('pending')->after('status_transaksi');
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'alamat_pengiriman')) {
                $table->text('alamat_pengiriman')->nullable();
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'biaya_pengiriman')) {
                $table->decimal('biaya_pengiriman', 15, 0)->nullable()->default(0);
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'kode_promo')) {
                $table->string('kode_promo')->nullable();
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'payment_proof')) {
                $table->string('payment_proof')->nullable();
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'payment_date')) {
                $table->timestamp('payment_date')->nullable();
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'payment_notes')) {
                $table->text('payment_notes')->nullable();
            }
            if (!Schema::hasColumn('tt_data_penjualan', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable();
            }
        });

        Schema::table('tt_detail_penjualan', function (Blueprint $table) {
            // Add alias columns for e-commerce compatibility
            if (!Schema::hasColumn('tt_detail_penjualan', 'id_penjualan')) {
                $table->unsignedBigInteger('id_penjualan')->nullable()->after('penjualan_id');
                $table->foreign('id_penjualan')->references('id')->on('tt_data_penjualan')->onDelete('cascade');
            }
            if (!Schema::hasColumn('tt_detail_penjualan', 'id_produk')) {
                $table->unsignedBigInteger('id_produk')->nullable()->after('produk_id');
                $table->foreign('id_produk')->references('id')->on('tm_data_produk')->onDelete('cascade');
            }
            if (!Schema::hasColumn('tt_detail_penjualan', 'jumlah_produk')) {
                $table->integer('jumlah_produk')->nullable()->after('jumlah_beli');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tt_data_penjualan', function (Blueprint $table) {
            $table->dropColumn([
                'nomor_transaksi',
                'total_harga',
                'diskon',
                'catatan',
                'tanggal_transaksi',
                'status',
                'alamat_pengiriman',
                'biaya_pengiriman',
                'kode_promo',
                'payment_proof',
                'payment_date',
                'payment_notes',
                'cancelled_at',
            ]);
        });

        Schema::table('tt_detail_penjualan', function (Blueprint $table) {
            $table->dropForeign(['id_penjualan']);
            $table->dropForeign(['id_produk']);
            $table->dropColumn([
                'id_penjualan',
                'id_produk',
                'jumlah_produk',
            ]);
        });
    }
};

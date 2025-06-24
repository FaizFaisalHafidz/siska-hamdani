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
        Schema::create('tm_data_supplier', function (Blueprint $table) {
            $table->id();
            $table->string('kode_supplier', 50)->unique();
            $table->string('nama_supplier', 200);
            $table->string('nama_kontak', 100)->nullable();
            $table->string('nomor_telepon', 20)->nullable();
            $table->string('email_supplier', 100)->nullable();
            $table->text('alamat_supplier')->nullable();
            $table->string('kota_supplier', 100)->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tm_data_supplier');
    }
};

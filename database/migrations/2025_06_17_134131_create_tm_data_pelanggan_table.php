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
        Schema::create('tm_data_pelanggan', function (Blueprint $table) {
            $table->id();
            $table->string('kode_pelanggan', 50)->unique();
            $table->string('nama_pelanggan', 200);
            $table->string('nomor_telepon', 20)->nullable();
            $table->string('email_pelanggan', 100)->nullable();
            $table->text('alamat_pelanggan')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['laki-laki', 'perempuan'])->nullable();
            $table->enum('jenis_pelanggan', ['umum', 'member', 'vip'])->default('umum');
            $table->date('tanggal_bergabung');
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tm_data_pelanggan');
    }
};

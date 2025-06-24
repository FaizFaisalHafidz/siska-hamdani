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
        Schema::table('users', function (Blueprint $table) {
            $table->string('kode_user', 50)->unique()->after('id');
            $table->string('nama_lengkap', 200)->after('name');
            $table->string('nomor_telepon', 20)->nullable()->after('email');
            $table->text('alamat')->nullable()->after('nomor_telepon');
            $table->date('tanggal_bergabung')->nullable()->after('alamat');
            $table->boolean('status_aktif')->default(true)->after('tanggal_bergabung');
            $table->datetime('terakhir_login')->nullable()->after('status_aktif');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'kode_user',
                'nama_lengkap', 
                'nomor_telepon',
                'alamat',
                'tanggal_bergabung',
                'status_aktif',
                'terakhir_login'
            ]);
        });
    }
};

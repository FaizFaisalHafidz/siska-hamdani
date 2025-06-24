<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tm_data_kategori', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kategori', 100);
            $table->text('deskripsi_kategori')->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tm_data_kategori');
    }
};
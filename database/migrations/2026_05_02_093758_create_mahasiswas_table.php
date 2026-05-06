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
        Schema::create('mahasiswas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('prodi_id')->constrained('prodis')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('nim')->unique();
            $table->string('nisn')->nullable()->unique();
            $table->string('nama');
            $table->string('email')->nullable()->index();
            $table->string('phone', 20)->nullable();
            $table->string('jenis_kelamin', 1)->index();
            $table->date('tanggal_lahir')->nullable()->index();
            $table->string('tempat_lahir')->nullable();
            $table->text('alamat')->nullable();
            $table->string('angkatan', 10)->index();
            $table->string('status_mahasiswa', 20)->default('aktif')->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['prodi_id', 'angkatan']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mahasiswas');
    }
};

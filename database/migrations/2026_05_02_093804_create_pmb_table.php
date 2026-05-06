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
        Schema::create('pmb', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('prodi_id')->nullable()->constrained('prodis')->cascadeOnUpdate()->nullOnDelete();
            $table->string('nomor_pendaftaran')->unique();
            $table->string('gelombang', 50)->index();
            $table->string('nama_lengkap');
            $table->string('email')->index();
            $table->string('phone', 20);
            $table->string('asal_sekolah')->nullable();
            $table->string('dokumen_ktp')->nullable();
            $table->string('dokumen_ijazah')->nullable();
            $table->string('dokumen_foto')->nullable();
            $table->enum('status_verifikasi', ['pending', 'verified', 'rejected'])->default('pending')->index();
            $table->enum('status_pembayaran', ['unpaid', 'paid', 'failed'])->default('unpaid')->index();
            $table->string('nim_generated')->nullable()->unique();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['prodi_id', 'gelombang']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pmb');
    }
};

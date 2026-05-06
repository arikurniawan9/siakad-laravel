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
        Schema::create('skripsi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('pembimbing_1_id')->nullable()->constrained('dosens')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('pembimbing_2_id')->nullable()->constrained('dosens')->cascadeOnUpdate()->nullOnDelete();
            $table->string('judul');
            $table->enum('status', ['pengajuan', 'bimbingan', 'seminar', 'sidang', 'lulus', 'ditolak'])->default('pengajuan')->index();
            $table->date('tanggal_pengajuan')->nullable();
            $table->date('tanggal_seminar')->nullable();
            $table->date('tanggal_sidang')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skripsi');
    }
};

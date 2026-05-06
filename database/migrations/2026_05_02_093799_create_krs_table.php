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
        Schema::create('krs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('dosen_wali_id')->nullable()->constrained('dosens')->cascadeOnUpdate()->nullOnDelete();
            $table->string('tahun_akademik', 20)->index();
            $table->unsignedTinyInteger('semester_akademik')->index();
            $table->unsignedTinyInteger('total_sks')->default(0);
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft')->index();
            $table->timestamp('approved_at')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['mahasiswa_id', 'tahun_akademik', 'semester_akademik'], 'krs_unique_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('krs');
    }
};

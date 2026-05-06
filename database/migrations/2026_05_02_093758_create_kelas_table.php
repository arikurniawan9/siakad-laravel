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
        Schema::create('kelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('dosen_id')->nullable()->constrained('dosens')->cascadeOnUpdate()->nullOnDelete();
            $table->string('kode_kelas', 20)->index();
            $table->string('tahun_akademik', 20)->index();
            $table->unsignedTinyInteger('semester_akademik')->index();
            $table->unsignedSmallInteger('kapasitas')->default(40);
            $table->string('ruangan')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['mata_kuliah_id', 'kode_kelas', 'tahun_akademik', 'semester_akademik'], 'kelas_unique_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kelas');
    }
};

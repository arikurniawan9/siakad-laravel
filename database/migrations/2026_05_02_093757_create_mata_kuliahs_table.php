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
        Schema::create('mata_kuliahs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prodi_id')->constrained('prodis')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('kurikulum_id')->nullable()->constrained('kurikulums')->cascadeOnUpdate()->nullOnDelete();
            $table->string('kode', 30)->index();
            $table->string('nama');
            $table->unsignedTinyInteger('semester')->index();
            $table->unsignedTinyInteger('sks');
            $table->enum('jenis', ['wajib', 'pilihan'])->default('wajib')->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['prodi_id', 'kode']);
            $table->index(['prodi_id', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mata_kuliahs');
    }
};

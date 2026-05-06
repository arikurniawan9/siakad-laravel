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
        Schema::create('kurikulums', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prodi_id')->constrained('prodis')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('nama');
            $table->string('kode', 30)->unique();
            $table->year('tahun_berlaku')->index();
            $table->boolean('is_active')->default(false)->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['prodi_id', 'tahun_berlaku']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kurikulums');
    }
};

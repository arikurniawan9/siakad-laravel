<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarif_keuangans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jenis_tagihan_id')->constrained('jenis_tagihans')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('tahun_akademik', 20)->index();
            $table->unsignedTinyInteger('semester_akademik')->nullable()->index();
            $table->decimal('nominal', 14, 2);
            $table->text('keterangan')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['jenis_tagihan_id', 'tahun_akademik', 'semester_akademik'], 'tarif_uniq_jenis_tahun_sem');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarif_keuangans');
    }
};


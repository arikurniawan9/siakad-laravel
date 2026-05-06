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
        Schema::create('tagihans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('kode_tagihan')->unique();
            $table->string('jenis', 30)->index();
            $table->string('tahun_akademik', 20)->nullable()->index();
            $table->unsignedTinyInteger('semester_akademik')->nullable()->index();
            $table->decimal('nominal', 14, 2);
            $table->decimal('potongan', 14, 2)->default(0);
            $table->decimal('denda', 14, 2)->default(0);
            $table->decimal('total', 14, 2);
            $table->date('jatuh_tempo')->nullable()->index();
            $table->enum('status', ['pending', 'partial', 'paid', 'cancelled'])->default('pending')->index();
            $table->timestamp('paid_at')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['mahasiswa_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tagihans');
    }
};

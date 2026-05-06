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
        Schema::create('presensis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('krs_detail_id')->constrained('krs_details')->cascadeOnUpdate()->cascadeOnDelete();
            $table->date('tanggal')->index();
            $table->enum('status', ['hadir', 'izin', 'sakit', 'alpa'])->index();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['krs_detail_id', 'tanggal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presensis');
    }
};

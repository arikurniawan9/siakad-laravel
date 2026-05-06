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
        Schema::create('dosens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('prodi_id')->nullable()->constrained('prodis')->cascadeOnUpdate()->nullOnDelete();
            $table->string('nidn')->unique();
            $table->string('nip')->nullable()->unique();
            $table->string('nama');
            $table->string('email')->nullable()->index();
            $table->string('phone', 20)->nullable();
            $table->string('status_dosen', 30)->default('tetap')->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['prodi_id', 'status_dosen']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dosens');
    }
};

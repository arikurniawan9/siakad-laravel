<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->foreignId('tahun_akademik_id')->nullable()->after('kode_kelas')->constrained('tahun_akademiks')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('ruangan_id')->nullable()->after('kapasitas')->constrained('ruangans')->cascadeOnUpdate()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tahun_akademik_id');
            $table->dropConstrainedForeignId('ruangan_id');
        });
    }
};

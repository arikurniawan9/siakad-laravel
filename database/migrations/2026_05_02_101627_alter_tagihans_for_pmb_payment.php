<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE tagihans DROP FOREIGN KEY tagihans_mahasiswa_id_foreign');
        DB::statement('ALTER TABLE tagihans MODIFY mahasiswa_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE tagihans ADD CONSTRAINT tagihans_mahasiswa_id_foreign FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswas(id) ON DELETE RESTRICT ON UPDATE CASCADE');

        Schema::table('tagihans', function (Blueprint $table) {
            $table->foreignId('pmb_id')->nullable()->after('mahasiswa_id')->constrained('pmb')->cascadeOnUpdate()->nullOnDelete();
            $table->index(['pmb_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('tagihans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pmb_id');
        });

        DB::statement('ALTER TABLE tagihans DROP FOREIGN KEY tagihans_mahasiswa_id_foreign');
        DB::statement('ALTER TABLE tagihans MODIFY mahasiswa_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE tagihans ADD CONSTRAINT tagihans_mahasiswa_id_foreign FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswas(id) ON DELETE RESTRICT ON UPDATE CASCADE');
    }
};

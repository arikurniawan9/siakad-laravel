<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE pembayarans DROP FOREIGN KEY pembayarans_mahasiswa_id_foreign');
        DB::statement('ALTER TABLE pembayarans MODIFY mahasiswa_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE pembayarans ADD CONSTRAINT pembayarans_mahasiswa_id_foreign FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswas(id) ON DELETE RESTRICT ON UPDATE CASCADE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE pembayarans DROP FOREIGN KEY pembayarans_mahasiswa_id_foreign');
        DB::statement('ALTER TABLE pembayarans MODIFY mahasiswa_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE pembayarans ADD CONSTRAINT pembayarans_mahasiswa_id_foreign FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswas(id) ON DELETE RESTRICT ON UPDATE CASCADE');
    }
};


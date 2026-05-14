<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tagihan_items', function (Blueprint $table) {
            $table->date('jatuh_tempo')->nullable()->after('total')->index();
        });
    }

    public function down(): void
    {
        Schema::table('tagihan_items', function (Blueprint $table) {
            $table->dropColumn('jatuh_tempo');
        });
    }
};

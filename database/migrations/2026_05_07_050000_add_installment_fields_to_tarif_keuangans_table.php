<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarif_keuangans', function (Blueprint $table) {
            $table->boolean('can_installment')->default(false)->index()->after('is_active');
            $table->unsignedTinyInteger('installment_max')->nullable()->after('can_installment');
            $table->unsignedTinyInteger('installment_default')->nullable()->after('installment_max');
        });
    }

    public function down(): void
    {
        Schema::table('tarif_keuangans', function (Blueprint $table) {
            $table->dropColumn(['can_installment', 'installment_max', 'installment_default']);
        });
    }
};


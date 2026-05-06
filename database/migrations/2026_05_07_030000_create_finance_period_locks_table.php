<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_period_locks', function (Blueprint $table) {
            $table->id();
            $table->string('tahun_akademik', 20)->index();
            $table->unsignedTinyInteger('semester_akademik')->nullable()->index();
            $table->timestamp('locked_at')->useCurrent()->index();
            $table->foreignId('locked_by_user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->text('reason')->nullable();

            $table->unique(['tahun_akademik', 'semester_akademik'], 'finance_period_locks_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_period_locks');
    }
};


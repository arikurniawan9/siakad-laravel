<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('database_maintenance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->string('action', 30)->index();
            $table->string('status', 20)->default('success')->index();
            $table->string('filename')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('message')->nullable();
            $table->timestamp('executed_at')->useCurrent()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('database_maintenance_logs');
    }
};


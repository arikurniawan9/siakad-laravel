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
        Schema::create('transaksis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tagihan_id')->constrained('tagihans')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('order_id')->unique();
            $table->string('payment_type', 50)->nullable();
            $table->string('transaction_id')->nullable()->index();
            $table->string('fraud_status', 50)->nullable();
            $table->decimal('gross_amount', 14, 2);
            $table->enum('status', ['pending', 'success', 'failed', 'expired', 'cancelled'])->default('pending')->index();
            $table->string('snap_token')->nullable();
            $table->string('snap_redirect_url')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tagihan_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksis');
    }
};

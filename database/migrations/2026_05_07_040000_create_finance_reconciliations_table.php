<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaksi_id')->nullable()->constrained('transaksis')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('tagihan_id')->nullable()->constrained('tagihans')->cascadeOnUpdate()->nullOnDelete();
            $table->string('provider', 20)->default('midtrans')->index();
            $table->string('order_id', 60)->index();
            $table->decimal('amount', 14, 2);
            $table->string('payment_type', 50)->nullable();
            $table->string('transaction_id', 60)->nullable();
            $table->enum('status', ['pending', 'resolved', 'ignored'])->default('pending')->index();
            $table->text('reason')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
            $table->timestamp('resolved_at')->nullable()->index();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();

            $table->unique(['provider', 'order_id'], 'finance_reconciliations_provider_order_unique');
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_reconciliations');
    }
};


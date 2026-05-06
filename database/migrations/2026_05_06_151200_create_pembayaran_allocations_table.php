<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembayaran_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pembayaran_id')->constrained('pembayarans')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('tagihan_item_id')->constrained('tagihan_items')->cascadeOnUpdate()->restrictOnDelete();
            $table->decimal('amount', 14, 2);
            $table->timestamps();

            $table->index(['pembayaran_id', 'tagihan_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembayaran_allocations');
    }
};


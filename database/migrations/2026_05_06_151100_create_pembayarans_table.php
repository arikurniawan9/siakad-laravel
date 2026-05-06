<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembayarans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tagihan_id')->constrained('tagihans')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('jenis_pembayaran_id')->nullable()->constrained('jenis_pembayarans')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('provider', 20)->default('manual')->index();
            $table->string('reference', 100)->nullable()->index();
            $table->decimal('amount', 14, 2);
            $table->timestamp('paid_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tagihan_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembayarans');
    }
};


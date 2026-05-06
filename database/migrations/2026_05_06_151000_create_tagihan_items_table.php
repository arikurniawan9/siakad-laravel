<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tagihan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tagihan_id')->constrained('tagihans')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('jenis_tagihan_id')->nullable()->constrained('jenis_tagihans')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('kode', 30)->index();
            $table->string('nama', 120);
            $table->decimal('nominal', 14, 2);
            $table->decimal('potongan', 14, 2)->default(0);
            $table->decimal('denda', 14, 2)->default(0);
            $table->decimal('total', 14, 2);
            $table->text('keterangan')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0)->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tagihan_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tagihan_items');
    }
};


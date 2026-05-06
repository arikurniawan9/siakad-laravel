<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PembayaranAllocation extends Model
{
    use HasFactory;

    protected $table = 'pembayaran_allocations';

    protected $fillable = [
        'pembayaran_id',
        'tagihan_item_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function pembayaran(): BelongsTo
    {
        return $this->belongsTo(Pembayaran::class, 'pembayaran_id');
    }

    public function tagihanItem(): BelongsTo
    {
        return $this->belongsTo(TagihanItem::class, 'tagihan_item_id');
    }
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaksi extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'transaksis';

    protected $fillable = [
        'tagihan_id',
        'order_id',
        'payment_type',
        'transaction_id',
        'fraud_status',
        'gross_amount',
        'status',
        'snap_token',
        'snap_redirect_url',
        'payload',
        'paid_at',
    ];

    protected $casts = ['payload' => 'array', 'paid_at' => 'datetime'];

    public function tagihan(): BelongsTo
    {
        return $this->belongsTo(Tagihan::class);
    }
}

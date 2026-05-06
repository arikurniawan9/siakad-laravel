<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceReconciliation extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'finance_reconciliations';

    protected $fillable = [
        'transaksi_id',
        'tagihan_id',
        'provider',
        'order_id',
        'amount',
        'payment_type',
        'transaction_id',
        'status',
        'reason',
        'resolution_notes',
        'created_at',
        'resolved_at',
        'resolved_by_user_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function transaksi(): BelongsTo
    {
        return $this->belongsTo(Transaksi::class, 'transaksi_id');
    }

    public function tagihan(): BelongsTo
    {
        return $this->belongsTo(Tagihan::class, 'tagihan_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}


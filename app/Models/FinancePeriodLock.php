<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancePeriodLock extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'finance_period_locks';

    protected $fillable = [
        'tahun_akademik',
        'semester_akademik',
        'locked_at',
        'locked_by_user_id',
        'reason',
    ];

    protected $casts = [
        'semester_akademik' => 'integer',
        'locked_at' => 'datetime',
    ];

    public function lockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by_user_id');
    }
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class KrsDetail extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'krs_details';

    protected $fillable = ['krs_id', 'kelas_id', 'sks', 'status'];

    public function krs(): BelongsTo
    {
        return $this->belongsTo(Krs::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function nilai(): HasOne
    {
        return $this->hasOne(Nilai::class);
    }
}

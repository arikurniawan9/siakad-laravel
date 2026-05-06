<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Presensi extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'presensis';

    protected $fillable = ['krs_detail_id', 'tanggal', 'status', 'catatan'];

    protected $casts = ['tanggal' => 'date'];

    public function krsDetail(): BelongsTo
    {
        return $this->belongsTo(KrsDetail::class);
    }
}

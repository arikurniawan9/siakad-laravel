<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Nilai extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'nilais';

    protected $fillable = [
        'krs_detail_id',
        'nilai_angka',
        'nilai_huruf',
        'bobot',
        'input_by',
        'published_at',
    ];

    protected $casts = ['published_at' => 'datetime'];

    public function krsDetail(): BelongsTo
    {
        return $this->belongsTo(KrsDetail::class);
    }

    public function dosenInput(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'input_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Krs extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'krs';

    protected $fillable = [
        'mahasiswa_id',
        'dosen_wali_id',
        'tahun_akademik_id',
        'tahun_akademik',
        'semester_akademik',
        'total_sks',
        'status',
        'approved_at',
        'approved_by',
        'rejected_by',
        'rejected_at',
        'catatan',
    ];

    protected $casts = ['approved_at' => 'datetime', 'rejected_at' => 'datetime'];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function dosenWali(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'dosen_wali_id');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function tahunAkademikRef(): BelongsTo
    {
        return $this->belongsTo(TahunAkademik::class, 'tahun_akademik_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(KrsDetail::class);
    }
}

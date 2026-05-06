<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Skripsi extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'skripsi';

    protected $fillable = [
        'mahasiswa_id',
        'pembimbing_1_id',
        'pembimbing_2_id',
        'judul',
        'status',
        'tanggal_pengajuan',
        'tanggal_seminar',
        'tanggal_sidang',
        'catatan',
    ];

    protected $casts = [
        'tanggal_pengajuan' => 'date',
        'tanggal_seminar' => 'date',
        'tanggal_sidang' => 'date',
    ];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}

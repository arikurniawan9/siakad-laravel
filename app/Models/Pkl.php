<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pkl extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pkl';

    protected $fillable = [
        'mahasiswa_id',
        'dosen_pembimbing_id',
        'instansi',
        'alamat_instansi',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
        'logbook_ringkas',
        'nilai_akhir',
        'catatan',
    ];

    protected $casts = ['tanggal_mulai' => 'date', 'tanggal_selesai' => 'date'];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}

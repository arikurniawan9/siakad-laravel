<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Jadwal extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['kelas_id', 'hari_ke', 'jam_mulai', 'jam_selesai', 'ruangan', 'mode'];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }
}

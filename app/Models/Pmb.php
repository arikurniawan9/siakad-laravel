<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pmb extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pmb';

    protected $fillable = [
        'user_id',
        'prodi_id',
        'nomor_pendaftaran',
        'gelombang',
        'nama_lengkap',
        'email',
        'phone',
        'asal_sekolah',
        'dokumen_ktp',
        'dokumen_ijazah',
        'dokumen_foto',
        'status_verifikasi',
        'status_pembayaran',
        'nim_generated',
        'catatan',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function prodi(): BelongsTo
    {
        return $this->belongsTo(Prodi::class);
    }

    public function tagihans(): HasMany
    {
        return $this->hasMany(Tagihan::class);
    }
}

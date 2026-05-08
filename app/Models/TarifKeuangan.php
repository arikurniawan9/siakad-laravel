<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TarifKeuangan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tarif_keuangans';

    protected $fillable = [
        'jenis_tagihan_id',
        'tahun_akademik',
        'semester_akademik',
        'nominal',
        'keterangan',
        'is_active',
        'can_installment',
        'installment_max',
        'installment_default',
    ];

    protected $casts = [
        'semester_akademik' => 'integer',
        'nominal' => 'decimal:2',
        'is_active' => 'boolean',
        'can_installment' => 'boolean',
        'installment_max' => 'integer',
        'installment_default' => 'integer',
    ];

    public function jenisTagihan(): BelongsTo
    {
        return $this->belongsTo(JenisTagihan::class, 'jenis_tagihan_id');
    }
}

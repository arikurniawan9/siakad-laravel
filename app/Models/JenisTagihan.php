<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JenisTagihan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jenis_tagihans';

    protected $fillable = [
        'kode',
        'nama',
        'keterangan',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function tarifs(): HasMany
    {
        return $this->hasMany(TarifKeuangan::class, 'jenis_tagihan_id');
    }
}


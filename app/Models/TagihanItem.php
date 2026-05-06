<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TagihanItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tagihan_items';

    protected $fillable = [
        'tagihan_id',
        'jenis_tagihan_id',
        'kode',
        'nama',
        'nominal',
        'potongan',
        'denda',
        'total',
        'keterangan',
        'sort_order',
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
        'potongan' => 'decimal:2',
        'denda' => 'decimal:2',
        'total' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    public function tagihan(): BelongsTo
    {
        return $this->belongsTo(Tagihan::class);
    }

    public function jenisTagihan(): BelongsTo
    {
        return $this->belongsTo(JenisTagihan::class, 'jenis_tagihan_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PembayaranAllocation::class, 'tagihan_item_id');
    }
}


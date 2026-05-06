<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JenisPembayaran extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jenis_pembayarans';

    protected $fillable = [
        'kode',
        'nama',
        'provider',
        'payment_type',
        'keterangan',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Jurusan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['kode', 'nama', 'deskripsi', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function prodis(): HasMany
    {
        return $this->hasMany(Prodi::class);
    }
}

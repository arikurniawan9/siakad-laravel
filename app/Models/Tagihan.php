<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Tagihan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tagihans';

    protected $fillable = [
        'mahasiswa_id',
        'pmb_id',
        'kode_tagihan',
        'jenis',
        'tahun_akademik',
        'semester_akademik',
        'nominal',
        'potongan',
        'denda',
        'total',
        'jatuh_tempo',
        'status',
        'paid_at',
        'keterangan',
    ];

    protected $casts = ['jatuh_tempo' => 'date', 'paid_at' => 'datetime'];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function transaksis(): HasMany
    {
        return $this->hasMany(Transaksi::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TagihanItem::class);
    }

    public function pembayarans(): HasMany
    {
        return $this->hasMany(Pembayaran::class);
    }

    public function pmb(): BelongsTo
    {
        return $this->belongsTo(Pmb::class);
    }

    public function paidAmount(): float
    {
        $allocationSum = DB::table('pembayaran_allocations')
            ->join('pembayarans', 'pembayarans.id', '=', 'pembayaran_allocations.pembayaran_id')
            ->whereNull('pembayarans.deleted_at')
            ->where('pembayarans.tagihan_id', $this->id)
            ->sum('pembayaran_allocations.amount');

        $allocationSum = (float) $allocationSum;

        $hasPembayaran = DB::table('pembayarans')
            ->whereNull('deleted_at')
            ->where('tagihan_id', $this->id)
            ->exists();

        if (! $hasPembayaran) {
            $trxSum = DB::table('transaksis')
                ->whereNull('deleted_at')
                ->where('tagihan_id', $this->id)
                ->where('status', 'success')
                ->sum('gross_amount');

            return (float) $trxSum;
        }

        return $allocationSum;
    }

    public function refreshStatusFromPayments(): void
    {
        $paid = $this->paidAmount();
        $total = (float) $this->total;

        $nextStatus = 'pending';
        if ($paid > 0 && $paid < $total) {
            $nextStatus = 'partial';
        } elseif ($total > 0 && $paid >= $total) {
            $nextStatus = 'paid';
        }

        $this->update([
            'status' => $nextStatus,
            'paid_at' => $nextStatus === 'paid' ? now() : null,
        ]);
    }
}

<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class PmbPendingExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function __construct(private array $rows = [])
    {
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
            'nomor_pendaftaran',
            'nama_lengkap',
            'prodi',
            'gelombang',
            'email',
            'phone',
            'asal_sekolah',
            'status_verifikasi',
            'status_pembayaran',
            'catatan',
            'created_at',
        ];
    }
}

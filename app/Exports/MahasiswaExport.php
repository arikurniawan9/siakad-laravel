<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class MahasiswaExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function __construct(private readonly array $rows)
    {
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
            'nim',
            'nisn',
            'nama',
            'prodi_kode',
            'prodi_nama',
            'email',
            'phone',
            'jenis_kelamin',
            'tanggal_lahir',
            'tempat_lahir',
            'alamat',
            'angkatan',
            'status_mahasiswa',
        ];
    }
}


<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class MahasiswaTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['TI01', '20260001', '1234567890', 'Ahmad Naufal', 'ahmad@student.ac.id', '081234567890', 'L', '2006-01-15', 'Bandung', 'Jl. Contoh No. 1', '2026', 'aktif'],
            ['TI01', '20260002', '', 'Siti Aisyah', 'siti@student.ac.id', '081298765432', 'P', '2006-07-22', 'Jakarta', 'Jl. Contoh No. 2', '2026', 'aktif'],
        ];
    }

    public function headings(): array
    {
        return [
            'prodi_kode',
            'nim',
            'nisn',
            'nama',
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


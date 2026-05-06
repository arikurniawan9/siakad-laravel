<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class MataKuliahTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['IF', 'IF-2024', 'IF101', 'Algoritma dan Pemrograman', 1, 3, 'wajib', 1],
            ['IF', 'IF-2024', 'IF102', 'Basis Data', 2, 3, 'wajib', 0],
        ];
    }

    public function headings(): array
    {
        return ['prodi_kode', 'kurikulum_kode', 'kode', 'nama', 'semester', 'sks', 'jenis', 'is_active'];
    }
}

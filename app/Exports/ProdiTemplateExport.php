<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class ProdiTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['FTI', 'IF', 'Informatika', 'S1', 8, 144, 1],
            ['FEB', 'MBS', 'Manajemen Bisnis Syariah', 'S1', 8, 144, 0],
        ];
    }

    public function headings(): array
    {
        return ['jurusan_kode', 'kode', 'nama', 'jenjang', 'semester_total', 'sks_lulus', 'is_active'];
    }
}

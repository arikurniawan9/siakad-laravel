<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class RuanganTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['R-101', 'Ruang 101', 'Gedung A', 40, 1],
            ['R-102', 'Ruang 102', 'Gedung A', 30, 0],
        ];
    }

    public function headings(): array
    {
        return ['kode', 'nama', 'gedung', 'kapasitas', 'is_active'];
    }
}

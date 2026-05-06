<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class TahunAkademikTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['2025/2026', 'Ganjil', 1, '2025-08-01', '2026-01-31', '1'],
            ['2025/2026', 'Genap', 2, '2026-02-01', '2026-07-31', '0'],
        ];
    }

    public function headings(): array
    {
        return ['kode', 'nama', 'semester_aktif', 'tanggal_mulai', 'tanggal_selesai', 'is_active'];
    }
}

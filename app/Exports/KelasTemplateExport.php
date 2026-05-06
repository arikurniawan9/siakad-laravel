<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class KelasTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['IF101', '1987654321', '2025/2026', 'IF101-A', '2025/2026', 1, 40, 'R-101', 1],
            ['IF102', '1987654321', '2025/2026', 'IF102-A', '2025/2026', 2, 35, 'R-102', 0],
        ];
    }

    public function headings(): array
    {
        return ['mata_kuliah_kode', 'dosen_nidn', 'tahun_akademik_kode', 'kode_kelas', 'tahun_akademik', 'semester_akademik', 'kapasitas', 'ruangan_kode', 'is_active'];
    }
}

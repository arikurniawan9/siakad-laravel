<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class KurikulumTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['IF', 'IF-2024', 'Kurikulum Informatika 2024', 2024, 1],
            ['MBS', 'MBS-2023', 'Kurikulum MBS 2023', 2023, 0],
        ];
    }

    public function headings(): array
    {
        return ['prodi_kode', 'kode', 'nama', 'tahun_berlaku', 'is_active'];
    }
}

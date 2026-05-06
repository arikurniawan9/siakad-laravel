<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class JurusanTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['FTI', 'Teknik Informatika', 'Fokus pada bidang rekayasa perangkat lunak'],
            ['FIS', 'Ilmu Sosial', 'Bidang kajian sosial dan humaniora'],
        ];
    }

    public function headings(): array
    {
        return ['kode', 'nama', 'deskripsi'];
    }
}

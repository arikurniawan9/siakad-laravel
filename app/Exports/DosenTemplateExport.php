<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class DosenTemplateExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function array(): array
    {
        return [
            ['DSN001', '198001012010011001', 'Dr. Ahmad Fajar, M.Pd.', 'ahmad@stai.ac.id', '081234567890', 'tetap'],
            ['DSN002', '', 'Siti Rahma, M.Kom.', 'siti@stai.ac.id', '081298765432', 'tidak_tetap'],
        ];
    }

    public function headings(): array
    {
        return ['nidn', 'nip', 'nama', 'email', 'phone', 'status_dosen'];
    }
}

<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class RuanganExport implements FromArray, WithHeadings, WithStrictNullComparison
{
    public function __construct(private array $rows = [])
    {
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return ['kode', 'nama', 'gedung', 'kapasitas', 'is_active'];
    }
}

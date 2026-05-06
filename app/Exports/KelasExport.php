<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class KelasExport implements FromArray, WithHeadings, WithStrictNullComparison
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
        return ['mata_kuliah_kode', 'dosen_nidn', 'tahun_akademik_kode', 'kode_kelas', 'tahun_akademik', 'semester_akademik', 'kapasitas', 'ruangan_kode', 'is_active'];
    }
}

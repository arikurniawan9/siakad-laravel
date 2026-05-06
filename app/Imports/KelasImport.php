<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class KelasImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public array $rows = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $this->rows[] = [
                'row_number' => $index + 2,
                'mata_kuliah_kode' => (string) ($row['mata_kuliah_kode'] ?? $row['matakuliah_kode'] ?? ''),
                'dosen_nidn' => (string) ($row['dosen_nidn'] ?? ''),
                'tahun_akademik_kode' => (string) ($row['tahun_akademik_kode'] ?? $row['tahun'] ?? ''),
                'kode_kelas' => (string) ($row['kode_kelas'] ?? ''),
                'tahun_akademik' => (string) ($row['tahun_akademik'] ?? ''),
                'semester_akademik' => (string) ($row['semester_akademik'] ?? '1'),
                'kapasitas' => (string) ($row['kapasitas'] ?? '40'),
                'ruangan_kode' => (string) ($row['ruangan_kode'] ?? ''),
                'is_active' => (string) ($row['is_active'] ?? '0'),
            ];
        }
    }
}

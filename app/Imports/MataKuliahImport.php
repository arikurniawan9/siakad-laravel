<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class MataKuliahImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public array $rows = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $this->rows[] = [
                'row_number' => $index + 2,
                'prodi_kode' => (string) ($row['prodi_kode'] ?? $row['prodi'] ?? ''),
                'kurikulum_kode' => (string) ($row['kurikulum_kode'] ?? $row['kurikulum'] ?? ''),
                'kode' => (string) ($row['kode'] ?? ''),
                'nama' => (string) ($row['nama'] ?? ''),
                'semester' => (string) ($row['semester'] ?? '1'),
                'sks' => (string) ($row['sks'] ?? '2'),
                'jenis' => (string) ($row['jenis'] ?? 'wajib'),
                'is_active' => (string) ($row['is_active'] ?? '0'),
            ];
        }
    }
}

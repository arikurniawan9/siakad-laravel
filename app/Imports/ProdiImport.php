<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProdiImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public array $rows = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $this->rows[] = [
                'row_number' => $index + 2,
                'jurusan_kode' => (string) ($row['jurusan_kode'] ?? $row['jurusan'] ?? ''),
                'kode' => (string) ($row['kode'] ?? ''),
                'nama' => (string) ($row['nama'] ?? ''),
                'jenjang' => (string) ($row['jenjang'] ?? 'S1'),
                'semester_total' => (string) ($row['semester_total'] ?? '8'),
                'sks_lulus' => (string) ($row['sks_lulus'] ?? $row['sks_lulus_opsional_auto'] ?? ''),
                'is_active' => (string) ($row['is_active'] ?? '0'),
            ];
        }
    }
}

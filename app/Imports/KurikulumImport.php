<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class KurikulumImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public array $rows = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $this->rows[] = [
                'row_number' => $index + 2,
                'prodi_kode' => (string) ($row['prodi_kode'] ?? $row['prodi'] ?? ''),
                'kode' => (string) ($row['kode'] ?? ''),
                'nama' => (string) ($row['nama'] ?? ''),
                'tahun_berlaku' => (string) ($row['tahun_berlaku'] ?? date('Y')),
                'is_active' => (string) ($row['is_active'] ?? '0'),
            ];
        }
    }
}

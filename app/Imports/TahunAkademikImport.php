<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class TahunAkademikImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public array $rows = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $this->rows[] = [
                'row_number' => $index + 2,
                'kode' => (string) ($row['kode'] ?? ''),
                'nama' => (string) ($row['nama'] ?? ''),
                'semester_aktif' => (string) ($row['semester_aktif'] ?? '1'),
                'tanggal_mulai' => (string) ($row['tanggal_mulai'] ?? ''),
                'tanggal_selesai' => (string) ($row['tanggal_selesai'] ?? ''),
                'is_active' => (string) ($row['is_active'] ?? '0'),
            ];
        }
    }
}

<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class RuanganImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public array $rows = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $this->rows[] = [
                'row_number' => $index + 2,
                'kode' => (string) ($row['kode'] ?? ''),
                'nama' => (string) ($row['nama'] ?? ''),
                'gedung' => (string) ($row['gedung'] ?? ''),
                'kapasitas' => (string) ($row['kapasitas'] ?? '40'),
                'is_active' => (string) ($row['is_active'] ?? '0'),
            ];
        }
    }
}

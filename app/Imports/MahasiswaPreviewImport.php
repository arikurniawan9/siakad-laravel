<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class MahasiswaPreviewImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public array $rows = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $this->rows[] = [
                'row_number' => $index + 2,
                'prodi_kode' => (string) ($row['prodi_kode'] ?? ''),
                'nim' => (string) ($row['nim'] ?? ''),
                'nisn' => (string) ($row['nisn'] ?? ''),
                'nama' => (string) ($row['nama'] ?? ''),
                'email' => (string) ($row['email'] ?? ''),
                'phone' => (string) ($row['phone'] ?? ''),
                'jenis_kelamin' => (string) ($row['jenis_kelamin'] ?? ''),
                'tanggal_lahir' => (string) ($row['tanggal_lahir'] ?? ''),
                'tempat_lahir' => (string) ($row['tempat_lahir'] ?? ''),
                'alamat' => (string) ($row['alamat'] ?? ''),
                'angkatan' => (string) ($row['angkatan'] ?? ''),
                'status_mahasiswa' => (string) ($row['status_mahasiswa'] ?? 'aktif'),
            ];
        }
    }
}


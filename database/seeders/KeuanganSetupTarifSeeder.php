<?php

namespace Database\Seeders;

use App\Models\JenisTagihan;
use App\Models\TarifKeuangan;
use App\Models\TahunAkademik;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class KeuanganSetupTarifSeeder extends Seeder
{
    public function run(): void
    {
        $hasInstallmentColumns = Schema::hasColumn('tarif_keuangans', 'can_installment')
            && Schema::hasColumn('tarif_keuangans', 'installment_max')
            && Schema::hasColumn('tarif_keuangans', 'installment_default');

        $tahunAkademiks = [
            [
                'kode' => '2025/2026',
                'nama' => 'TA 2025/2026',
                'semester_aktif' => 1,
                'tanggal_mulai' => '2025-07-01',
                'tanggal_selesai' => '2026-06-30',
                'is_active' => true,
            ],
            [
                'kode' => '2024/2025',
                'nama' => 'TA 2024/2025',
                'semester_aktif' => 2,
                'tanggal_mulai' => '2024-07-01',
                'tanggal_selesai' => '2025-06-30',
                'is_active' => false,
            ],
        ];

        foreach ($tahunAkademiks as $row) {
            $tahun = TahunAkademik::withTrashed()->firstOrNew(['kode' => $row['kode']]);
            $tahun->fill($row);
            $tahun->deleted_at = null;
            $tahun->save();
        }

        $jenisRows = [
            ['kode' => 'SPP', 'nama' => 'SPP Semester', 'sort_order' => 1, 'keterangan' => 'Biaya pokok per semester', 'is_active' => true],
            ['kode' => 'SKS', 'nama' => 'Biaya SKS', 'sort_order' => 2, 'keterangan' => 'Biaya berdasarkan jumlah SKS', 'is_active' => true],
            ['kode' => 'PRAKTIKUM', 'nama' => 'Biaya Praktikum', 'sort_order' => 3, 'keterangan' => 'Biaya kegiatan praktikum', 'is_active' => true],
            ['kode' => 'UJIAN', 'nama' => 'Biaya Ujian', 'sort_order' => 4, 'keterangan' => 'Biaya UTS/UAS', 'is_active' => true],
            ['kode' => 'DAFTAR_ULANG', 'nama' => 'Daftar Ulang', 'sort_order' => 5, 'keterangan' => 'Biaya registrasi ulang semester', 'is_active' => true],
        ];

        $jenisByKode = [];
        foreach ($jenisRows as $row) {
            $jenis = JenisTagihan::withTrashed()->firstOrNew(['kode' => $row['kode']]);
            $jenis->fill($row);
            $jenis->deleted_at = null;
            $jenis->save();
            $jenisByKode[$row['kode']] = $jenis;
        }

        $tarifRows = [
            // Semester ganjil 2025/2026
            ['kode' => 'SPP', 'tahun' => '2025/2026', 'semester' => 1, 'nominal' => 2500000, 'can_installment' => true, 'installment_max' => 5, 'installment_default' => 3, 'keterangan' => 'SPP ganjil 2025/2026'],
            ['kode' => 'SKS', 'tahun' => '2025/2026', 'semester' => 1, 'nominal' => 150000, 'can_installment' => false, 'installment_max' => null, 'installment_default' => null, 'keterangan' => 'Tarif per SKS ganjil 2025/2026'],
            ['kode' => 'PRAKTIKUM', 'tahun' => '2025/2026', 'semester' => 1, 'nominal' => 350000, 'can_installment' => false, 'installment_max' => null, 'installment_default' => null, 'keterangan' => 'Praktikum ganjil 2025/2026'],
            ['kode' => 'UJIAN', 'tahun' => '2025/2026', 'semester' => 1, 'nominal' => 300000, 'can_installment' => false, 'installment_max' => null, 'installment_default' => null, 'keterangan' => 'Ujian ganjil 2025/2026'],
            ['kode' => 'DAFTAR_ULANG', 'tahun' => '2025/2026', 'semester' => 1, 'nominal' => 400000, 'can_installment' => false, 'installment_max' => null, 'installment_default' => null, 'keterangan' => 'Daftar ulang ganjil 2025/2026'],

            // Semester genap 2025/2026
            ['kode' => 'SPP', 'tahun' => '2025/2026', 'semester' => 2, 'nominal' => 2500000, 'can_installment' => true, 'installment_max' => 5, 'installment_default' => 3, 'keterangan' => 'SPP genap 2025/2026'],
            ['kode' => 'SKS', 'tahun' => '2025/2026', 'semester' => 2, 'nominal' => 150000, 'can_installment' => false, 'installment_max' => null, 'installment_default' => null, 'keterangan' => 'Tarif per SKS genap 2025/2026'],
            ['kode' => 'PRAKTIKUM', 'tahun' => '2025/2026', 'semester' => 2, 'nominal' => 350000, 'can_installment' => false, 'installment_max' => null, 'installment_default' => null, 'keterangan' => 'Praktikum genap 2025/2026'],
            ['kode' => 'UJIAN', 'tahun' => '2025/2026', 'semester' => 2, 'nominal' => 300000, 'can_installment' => false, 'installment_max' => null, 'installment_default' => null, 'keterangan' => 'Ujian genap 2025/2026'],
            ['kode' => 'DAFTAR_ULANG', 'tahun' => '2025/2026', 'semester' => 2, 'nominal' => 400000, 'can_installment' => false, 'installment_max' => null, 'installment_default' => null, 'keterangan' => 'Daftar ulang genap 2025/2026'],
        ];

        foreach ($tarifRows as $row) {
            $jenis = $jenisByKode[$row['kode']] ?? null;
            if (! $jenis) {
                continue;
            }

            $tarif = TarifKeuangan::withTrashed()->firstOrNew([
                'jenis_tagihan_id' => $jenis->id,
                'tahun_akademik' => $row['tahun'],
                'semester_akademik' => $row['semester'],
            ]);
            $payload = [
                'nominal' => $row['nominal'],
                'keterangan' => $row['keterangan'],
                'is_active' => true,
            ];
            if ($hasInstallmentColumns) {
                $payload['can_installment'] = $row['can_installment'];
                $payload['installment_max'] = $row['installment_max'];
                $payload['installment_default'] = $row['installment_default'];
            }
            $tarif->fill($payload);
            $tarif->deleted_at = null;
            $tarif->save();
        }
    }
}

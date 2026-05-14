<?php

namespace Database\Seeders;

use App\Models\Dosen;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Kurikulum;
use App\Models\MataKuliah;
use App\Models\Prodi;
use App\Models\Ruangan;
use App\Models\TahunAkademik;
use Illuminate\Database\Seeder;

class AkademikMasterSeeder extends Seeder
{
    public function run(): void
    {
        $tahun = TahunAkademik::query()->updateOrCreate(
            ['kode' => '2026-GENAP'],
            [
                'nama' => '2025/2026 Genap',
                'semester_aktif' => 2,
                'tanggal_mulai' => '2026-02-01',
                'tanggal_selesai' => '2026-07-31',
                'is_active' => true,
            ]
        );

        $ruanganA = Ruangan::query()->updateOrCreate(
            ['kode' => 'R-A101'],
            ['nama' => 'Ruang A101', 'gedung' => 'Gedung A', 'kapasitas' => 40, 'is_active' => true]
        );
        $ruanganB = Ruangan::query()->updateOrCreate(
            ['kode' => 'R-B201'],
            ['nama' => 'Ruang B201', 'gedung' => 'Gedung B', 'kapasitas' => 35, 'is_active' => true]
        );

        $jurusanTarbiyah = Jurusan::query()->updateOrCreate(
            ['kode' => 'J-TAR'],
            ['nama' => 'Tarbiyah', 'deskripsi' => 'Jurusan ilmu kependidikan Islam', 'is_active' => true]
        );
        $jurusanSyariah = Jurusan::query()->updateOrCreate(
            ['kode' => 'J-SYR'],
            ['nama' => 'Syariah', 'deskripsi' => 'Jurusan hukum dan ekonomi syariah', 'is_active' => true]
        );

        $prodiPai = Prodi::query()->updateOrCreate(
            ['kode' => 'PAI'],
            [
                'jurusan_id' => $jurusanTarbiyah->id,
                'nama' => 'Pendidikan Agama Islam',
                'jenjang' => 'S1',
                'semester_total' => 8,
                'sks_lulus' => 144,
                'is_active' => true,
            ]
        );
        $prodiMpi = Prodi::query()->updateOrCreate(
            ['kode' => 'MPI'],
            [
                'jurusan_id' => $jurusanTarbiyah->id,
                'nama' => 'Manajemen Pendidikan Islam',
                'jenjang' => 'S1',
                'semester_total' => 8,
                'sks_lulus' => 144,
                'is_active' => true,
            ]
        );
        $prodiEsy = Prodi::query()->updateOrCreate(
            ['kode' => 'ESY'],
            [
                'jurusan_id' => $jurusanSyariah->id,
                'nama' => 'Ekonomi Syariah',
                'jenjang' => 'S1',
                'semester_total' => 8,
                'sks_lulus' => 144,
                'is_active' => true,
            ]
        );

        $kurPai = Kurikulum::query()->updateOrCreate(
            ['kode' => 'KUR-PAI-2024'],
            [
                'prodi_id' => $prodiPai->id,
                'nama' => 'Kurikulum PAI 2024',
                'tahun_berlaku' => 2024,
                'is_active' => true,
            ]
        );
        $kurMpi = Kurikulum::query()->updateOrCreate(
            ['kode' => 'KUR-MPI-2024'],
            [
                'prodi_id' => $prodiMpi->id,
                'nama' => 'Kurikulum MPI 2024',
                'tahun_berlaku' => 2024,
                'is_active' => true,
            ]
        );
        $kurEsy = Kurikulum::query()->updateOrCreate(
            ['kode' => 'KUR-ESY-2024'],
            [
                'prodi_id' => $prodiEsy->id,
                'nama' => 'Kurikulum ESY 2024',
                'tahun_berlaku' => 2024,
                'is_active' => true,
            ]
        );

        $mkPai = MataKuliah::query()->updateOrCreate(
            ['prodi_id' => $prodiPai->id, 'kode' => 'PAI101'],
            [
                'kurikulum_id' => $kurPai->id,
                'nama' => 'Pengantar Studi Islam',
                'semester' => 1,
                'sks' => 2,
                'jenis' => 'wajib',
                'is_active' => true,
            ]
        );
        $mkMpi = MataKuliah::query()->updateOrCreate(
            ['prodi_id' => $prodiMpi->id, 'kode' => 'MPI201'],
            [
                'kurikulum_id' => $kurMpi->id,
                'nama' => 'Manajemen Kurikulum',
                'semester' => 3,
                'sks' => 3,
                'jenis' => 'wajib',
                'is_active' => true,
            ]
        );
        $mkEsy = MataKuliah::query()->updateOrCreate(
            ['prodi_id' => $prodiEsy->id, 'kode' => 'ESY301'],
            [
                'kurikulum_id' => $kurEsy->id,
                'nama' => 'Fiqh Muamalah',
                'semester' => 5,
                'sks' => 3,
                'jenis' => 'wajib',
                'is_active' => true,
            ]
        );

        $dosenPai = Dosen::query()->updateOrCreate(
            ['nidn' => '1000000001'],
            [
                'prodi_id' => $prodiPai->id,
                'nip' => '197901012006041001',
                'nama' => 'Dr. Ahmad Fauzi, M.Pd.I',
                'email' => 'ahmad.fauzi@kampus.ac.id',
                'phone' => '081200000001',
                'status_dosen' => 'tetap',
            ]
        );
        $dosenMpi = Dosen::query()->updateOrCreate(
            ['nidn' => '1000000002'],
            [
                'prodi_id' => $prodiMpi->id,
                'nip' => '198003032007011002',
                'nama' => 'Dr. Siti Aminah, M.Pd',
                'email' => 'siti.aminah@kampus.ac.id',
                'phone' => '081200000002',
                'status_dosen' => 'tetap',
            ]
        );
        $dosenEsy = Dosen::query()->updateOrCreate(
            ['nidn' => '1000000003'],
            [
                'prodi_id' => $prodiEsy->id,
                'nip' => '198505052010121003',
                'nama' => 'M. Ridwan, M.E',
                'email' => 'm.ridwan@kampus.ac.id',
                'phone' => '081200000003',
                'status_dosen' => 'tetap',
            ]
        );

        Kelas::query()->updateOrCreate(
            [
                'mata_kuliah_id' => $mkPai->id,
                'kode_kelas' => 'A',
                'tahun_akademik' => $tahun->kode,
                'semester_akademik' => 2,
            ],
            [
                'dosen_id' => $dosenPai->id,
                'tahun_akademik_id' => $tahun->id,
                'kapasitas' => 40,
                'ruangan_id' => $ruanganA->id,
                'ruangan' => $ruanganA->nama,
                'is_active' => true,
            ]
        );
        Kelas::query()->updateOrCreate(
            [
                'mata_kuliah_id' => $mkMpi->id,
                'kode_kelas' => 'A',
                'tahun_akademik' => $tahun->kode,
                'semester_akademik' => 2,
            ],
            [
                'dosen_id' => $dosenMpi->id,
                'tahun_akademik_id' => $tahun->id,
                'kapasitas' => 35,
                'ruangan_id' => $ruanganB->id,
                'ruangan' => $ruanganB->nama,
                'is_active' => true,
            ]
        );
        Kelas::query()->updateOrCreate(
            [
                'mata_kuliah_id' => $mkEsy->id,
                'kode_kelas' => 'A',
                'tahun_akademik' => $tahun->kode,
                'semester_akademik' => 2,
            ],
            [
                'dosen_id' => $dosenEsy->id,
                'tahun_akademik_id' => $tahun->id,
                'kapasitas' => 35,
                'ruangan_id' => $ruanganA->id,
                'ruangan' => $ruanganA->nama,
                'is_active' => true,
            ]
        );
    }
}

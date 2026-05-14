<?php

namespace Database\Seeders;

use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\Krs;
use App\Models\KrsDetail;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use App\Models\TahunAkademik;
use Illuminate\Database\Seeder;

class AkademikKrsSeeder extends Seeder
{
    public function run(): void
    {
        $tahun = TahunAkademik::query()->where('kode', '2026-GENAP')->first();
        if (! $tahun) {
            return;
        }

        $prodis = Prodi::query()->whereIn('kode', ['PAI', 'MPI', 'ESY'])->get()->keyBy('kode');
        if ($prodis->count() < 3) {
            return;
        }

        $mahasiswaPai = Mahasiswa::query()->updateOrCreate(
            ['nim' => '2026001001'],
            [
                'prodi_id' => $prodis['PAI']->id,
                'nisn' => '9900010011',
                'nama' => 'Abdul Rahman',
                'email' => 'abdul.rahman@student.ac.id',
                'phone' => '081300000001',
                'jenis_kelamin' => 'L',
                'tanggal_lahir' => '2006-01-10',
                'tempat_lahir' => 'Serang',
                'alamat' => 'Jl. Raya Serang No. 10',
                'angkatan' => '2026',
                'status_mahasiswa' => 'aktif',
            ]
        );
        $mahasiswaMpi = Mahasiswa::query()->updateOrCreate(
            ['nim' => '2026002001'],
            [
                'prodi_id' => $prodis['MPI']->id,
                'nisn' => '9900020011',
                'nama' => 'Nur Aisyah',
                'email' => 'nur.aisyah@student.ac.id',
                'phone' => '081300000002',
                'jenis_kelamin' => 'P',
                'tanggal_lahir' => '2006-03-21',
                'tempat_lahir' => 'Pandeglang',
                'alamat' => 'Jl. Pendidikan No. 5',
                'angkatan' => '2026',
                'status_mahasiswa' => 'aktif',
            ]
        );
        $mahasiswaEsy = Mahasiswa::query()->updateOrCreate(
            ['nim' => '2026003001'],
            [
                'prodi_id' => $prodis['ESY']->id,
                'nisn' => '9900030011',
                'nama' => 'Muhammad Iqbal',
                'email' => 'muhammad.iqbal@student.ac.id',
                'phone' => '081300000003',
                'jenis_kelamin' => 'L',
                'tanggal_lahir' => '2005-11-09',
                'tempat_lahir' => 'Cilegon',
                'alamat' => 'Jl. Merdeka No. 12',
                'angkatan' => '2026',
                'status_mahasiswa' => 'aktif',
            ]
        );

        $kelasByProdi = Kelas::query()
            ->with('mataKuliah')
            ->where('tahun_akademik_id', $tahun->id)
            ->get()
            ->filter(fn (Kelas $kelas) => $kelas->mataKuliah !== null)
            ->groupBy(fn (Kelas $kelas) => $kelas->mataKuliah->prodi_id);

        foreach (Kelas::query()->where('tahun_akademik_id', $tahun->id)->get() as $kelas) {
            Jadwal::query()->updateOrCreate(
                ['kelas_id' => $kelas->id, 'hari_ke' => 1],
                [
                    'jam_mulai' => '08:00:00',
                    'jam_selesai' => '09:40:00',
                    'ruangan' => $kelas->ruangan,
                    'mode' => 'offline',
                ]
            );
        }

        $this->seedKrsForMahasiswa($mahasiswaPai, $tahun, $kelasByProdi[$prodis['PAI']->id] ?? collect());
        $this->seedKrsForMahasiswa($mahasiswaMpi, $tahun, $kelasByProdi[$prodis['MPI']->id] ?? collect());
        $this->seedKrsForMahasiswa($mahasiswaEsy, $tahun, $kelasByProdi[$prodis['ESY']->id] ?? collect());
    }

    private function seedKrsForMahasiswa(Mahasiswa $mahasiswa, TahunAkademik $tahun, $kelasCollection): void
    {
        $krs = Krs::query()->updateOrCreate(
            [
                'mahasiswa_id' => $mahasiswa->id,
                'tahun_akademik' => $tahun->kode,
                'semester_akademik' => 2,
            ],
            [
                'dosen_wali_id' => null,
                'tahun_akademik_id' => $tahun->id,
                'total_sks' => 0,
                'status' => 'approved',
                'approved_at' => now(),
                'catatan' => 'KRS awal hasil seeder',
            ]
        );

        $totalSks = 0;
        foreach ($kelasCollection as $kelas) {
            $sks = (int) ($kelas->mataKuliah->sks ?? 0);
            if ($sks < 1) {
                continue;
            }

            KrsDetail::query()->updateOrCreate(
                ['krs_id' => $krs->id, 'kelas_id' => $kelas->id],
                ['sks' => $sks, 'status' => 'active']
            );
            $totalSks += $sks;
        }

        $krs->forceFill(['total_sks' => $totalSks])->save();
    }
}

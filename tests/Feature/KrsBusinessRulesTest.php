<?php

namespace Tests\Feature;

use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Krs;
use App\Models\KrsDetail;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\Prodi;
use App\Models\TahunAkademik;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class KrsBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    private function createAcademicBase(): array
    {
        $tahun = TahunAkademik::query()->create([
            'kode' => '2026/2027',
            'nama' => 'TA 2026/2027',
            'semester_aktif' => 1,
            'is_active' => true,
        ]);

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-TI',
            'nama' => 'Teknik Informatika',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'TI-S1',
            'nama' => 'Teknik Informatika',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        return [$tahun, $prodi];
    }

    private function createMahasiswa(Prodi $prodi, string $nim): Mahasiswa
    {
        return Mahasiswa::query()->create([
            'prodi_id' => $prodi->id,
            'nim' => $nim,
            'nama' => 'Mhs '.$nim,
            'jenis_kelamin' => 'L',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);
    }

    public function test_krs_rejects_duplicate_course_from_different_classes(): void
    {
        Role::findOrCreate('super-admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        [$tahun, $prodi] = $this->createAcademicBase();
        $mahasiswa = $this->createMahasiswa($prodi, '2026001');

        $mataKuliah = MataKuliah::query()->create([
            'prodi_id' => $prodi->id,
            'kode' => 'IF101',
            'nama' => 'Algoritma',
            'semester' => 1,
            'sks' => 3,
            'jenis' => 'wajib',
            'is_active' => true,
        ]);

        $kelasA = Kelas::query()->create([
            'mata_kuliah_id' => $mataKuliah->id,
            'kode_kelas' => 'A',
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'kapasitas' => 40,
            'is_active' => true,
        ]);

        $kelasB = Kelas::query()->create([
            'mata_kuliah_id' => $mataKuliah->id,
            'kode_kelas' => 'B',
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'kapasitas' => 40,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->from('/krs')
            ->post('/krs', [
                'mahasiswa_id' => $mahasiswa->id,
                'kelas_ids' => [$kelasA->id, $kelasB->id],
            ])
            ->assertSessionHasErrors('kelas_ids');
    }

    public function test_krs_rejects_when_class_capacity_is_full(): void
    {
        Role::findOrCreate('super-admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        [$tahun, $prodi] = $this->createAcademicBase();
        $mahasiswa1 = $this->createMahasiswa($prodi, '2026002');
        $mahasiswa2 = $this->createMahasiswa($prodi, '2026003');

        $mataKuliah = MataKuliah::query()->create([
            'prodi_id' => $prodi->id,
            'kode' => 'IF102',
            'nama' => 'Struktur Data',
            'semester' => 1,
            'sks' => 3,
            'jenis' => 'wajib',
            'is_active' => true,
        ]);

        $kelas = Kelas::query()->create([
            'mata_kuliah_id' => $mataKuliah->id,
            'kode_kelas' => 'A',
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'kapasitas' => 1,
            'is_active' => true,
        ]);

        $krsFilled = Krs::query()->create([
            'mahasiswa_id' => $mahasiswa1->id,
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'total_sks' => 3,
            'status' => 'submitted',
        ]);
        KrsDetail::query()->create([
            'krs_id' => $krsFilled->id,
            'kelas_id' => $kelas->id,
            'sks' => 3,
            'status' => 'active',
        ]);

        $this->actingAs($user)
            ->from('/krs')
            ->post('/krs', [
                'mahasiswa_id' => $mahasiswa2->id,
                'kelas_ids' => [$kelas->id],
            ])
            ->assertSessionHasErrors('kelas_ids');
    }

    public function test_krs_submit_requires_active_details(): void
    {
        Role::findOrCreate('super-admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        [$tahun, $prodi] = $this->createAcademicBase();
        $mahasiswa = $this->createMahasiswa($prodi, '2026004');

        $krs = Krs::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'total_sks' => 0,
            'status' => 'draft',
        ]);

        $this->actingAs($user)
            ->from('/krs')
            ->patch("/krs/{$krs->id}/submit")
            ->assertSessionHasErrors('status');
    }
}


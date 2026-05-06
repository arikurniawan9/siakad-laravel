<?php

namespace Tests\Feature;

use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Krs;
use App\Models\KrsDetail;
use App\Models\Kurikulum;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\Prodi;
use App\Models\Ruangan;
use App\Models\Tagihan;
use App\Models\TahunAkademik;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DeleteProtectionTest extends TestCase
{
    use RefreshDatabase;

    private function makeSuperAdmin(): User
    {
        Role::findOrCreate('super-admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        return $user;
    }

    public function test_jurusan_cannot_be_deleted_when_prodi_exists(): void
    {
        $user = $this->makeSuperAdmin();

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-TI',
            'nama' => 'Teknik Informatika',
        ]);

        Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'TI-S1',
            'nama' => 'Teknik Informatika',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        $this->actingAs($user)
            ->from('/akademik/jurusan')
            ->delete('/akademik/jurusan/'.$jurusan->id)
            ->assertSessionHas('error');

        $this->assertTrue(Jurusan::query()->whereKey($jurusan->id)->exists());
    }

    public function test_prodi_cannot_be_deleted_when_mahasiswa_exists(): void
    {
        $user = $this->makeSuperAdmin();

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-MI',
            'nama' => 'Manajemen Informatika',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'MI-S1',
            'nama' => 'Manajemen Informatika',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        Mahasiswa::query()->create([
            'prodi_id' => $prodi->id,
            'nim' => '20260001',
            'nama' => 'Mahasiswa Uji',
            'jenis_kelamin' => 'L',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);

        $this->actingAs($user)
            ->from('/akademik/prodi')
            ->delete('/akademik/prodi/'.$prodi->id)
            ->assertSessionHas('error');

        $this->assertTrue(Prodi::query()->whereKey($prodi->id)->exists());
    }

    public function test_mata_kuliah_cannot_be_deleted_when_class_exists(): void
    {
        $user = $this->makeSuperAdmin();

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-IF',
            'nama' => 'Informatika',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'IF-S1',
            'nama' => 'Informatika',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        $mataKuliah = MataKuliah::query()->create([
            'prodi_id' => $prodi->id,
            'kode' => 'IF101',
            'nama' => 'Algoritma',
            'semester' => 1,
            'sks' => 3,
            'jenis' => 'wajib',
            'is_active' => true,
        ]);

        $tahun = TahunAkademik::query()->create([
            'kode' => '2026/2027',
            'nama' => 'TA 2026/2027',
            'semester_aktif' => 1,
            'is_active' => true,
        ]);

        Kelas::query()->create([
            'mata_kuliah_id' => $mataKuliah->id,
            'kode_kelas' => 'A',
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'kapasitas' => 40,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->from('/akademik/mata-kuliah')
            ->delete('/akademik/mata-kuliah/'.$mataKuliah->id)
            ->assertSessionHas('error');

        $this->assertTrue(MataKuliah::query()->whereKey($mataKuliah->id)->exists());
    }

    public function test_kelas_cannot_be_deleted_when_krs_detail_exists(): void
    {
        $user = $this->makeSuperAdmin();

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-SI',
            'nama' => 'Sistem Informasi',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'SI-S1',
            'nama' => 'Sistem Informasi',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        $mahasiswa = Mahasiswa::query()->create([
            'prodi_id' => $prodi->id,
            'nim' => '20260002',
            'nama' => 'Mahasiswa KRS',
            'jenis_kelamin' => 'P',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);

        $tahun = TahunAkademik::query()->create([
            'kode' => '2026/2027',
            'nama' => 'TA 2026/2027',
            'semester_aktif' => 1,
            'is_active' => true,
        ]);

        $mataKuliah = MataKuliah::query()->create([
            'prodi_id' => $prodi->id,
            'kode' => 'SI101',
            'nama' => 'Pengantar SI',
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
            'kapasitas' => 40,
            'is_active' => true,
        ]);

        $krs = Krs::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'total_sks' => 3,
            'status' => 'submitted',
        ]);

        KrsDetail::query()->create([
            'krs_id' => $krs->id,
            'kelas_id' => $kelas->id,
            'sks' => 3,
            'status' => 'active',
        ]);

        $this->actingAs($user)
            ->from('/akademik/kelas')
            ->delete('/akademik/kelas/'.$kelas->id)
            ->assertSessionHas('error');

        $this->assertTrue(Kelas::query()->whereKey($kelas->id)->exists());
    }

    public function test_ruangan_cannot_be_deleted_when_class_exists(): void
    {
        $user = $this->makeSuperAdmin();

        $ruangan = Ruangan::query()->create([
            'kode' => 'R-101',
            'nama' => 'Ruang 101',
            'kapasitas' => 40,
            'is_active' => true,
        ]);

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-AA',
            'nama' => 'Akuntansi',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'AK-S1',
            'nama' => 'Akuntansi',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        $tahun = TahunAkademik::query()->create([
            'kode' => '2026/2027',
            'nama' => 'TA 2026/2027',
            'semester_aktif' => 1,
            'is_active' => true,
        ]);

        $mataKuliah = MataKuliah::query()->create([
            'prodi_id' => $prodi->id,
            'kode' => 'AK101',
            'nama' => 'Pengantar Akuntansi',
            'semester' => 1,
            'sks' => 3,
            'jenis' => 'wajib',
            'is_active' => true,
        ]);

        Kelas::query()->create([
            'mata_kuliah_id' => $mataKuliah->id,
            'kode_kelas' => 'A',
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'kapasitas' => 40,
            'ruangan_id' => $ruangan->id,
            'ruangan' => $ruangan->nama,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->from('/akademik/ruangan')
            ->delete('/akademik/ruangan/'.$ruangan->id)
            ->assertSessionHas('error');

        $this->assertTrue(Ruangan::query()->whereKey($ruangan->id)->exists());
    }

    public function test_kurikulum_cannot_be_deleted_when_mata_kuliah_exists(): void
    {
        $user = $this->makeSuperAdmin();

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-TE',
            'nama' => 'Teknik Elektro',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'TE-S1',
            'nama' => 'Teknik Elektro',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        $kurikulum = Kurikulum::query()->create([
            'prodi_id' => $prodi->id,
            'kode' => 'KUR-2026',
            'nama' => 'Kurikulum 2026',
            'tahun_berlaku' => 2026,
            'is_active' => true,
        ]);

        MataKuliah::query()->create([
            'prodi_id' => $prodi->id,
            'kurikulum_id' => $kurikulum->id,
            'kode' => 'TE101',
            'nama' => 'Dasar Elektro',
            'semester' => 1,
            'sks' => 3,
            'jenis' => 'wajib',
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->from('/akademik/kurikulum')
            ->delete('/akademik/kurikulum/'.$kurikulum->id)
            ->assertSessionHas('error');

        $this->assertTrue(Kurikulum::query()->whereKey($kurikulum->id)->exists());
    }

    public function test_tahun_akademik_cannot_be_deleted_when_class_exists(): void
    {
        $user = $this->makeSuperAdmin();

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-AR',
            'nama' => 'Arsitektur',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'AR-S1',
            'nama' => 'Arsitektur',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        $tahun = TahunAkademik::query()->create([
            'kode' => '2026/2027',
            'nama' => 'TA 2026/2027',
            'semester_aktif' => 1,
            'is_active' => true,
        ]);

        $kurikulum = Kurikulum::query()->create([
            'prodi_id' => $prodi->id,
            'kode' => 'KUR-AR26',
            'nama' => 'Kurikulum Arsitektur',
            'tahun_berlaku' => 2026,
            'is_active' => true,
        ]);

        $mataKuliah = MataKuliah::query()->create([
            'prodi_id' => $prodi->id,
            'kurikulum_id' => $kurikulum->id,
            'kode' => 'AR101',
            'nama' => 'Dasar Arsitektur',
            'semester' => 1,
            'sks' => 3,
            'jenis' => 'wajib',
            'is_active' => true,
        ]);

        Kelas::query()->create([
            'mata_kuliah_id' => $mataKuliah->id,
            'kode_kelas' => 'A',
            'tahun_akademik_id' => $tahun->id,
            'tahun_akademik' => $tahun->kode,
            'semester_akademik' => 1,
            'kapasitas' => 40,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->from('/akademik/tahun-akademik')
            ->delete('/akademik/tahun-akademik/'.$tahun->id)
            ->assertSessionHas('error');

        $this->assertTrue(TahunAkademik::query()->whereKey($tahun->id)->exists());
    }

    public function test_tagihan_cannot_be_deleted_when_not_pending(): void
    {
        $user = $this->makeSuperAdmin();

        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-BI',
            'nama' => 'Biologi',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'BI-S1',
            'nama' => 'Biologi',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        $mahasiswa = Mahasiswa::query()->create([
            'prodi_id' => $prodi->id,
            'nim' => '20260003',
            'nama' => 'Mahasiswa Tagihan',
            'jenis_kelamin' => 'L',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-TEST-001',
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'status' => 'paid',
        ]);

        $this->actingAs($user)
            ->from('/keuangan/tagihan')
            ->delete('/keuangan/tagihan/'.$tagihan->id)
            ->assertSessionHas('error');

        $this->assertTrue(Tagihan::query()->whereKey($tagihan->id)->exists());
    }
}

<?php

namespace Tests\Feature;

use App\Models\FinancePeriodLock;
use App\Models\Jurusan;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use App\Models\Tagihan;
use App\Models\TahunAkademik;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancePeriodLockTest extends TestCase
{
    use RefreshDatabase;

    private function seedMahasiswa(): Mahasiswa
    {
        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-LOCK',
            'nama' => 'Jurusan Lock',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRODI-LOCK',
            'nama' => 'Prodi Lock',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        return Mahasiswa::query()->create([
            'prodi_id' => $prodi->id,
            'nim' => '20267777',
            'nama' => 'Mahasiswa Lock',
            'jenis_kelamin' => 'L',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);
    }

    public function test_store_tagihan_blocked_when_period_locked(): void
    {
        $user = User::factory()->create();
        $mahasiswa = $this->seedMahasiswa();

        FinancePeriodLock::query()->create([
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'locked_at' => now(),
            'locked_by_user_id' => $user->id,
            'reason' => 'Closing test',
        ]);

        $this->actingAs($user)
            ->withoutMiddleware()
            ->from('/keuangan/tagihan')
            ->post(route('keuangan.tagihan.store'), [
                'mahasiswa_id' => $mahasiswa->id,
                'tahun_akademik' => '2026/2027',
                'semester_akademik' => 1,
                'jenis' => 'SPP',
                'nominal' => 1500000,
                'potongan' => 0,
                'denda' => 0,
            ])
            ->assertSessionHas('error');

        $this->assertSame(0, Tagihan::query()->count());
    }

    public function test_superadmin_can_create_period_lock_for_existing_tahun_akademik(): void
    {
        $user = User::factory()->create();

        TahunAkademik::query()->create([
            'kode' => '2026/2027',
            'nama' => 'Tahun Akademik 2026/2027',
            'semester_aktif' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->withoutMiddleware()
            ->post(route('settings.finance-period-locks.store'), [
                'tahun_akademik' => '2026/2027',
                'semester_akademik' => 1,
                'reason' => 'Closing test',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('finance_period_locks', [
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
        ]);
    }

    public function test_period_lock_requires_tahun_akademik_from_master_table(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->withoutMiddleware()
            ->post(route('settings.finance-period-locks.store'), [
                'tahun_akademik' => '2099/2100',
                'semester_akademik' => 1,
            ])
            ->assertSessionHasErrors(['tahun_akademik']);

        $this->assertSame(0, FinancePeriodLock::query()->count());
    }
}

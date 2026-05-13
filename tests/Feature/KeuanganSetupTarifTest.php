<?php

namespace Tests\Feature;

use App\Models\JenisTagihan;
use App\Models\TarifKeuangan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class KeuanganSetupTarifTest extends TestCase
{
    use RefreshDatabase;

    private function makeSuperAdmin(): User
    {
        Role::findOrCreate('super-admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        return $user;
    }

    public function test_store_tarif_creates_new_record(): void
    {
        $user = $this->makeSuperAdmin();
        $jenis = JenisTagihan::query()->create([
            'kode' => 'SPP',
            'nama' => 'SPP',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($user)
            ->post(route('keuangan.setup.tarif.store'), [
                'jenis_tagihan_id' => $jenis->id,
                'tahun_akademik' => '2025/2026 Genap',
                'semester_akademik' => 2,
                'nominal' => 1500000,
                'keterangan' => 'Tarif awal',
                'is_active' => true,
                'can_installment' => false,
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('tarif_keuangans', [
            'jenis_tagihan_id' => $jenis->id,
            'tahun_akademik' => '2025/2026 Genap',
            'semester_akademik' => 2,
            'nominal' => 1500000,
            'is_active' => true,
            'can_installment' => false,
            'deleted_at' => null,
        ]);
    }

    public function test_store_tarif_updates_existing_record_for_same_identity(): void
    {
        $user = $this->makeSuperAdmin();
        $jenis = JenisTagihan::query()->create([
            'kode' => 'KKN',
            'nama' => 'KKN',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        TarifKeuangan::query()->create([
            'jenis_tagihan_id' => $jenis->id,
            'tahun_akademik' => '2025/2026 Genap',
            'semester_akademik' => 2,
            'nominal' => 500000,
            'keterangan' => 'Lama',
            'is_active' => true,
            'can_installment' => false,
            'installment_max' => null,
            'installment_default' => null,
        ]);

        $this->actingAs($user)
            ->post(route('keuangan.setup.tarif.store'), [
                'jenis_tagihan_id' => $jenis->id,
                'tahun_akademik' => '2025/2026 Genap',
                'semester_akademik' => 2,
                'nominal' => 900000,
                'keterangan' => 'Baru',
                'is_active' => true,
                'can_installment' => true,
                'installment_max' => 8,
                'installment_default' => 4,
            ])
            ->assertSessionHas('success');

        $this->assertSame(1, TarifKeuangan::query()->count());
        $tarif = TarifKeuangan::query()->first();
        $this->assertNotNull($tarif);
        $this->assertSame(900000.0, (float) $tarif->nominal);
        $this->assertSame('Baru', $tarif->keterangan);
        $this->assertTrue((bool) $tarif->can_installment);
        $this->assertSame(8, (int) $tarif->installment_max);
        $this->assertSame(4, (int) $tarif->installment_default);
    }

    public function test_store_tarif_restores_soft_deleted_record_for_same_identity(): void
    {
        $user = $this->makeSuperAdmin();
        $jenis = JenisTagihan::query()->create([
            'kode' => 'PRAKTEK',
            'nama' => 'Praktek',
            'is_active' => true,
            'sort_order' => 3,
        ]);

        $tarif = TarifKeuangan::query()->create([
            'jenis_tagihan_id' => $jenis->id,
            'tahun_akademik' => '2025/2026 Genap',
            'semester_akademik' => 2,
            'nominal' => 300000,
            'keterangan' => 'Lama',
            'is_active' => true,
            'can_installment' => false,
            'installment_max' => null,
            'installment_default' => null,
        ]);
        $tarif->delete();

        $this->actingAs($user)
            ->post(route('keuangan.setup.tarif.store'), [
                'jenis_tagihan_id' => $jenis->id,
                'tahun_akademik' => '2025/2026 Genap',
                'semester_akademik' => 2,
                'nominal' => 700000,
                'keterangan' => 'Diaktifkan lagi',
                'is_active' => true,
                'can_installment' => false,
            ])
            ->assertSessionHas('success');

        $this->assertSame(1, TarifKeuangan::withTrashed()->count());
        $restored = TarifKeuangan::withTrashed()->first();
        $this->assertNotNull($restored);
        $this->assertNull($restored->deleted_at);
        $this->assertSame(700000.0, (float) $restored->nominal);
        $this->assertSame('Diaktifkan lagi', $restored->keterangan);
    }

    public function test_destroy_tarif_soft_deletes_record(): void
    {
        $user = $this->makeSuperAdmin();
        $jenis = JenisTagihan::query()->create([
            'kode' => 'WISUDA',
            'nama' => 'Wisuda',
            'is_active' => true,
            'sort_order' => 4,
        ]);

        $tarif = TarifKeuangan::query()->create([
            'jenis_tagihan_id' => $jenis->id,
            'tahun_akademik' => '2025/2026 Genap',
            'semester_akademik' => 2,
            'nominal' => 2500000,
            'keterangan' => 'Uji hapus',
            'is_active' => true,
            'can_installment' => false,
            'installment_max' => null,
            'installment_default' => null,
        ]);

        $this->actingAs($user)
            ->delete(route('keuangan.setup.tarif.destroy', $tarif->id))
            ->assertSessionHas('success');

        $this->assertSoftDeleted('tarif_keuangans', [
            'id' => $tarif->id,
        ]);
    }
}

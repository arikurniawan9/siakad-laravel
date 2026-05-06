<?php

namespace Tests\Feature;

use App\Models\Jurusan;
use App\Models\Mahasiswa;
use App\Models\Pembayaran;
use App\Models\PembayaranAllocation;
use App\Models\Prodi;
use App\Models\Tagihan;
use App\Models\TagihanItem;
use App\Models\FinancePeriodLock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceManualPaymentTest extends TestCase
{
    use RefreshDatabase;

    private function seedMahasiswa(): Mahasiswa
    {
        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-FIN',
            'nama' => 'Jurusan Finance',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRODI-FIN',
            'nama' => 'Prodi Finance',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        return Mahasiswa::query()->create([
            'prodi_id' => $prodi->id,
            'nim' => '20268888',
            'nama' => 'Mahasiswa Finance',
            'jenis_kelamin' => 'L',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);
    }

    public function test_manual_payment_cannot_exceed_remaining_bill(): void
    {
        $user = User::factory()->create();
        $mahasiswa = $this->seedMahasiswa();

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-MAN-001',
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => 1000000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1000000,
            'status' => 'pending',
        ]);

        $item = TagihanItem::query()->create([
            'tagihan_id' => $tagihan->id,
            'jenis_tagihan_id' => null,
            'kode' => 'SPP',
            'nama' => 'SPP',
            'nominal' => 1000000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1000000,
            'keterangan' => null,
            'sort_order' => 0,
        ]);

        $pembayaran = Pembayaran::query()->create([
            'tagihan_id' => $tagihan->id,
            'mahasiswa_id' => $mahasiswa->id,
            'jenis_pembayaran_id' => null,
            'provider' => 'manual',
            'reference' => null,
            'amount' => 400000,
            'paid_at' => now(),
            'notes' => null,
            'created_by_user_id' => $user->id,
        ]);

        PembayaranAllocation::query()->create([
            'pembayaran_id' => $pembayaran->id,
            'tagihan_item_id' => $item->id,
            'amount' => 400000,
        ]);

        $tagihan->refreshStatusFromPayments();
        $tagihan->refresh();
        $this->assertSame('partial', $tagihan->status);

        $this->actingAs($user)
            ->withoutMiddleware()
            ->from('/keuangan/tagihan')
            ->post(route('keuangan.tagihan.pembayaran.store', $tagihan->id), [
                'provider' => 'manual',
                'amount' => 700000,
                'allocations' => [
                    ['tagihan_item_id' => $item->id, 'amount' => 700000],
                ],
            ])
            ->assertSessionHas('error');
    }

    public function test_manual_payment_blocked_when_period_locked(): void
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

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-MAN-LOCK-001',
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => 500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 500000,
            'status' => 'pending',
        ]);

        $item = TagihanItem::query()->create([
            'tagihan_id' => $tagihan->id,
            'jenis_tagihan_id' => null,
            'kode' => 'SPP',
            'nama' => 'SPP',
            'nominal' => 500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 500000,
            'keterangan' => null,
            'sort_order' => 0,
        ]);

        $this->actingAs($user)
            ->withoutMiddleware()
            ->from('/keuangan/tagihan')
            ->post(route('keuangan.tagihan.pembayaran.store', $tagihan->id), [
                'provider' => 'manual',
                'amount' => 500000,
                'allocations' => [
                    ['tagihan_item_id' => $item->id, 'amount' => 500000],
                ],
            ])
            ->assertSessionHas('error');
    }
}

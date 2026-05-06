<?php

namespace Tests\Feature;

use App\Models\Jurusan;
use App\Models\Mahasiswa;
use App\Models\Pembayaran;
use App\Models\PembayaranAllocation;
use App\Models\Prodi;
use App\Models\AuditLog;
use App\Models\FinancePeriodLock;
use App\Models\FinanceReconciliation;
use App\Models\Tagihan;
use App\Models\TagihanItem;
use App\Models\Transaksi;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FinanceMidtransCallbackTest extends TestCase
{
    use RefreshDatabase;

    private function seedMahasiswa(): Mahasiswa
    {
        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-TEST',
            'nama' => 'Jurusan Test',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRODI-TEST',
            'nama' => 'Prodi Test',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        return Mahasiswa::query()->create([
            'prodi_id' => $prodi->id,
            'nim' => '20269999',
            'nama' => 'Mahasiswa Test',
            'jenis_kelamin' => 'L',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);
    }

    public function test_midtrans_success_callback_creates_pembayaran_and_allocations(): void
    {
        $this->mock(MidtransService::class, function ($mock) {
            $mock->shouldReceive('isValidSignature')->andReturnTrue();
        });

        $mahasiswa = $this->seedMahasiswa();

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-MDT-001',
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'status' => 'pending',
        ]);

        $item = TagihanItem::query()->create([
            'tagihan_id' => $tagihan->id,
            'jenis_tagihan_id' => null,
            'kode' => 'SPP',
            'nama' => 'SPP',
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'keterangan' => null,
            'sort_order' => 0,
        ]);

        $trx = Transaksi::query()->create([
            'tagihan_id' => $tagihan->id,
            'order_id' => 'ORD-INV-MDT-001',
            'gross_amount' => 1500000,
            'status' => 'pending',
            'payload' => [],
        ]);

        $payload = [
            'order_id' => $trx->order_id,
            'transaction_status' => 'settlement',
            'status_code' => '200',
            'gross_amount' => '1500000',
            'signature_key' => 'ignored-by-mock',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'trx-001',
            'fraud_status' => 'accept',
        ];

        $this->postJson(route('payments.midtrans.callback'), $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $tagihan->refresh();
        $this->assertSame('paid', $tagihan->status);
        $this->assertNotNull($tagihan->paid_at);

        $this->assertTrue(
            Pembayaran::query()
                ->where('tagihan_id', $tagihan->id)
                ->where('provider', 'midtrans')
                ->where('reference', $trx->order_id)
                ->exists()
        );

        $pembayaran = Pembayaran::query()
            ->where('tagihan_id', $tagihan->id)
            ->where('provider', 'midtrans')
            ->where('reference', $trx->order_id)
            ->firstOrFail();

        $this->assertSame('1500000.00', (string) $pembayaran->amount);

        $allocationSum = (float) PembayaranAllocation::query()
            ->where('pembayaran_id', $pembayaran->id)
            ->sum('amount');

        $this->assertSame(1500000.0, $allocationSum);

        $this->assertTrue(
            PembayaranAllocation::query()
                ->where('pembayaran_id', $pembayaran->id)
                ->where('tagihan_item_id', $item->id)
                ->exists()
        );

        $this->assertTrue(
            AuditLog::query()
                ->where('source', 'finance')
                ->where('action', 'midtrans.callback')
                ->where('entity_type', 'transaksi')
                ->where('entity_id', $trx->id)
                ->exists()
        );
    }

    public function test_midtrans_success_callback_creates_reconciliation_item_when_period_locked(): void
    {
        $this->mock(MidtransService::class, function ($mock) {
            $mock->shouldReceive('isValidSignature')->andReturnTrue();
        });

        $mahasiswa = $this->seedMahasiswa();

        FinancePeriodLock::query()->create([
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'locked_at' => now(),
            'locked_by_user_id' => null,
            'reason' => 'Closing',
        ]);

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-MDT-LOCK-001',
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'status' => 'pending',
        ]);

        TagihanItem::query()->create([
            'tagihan_id' => $tagihan->id,
            'jenis_tagihan_id' => null,
            'kode' => 'SPP',
            'nama' => 'SPP',
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'keterangan' => null,
            'sort_order' => 0,
        ]);

        $trx = Transaksi::query()->create([
            'tagihan_id' => $tagihan->id,
            'order_id' => 'ORD-INV-MDT-LOCK-001',
            'gross_amount' => 1500000,
            'status' => 'pending',
            'payload' => [],
        ]);

        $payload = [
            'order_id' => $trx->order_id,
            'transaction_status' => 'settlement',
            'status_code' => '200',
            'gross_amount' => '1500000',
            'signature_key' => 'ignored-by-mock',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'trx-LOCK-001',
            'fraud_status' => 'accept',
        ];

        $this->postJson(route('payments.midtrans.callback'), $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $tagihan->refresh();
        $this->assertSame('pending', $tagihan->status);

        $this->assertTrue(
            FinanceReconciliation::query()
                ->where('provider', 'midtrans')
                ->where('order_id', $trx->order_id)
                ->where('tagihan_id', $tagihan->id)
                ->where('status', 'pending')
                ->exists()
        );
    }

    public function test_reconciliation_resolve_records_payment_and_updates_tagihan_status(): void
    {
        $this->mock(MidtransService::class, function ($mock) {
            $mock->shouldReceive('isValidSignature')->andReturnTrue();
        });

        $mahasiswa = $this->seedMahasiswa();

        FinancePeriodLock::query()->create([
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'locked_at' => now(),
            'locked_by_user_id' => null,
            'reason' => 'Closing',
        ]);

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-MDT-LOCK-002',
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'status' => 'pending',
        ]);

        TagihanItem::query()->create([
            'tagihan_id' => $tagihan->id,
            'jenis_tagihan_id' => null,
            'kode' => 'SPP',
            'nama' => 'SPP',
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'keterangan' => null,
            'sort_order' => 0,
        ]);

        $trx = Transaksi::query()->create([
            'tagihan_id' => $tagihan->id,
            'order_id' => 'ORD-INV-MDT-LOCK-002',
            'gross_amount' => 1500000,
            'status' => 'pending',
            'payload' => [],
        ]);

        $payload = [
            'order_id' => $trx->order_id,
            'transaction_status' => 'settlement',
            'status_code' => '200',
            'gross_amount' => '1500000',
            'signature_key' => 'ignored-by-mock',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'trx-LOCK-002',
            'fraud_status' => 'accept',
        ];

        $this->postJson(route('payments.midtrans.callback'), $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $recon = FinanceReconciliation::query()
            ->where('provider', 'midtrans')
            ->where('order_id', $trx->order_id)
            ->firstOrFail();

        Role::findOrCreate('super-admin', 'web');
        $actor = User::factory()->create();
        $actor->assignRole('super-admin');

        $this->actingAs($actor)
            ->patch(route('settings.finance-reconciliation.resolve', $recon->id), [
            'resolution_notes' => 'Recon ok',
        ])->assertSessionHas('success');

        $tagihan->refresh();
        $this->assertSame('paid', $tagihan->status);

        $this->assertTrue(
            \App\Models\Pembayaran::query()
                ->where('tagihan_id', $tagihan->id)
                ->where('provider', 'midtrans')
                ->where('reference', $trx->order_id)
                ->exists()
        );

        $recon->refresh();
        $this->assertSame('resolved', $recon->status);
    }

    public function test_midtrans_failed_callback_does_not_override_manual_payment_status(): void
    {
        $this->mock(MidtransService::class, function ($mock) {
            $mock->shouldReceive('isValidSignature')->andReturnTrue();
        });

        $mahasiswa = $this->seedMahasiswa();

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-MDT-002',
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'status' => 'pending',
        ]);

        $item = TagihanItem::query()->create([
            'tagihan_id' => $tagihan->id,
            'jenis_tagihan_id' => null,
            'kode' => 'SPP',
            'nama' => 'SPP',
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'keterangan' => null,
            'sort_order' => 0,
        ]);

        $pembayaranManual = Pembayaran::query()->create([
            'tagihan_id' => $tagihan->id,
            'mahasiswa_id' => $mahasiswa->id,
            'jenis_pembayaran_id' => null,
            'provider' => 'manual',
            'reference' => null,
            'amount' => 500000,
            'paid_at' => now(),
            'notes' => 'DP',
            'created_by_user_id' => null,
        ]);

        PembayaranAllocation::query()->create([
            'pembayaran_id' => $pembayaranManual->id,
            'tagihan_item_id' => $item->id,
            'amount' => 500000,
        ]);

        $tagihan->refreshStatusFromPayments();
        $tagihan->refresh();
        $this->assertSame('partial', $tagihan->status);

        $trx = Transaksi::query()->create([
            'tagihan_id' => $tagihan->id,
            'order_id' => 'ORD-INV-MDT-002',
            'gross_amount' => 1500000,
            'status' => 'pending',
            'payload' => [],
        ]);

        $payload = [
            'order_id' => $trx->order_id,
            'transaction_status' => 'cancel',
            'status_code' => '200',
            'gross_amount' => '1500000',
            'signature_key' => 'ignored-by-mock',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'trx-002',
            'fraud_status' => 'accept',
        ];

        $this->postJson(route('payments.midtrans.callback'), $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $tagihan->refresh();
        $this->assertSame('partial', $tagihan->status);
    }

    public function test_midtrans_failed_callback_does_not_override_paid_status_when_payment_exists(): void
    {
        $this->mock(MidtransService::class, function ($mock) {
            $mock->shouldReceive('isValidSignature')->andReturnTrue();
        });

        $mahasiswa = $this->seedMahasiswa();

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-MDT-003',
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'status' => 'pending',
        ]);

        $item = TagihanItem::query()->create([
            'tagihan_id' => $tagihan->id,
            'jenis_tagihan_id' => null,
            'kode' => 'SPP',
            'nama' => 'SPP',
            'nominal' => 1500000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1500000,
            'keterangan' => null,
            'sort_order' => 0,
        ]);

        $pembayaran = Pembayaran::query()->create([
            'tagihan_id' => $tagihan->id,
            'mahasiswa_id' => $mahasiswa->id,
            'jenis_pembayaran_id' => null,
            'provider' => 'midtrans',
            'reference' => 'ORD-INV-MDT-003',
            'amount' => 1500000,
            'paid_at' => now(),
            'notes' => null,
            'created_by_user_id' => null,
        ]);

        PembayaranAllocation::query()->create([
            'pembayaran_id' => $pembayaran->id,
            'tagihan_item_id' => $item->id,
            'amount' => 1500000,
        ]);

        $tagihan->refreshStatusFromPayments();
        $tagihan->refresh();
        $this->assertSame('paid', $tagihan->status);

        $trx = Transaksi::query()->create([
            'tagihan_id' => $tagihan->id,
            'order_id' => 'ORD-INV-MDT-003',
            'gross_amount' => 1500000,
            'status' => 'pending',
            'payload' => [],
        ]);

        $payload = [
            'order_id' => $trx->order_id,
            'transaction_status' => 'cancel',
            'status_code' => '200',
            'gross_amount' => '1500000',
            'signature_key' => 'ignored-by-mock',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'trx-004',
            'fraud_status' => 'accept',
        ];

        $this->postJson(route('payments.midtrans.callback'), $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $tagihan->refresh();
        $this->assertSame('paid', $tagihan->status);
    }

    public function test_midtrans_success_callback_records_payment_even_without_mahasiswa_id(): void
    {
        $this->mock(MidtransService::class, function ($mock) {
            $mock->shouldReceive('isValidSignature')->andReturnTrue();
        });

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => null,
            'pmb_id' => null,
            'kode_tagihan' => 'INV-MDT-NOMHS-001',
            'jenis' => 'pmb_pendaftaran',
            'tahun_akademik' => null,
            'semester_akademik' => null,
            'nominal' => 300000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 300000,
            'status' => 'pending',
        ]);

        $trx = Transaksi::query()->create([
            'tagihan_id' => $tagihan->id,
            'order_id' => 'ORD-INV-MDT-NOMHS-001',
            'gross_amount' => 300000,
            'status' => 'pending',
            'payload' => [],
        ]);

        $payload = [
            'order_id' => $trx->order_id,
            'transaction_status' => 'settlement',
            'status_code' => '200',
            'gross_amount' => '300000',
            'signature_key' => 'ignored-by-mock',
            'payment_type' => 'qris',
            'transaction_id' => 'trx-003',
            'fraud_status' => 'accept',
        ];

        $this->postJson(route('payments.midtrans.callback'), $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $tagihan->refresh();
        $this->assertSame('paid', $tagihan->status);

        $this->assertTrue(
            Pembayaran::query()
                ->where('tagihan_id', $tagihan->id)
                ->where('provider', 'midtrans')
                ->where('reference', $trx->order_id)
                ->exists()
        );

        $pembayaran = Pembayaran::query()
            ->where('tagihan_id', $tagihan->id)
            ->where('provider', 'midtrans')
            ->where('reference', $trx->order_id)
            ->firstOrFail();

        $this->assertNull($pembayaran->mahasiswa_id);
        $this->assertSame(300000.0, (float) $tagihan->paidAmount());
    }
}

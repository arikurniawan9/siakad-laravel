<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\Jurusan;
use App\Models\Mahasiswa;
use App\Models\Pembayaran;
use App\Models\Prodi;
use App\Models\Tagihan;
use App\Models\TagihanItem;
use App\Models\Transaksi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceGatewayCallbackTest extends TestCase
{
    use RefreshDatabase;

    private function seedMahasiswa(): Mahasiswa
    {
        $jurusan = Jurusan::query()->create([
            'kode' => 'JUR-CB',
            'nama' => 'Jurusan Callback',
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRODI-CB',
            'nama' => 'Prodi Callback',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
        ]);

        return Mahasiswa::query()->create([
            'prodi_id' => $prodi->id,
            'nim' => '20261234',
            'nama' => 'Mahasiswa Callback',
            'jenis_kelamin' => 'L',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);
    }

    private function seedTagihanAndTransaksi(string $kode, string $orderId, float $amount = 500000): array
    {
        $mahasiswa = $this->seedMahasiswa();

        $tagihan = Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => $kode,
            'jenis' => 'SPP',
            'tahun_akademik' => '2026/2027',
            'semester_akademik' => 1,
            'nominal' => $amount,
            'potongan' => 0,
            'denda' => 0,
            'total' => $amount,
            'status' => 'pending',
        ]);

        TagihanItem::query()->create([
            'tagihan_id' => $tagihan->id,
            'jenis_tagihan_id' => null,
            'kode' => 'SPP',
            'nama' => 'SPP',
            'nominal' => $amount,
            'potongan' => 0,
            'denda' => 0,
            'total' => $amount,
            'keterangan' => null,
            'sort_order' => 0,
        ]);

        $trx = Transaksi::query()->create([
            'tagihan_id' => $tagihan->id,
            'order_id' => $orderId,
            'gross_amount' => $amount,
            'status' => 'pending',
            'payload' => [],
        ]);

        return [$tagihan, $trx];
    }

    public function test_xendit_success_callback_records_payment(): void
    {
        AppSetting::query()->create([
            'key' => 'payment_gateway',
            'value' => [
                'xendit' => [
                    'callback_token' => 'xendit-token-test',
                ],
            ],
        ]);

        [$tagihan, $trx] = $this->seedTagihanAndTransaksi('INV-XDT-001', 'ORD-XDT-001');

        $payload = [
            'external_id' => $trx->order_id,
            'status' => 'PAID',
            'payment_method' => 'QRIS',
            'id' => 'xendit-tx-001',
        ];

        $this->withHeaders(['x-callback-token' => 'xendit-token-test'])
            ->postJson(route('payments.xendit.callback'), $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $tagihan->refresh();
        $this->assertSame('paid', $tagihan->status);
        $this->assertTrue(
            Pembayaran::query()
                ->where('provider', 'xendit')
                ->where('reference', $trx->order_id)
                ->where('tagihan_id', $tagihan->id)
                ->exists()
        );
    }

    public function test_xendit_callback_rejects_invalid_token(): void
    {
        AppSetting::query()->create([
            'key' => 'payment_gateway',
            'value' => [
                'xendit' => [
                    'callback_token' => 'xendit-token-test',
                ],
            ],
        ]);

        [, $trx] = $this->seedTagihanAndTransaksi('INV-XDT-002', 'ORD-XDT-002');

        $payload = [
            'external_id' => $trx->order_id,
            'status' => 'PAID',
            'payment_method' => 'QRIS',
            'id' => 'xendit-tx-002',
        ];

        $this->withHeaders(['x-callback-token' => 'wrong-token'])
            ->postJson(route('payments.xendit.callback'), $payload)
            ->assertStatus(403);
    }

    public function test_xendit_callback_rejects_when_token_not_configured(): void
    {
        [, $trx] = $this->seedTagihanAndTransaksi('INV-XDT-003', 'ORD-XDT-003');

        $payload = [
            'external_id' => $trx->order_id,
            'status' => 'PAID',
            'payment_method' => 'QRIS',
            'id' => 'xendit-tx-003',
        ];

        $this->postJson(route('payments.xendit.callback'), $payload)
            ->assertStatus(503);
    }

    public function test_duitku_success_callback_records_payment(): void
    {
        $merchantCode = 'DTEST01';
        AppSetting::query()->create([
            'key' => 'payment_gateway',
            'value' => [
                'duitku' => [
                    'merchant_code' => $merchantCode,
                    'api_key' => 'duitku-api-key-test',
                ],
            ],
        ]);

        [$tagihan, $trx] = $this->seedTagihanAndTransaksi('INV-DTK-001', 'ORD-DTK-001');
        $amount = '500000';
        $signature = md5($merchantCode.$amount.$trx->order_id.'duitku-api-key-test');

        $payload = [
            'merchantCode' => $merchantCode,
            'amount' => $amount,
            'merchantOrderId' => $trx->order_id,
            'signature' => $signature,
            'resultCode' => '00',
            'paymentCode' => 'VC',
            'reference' => 'duitku-ref-001',
        ];

        $this->postJson(route('payments.duitku.callback'), $payload)
            ->assertOk()
            ->assertJson(['message' => 'ok']);

        $tagihan->refresh();
        $this->assertSame('paid', $tagihan->status);
        $this->assertTrue(
            Pembayaran::query()
                ->where('provider', 'duitku')
                ->where('reference', $trx->order_id)
                ->where('tagihan_id', $tagihan->id)
                ->exists()
        );
    }

    public function test_duitku_callback_rejects_invalid_signature(): void
    {
        $merchantCode = 'DTEST01';
        AppSetting::query()->create([
            'key' => 'payment_gateway',
            'value' => [
                'duitku' => [
                    'merchant_code' => $merchantCode,
                    'api_key' => 'duitku-api-key-test',
                ],
            ],
        ]);

        [, $trx] = $this->seedTagihanAndTransaksi('INV-DTK-002', 'ORD-DTK-002');

        $payload = [
            'merchantCode' => $merchantCode,
            'amount' => '500000',
            'merchantOrderId' => $trx->order_id,
            'signature' => 'invalid-signature',
            'resultCode' => '00',
        ];

        $this->postJson(route('payments.duitku.callback'), $payload)
            ->assertStatus(403);
    }

    public function test_duitku_callback_rejects_invalid_merchant_code(): void
    {
        AppSetting::query()->create([
            'key' => 'payment_gateway',
            'value' => [
                'duitku' => [
                    'merchant_code' => 'DTEST01',
                    'api_key' => 'duitku-api-key-test',
                ],
            ],
        ]);

        [, $trx] = $this->seedTagihanAndTransaksi('INV-DTK-003', 'ORD-DTK-003');

        $payload = [
            'merchantCode' => 'WRONG',
            'amount' => '500000',
            'merchantOrderId' => $trx->order_id,
            'signature' => md5('WRONG500000'.$trx->order_id.'duitku-api-key-test'),
            'resultCode' => '00',
        ];

        $this->postJson(route('payments.duitku.callback'), $payload)
            ->assertStatus(403);
    }

    public function test_duitku_callback_rejects_when_api_key_not_configured(): void
    {
        [, $trx] = $this->seedTagihanAndTransaksi('INV-DTK-004', 'ORD-DTK-004');

        $payload = [
            'merchantCode' => 'DTEST01',
            'amount' => '500000',
            'merchantOrderId' => $trx->order_id,
            'signature' => 'any',
            'resultCode' => '00',
        ];

        $this->postJson(route('payments.duitku.callback'), $payload)
            ->assertStatus(503);
    }
}

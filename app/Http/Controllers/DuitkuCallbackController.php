<?php

namespace App\Http\Controllers;

use App\Models\FinanceReconciliation;
use App\Models\Pmb;
use App\Models\Transaksi;
use App\Notifications\PaymentFailed;
use App\Notifications\PaymentSucceeded;
use App\Services\PaymentGatewayConfigService;
use App\Services\PaymentRecordingService;
use App\Support\FinancePeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DuitkuCallbackController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayConfigService $gatewayConfigService,
        private readonly PaymentRecordingService $paymentRecordingService,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();
        $merchantCode = (string) ($payload['merchantCode'] ?? '');
        $amount = (string) ($payload['amount'] ?? '');
        $orderId = (string) ($payload['merchantOrderId'] ?? '');
        $signature = (string) ($payload['signature'] ?? '');

        $duitku = $this->gatewayConfigService->duitku();
        $configuredApiKey = (string) ($duitku['api_key'] ?? '');
        $configuredMerchantCode = (string) ($duitku['merchant_code'] ?? '');

        if ($configuredApiKey === '') {
            return response()->json(['message' => 'Duitku API key is not configured'], 503);
        }

        if ($configuredMerchantCode !== '' && ! hash_equals($configuredMerchantCode, $merchantCode)) {
            return response()->json(['message' => 'Invalid merchant code'], 403);
        }

        $expected = md5($merchantCode.$amount.$orderId.$configuredApiKey);

        if (! hash_equals($expected, $signature)) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $transaksi = Transaksi::query()->where('order_id', $orderId)->latest()->first();
        if (! $transaksi) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $resultCode = (string) ($payload['resultCode'] ?? '01');
        $status = match ($resultCode) {
            '00' => 'success',
            '01' => 'failed',
            default => 'pending',
        };

        $notifyTargets = [];

        DB::transaction(function () use ($transaksi, $payload, $status, &$notifyTargets) {
            $transaksi->update([
                'status' => $status,
                'payment_type' => (string) ($payload['paymentCode'] ?? $transaksi->payment_type),
                'transaction_id' => (string) ($payload['reference'] ?? $transaksi->transaction_id),
                'payload' => $payload,
                'paid_at' => $status === 'success' ? now() : null,
            ]);

            $tagihan = $transaksi->tagihan;
            if (! $tagihan) {
                return;
            }

            if ($status === 'success') {
                if (FinancePeriod::isLocked($tagihan->tahun_akademik, $tagihan->semester_akademik)) {
                    FinanceReconciliation::query()->firstOrCreate(
                        ['provider' => 'duitku', 'order_id' => (string) $transaksi->order_id],
                        [
                            'transaksi_id' => $transaksi->id,
                            'tagihan_id' => $tagihan->id,
                            'amount' => (float) $transaksi->gross_amount,
                            'payment_type' => $transaksi->payment_type,
                            'transaction_id' => $transaksi->transaction_id,
                            'status' => 'pending',
                            'reason' => 'Periode terkunci (closing) saat callback sukses diterima.',
                            'created_at' => now(),
                        ]
                    );

                    return;
                }

                $this->paymentRecordingService->recordGatewayPayment(
                    $tagihan,
                    'duitku',
                    (string) $transaksi->order_id,
                    (float) $transaksi->gross_amount,
                );
            }

            $tagihan->refreshStatusFromPayments();

            if ($status === 'success') {
                if ($tagihan->pmb_id) {
                    $pmbStatus = $tagihan->status === 'paid' ? 'paid' : 'pending';
                    Pmb::query()->whereKey($tagihan->pmb_id)->update(['status_pembayaran' => $pmbStatus]);
                    $pmb = Pmb::query()->with('user')->find($tagihan->pmb_id);
                    if ($pmb?->user) {
                        $notifyTargets[] = [
                            'user' => $pmb->user,
                            'notification' => new PaymentSucceeded(
                                'Pembayaran PMB berhasil',
                                'Pembayaran pendaftaran PMB '.$pmb->nomor_pendaftaran.' telah berhasil diproses.',
                                'pmb',
                                'pmb.payment',
                                'Buka PMB',
                                'success',
                                $tagihan->kode_tagihan,
                                $transaksi->order_id
                            ),
                        ];
                    }
                }
                if ($tagihan->mahasiswa_id) {
                    $mahasiswa = $tagihan->mahasiswa()->with('user')->first();
                    if ($mahasiswa?->user) {
                        $notifyTargets[] = [
                            'user' => $mahasiswa->user,
                            'notification' => new PaymentSucceeded(
                                'Pembayaran tagihan berhasil',
                                'Tagihan '.$tagihan->kode_tagihan.' untuk '.$mahasiswa->nama.' telah lunas.',
                                'finance',
                                'mahasiswa.tagihan',
                                'Buka Tagihan',
                                'success',
                                $tagihan->kode_tagihan,
                                $transaksi->order_id
                            ),
                        ];
                    }
                }
            } elseif (in_array($status, ['failed', 'expired', 'cancelled'], true)) {
                if ($tagihan->pmb_id) {
                    $pmbStatus = $tagihan->status === 'paid' ? 'paid' : 'failed';
                    Pmb::query()->whereKey($tagihan->pmb_id)->update(['status_pembayaran' => $pmbStatus]);
                    $pmb = Pmb::query()->with('user')->find($tagihan->pmb_id);
                    if ($pmb?->user) {
                        $notifyTargets[] = [
                            'user' => $pmb->user,
                            'notification' => new PaymentFailed(
                                'Pembayaran PMB gagal',
                                'Pembayaran pendaftaran PMB '.$pmb->nomor_pendaftaran.' belum berhasil diproses.',
                                'pmb',
                                'pmb.payment',
                                'Coba Bayar Lagi',
                                'warning',
                                $tagihan->kode_tagihan,
                                $transaksi->order_id
                            ),
                        ];
                    }
                }
                if ($tagihan->mahasiswa_id) {
                    $mahasiswa = $tagihan->mahasiswa()->with('user')->first();
                    if ($mahasiswa?->user) {
                        $notifyTargets[] = [
                            'user' => $mahasiswa->user,
                            'notification' => new PaymentFailed(
                                'Pembayaran tagihan belum berhasil',
                                'Tagihan '.$tagihan->kode_tagihan.' untuk '.$mahasiswa->nama.' masih menunggu pembayaran.',
                                'finance',
                                'mahasiswa.tagihan',
                                'Lihat Tagihan',
                                'warning',
                                $tagihan->kode_tagihan,
                                $transaksi->order_id
                            ),
                        ];
                    }
                }
            }
        });

        foreach ($notifyTargets as $target) {
            $target['user']->notify($target['notification']);
        }

        return response()->json(['message' => 'ok']);
    }
}

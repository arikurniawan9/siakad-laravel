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

class XenditCallbackController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayConfigService $gatewayConfigService,
        private readonly PaymentRecordingService $paymentRecordingService,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();
        $token = (string) $request->header('x-callback-token', '');
        $expectedToken = (string) ($this->gatewayConfigService->xendit()['callback_token'] ?? '');

        if ($expectedToken === '') {
            return response()->json(['message' => 'Callback token is not configured'], 503);
        }

        if (! hash_equals($expectedToken, $token)) {
            return response()->json(['message' => 'Invalid callback token'], 403);
        }

        $orderId = (string) ($payload['external_id']
            ?? $payload['reference_id']
            ?? data_get($payload, 'data.reference_id')
            ?? '');

        if ($orderId === '') {
            return response()->json(['message' => 'Order id not found'], 422);
        }

        $statusSource = strtolower((string) ($payload['status']
            ?? $payload['event']
            ?? data_get($payload, 'data.status')
            ?? 'pending'));

        $status = match (true) {
            str_contains($statusSource, 'succeeded'),
            str_contains($statusSource, 'paid'),
            str_contains($statusSource, 'captured'),
            str_contains($statusSource, 'settled') => 'success',
            str_contains($statusSource, 'expired') => 'expired',
            str_contains($statusSource, 'cancel'),
            str_contains($statusSource, 'failed') => 'failed',
            default => 'pending',
        };

        $transaksi = Transaksi::query()->where('order_id', $orderId)->latest()->first();
        if (! $transaksi) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $notifyTargets = [];

        DB::transaction(function () use ($transaksi, $payload, $status, &$notifyTargets) {
            $transaksi->update([
                'status' => $status,
                'transaction_id' => (string) ($payload['id'] ?? data_get($payload, 'data.id') ?? $transaksi->transaction_id),
                'payment_type' => (string) ($payload['payment_method'] ?? data_get($payload, 'data.payment_method') ?? $transaksi->payment_type),
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
                        ['provider' => 'xendit', 'order_id' => (string) $transaksi->order_id],
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
                    'xendit',
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

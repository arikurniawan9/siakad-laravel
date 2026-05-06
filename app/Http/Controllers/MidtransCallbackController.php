<?php

namespace App\Http\Controllers;

use App\Models\Pmb;
use App\Models\Pembayaran;
use App\Models\PembayaranAllocation;
use App\Models\FinanceReconciliation;
use App\Models\TagihanItem;
use App\Models\Transaksi;
use App\Notifications\PaymentFailed;
use App\Notifications\PaymentSucceeded;
use App\Services\MidtransService;
use App\Support\Audit;
use App\Support\FinancePeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MidtransCallbackController extends Controller
{
    public function __construct(private readonly MidtransService $midtransService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! $this->midtransService->isValidSignature($payload)) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $orderId = $payload['order_id'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? 'pending';
        $fraudStatus = $payload['fraud_status'] ?? null;
        $paymentType = $payload['payment_type'] ?? null;
        $transactionId = $payload['transaction_id'] ?? null;

        $transaksi = Transaksi::query()->where('order_id', $orderId)->latest()->first();
        if (! $transaksi) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $status = match ($transactionStatus) {
            'settlement', 'capture' => $fraudStatus === 'challenge' ? 'pending' : 'success',
            'deny' => 'failed',
            'cancel' => 'cancelled',
            'expire' => 'expired',
            default => 'pending',
        };

        $notifyTargets = [];

        DB::transaction(function () use ($transaksi, $status, $paymentType, $transactionId, $fraudStatus, $payload, &$notifyTargets) {
            $transaksi->update([
                'status' => $status,
                'payment_type' => $paymentType,
                'transaction_id' => $transactionId,
                'fraud_status' => $fraudStatus,
                'payload' => $payload,
                'paid_at' => $status === 'success' ? now() : null,
            ]);

            $tagihan = $transaksi->tagihan;
            Audit::log(
                source: 'finance',
                action: 'midtrans.callback',
                entityType: 'transaksi',
                entityId: (int) $transaksi->id,
                message: 'Midtrans callback diterima',
                meta: [
                    'order_id' => (string) $transaksi->order_id,
                    'status' => (string) $status,
                    'payment_type' => $paymentType,
                    'transaction_id' => $transactionId,
                ],
                userId: null,
            );

            if ($status === 'success') {
                if ($tagihan) {
                    if (FinancePeriod::isLocked($tagihan->tahun_akademik, $tagihan->semester_akademik)) {
                        FinanceReconciliation::query()->firstOrCreate(
                            ['provider' => 'midtrans', 'order_id' => (string) $transaksi->order_id],
                            [
                                'transaksi_id' => $transaksi->id,
                                'tagihan_id' => $tagihan->id,
                                'amount' => (float) $transaksi->gross_amount,
                                'payment_type' => $paymentType,
                                'transaction_id' => $transactionId,
                                'status' => 'pending',
                                'reason' => 'Periode terkunci (closing) saat callback sukses diterima.',
                                'created_at' => now(),
                            ]
                        );

                        Audit::log(
                            source: 'finance',
                            action: 'period.locked_reject_gateway_payment',
                            entityType: 'tagihan',
                            entityId: (int) $tagihan->id,
                            message: 'Pembayaran gateway ditolak karena periode dikunci',
                            meta: [
                                'kode_tagihan' => (string) $tagihan->kode_tagihan,
                                'order_id' => (string) $transaksi->order_id,
                                'gross_amount' => (float) $transaksi->gross_amount,
                            ],
                            userId: null,
                        );

                        return;
                    }

                    $alreadyRecorded = DB::table('pembayarans')
                        ->whereNull('deleted_at')
                        ->where('tagihan_id', $tagihan->id)
                        ->where('provider', 'midtrans')
                        ->where('reference', $transaksi->order_id)
                        ->exists();

                    $createdPembayaranId = null;

                    if (! $alreadyRecorded) {
                        $items = $tagihan->items()
                            ->orderBy('sort_order')
                            ->orderBy('id')
                            ->get(['id', 'total', 'kode', 'nama', 'nominal', 'potongan', 'denda', 'sort_order']);

                        if ($items->isEmpty()) {
                            $items = collect([
                                TagihanItem::query()->create([
                                    'tagihan_id' => $tagihan->id,
                                    'jenis_tagihan_id' => null,
                                    'kode' => substr((string) ($tagihan->jenis ?? 'ITEM'), 0, 30),
                                    'nama' => substr((string) ($tagihan->jenis ?? 'Item'), 0, 120),
                                    'nominal' => (float) $tagihan->nominal,
                                    'potongan' => (float) $tagihan->potongan,
                                    'denda' => (float) $tagihan->denda,
                                    'total' => (float) $tagihan->total,
                                    'keterangan' => null,
                                    'sort_order' => 0,
                                ]),
                            ]);
                        }

                        $amount = (float) $transaksi->gross_amount;

                        $pembayaran = Pembayaran::query()->create([
                            'tagihan_id' => $tagihan->id,
                            'mahasiswa_id' => filled($tagihan->mahasiswa_id) ? (int) $tagihan->mahasiswa_id : null,
                            'jenis_pembayaran_id' => null,
                            'provider' => 'midtrans',
                            'reference' => (string) $transaksi->order_id,
                            'amount' => $amount,
                            'paid_at' => now(),
                            'notes' => null,
                            'created_by_user_id' => null,
                        ]);
                        $createdPembayaranId = (int) $pembayaran->id;

                        $remaining = $amount;
                        foreach ($items as $item) {
                            if ($remaining <= 0) {
                                break;
                            }

                            $paid = (float) $item->allocations()->sum('amount');
                            $itemRemaining = max((float) $item->total - $paid, 0);
                            if ($itemRemaining <= 0) {
                                continue;
                            }

                            $take = min($remaining, $itemRemaining);
                            if ($take <= 0) {
                                continue;
                            }

                            PembayaranAllocation::query()->create([
                                'pembayaran_id' => $pembayaran->id,
                                'tagihan_item_id' => $item->id,
                                'amount' => $take,
                            ]);

                            $remaining -= $take;
                        }

                        if (round($remaining, 2) > 0) {
                            $firstItem = $items->first();
                            PembayaranAllocation::query()->create([
                                'pembayaran_id' => $pembayaran->id,
                                'tagihan_item_id' => $firstItem->id,
                                'amount' => $remaining,
                            ]);
                        }

                    }

                    $tagihan->refreshStatusFromPayments();

                    if ($createdPembayaranId) {
                        Audit::log(
                            source: 'finance',
                            action: 'pembayaran.create_from_gateway',
                            entityType: 'pembayaran',
                            entityId: $createdPembayaranId,
                            message: 'Pembayaran gateway dicatat',
                            meta: [
                                'tagihan_id' => (int) $tagihan->id,
                                'kode_tagihan' => (string) $tagihan->kode_tagihan,
                                'provider' => 'midtrans',
                                'reference' => (string) $transaksi->order_id,
                                'amount' => (float) $transaksi->gross_amount,
                                'tagihan_status' => (string) $tagihan->status,
                            ],
                            userId: null,
                        );
                    }
                }

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
                    if ($tagihan && $tagihan->pembayarans()->exists()) {
                        $tagihan->refreshStatusFromPayments();
                    }

                    $pmbStatus = $tagihan && $tagihan->status === 'paid' ? 'paid' : 'failed';
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
                    if ($tagihan && $tagihan->pembayarans()->exists()) {
                        $tagihan->refreshStatusFromPayments();
                    }

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

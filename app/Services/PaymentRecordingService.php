<?php

namespace App\Services;

use App\Models\Pembayaran;
use App\Models\PembayaranAllocation;
use App\Models\Tagihan;
use App\Models\TagihanItem;
use Illuminate\Support\Facades\DB;

class PaymentRecordingService
{
    public function recordGatewayPayment(Tagihan $tagihan, string $provider, string $reference, float $amount): ?Pembayaran
    {
        $alreadyRecorded = DB::table('pembayarans')
            ->whereNull('deleted_at')
            ->where('tagihan_id', $tagihan->id)
            ->where('provider', $provider)
            ->where('reference', $reference)
            ->exists();

        if ($alreadyRecorded) {
            return null;
        }

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

        $pembayaran = Pembayaran::query()->create([
            'tagihan_id' => $tagihan->id,
            'mahasiswa_id' => filled($tagihan->mahasiswa_id) ? (int) $tagihan->mahasiswa_id : null,
            'jenis_pembayaran_id' => null,
            'provider' => $provider,
            'reference' => $reference,
            'amount' => $amount,
            'paid_at' => now(),
            'notes' => null,
            'created_by_user_id' => null,
        ]);

        $paidPerItem = DB::table('pembayaran_allocations')
            ->join('pembayarans', 'pembayarans.id', '=', 'pembayaran_allocations.pembayaran_id')
            ->whereNull('pembayarans.deleted_at')
            ->whereIn('pembayaran_allocations.tagihan_item_id', $items->pluck('id')->all())
            ->groupBy('pembayaran_allocations.tagihan_item_id')
            ->selectRaw('pembayaran_allocations.tagihan_item_id as tagihan_item_id, SUM(pembayaran_allocations.amount) as total_paid')
            ->pluck('total_paid', 'tagihan_item_id')
            ->map(fn ($v) => (float) $v);

        $remaining = $amount;
        foreach ($items as $item) {
            if ($remaining <= 0) {
                break;
            }

            $itemPaid = (float) ($paidPerItem[$item->id] ?? 0);
            $itemRemaining = max((float) $item->total - $itemPaid, 0);
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

        return $pembayaran;
    }
}

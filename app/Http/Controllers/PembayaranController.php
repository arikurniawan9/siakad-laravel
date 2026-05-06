<?php

namespace App\Http\Controllers;

use App\Models\Pembayaran;
use App\Models\PembayaranAllocation;
use App\Models\Tagihan;
use App\Support\Audit;
use App\Support\FinancePeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PembayaranController extends Controller
{
    public function store(Request $request, Tagihan $tagihan): RedirectResponse
    {
        $data = $request->validate([
            'jenis_pembayaran_id' => ['nullable', 'integer', 'exists:jenis_pembayarans,id'],
            'provider' => ['nullable', 'string', 'max:20'],
            'reference' => ['nullable', 'string', 'max:100'],
            'paid_at' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'allocations' => ['nullable', 'array'],
            'allocations.*.tagihan_item_id' => ['required_with:allocations', 'integer'],
            'allocations.*.amount' => ['required_with:allocations', 'numeric', 'min:0.01'],
        ]);

        $amount = (float) $data['amount'];
        $provider = filled($data['provider'] ?? null) ? trim((string) $data['provider']) : 'manual';

        $items = $tagihan->items()->orderBy('sort_order')->orderBy('id')->get(['id', 'total']);
        if ($items->isEmpty()) {
            return back()->with('error', 'Tagihan belum memiliki rincian item, tidak dapat menerima pembayaran.');
        }

        if (FinancePeriod::isLocked($tagihan->tahun_akademik, $tagihan->semester_akademik)) {
            return back()->with('error', 'Periode keuangan tagihan ini sudah dikunci. Tidak dapat mencatat pembayaran.');
        }

        $tagihanTotal = (float) $tagihan->total;
        $alreadyPaid = (float) $tagihan->paidAmount();
        $remainingTotal = max($tagihanTotal - $alreadyPaid, 0);
        if (round($amount, 2) > round($remainingTotal, 2)) {
            return back()->with('error', 'Jumlah pembayaran melebihi sisa tagihan. Silakan periksa kembali nominal yang dibayarkan.');
        }

        $allocations = collect($data['allocations'] ?? [])->values();
        if ($allocations->isNotEmpty()) {
            $itemIds = $items->pluck('id')->all();
            foreach ($allocations as $alloc) {
                if (! in_array((int) $alloc['tagihan_item_id'], $itemIds, true)) {
                    return back()->with('error', 'Alokasi pembayaran tidak valid (item tidak ditemukan).');
                }
            }

            $allocationSum = (float) $allocations->sum(fn ($a) => (float) $a['amount']);
            if (round($allocationSum, 2) !== round($amount, 2)) {
                return back()->with('error', 'Total alokasi harus sama dengan jumlah pembayaran.');
            }

            $paidPerItem = DB::table('pembayaran_allocations')
                ->join('pembayarans', 'pembayarans.id', '=', 'pembayaran_allocations.pembayaran_id')
                ->whereNull('pembayarans.deleted_at')
                ->whereIn('pembayaran_allocations.tagihan_item_id', $items->pluck('id')->all())
                ->groupBy('pembayaran_allocations.tagihan_item_id')
                ->selectRaw('pembayaran_allocations.tagihan_item_id as tagihan_item_id, SUM(pembayaran_allocations.amount) as total_paid')
                ->pluck('total_paid', 'tagihan_item_id')
                ->map(fn ($v) => (float) $v);

            foreach ($allocations as $alloc) {
                $itemId = (int) $alloc['tagihan_item_id'];
                $allocAmount = (float) $alloc['amount'];
                $itemTotal = (float) ($items->firstWhere('id', $itemId)?->total ?? 0);
                $itemRemaining = max($itemTotal - (float) ($paidPerItem[$itemId] ?? 0), 0);
                if (round($allocAmount, 2) > round($itemRemaining, 2)) {
                    return back()->with('error', 'Alokasi pembayaran melebihi sisa salah satu item tagihan.');
                }
            }
        }

        DB::transaction(function () use ($tagihan, $data, $amount, $provider, $allocations, $items) {
            $pembayaran = Pembayaran::query()->create([
                'tagihan_id' => $tagihan->id,
                'mahasiswa_id' => (int) $tagihan->mahasiswa_id,
                'jenis_pembayaran_id' => filled($data['jenis_pembayaran_id'] ?? null) ? (int) $data['jenis_pembayaran_id'] : null,
                'provider' => $provider,
                'reference' => filled($data['reference'] ?? null) ? trim((string) $data['reference']) : null,
                'amount' => $amount,
                'paid_at' => filled($data['paid_at'] ?? null) ? $data['paid_at'] : now(),
                'notes' => filled($data['notes'] ?? null) ? trim((string) $data['notes']) : null,
                'created_by_user_id' => auth()->id(),
            ]);

            $finalAllocations = $allocations;
            if ($finalAllocations->isEmpty()) {
                $remaining = $amount;

                foreach ($items as $item) {
                    if ($remaining <= 0) break;

                    $paid = (float) $item->allocations()->sum('amount');
                    $itemRemaining = max((float) $item->total - $paid, 0);
                    if ($itemRemaining <= 0) continue;

                    $take = min($remaining, $itemRemaining);
                    if ($take <= 0) continue;

                    $finalAllocations->push([
                        'tagihan_item_id' => $item->id,
                        'amount' => $take,
                    ]);

                    $remaining -= $take;
                }

                if (round($remaining, 2) > 0) {
                    $firstItem = $items->first();
                    $finalAllocations->push([
                        'tagihan_item_id' => $firstItem->id,
                        'amount' => $remaining,
                    ]);
                }
            }

            foreach ($finalAllocations as $alloc) {
                PembayaranAllocation::query()->create([
                    'pembayaran_id' => $pembayaran->id,
                    'tagihan_item_id' => (int) $alloc['tagihan_item_id'],
                    'amount' => (float) $alloc['amount'],
                ]);
            }

            $tagihan->refreshStatusFromPayments();

            Audit::log(
                source: 'finance',
                action: 'pembayaran.create',
                entityType: 'pembayaran',
                entityId: (int) $pembayaran->id,
                message: 'Pembayaran dicatat',
                meta: [
                    'tagihan_id' => (int) $tagihan->id,
                    'kode_tagihan' => (string) $tagihan->kode_tagihan,
                    'provider' => (string) $provider,
                    'reference' => filled($data['reference'] ?? null) ? trim((string) $data['reference']) : null,
                    'amount' => $amount,
                ],
            );
        });

        return back()->with('success', 'Pembayaran berhasil dicatat.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Mahasiswa;
use App\Models\JenisTagihan;
use App\Models\JenisPembayaran;
use App\Models\Tagihan;
use App\Models\TagihanItem;
use App\Models\Transaksi;
use App\Models\FinanceReconciliation;
use App\Notifications\TagihanIssued;
use App\Notifications\TagihanStatusChanged;
use App\Support\Audit;
use App\Support\FinancePeriod;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class KeuanganController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_tagihan' => Tagihan::count(),
            'pending' => Tagihan::where('status', 'pending')->count(),
            'paid' => Tagihan::where('status', 'paid')->count(),
            'nominal_pending' => (float) Tagihan::where('status', 'pending')->sum('total'),
            'nominal_paid' => (float) Tagihan::where('status', 'paid')->sum('total'),
        ];

        $transactionStats = [
            'total' => Transaksi::query()->count(),
            'success' => Transaksi::query()->where('status', 'success')->count(),
            'pending' => Transaksi::query()->where('status', 'pending')->count(),
            'failed' => Transaksi::query()->whereIn('status', ['failed', 'expired', 'cancelled'])->count(),
            'nominal_success' => (float) Transaksi::query()->where('status', 'success')->sum('gross_amount'),
            'nominal_pending' => (float) Transaksi::query()->where('status', 'pending')->sum('gross_amount'),
            'reconciliation_pending' => FinanceReconciliation::query()->where('status', 'pending')->count(),
            'reconciliation_pending_over_24h' => FinanceReconciliation::query()
                ->where('status', 'pending')
                ->where('created_at', '<=', now()->subHours(24))
                ->count(),
            'reconciliation_oldest_pending_hours' => (int) floor(
                now()->diffInSeconds(
                    optional(
                        FinanceReconciliation::query()
                            ->where('status', 'pending')
                            ->oldest('created_at')
                            ->first()
                    )->created_at ?? now()
                ) / 3600
            ),
        ];

        $recentTransaksis = Transaksi::query()
            ->with(['tagihan:id,mahasiswa_id,kode_tagihan,jenis,total,status', 'tagihan.mahasiswa:id,nim,nama'])
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (Transaksi $transaksi) => [
                'id' => $transaksi->id,
                'order_id' => $transaksi->order_id,
                'payment_type' => $transaksi->payment_type,
                'gross_amount' => (float) $transaksi->gross_amount,
                'status' => $transaksi->status,
                'paid_at' => optional($transaksi->paid_at)->toDateTimeString(),
                'created_at' => optional($transaksi->created_at)->toDateTimeString(),
                'tagihan' => [
                    'kode_tagihan' => $transaksi->tagihan?->kode_tagihan,
                    'jenis' => $transaksi->tagihan?->jenis,
                ],
                'mahasiswa' => [
                    'nim' => $transaksi->tagihan?->mahasiswa?->nim,
                    'nama' => $transaksi->tagihan?->mahasiswa?->nama,
                ],
            ]);

        $recentTagihans = Tagihan::query()
            ->with(['mahasiswa:id,nim,nama'])
            ->withCount('transaksis')
            ->whereIn('status', ['pending', 'partial'])
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (Tagihan $tagihan) => [
                'id' => $tagihan->id,
                'kode_tagihan' => $tagihan->kode_tagihan,
                'jenis' => $tagihan->jenis,
                'tahun_akademik' => $tagihan->tahun_akademik,
                'semester_akademik' => $tagihan->semester_akademik,
                'total' => (float) $tagihan->total,
                'status' => $tagihan->status,
                'transaksis_count' => (int) $tagihan->transaksis_count,
                'jatuh_tempo' => optional($tagihan->jatuh_tempo)->toDateString(),
                'mahasiswa' => $tagihan->mahasiswa ? [
                    'nim' => $tagihan->mahasiswa->nim,
                    'nama' => $tagihan->mahasiswa->nama,
                ] : null,
            ]);

        return Inertia::render('Modules/Keuangan/Index', [
            'stats' => $stats,
            'transactionStats' => $transactionStats,
            'recentTransaksis' => $recentTransaksis,
            'recentTagihans' => $recentTagihans,
        ]);
    }

    public function dashboardPdf(): BinaryFileResponse
    {
        $stats = [
            'total_tagihan' => Tagihan::count(),
            'pending' => Tagihan::where('status', 'pending')->count(),
            'paid' => Tagihan::where('status', 'paid')->count(),
            'nominal_pending' => (float) Tagihan::where('status', 'pending')->sum('total'),
            'nominal_paid' => (float) Tagihan::where('status', 'paid')->sum('total'),
        ];

        $transactionStats = [
            'total' => Transaksi::query()->count(),
            'success' => Transaksi::query()->where('status', 'success')->count(),
            'pending' => Transaksi::query()->where('status', 'pending')->count(),
            'failed' => Transaksi::query()->whereIn('status', ['failed', 'expired', 'cancelled'])->count(),
            'nominal_success' => (float) Transaksi::query()->where('status', 'success')->sum('gross_amount'),
            'nominal_pending' => (float) Transaksi::query()->where('status', 'pending')->sum('gross_amount'),
        ];

        $recentTransaksis = Transaksi::query()
            ->with(['tagihan:id,mahasiswa_id,kode_tagihan,jenis,total,status', 'tagihan.mahasiswa:id,nim,nama'])
            ->latest('id')
            ->limit(10)
            ->get();

        $recentTagihans = Tagihan::query()
            ->with(['mahasiswa:id,nim,nama'])
            ->withCount('transaksis')
            ->whereIn('status', ['pending', 'partial'])
            ->latest('id')
            ->limit(10)
            ->get();

        $pdf = Pdf::loadView('print.keuangan-dashboard', [
            'stats' => $stats,
            'transactionStats' => $transactionStats,
            'recentTransaksis' => $recentTransaksis,
            'recentTagihans' => $recentTagihans,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('Dashboard-Keuangan.pdf');
    }

    public function tagihan(Request $request): Response
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $reconciliation = (string) $request->string('reconciliation', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');
        $allowedSorts = ['latest', 'kode_tagihan', 'jenis', 'tahun_akademik', 'total', 'status'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'latest';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = Tagihan::query()
            ->with([
                'mahasiswa:id,nim,nama',
                'transaksis' => fn ($query) => $query->latest('id'),
                'items' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
                'items.allocations',
                'pembayarans' => fn ($query) => $query->latest('id')->limit(20),
                'pembayarans.jenisPembayaran:id,kode,nama,provider,payment_type,is_active,sort_order',
                'pembayarans.allocations',
            ])
            ->withCount(['transaksis', 'pembayarans'])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode_tagihan', 'like', "%{$search}%")
                        ->orWhere('jenis', 'like', "%{$search}%")
                        ->orWhere('tahun_akademik', 'like', "%{$search}%")
                        ->orWhereHas('mahasiswa', function ($mahasiswaQuery) use ($search) {
                            $mahasiswaQuery
                                ->where('nim', 'like', "%{$search}%")
                                ->orWhere('nama', 'like', "%{$search}%");
                        });
                });
            });

        match ($sortBy) {
            'kode_tagihan' => $query->orderBy('kode_tagihan', $sortDir),
            'jenis' => $query->orderBy('jenis', $sortDir),
            'tahun_akademik' => $query->orderBy('tahun_akademik', $sortDir),
            'total' => $query->orderBy('total', $sortDir),
            'status' => $query->orderBy('status', $sortDir),
            default => $query->orderBy('id', 'desc'),
        };

        $tagihanPage = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Modules/Keuangan/Tagihan', [
            'mahasiswas' => Mahasiswa::query()
                ->select('id', 'nim', 'nama')
                ->orderBy('nama')
                ->limit(500)
                ->get(),
            'jenisPembayarans' => JenisPembayaran::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('nama')
                ->get(['id', 'kode', 'nama', 'provider', 'payment_type']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'tagihans' => [
                'data' => collect($tagihanPage->items())->map(function (Tagihan $tagihan) {
                    $paidAmount = (float) $tagihan->paidAmount();

                    return [
                    'id' => $tagihan->id,
                    'kode_tagihan' => $tagihan->kode_tagihan,
                    'jenis' => $tagihan->jenis,
                    'tahun_akademik' => $tagihan->tahun_akademik,
                    'semester_akademik' => $tagihan->semester_akademik,
                    'nominal' => (float) $tagihan->nominal,
                    'potongan' => (float) $tagihan->potongan,
                    'denda' => (float) $tagihan->denda,
                    'total' => (float) $tagihan->total,
                    'paid_amount' => $paidAmount,
                    'remaining_amount' => max((float) $tagihan->total - $paidAmount, 0),
                    'jatuh_tempo' => optional($tagihan->jatuh_tempo)->toDateString(),
                    'status' => $tagihan->status,
                    'transaksis_count' => (int) $tagihan->transaksis_count,
                    'pembayarans_count' => (int) $tagihan->pembayarans_count,
                    'items' => $tagihan->items->map(function ($item) {
                        $paid = (float) $item->allocations->sum('amount');

                        return [
                            'id' => $item->id,
                            'kode' => $item->kode,
                            'nama' => $item->nama,
                            'nominal' => (float) $item->nominal,
                            'potongan' => (float) $item->potongan,
                            'denda' => (float) $item->denda,
                            'total' => (float) $item->total,
                            'paid_amount' => $paid,
                            'remaining_amount' => max((float) $item->total - $paid, 0),
                            'keterangan' => $item->keterangan,
                            'sort_order' => (int) $item->sort_order,
                        ];
                    })->values(),
                    'pembayarans' => $tagihan->pembayarans->map(fn ($pembayaran) => [
                        'id' => $pembayaran->id,
                        'amount' => (float) $pembayaran->amount,
                        'paid_at' => optional($pembayaran->paid_at)->toDateTimeString(),
                        'provider' => $pembayaran->provider,
                        'reference' => $pembayaran->reference,
                        'notes' => $pembayaran->notes,
                        'jenis_pembayaran' => $pembayaran->jenisPembayaran ? [
                            'id' => $pembayaran->jenisPembayaran->id,
                            'kode' => $pembayaran->jenisPembayaran->kode,
                            'nama' => $pembayaran->jenisPembayaran->nama,
                        ] : null,
                        'allocations' => $pembayaran->allocations->map(fn ($alloc) => [
                            'id' => $alloc->id,
                            'tagihan_item_id' => $alloc->tagihan_item_id,
                            'amount' => (float) $alloc->amount,
                        ])->values(),
                    ])->values(),
                    'transactions' => $tagihan->transaksis->map(fn (Transaksi $transaksi) => [
                        'id' => $transaksi->id,
                        'order_id' => $transaksi->order_id,
                        'payment_type' => $transaksi->payment_type,
                        'gross_amount' => (float) $transaksi->gross_amount,
                        'status' => $transaksi->status,
                        'fraud_status' => $transaksi->fraud_status,
                        'paid_at' => optional($transaksi->paid_at)->toDateTimeString(),
                        'created_at' => optional($transaksi->created_at)->toDateTimeString(),
                        'redirect_url' => $transaksi->snap_redirect_url,
                    ])->values(),
                    'mahasiswa' => $tagihan->mahasiswa ? [
                        'id' => $tagihan->mahasiswa->id,
                        'nim' => $tagihan->mahasiswa->nim,
                        'nama' => $tagihan->mahasiswa->nama,
                    ] : null,
                ];
                })->values(),
                'meta' => [
                    'current_page' => $tagihanPage->currentPage(),
                    'last_page' => $tagihanPage->lastPage(),
                    'per_page' => $tagihanPage->perPage(),
                    'total' => $tagihanPage->total(),
                    'from' => $tagihanPage->firstItem(),
                    'to' => $tagihanPage->lastItem(),
                ],
                'links' => collect($tagihanPage->linkCollection())->map(fn ($link) => [
                    'url' => $link['url'],
                    'label' => strip_tags($link['label']),
                    'active' => $link['active'],
                ])->values(),
            ],
        ]);
    }

    public function tagihanPdf(Request $request)
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');

        $query = Tagihan::query()
            ->with(['mahasiswa:id,nim,nama'])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode_tagihan', 'like', "%{$search}%")
                        ->orWhere('jenis', 'like', "%{$search}%")
                        ->orWhere('tahun_akademik', 'like', "%{$search}%")
                        ->orWhereHas('mahasiswa', function ($mahasiswaQuery) use ($search) {
                            $mahasiswaQuery
                                ->where('nim', 'like', "%{$search}%")
                                ->orWhere('nama', 'like', "%{$search}%");
                        });
                });
            });

        match ($sortBy) {
            'kode_tagihan' => $query->orderBy('kode_tagihan', $sortDir === 'asc' ? 'asc' : 'desc'),
            'jenis' => $query->orderBy('jenis', $sortDir === 'asc' ? 'asc' : 'desc'),
            'tahun_akademik' => $query->orderBy('tahun_akademik', $sortDir === 'asc' ? 'asc' : 'desc'),
            'total' => $query->orderBy('total', $sortDir === 'asc' ? 'asc' : 'desc'),
            'status' => $query->orderBy('status', $sortDir === 'asc' ? 'asc' : 'desc'),
            default => $query->orderBy('id', 'desc'),
        };

        $rows = $query->get();

        $pdf = Pdf::loadView('print.tagihans', [
            'rows' => $rows,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ])->setPaper('a4', 'landscape');

        return $pdf->download('Data-Tagihan.pdf');
    }

    public function storeTagihan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'mahasiswa_id' => ['required', 'exists:mahasiswas,id'],
            'tahun_akademik' => ['nullable', 'string', 'max:20'],
            'semester_akademik' => ['nullable', 'integer', 'min:1', 'max:14'],
            'jatuh_tempo' => ['nullable', 'date'],
            'keterangan' => ['nullable', 'string'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.jenis_tagihan_id' => ['nullable', 'integer', 'exists:jenis_tagihans,id'],
            'items.*.kode' => ['nullable', 'string', 'max:30'],
            'items.*.nama' => ['nullable', 'string', 'max:120'],
            'items.*.nominal' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.potongan' => ['nullable', 'numeric', 'min:0'],
            'items.*.denda' => ['nullable', 'numeric', 'min:0'],
            'items.*.keterangan' => ['nullable', 'string', 'max:2000'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],

            // Backward compatible (single item)
            'jenis' => ['nullable', 'string', 'max:30'],
            'nominal' => ['nullable', 'numeric', 'min:0'],
            'potongan' => ['nullable', 'numeric', 'min:0'],
            'denda' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (FinancePeriod::isLocked($data['tahun_akademik'] ?? null, $data['semester_akademik'] ?? null)) {
            return back()->with('error', 'Periode keuangan ini sudah dikunci. Tidak dapat membuat tagihan baru pada periode tersebut.');
        }

        $items = collect($data['items'] ?? [])->values();
        if ($items->isEmpty()) {
            $items = collect([[
                'jenis_tagihan_id' => null,
                'kode' => (string) ($data['jenis'] ?? 'SPP'),
                'nama' => (string) ($data['jenis'] ?? 'SPP'),
                'nominal' => (float) ($data['nominal'] ?? 0),
                'potongan' => (float) ($data['potongan'] ?? 0),
                'denda' => (float) ($data['denda'] ?? 0),
                'keterangan' => null,
                'sort_order' => 0,
            ]]);
        }

        $jenisTagihanMap = JenisTagihan::query()
            ->whereIn('id', $items->pluck('jenis_tagihan_id')->filter()->unique()->values())
            ->get(['id', 'kode', 'nama'])
            ->keyBy('id');

        $normalizedItems = $items->map(function ($item, int $idx) use ($jenisTagihanMap) {
            $jenis = filled($item['jenis_tagihan_id'] ?? null) ? $jenisTagihanMap->get((int) $item['jenis_tagihan_id']) : null;
            $kode = strtoupper(trim((string) ($item['kode'] ?? ($jenis?->kode ?? 'ITEM'))));
            $nama = trim((string) ($item['nama'] ?? ($jenis?->nama ?? $kode)));
            $nominal = (float) ($item['nominal'] ?? 0);
            $potongan = (float) ($item['potongan'] ?? 0);
            $denda = (float) ($item['denda'] ?? 0);
            $total = max($nominal - $potongan + $denda, 0);

            return [
                'jenis_tagihan_id' => filled($item['jenis_tagihan_id'] ?? null) ? (int) $item['jenis_tagihan_id'] : null,
                'kode' => substr($kode, 0, 30),
                'nama' => substr($nama, 0, 120),
                'nominal' => $nominal,
                'potongan' => $potongan,
                'denda' => $denda,
                'total' => $total,
                'keterangan' => filled($item['keterangan'] ?? null) ? trim((string) $item['keterangan']) : null,
                'sort_order' => (int) ($item['sort_order'] ?? $idx),
            ];
        });

        $sumNominal = (float) $normalizedItems->sum('nominal');
        $sumPotongan = (float) $normalizedItems->sum('potongan');
        $sumDenda = (float) $normalizedItems->sum('denda');
        $sumTotal = (float) $normalizedItems->sum('total');

        $jenis = $normalizedItems->count() === 1 ? (string) $normalizedItems->first()['kode'] : 'MULTI';

        $tagihan = Tagihan::create([
            'mahasiswa_id' => (int) $data['mahasiswa_id'],
            'kode_tagihan' => 'INV-'.now()->format('ymdHis').'-'.strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 4)),
            'jenis' => substr($jenis, 0, 30),
            'tahun_akademik' => $data['tahun_akademik'] ?? null,
            'semester_akademik' => $data['semester_akademik'] ?? null,
            'nominal' => $sumNominal,
            'potongan' => $sumPotongan,
            'denda' => $sumDenda,
            'total' => max($sumTotal, 0),
            'jatuh_tempo' => $data['jatuh_tempo'] ?? null,
            'status' => 'pending',
            'keterangan' => $data['keterangan'] ?? null,
        ]);

        foreach ($normalizedItems as $item) {
            TagihanItem::query()->create([
                'tagihan_id' => $tagihan->id,
                ...$item,
            ]);
        }

        $mahasiswa = Mahasiswa::query()->with('user')->find($data['mahasiswa_id']);
        if ($mahasiswa?->user) {
            $mahasiswa->user->notify(new TagihanIssued(
                $tagihan->kode_tagihan,
                $tagihan->jenis,
                $mahasiswa->nama,
                (float) $tagihan->total
            ));
        }

        Audit::log(
            source: 'finance',
            action: 'tagihan.create',
            entityType: 'tagihan',
            entityId: (int) $tagihan->id,
            message: 'Tagihan dibuat',
            meta: [
                'kode_tagihan' => $tagihan->kode_tagihan,
                'total' => (float) $tagihan->total,
                'mahasiswa_id' => (int) $tagihan->mahasiswa_id,
            ],
        );

        return back()->with('success', 'Tagihan berhasil ditambahkan.');
    }

    public function updateTagihanStatus(Request $request, Tagihan $tagihan): RedirectResponse
    {
        $previousStatus = $tagihan->status;
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'partial', 'paid', 'cancelled'])],
        ]);

        if (FinancePeriod::isLocked($tagihan->tahun_akademik, $tagihan->semester_akademik)) {
            return back()->with('error', 'Periode keuangan tagihan ini sudah dikunci. Status tidak dapat diubah.');
        }

        $tagihan->update([
            'status' => $data['status'],
            'paid_at' => $data['status'] === 'paid' ? now() : null,
        ]);

        Audit::log(
            source: 'finance',
            action: 'tagihan.status_update',
            entityType: 'tagihan',
            entityId: (int) $tagihan->id,
            message: 'Status tagihan diperbarui',
            meta: [
                'before' => (string) $previousStatus,
                'after' => (string) $data['status'],
                'kode_tagihan' => $tagihan->kode_tagihan,
            ],
        );

        if ($previousStatus !== $data['status'] && $tagihan->mahasiswa_id) {
            $mahasiswa = Mahasiswa::query()->with('user')->find($tagihan->mahasiswa_id);
            if ($mahasiswa?->user) {
                $mahasiswa->user->notify(new TagihanStatusChanged(
                    $tagihan->kode_tagihan,
                    $mahasiswa->nama,
                    (string) $previousStatus,
                    (string) $data['status'],
                    (float) $tagihan->total
                ));
            }
        }

        return back()->with('success', 'Status tagihan berhasil diperbarui.');
    }

    public function destroyTagihan(Tagihan $tagihan): RedirectResponse
    {
        if ($tagihan->transaksis()->exists() || $tagihan->pembayarans()->exists() || $tagihan->status !== 'pending') {
            return back()->with('error', 'Tagihan tidak dapat dihapus karena sudah memiliki transaksi/pembayaran atau statusnya bukan pending.');
        }

        if (FinancePeriod::isLocked($tagihan->tahun_akademik, $tagihan->semester_akademik)) {
            return back()->with('error', 'Periode keuangan tagihan ini sudah dikunci. Tagihan tidak dapat dihapus.');
        }

        Audit::log(
            source: 'finance',
            action: 'tagihan.delete',
            entityType: 'tagihan',
            entityId: (int) $tagihan->id,
            message: 'Tagihan dihapus',
            meta: [
                'kode_tagihan' => $tagihan->kode_tagihan,
                'total' => (float) $tagihan->total,
            ],
        );

        $tagihan->delete();

        return back()->with('success', 'Tagihan berhasil dihapus.');
    }

    public function transaksi(Request $request): Response
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');
        $allowedSorts = ['latest', 'order_id', 'payment_type', 'gross_amount', 'status', 'paid_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'latest';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = Transaksi::query()
            ->with(['tagihan:id,mahasiswa_id,kode_tagihan,jenis,total,status', 'tagihan.mahasiswa:id,nim,nama'])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($reconciliation === 'pending', function ($query) {
                $query->whereExists(function ($sub) {
                    $sub->selectRaw('1')
                        ->from('finance_reconciliations')
                        ->whereColumn('finance_reconciliations.transaksi_id', 'transaksis.id')
                        ->where('finance_reconciliations.status', 'pending');
                });
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('order_id', 'like', "%{$search}%")
                        ->orWhere('payment_type', 'like', "%{$search}%")
                        ->orWhere('transaction_id', 'like', "%{$search}%")
                        ->orWhereHas('tagihan', function ($tagihanQuery) use ($search) {
                            $tagihanQuery
                                ->where('kode_tagihan', 'like', "%{$search}%")
                                ->orWhere('jenis', 'like', "%{$search}%")
                                ->orWhereHas('mahasiswa', function ($mahasiswaQuery) use ($search) {
                                    $mahasiswaQuery
                                        ->where('nama', 'like', "%{$search}%")
                                        ->orWhere('nim', 'like', "%{$search}%");
                                });
                        });
                });
            });

        match ($sortBy) {
            'order_id' => $query->orderBy('order_id', $sortDir),
            'payment_type' => $query->orderBy('payment_type', $sortDir),
            'gross_amount' => $query->orderBy('gross_amount', $sortDir),
            'status' => $query->orderBy('status', $sortDir),
            'paid_at' => $query->orderBy('paid_at', $sortDir),
            default => $query->orderBy('id', 'desc'),
        };

        $transaksiPage = $query->paginate($perPage)->withQueryString();
        $transaksiIds = collect($transaksiPage->items())->pluck('id')->filter()->values();
        $pendingReconciliations = FinanceReconciliation::query()
            ->whereIn('transaksi_id', $transaksiIds)
            ->where('status', 'pending')
            ->get(['transaksi_id', 'id', 'reason', 'created_at'])
            ->keyBy('transaksi_id');

        $stats = [
            'total_transaksi' => Transaksi::query()->count(),
            'success' => Transaksi::query()->where('status', 'success')->count(),
            'pending' => Transaksi::query()->where('status', 'pending')->count(),
            'failed' => Transaksi::query()->whereIn('status', ['failed', 'expired', 'cancelled'])->count(),
            'nominal_success' => (float) Transaksi::query()->where('status', 'success')->sum('gross_amount'),
            'reconciliation_pending' => FinanceReconciliation::query()->where('status', 'pending')->count(),
            'reconciliation_pending_over_24h' => FinanceReconciliation::query()
                ->where('status', 'pending')
                ->where('created_at', '<', now()->subDay())
                ->count(),
            'reconciliation_oldest_pending_hours' => (int) floor(
                max(
                    0,
                    now()->diffInSeconds(
                        FinanceReconciliation::query()
                            ->where('status', 'pending')
                            ->oldest('created_at')
                            ->value('created_at') ?? now()
                    ) / 3600
                )
            ),
        ];

        return Inertia::render('Modules/Keuangan/Transaksi', [
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'reconciliation' => $reconciliation,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'transaksis' => [
                'data' => collect($transaksiPage->items())->map(function (Transaksi $transaksi) use ($pendingReconciliations) {
                    $reconciliation = $pendingReconciliations->get($transaksi->id);

                    return [
                        'id' => $transaksi->id,
                        'order_id' => $transaksi->order_id,
                        'payment_type' => $transaksi->payment_type,
                        'transaction_id' => $transaksi->transaction_id,
                        'gross_amount' => (float) $transaksi->gross_amount,
                        'status' => $transaksi->status,
                        'fraud_status' => $transaksi->fraud_status,
                        'paid_at' => optional($transaksi->paid_at)->toDateTimeString(),
                        'created_at' => optional($transaksi->created_at)->toDateTimeString(),
                        'snap_redirect_url' => $transaksi->snap_redirect_url,
                        'reconciliation' => $reconciliation ? [
                            'id' => (int) $reconciliation->id,
                            'status' => 'pending',
                            'reason' => (string) ($reconciliation->reason ?? ''),
                            'created_at' => optional($reconciliation->created_at)->toDateTimeString(),
                        ] : null,
                        'tagihan' => [
                            'kode_tagihan' => $transaksi->tagihan?->kode_tagihan,
                            'jenis' => $transaksi->tagihan?->jenis,
                            'status' => $transaksi->tagihan?->status,
                            'total' => (float) ($transaksi->tagihan?->total ?? 0),
                        ],
                        'mahasiswa' => [
                            'nim' => $transaksi->tagihan?->mahasiswa?->nim,
                            'nama' => $transaksi->tagihan?->mahasiswa?->nama,
                        ],
                    ];
                })->values(),
                'meta' => [
                    'current_page' => $transaksiPage->currentPage(),
                    'last_page' => $transaksiPage->lastPage(),
                    'per_page' => $transaksiPage->perPage(),
                    'total' => $transaksiPage->total(),
                    'from' => $transaksiPage->firstItem(),
                    'to' => $transaksiPage->lastItem(),
                ],
                'links' => collect($transaksiPage->linkCollection())->map(fn ($link) => [
                    'url' => $link['url'],
                    'label' => strip_tags($link['label']),
                    'active' => $link['active'],
                ])->values(),
            ],
        ]);
    }

    public function transaksiPdf(Request $request)
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $reconciliation = (string) $request->string('reconciliation', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');

        $query = Transaksi::query()
            ->with(['tagihan:id,mahasiswa_id,kode_tagihan,jenis,total,status', 'tagihan.mahasiswa:id,nim,nama'])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($reconciliation === 'pending', function ($query) {
                $query->whereExists(function ($sub) {
                    $sub->selectRaw('1')
                        ->from('finance_reconciliations')
                        ->whereColumn('finance_reconciliations.transaksi_id', 'transaksis.id')
                        ->where('finance_reconciliations.status', 'pending');
                });
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('order_id', 'like', "%{$search}%")
                        ->orWhere('payment_type', 'like', "%{$search}%")
                        ->orWhere('transaction_id', 'like', "%{$search}%")
                        ->orWhereHas('tagihan', function ($tagihanQuery) use ($search) {
                            $tagihanQuery
                                ->where('kode_tagihan', 'like', "%{$search}%")
                                ->orWhere('jenis', 'like', "%{$search}%")
                                ->orWhereHas('mahasiswa', function ($mahasiswaQuery) use ($search) {
                                    $mahasiswaQuery
                                        ->where('nama', 'like', "%{$search}%")
                                        ->orWhere('nim', 'like', "%{$search}%");
                                });
                        });
                });
            });

        match ($sortBy) {
            'order_id' => $query->orderBy('order_id', $sortDir === 'asc' ? 'asc' : 'desc'),
            'payment_type' => $query->orderBy('payment_type', $sortDir === 'asc' ? 'asc' : 'desc'),
            'gross_amount' => $query->orderBy('gross_amount', $sortDir === 'asc' ? 'asc' : 'desc'),
            'status' => $query->orderBy('status', $sortDir === 'asc' ? 'asc' : 'desc'),
            'paid_at' => $query->orderBy('paid_at', $sortDir === 'asc' ? 'asc' : 'desc'),
            default => $query->orderBy('id', 'desc'),
        };

        $rows = $query->get();

        $pdf = Pdf::loadView('print.transaksis', [
            'rows' => $rows,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'reconciliation' => $reconciliation,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ])->setPaper('a4', 'landscape');

        return $pdf->download('Data-Transaksi.pdf');
    }
}

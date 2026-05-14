<?php

namespace App\Http\Controllers;

use App\Models\Mahasiswa;
use App\Models\JenisTagihan;
use App\Models\JenisPembayaran;
use App\Models\Prodi;
use App\Models\Tagihan;
use App\Models\TagihanItem;
use App\Models\TarifKeuangan;
use App\Models\TahunAkademik;
use App\Models\Transaksi;
use App\Models\FinanceReconciliation;
use App\Notifications\TagihanIssued;
use App\Notifications\TagihanStatusChanged;
use App\Services\MidtransService;
use App\Services\PaymentGatewayConfigService;
use App\Services\TagihanService;
use App\Services\XenditService;
use App\Services\DuitkuService;
use App\Support\Audit;
use App\Support\FinancePeriod;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class KeuanganController extends Controller
{
    public function __construct(
        private readonly TagihanService $tagihanService,
        private readonly MidtransService $midtransService,
        private readonly PaymentGatewayConfigService $gatewayConfigService,
        private readonly XenditService $xenditService,
        private readonly DuitkuService $duitkuService,
    ) {
    }

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
        $activeTahun = TahunAkademik::query()
            ->where('is_active', true)
            ->latest('id')
            ->first();

        $defaultTahunAkademik = $activeTahun?->kode
            ?? (now()->year.'/'.(now()->year + 1));
        $defaultSemesterAkademik = (int) ($activeTahun?->semester_aktif ?? 1);

        $activeTarifs = TarifKeuangan::query()
            ->with('jenisTagihan:id,kode,nama')
            ->where('is_active', true)
            ->where('tahun_akademik', $defaultTahunAkademik)
            ->where('semester_akademik', $defaultSemesterAkademik)
            ->orderBy('jenis_tagihan_id')
            ->get()
            ->map(fn (TarifKeuangan $tarif) => [
                'id' => (int) $tarif->id,
                'jenis_tagihan_id' => (int) $tarif->jenis_tagihan_id,
                'kode' => $tarif->jenisTagihan?->kode ?? ('TRF-'.$tarif->id),
                'nama' => $tarif->jenisTagihan?->nama ?? ('Tarif #'.$tarif->id),
                'nominal' => (float) $tarif->nominal,
                'tahun_akademik' => $tarif->tahun_akademik,
                'semester_akademik' => (int) $tarif->semester_akademik,
                'can_installment' => (bool) $tarif->can_installment,
                'installment_max' => (int) ($tarif->installment_max ?? 1),
                'installment_default' => (int) ($tarif->installment_default ?? 1),
                'label' => ($tarif->jenisTagihan?->nama ?? ('Tarif #'.$tarif->id)).' - Rp '.number_format((float) $tarif->nominal, 0, ',', '.'),
            ])->values();

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
            'prodis' => Prodi::query()
                ->orderBy('nama')
                ->get(['id', 'nama']),
            'angkatans' => Mahasiswa::query()
                ->whereNotNull('angkatan')
                ->where('angkatan', '!=', '')
                ->distinct()
                ->orderByDesc('angkatan')
                ->pluck('angkatan')
                ->values(),
            'activeTarifs' => $activeTarifs,
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
                            'jatuh_tempo' => optional($item->jatuh_tempo)->toDateString(),
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
            'installment_months' => ['nullable', 'integer', 'min:1', 'max:24'],

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

        $installmentMonths = max(1, (int) ($data['installment_months'] ?? 1));
        $baseDueDate = filled($data['jatuh_tempo'] ?? null) ? Carbon::parse((string) $data['jatuh_tempo']) : null;
        if ($installmentMonths > 1) {
            $splitItems = collect();
            foreach ($normalizedItems as $item) {
                $total = (float) ($item['total'] ?? 0);
                $chunks = $this->splitInstallmentAmounts($total, $installmentMonths);
                foreach ($chunks as $index => $chunkAmount) {
                    $splitItems->push([
                        'jenis_tagihan_id' => $item['jenis_tagihan_id'],
                        'kode' => substr((string) $item['kode'], 0, 22).'-'.($index + 1),
                        'nama' => substr((string) $item['nama'].' (Cicilan '.($index + 1).'/'.$installmentMonths.')', 0, 120),
                        'nominal' => $chunkAmount,
                        'potongan' => 0,
                        'denda' => 0,
                        'total' => $chunkAmount,
                        'jatuh_tempo' => $baseDueDate ? $baseDueDate->copy()->addMonthsNoOverflow($index)->toDateString() : null,
                        'keterangan' => trim((string) (($item['keterangan'] ?? '').' | Cicilan '.($index + 1).' dari '.$installmentMonths)),
                        'sort_order' => ((int) $item['sort_order'] * 100) + $index,
                    ]);
                }
            }
            $normalizedItems = $splitItems->values();
        } else {
            $normalizedItems = $normalizedItems->map(function (array $item) use ($baseDueDate) {
                $item['jatuh_tempo'] = $baseDueDate ? $baseDueDate->toDateString() : null;

                return $item;
            });
        }

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

    private function splitInstallmentAmounts(float $amount, int $months): array
    {
        $safeMonths = max(1, $months);
        $amountInt = (int) round($amount);
        $base = intdiv($amountInt, $safeMonths);
        $remainder = $amountInt % $safeMonths;
        $chunks = [];

        for ($i = 0; $i < $safeMonths; $i++) {
            $chunks[] = (float) ($base + ($i < $remainder ? 1 : 0));
        }

        return $chunks;
    }

    public function storeBulkTagihan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tahun_akademik' => ['required', 'string', 'max:20'],
            'semester_akademik' => ['required', 'integer', 'min:1', 'max:14'],
            'tarif_ids' => ['required', 'array', 'min:1'],
            'tarif_ids.*' => ['required', 'integer', 'exists:tarif_keuangans,id'],
            'prodi_id' => ['nullable', 'integer', 'exists:prodis,id'],
            'angkatan' => ['nullable', 'string', 'max:10'],
            'jatuh_tempo' => ['nullable', 'date'],
        ]);

        if (FinancePeriod::isLocked($data['tahun_akademik'], $data['semester_akademik'])) {
            return back()->with('error', 'Periode keuangan ini sudah dikunci.');
        }

        $result = $this->tagihanService->bulkGenerate($data);

        if ($result['success'] === 0 && $result['skipped'] > 0) {
            return back()->with('warning', "Tidak ada tagihan baru yang dibuat. {$result['skipped']} mahasiswa dilewati karena sudah memiliki tagihan serupa.");
        }

        return back()->with('success', "Berhasil membuat {$result['success']} tagihan baru. ({$result['skipped']} mahasiswa dilewati).");
    }

    public function createGatewayTransaksi(Tagihan $tagihan): RedirectResponse
    {
        if ($tagihan->status === 'paid') {
            return back()->with('error', 'Tagihan ini sudah lunas.');
        }

        if ((float) $tagihan->total <= 0) {
            return back()->with('error', 'Total tagihan tidak valid untuk dibuat transaksi gateway.');
        }

        $provider = $this->gatewayConfigService->activeProvider();
        if ($provider === 'manual') {
            return back()->with('error', 'Provider aktif masih manual. Ubah dulu di Settings > Payment Gateway.');
        }

        $pending = $tagihan->transaksis()
            ->where('status', 'pending')
            ->where(function ($query) {
                $query->whereNotNull('snap_token')
                    ->orWhereNotNull('snap_redirect_url');
            })
            ->latest('id')
            ->first();

        if ($pending) {
            return back()->with('success', 'Transaksi pending Midtrans sudah tersedia. Silakan lanjutkan pembayaran.');
        }

        $mahasiswa = $tagihan->mahasiswa()->first();
        $grossAmount = (int) round((float) $tagihan->total);
        $orderId = 'TAG-ORD-'.$tagihan->id.'-'.now()->timestamp;

        try {
        if ($provider === 'midtrans') {
            if (! $this->gatewayConfigService->isMidtransReady()) {
                return back()->with('error', 'Konfigurasi Midtrans belum lengkap.');
            }
            $modeMismatchReason = $this->midtransService->modeKeyMismatchReason();
            if ($modeMismatchReason !== null) {
                return back()->with('error', $modeMismatchReason);
            }

            $payload = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $grossAmount,
                ],
                'customer_details' => [
                    'first_name' => (string) ($mahasiswa?->nama ?? 'Mahasiswa'),
                    'email' => (string) ($mahasiswa?->email ?? 'tagihan@local.invalid'),
                    'phone' => (string) ($mahasiswa?->phone ?? '081000000000'),
                ],
                'item_details' => [[
                    'id' => (string) $tagihan->kode_tagihan,
                    'price' => $grossAmount,
                    'quantity' => 1,
                    'name' => 'Tagihan '.$tagihan->kode_tagihan,
                ]],
            ];

            $snapToken = $this->midtransService->createSnapToken($payload);
            $midtransConfig = $this->gatewayConfigService->midtrans();
            $baseUrl = ! empty($midtransConfig['is_production'])
                ? 'https://app.midtrans.com/snap/v2/vtweb/'
                : 'https://app.sandbox.midtrans.com/snap/v2/vtweb/';

            Transaksi::query()->create([
                'tagihan_id' => $tagihan->id,
                'order_id' => $orderId,
                'payment_type' => 'snap',
                'gross_amount' => $grossAmount,
                'status' => 'pending',
                'snap_token' => $snapToken,
                'snap_redirect_url' => $baseUrl.$snapToken,
                'payload' => $payload,
            ]);
        } elseif ($provider === 'xendit') {
            if (! $this->gatewayConfigService->isXenditReady()) {
                return back()->with('error', 'Konfigurasi Xendit belum lengkap.');
            }

            $payload = [
                'external_id' => $orderId,
                'amount' => $grossAmount,
                'description' => 'Tagihan '.$tagihan->kode_tagihan,
                'payer_email' => (string) ($mahasiswa?->email ?? 'tagihan@local.invalid'),
                'currency' => 'IDR',
                'invoice_duration' => 86400,
                'success_redirect_url' => route('keuangan.tagihan'),
                'failure_redirect_url' => route('keuangan.tagihan'),
            ];

            $invoice = $this->xenditService->createInvoice($payload);

            Transaksi::query()->create([
                'tagihan_id' => $tagihan->id,
                'order_id' => $orderId,
                'payment_type' => 'xendit_invoice',
                'transaction_id' => $invoice['id'] ?: null,
                'gross_amount' => $grossAmount,
                'status' => 'pending',
                'snap_redirect_url' => $invoice['invoice_url'] ?: null,
                'payload' => $invoice['raw'],
            ]);
        } elseif ($provider === 'duitku') {
            if (! $this->gatewayConfigService->isDuitkuReady()) {
                return back()->with('error', 'Konfigurasi Duitku belum lengkap.');
            }

            $duitku = $this->gatewayConfigService->duitku();
            $signature = md5($duitku['merchant_code'].$orderId.$grossAmount.$duitku['api_key']);
            $payload = [
                'merchantCode' => $duitku['merchant_code'],
                'paymentAmount' => $grossAmount,
                'paymentMethod' => 'VC',
                'merchantOrderId' => $orderId,
                'productDetails' => 'Tagihan '.$tagihan->kode_tagihan,
                'email' => (string) ($mahasiswa?->email ?? 'tagihan@local.invalid'),
                'phoneNumber' => (string) ($mahasiswa?->phone ?? '081000000000'),
                'callbackUrl' => route('payments.duitku.callback'),
                'returnUrl' => route('keuangan.tagihan'),
                'signature' => $signature,
                'expiryPeriod' => 1440,
            ];

            $invoice = $this->duitkuService->createInvoice($payload);

            Transaksi::query()->create([
                'tagihan_id' => $tagihan->id,
                'order_id' => $orderId,
                'payment_type' => 'duitku',
                'transaction_id' => $invoice['reference'] ?: null,
                'gross_amount' => $grossAmount,
                'status' => 'pending',
                'snap_redirect_url' => $invoice['payment_url'],
                'payload' => $invoice['raw'],
            ]);
        } else {
            return back()->with('error', "Provider {$provider} tidak dikenali.");
        }
        } catch (Throwable $e) {
            return back()->with('error', 'Gagal membuat transaksi gateway: '.$e->getMessage());
        }

        Audit::log(
            source: 'finance',
            action: 'gateway.create_transaksi',
            entityType: 'tagihan',
            entityId: (int) $tagihan->id,
            message: 'Transaksi gateway dibuat dari halaman tagihan',
            meta: [
                'kode_tagihan' => (string) $tagihan->kode_tagihan,
                'provider' => $provider,
                'order_id' => (string) $orderId,
                'gross_amount' => $grossAmount,
            ],
        );

        return back()->with('success', 'Transaksi gateway berhasil dibuat. Buka detail transaksi untuk melanjutkan pembayaran.');
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
        $reconciliation = (string) $request->string('reconciliation', 'all');
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

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePmbRequest;
use App\Models\Pmb;
use App\Models\Prodi;
use App\Models\Tagihan;
use App\Models\TagihanItem;
use App\Models\Transaksi;
use App\Notifications\PmbVerificationChanged;
use App\Notifications\PmbRegistered;
use App\Exports\PmbPendingExport;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\MidtransService;
use App\Services\PmbService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PmbController extends Controller
{
    public function __construct(
        private readonly PmbService $pmbService,
        private readonly MidtransService $midtransService,
    ) {
    }

    public function index(Request $request): Response
    {
        $userId = auth()->id();
        $summary = [
            'total' => Pmb::query()->where('user_id', $userId)->count(),
            'verified' => Pmb::query()->where('user_id', $userId)->where('status_verifikasi', 'verified')->count(),
            'pending' => Pmb::query()->where('user_id', $userId)->where('status_verifikasi', 'pending')->count(),
            'paid' => Pmb::query()->where('user_id', $userId)->where('status_pembayaran', 'paid')->count(),
        ];

        $canManage = auth()->user()?->hasAnyRole(['super-admin', 'admin', 'operator', 'baak']) ?? false;
        $verificationSearch = trim((string) $request->string('verification_search'));
        $verificationStatus = (string) $request->string('verification_status');
        $verificationPaymentStatus = (string) $request->string('verification_payment_status');
        $verificationPerPage = (int) $request->integer('verification_per_page', 10);
        if (! in_array($verificationPerPage, [10, 30, 50, 100], true)) {
            $verificationPerPage = 10;
        }

        $verificationQuery = $canManage
            ? $this->buildVerificationQuery($verificationSearch, $verificationStatus, $verificationPaymentStatus)
            : null;

        $verificationItems = $verificationQuery
            ? $verificationQuery->latest()->paginate(
                $verificationPerPage,
                [
                    'id',
                    'user_id',
                    'prodi_id',
                    'nomor_pendaftaran',
                    'gelombang',
                    'nama_lengkap',
                    'email',
                    'phone',
                    'asal_sekolah',
                    'dokumen_ktp',
                    'dokumen_ijazah',
                    'dokumen_foto',
                    'status_verifikasi',
                    'status_pembayaran',
                    'nim_generated',
                    'catatan',
                    'created_at',
                ]
            )->withQueryString()
            : null;

        $verificationSummary = $canManage
            ? [
                'total' => Pmb::query()->count(),
                'pending' => Pmb::query()->where('status_verifikasi', 'pending')->count(),
                'verified' => Pmb::query()->where('status_verifikasi', 'verified')->count(),
                'rejected' => Pmb::query()->where('status_verifikasi', 'rejected')->count(),
            ]
            : null;

        return Inertia::render('Modules/Pmb/Index', [
            'prodis' => Prodi::query()->select('id', 'nama', 'jenjang')->orderBy('nama')->get(),
            'riwayat' => Pmb::query()
                ->where('user_id', $userId)
                ->latest()
                ->limit(5)
                ->get(['id', 'nomor_pendaftaran', 'gelombang', 'status_verifikasi', 'status_pembayaran', 'created_at', 'nama_lengkap', 'prodi_id']),
            'summary' => $summary,
            'verificationItems' => $verificationItems,
            'verificationSummary' => $verificationSummary,
            'canManageVerification' => $canManage,
            'verificationFilters' => [
                'search' => $verificationSearch,
                'status' => $verificationStatus === '' ? 'all' : $verificationStatus,
                'payment_status' => $verificationPaymentStatus === '' ? 'all' : $verificationPaymentStatus,
                'per_page' => $verificationPerPage,
            ],
        ]);
    }

    public function store(StorePmbRequest $request): RedirectResponse
    {
        $data = $request->validated();

        foreach (['dokumen_ktp', 'dokumen_ijazah', 'dokumen_foto'] as $field) {
            if ($request->hasFile($field)) {
                $data[$field] = $request->file($field)->store('pmb-documents', 'local');
            }
        }

        $pmb = Pmb::query()->create([
            ...$data,
            'user_id' => $request->user()->id,
            'nomor_pendaftaran' => $this->pmbService->generateNomorPendaftaran(),
        ]);

        $request->user()->notify(new PmbRegistered($pmb->nomor_pendaftaran, $pmb->nama_lengkap));

        return redirect()->route('pmb.index')->with('success', 'Pendaftaran PMB berhasil disimpan.');
    }

    public function downloadDocument(Pmb $pmb, string $field)
    {
        abort_unless(
            auth()->user()?->hasAnyRole(['super-admin', 'admin', 'operator', 'baak']) || $pmb->user_id === auth()->id(),
            403
        );

        if (! in_array($field, ['dokumen_ktp', 'dokumen_ijazah', 'dokumen_foto'], true)) {
            abort(404);
        }

        $path = (string) ($pmb->{$field} ?? '');
        if ($path === '' || ! Str::startsWith($path, 'pmb-documents/')) {
            abort(404);
        }

        if (Storage::disk('local')->exists($path)) {
            return Storage::disk('local')->download($path, basename($path));
        }

        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->download($path, basename($path));
        }

        abort(404);
    }

    public function payment(): Response
    {
        $userId = auth()->id();
        $summary = [
            'total' => Pmb::query()->where('user_id', $userId)->count(),
            'paid' => Pmb::query()->where('user_id', $userId)->where('status_pembayaran', 'paid')->count(),
            'unpaid' => Pmb::query()->where('user_id', $userId)->where('status_pembayaran', 'unpaid')->count(),
        ];

        $items = Pmb::query()
            ->where('user_id', $userId)
            ->latest()
            ->get()
            ->map(function (Pmb $pmb) {
                $latestTransaction = $pmb->tagihans()
                    ->with(['transaksis' => fn ($q) => $q->latest()])
                    ->get()
                    ->pluck('transaksis')
                    ->flatten()
                    ->sortByDesc('created_at')
                    ->first();

                return [
                    'id' => $pmb->id,
                    'nomor_pendaftaran' => $pmb->nomor_pendaftaran,
                    'nama_lengkap' => $pmb->nama_lengkap,
                    'status_pembayaran' => $pmb->status_pembayaran,
                    'snap_token' => $latestTransaction?->snap_token,
                ];
            });

        return Inertia::render('Modules/Pmb/Payment', [
            'pmbItems' => $items,
            'registrationFee' => (int) config('siakad.pmb_registration_fee'),
            'summary' => $summary,
        ]);
    }

    public function createSnap(Pmb $pmb): RedirectResponse
    {
        abort_unless($pmb->user_id === auth()->id(), 403);
        if (! config('services.midtrans.server_key') || ! config('services.midtrans.client_key')) {
            return redirect()->route('pmb.payment')->with('error', 'Konfigurasi Midtrans belum lengkap.');
        }

        $fee = (int) config('siakad.pmb_registration_fee');

        DB::transaction(function () use ($pmb, $fee) {
            $tagihan = Tagihan::query()->firstOrCreate(
                ['pmb_id' => $pmb->id, 'jenis' => 'pmb_pendaftaran'],
                [
                    'mahasiswa_id' => null,
                    'kode_tagihan' => 'PMB-TAG-'.now()->format('YmdHis').'-'.$pmb->id,
                    'nominal' => $fee,
                    'potongan' => 0,
                    'denda' => 0,
                    'total' => $fee,
                    'status' => 'pending',
                ]
            );

            if ($tagihan->status === 'paid') {
                return;
            }

            if (! $tagihan->items()->exists()) {
                TagihanItem::query()->create([
                    'tagihan_id' => $tagihan->id,
                    'jenis_tagihan_id' => null,
                    'kode' => 'PMB-REG',
                    'nama' => 'Biaya Pendaftaran PMB',
                    'nominal' => (float) $tagihan->nominal,
                    'potongan' => (float) $tagihan->potongan,
                    'denda' => (float) $tagihan->denda,
                    'total' => (float) $tagihan->total,
                    'keterangan' => null,
                    'sort_order' => 0,
                ]);
            }

            $orderId = 'PMB-ORD-'.$pmb->id.'-'.now()->timestamp;
            $payload = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => (int) $tagihan->total,
                ],
                'customer_details' => [
                    'first_name' => $pmb->nama_lengkap,
                    'email' => $pmb->email,
                    'phone' => $pmb->phone,
                ],
                'item_details' => [[
                    'id' => 'PMB-REG',
                    'price' => (int) $tagihan->total,
                    'quantity' => 1,
                    'name' => 'Biaya Pendaftaran PMB',
                ]],
            ];

            $snapToken = $this->midtransService->createSnapToken($payload);

            Transaksi::query()->create([
                'tagihan_id' => $tagihan->id,
                'order_id' => $orderId,
                'gross_amount' => $tagihan->total,
                'status' => 'pending',
                'snap_token' => $snapToken,
                'payload' => $payload,
            ]);
        });

        return redirect()->route('pmb.payment')->with('success', 'Transaksi Midtrans berhasil dibuat.');
    }

    public function updateVerification(Pmb $pmb): RedirectResponse
    {
        abort_unless(auth()->user()?->hasAnyRole(['super-admin', 'admin', 'operator', 'baak']) ?? false, 403);

        request()->validate([
            'status_verifikasi' => ['required', Rule::in(['pending', 'verified', 'rejected'])],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $before = $pmb->status_verifikasi;
        $status = (string) request()->string('status_verifikasi');
        $catatan = request()->filled('catatan') ? trim((string) request()->string('catatan')) : null;

        $pmb->update([
            'status_verifikasi' => $status,
            'catatan' => $catatan,
        ]);

        if ($pmb->user) {
            $pmb->user->notify(new PmbVerificationChanged(
                $pmb->nomor_pendaftaran,
                $pmb->nama_lengkap,
                $before,
                $status,
                $pmb->prodi?->nama ?? '-',
                $catatan,
            ));
        }

        return redirect()->route('pmb.index')->with('success', 'Status verifikasi PMB berhasil diperbarui.');
    }

    public function exportVerificationCsv(Request $request): StreamedResponse
    {
        abort_unless(auth()->user()?->hasAnyRole(['super-admin', 'admin', 'operator', 'baak']) ?? false, 403);

        $search = trim((string) $request->string('verification_search'));
        $paymentStatus = (string) $request->string('verification_payment_status');
        $rows = $this->buildVerificationQuery($search, 'pending', $paymentStatus)
            ->latest()
            ->get();

        $filename = 'PMB-Pending-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['nomor_pendaftaran', 'nama_lengkap', 'prodi', 'gelombang', 'email', 'phone', 'asal_sekolah', 'status_verifikasi', 'status_pembayaran', 'catatan', 'created_at']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->nomor_pendaftaran,
                    $row->nama_lengkap,
                    $row->prodi?->nama ? $row->prodi->nama.' ('.$row->prodi->jenjang.')' : '-',
                    $row->gelombang,
                    $row->email,
                    $row->phone,
                    $row->asal_sekolah,
                    $row->status_verifikasi,
                    $row->status_pembayaran,
                    $row->catatan,
                    optional($row->created_at)->toDateTimeString(),
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function exportVerificationPdf(Request $request)
    {
        abort_unless(auth()->user()?->hasAnyRole(['super-admin', 'admin', 'operator', 'baak']) ?? false, 403);

        $search = trim((string) $request->string('verification_search'));
        $paymentStatus = (string) $request->string('verification_payment_status');
        $rows = $this->buildVerificationQuery($search, 'pending', $paymentStatus)
            ->latest()
            ->get();

        $pdf = Pdf::loadView('print.pmb-pending', [
            'rows' => $rows,
            'filters' => [
                'search' => $search,
                'status' => 'pending',
                'payment_status' => $paymentStatus === '' ? 'all' : $paymentStatus,
            ],
            'total' => $rows->count(),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('PMB-Pending-'.now()->format('Ymd-His').'.pdf');
    }

    public function exportVerificationXlsx(Request $request)
    {
        abort_unless(auth()->user()?->hasAnyRole(['super-admin', 'admin', 'operator', 'baak']) ?? false, 403);

        $search = trim((string) $request->string('verification_search'));
        $paymentStatus = (string) $request->string('verification_payment_status');
        $rows = $this->buildVerificationQuery($search, 'pending', $paymentStatus)
            ->latest()
            ->get()
            ->map(fn (Pmb $row) => [
                $row->nomor_pendaftaran,
                $row->nama_lengkap,
                $row->prodi?->nama ? $row->prodi->nama.' ('.$row->prodi->jenjang.')' : '-',
                $row->gelombang,
                $row->email,
                $row->phone,
                $row->asal_sekolah,
                $row->status_verifikasi,
                $row->status_pembayaran,
                $row->catatan,
                optional($row->created_at)->toDateTimeString(),
            ])->values()->all();

        return Excel::download(
            new PmbPendingExport($rows),
            'PMB-Pending-'.now()->format('Ymd-His').'.xlsx'
        );
    }

    private function buildVerificationQuery(string $search, string $status = 'all', string $paymentStatus = 'all'): Builder
    {
        $query = Pmb::query()->with(['user:id,name,email', 'prodi:id,nama,jenjang']);

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('nomor_pendaftaran', 'like', '%'.$search.'%')
                    ->orWhere('nama_lengkap', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhereHas('prodi', function ($prodiQuery) use ($search) {
                        $prodiQuery->where('nama', 'like', '%'.$search.'%');
                    });
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status_verifikasi', $status);
        }

        if ($paymentStatus !== '' && $paymentStatus !== 'all') {
            $query->where('status_pembayaran', $paymentStatus);
        }

        return $query;
    }
}

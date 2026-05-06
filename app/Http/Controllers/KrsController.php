<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\Krs;
use App\Models\KrsDetail;
use App\Models\Mahasiswa;
use App\Models\TahunAkademik;
use App\Notifications\KrsStatusUpdated;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\View\View;

class KrsController extends Controller
{
    private const MAX_SKS = 24;

    public function index(Request $request): Response
    {
        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');
        $allowedSorts = ['latest', 'tahun_akademik', 'semester_akademik', 'total_sks', 'status'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'latest';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $kelasAktif = Kelas::query()
            ->with(['mataKuliah:id,kode,nama,sks', 'dosen:id,nama', 'ruanganRef:id,nama', 'jadwals:id,kelas_id,hari_ke,jam_mulai,jam_selesai'])
            ->when($tahunAktif, fn ($q) => $q->where('tahun_akademik_id', $tahunAktif->id))
            ->where('is_active', true)
            ->orderBy('semester_akademik')
            ->limit(200)
            ->get();

        $query = Krs::query()
            ->with(['mahasiswa:id,nim,nama', 'details.kelas.mataKuliah:id,kode,nama,sks', 'approvedByUser:id,name', 'rejectedByUser:id,name'])
            ->when($tahunAktif, fn ($q) => $q->where('tahun_akademik_id', $tahunAktif->id))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->whereHas('mahasiswa', function ($mq) use ($search) {
                    $mq->where('nim', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%");
                });
            });

        match ($sortBy) {
            'tahun_akademik' => $query->orderBy('tahun_akademik', $sortDir),
            'semester_akademik' => $query->orderBy('semester_akademik', $sortDir),
            'total_sks' => $query->orderBy('total_sks', $sortDir),
            'status' => $query->orderBy('status', $sortDir),
            default => $query->orderBy('id', 'desc'),
        };

        $krsPage = $query
            ->paginate($perPage, ['id', 'mahasiswa_id', 'tahun_akademik_id', 'tahun_akademik', 'semester_akademik', 'total_sks', 'status', 'approved_by', 'rejected_by', 'approved_at', 'rejected_at', 'updated_at'])
            ->withQueryString();

        return Inertia::render('Modules/Krs/Index', [
            'tahunAktif' => $tahunAktif,
            'kelasAktif' => $kelasAktif,
            'mahasiswas' => Mahasiswa::query()->orderBy('nama')->limit(400)->get(['id', 'nim', 'nama', 'prodi_id']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'krsList' => [
                'data' => collect($krsPage->items())->map(fn (Krs $krs) => [
                    'id' => $krs->id,
                    'mahasiswa' => $krs->mahasiswa ? [
                        'nim' => $krs->mahasiswa->nim,
                        'nama' => $krs->mahasiswa->nama,
                    ] : null,
                    'tahun_akademik' => $krs->tahun_akademik,
                    'semester_akademik' => $krs->semester_akademik,
                    'total_sks' => $krs->total_sks,
                    'status' => $krs->status,
                    'approved_at' => optional($krs->approved_at)->toDateTimeString(),
                    'rejected_at' => optional($krs->rejected_at)->toDateTimeString(),
                    'approved_by_user' => $krs->approvedByUser ? ['name' => $krs->approvedByUser->name] : null,
                    'rejected_by_user' => $krs->rejectedByUser ? ['name' => $krs->rejectedByUser->name] : null,
                    'details' => $krs->details->map(fn ($detail) => [
                        'sks' => $detail->sks,
                        'kelas' => [
                            'mata_kuliah' => [
                                'kode' => $detail->kelas?->mataKuliah?->kode,
                                'nama' => $detail->kelas?->mataKuliah?->nama,
                            ],
                        ],
                    ])->values(),
                ])->values(),
                'meta' => [
                    'current_page' => $krsPage->currentPage(),
                    'last_page' => $krsPage->lastPage(),
                    'per_page' => $krsPage->perPage(),
                    'total' => $krsPage->total(),
                    'from' => $krsPage->firstItem(),
                    'to' => $krsPage->lastItem(),
                ],
                'links' => collect($krsPage->linkCollection())->map(fn ($link) => [
                    'url' => $link['url'],
                    'label' => strip_tags($link['label']),
                    'active' => $link['active'],
                ])->values(),
            ],
            'maxSks' => self::MAX_SKS,
        ]);
    }

    public function indexPdf(Request $request)
    {
        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');

        $query = Krs::query()
            ->with(['mahasiswa:id,nim,nama', 'details.kelas.mataKuliah:id,kode,nama,sks', 'approvedByUser:id,name', 'rejectedByUser:id,name'])
            ->when($tahunAktif, fn ($q) => $q->where('tahun_akademik_id', $tahunAktif->id))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->whereHas('mahasiswa', function ($mq) use ($search) {
                    $mq->where('nim', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%");
                });
            });

        match ($sortBy) {
            'tahun_akademik' => $query->orderBy('tahun_akademik', $sortDir === 'asc' ? 'asc' : 'desc'),
            'semester_akademik' => $query->orderBy('semester_akademik', $sortDir === 'asc' ? 'asc' : 'desc'),
            'total_sks' => $query->orderBy('total_sks', $sortDir === 'asc' ? 'asc' : 'desc'),
            'status' => $query->orderBy('status', $sortDir === 'asc' ? 'asc' : 'desc'),
            default => $query->orderBy('id', 'desc'),
        };

        $rows = $query->get(['id', 'mahasiswa_id', 'tahun_akademik_id', 'tahun_akademik', 'semester_akademik', 'total_sks', 'status', 'approved_by', 'rejected_by', 'approved_at', 'rejected_at', 'updated_at']);

        $pdf = Pdf::loadView('print.krs-list', [
            'rows' => $rows,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'tahunAktif' => $tahunAktif,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('Data-KRS.pdf');
    }

    public function store(Request $request): RedirectResponse
    {
        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();
        if (!$tahunAktif) {
            return back()->withErrors(['tahun' => 'Tahun akademik aktif belum diset.']);
        }

        $data = $request->validate([
            'mahasiswa_id' => ['required', 'exists:mahasiswas,id'],
            'kelas_ids' => ['required', 'array', 'min:1'],
            'kelas_ids.*' => ['integer', 'exists:kelas,id'],
            'catatan' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        if ($user?->hasRole('mahasiswa')) {
            $ownedMahasiswaId = (int) ($user->mahasiswa?->id ?? 0);
            if ($ownedMahasiswaId === 0 || (int) $data['mahasiswa_id'] !== $ownedMahasiswaId) {
                abort(403);
            }
        }

        $result = DB::transaction(function () use ($data, $tahunAktif) {
            $kelasAktif = Kelas::query()
                ->with(['mataKuliah:id,sks', 'jadwals:id,kelas_id,hari_ke,jam_mulai,jam_selesai'])
                ->whereIn('id', $data['kelas_ids'])
                ->where('is_active', true)
                ->where('tahun_akademik_id', $tahunAktif->id)
                ->lockForUpdate()
                ->get();

            if ($kelasAktif->count() !== count($data['kelas_ids'])) {
                return ['error' => 'Sebagian kelas tidak valid untuk tahun akademik aktif.'];
            }

            $totalSks = (int) $kelasAktif->sum(fn ($k) => (int) ($k->mataKuliah->sks ?? 0));
            if ($totalSks > self::MAX_SKS) {
                return ['error' => 'Total SKS melebihi batas maksimal '.self::MAX_SKS.' SKS.'];
            }

            $duplicateMataKuliah = $kelasAktif
                ->groupBy('mata_kuliah_id')
                ->first(fn ($group) => $group->count() > 1);
            if ($duplicateMataKuliah) {
                return ['error' => 'Tidak boleh memilih kelas berbeda untuk mata kuliah yang sama.'];
            }

            $kelasDipenuhi = [];
            foreach ($kelasAktif as $kelas) {
                $occupied = KrsDetail::query()
                    ->where('kelas_id', $kelas->id)
                    ->where('status', 'active')
                    ->whereHas('krs', function ($query) use ($tahunAktif) {
                        $query->where('tahun_akademik_id', $tahunAktif->id)
                            ->whereIn('status', ['submitted', 'approved']);
                    })
                    ->count();

                if ($occupied >= (int) $kelas->kapasitas) {
                    $kelasDipenuhi[] = $kelas->kode_kelas;
                }
            }

            if (! empty($kelasDipenuhi)) {
                return ['error' => 'Sebagian kelas sudah penuh: '.implode(', ', $kelasDipenuhi).'.'];
            }

            $jadwals = $kelasAktif
                ->flatMap(fn ($k) => $k->jadwals->map(fn ($j) => [
                    'kelas_id' => $k->id,
                    'hari_ke' => (int) $j->hari_ke,
                    'mulai' => $j->jam_mulai,
                    'selesai' => $j->jam_selesai,
                ]))
                ->values();
            for ($i = 0; $i < $jadwals->count(); $i++) {
                for ($j = $i + 1; $j < $jadwals->count(); $j++) {
                    $a = $jadwals[$i];
                    $b = $jadwals[$j];
                    if ($a['hari_ke'] !== $b['hari_ke']) {
                        continue;
                    }
                    $overlap = $a['mulai'] < $b['selesai'] && $b['mulai'] < $a['selesai'];
                    if ($overlap) {
                        return ['error' => 'Terdapat bentrok jadwal antar kelas yang dipilih.'];
                    }
                }
            }

            $krs = Krs::query()->firstOrCreate(
                [
                    'mahasiswa_id' => $data['mahasiswa_id'],
                    'tahun_akademik' => $tahunAktif->kode,
                    'semester_akademik' => $tahunAktif->semester_aktif,
                ],
                [
                    'tahun_akademik_id' => $tahunAktif->id,
                    'total_sks' => 0,
                    'status' => 'draft',
                ]
            );

            $krs->update([
                'tahun_akademik_id' => $tahunAktif->id,
                'catatan' => $data['catatan'] ?? null,
            ]);

            KrsDetail::query()->where('krs_id', $krs->id)->delete();

            foreach ($kelasAktif as $kelas) {
                KrsDetail::query()->create([
                    'krs_id' => $krs->id,
                    'kelas_id' => $kelas->id,
                    'sks' => (int) ($kelas->mataKuliah->sks ?? 0),
                    'status' => 'active',
                ]);
            }

            $krs->update(['total_sks' => $totalSks]);
            $krs->load('mahasiswa.user');

            if ($krs->mahasiswa?->user) {
                $krs->mahasiswa->user->notify(new KrsStatusUpdated(
                    $krs->id,
                    $krs->status,
                    $krs->tahun_akademik,
                    (int) $krs->semester_akademik,
                    (int) $krs->total_sks
                ));
            }

            return ['error' => null];
        });

        if (! empty($result['error'])) {
            return back()->withErrors(['kelas_ids' => $result['error']]);
        }

        return back()->with('success', 'KRS berhasil disimpan.');
    }

    public function submit(Krs $krs): RedirectResponse
    {
        $user = request()->user();
        if ($user?->hasRole('mahasiswa')) {
            if ((int) ($krs->mahasiswa?->user_id ?? 0) !== (int) $user->id) {
                abort(403);
            }
        }

        if (! $krs->details()->where('status', 'active')->exists()) {
            return back()->withErrors(['status' => 'KRS belum memiliki mata kuliah aktif untuk disubmit.']);
        }

        if ($krs->status !== 'draft' && $krs->status !== 'rejected') {
            return back()->withErrors(['status' => 'KRS tidak dapat disubmit dari status saat ini.']);
        }
        $krs->update(['status' => 'submitted', 'approved_at' => null, 'approved_by' => null, 'rejected_at' => null, 'rejected_by' => null]);
        $krs->load('mahasiswa.user');
        if ($krs->mahasiswa?->user) {
            $krs->mahasiswa->user->notify(new KrsStatusUpdated(
                $krs->id,
                $krs->status,
                $krs->tahun_akademik,
                (int) $krs->semester_akademik,
                (int) $krs->total_sks
            ));
        }
        return back()->with('success', 'KRS berhasil disubmit.');
    }

    public function approve(Krs $krs): RedirectResponse
    {
        if (! request()->user()?->hasAnyRole(['super-admin', 'baak'])) {
            abort(403);
        }
        if ($krs->status !== 'submitted') {
            return back()->withErrors(['status' => 'Hanya KRS submitted yang bisa di-approve.']);
        }
        $krs->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => request()->user()->id,
            'rejected_at' => null,
            'rejected_by' => null,
        ]);
        $krs->load('mahasiswa.user');
        if ($krs->mahasiswa?->user) {
            $krs->mahasiswa->user->notify(new KrsStatusUpdated(
                $krs->id,
                $krs->status,
                $krs->tahun_akademik,
                (int) $krs->semester_akademik,
                (int) $krs->total_sks
            ));
        }
        return back()->with('success', 'KRS berhasil di-approve.');
    }

    public function reject(Krs $krs): RedirectResponse
    {
        if (! request()->user()?->hasAnyRole(['super-admin', 'baak'])) {
            abort(403);
        }
        if ($krs->status !== 'submitted') {
            return back()->withErrors(['status' => 'Hanya KRS submitted yang bisa di-reject.']);
        }
        $krs->update([
            'status' => 'rejected',
            'approved_at' => null,
            'approved_by' => null,
            'rejected_at' => now(),
            'rejected_by' => request()->user()->id,
        ]);
        $krs->load('mahasiswa.user');
        if ($krs->mahasiswa?->user) {
            $krs->mahasiswa->user->notify(new KrsStatusUpdated(
                $krs->id,
                $krs->status,
                $krs->tahun_akademik,
                (int) $krs->semester_akademik,
                (int) $krs->total_sks
            ));
        }
        return back()->with('success', 'KRS berhasil di-reject.');
    }

    public function show(Krs $krs): Response
    {
        if (! $this->canAccessKrs($krs)) {
            abort(403);
        }

        $krs->load([
            'mahasiswa.prodi',
            'details.kelas.mataKuliah',
            'details.kelas.dosen',
            'details.kelas.ruanganRef',
            'details.nilai:id,krs_detail_id,bobot,published_at',
            'approvedByUser:id,name',
            'rejectedByUser:id,name',
        ]);

        $docHash = $this->documentHash($krs);
        $verifyUrl = URL::temporarySignedRoute('krs.verify', now()->addDays(30), ['krs' => $krs->id, 'h' => $docHash]);
        $qrSvg = QrCode::format('svg')->size(120)->margin(1)->generate($verifyUrl);
        $academicSummary = $this->buildAcademicSummary($krs);

        return Inertia::render('Modules/Krs/Show', [
            'krs' => $krs,
            'verifyUrl' => $verifyUrl,
            'docHash' => $docHash,
            'qrSvg' => $qrSvg,
            'academicSummary' => $academicSummary,
        ]);
    }

    public function pdf(Krs $krs)
    {
        if (! $this->canAccessKrs($krs)) {
            abort(403);
        }

        $krs->load([
            'mahasiswa.prodi',
            'details.kelas.mataKuliah',
            'details.kelas.dosen',
            'details.kelas.ruanganRef',
            'details.nilai:id,krs_detail_id,bobot,published_at',
            'approvedByUser:id,name',
            'rejectedByUser:id,name',
        ]);

        $docHash = $this->documentHash($krs);
        $verifyUrl = URL::temporarySignedRoute('krs.verify', now()->addDays(30), ['krs' => $krs->id, 'h' => $docHash]);
        $qrSvg = QrCode::format('svg')->size(120)->margin(1)->generate($verifyUrl);
        $academicSummary = $this->buildAcademicSummary($krs);
        $pdf = Pdf::loadView('print.krs', [
            'krs' => $krs,
            'verifyUrl' => $verifyUrl,
            'docHash' => $docHash,
            'qrSvg' => $qrSvg,
            'academicSummary' => $academicSummary,
        ])->setPaper('a4', 'portrait');

        return $pdf->download('KRS-'.$krs->mahasiswa->nim.'-'.$krs->tahun_akademik.'-S'.$krs->semester_akademik.'.pdf');
    }

    public function print(Krs $krs): View
    {
        if (! $this->canAccessKrs($krs)) {
            abort(403);
        }

        $krs->load([
            'mahasiswa.prodi',
            'details.kelas.mataKuliah',
            'details.kelas.dosen',
            'details.kelas.ruanganRef',
            'details.nilai:id,krs_detail_id,bobot,published_at',
            'approvedByUser:id,name',
            'rejectedByUser:id,name',
        ]);

        $docHash = $this->documentHash($krs);
        $verifyUrl = URL::temporarySignedRoute('krs.verify', now()->addDays(30), ['krs' => $krs->id, 'h' => $docHash]);
        $qrSvg = QrCode::format('svg')->size(120)->margin(1)->generate($verifyUrl);
        $academicSummary = $this->buildAcademicSummary($krs);

        return view('print.krs', [
            'krs' => $krs,
            'verifyUrl' => $verifyUrl,
            'docHash' => $docHash,
            'qrSvg' => $qrSvg,
            'academicSummary' => $academicSummary,
        ]);
    }

    public function verify(Request $request, Krs $krs): View
    {
        $validSignature = $request->hasValidSignature();
        $expectedHash = $this->documentHash($krs);
        $providedHash = (string) $request->query('h', '');
        $validHash = hash_equals($expectedHash, $providedHash);
        $valid = $validSignature && $validHash;

        return view('print.krs-verify', [
            'krs' => $krs->load('mahasiswa:id,nim,nama'),
            'valid' => $valid,
            'validSignature' => $validSignature,
            'validHash' => $validHash,
            'expectedHash' => $expectedHash,
            'providedHash' => $providedHash,
        ]);
    }

    private function canAccessKrs(Krs $krs): bool
    {
        $user = request()->user();
        if (! $user) {
            return false;
        }

        if ($user->hasAnyRole(['super-admin', 'baak', 'dosen'])) {
            return true;
        }

        if ($user->hasRole('mahasiswa')) {
            return (int) ($krs->mahasiswa?->user_id ?? 0) === (int) $user->id;
        }

        return false;
    }

    private function documentHash(Krs $krs): string
    {
        $payload = implode('|', [
            $krs->id,
            $krs->mahasiswa_id,
            $krs->tahun_akademik,
            $krs->semester_akademik,
            $krs->total_sks,
            $krs->status,
            optional($krs->updated_at)->timestamp,
        ]);

        return Str::upper(substr(hash_hmac('sha256', $payload, (string) config('app.key')), 0, 24));
    }

    private function buildAcademicSummary(Krs $krs): array
    {
        $semesterSks = 0.0;
        $semesterBobotSks = 0.0;
        $nilaiFinalCount = 0;
        $nilaiSementaraCount = 0;
        foreach ($krs->details as $detail) {
            $nilai = $detail->nilai;
            if (! $nilai) {
                continue;
            }

            if ($nilai->published_at) {
                $nilaiFinalCount++;
            } else {
                $nilaiSementaraCount++;
            }

            $bobot = (float) ($nilai->bobot ?? 0);
            $sks = (float) ($detail->sks ?? 0);
            if ($bobot <= 0 || $sks <= 0) {
                continue;
            }
            $semesterSks += $sks;
            $semesterBobotSks += $bobot * $sks;
        }
        $ips = $semesterSks > 0 ? round($semesterBobotSks / $semesterSks, 2) : null;

        $approvedKrs = Krs::query()
            ->where('mahasiswa_id', $krs->mahasiswa_id)
            ->where('status', 'approved')
            ->with(['details:id,krs_id,sks', 'details.nilai:id,krs_detail_id,bobot'])
            ->get(['id']);

        $cumSks = 0.0;
        $cumBobotSks = 0.0;
        foreach ($approvedKrs as $row) {
            foreach ($row->details as $detail) {
                $bobot = (float) ($detail->nilai->bobot ?? 0);
                $sks = (float) ($detail->sks ?? 0);
                if ($bobot <= 0 || $sks <= 0) {
                    continue;
                }
                $cumSks += $sks;
                $cumBobotSks += $bobot * $sks;
            }
        }
        $ipk = $cumSks > 0 ? round($cumBobotSks / $cumSks, 2) : null;

        return [
            'semester_sks_ternilai' => (int) $semesterSks,
            'ips_sementara' => $ips,
            'total_sks_lulus' => (int) $cumSks,
            'ipk_sementara' => $ipk,
            'nilai_final_count' => $nilaiFinalCount,
            'nilai_sementara_count' => $nilaiSementaraCount,
        ];
    }
}

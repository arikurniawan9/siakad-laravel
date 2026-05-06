<?php

namespace App\Http\Controllers;

use App\Exports\MahasiswaExport;
use App\Models\Kelas;
use App\Models\Krs;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use App\Models\Tagihan;
use App\Models\TahunAkademik;
use App\Notifications\MahasiswaStatusChanged;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class MahasiswaController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $prodiId = (string) $request->string('prodi_id', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');
        $allowedSorts = ['latest', 'nim', 'nama', 'angkatan', 'status_mahasiswa'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'latest';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = Mahasiswa::query()
            ->with('prodi:id,nama')
            ->when($status !== 'all', fn ($query) => $query->where('status_mahasiswa', $status))
            ->when($prodiId !== 'all', fn ($query) => $query->where('prodi_id', $prodiId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('nim', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });

        match ($sortBy) {
            'nim' => $query->orderBy('nim', $sortDir),
            'nama' => $query->orderBy('nama', $sortDir),
            'angkatan' => $query->orderBy('angkatan', $sortDir),
            'status_mahasiswa' => $query->orderBy('status_mahasiswa', $sortDir),
            default => $query->orderBy('id', 'desc'),
        };

        $page = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Modules/Mahasiswa/Index', [
            'prodis' => Prodi::query()->orderBy('nama')->get(['id', 'kode', 'nama', 'jenjang']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'prodi_id' => $prodiId,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'mahasiswas' => [
                'data' => collect($page->items())->map(fn (Mahasiswa $mahasiswa) => [
                    'id' => $mahasiswa->id,
                    'prodi_id' => $mahasiswa->prodi_id,
                    'nim' => $mahasiswa->nim,
                    'nisn' => $mahasiswa->nisn,
                    'nama' => $mahasiswa->nama,
                    'email' => $mahasiswa->email,
                    'phone' => $mahasiswa->phone,
                    'jenis_kelamin' => $mahasiswa->jenis_kelamin,
                    'tanggal_lahir' => optional($mahasiswa->tanggal_lahir)->toDateString(),
                    'tempat_lahir' => $mahasiswa->tempat_lahir,
                    'alamat' => $mahasiswa->alamat,
                    'angkatan' => $mahasiswa->angkatan,
                    'status_mahasiswa' => $mahasiswa->status_mahasiswa,
                    'prodi' => $mahasiswa->prodi ? [
                        'id' => $mahasiswa->prodi->id,
                        'nama' => $mahasiswa->prodi->nama,
                    ] : null,
                ])->values(),
                'meta' => [
                    'current_page' => $page->currentPage(),
                    'last_page' => $page->lastPage(),
                    'per_page' => $page->perPage(),
                    'total' => $page->total(),
                    'from' => $page->firstItem(),
                    'to' => $page->lastItem(),
                ],
                'links' => collect($page->linkCollection())->map(fn ($link) => [
                    'url' => $link['url'],
                    'label' => strip_tags($link['label']),
                    'active' => $link['active'],
                ])->values(),
            ],
        ]);
    }

    public function indexPdf(Request $request)
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $prodiId = (string) $request->string('prodi_id', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');

        $query = Mahasiswa::query()
            ->with('prodi:id,nama')
            ->when($status !== 'all', fn ($query) => $query->where('status_mahasiswa', $status))
            ->when($prodiId !== 'all', fn ($query) => $query->where('prodi_id', $prodiId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('nim', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });

        match ($sortBy) {
            'nim' => $query->orderBy('nim', $sortDir === 'asc' ? 'asc' : 'desc'),
            'nama' => $query->orderBy('nama', $sortDir === 'asc' ? 'asc' : 'desc'),
            'angkatan' => $query->orderBy('angkatan', $sortDir === 'asc' ? 'asc' : 'desc'),
            'status_mahasiswa' => $query->orderBy('status_mahasiswa', $sortDir === 'asc' ? 'asc' : 'desc'),
            default => $query->orderBy('id', 'desc'),
        };

        $rows = $query->get();

        $pdf = Pdf::loadView('print.mahasiswas', [
            'rows' => $rows,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'prodi_id' => $prodiId,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ])->setPaper('a4', 'landscape');

        return $pdf->download('Data-Mahasiswa.pdf');
    }

    public function indexXlsx(Request $request)
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $prodiId = (string) $request->string('prodi_id', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');

        $query = Mahasiswa::query()
            ->with('prodi:id,nama,kode')
            ->when($status !== 'all', fn ($query) => $query->where('status_mahasiswa', $status))
            ->when($prodiId !== 'all', fn ($query) => $query->where('prodi_id', $prodiId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('nim', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });

        match ($sortBy) {
            'nim' => $query->orderBy('nim', $sortDir === 'asc' ? 'asc' : 'desc'),
            'nama' => $query->orderBy('nama', $sortDir === 'asc' ? 'asc' : 'desc'),
            'angkatan' => $query->orderBy('angkatan', $sortDir === 'asc' ? 'asc' : 'desc'),
            'status_mahasiswa' => $query->orderBy('status_mahasiswa', $sortDir === 'asc' ? 'asc' : 'desc'),
            default => $query->orderBy('id', 'desc'),
        };

        $rows = $query->get();

        $payload = $rows->map(fn (Mahasiswa $m) => [
            'nim' => $m->nim,
            'nisn' => $m->nisn,
            'nama' => $m->nama,
            'prodi_kode' => $m->prodi?->kode,
            'prodi_nama' => $m->prodi?->nama,
            'email' => $m->email,
            'phone' => $m->phone,
            'jenis_kelamin' => $m->jenis_kelamin,
            'tanggal_lahir' => optional($m->tanggal_lahir)->toDateString(),
            'tempat_lahir' => $m->tempat_lahir,
            'alamat' => $m->alamat,
            'angkatan' => $m->angkatan,
            'status_mahasiswa' => $m->status_mahasiswa,
        ])->values()->all();

        $filename = 'Mahasiswa-'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(new MahasiswaExport($payload), $filename);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'prodi_id' => ['required', 'exists:prodis,id'],
            'nim' => ['required', 'string', 'max:255', 'unique:mahasiswas,nim'],
            'nisn' => ['nullable', 'string', 'max:255', 'unique:mahasiswas,nisn'],
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'tanggal_lahir' => ['nullable', 'date'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'alamat' => ['nullable', 'string'],
            'angkatan' => ['required', 'string', 'max:10'],
            'status_mahasiswa' => ['required', 'in:aktif,cuti,lulus,dropout,nonaktif'],
        ]);

        Mahasiswa::query()->create($data);

        return back()->with('success', 'Mahasiswa berhasil ditambahkan.');
    }

    public function update(Request $request, Mahasiswa $mahasiswa): RedirectResponse
    {
        $previousStatus = $mahasiswa->status_mahasiswa;
        $data = $request->validate([
            'prodi_id' => ['required', 'exists:prodis,id'],
            'nim' => ['required', 'string', 'max:255', 'unique:mahasiswas,nim,'.$mahasiswa->id],
            'nisn' => ['nullable', 'string', 'max:255', 'unique:mahasiswas,nisn,'.$mahasiswa->id],
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'tanggal_lahir' => ['nullable', 'date'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'alamat' => ['nullable', 'string'],
            'angkatan' => ['required', 'string', 'max:10'],
            'status_mahasiswa' => ['required', 'in:aktif,cuti,lulus,dropout,nonaktif'],
        ]);

        $mahasiswa->update($data);

        if ($previousStatus !== $data['status_mahasiswa']) {
            $mahasiswa->load('user', 'prodi');
            if ($mahasiswa->user) {
                $mahasiswa->user->notify(new MahasiswaStatusChanged(
                    $mahasiswa->nama,
                    (string) $previousStatus,
                    (string) $data['status_mahasiswa'],
                    $mahasiswa->prodi?->nama
                ));
            }
        }

        return back()->with('success', 'Data mahasiswa berhasil diperbarui.');
    }

    public function destroy(Mahasiswa $mahasiswa): RedirectResponse
    {
        if ($mahasiswa->krs()->exists() || $mahasiswa->tagihans()->exists()) {
            return back()->with('error', 'Mahasiswa tidak dapat dihapus karena masih memiliki KRS atau tagihan.');
        }

        $mahasiswa->delete();

        return back()->with('success', 'Data mahasiswa berhasil dihapus.');
    }

    public function krs(): Response
    {
        $user = request()->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return Inertia::render('Modules/Mahasiswa/Krs', [
                'mahasiswa' => null,
                'tahunAktif' => null,
                'kelasAktif' => [],
                'currentKrs' => null,
                'historyKrs' => [],
                'pesan' => 'KRS hanya tersedia untuk akun mahasiswa yang terhubung dengan data mahasiswa.',
            ]);
        }

        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();

        $kelasAktif = Kelas::query()
            ->with([
                'mataKuliah:id,kode,nama,sks',
                'dosen:id,nama',
                'ruanganRef:id,nama',
                'jadwals:id,kelas_id,hari_ke,jam_mulai,jam_selesai',
            ])
            ->when($tahunAktif, fn ($query) => $query->where('tahun_akademik_id', $tahunAktif->id))
            ->where('is_active', true)
            ->orderBy('semester_akademik')
            ->limit(200)
            ->get()
            ->map(fn ($kelas) => [
                'id' => $kelas->id,
                'kode_kelas' => $kelas->kode_kelas,
                'semester_akademik' => $kelas->semester_akademik,
                'mata_kuliah' => [
                    'kode' => $kelas->mataKuliah?->kode,
                    'nama' => $kelas->mataKuliah?->nama,
                    'sks' => $kelas->mataKuliah?->sks,
                ],
                'dosen' => $kelas->dosen?->nama,
                'ruang' => $kelas->ruanganRef?->nama ?? $kelas->ruangan,
                'jadwal' => $kelas->jadwals->map(fn ($jadwal) => [
                    'hari_ke' => $jadwal->hari_ke,
                    'jam_mulai' => $jadwal->jam_mulai,
                    'jam_selesai' => $jadwal->jam_selesai,
                ])->values(),
            ])
            ->values();

        $currentKrsModel = Krs::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->when($tahunAktif, fn ($query) => $query
                ->where('tahun_akademik_id', $tahunAktif->id)
                ->where('semester_akademik', $tahunAktif->semester_aktif))
            ->with([
                'details.kelas.mataKuliah:id,kode,nama,sks',
                'details.kelas.dosen:id,nama',
                'details.kelas.ruanganRef:id,nama',
            ])
            ->latest('id')
            ->first();

        $currentKrs = $currentKrsModel ? [
            'id' => $currentKrsModel->id,
            'tahun_akademik' => $currentKrsModel->tahun_akademik,
            'semester_akademik' => $currentKrsModel->semester_akademik,
            'status' => $currentKrsModel->status,
            'total_sks' => $currentKrsModel->total_sks,
            'catatan' => $currentKrsModel->catatan,
            'kelas_ids' => $currentKrsModel->details->pluck('kelas_id')->map(fn ($id) => (int) $id)->values(),
            'details' => $currentKrsModel->details->map(fn ($detail) => [
                'id' => $detail->id,
                'kelas_id' => $detail->kelas_id,
                'kode' => $detail->kelas?->mataKuliah?->kode,
                'nama' => $detail->kelas?->mataKuliah?->nama,
                'sks' => $detail->sks,
                'dosen' => $detail->kelas?->dosen?->nama,
                'ruang' => $detail->kelas?->ruanganRef?->nama ?? $detail->kelas?->ruangan,
            ])->values(),
        ] : null;

        $historyKrs = Krs::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->with(['details.kelas.mataKuliah:id,kode,nama,sks'])
            ->latest('id')
            ->limit(12)
            ->get()
            ->map(fn ($krs) => [
                'id' => $krs->id,
                'tahun_akademik' => $krs->tahun_akademik,
                'semester_akademik' => $krs->semester_akademik,
                'status' => $krs->status,
                'total_sks' => $krs->total_sks,
                'matkul_count' => $krs->details->count(),
            ])
            ->values();

        return Inertia::render('Modules/Mahasiswa/Krs', [
            'mahasiswa' => [
                'id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->nama,
                'prodi' => $mahasiswa->prodi?->nama,
                'angkatan' => $mahasiswa->angkatan,
            ],
            'tahunAktif' => $tahunAktif ? [
                'id' => $tahunAktif->id,
                'kode' => $tahunAktif->kode,
                'semester_aktif' => $tahunAktif->semester_aktif,
            ] : null,
            'kelasAktif' => $kelasAktif,
            'currentKrs' => $currentKrs,
            'historyKrs' => $historyKrs,
            'maxSks' => 24,
            'pesan' => ! $tahunAktif ? 'Belum ada tahun akademik aktif.' : null,
        ]);
    }

    public function khs(): Response
    {
        $user = request()->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return Inertia::render('Modules/Mahasiswa/Khs', [
                'mahasiswa' => null,
                'ringkasan' => null,
                'semesterRecords' => [],
                'pesan' => 'KHS hanya tersedia untuk akun mahasiswa yang terhubung dengan data mahasiswa.',
            ]);
        }

        $payload = $this->buildKhsPayload($mahasiswa->id);

        return Inertia::render('Modules/Mahasiswa/Khs', [
            'mahasiswa' => [
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->nama,
                'prodi' => $mahasiswa->prodi?->nama,
                'angkatan' => $mahasiswa->angkatan,
            ],
            'ringkasan' => $payload['ringkasan'],
            'semesterRecords' => $payload['semesterRecords'],
            'pesan' => $payload['semesterRecords']->isEmpty() ? 'Belum ada KRS yang disetujui dan memiliki nilai final.' : null,
        ]);
    }

    public function khsPdf()
    {
        $user = request()->user();
        $mahasiswa = $user?->mahasiswa;
        if (! $mahasiswa) {
            abort(403);
        }

        $payload = $this->buildKhsPayload($mahasiswa->id);

        $pdf = Pdf::loadView('print.khs', [
            'mahasiswa' => [
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->nama,
                'prodi' => $mahasiswa->prodi?->nama,
                'angkatan' => $mahasiswa->angkatan,
            ],
            'ringkasan' => $payload['ringkasan'],
            'semesterRecords' => $payload['semesterRecords'],
        ])->setPaper('a4', 'portrait');

        return $pdf->download('KHS-'.$mahasiswa->nim.'.pdf');
    }

    public function transkrip(): Response
    {
        $user = request()->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return Inertia::render('Modules/Mahasiswa/Transkrip', [
                'mahasiswa' => null,
                'ringkasan' => null,
                'rows' => [],
                'pesan' => 'Transkrip hanya tersedia untuk akun mahasiswa yang terhubung dengan data mahasiswa.',
            ]);
        }

        $payload = $this->buildTranscriptPayload($mahasiswa->id);

        return Inertia::render('Modules/Mahasiswa/Transkrip', [
            'mahasiswa' => [
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->nama,
                'prodi' => $mahasiswa->prodi?->nama,
                'angkatan' => $mahasiswa->angkatan,
            ],
            'ringkasan' => $payload['ringkasan'],
            'rows' => $payload['rows'],
            'pesan' => $payload['rows']->isEmpty() ? 'Belum ada nilai final untuk ditampilkan.' : null,
        ]);
    }

    public function transkripPdf()
    {
        $user = request()->user();
        $mahasiswa = $user?->mahasiswa;
        if (! $mahasiswa) {
            abort(403);
        }

        $payload = $this->buildTranscriptPayload($mahasiswa->id);

        $pdf = Pdf::loadView('print.transkrip', [
            'mahasiswa' => [
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->nama,
                'prodi' => $mahasiswa->prodi?->nama,
                'angkatan' => $mahasiswa->angkatan,
            ],
            'ringkasan' => $payload['ringkasan'],
            'rows' => $payload['rows'],
        ])->setPaper('a4', 'portrait');

        return $pdf->download('Transkrip-'.$mahasiswa->nim.'.pdf');
    }

    public function tagihan(Request $request): Response
    {
        $user = request()->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return Inertia::render('Modules/Mahasiswa/Tagihan', [
                'mahasiswa' => null,
                'ringkasan' => null,
                'tagihans' => [],
                'pesan' => 'Tagihan hanya tersedia untuk akun mahasiswa yang terhubung dengan data mahasiswa.',
            ]);
        }

        $perPage = min(max((int) $request->integer('per_page', 10), 5), 50);
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');

        $tagihanPage = Tagihan::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->with([
                'transaksis' => fn ($query) => $query->latest('id'),
            ])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode_tagihan', 'like', "%{$search}%")
                        ->orWhere('jenis', 'like', "%{$search}%")
                        ->orWhere('tahun_akademik', 'like', "%{$search}%")
                        ->orWhere('keterangan', 'like', "%{$search}%")
                        ->orWhereHas('transaksis', function ($trxQuery) use ($search) {
                            $trxQuery
                                ->where('order_id', 'like', "%{$search}%")
                                ->orWhere('payment_type', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        $tagihans = collect($tagihanPage->items())
            ->map(function (Tagihan $tagihan) {
                $transactions = $tagihan->transaksis->map(fn ($transaksi) => [
                    'id' => $transaksi->id,
                    'order_id' => $transaksi->order_id,
                    'payment_type' => $transaksi->payment_type,
                    'gross_amount' => (float) $transaksi->gross_amount,
                    'status' => $transaksi->status,
                    'paid_at' => optional($transaksi->paid_at)->toDateTimeString(),
                    'redirect_url' => $transaksi->snap_redirect_url,
                ])->values();

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
                    'status' => $tagihan->status,
                    'jatuh_tempo' => optional($tagihan->jatuh_tempo)->toDateString(),
                    'paid_at' => optional($tagihan->paid_at)->toDateTimeString(),
                    'keterangan' => $tagihan->keterangan,
                    'transactions' => $transactions,
                ];
            })
            ->values();

        $allTagihan = Tagihan::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->get(['id', 'status', 'total']);

        $ringkasan = [
            'total_tagihan' => $allTagihan->count(),
            'pending' => $allTagihan->where('status', 'pending')->count(),
            'partial' => $allTagihan->where('status', 'partial')->count(),
            'paid' => $allTagihan->where('status', 'paid')->count(),
            'saldo_terbuka' => (float) $allTagihan
                ->whereIn('status', ['pending', 'partial'])
                ->sum('total'),
            'total_lunas' => (float) $allTagihan
                ->where('status', 'paid')
                ->sum('total'),
        ];

        return Inertia::render('Modules/Mahasiswa/Tagihan', [
            'mahasiswa' => [
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->nama,
                'prodi' => $mahasiswa->prodi?->nama,
                'angkatan' => $mahasiswa->angkatan,
            ],
            'ringkasan' => $ringkasan,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => $perPage,
            ],
            'tagihans' => [
                'data' => $tagihans,
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
            'pesan' => $allTagihan->isEmpty() ? 'Belum ada tagihan yang diterbitkan.' : null,
        ]);
    }

    private function buildKhsPayload(int $mahasiswaId): array
    {
        $krsList = Krs::query()
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('status', 'approved')
            ->with([
                'details.kelas.mataKuliah:id,kode,nama,sks',
                'details.kelas.dosen:id,nama',
                'details.kelas.ruanganRef:id,nama',
                'details.nilai:id,krs_detail_id,nilai_angka,nilai_huruf,bobot,published_at',
            ])
            ->orderByDesc('approved_at')
            ->get();

        $semesterRecords = $krsList->map(function (Krs $krs) {
            $rows = $krs->details->map(function ($detail) {
                $nilai = $detail->nilai;
                $final = $nilai && $nilai->published_at;

                return [
                    'id' => $detail->id,
                    'kode' => $detail->kelas?->mataKuliah?->kode,
                    'nama' => $detail->kelas?->mataKuliah?->nama,
                    'sks' => (int) ($detail->sks ?? 0),
                    'dosen' => $detail->kelas?->dosen?->nama,
                    'ruang' => $detail->kelas?->ruanganRef?->nama ?? $detail->kelas?->ruangan,
                    'nilai_angka' => $final ? $nilai->nilai_angka : null,
                    'nilai_huruf' => $final ? $nilai->nilai_huruf : null,
                    'bobot' => $final ? $nilai->bobot : null,
                    'status_nilai' => ! $nilai ? 'belum_input' : ($final ? 'final' : 'sementara'),
                ];
            });

            $completeRows = $rows->filter(fn ($row) => $row['status_nilai'] === 'final' && $row['bobot'] !== null && $row['sks'] > 0);
            $semesterSks = (int) $completeRows->sum('sks');
            $semesterBobotSks = (float) $completeRows->sum(fn ($row) => (float) $row['bobot'] * (int) $row['sks']);
            $ips = $semesterSks > 0 ? round($semesterBobotSks / $semesterSks, 2) : null;

            return [
                'id' => $krs->id,
                'tahun_akademik' => $krs->tahun_akademik,
                'semester_akademik' => $krs->semester_akademik,
                'status' => $krs->status,
                'approved_at' => optional($krs->approved_at)->toDateTimeString(),
                'total_sks' => (int) $krs->total_sks,
                'semester_sks' => $semesterSks,
                'ips' => $ips,
                'sudah_final' => $rows->where('status_nilai', 'final')->count(),
                'belum_input' => $rows->where('status_nilai', 'belum_input')->count(),
                'sementara' => $rows->where('status_nilai', 'sementara')->count(),
                'rows' => $rows->values(),
            ];
        })->values();

        $allFinalRows = $semesterRecords->flatMap(fn ($semester) => collect($semester['rows'] ?? []))
            ->filter(fn ($row) => $row['status_nilai'] === 'final' && $row['bobot'] !== null && $row['sks'] > 0);

        $totalSksLulus = (int) $allFinalRows->sum('sks');
        $totalBobotSks = (float) $allFinalRows->sum(fn ($row) => (float) $row['bobot'] * (int) $row['sks']);
        $ipk = $totalSksLulus > 0 ? round($totalBobotSks / $totalSksLulus, 2) : null;
        $semesterTerakhir = $semesterRecords->first();

        return [
            'semesterRecords' => $semesterRecords,
            'ringkasan' => [
                'semester_terakhir' => $semesterTerakhir ? [
                    'label' => $semesterTerakhir['tahun_akademik'].' / Smt '.$semesterTerakhir['semester_akademik'],
                    'ips' => $semesterTerakhir['ips'],
                    'sks' => $semesterTerakhir['semester_sks'],
                ] : null,
                'total_semester' => $semesterRecords->count(),
                'total_sks_lulus' => $totalSksLulus,
                'ipk' => $ipk,
            ],
        ];
    }

    private function buildTranscriptPayload(int $mahasiswaId): array
    {
        $payload = $this->buildKhsPayload($mahasiswaId);
        $rows = collect($payload['semesterRecords'])
            ->flatMap(function ($semester) {
                return collect($semester['rows'] ?? [])
                    ->filter(fn ($row) => ($row['status_nilai'] ?? '') === 'final')
                    ->map(function ($row) use ($semester) {
                        return [
                            'semester' => $semester['tahun_akademik'].' / Smt '.$semester['semester_akademik'],
                            'kode' => $row['kode'] ?? '-',
                            'nama' => $row['nama'] ?? '-',
                            'sks' => (int) ($row['sks'] ?? 0),
                            'nilai_huruf' => $row['nilai_huruf'] ?? '-',
                            'bobot' => $row['bobot'] ?? null,
                            'dosen' => $row['dosen'] ?? '-',
                            'ruang' => $row['ruang'] ?? '-',
                        ];
                    });
            })
            ->values();

        $totalSks = (int) $rows->sum('sks');
        $totalBobot = (float) $rows->sum(fn ($row) => (float) ($row['bobot'] ?? 0) * (int) $row['sks']);
        $ipk = $totalSks > 0 ? round($totalBobot / $totalSks, 2) : null;

        return [
            'rows' => $rows,
            'ringkasan' => [
                'total_sks' => $totalSks,
                'ipk' => $ipk,
                'total_matkul' => $rows->count(),
                'total_semester' => $payload['ringkasan']['total_semester'] ?? 0,
            ],
        ];
    }
}

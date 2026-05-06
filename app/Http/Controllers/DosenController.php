<?php

namespace App\Http\Controllers;

use App\Models\Dosen;
use App\Models\Kelas;
use App\Models\Nilai;
use App\Models\TahunAkademik;
use App\Notifications\DosenUpdated;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DosenController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min(max((int) $request->integer('per_page', 10), 5), 50);
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');
        $allowedSorts = ['latest', 'nidn', 'nama', 'status_dosen'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'latest';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = Dosen::query()
            ->when($status !== 'all', fn ($query) => $query->where('status_dosen', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('nidn', 'like', "%{$search}%")
                        ->orWhere('nip', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });

        match ($sortBy) {
            'nidn' => $query->orderBy('nidn', $sortDir),
            'nama' => $query->orderBy('nama', $sortDir),
            'status_dosen' => $query->orderBy('status_dosen', $sortDir),
            default => $query->orderBy('id', 'desc'),
        };

        $page = $query->paginate($perPage)->withQueryString();
        $summaryQuery = Dosen::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('nidn', 'like', "%{$search}%")
                        ->orWhere('nip', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });

        return Inertia::render('Modules/Dosen/Index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'dosens' => [
                'data' => collect($page->items())->map(fn (Dosen $dosen) => [
                    'id' => $dosen->id,
                    'nidn' => $dosen->nidn,
                    'nip' => $dosen->nip,
                    'nama' => $dosen->nama,
                    'email' => $dosen->email,
                    'phone' => $dosen->phone,
                    'status_dosen' => $dosen->status_dosen,
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
            'summary' => [
                'total' => (clone $summaryQuery)->count(),
                'tetap' => (clone $summaryQuery)->where('status_dosen', 'tetap')->count(),
                'tidak_tetap' => (clone $summaryQuery)->where('status_dosen', 'tidak_tetap')->count(),
                'luar_biasa' => (clone $summaryQuery)->where('status_dosen', 'luar_biasa')->count(),
            ],
        ]);
    }

    public function indexPdf(Request $request)
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');

        $query = Dosen::query()
            ->when($status !== 'all', fn ($query) => $query->where('status_dosen', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('nidn', 'like', "%{$search}%")
                        ->orWhere('nip', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });

        match ($sortBy) {
            'nidn' => $query->orderBy('nidn', $sortDir === 'asc' ? 'asc' : 'desc'),
            'nama' => $query->orderBy('nama', $sortDir === 'asc' ? 'asc' : 'desc'),
            'status_dosen' => $query->orderBy('status_dosen', $sortDir === 'asc' ? 'asc' : 'desc'),
            default => $query->orderBy('id', 'desc'),
        };

        $rows = $query->get();

        $pdf = Pdf::loadView('print.dosens', [
            'rows' => $rows,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ])->setPaper('a4', 'landscape');

        return $pdf->download('Data-Dosen.pdf');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->normalizeDosenInput($request);

        $data = $request->validate([
            'nidn' => ['required', 'string', 'max:255', 'unique:dosens,nidn'],
            'nip' => ['nullable', 'string', 'max:255', 'unique:dosens,nip'],
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'status_dosen' => ['required', 'in:tetap,tidak_tetap,luar_biasa'],
        ]);

        Dosen::query()->create($data);

        return back()->with('success', 'Dosen berhasil ditambahkan.');
    }

    public function update(Request $request, Dosen $dosen): RedirectResponse
    {
        $this->normalizeDosenInput($request);

        $previousStatus = $dosen->status_dosen;

        $data = $request->validate([
            'nidn' => ['required', 'string', 'max:255', 'unique:dosens,nidn,'.$dosen->id],
            'nip' => ['nullable', 'string', 'max:255', 'unique:dosens,nip,'.$dosen->id],
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'status_dosen' => ['required', 'in:tetap,tidak_tetap,luar_biasa'],
        ]);

        $dosen->update($data);

        if ($previousStatus !== $data['status_dosen'] && $dosen->user) {
            $dosen->user->notify(new DosenUpdated(
                $dosen->nama,
                'status',
                (string) $previousStatus,
                (string) $data['status_dosen'],
                $dosen->prodi?->nama
            ));
        }

        return back()->with('success', 'Data dosen berhasil diperbarui.');
    }

    public function destroy(Dosen $dosen): RedirectResponse
    {
        if ($dosen->kelasAjar()->exists()) {
            return back()->with('error', 'Data dosen tidak dapat dihapus karena sudah terhubung dengan kelas/jadwal/nilai.');
        }

        if (Nilai::query()->where('input_by', $dosen->id)->exists()) {
            return back()->with('error', 'Data dosen tidak dapat dihapus karena sudah dipakai sebagai penginput nilai.');
        }

        $dosen->delete();

        return back()->with('success', 'Data dosen berhasil dihapus.');
    }

    public function jadwal(Request $request): Response
    {
        $user = $request->user();
        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();
        $dosen = $user?->dosen;

        $kelasQuery = Kelas::query()
            ->with([
                'mataKuliah:id,kode,nama,sks',
                'dosen:id,nama',
                'ruanganRef:id,nama',
                'jadwals:id,kelas_id,hari_ke,jam_mulai,jam_selesai,ruangan,mode',
            ])
            ->when($tahunAktif, fn ($query) => $query->where('tahun_akademik_id', $tahunAktif->id))
            ->where('is_active', true)
            ->orderBy('semester_akademik')
            ->orderBy('kode_kelas');

        if ($user?->hasRole('dosen') && $dosen) {
            $kelasQuery->where('dosen_id', $dosen->id);
        }

        $hariMap = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Minggu',
        ];

        $kelasList = $kelasQuery->get()->map(function (Kelas $kelas) use ($hariMap) {
            $jadwalRows = $kelas->jadwals
                ->sortBy([['hari_ke', 'asc'], ['jam_mulai', 'asc']])
                ->map(fn ($jadwal) => [
                    'id' => $jadwal->id,
                    'hari_ke' => $jadwal->hari_ke,
                    'hari_label' => $hariMap[(int) $jadwal->hari_ke] ?? 'Hari '.$jadwal->hari_ke,
                    'jam_mulai' => $jadwal->jam_mulai,
                    'jam_selesai' => $jadwal->jam_selesai,
                    'ruangan' => $jadwal->ruangan ?: ($kelas->ruanganRef?->nama ?? $kelas->ruangan),
                    'mode' => $jadwal->mode ?: 'Tatap Muka',
                ])
                ->values();

            return [
                'id' => $kelas->id,
                'kode_kelas' => $kelas->kode_kelas,
                'tahun_akademik' => $kelas->tahun_akademik,
                'semester_akademik' => $kelas->semester_akademik,
                'mata_kuliah' => [
                    'kode' => $kelas->mataKuliah?->kode,
                    'nama' => $kelas->mataKuliah?->nama,
                    'sks' => (int) ($kelas->mataKuliah?->sks ?? 0),
                ],
                'dosen' => $kelas->dosen?->nama,
                'ruangan' => $kelas->ruanganRef?->nama ?? $kelas->ruangan,
                'jadwal' => $jadwalRows,
            ];
        })->values();

        $summary = [
            'total_kelas' => $kelasList->count(),
            'total_sks' => (int) $kelasList->sum(fn ($kelas) => (int) ($kelas['mata_kuliah']['sks'] ?? 0)),
            'total_sesi' => (int) $kelasList->sum(fn ($kelas) => collect($kelas['jadwal'])->count()),
            'hari_aktif' => (int) $kelasList
                ->flatMap(fn ($kelas) => collect($kelas['jadwal'])->pluck('hari_label'))
                ->filter()
                ->unique()
                ->count(),
        ];

        $agenda = $kelasList
            ->flatMap(function ($kelas) {
                return collect($kelas['jadwal'])->map(function ($jadwal) use ($kelas) {
                    return [
                        'kelas_id' => $kelas['id'],
                        'kode_kelas' => $kelas['kode_kelas'],
                        'hari_ke' => $jadwal['hari_ke'],
                        'hari_label' => $jadwal['hari_label'],
                        'jam_mulai' => $jadwal['jam_mulai'],
                        'jam_selesai' => $jadwal['jam_selesai'],
                        'mata_kuliah' => $kelas['mata_kuliah']['nama'] ?? '-',
                        'kode_mk' => $kelas['mata_kuliah']['kode'] ?? '-',
                        'ruangan' => $jadwal['ruangan'],
                        'mode' => $jadwal['mode'],
                        'sks' => $kelas['mata_kuliah']['sks'] ?? 0,
                    ];
                });
            })
            ->sortBy([['hari_ke', 'asc'], ['jam_mulai', 'asc']])
            ->values();

        return Inertia::render('Modules/Dosen/Jadwal', [
            'tahunAktif' => $tahunAktif ? [
                'id' => $tahunAktif->id,
                'kode' => $tahunAktif->kode,
                'semester_aktif' => $tahunAktif->semester_aktif,
            ] : null,
            'dosen' => $dosen ? [
                'id' => $dosen->id,
                'nama' => $dosen->nama,
                'nidn' => $dosen->nidn,
            ] : null,
            'summary' => $summary,
            'kelasList' => $kelasList,
            'agenda' => $agenda,
            'pesan' => ! $tahunAktif ? 'Belum ada tahun akademik aktif.' : null,
        ]);
    }

    public function nilai(Request $request): Response
    {
        $user = $request->user();
        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();
        $dosen = $user?->dosen;

        $kelasQuery = Kelas::query()
            ->with([
                'mataKuliah:id,kode,nama,sks',
                'dosen:id,nama',
                'ruanganRef:id,nama',
                'jadwals:id,kelas_id,hari_ke,jam_mulai,jam_selesai',
                'krsDetails' => function ($query) {
                    $query->with([
                        'krs.mahasiswa:id,nim,nama,prodi_id',
                        'krs.mahasiswa.prodi:id,nama',
                        'nilai:id,krs_detail_id,nilai_angka,nilai_huruf,bobot,published_at,input_by',
                    ])->orderBy('id');
                },
            ])
            ->when($tahunAktif, fn ($query) => $query->where('tahun_akademik_id', $tahunAktif->id))
            ->orderBy('kode_kelas')
            ->orderBy('id');

        if ($user?->hasRole('dosen') && $dosen) {
            $kelasQuery->where('dosen_id', $dosen->id);
        }

        $kelasList = $kelasQuery->get()->map(function (Kelas $kelas) {
            $details = $kelas->krsDetails->map(function ($detail) {
                $nilai = $detail->nilai;

                return [
                    'id' => $detail->id,
                    'krs_id' => $detail->krs_id,
                    'mahasiswa' => [
                        'nim' => $detail->krs?->mahasiswa?->nim,
                        'nama' => $detail->krs?->mahasiswa?->nama,
                        'prodi' => $detail->krs?->mahasiswa?->prodi?->nama,
                    ],
                    'sks' => $detail->sks,
                    'nilai' => $nilai ? [
                        'nilai_angka' => $nilai->nilai_angka,
                        'nilai_huruf' => $nilai->nilai_huruf,
                        'bobot' => $nilai->bobot,
                        'published_at' => optional($nilai->published_at)->toDateTimeString(),
                    ] : null,
                ];
            });

            $sudahDinilai = $details->filter(fn ($detail) => ! is_null($detail['nilai']))->count();
            $sudahPublish = $details->filter(fn ($detail) => ! empty($detail['nilai']['published_at'] ?? null))->count();

            return [
                'id' => $kelas->id,
                'kode_kelas' => $kelas->kode_kelas,
                'tahun_akademik' => $kelas->tahun_akademik,
                'semester_akademik' => $kelas->semester_akademik,
                'is_active' => (bool) $kelas->is_active,
                'mata_kuliah' => [
                    'kode' => $kelas->mataKuliah?->kode,
                    'nama' => $kelas->mataKuliah?->nama,
                    'sks' => $kelas->mataKuliah?->sks,
                ],
                'dosen' => [
                    'nama' => $kelas->dosen?->nama,
                ],
                'ruangan' => $kelas->ruanganRef?->nama ?? $kelas->ruangan,
                'jadwal' => $kelas->jadwals->map(fn ($jadwal) => [
                    'hari_ke' => $jadwal->hari_ke,
                    'jam_mulai' => $jadwal->jam_mulai,
                    'jam_selesai' => $jadwal->jam_selesai,
                ])->values(),
                'total_mahasiswa' => $details->count(),
                'sudah_dinilai' => $sudahDinilai,
                'sudah_publish' => $sudahPublish,
                'belum_publish' => max(0, $sudahDinilai - $sudahPublish),
                'details' => $details->values(),
            ];
        })->values();

        $firstKelas = $kelasList->first();
        $selectedKelasId = (int) $request->integer('kelas', $firstKelas['id'] ?? 0);
        $selectedKelas = $kelasList->firstWhere('id', $selectedKelasId) ?? $firstKelas;

        return Inertia::render('Modules/Dosen/Nilai', [
            'tahunAktif' => $tahunAktif ? [
                'id' => $tahunAktif->id,
                'kode' => $tahunAktif->kode,
                'semester_aktif' => $tahunAktif->semester_aktif,
            ] : null,
            'kelasList' => $kelasList,
            'selectedKelasId' => $selectedKelas['id'] ?? null,
            'selectedKelas' => $selectedKelas,
        ]);
    }

    public function storeNilai(Request $request, Kelas $kelas): RedirectResponse
    {
        $this->ensureCanManageNilai($kelas);

        $data = $request->validate([
            'rows' => ['required', 'array'],
            'rows.*.krs_detail_id' => ['required', 'integer', 'exists:krs_details,id'],
            'rows.*.nilai_angka' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $allowedIds = $kelas->krsDetails()->pluck('id')->map(fn ($id) => (int) $id)->all();
        $dosenId = $request->user()?->dosen?->id;

        DB::transaction(function () use ($data, $allowedIds, $dosenId) {
            foreach ($data['rows'] as $row) {
                $detailId = (int) $row['krs_detail_id'];
                if (! in_array($detailId, $allowedIds, true)) {
                    continue;
                }

                $rawScore = $row['nilai_angka'];
                if ($rawScore === null || $rawScore === '') {
                    continue;
                }

                $score = round((float) $rawScore, 2);
                [$huruf, $bobot] = $this->gradeFromScore($score);

                Nilai::query()->updateOrCreate(
                    ['krs_detail_id' => $detailId],
                    [
                        'nilai_angka' => $score,
                        'nilai_huruf' => $huruf,
                        'bobot' => $bobot,
                        'input_by' => $dosenId,
                        'published_at' => null,
                    ]
                );
            }
        });

        return back()
            ->with('success', 'Nilai berhasil disimpan sebagai draft sementara.')
            ->withInput()
            ->withFragment('kelas-'.$kelas->id);
    }

    public function publishNilai(Request $request, Kelas $kelas): RedirectResponse
    {
        $this->ensureCanManageNilai($kelas);

        $details = $kelas->krsDetails()->with('nilai')->get();
        $missing = $details->first(fn ($detail) => ! $detail->nilai || $detail->nilai->nilai_angka === null);

        if ($missing) {
            return back()->withErrors([
                'publish' => 'Masih ada mahasiswa yang belum memiliki nilai. Lengkapi semua nilai sebelum publish.',
            ]);
        }

        $dosenId = $request->user()?->dosen?->id;

        DB::transaction(function () use ($details, $dosenId) {
            foreach ($details as $detail) {
                if (! $detail->nilai) {
                    continue;
                }

                $detail->nilai->update([
                    'published_at' => now(),
                    'input_by' => $dosenId ?? $detail->nilai->input_by,
                ]);
            }
        });

        return back()
            ->with('success', 'Nilai kelas berhasil dipublish.')
            ->withFragment('kelas-'.$kelas->id);
    }

    public function nilaiPdf(Request $request, Kelas $kelas)
    {
        $this->ensureCanManageNilai($kelas);

        $kelas->load([
            'mataKuliah:id,kode,nama,sks',
            'dosen:id,nama',
            'ruanganRef:id,nama',
            'jadwals:id,kelas_id,hari_ke,jam_mulai,jam_selesai',
            'krsDetails' => function ($query) {
                $query->with([
                    'krs.mahasiswa:id,nim,nama,prodi_id',
                    'krs.mahasiswa.prodi:id,nama',
                    'nilai:id,krs_detail_id,nilai_angka,nilai_huruf,bobot,published_at,input_by',
                ])->orderBy('id');
            },
        ]);

        $payload = $this->buildKelasNilaiPayload($kelas);
        $pdf = Pdf::loadView('print.nilai-kelas', $payload)->setPaper('a4', 'portrait');

        $filename = 'Nilai-'.$kelas->kode_kelas.'-'.$kelas->mataKuliah?->kode.'.pdf';

        return $pdf->download($filename);
    }

    private function ensureCanManageNilai(Kelas $kelas): void
    {
        $user = request()->user();
        if (! $user) {
            abort(403);
        }

        if ($user->hasAnyRole(['super-admin', 'baak'])) {
            return;
        }

        if ($user->hasRole('dosen') && $user->dosen && (int) $kelas->dosen_id === (int) $user->dosen->id) {
            return;
        }

        abort(403);
    }

    private function normalizeDosenInput(Request $request): void
    {
        $nip = trim((string) $request->input('nip'));
        $email = trim((string) $request->input('email'));
        $phone = trim((string) $request->input('phone'));

        $request->merge([
            'nidn' => trim((string) $request->input('nidn')),
            'nip' => $nip !== '' ? $nip : null,
            'nama' => trim((string) $request->input('nama')),
            'email' => $email !== '' ? $email : null,
            'phone' => $phone !== '' ? $phone : null,
            'status_dosen' => trim((string) $request->input('status_dosen')),
        ]);
    }

    private function gradeFromScore(float $score): array
    {
        return match (true) {
            $score >= 85 => ['A', 4.00],
            $score >= 80 => ['A-', 3.75],
            $score >= 75 => ['B+', 3.50],
            $score >= 70 => ['B', 3.00],
            $score >= 65 => ['B-', 2.75],
            $score >= 60 => ['C+', 2.50],
            $score >= 55 => ['C', 2.00],
            $score >= 50 => ['D', 1.00],
            default => ['E', 0.00],
        };
    }

    private function buildKelasNilaiPayload(Kelas $kelas): array
    {
        $rows = $kelas->krsDetails->map(function ($detail) {
            $nilai = $detail->nilai;

            return [
                'nim' => $detail->krs?->mahasiswa?->nim,
                'mahasiswa' => $detail->krs?->mahasiswa?->nama,
                'prodi' => $detail->krs?->mahasiswa?->prodi?->nama,
                'sks' => $detail->sks,
                'nilai_angka' => $nilai?->nilai_angka,
                'nilai_huruf' => $nilai?->nilai_huruf,
                'bobot' => $nilai?->bobot,
                'status' => ! $nilai ? 'Belum Input' : ($nilai->published_at ? 'Final' : 'Draft'),
            ];
        });

        $sksFinal = (int) $rows->where('status', 'Final')->sum('sks');
        $bobotFinal = (float) $rows->where('status', 'Final')->sum(fn ($row) => (float) ($row['bobot'] ?? 0) * (int) $row['sks']);
        $ipkKelas = $sksFinal > 0 ? round($bobotFinal / $sksFinal, 2) : null;

        return [
            'kelas' => [
                'kode_kelas' => $kelas->kode_kelas,
                'tahun_akademik' => $kelas->tahun_akademik,
                'semester_akademik' => $kelas->semester_akademik,
                'mata_kuliah' => [
                    'kode' => $kelas->mataKuliah?->kode,
                    'nama' => $kelas->mataKuliah?->nama,
                    'sks' => $kelas->mataKuliah?->sks,
                ],
                'dosen' => $kelas->dosen?->nama,
                'ruangan' => $kelas->ruanganRef?->nama ?? $kelas->ruangan,
                'jadwal' => $kelas->jadwals->map(fn ($jadwal) => [
                    'hari_ke' => $jadwal->hari_ke,
                    'jam_mulai' => $jadwal->jam_mulai,
                    'jam_selesai' => $jadwal->jam_selesai,
                ])->values(),
            ],
            'ringkasan' => [
                'total_mahasiswa' => $rows->count(),
                'sudah_final' => $rows->where('status', 'Final')->count(),
                'draft' => $rows->where('status', 'Draft')->count(),
                'belum_input' => $rows->where('status', 'Belum Input')->count(),
                'sks_final' => $sksFinal,
                'ipk_kelas' => $ipkKelas,
            ],
            'rows' => $rows->values(),
        ];
    }
}

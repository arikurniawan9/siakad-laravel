<?php

namespace App\Http\Controllers;

use App\Exports\KelasExport;
use App\Exports\KelasTemplateExport;
use App\Exports\MataKuliahExport;
use App\Exports\MataKuliahTemplateExport;
use App\Exports\KurikulumExport;
use App\Exports\KurikulumTemplateExport;
use App\Exports\ProdiExport;
use App\Exports\ProdiTemplateExport;
use App\Exports\RuanganExport;
use App\Exports\RuanganTemplateExport;
use App\Exports\JurusanExport;
use App\Exports\JurusanTemplateExport;
use App\Exports\TahunAkademikExport;
use App\Exports\TahunAkademikTemplateExport;
use App\Imports\KelasImport;
use App\Imports\MataKuliahImport;
use App\Imports\KurikulumImport;
use App\Imports\ProdiImport;
use App\Imports\RuanganImport;
use App\Imports\JurusanImport;
use App\Imports\TahunAkademikImport;
use App\Http\Requests\StoreJurusanRequest;
use App\Http\Requests\StoreMataKuliahRequest;
use App\Http\Requests\StoreProdiRequest;
use App\Http\Requests\UpdateJurusanRequest;
use App\Http\Requests\UpdateMataKuliahRequest;
use App\Http\Requests\UpdateProdiRequest;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Kurikulum;
use App\Models\MataKuliah;
use App\Models\Prodi;
use App\Models\Dosen;
use App\Models\Ruangan;
use App\Models\TahunAkademik;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class AkademikController extends Controller
{
    private function baseData(): array
    {
        return [
            'jurusans' => Jurusan::query()->orderBy('nama')->get(['id', 'kode', 'nama', 'deskripsi']),
            'prodis' => Prodi::query()->with('jurusan:id,nama')->orderBy('nama')->get(['id', 'jurusan_id', 'kode', 'nama', 'jenjang', 'semester_total', 'sks_lulus']),
            'mataKuliahs' => MataKuliah::query()->with('prodi:id,nama')->latest()->limit(50)->get(['id', 'prodi_id', 'kurikulum_id', 'kode', 'nama', 'semester', 'sks', 'jenis']),
            'kurikulums' => Kurikulum::query()->orderBy('tahun_berlaku', 'desc')->get(['id', 'nama']),
            'dosens' => Dosen::query()->orderBy('nama')->get(['id', 'nama']),
            'ruangans' => Ruangan::query()->orderBy('nama')->get(['id', 'kode', 'nama', 'gedung', 'kapasitas', 'is_active']),
            'tahunAkademiks' => TahunAkademik::query()->orderByDesc('is_active')->orderByDesc('id')->get(['id', 'kode', 'nama', 'semester_aktif', 'tanggal_mulai', 'tanggal_selesai', 'is_active']),
            'kurikulumList' => Kurikulum::query()->with('prodi:id,nama')->orderByDesc('tahun_berlaku')->limit(100)->get(['id', 'prodi_id', 'nama', 'kode', 'tahun_berlaku', 'is_active']),
            'kelasList' => Kelas::query()->with(['mataKuliah:id,nama', 'dosen:id,nama', 'ruanganRef:id,nama', 'tahunAkademik:id,kode,nama'])->latest()->limit(120)->get(['id', 'mata_kuliah_id', 'dosen_id', 'tahun_akademik_id', 'kode_kelas', 'tahun_akademik', 'semester_akademik', 'kapasitas', 'ruangan_id', 'ruangan', 'is_active']),
        ];
    }

    private function akademikTabs(): array
    {
        return [
            ['label' => 'Ringkasan', 'route' => 'akademik.index'],
            ['label' => 'Tahun Akademik', 'route' => 'akademik.tahun.index'],
            ['label' => 'Jurusan', 'route' => 'akademik.jurusan.index'],
            ['label' => 'Prodi', 'route' => 'akademik.prodi.index'],
            ['label' => 'Ruangan', 'route' => 'akademik.ruangan.index'],
            ['label' => 'Kurikulum', 'route' => 'akademik.kurikulum.index'],
            ['label' => 'Mata Kuliah', 'route' => 'akademik.matakuliah.index'],
            ['label' => 'Kelas', 'route' => 'akademik.kelas.index'],
        ];
    }

    public function index(): Response
    {
        return Inertia::render('Modules/Akademik/Index', [
            'tabs' => $this->akademikTabs(),
            'summary' => [
                'jurusan' => Jurusan::query()->count(),
                'prodi' => Prodi::query()->count(),
                'mata_kuliah' => MataKuliah::query()->count(),
                'kurikulum' => Kurikulum::query()->count(),
                'kelas' => Kelas::query()->count(),
                'ruangan' => Ruangan::query()->count(),
                'tahun_akademik' => TahunAkademik::query()->count(),
            ],
        ]);
    }

    public function jurusan(): Response
    {
        return $this->renderJurusan(request());
    }

    public function exportJurusan(Request $request)
    {
        $rows = $this->jurusanQuery($request)
            ->orderBy('nama')
            ->get(['id', 'kode', 'nama', 'deskripsi'])
            ->map(fn (Jurusan $item) => [
                'kode' => $item->kode,
                'nama' => $item->nama,
                'deskripsi' => $item->deskripsi,
            ])->values()->all();

        return Excel::download(
            new JurusanExport($rows),
            'Jurusan-'.now()->format('Ymd_His').'.xlsx'
        );
    }

    public function templateJurusan()
    {
        return Excel::download(
            new JurusanTemplateExport(),
            'Template-Import-Jurusan.xlsx'
        );
    }

    public function importJurusan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new JurusanImport();
        Excel::import($import, $data['file']);

        $summary = $this->syncJurusanRows($import->rows);

        return back()->with('success', "Import jurusan selesai. {$summary['created']} dibuat, {$summary['updated']} diperbarui, {$summary['skipped']} dilewati.");
    }

    public function mataKuliah(): Response
    {
        return $this->renderMataKuliah(request());
    }

    public function exportMataKuliah(Request $request)
    {
        $rows = $this->mataKuliahQuery($request)
            ->latest()
            ->get(['id', 'prodi_id', 'kurikulum_id', 'kode', 'nama', 'semester', 'sks', 'jenis', 'is_active'])
            ->map(fn (MataKuliah $item) => [
                'prodi_kode' => $item->prodi?->kode,
                'kurikulum_kode' => $item->kurikulum?->kode,
                'kode' => $item->kode,
                'nama' => $item->nama,
                'semester' => $item->semester,
                'sks' => $item->sks,
                'jenis' => $item->jenis,
                'is_active' => $item->is_active ? '1' : '0',
            ])->values()->all();

        return Excel::download(new MataKuliahExport($rows), 'Mata-Kuliah-'.now()->format('Ymd_His').'.xlsx');
    }

    public function templateMataKuliah()
    {
        return Excel::download(new MataKuliahTemplateExport(), 'Template-Import-Mata-Kuliah.xlsx');
    }

    public function importMataKuliah(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new MataKuliahImport();
        Excel::import($import, $data['file']);

        $summary = $this->syncMataKuliahRows($import->rows);
        $this->syncProdiSksLulus($summary['touched_prodi_ids'] ?? []);

        return back()->with('success', "Import mata kuliah selesai. {$summary['created']} dibuat, {$summary['updated']} diperbarui, {$summary['skipped']} dilewati.");
    }

    public function tahunAkademik(): Response
    {
        return $this->renderTahunAkademik(request());
    }

    public function exportTahunAkademik(Request $request)
    {
        $rows = $this->tahunAkademikQuery($request)
            ->orderByDesc('is_active')
            ->orderByDesc('id')
            ->get(['id', 'kode', 'nama', 'semester_aktif', 'tanggal_mulai', 'tanggal_selesai', 'is_active'])
            ->map(fn (TahunAkademik $item) => [
                'kode' => $item->kode,
                'nama' => $item->nama,
                'semester_aktif' => $item->semester_aktif,
                'tanggal_mulai' => optional($item->tanggal_mulai)->toDateString(),
                'tanggal_selesai' => optional($item->tanggal_selesai)->toDateString(),
                'is_active' => $item->is_active ? '1' : '0',
            ])->values()->all();

        return Excel::download(
            new TahunAkademikExport($rows),
            'Tahun-Akademik-'.now()->format('Ymd_His').'.xlsx'
        );
    }

    public function templateTahunAkademik()
    {
        return Excel::download(
            new TahunAkademikTemplateExport(),
            'Template-Import-Tahun-Akademik.xlsx'
        );
    }

    public function importTahunAkademik(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new TahunAkademikImport();
        Excel::import($import, $data['file']);

        $summary = $this->syncTahunAkademikRows($import->rows);

        return back()->with('success', "Import selesai. {$summary['created']} dibuat, {$summary['updated']} diperbarui, {$summary['skipped']} dilewati.");
    }

    public function prodi(): Response
    {
        return $this->renderProdi(request());
    }

    public function exportProdi(Request $request)
    {
        $rows = $this->prodiQuery($request)
            ->orderBy('nama')
            ->get(['id', 'jurusan_id', 'kode', 'nama', 'jenjang', 'semester_total', 'sks_lulus', 'is_active'])
            ->map(fn (Prodi $item) => [
                'jurusan_kode' => $item->jurusan?->kode,
                'kode' => $item->kode,
                'nama' => $item->nama,
                'jenjang' => $item->jenjang,
                'semester_total' => $item->semester_total,
                'sks_lulus' => $item->sks_lulus,
                'is_active' => $item->is_active ? '1' : '0',
            ])->values()->all();

        return Excel::download(new ProdiExport($rows), 'Prodi-'.now()->format('Ymd_His').'.xlsx');
    }

    public function templateProdi()
    {
        return Excel::download(new ProdiTemplateExport(), 'Template-Import-Prodi.xlsx');
    }

    public function importProdi(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new ProdiImport();
        Excel::import($import, $data['file']);

        $summary = $this->syncProdiRows($import->rows);
        $this->syncProdiSksLulus($summary['touched_prodi_ids'] ?? []);

        return back()->with('success', "Import prodi selesai. {$summary['created']} dibuat, {$summary['updated']} diperbarui, {$summary['skipped']} dilewati. Nilai SKS lulus disinkronkan otomatis dari total SKS mata kuliah per jurusan.");
    }

    public function kurikulum(): Response
    {
        return $this->renderKurikulum(request());
    }

    public function exportKurikulum(Request $request)
    {
        $rows = $this->kurikulumQuery($request)
            ->orderByDesc('tahun_berlaku')
            ->get(['id', 'prodi_id', 'nama', 'kode', 'tahun_berlaku', 'is_active'])
            ->map(fn (Kurikulum $item) => [
                'prodi_kode' => $item->prodi?->kode,
                'kode' => $item->kode,
                'nama' => $item->nama,
                'tahun_berlaku' => $item->tahun_berlaku,
                'is_active' => $item->is_active ? '1' : '0',
            ])->values()->all();

        return Excel::download(new KurikulumExport($rows), 'Kurikulum-'.now()->format('Ymd_His').'.xlsx');
    }

    public function templateKurikulum()
    {
        return Excel::download(new KurikulumTemplateExport(), 'Template-Import-Kurikulum.xlsx');
    }

    public function importKurikulum(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new KurikulumImport();
        Excel::import($import, $data['file']);

        $summary = $this->syncKurikulumRows($import->rows);

        return back()->with('success', "Import kurikulum selesai. {$summary['created']} dibuat, {$summary['updated']} diperbarui, {$summary['skipped']} dilewati.");
    }

    public function kelas(): Response
    {
        return $this->renderKelas(request());
    }

    public function exportKelas(Request $request)
    {
        $rows = $this->kelasQuery($request)
            ->latest()
            ->get(['id', 'mata_kuliah_id', 'dosen_id', 'tahun_akademik_id', 'kode_kelas', 'tahun_akademik', 'semester_akademik', 'kapasitas', 'ruangan_id', 'ruangan', 'is_active'])
            ->map(fn (Kelas $item) => [
                'mata_kuliah_kode' => $item->mataKuliah?->kode,
                'dosen_nidn' => $item->dosen?->nidn,
                'tahun_akademik_kode' => $item->tahunAkademik?->kode,
                'kode_kelas' => $item->kode_kelas,
                'tahun_akademik' => $item->tahun_akademik,
                'semester_akademik' => $item->semester_akademik,
                'kapasitas' => $item->kapasitas,
                'ruangan_kode' => $item->ruanganRef?->kode,
                'is_active' => $item->is_active ? '1' : '0',
            ])->values()->all();

        return Excel::download(new KelasExport($rows), 'Kelas-'.now()->format('Ymd_His').'.xlsx');
    }

    public function templateKelas()
    {
        return Excel::download(new KelasTemplateExport(), 'Template-Import-Kelas.xlsx');
    }

    public function importKelas(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new KelasImport();
        Excel::import($import, $data['file']);

        $summary = $this->syncKelasRows($import->rows);

        return back()->with('success', "Import kelas selesai. {$summary['created']} dibuat, {$summary['updated']} diperbarui, {$summary['skipped']} dilewati.");
    }

    public function ruangan(): Response
    {
        return $this->renderRuangan(request());
    }

    public function exportRuangan(Request $request)
    {
        $rows = $this->ruanganQuery($request)
            ->orderBy('nama')
            ->get(['id', 'kode', 'nama', 'gedung', 'kapasitas', 'is_active'])
            ->map(fn (Ruangan $item) => [
                'kode' => $item->kode,
                'nama' => $item->nama,
                'gedung' => $item->gedung,
                'kapasitas' => $item->kapasitas,
                'is_active' => $item->is_active ? '1' : '0',
            ])->values()->all();

        return Excel::download(new RuanganExport($rows), 'Ruangan-'.now()->format('Ymd_His').'.xlsx');
    }

    public function templateRuangan()
    {
        return Excel::download(new RuanganTemplateExport(), 'Template-Import-Ruangan.xlsx');
    }

    public function importRuangan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new RuanganImport();
        Excel::import($import, $data['file']);

        $summary = $this->syncRuanganRows($import->rows);

        return back()->with('success', "Import ruangan selesai. {$summary['created']} dibuat, {$summary['updated']} diperbarui, {$summary['skipped']} dilewati.");
    }

    private function renderProdi(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $data = $this->baseData();
        $page = $this->prodiQuery($request)->orderBy('nama')->paginate($perPage)->withQueryString();

        return Inertia::render('Modules/Akademik/Prodi', [
            'tabs' => $this->akademikTabs(),
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'jurusans' => $data['jurusans'],
            'prodis' => [
                'data' => collect($page->items())->map(fn (Prodi $item) => [
                    'id' => $item->id,
                    'jurusan_id' => $item->jurusan_id,
                    'kode' => $item->kode,
                    'nama' => $item->nama,
                    'jenjang' => $item->jenjang,
                    'semester_total' => $item->semester_total,
                    'sks_lulus' => $item->sks_lulus,
                    'is_active' => $item->is_active,
                    'jurusan' => $item->jurusan ? ['id' => $item->jurusan->id, 'kode' => $item->jurusan->kode, 'nama' => $item->jurusan->nama] : null,
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

    private function renderMataKuliah(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $data = $this->baseData();
        $page = $this->mataKuliahQuery($request)->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('Modules/Akademik/MataKuliah', [
            'tabs' => $this->akademikTabs(),
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'prodis' => $data['prodis'],
            'kurikulums' => $data['kurikulums'],
            'mataKuliahs' => [
                'data' => collect($page->items())->map(fn (MataKuliah $item) => [
                    'id' => $item->id,
                    'prodi_id' => $item->prodi_id,
                    'kurikulum_id' => $item->kurikulum_id,
                    'kode' => $item->kode,
                    'nama' => $item->nama,
                    'semester' => $item->semester,
                    'sks' => $item->sks,
                    'jenis' => $item->jenis,
                    'is_active' => $item->is_active,
                    'prodi' => $item->prodi ? ['id' => $item->prodi->id, 'kode' => $item->prodi->kode, 'nama' => $item->prodi->nama] : null,
                    'kurikulum' => $item->kurikulum ? ['id' => $item->kurikulum->id, 'kode' => $item->kurikulum->kode, 'nama' => $item->kurikulum->nama] : null,
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

    private function renderKurikulum(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $data = $this->baseData();
        $page = $this->kurikulumQuery($request)->orderByDesc('tahun_berlaku')->paginate($perPage)->withQueryString();

        return Inertia::render('Modules/Akademik/Kurikulum', [
            'tabs' => $this->akademikTabs(),
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'prodis' => $data['prodis'],
            'kurikulumList' => [
                'data' => collect($page->items())->map(fn (Kurikulum $item) => [
                    'id' => $item->id,
                    'prodi_id' => $item->prodi_id,
                    'kode' => $item->kode,
                    'nama' => $item->nama,
                    'tahun_berlaku' => $item->tahun_berlaku,
                    'is_active' => $item->is_active,
                    'prodi' => $item->prodi ? ['id' => $item->prodi->id, 'kode' => $item->prodi->kode, 'nama' => $item->prodi->nama] : null,
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

    private function renderKelas(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $data = $this->baseData();
        $page = $this->kelasQuery($request)->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('Modules/Akademik/Kelas', [
            'tabs' => $this->akademikTabs(),
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'mataKuliahs' => $data['mataKuliahs'],
            'dosens' => $data['dosens'],
            'ruangans' => $data['ruangans'],
            'tahunAkademiks' => $data['tahunAkademiks'],
            'kelasList' => [
                'data' => collect($page->items())->map(fn (Kelas $item) => [
                    'id' => $item->id,
                    'mata_kuliah_id' => $item->mata_kuliah_id,
                    'dosen_id' => $item->dosen_id,
                    'tahun_akademik_id' => $item->tahun_akademik_id,
                    'kode_kelas' => $item->kode_kelas,
                    'tahun_akademik' => $item->tahun_akademik,
                    'semester_akademik' => $item->semester_akademik,
                    'kapasitas' => $item->kapasitas,
                    'ruangan_id' => $item->ruangan_id,
                    'ruangan' => $item->ruangan,
                    'is_active' => $item->is_active,
                    'mata_kuliah' => $item->mataKuliah ? ['id' => $item->mataKuliah->id, 'kode' => $item->mataKuliah->kode, 'nama' => $item->mataKuliah->nama] : null,
                    'dosen' => $item->dosen ? ['id' => $item->dosen->id, 'nidn' => $item->dosen->nidn, 'nama' => $item->dosen->nama] : null,
                    'ruangan_ref' => $item->ruanganRef ? ['id' => $item->ruanganRef->id, 'kode' => $item->ruanganRef->kode, 'nama' => $item->ruanganRef->nama] : null,
                    'tahunAkademik' => $item->tahunAkademik ? ['id' => $item->tahunAkademik->id, 'kode' => $item->tahunAkademik->kode, 'nama' => $item->tahunAkademik->nama] : null,
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

    private function renderRuangan(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;
        $page = $this->ruanganQuery($request)->orderBy('nama')->paginate($perPage)->withQueryString();

        return Inertia::render('Modules/Akademik/Ruangan', [
            'tabs' => $this->akademikTabs(),
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'ruangans' => [
                'data' => collect($page->items())->map(fn (Ruangan $item) => [
                    'id' => $item->id,
                    'kode' => $item->kode,
                    'nama' => $item->nama,
                    'gedung' => $item->gedung,
                    'kapasitas' => $item->kapasitas,
                    'is_active' => $item->is_active,
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

    private function mataKuliahQuery(Request $request)
    {
        $search = trim((string) $request->string('search'));

        return MataKuliah::query()
            ->with(['prodi:id,kode,nama', 'kurikulum:id,kode,nama'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('semester', 'like', "%{$search}%")
                        ->orWhere('sks', 'like', "%{$search}%")
                        ->orWhere('jenis', 'like', "%{$search}%")
                        ->orWhereHas('prodi', fn ($prodiQuery) => $prodiQuery->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"))
                        ->orWhereHas('kurikulum', fn ($kurikulumQuery) => $kurikulumQuery->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"));
                });
            });
    }

    private function syncMataKuliahRows(array $rows): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'touched_prodi_ids' => []];

        foreach ($rows as $row) {
            $kode = trim((string) ($row['kode'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $prodiKode = trim((string) ($row['prodi_kode'] ?? $row['prodi'] ?? ''));

            if ($kode === '' || $nama === '' || $prodiKode === '') {
                $summary['skipped']++;
                continue;
            }

            $prodi = Prodi::query()->where('kode', $prodiKode)->first();
            if (! $prodi) {
                $summary['skipped']++;
                continue;
            }

            $kurikulum = null;
            $kurikulumKode = trim((string) ($row['kurikulum_kode'] ?? $row['kurikulum'] ?? ''));
            if ($kurikulumKode !== '') {
                $kurikulum = Kurikulum::query()->where('kode', $kurikulumKode)->first();
            }

            $payload = [
                'prodi_id' => $prodi->id,
                'kurikulum_id' => $kurikulum?->id,
                'nama' => $nama,
                'semester' => (int) ($row['semester'] ?? 1),
                'sks' => (int) ($row['sks'] ?? 2),
                'jenis' => trim((string) ($row['jenis'] ?? 'wajib')),
                'is_active' => $this->booleanFromRow($row['is_active'] ?? false),
            ];

            $existing = MataKuliah::query()->where('kode', $kode)->first();
            MataKuliah::query()->updateOrCreate(['kode' => $kode], ['kode' => $kode] + $payload);
            $summary['touched_prodi_ids'][] = (int) $prodi->id;
            if ($existing && (int) $existing->prodi_id !== (int) $prodi->id) {
                $summary['touched_prodi_ids'][] = (int) $existing->prodi_id;
            }
            $existing ? $summary['updated']++ : $summary['created']++;
        }

        return $summary;
    }

    private function syncProdiSksLulus(array $prodiIds): void
    {
        $prodiIds = array_values(array_unique(array_filter(array_map('intval', $prodiIds))));
        if ($prodiIds === []) {
            return;
        }

        $jurusanIds = Prodi::query()
            ->whereIn('id', $prodiIds)
            ->pluck('jurusan_id')
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($jurusanIds === []) {
            return;
        }

        foreach ($jurusanIds as $jurusanId) {
            $totalSksJurusan = (int) MataKuliah::query()
                ->whereHas('prodi', fn ($query) => $query->where('jurusan_id', $jurusanId))
                ->sum('sks');

            Prodi::query()
                ->where('jurusan_id', $jurusanId)
                ->update(['sks_lulus' => $totalSksJurusan]);
        }
    }

    private function prodiQuery(Request $request)
    {
        $search = trim((string) $request->string('search'));

        return Prodi::query()
            ->with('jurusan:id,kode,nama')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('jenjang', 'like', "%{$search}%")
                        ->orWhereHas('jurusan', fn ($jurusanQuery) => $jurusanQuery->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"));
                });
            });
    }

    private function kurikulumQuery(Request $request)
    {
        $search = trim((string) $request->string('search'));

        return Kurikulum::query()
            ->with('prodi:id,kode,nama')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('tahun_berlaku', 'like', "%{$search}%")
                        ->orWhereHas('prodi', fn ($prodiQuery) => $prodiQuery->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"));
                });
            });
    }

    private function kelasQuery(Request $request)
    {
        $search = trim((string) $request->string('search'));

        return Kelas::query()
            ->with(['mataKuliah:id,kode,nama', 'dosen:id,nidn,nama', 'ruanganRef:id,kode,nama', 'tahunAkademik:id,kode,nama'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode_kelas', 'like', "%{$search}%")
                        ->orWhere('tahun_akademik', 'like', "%{$search}%")
                        ->orWhere('semester_akademik', 'like', "%{$search}%")
                        ->orWhereHas('mataKuliah', fn ($mkQuery) => $mkQuery->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"))
                        ->orWhereHas('dosen', fn ($dosenQuery) => $dosenQuery->where('nidn', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"))
                        ->orWhereHas('ruanganRef', fn ($ruanganQuery) => $ruanganQuery->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"))
                        ->orWhereHas('tahunAkademik', fn ($tahunQuery) => $tahunQuery->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"));
                });
            });
    }

    private function ruanganQuery(Request $request)
    {
        $search = trim((string) $request->string('search'));

        return Ruangan::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('gedung', 'like', "%{$search}%");
                });
            });
    }

    private function syncProdiRows(array $rows): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'touched_prodi_ids' => []];

        foreach ($rows as $row) {
            $kode = trim((string) ($row['kode'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $jurusanKode = trim((string) ($row['jurusan_kode'] ?? $row['jurusan'] ?? ''));

            if ($kode === '' || $nama === '' || $jurusanKode === '') {
                $summary['skipped']++;
                continue;
            }

            $jurusan = Jurusan::query()->where('kode', $jurusanKode)->first();
            if (! $jurusan) {
                $summary['skipped']++;
                continue;
            }

            $payload = [
                'jurusan_id' => $jurusan->id,
                'nama' => $nama,
                'jenjang' => trim((string) ($row['jenjang'] ?? 'S1')),
                'semester_total' => (int) ($row['semester_total'] ?? 8),
                'sks_lulus' => 0,
                'is_active' => $this->booleanFromRow($row['is_active'] ?? false),
            ];

            $existing = Prodi::query()->where('kode', $kode)->first();
            Prodi::query()->updateOrCreate(['kode' => $kode], ['kode' => $kode] + $payload);
            if ($existing) {
                $summary['touched_prodi_ids'][] = (int) $existing->id;
            } else {
                $created = Prodi::query()->where('kode', $kode)->first(['id']);
                if ($created) {
                    $summary['touched_prodi_ids'][] = (int) $created->id;
                }
            }
            $existing ? $summary['updated']++ : $summary['created']++;
        }

        return $summary;
    }

    private function syncKurikulumRows(array $rows): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($rows as $row) {
            $kode = trim((string) ($row['kode'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $prodiKode = trim((string) ($row['prodi_kode'] ?? $row['prodi'] ?? ''));

            if ($kode === '' || $nama === '' || $prodiKode === '') {
                $summary['skipped']++;
                continue;
            }

            $prodi = Prodi::query()->where('kode', $prodiKode)->first();
            if (! $prodi) {
                $summary['skipped']++;
                continue;
            }

            $payload = [
                'prodi_id' => $prodi->id,
                'nama' => $nama,
                'tahun_berlaku' => (int) ($row['tahun_berlaku'] ?? now()->year),
                'is_active' => $this->booleanFromRow($row['is_active'] ?? false),
            ];

            $existing = Kurikulum::query()->where('kode', $kode)->first();
            Kurikulum::query()->updateOrCreate(['kode' => $kode], ['kode' => $kode] + $payload);
            $existing ? $summary['updated']++ : $summary['created']++;
        }

        return $summary;
    }

    private function syncRuanganRows(array $rows): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($rows as $row) {
            $kode = trim((string) ($row['kode'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));

            if ($kode === '' || $nama === '') {
                $summary['skipped']++;
                continue;
            }

            $payload = [
                'nama' => $nama,
                'gedung' => trim((string) ($row['gedung'] ?? '')) ?: null,
                'kapasitas' => (int) ($row['kapasitas'] ?? 40),
                'is_active' => $this->booleanFromRow($row['is_active'] ?? false),
            ];

            $existing = Ruangan::query()->where('kode', $kode)->first();
            Ruangan::query()->updateOrCreate(['kode' => $kode], ['kode' => $kode] + $payload);
            $existing ? $summary['updated']++ : $summary['created']++;
        }

        return $summary;
    }

    private function syncKelasRows(array $rows): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($rows as $row) {
            $kodeKelas = trim((string) ($row['kode_kelas'] ?? ''));
            $mkKode = trim((string) ($row['mata_kuliah_kode'] ?? ''));

            if ($kodeKelas === '' || $mkKode === '') {
                $summary['skipped']++;
                continue;
            }

            $mataKuliah = MataKuliah::query()->where('kode', $mkKode)->first();
            if (! $mataKuliah) {
                $summary['skipped']++;
                continue;
            }

            $dosen = null;
            $dosenNidn = trim((string) ($row['dosen_nidn'] ?? ''));
            if ($dosenNidn !== '') {
                $dosen = Dosen::query()->where('nidn', $dosenNidn)->first();
            }

            $tahunAkademik = null;
            $tahunKode = trim((string) ($row['tahun_akademik_kode'] ?? ''));
            if ($tahunKode !== '') {
                $tahunAkademik = TahunAkademik::query()->where('kode', $tahunKode)->first();
            }

            $ruangan = null;
            $ruanganKode = trim((string) ($row['ruangan_kode'] ?? ''));
            if ($ruanganKode !== '') {
                $ruangan = Ruangan::query()->where('kode', $ruanganKode)->first();
            }

            $payload = [
                'mata_kuliah_id' => $mataKuliah->id,
                'dosen_id' => $dosen?->id,
                'tahun_akademik_id' => $tahunAkademik?->id,
                'kode_kelas' => $kodeKelas,
                'tahun_akademik' => trim((string) ($row['tahun_akademik'] ?? ($tahunAkademik?->kode ?? ''))),
                'semester_akademik' => (int) ($row['semester_akademik'] ?? ($tahunAkademik?->semester_aktif ?? 1)),
                'kapasitas' => (int) ($row['kapasitas'] ?? 40),
                'ruangan_id' => $ruangan?->id,
                'ruangan' => trim((string) ($row['ruangan'] ?? ($ruangan?->nama ?? ''))),
                'is_active' => $this->booleanFromRow($row['is_active'] ?? false),
            ];

            $existing = Kelas::query()->where('kode_kelas', $kodeKelas)->first();
            Kelas::query()->updateOrCreate(['kode_kelas' => $kodeKelas], $payload);
            $existing ? $summary['updated']++ : $summary['created']++;
        }

        return $summary;
    }

    private function booleanFromRow(mixed $value): bool
    {
        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'ya', 'aktif'], true);
    }

    private function renderTahunAkademik(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;

        $query = $this->tahunAkademikQuery($request);
        $page = $query
            ->orderByDesc('is_active')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Modules/Akademik/TahunAkademik', [
            'tabs' => $this->akademikTabs(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'tahunAkademiks' => [
                'data' => collect($page->items())->map(fn (TahunAkademik $item) => [
                    'id' => $item->id,
                    'kode' => $item->kode,
                    'nama' => $item->nama,
                    'semester_aktif' => $item->semester_aktif,
                    'tanggal_mulai' => optional($item->tanggal_mulai)->toDateString(),
                    'tanggal_selesai' => optional($item->tanggal_selesai)->toDateString(),
                    'is_active' => $item->is_active,
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

    private function renderJurusan(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;

        $page = $this->jurusanQuery($request)
            ->orderBy('nama')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Modules/Akademik/Jurusan', [
            'tabs' => $this->akademikTabs(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'jurusans' => [
                'data' => collect($page->items())->map(fn (Jurusan $item) => [
                    'id' => $item->id,
                    'kode' => $item->kode,
                    'nama' => $item->nama,
                    'deskripsi' => $item->deskripsi,
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

    private function jurusanQuery(Request $request)
    {
        $search = trim((string) $request->string('search'));

        return Jurusan::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            });
    }

    private function syncJurusanRows(array $rows): array
    {
        $summary = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
        ];

        foreach ($rows as $row) {
            $kode = trim((string) ($row['kode'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $deskripsi = trim((string) ($row['deskripsi'] ?? ''));

            if ($kode === '' || $nama === '') {
                $summary['skipped']++;
                continue;
            }

            $existing = Jurusan::query()->where('kode', $kode)->first();

            Jurusan::query()->updateOrCreate(
                ['kode' => $kode],
                [
                    'nama' => $nama,
                    'deskripsi' => $deskripsi !== '' ? $deskripsi : null,
                ]
            );

            $existing ? $summary['updated']++ : $summary['created']++;
        }

        return $summary;
    }

    private function tahunAkademikQuery(Request $request)
    {
        $search = trim((string) $request->string('search'));

        return TahunAkademik::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('kode', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('semester_aktif', 'like', "%{$search}%")
                        ->orWhere('tanggal_mulai', 'like', "%{$search}%")
                        ->orWhere('tanggal_selesai', 'like', "%{$search}%");
                });
            });
    }

    private function syncTahunAkademikRows(array $rows): array
    {
        $summary = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
        ];

        foreach ($rows as $row) {
            $kode = trim((string) ($row['kode'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $semester = (int) ($row['semester_aktif'] ?? 1);

            if ($kode === '' || $nama === '' || $semester <= 0) {
                $summary['skipped']++;
                continue;
            }

            $isActive = in_array(strtolower((string) ($row['is_active'] ?? '0')), ['1', 'true', 'yes', 'ya', 'aktif'], true);
            $tanggalMulai = $this->normalizeDate($row['tanggal_mulai'] ?? null);
            $tanggalSelesai = $this->normalizeDate($row['tanggal_selesai'] ?? null);

            if ($isActive) {
                TahunAkademik::query()->where('kode', '!=', $kode)->update(['is_active' => false]);
            }

            $existing = TahunAkademik::query()->where('kode', $kode)->first();

            TahunAkademik::query()->updateOrCreate(
                ['kode' => $kode],
                [
                    'nama' => $nama,
                    'semester_aktif' => $semester,
                    'tanggal_mulai' => $tanggalMulai,
                    'tanggal_selesai' => $tanggalSelesai,
                    'is_active' => $isActive,
                ]
            );

            $existing ? $summary['updated']++ : $summary['created']++;
        }

        return $summary;
    }

    private function normalizeDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    public function storeJurusan(StoreJurusanRequest $request): RedirectResponse
    {
        Jurusan::query()->create($request->validated());

        return back()->with('success', 'Jurusan berhasil ditambahkan.');
    }

    public function updateJurusan(UpdateJurusanRequest $request, Jurusan $jurusan): RedirectResponse
    {
        $jurusan->update($request->validated());

        return back()->with('success', 'Jurusan berhasil diperbarui.');
    }

    public function destroyJurusan(Jurusan $jurusan): RedirectResponse
    {
        if ($jurusan->prodis()->exists()) {
            return back()->with('error', 'Jurusan tidak dapat dihapus karena masih dipakai oleh prodi.');
        }

        $jurusan->delete();

        return back()->with('success', 'Jurusan berhasil dihapus.');
    }

    public function storeProdi(StoreProdiRequest $request): RedirectResponse
    {
        $payload = $request->validated();
        unset($payload['sks_lulus']);
        $prodi = Prodi::query()->create($payload + ['sks_lulus' => 0]);
        $this->syncProdiSksLulus([$prodi->id]);

        return back()->with('success', 'Prodi berhasil ditambahkan.');
    }

    public function updateProdi(UpdateProdiRequest $request, Prodi $prodi): RedirectResponse
    {
        $payload = $request->validated();
        unset($payload['sks_lulus']);
        $prodi->update($payload);
        $this->syncProdiSksLulus([$prodi->id]);

        return back()->with('success', 'Prodi berhasil diperbarui.');
    }

    public function destroyProdi(Prodi $prodi): RedirectResponse
    {
        if ($prodi->mahasiswas()->exists() || $prodi->dosens()->exists() || $prodi->kurikulums()->exists() || $prodi->mataKuliahs()->exists()) {
            return back()->with('error', 'Prodi tidak dapat dihapus karena masih dipakai mahasiswa, dosen, kurikulum, atau mata kuliah.');
        }

        $prodi->delete();

        return back()->with('success', 'Prodi berhasil dihapus.');
    }

    public function storeMataKuliah(StoreMataKuliahRequest $request): RedirectResponse
    {
        $mataKuliah = MataKuliah::query()->create($request->validated());
        $this->syncProdiSksLulus([(int) $mataKuliah->prodi_id]);

        return back()->with('success', 'Mata kuliah berhasil ditambahkan.');
    }

    public function updateMataKuliah(UpdateMataKuliahRequest $request, MataKuliah $mataKuliah): RedirectResponse
    {
        $oldProdiId = (int) $mataKuliah->prodi_id;
        $mataKuliah->update($request->validated());
        $this->syncProdiSksLulus([$oldProdiId, (int) $mataKuliah->prodi_id]);

        return back()->with('success', 'Mata kuliah berhasil diperbarui.');
    }

    public function destroyMataKuliah(MataKuliah $mataKuliah): RedirectResponse
    {
        if ($mataKuliah->kelas()->exists()) {
            return back()->with('error', 'Mata kuliah tidak dapat dihapus karena masih dipakai oleh kelas.');
        }

        $prodiId = (int) $mataKuliah->prodi_id;
        $mataKuliah->delete();
        $this->syncProdiSksLulus([$prodiId]);

        return back()->with('success', 'Mata kuliah berhasil dihapus.');
    }

    public function storeKurikulum(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'prodi_id' => ['required', 'exists:prodis,id'],
            'nama' => ['required', 'string', 'max:255'],
            'kode' => ['required', 'string', 'max:30', 'unique:kurikulums,kode'],
            'tahun_berlaku' => ['required', 'integer', 'digits:4'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (($data['is_active'] ?? false) === true) {
            Kurikulum::query()->where('prodi_id', $data['prodi_id'])->update(['is_active' => false]);
        }

        Kurikulum::query()->create($data);

        return back()->with('success', 'Kurikulum berhasil ditambahkan.');
    }

    public function updateKurikulum(Request $request, Kurikulum $kurikulum): RedirectResponse
    {
        $data = $request->validate([
            'prodi_id' => ['required', 'exists:prodis,id'],
            'nama' => ['required', 'string', 'max:255'],
            'kode' => ['required', 'string', 'max:30', 'unique:kurikulums,kode,'.$kurikulum->id],
            'tahun_berlaku' => ['required', 'integer', 'digits:4'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (($data['is_active'] ?? false) === true) {
            Kurikulum::query()
                ->where('prodi_id', $data['prodi_id'])
                ->where('id', '!=', $kurikulum->id)
                ->update(['is_active' => false]);
        }

        $kurikulum->update($data);

        return back()->with('success', 'Kurikulum berhasil diperbarui.');
    }

    public function destroyKurikulum(Kurikulum $kurikulum): RedirectResponse
    {
        if ($kurikulum->mataKuliahs()->exists()) {
            return back()->with('error', 'Kurikulum tidak dapat dihapus karena masih dipakai oleh mata kuliah.');
        }

        $kurikulum->delete();

        return back()->with('success', 'Kurikulum berhasil dihapus.');
    }

    public function storeKelas(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'mata_kuliah_id' => ['required', 'exists:mata_kuliahs,id'],
            'dosen_id' => ['nullable', 'exists:dosens,id'],
            'tahun_akademik_id' => ['nullable', 'exists:tahun_akademiks,id'],
            'kode_kelas' => ['required', 'string', 'max:20'],
            'tahun_akademik' => ['required', 'string', 'max:20'],
            'semester_akademik' => ['required', 'integer', 'min:1', 'max:14'],
            'kapasitas' => ['required', 'integer', 'min:1', 'max:500'],
            'ruangan_id' => ['nullable', 'exists:ruangans,id'],
            'ruangan' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!empty($data['tahun_akademik_id'])) {
            $tahun = TahunAkademik::query()->find($data['tahun_akademik_id']);
            if ($tahun) {
                $data['tahun_akademik'] = $tahun->kode;
                $data['semester_akademik'] = $tahun->semester_aktif;
            }
        }

        if (!empty($data['ruangan_id'])) {
            $ruangan = Ruangan::query()->find($data['ruangan_id']);
            if ($ruangan) {
                $data['ruangan'] = $ruangan->nama;
            }
        }

        Kelas::query()->create($data);

        return back()->with('success', 'Kelas berhasil ditambahkan.');
    }

    public function updateKelas(Request $request, Kelas $kelas): RedirectResponse
    {
        $data = $request->validate([
            'mata_kuliah_id' => ['required', 'exists:mata_kuliahs,id'],
            'dosen_id' => ['nullable', 'exists:dosens,id'],
            'tahun_akademik_id' => ['nullable', 'exists:tahun_akademiks,id'],
            'kode_kelas' => ['required', 'string', 'max:20'],
            'tahun_akademik' => ['required', 'string', 'max:20'],
            'semester_akademik' => ['required', 'integer', 'min:1', 'max:14'],
            'kapasitas' => ['required', 'integer', 'min:1', 'max:500'],
            'ruangan_id' => ['nullable', 'exists:ruangans,id'],
            'ruangan' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!empty($data['tahun_akademik_id'])) {
            $tahun = TahunAkademik::query()->find($data['tahun_akademik_id']);
            if ($tahun) {
                $data['tahun_akademik'] = $tahun->kode;
                $data['semester_akademik'] = $tahun->semester_aktif;
            }
        }

        if (!empty($data['ruangan_id'])) {
            $ruangan = Ruangan::query()->find($data['ruangan_id']);
            if ($ruangan) {
                $data['ruangan'] = $ruangan->nama;
            }
        }

        $kelas->update($data);

        return back()->with('success', 'Kelas berhasil diperbarui.');
    }

    public function destroyKelas(Kelas $kelas): RedirectResponse
    {
        if ($kelas->jadwals()->exists() || $kelas->krsDetails()->exists()) {
            return back()->with('error', 'Kelas tidak dapat dihapus karena sudah dipakai jadwal atau KRS.');
        }

        $kelas->delete();

        return back()->with('success', 'Kelas berhasil dihapus.');
    }

    public function storeRuangan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:30', 'unique:ruangans,kode'],
            'nama' => ['required', 'string', 'max:255'],
            'gedung' => ['nullable', 'string', 'max:255'],
            'kapasitas' => ['required', 'integer', 'min:1', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        Ruangan::query()->create($data);
        return back()->with('success', 'Ruangan berhasil ditambahkan.');
    }

    public function updateRuangan(Request $request, Ruangan $ruangan): RedirectResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:30', 'unique:ruangans,kode,'.$ruangan->id],
            'nama' => ['required', 'string', 'max:255'],
            'gedung' => ['nullable', 'string', 'max:255'],
            'kapasitas' => ['required', 'integer', 'min:1', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        $ruangan->update($data);
        return back()->with('success', 'Ruangan berhasil diperbarui.');
    }

    public function destroyRuangan(Ruangan $ruangan): RedirectResponse
    {
        if ($ruangan->kelas()->exists()) {
            return back()->with('error', 'Ruangan tidak dapat dihapus karena masih dipakai oleh kelas.');
        }

        $ruangan->delete();
        return back()->with('success', 'Ruangan berhasil dihapus.');
    }

    public function storeTahunAkademik(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:20', 'unique:tahun_akademiks,kode'],
            'nama' => ['required', 'string', 'max:50'],
            'semester_aktif' => ['required', 'integer', 'min:1', 'max:14'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        if (($data['is_active'] ?? false) === true) {
            TahunAkademik::query()->update(['is_active' => false]);
        }
        TahunAkademik::query()->create($data);
        return back()->with('success', 'Tahun akademik berhasil ditambahkan.');
    }

    public function updateTahunAkademik(Request $request, TahunAkademik $tahunAkademik): RedirectResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:20', 'unique:tahun_akademiks,kode,'.$tahunAkademik->id],
            'nama' => ['required', 'string', 'max:50'],
            'semester_aktif' => ['required', 'integer', 'min:1', 'max:14'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        if (($data['is_active'] ?? false) === true) {
            TahunAkademik::query()->where('id', '!=', $tahunAkademik->id)->update(['is_active' => false]);
        }
        $tahunAkademik->update($data);
        return back()->with('success', 'Tahun akademik berhasil diperbarui.');
    }

    public function destroyTahunAkademik(TahunAkademik $tahunAkademik): RedirectResponse
    {
        if ($tahunAkademik->kelas()->exists() || $tahunAkademik->krs()->exists()) {
            return back()->with('error', 'Tahun akademik tidak dapat dihapus karena masih dipakai oleh kelas atau KRS.');
        }

        $tahunAkademik->delete();
        return back()->with('success', 'Tahun akademik berhasil dihapus.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Dosen;
use App\Models\Prodi;
use App\Notifications\DosenUpdated;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DosenRelasiController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $perPage = min(max((int) $request->integer('per_page', 10), 5), 50);
        $sortBy = (string) $request->string('sort_by', 'latest');
        $sortDir = (string) $request->string('sort_dir', 'desc');

        $allowedSorts = ['latest', 'nidn', 'nama', 'prodi'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'latest';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = Dosen::query()
            ->with('prodi:id,nama,jenjang')
            ->when($status !== 'all', fn ($query) => $query->where('status_dosen', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('nidn', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            });

        match ($sortBy) {
            'nidn' => $query->orderBy('nidn', $sortDir),
            'nama' => $query->orderBy('nama', $sortDir),
            'prodi' => $query->orderByRaw("COALESCE((SELECT nama FROM prodis WHERE prodis.id = dosens.prodi_id), '') {$sortDir}"),
            default => $query->orderBy('id', 'desc'),
        };

        $page = $query->paginate($perPage)->withQueryString();
        $summary = [
            'total' => Dosen::query()->count(),
            'with_prodi' => Dosen::query()->whereNotNull('prodi_id')->count(),
            'without_prodi' => Dosen::query()->whereNull('prodi_id')->count(),
        ];

        return Inertia::render('Modules/Dosen/Relasi', [
            'prodis' => Prodi::query()->orderBy('nama')->get(['id', 'nama', 'jenjang']),
            'summary' => $summary,
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
                    'nama' => $dosen->nama,
                    'email' => $dosen->email,
                    'status_dosen' => $dosen->status_dosen,
                    'prodi_id' => $dosen->prodi_id,
                    'prodi' => $dosen->prodi ? [
                        'id' => $dosen->prodi->id,
                        'nama' => $dosen->prodi->nama,
                        'jenjang' => $dosen->prodi->jenjang,
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

    public function update(Request $request, Dosen $dosen): RedirectResponse
    {
        $previousProdi = $dosen->prodi?->nama ?? 'Tidak ada';
        $data = $request->validate([
            'prodi_id' => ['nullable', 'exists:prodis,id'],
        ]);

        $dosen->update([
            'prodi_id' => $data['prodi_id'] ?: null,
        ]);

        $dosen->load('user', 'prodi');
        if ($dosen->user) {
            $dosen->user->notify(new DosenUpdated(
                $dosen->nama,
                'relasi',
                $previousProdi,
                $dosen->prodi?->nama ?? 'Tidak ada',
                $dosen->prodi?->nama
            ));
        }

        return back()->with('success', 'Relasi prodi dosen berhasil diperbarui.');
    }
}

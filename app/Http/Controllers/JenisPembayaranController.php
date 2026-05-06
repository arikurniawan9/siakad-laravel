<?php

namespace App\Http\Controllers;

use App\Models\JenisPembayaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class JenisPembayaranController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 30, 50, 100], true) ? $perPage : 10;

        $sortBy = (string) $request->string('sort_by', 'sort_order');
        $sortDir = strtolower((string) $request->string('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['sort_order', 'kode', 'nama', 'provider', 'payment_type', 'is_active', 'created_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'sort_order';
        }

        $query = JenisPembayaran::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($nested) use ($search) {
                    $nested
                        ->where('kode', 'like', "%{$search}%")
                        ->orWhere('nama', 'like', "%{$search}%")
                        ->orWhere('provider', 'like', "%{$search}%")
                        ->orWhere('payment_type', 'like', "%{$search}%");
                });
            });

        $query->orderBy($sortBy, $sortDir)->orderBy('id', 'desc');

        $page = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Modules/Keuangan/JenisPembayaran', [
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'jenisPembayarans' => [
                'data' => collect($page->items())->map(fn (JenisPembayaran $item) => [
                    'id' => $item->id,
                    'kode' => $item->kode,
                    'nama' => $item->nama,
                    'provider' => $item->provider,
                    'payment_type' => $item->payment_type,
                    'keterangan' => $item->keterangan,
                    'is_active' => (bool) $item->is_active,
                    'sort_order' => (int) $item->sort_order,
                    'created_at' => optional($item->created_at)->toDateTimeString(),
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

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:30', 'regex:/^[A-Za-z0-9._-]+$/', 'unique:jenis_pembayarans,kode'],
            'nama' => ['required', 'string', 'max:120'],
            'provider' => ['required', 'string', 'in:manual,midtrans'],
            'payment_type' => ['nullable', 'string', 'max:50', 'required_if:provider,midtrans'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        JenisPembayaran::query()->create([
            'kode' => strtoupper(trim((string) $validated['kode'])),
            'nama' => trim((string) $validated['nama']),
            'provider' => $validated['provider'],
            'payment_type' => filled($validated['payment_type'] ?? null) ? trim((string) $validated['payment_type']) : null,
            'keterangan' => filled($validated['keterangan'] ?? null) ? trim((string) $validated['keterangan']) : null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
        ]);

        return back()->with('success', 'Jenis pembayaran berhasil ditambahkan.');
    }

    public function update(Request $request, JenisPembayaran $jenisPembayaran): RedirectResponse
    {
        $validated = $request->validate([
            'kode' => [
                'required',
                'string',
                'max:30',
                'regex:/^[A-Za-z0-9._-]+$/',
                Rule::unique('jenis_pembayarans', 'kode')->ignore($jenisPembayaran->id),
            ],
            'nama' => ['required', 'string', 'max:120'],
            'provider' => ['required', 'string', 'in:manual,midtrans'],
            'payment_type' => ['nullable', 'string', 'max:50', 'required_if:provider,midtrans'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        $jenisPembayaran->update([
            'kode' => strtoupper(trim((string) $validated['kode'])),
            'nama' => trim((string) $validated['nama']),
            'provider' => $validated['provider'],
            'payment_type' => filled($validated['payment_type'] ?? null) ? trim((string) $validated['payment_type']) : null,
            'keterangan' => filled($validated['keterangan'] ?? null) ? trim((string) $validated['keterangan']) : null,
            'is_active' => (bool) ($validated['is_active'] ?? $jenisPembayaran->is_active),
            'sort_order' => (int) ($validated['sort_order'] ?? $jenisPembayaran->sort_order),
        ]);

        return back()->with('success', 'Jenis pembayaran berhasil diperbarui.');
    }

    public function destroy(JenisPembayaran $jenisPembayaran): RedirectResponse
    {
        $jenisPembayaran->delete();

        return back()->with('success', 'Jenis pembayaran berhasil dihapus.');
    }
}

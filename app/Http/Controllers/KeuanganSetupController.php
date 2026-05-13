<?php

namespace App\Http\Controllers;

use App\Models\JenisTagihan;
use App\Models\TahunAkademik;
use App\Models\TarifKeuangan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class KeuanganSetupController extends Controller
{
    public function index(Request $request): Response
    {
        $activeTahun = TahunAkademik::query()
            ->where('is_active', true)
            ->latest('id')
            ->first();

        $tahunAkademik = trim((string) $request->string('tahun_akademik', (string) ($activeTahun?->kode ?? '')));
        $semesterAkademik = $request->integer('semester_akademik', (int) ($activeTahun?->semester_aktif ?? 1));
        $semesterAkademik = $semesterAkademik > 0 ? $semesterAkademik : 1;

        $tahunAkademiks = TahunAkademik::query()
            ->orderByDesc('is_active')
            ->orderByDesc('id')
            ->limit(20)
            ->get(['id', 'kode', 'nama', 'semester_aktif', 'is_active'])
            ->map(fn (TahunAkademik $ta) => [
                'id' => $ta->id,
                'kode' => $ta->kode,
                'nama' => $ta->nama,
                'semester_aktif' => (int) $ta->semester_aktif,
                'is_active' => (bool) $ta->is_active,
            ])->values();

        $jenisTagihans = JenisTagihan::query()
            ->orderBy('sort_order')
            ->orderBy('nama')
            ->get(['id', 'kode', 'nama', 'keterangan', 'is_active', 'sort_order'])
            ->map(fn (JenisTagihan $jenis) => [
                'id' => $jenis->id,
                'kode' => $jenis->kode,
                'nama' => $jenis->nama,
                'keterangan' => $jenis->keterangan,
                'is_active' => (bool) $jenis->is_active,
                'sort_order' => (int) $jenis->sort_order,
            ])->values();

        $tarifs = TarifKeuangan::query()
            ->with(['jenisTagihan:id,kode,nama'])
            ->when($tahunAkademik !== '', fn ($q) => $q->where('tahun_akademik', $tahunAkademik))
            ->where('semester_akademik', $semesterAkademik)
            ->get()
            ->map(fn (TarifKeuangan $tarif) => [
                'id' => $tarif->id,
                'jenis_tagihan_id' => (int) $tarif->jenis_tagihan_id,
                'tahun_akademik' => $tarif->tahun_akademik,
                'semester_akademik' => (int) $tarif->semester_akademik,
                'nominal' => (float) $tarif->nominal,
                'keterangan' => $tarif->keterangan,
                'is_active' => (bool) $tarif->is_active,
                'can_installment' => (bool) $tarif->can_installment,
                'installment_max' => $tarif->installment_max !== null ? (int) $tarif->installment_max : null,
                'installment_default' => $tarif->installment_default !== null ? (int) $tarif->installment_default : null,
                'jenis_tagihan' => $tarif->jenisTagihan ? [
                    'kode' => $tarif->jenisTagihan->kode,
                    'nama' => $tarif->jenisTagihan->nama,
                ] : null,
            ])
            ->keyBy('jenis_tagihan_id')
            ->all();

        return Inertia::render('Modules/Keuangan/SetupTarif', [
            'filters' => [
                'tahun_akademik' => $tahunAkademik,
                'semester_akademik' => $semesterAkademik,
            ],
            'tahunAkademiks' => $tahunAkademiks,
            'jenisTagihans' => $jenisTagihans,
            'tarifsByJenisId' => $tarifs,
        ]);
    }

    public function storeJenisTagihan(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:30', 'regex:/^[A-Za-z0-9._-]+$/', 'unique:jenis_tagihans,kode'],
            'nama' => ['required', 'string', 'max:120'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        JenisTagihan::query()->create([
            'kode' => strtoupper(trim((string) $validated['kode'])),
            'nama' => trim((string) $validated['nama']),
            'keterangan' => filled($validated['keterangan'] ?? null) ? trim((string) $validated['keterangan']) : null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
        ]);

        return back()->with('success', 'Jenis tagihan berhasil ditambahkan.');
    }

    public function updateJenisTagihan(Request $request, JenisTagihan $jenisTagihan): RedirectResponse
    {
        $validated = $request->validate([
            'kode' => [
                'required',
                'string',
                'max:30',
                'regex:/^[A-Za-z0-9._-]+$/',
                Rule::unique('jenis_tagihans', 'kode')->ignore($jenisTagihan->id),
            ],
            'nama' => ['required', 'string', 'max:120'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        $jenisTagihan->update([
            'kode' => strtoupper(trim((string) $validated['kode'])),
            'nama' => trim((string) $validated['nama']),
            'keterangan' => filled($validated['keterangan'] ?? null) ? trim((string) $validated['keterangan']) : null,
            'is_active' => (bool) ($validated['is_active'] ?? $jenisTagihan->is_active),
            'sort_order' => (int) ($validated['sort_order'] ?? $jenisTagihan->sort_order),
        ]);

        return back()->with('success', 'Jenis tagihan berhasil diperbarui.');
    }

    public function destroyJenisTagihan(JenisTagihan $jenisTagihan): RedirectResponse
    {
        $jenisTagihan->delete();

        return back()->with('success', 'Jenis tagihan berhasil dihapus.');
    }

    public function storeTarif(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'jenis_tagihan_id' => ['required', 'integer', 'exists:jenis_tagihans,id'],
            'tahun_akademik' => ['required', 'string', 'max:20'],
            'semester_akademik' => ['required', 'integer', 'min:1', 'max:14'],
            'nominal' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
            'can_installment' => ['boolean'],
            'installment_max' => ['nullable', 'integer', 'min:2', 'max:24', 'required_if:can_installment,1'],
            'installment_default' => ['nullable', 'integer', 'min:1', 'max:24', 'required_if:can_installment,1'],
        ]);

        $error = $this->saveTarifPayload($validated);
        if ($error !== null) {
            return back()->withErrors($error);
        }

        return back()->with('success', 'Tarif berhasil disimpan.');
    }

    public function storeTarifBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.jenis_tagihan_id' => ['required', 'integer', 'exists:jenis_tagihans,id'],
            'items.*.tahun_akademik' => ['required', 'string', 'max:20'],
            'items.*.semester_akademik' => ['required', 'integer', 'min:1', 'max:14'],
            'items.*.nominal' => ['required', 'numeric', 'min:0'],
            'items.*.keterangan' => ['nullable', 'string', 'max:2000'],
            'items.*.is_active' => ['boolean'],
            'items.*.can_installment' => ['boolean'],
            'items.*.installment_max' => ['nullable', 'integer', 'min:2', 'max:24', 'required_if:items.*.can_installment,1'],
            'items.*.installment_default' => ['nullable', 'integer', 'min:1', 'max:24', 'required_if:items.*.can_installment,1'],
        ]);

        $savedCount = 0;
        foreach ($validated['items'] as $idx => $item) {
            $error = $this->saveTarifPayload($item);
            if ($error !== null) {
                return back()->withErrors($error)->with('error', 'Simpan massal gagal di baris ke-' . ($idx + 1) . '.');
            }
            $savedCount++;
        }

        return back()->with('success', "Simpan massal berhasil ({$savedCount} tarif).");
    }

    public function destroyTarif(TarifKeuangan $tarifKeuangan): RedirectResponse
    {
        $tarifKeuangan->delete();

        return back()->with('success', 'Tarif berhasil dihapus.');
    }

    private function saveTarifPayload(array $validated): ?array
    {
        $canInstallment = (bool) ($validated['can_installment'] ?? false);
        $installmentMax = $canInstallment ? (int) ($validated['installment_max'] ?? 0) : null;
        $installmentDefault = $canInstallment ? (int) ($validated['installment_default'] ?? 0) : null;

        if ($canInstallment && $installmentDefault > $installmentMax) {
            return [
                'installment_default' => 'Cicilan default tidak boleh melebihi maksimum cicilan.',
            ];
        }

        $identity = [
            'jenis_tagihan_id' => (int) $validated['jenis_tagihan_id'],
            'tahun_akademik' => trim((string) $validated['tahun_akademik']),
            'semester_akademik' => (int) $validated['semester_akademik'],
        ];

        $payload = [
            'nominal' => (float) $validated['nominal'],
            'keterangan' => filled($validated['keterangan'] ?? null) ? trim((string) $validated['keterangan']) : null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'can_installment' => $canInstallment,
            'installment_max' => $installmentMax,
            'installment_default' => $installmentDefault,
            'deleted_at' => null,
        ];

        $existing = TarifKeuangan::withTrashed()->where($identity)->first();
        if ($existing) {
            $existing->fill($payload);
            $existing->restore();
            $existing->save();
        } else {
            TarifKeuangan::query()->create($identity + $payload);
        }

        return null;
    }
}

<?php

namespace App\Http\Controllers;

use App\Exports\DosenTemplateExport;
use App\Imports\DosenPreviewImport;
use App\Models\Dosen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class DosenImportController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Modules/Dosen/Import', [
            'templateUrl' => route('dosen.import.template'),
            'previewRows' => [],
            'previewToken' => null,
            'successModal' => false,
            'importSummary' => null,
        ]);
    }

    public function template()
    {
        return Excel::download(new DosenTemplateExport(), 'Template-Import-Dosen.xlsx');
    }

    public function preview(Request $request)
    {
        if ($request->isMethod('get')) {
            return redirect()->route('dosen.import.index');
        }

        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new DosenPreviewImport();
        Excel::import($import, $data['file']);

        $rows = $this->normalizeRows($import->rows);
        $token = (string) Str::uuid();

        session()->put($this->sessionKey($token), $rows);

        if ($request->wantsJson()) {
            return response()->json([
                'previewRows' => $rows,
                'previewToken' => $token,
                'importSummary' => $this->buildSummary($rows),
            ]);
        }

        return Inertia::render('Modules/Dosen/Import', [
            'templateUrl' => route('dosen.import.template'),
            'previewRows' => $rows,
            'previewToken' => $token,
            'successModal' => false,
            'importSummary' => $this->buildSummary($rows),
            'flash' => [
                'success' => 'File berhasil dibaca. Tinjau data lalu pilih yang akan diimport.',
            ],
        ]);
    }

    public function process(Request $request)
    {
        $data = $request->validate([
            'preview_token' => ['required', 'string'],
            'selected_rows' => ['required', 'array'],
            'selected_rows.*' => ['integer'],
        ]);

        $rows = session()->get($this->sessionKey($data['preview_token']));
        if (! is_array($rows)) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Preview import sudah kedaluwarsa. Upload ulang file Excel.'], 422);
            }
            return back()->withErrors(['preview_token' => 'Preview import sudah kedaluwarsa. Upload ulang file Excel.']);
        }

        $selected = collect($data['selected_rows'])->map(fn ($value) => (int) $value)->all();
        $selectedLookup = array_flip($selected);

        $summary = [
            'total' => count($rows),
            'selected' => count($selected),
            'created' => 0,
            'failed' => 0,
            'skipped' => 0,
        ];

        $updatedRows = [];

        foreach ($rows as $row) {
            $rowNumber = (int) ($row['row_number'] ?? 0);
            $isSelected = isset($selectedLookup[$rowNumber]);

            if (! $isSelected) {
                $row['result'] = 'skipped';
                $row['result_label'] = 'Dilewati';
                $summary['skipped']++;
                $updatedRows[] = $row;
                continue;
            }

            if (($row['result'] ?? '') === 'success') {
                $summary['skipped']++;
                $updatedRows[] = $row;
                continue;
            }

            if (! ($row['can_import'] ?? false)) {
                $row['result'] = 'failed';
                $row['result_label'] = 'Gagal';
                $summary['failed']++;
                $updatedRows[] = $row;
                continue;
            }

            try {
                Dosen::query()->create([
                    'prodi_id' => null,
                    'nidn' => $row['nidn'],
                    'nip' => $row['nip'] ?: null,
                    'nama' => $row['nama'],
                    'email' => $row['email'] ?: null,
                    'phone' => $row['phone'] ?: null,
                    'status_dosen' => $row['status_dosen'],
                ]);

                $row['result'] = 'success';
                $row['result_label'] = 'Berhasil';
                $summary['created']++;
            } catch (Throwable $exception) {
                $row['result'] = 'failed';
                $row['result_label'] = 'Gagal';
                $row['issues'][] = 'Gagal menyimpan ke database';
                $summary['failed']++;
            }

            $updatedRows[] = $row;
        }

        session()->put($this->sessionKey($data['preview_token']), $updatedRows);

        if ($request->wantsJson()) {
            return response()->json([
                'previewRows' => $updatedRows,
                'previewToken' => $data['preview_token'],
                'importSummary' => $summary,
                'success' => true,
            ]);
        }

        return Inertia::render('Modules/Dosen/Import', [
            'templateUrl' => route('dosen.import.template'),
            'previewRows' => $updatedRows,
            'previewToken' => $data['preview_token'],
            'successModal' => true,
            'importSummary' => $summary,
            'flash' => [
                'success' => 'Proses import selesai.',
            ],
        ]);
    }

    private function normalizeRows(array $rows): array
    {
        $seenNidn = [];
        $seenNip = [];
        $nidnValues = collect($rows)->map(fn ($row) => trim((string) ($row['nidn'] ?? '')))->filter()->values()->all();
        $nipValues = collect($rows)->map(fn ($row) => trim((string) ($row['nip'] ?? '')))->filter()->values()->all();
        $existingNidn = Dosen::query()->whereIn('nidn', $nidnValues)->pluck('nidn')->all();
        $existingNip = Dosen::query()->whereIn('nip', $nipValues)->pluck('nip')->all();
        $existingNidnLookup = array_flip($existingNidn);
        $existingNipLookup = array_flip($existingNip);

        return collect($rows)->map(function (array $row, int $index) use (&$seenNidn, &$seenNip, $existingNidnLookup, $existingNipLookup) {
            $rowNumber = (int) ($row['row_number'] ?? $index + 2);
            $nidn = trim((string) ($row['nidn'] ?? ''));
            $nip = trim((string) ($row['nip'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $email = trim((string) ($row['email'] ?? ''));
            $phone = trim((string) ($row['phone'] ?? ''));
            $statusDosen = trim((string) ($row['status_dosen'] ?? 'tetap'));
            $statusDosen = in_array($statusDosen, ['tetap', 'tidak_tetap', 'luar_biasa'], true) ? $statusDosen : 'tetap';

            $issues = [];
            if ($nidn === '') {
                $issues[] = 'NIDN wajib diisi';
            }
            if ($nama === '') {
                $issues[] = 'Nama wajib diisi';
            }
            if ($nidn !== '' && isset($seenNidn[$nidn])) {
                $issues[] = 'NIDN duplikat di file';
            }
            if ($nip !== '' && isset($seenNip[$nip])) {
                $issues[] = 'NIP duplikat di file';
            }

            if ($nidn !== '' && isset($existingNidnLookup[$nidn])) {
                $issues[] = 'NIDN sudah ada di database';
            }
            if ($nip !== '' && isset($existingNipLookup[$nip])) {
                $issues[] = 'NIP sudah ada di database';
            }

            if ($nidn !== '') {
                $seenNidn[$nidn] = true;
            }
            if ($nip !== '') {
                $seenNip[$nip] = true;
            }

            return [
                'row_number' => $rowNumber,
                'nidn' => $nidn,
                'nip' => $nip,
                'nama' => $nama,
                'email' => $email,
                'phone' => $phone,
                'status_dosen' => $statusDosen,
                'issues' => $issues,
                'can_import' => empty($issues),
                'result' => empty($issues) ? 'ready' : 'blocked',
                'result_label' => empty($issues) ? 'Siap' : 'Perlu Perbaikan',
            ];
        })->values()->all();
    }

    private function buildSummary(array $rows): array
    {
        return [
            'total' => count($rows),
            'ready' => collect($rows)->where('can_import', true)->count(),
            'blocked' => collect($rows)->where('can_import', false)->count(),
        ];
    }

    private function sessionKey(string $token): string
    {
        return 'dosen_import_preview_'.$token;
    }
}

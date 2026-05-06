<?php

namespace App\Http\Controllers;

use App\Exports\MahasiswaTemplateExport;
use App\Imports\MahasiswaPreviewImport;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class MahasiswaImportController extends Controller
{
    public function template()
    {
        return Excel::download(new MahasiswaTemplateExport(), 'Template-Import-Mahasiswa.xlsx');
    }

    public function preview(Request $request)
    {
        if ($request->isMethod('get')) {
            return redirect()->route('mahasiswa.index');
        }

        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new MahasiswaPreviewImport();
        Excel::import($import, $data['file']);

        $rows = $this->normalizeRows($import->rows);
        $token = (string) Str::uuid();

        session()->put($this->sessionKey($token), $rows);

        return response()->json([
            'previewRows' => $rows,
            'previewToken' => $token,
            'importSummary' => $this->buildSummary($rows),
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
            return response()->json(['message' => 'Preview import sudah kedaluwarsa. Upload ulang file Excel.'], 422);
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
                Mahasiswa::query()->create([
                    'user_id' => null,
                    'prodi_id' => $row['prodi_id'],
                    'nim' => $row['nim'],
                    'nisn' => $row['nisn'] ?: null,
                    'nama' => $row['nama'],
                    'email' => $row['email'] ?: null,
                    'phone' => $row['phone'] ?: null,
                    'jenis_kelamin' => $row['jenis_kelamin'],
                    'tanggal_lahir' => $row['tanggal_lahir'] ?: null,
                    'tempat_lahir' => $row['tempat_lahir'] ?: null,
                    'alamat' => $row['alamat'] ?: null,
                    'angkatan' => $row['angkatan'],
                    'status_mahasiswa' => $row['status_mahasiswa'],
                ]);

                $row['result'] = 'success';
                $row['result_label'] = 'Berhasil';
                $summary['created']++;
            } catch (Throwable) {
                $row['result'] = 'failed';
                $row['result_label'] = 'Gagal';
                $row['issues'][] = 'Gagal menyimpan ke database';
                $summary['failed']++;
            }

            $updatedRows[] = $row;
        }

        session()->put($this->sessionKey($data['preview_token']), $updatedRows);

        return response()->json([
            'previewRows' => $updatedRows,
            'previewToken' => $data['preview_token'],
            'importSummary' => $summary,
            'success' => true,
        ]);
    }

    public function updatePreview(Request $request)
    {
        $data = $request->validate([
            'preview_token' => ['required', 'string'],
            'row_number' => ['required', 'integer', 'min:1'],
            'prodi_kode' => ['required', 'string', 'max:50'],
        ]);

        $rows = session()->get($this->sessionKey($data['preview_token']));
        if (! is_array($rows)) {
            return response()->json(['message' => 'Preview import sudah kedaluwarsa. Upload ulang file Excel.'], 422);
        }

        $rowNumber = (int) $data['row_number'];
        $prodiKode = trim((string) $data['prodi_kode']);

        $prodiId = Prodi::query()->where('kode', $prodiKode)->value('id');
        $updated = false;

        foreach ($rows as $index => $row) {
            if ((int) ($row['row_number'] ?? 0) !== $rowNumber) {
                continue;
            }

            $row['prodi_kode'] = $prodiKode;
            $row['prodi_id'] = $prodiId ? (int) $prodiId : null;

            $issues = is_array($row['issues'] ?? null) ? $row['issues'] : [];
            $issues = array_values(array_filter($issues, fn ($issue) => ! in_array($issue, ['Prodi kode wajib diisi', 'Prodi kode tidak ditemukan'], true)));

            if ($prodiKode === '') {
                $issues[] = 'Prodi kode wajib diisi';
            } elseif (! $prodiId) {
                $issues[] = 'Prodi kode tidak ditemukan';
            }

            $row['issues'] = $issues;
            $row['can_import'] = empty($issues);
            $row['result'] = empty($issues) ? 'ready' : 'blocked';
            $row['result_label'] = empty($issues) ? 'Siap' : 'Perlu Perbaikan';

            $rows[$index] = $row;
            $updated = true;
            break;
        }

        if (! $updated) {
            return response()->json(['message' => 'Baris preview tidak ditemukan.'], 404);
        }

        session()->put($this->sessionKey($data['preview_token']), $rows);

        return response()->json([
            'previewRows' => $rows,
            'previewToken' => $data['preview_token'],
            'importSummary' => $this->buildSummary($rows),
        ]);
    }

    private function normalizeRows(array $rows): array
    {
        $seenNim = [];
        $seenNisn = [];

        $prodiCodes = collect($rows)->map(fn ($row) => trim((string) ($row['prodi_kode'] ?? '')))->filter()->unique()->values()->all();
        $prodiMap = Prodi::query()
            ->whereIn('kode', $prodiCodes)
            ->get(['id', 'kode'])
            ->keyBy('kode')
            ->map(fn ($p) => (int) $p->id)
            ->all();

        $nimValues = collect($rows)->map(fn ($row) => trim((string) ($row['nim'] ?? '')))->filter()->values()->all();
        $nisnValues = collect($rows)->map(fn ($row) => trim((string) ($row['nisn'] ?? '')))->filter()->values()->all();
        $existingNim = Mahasiswa::query()->whereIn('nim', $nimValues)->pluck('nim')->all();
        $existingNisn = $nisnValues
            ? Mahasiswa::query()->whereIn('nisn', $nisnValues)->pluck('nisn')->filter()->all()
            : [];

        $existingNimLookup = array_flip($existingNim);
        $existingNisnLookup = array_flip($existingNisn);

        $allowedStatus = ['aktif', 'cuti', 'lulus', 'dropout', 'nonaktif'];

        return collect($rows)->map(function (array $row, int $index) use (&$seenNim, &$seenNisn, $prodiMap, $existingNimLookup, $existingNisnLookup, $allowedStatus) {
            $rowNumber = (int) ($row['row_number'] ?? $index + 2);
            $prodiKode = trim((string) ($row['prodi_kode'] ?? ''));
            $nim = trim((string) ($row['nim'] ?? ''));
            $nisn = trim((string) ($row['nisn'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $email = trim((string) ($row['email'] ?? ''));
            $phone = trim((string) ($row['phone'] ?? ''));
            $jenisKelamin = strtoupper(trim((string) ($row['jenis_kelamin'] ?? '')));
            $tanggalLahir = trim((string) ($row['tanggal_lahir'] ?? ''));
            $tempatLahir = trim((string) ($row['tempat_lahir'] ?? ''));
            $alamat = trim((string) ($row['alamat'] ?? ''));
            $angkatan = trim((string) ($row['angkatan'] ?? ''));
            $status = trim((string) ($row['status_mahasiswa'] ?? 'aktif'));

            if (! in_array($jenisKelamin, ['L', 'P'], true)) {
                $jenisKelamin = '';
            }

            if (! in_array($status, $allowedStatus, true)) {
                $status = 'aktif';
            }

            $issues = [];
            $prodiId = $prodiKode !== '' ? ($prodiMap[$prodiKode] ?? null) : null;

            if ($prodiKode === '') {
                $issues[] = 'Prodi kode wajib diisi';
            } elseif (! $prodiId) {
                $issues[] = 'Prodi kode tidak ditemukan';
            }

            if ($nim === '') {
                $issues[] = 'NIM wajib diisi';
            }
            if ($nama === '') {
                $issues[] = 'Nama wajib diisi';
            }
            if ($jenisKelamin === '') {
                $issues[] = 'Jenis kelamin wajib L atau P';
            }
            if ($angkatan === '') {
                $issues[] = 'Angkatan wajib diisi';
            }

            if ($nim !== '' && isset($seenNim[$nim])) {
                $issues[] = 'NIM duplikat di file';
            }
            if ($nisn !== '' && isset($seenNisn[$nisn])) {
                $issues[] = 'NISN duplikat di file';
            }

            if ($nim !== '' && isset($existingNimLookup[$nim])) {
                $issues[] = 'NIM sudah ada di database';
            }
            if ($nisn !== '' && isset($existingNisnLookup[$nisn])) {
                $issues[] = 'NISN sudah ada di database';
            }

            if ($nim !== '') {
                $seenNim[$nim] = true;
            }
            if ($nisn !== '') {
                $seenNisn[$nisn] = true;
            }

            return [
                'row_number' => $rowNumber,
                'prodi_kode' => $prodiKode,
                'prodi_id' => $prodiId,
                'nim' => $nim,
                'nisn' => $nisn,
                'nama' => $nama,
                'email' => $email,
                'phone' => $phone,
                'jenis_kelamin' => $jenisKelamin,
                'tanggal_lahir' => $tanggalLahir,
                'tempat_lahir' => $tempatLahir,
                'alamat' => $alamat,
                'angkatan' => $angkatan,
                'status_mahasiswa' => $status,
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
        return 'mahasiswa_import_preview_'.$token;
    }
}

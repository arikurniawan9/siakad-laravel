<?php

namespace App\Services;

use App\Models\Mahasiswa;
use App\Models\Tagihan;
use App\Models\TagihanItem;
use App\Models\TarifKeuangan;
use App\Notifications\TagihanIssued;
use App\Support\Audit;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TagihanService
{
    /**
     * Recalculate total for a single tagihan based on its nominal, potongan, and denda.
     */
    public function recalculateTotal(Tagihan $tagihan): float
    {
        return (float) ($tagihan->nominal - $tagihan->potongan + $tagihan->denda);
    }

    /**
     * Generate tagihans in bulk for a group of students.
     * 
     * @param array $params [prodi_id, angkatan, tahun_akademik, semester_akademik, tarif_ids, jatuh_tempo]
     * @return array [success_count, skipped_count]
     */
    public function bulkGenerate(array $params): array
    {
        $prodiId = $params['prodi_id'] ?? null;
        $angkatan = $params['angkatan'] ?? null;
        $tahunAkademik = $params['tahun_akademik'];
        $semesterAkademik = $params['semester_akademik'];
        $tarifIds = $params['tarif_ids'] ?? [];
        $jatuhTempo = $params['jatuh_tempo'] ?? null;

        // 1. Load Tariffs
        $tarifs = TarifKeuangan::query()
            ->with('jenisTagihan')
            ->whereIn('id', $tarifIds)
            ->get();

        if ($tarifs->isEmpty()) {
            return ['success' => 0, 'skipped' => 0];
        }

        // 2. Load Students
        $students = Mahasiswa::query()
            ->when($prodiId, fn($q) => $q->where('prodi_id', $prodiId))
            ->when($angkatan, fn($q) => $q->where('angkatan', $angkatan))
            ->where('status_mahasiswa', 'aktif')
            ->with('user')
            ->get();

        $successCount = 0;
        $skippedCount = 0;

        foreach ($students as $student) {
            $result = DB::transaction(function () use ($student, $tarifs, $tahunAkademik, $semesterAkademik, $jatuhTempo) {
                // Check if identical tagihan already exists to prevent duplicates
                // Definition of duplicate: same student, same period, same set of tariffs (simplified: same period + type)
                // For bulk, we usually group multiple items into one Tagihan.
                
                $existing = Tagihan::query()
                    ->where('mahasiswa_id', $student->id)
                    ->where('tahun_akademik', $tahunAkademik)
                    ->where('semester_akademik', $semesterAkademik)
                    ->whereIn('jenis', $tarifs->pluck('jenisTagihan.kode'))
                    ->exists();

                if ($existing) {
                    return false;
                }

                $sumNominal = (float) $tarifs->sum('nominal');
                $sumTotal = $sumNominal; // No default discounts in bulk yet
                
                $tagihan = Tagihan::create([
                    'mahasiswa_id' => $student->id,
                    'kode_tagihan' => 'INV-' . now()->format('ymdHis') . '-' . strtoupper(Str::random(4)),
                    'jenis' => $tarifs->count() === 1 ? $tarifs->first()->jenisTagihan->kode : 'MULTI',
                    'tahun_akademik' => $tahunAkademik,
                    'semester_akademik' => $semesterAkademik,
                    'nominal' => $sumNominal,
                    'potongan' => 0,
                    'denda' => 0,
                    'total' => max($sumTotal, 0),
                    'jatuh_tempo' => $jatuhTempo,
                    'status' => 'pending',
                    'keterangan' => 'Generated via Bulk System',
                ]);

                foreach ($tarifs as $idx => $tarif) {
                    TagihanItem::create([
                        'tagihan_id' => $tagihan->id,
                        'jenis_tagihan_id' => $tarif->jenis_tagihan_id,
                        'kode' => $tarif->jenisTagihan->kode,
                        'nama' => $tarif->jenisTagihan->nama,
                        'nominal' => (float) $tarif->nominal,
                        'potongan' => 0,
                        'denda' => 0,
                        'total' => (float) $tarif->nominal,
                        'sort_order' => $idx,
                    ]);
                }

                if ($student->user) {
                    $student->user->notify(new TagihanIssued(
                        $tagihan->kode_tagihan,
                        $tagihan->jenis,
                        $student->nama,
                        (float) $tagihan->total
                    ));
                }

                return true;
            });

            if ($result) {
                $successCount++;
            } else {
                $skippedCount++;
            }
        }

        Audit::log(
            source: 'finance',
            action: 'tagihan.bulk_generate',
            entityType: 'tagihan',
            message: "Bulk generate tagihan completed: {$successCount} created, {$skippedCount} skipped.",
            meta: $params
        );

        return ['success' => $successCount, 'skipped' => $skippedCount];
    }
}

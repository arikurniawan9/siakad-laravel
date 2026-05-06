<?php

namespace App\Support;

use App\Models\FinancePeriodLock;

class FinancePeriod
{
    public static function isLocked(?string $tahunAkademik, ?int $semesterAkademik): bool
    {
        $tahunAkademik = filled($tahunAkademik) ? trim((string) $tahunAkademik) : null;
        if (! $tahunAkademik) {
            return false;
        }

        $semesterAkademik = filled($semesterAkademik) ? (int) $semesterAkademik : null;

        return FinancePeriodLock::query()
            ->where('tahun_akademik', $tahunAkademik)
            ->where(function ($q) use ($semesterAkademik) {
                if ($semesterAkademik === null) {
                    $q->whereNull('semester_akademik');
                } else {
                    $q->where('semester_akademik', $semesterAkademik);
                }
            })
            ->exists();
    }
}


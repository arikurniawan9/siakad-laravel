<?php

namespace App\Services;

use App\Models\Krs;

class KrsService
{
    public function calculateTotalSks(Krs $krs): int
    {
        return (int) $krs->details()->sum('sks');
    }
}

<?php

namespace App\Services;

use App\Models\Tagihan;

class TagihanService
{
    public function recalculateTotal(Tagihan $tagihan): float
    {
        return (float) ($tagihan->nominal - $tagihan->potongan + $tagihan->denda);
    }
}

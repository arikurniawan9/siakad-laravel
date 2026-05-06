<?php

namespace App\Services;

use App\Models\Pmb;

class PmbService
{
    public function generateNomorPendaftaran(): string
    {
        $date = now()->format('Ymd');
        $last = (int) Pmb::query()->whereDate('created_at', now()->toDateString())->count();

        return sprintf('PMB-%s-%04d', $date, $last + 1);
    }
}

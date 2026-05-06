<?php

namespace App\Console\Commands;

use App\Models\DatabaseMaintenanceLog;
use App\Services\DatabaseMaintenanceService;
use Illuminate\Console\Command;

class PurgeBackupsCommand extends Command
{
    protected $signature = 'db:purge-backups {--days=30 : Hapus backup lebih tua dari N hari}';

    protected $description = 'Purge backup SQL lama di storage/app/backups';

    public function handle(DatabaseMaintenanceService $service): int
    {
        $days = max(1, (int) $this->option('days'));
        try {
            $deleted = $service->purgeOldBackups($days);
            DatabaseMaintenanceLog::query()->create([
                'user_id' => null,
                'action' => 'purge-backup-scheduled',
                'status' => 'success',
                'filename' => null,
                'ip_address' => null,
                'message' => "Purge terjadwal berhasil. Terhapus {$deleted} file. Retensi {$days} hari.",
                'executed_at' => now(),
            ]);

            $this->info("Purge selesai. Terhapus {$deleted} file backup (lebih tua dari {$days} hari).");
        } catch (\Throwable $exception) {
            DatabaseMaintenanceLog::query()->create([
                'user_id' => null,
                'action' => 'purge-backup-scheduled',
                'status' => 'failed',
                'filename' => null,
                'ip_address' => null,
                'message' => $exception->getMessage(),
                'executed_at' => now(),
            ]);

            $this->error('Purge gagal: '.$exception->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}

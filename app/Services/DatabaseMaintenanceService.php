<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class DatabaseMaintenanceService
{
    public function backup(): array
    {
        $this->ensureMysqlConnection();

        $filename = 'db-backup-'.now()->format('Ymd-His').'.sql';
        $relativePath = 'backups/'.$filename;

        $sql = $this->buildSqlDump();
        Storage::disk('local')->put($relativePath, $sql);

        return [
            'path' => storage_path('app/'.$relativePath),
            'relative_path' => $relativePath,
            'filename' => $filename,
        ];
    }

    public function restore(UploadedFile $file): void
    {
        $this->ensureMysqlConnection();

        $sql = (string) file_get_contents($file->getRealPath());
        if (trim($sql) === '') {
            throw new RuntimeException('File backup kosong.');
        }

        DB::beginTransaction();

        try {
            DB::unprepared('SET FOREIGN_KEY_CHECKS=0');

            foreach ($this->splitSqlStatements($sql) as $statement) {
                DB::unprepared($statement);
            }

            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();

            throw $exception;
        } finally {
            DB::unprepared('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    public function resetExceptSuperAdmin(): void
    {
        $this->ensureMysqlConnection();

        $superAdminRoleId = DB::table('roles')->where('name', 'super-admin')->value('id');
        if (! $superAdminRoleId) {
            throw new RuntimeException('Role super-admin tidak ditemukan.');
        }

        $superAdminIds = DB::table('model_has_roles')
            ->where('role_id', $superAdminRoleId)
            ->where('model_type', 'App\\Models\\User')
            ->pluck('model_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($superAdminIds->isEmpty()) {
            throw new RuntimeException('User super-admin tidak ditemukan.');
        }

        $tables = collect(DB::select('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"'))
            ->map(fn ($row) => array_values((array) $row)[0])
            ->values();

        $protectedTables = [
            'migrations',
            'roles',
            'permissions',
            'role_has_permissions',
            'model_has_permissions',
            'model_has_roles',
            'users',
        ];

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            DB::transaction(function () use ($tables, $protectedTables, $superAdminIds, $superAdminRoleId) {
                foreach ($tables as $table) {
                    if (in_array($table, $protectedTables, true)) {
                        continue;
                    }

                    DB::statement('TRUNCATE TABLE `'.$table.'`');
                }

                DB::table('model_has_permissions')->delete();

                DB::table('model_has_roles')
                    ->where('model_type', '!=', 'App\\Models\\User')
                    ->delete();

                DB::table('model_has_roles')
                    ->where('model_type', 'App\\Models\\User')
                    ->whereNotIn('model_id', $superAdminIds)
                    ->delete();

                DB::table('model_has_roles')
                    ->where('model_type', 'App\\Models\\User')
                    ->whereIn('model_id', $superAdminIds)
                    ->where('role_id', '!=', $superAdminRoleId)
                    ->delete();

                DB::table('users')
                    ->whereNotIn('id', $superAdminIds)
                    ->delete();
            });
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    public function listBackups(int $limit = 15): array
    {
        $files = Storage::disk('local')->files('backups');

        return collect($files)
            ->filter(fn ($path) => Str::endsWith(Str::lower($path), '.sql'))
            ->map(function ($path) {
                return [
                    'filename' => basename($path),
                    'relative_path' => $path,
                    'size' => Storage::disk('local')->size($path),
                    'last_modified' => Storage::disk('local')->lastModified($path),
                ];
            })
            ->sortByDesc('last_modified')
            ->take($limit)
            ->values()
            ->all();
    }

    public function downloadPath(string $filename): string
    {
        $safeName = basename($filename);
        if (! Str::endsWith(Str::lower($safeName), '.sql')) {
            throw new RuntimeException('Format file backup tidak valid.');
        }

        $path = 'backups/'.$safeName;
        if (! Storage::disk('local')->exists($path)) {
            throw new RuntimeException('File backup tidak ditemukan.');
        }

        return $path;
    }

    public function deleteBackup(string $filename): void
    {
        $path = $this->downloadPath($filename);
        Storage::disk('local')->delete($path);
    }

    public function purgeOldBackups(int $olderThanDays): int
    {
        $threshold = now()->subDays($olderThanDays)->timestamp;
        $deleted = 0;

        foreach (Storage::disk('local')->files('backups') as $path) {
            if (! Str::endsWith(Str::lower($path), '.sql')) {
                continue;
            }
            if (Storage::disk('local')->lastModified($path) <= $threshold) {
                Storage::disk('local')->delete($path);
                $deleted++;
            }
        }

        return $deleted;
    }

    private function buildSqlDump(): string
    {
        $dbName = DB::connection()->getDatabaseName();
        $tables = collect(DB::select('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"'))
            ->map(fn ($row) => array_values((array) $row)[0])
            ->values();

        $lines = [];
        $lines[] = '-- SIAKAD DB Backup';
        $lines[] = '-- Generated at '.now()->toDateTimeString();
        $lines[] = 'SET FOREIGN_KEY_CHECKS=0;';
        $lines[] = 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";';
        $lines[] = 'START TRANSACTION;';
        $lines[] = '';

        foreach ($tables as $table) {
            $createRow = DB::selectOne("SHOW CREATE TABLE `{$table}`");
            $createSql = (array) $createRow;
            $createStatement = $createSql['Create Table'] ?? array_values($createSql)[1] ?? null;
            if (! $createStatement) {
                continue;
            }

            $lines[] = "--";
            $lines[] = "-- Table structure for `{$table}`";
            $lines[] = "--";
            $lines[] = "DROP TABLE IF EXISTS `{$table}`;";
            $lines[] = $createStatement.';';
            $lines[] = '';

            $rows = DB::table($table)->get();
            if ($rows->isEmpty()) {
                continue;
            }

            $lines[] = "--";
            $lines[] = "-- Dumping data for `{$table}`";
            $lines[] = "--";

            foreach ($rows as $row) {
                $rowArray = (array) $row;
                $columns = array_map(fn ($col) => "`{$col}`", array_keys($rowArray));
                $values = array_map(function ($value) {
                    if ($value === null) {
                        return 'NULL';
                    }

                    return DB::getPdo()->quote((string) $value);
                }, array_values($rowArray));

                $lines[] = "INSERT INTO `{$dbName}`.`{$table}` (".implode(', ', $columns).') VALUES ('.implode(', ', $values).');';
            }

            $lines[] = '';
        }

        $lines[] = 'COMMIT;';
        $lines[] = 'SET FOREIGN_KEY_CHECKS=1;';
        $lines[] = '';

        return implode("\n", $lines);
    }

    private function splitSqlStatements(string $sql): array
    {
        $statements = preg_split('/;\s*(\r\n|\r|\n)/', $sql) ?: [];

        return collect($statements)
            ->map(fn ($stmt) => trim($stmt))
            ->filter()
            ->values()
            ->all();
    }

    private function ensureMysqlConnection(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver !== 'mysql') {
            throw new RuntimeException('Fitur maintenance database saat ini hanya mendukung MySQL.');
        }
    }
}

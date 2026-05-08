<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class DatabaseMaintenanceService
{
    public function backup(?array $tables = null, ?string $label = null): array
    {
        $this->ensureMysqlConnection();

        $safeLabel = $label ? preg_replace('/[^A-Za-z0-9._-]+/', '-', trim($label)) : null;
        $safeLabel = $safeLabel ? trim((string) $safeLabel, '-') : null;

        $isPartial = is_array($tables) && count($tables) > 0;
        $filename = 'db-backup-'.($isPartial ? 'partial-' : '').now()->format('Ymd-His').($safeLabel ? '-'.$safeLabel : '').'.sql';
        $relativePath = 'backups/'.$filename;

        $tables = $this->normalizeTables($tables);
        $sql = $this->buildSqlDump($tables);
        Storage::disk('local')->put($relativePath, $sql);

        return [
            'path' => storage_path('app/'.$relativePath),
            'relative_path' => $relativePath,
            'filename' => $filename,
            'tables' => $tables,
        ];
    }

    public function restore(UploadedFile $file): array
    {
        $this->ensureMysqlConnection();

        $sql = (string) file_get_contents($file->getRealPath());
        if (trim($sql) === '') {
            throw new RuntimeException('File backup kosong.');
        }

        return $this->restoreSqlString($sql);
    }

    public function restoreFromStoredBackup(string $filename): array
    {
        $this->ensureMysqlConnection();

        $path = $this->downloadPath($filename);
        $sql = (string) Storage::disk('local')->get($path);
        if (trim($sql) === '') {
            throw new RuntimeException('File backup kosong.');
        }

        return $this->restoreSqlString($sql);
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

    public function listTables(): array
    {
        $this->ensureMysqlConnection();

        return $this->allBaseTables()->values()->all();
    }

    private function allBaseTables()
    {
        return collect(DB::select('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"'))
            ->map(fn ($row) => array_values((array) $row)[0])
            ->filter()
            ->values();
    }

    private function normalizeTables(?array $tables): array
    {
        $all = $this->allBaseTables();

        if (! $tables) {
            return $all->all();
        }

        $requested = collect($tables)
            ->map(fn ($t) => trim((string) $t))
            ->filter()
            ->unique()
            ->values();

        $allowed = $all->flip();

        return $requested
            ->filter(fn ($t) => $allowed->has($t))
            ->values()
            ->all();
    }

    private function buildSqlDump(array $tables): string
    {
        $dbName = DB::connection()->getDatabaseName();
        $tables = collect($tables)->values();

        $lines = [];
        $lines[] = '-- SIAKAD DB Backup';
        $lines[] = '-- Generated at '.now()->toDateTimeString();
        $lines[] = '-- Tables: '.($tables->isEmpty() ? '-' : $tables->implode(', '));
        $lines[] = 'SET FOREIGN_KEY_CHECKS=0;';
        $lines[] = 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";';
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

        $lines[] = 'SET FOREIGN_KEY_CHECKS=1;';
        $lines[] = '';

        return implode("\n", $lines);
    }

    private function splitSqlStatements(string $sql): array
    {
        $statements = preg_split('/;\s*(\r\n|\r|\n)/', $sql) ?: [];

        return collect($statements)
            ->map(fn ($stmt) => trim($stmt))
            ->filter(function (string $stmt) {
                $upper = strtoupper($stmt);

                // Restores should not depend on transaction statements embedded in the dump.
                if (in_array($upper, ['START TRANSACTION', 'COMMIT', 'ROLLBACK'], true)) {
                    return false;
                }

                // We explicitly manage FOREIGN_KEY_CHECKS in code.
                if (str_starts_with($upper, 'SET FOREIGN_KEY_CHECKS=')) {
                    return false;
                }

                return true;
            })
            ->filter()
            ->values()
            ->all();
    }

    private function restoreSqlString(string $sql): array
    {
        $startedAt = microtime(true);
        $executed = 0;

        try {
            DB::unprepared('SET FOREIGN_KEY_CHECKS=0');

            foreach ($this->splitSqlStatements($sql) as $statement) {
                DB::unprepared($statement);
                $executed++;
            }
        } finally {
            DB::unprepared('SET FOREIGN_KEY_CHECKS=1');
        }

        return [
            'statements' => $executed,
            'elapsed_ms' => (int) round((microtime(true) - $startedAt) * 1000),
        ];
    }

    private function ensureMysqlConnection(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver !== 'mysql') {
            throw new RuntimeException('Fitur maintenance database saat ini hanya mendukung MySQL.');
        }
    }
}

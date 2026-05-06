<?php

namespace App\Support;

use App\Models\AuditLog;

class Audit
{
    public static function log(
        string $source,
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        ?string $message = null,
        array $meta = [],
        ?int $userId = null,
        ?string $ipAddress = null,
    ): void {
        AuditLog::query()->create([
            'source' => $source,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'user_id' => $userId ?? auth()->id(),
            'ip_address' => $ipAddress ?? request()?->ip(),
            'message' => $message,
            'meta' => $meta ?: null,
            'created_at' => now(),
        ]);
    }
}


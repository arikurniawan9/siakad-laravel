<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class SensitiveActionConfirmation
{
    public const RESET_DATABASE = 'RESET DATABASE';
    public const RESTORE_DATABASE = 'RESTORE DATABASE';
    public const PURGE_BACKUP = 'PURGE BACKUP';
    public const DELETE_BACKUP = 'DELETE BACKUP';

    public static function assert(string $input, string $expected): void
    {
        if (trim($input) === $expected) {
            return;
        }

        throw ValidationException::withMessages([
            'confirmation' => 'Ketik tepat: '.$expected,
        ]);
    }
}

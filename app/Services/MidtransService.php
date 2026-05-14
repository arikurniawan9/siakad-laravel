<?php

namespace App\Services;

use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct(private readonly PaymentGatewayConfigService $gatewayConfigService)
    {
        $midtrans = $this->gatewayConfigService->midtrans();
        Config::$serverKey = (string) $midtrans['server_key'];
        Config::$clientKey = (string) $midtrans['client_key'];
        Config::$isProduction = (bool) ($midtrans['is_production'] ?? false);
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    public function createSnapToken(array $payload): string
    {
        return Snap::getSnapToken($payload);
    }

    public function isValidSignature(array $payload): bool
    {
        $signature = $payload['signature_key'] ?? '';
        $orderId = $payload['order_id'] ?? '';
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';

        $expected = hash('sha512', $orderId.$statusCode.$grossAmount.$this->gatewayConfigService->midtrans()['server_key']);

        return hash_equals($expected, $signature);
    }

    public function hasModeKeyMismatch(): bool
    {
        return $this->modeKeyMismatchReason() !== null;
    }

    public function modeKeyMismatchReason(): ?string
    {
        $midtrans = $this->gatewayConfigService->midtrans();
        $isProduction = (bool) ($midtrans['is_production'] ?? false);
        $serverKey = trim((string) ($midtrans['server_key'] ?? ''));
        $clientKey = trim((string) ($midtrans['client_key'] ?? ''));

        $serverIsSandbox = str_starts_with($serverKey, 'SB-');
        $clientIsSandbox = str_starts_with($clientKey, 'SB-');
        $serverLooksLikeServerKey = str_contains(strtolower($serverKey), 'server');
        $clientLooksLikeClientKey = str_contains(strtolower($clientKey), 'client');

        if (! $serverLooksLikeServerKey || ! $clientLooksLikeClientKey) {
            return 'Format key Midtrans tidak valid atau tertukar. Gunakan Server Key (Mid-server / SB-Mid-server) dan Client Key (Mid-client / SB-Mid-client).';
        }

        if ($isProduction) {
            return ($serverIsSandbox || $clientIsSandbox)
                ? 'Mode Midtrans production aktif, gunakan key production (Mid-server / Mid-client).'
                : null;
        }

        return (! $serverIsSandbox || ! $clientIsSandbox)
            ? 'Mode Midtrans sandbox aktif, gunakan key sandbox (SB-Mid-server / SB-Mid-client).'
            : null;
    }
}

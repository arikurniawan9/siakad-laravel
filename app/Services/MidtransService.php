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
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class DuitkuService
{
    public function __construct(
        private readonly PaymentGatewayConfigService $gatewayConfigService,
    ) {
    }

    public function createInvoice(array $payload): array
    {
        $config = $this->gatewayConfigService->duitku();
        $merchantCode = (string) ($config['merchant_code'] ?? '');
        $apiKey = (string) ($config['api_key'] ?? '');
        if ($merchantCode === '' || $apiKey === '') {
            throw new RuntimeException('Konfigurasi Duitku belum lengkap.');
        }

        $isProduction = (bool) ($this->gatewayConfigService->getConfig()['is_production'] ?? false);
        $endpoint = $isProduction
            ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry'
            : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry';

        $response = Http::acceptJson()->post($endpoint, $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Gagal membuat invoice Duitku: '.$response->body());
        }

        $json = $response->json();
        $paymentUrl = (string) ($json['paymentUrl'] ?? '');
        if ($paymentUrl === '') {
            throw new RuntimeException('Invoice Duitku tidak mengembalikan payment URL.');
        }

        return [
            'reference' => (string) ($json['reference'] ?? ''),
            'payment_url' => $paymentUrl,
            'raw' => $json,
        ];
    }
}


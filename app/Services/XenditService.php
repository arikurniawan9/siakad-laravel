<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class XenditService
{
    public function __construct(
        private readonly PaymentGatewayConfigService $gatewayConfigService,
    ) {
    }

    public function createInvoice(array $payload): array
    {
        $config = $this->gatewayConfigService->xendit();
        $secretKey = (string) ($config['secret_key'] ?? '');
        if ($secretKey === '') {
            throw new RuntimeException('Konfigurasi Xendit belum lengkap.');
        }

        $response = Http::withBasicAuth($secretKey, '')
            ->acceptJson()
            ->post('https://api.xendit.co/v2/invoices', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Gagal membuat invoice Xendit: '.$response->body());
        }

        $json = $response->json();

        return [
            'id' => (string) ($json['id'] ?? ''),
            'invoice_url' => (string) ($json['invoice_url'] ?? ''),
            'status' => (string) ($json['status'] ?? 'PENDING'),
            'raw' => $json,
        ];
    }
}


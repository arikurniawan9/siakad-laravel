<?php

namespace App\Services;

use App\Models\AppSetting;

class PaymentGatewayConfigService
{
    public function getConfig(): array
    {
        $stored = AppSetting::query()->where('key', 'payment_gateway')->first();
        $value = is_array($stored?->value) ? $stored->value : [];

        return [
            'active_provider' => (string) ($value['active_provider'] ?? 'midtrans'),
            'is_production' => (bool) ($value['is_production'] ?? (bool) config('services.midtrans.is_production', false)),
            'midtrans' => [
                'server_key' => (string) ($value['midtrans']['server_key'] ?? config('services.midtrans.server_key', '')),
                'client_key' => (string) ($value['midtrans']['client_key'] ?? config('services.midtrans.client_key', '')),
            ],
            'xendit' => [
                'secret_key' => (string) ($value['xendit']['secret_key'] ?? ''),
                'public_key' => (string) ($value['xendit']['public_key'] ?? ''),
                'callback_token' => (string) ($value['xendit']['callback_token'] ?? ''),
            ],
            'duitku' => [
                'merchant_code' => (string) ($value['duitku']['merchant_code'] ?? ''),
                'api_key' => (string) ($value['duitku']['api_key'] ?? ''),
            ],
        ];
    }

    public function activeProvider(): string
    {
        $provider = (string) ($this->getConfig()['active_provider'] ?? 'midtrans');

        return in_array($provider, ['midtrans', 'xendit', 'duitku', 'manual'], true)
            ? $provider
            : 'midtrans';
    }

    public function midtrans(): array
    {
        $config = $this->getConfig();

        return [
            'server_key' => (string) ($config['midtrans']['server_key'] ?? ''),
            'client_key' => (string) ($config['midtrans']['client_key'] ?? ''),
            'is_production' => (bool) ($config['is_production'] ?? false),
        ];
    }

    public function isMidtransReady(): bool
    {
        $midtrans = $this->midtrans();

        return $midtrans['server_key'] !== '' && $midtrans['client_key'] !== '';
    }

    public function xendit(): array
    {
        $config = $this->getConfig();

        return [
            'secret_key' => (string) ($config['xendit']['secret_key'] ?? ''),
            'public_key' => (string) ($config['xendit']['public_key'] ?? ''),
            'callback_token' => (string) ($config['xendit']['callback_token'] ?? ''),
        ];
    }

    public function duitku(): array
    {
        $config = $this->getConfig();

        return [
            'merchant_code' => (string) ($config['duitku']['merchant_code'] ?? ''),
            'api_key' => (string) ($config['duitku']['api_key'] ?? ''),
        ];
    }
}

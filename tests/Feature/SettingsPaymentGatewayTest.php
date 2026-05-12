<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SettingsPaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsSuperAdmin(): User
    {
        Role::findOrCreate('super-admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super-admin');
        $this->actingAs($user);

        return $user;
    }

    public function test_cannot_activate_xendit_when_config_is_incomplete(): void
    {
        $this->actingAsSuperAdmin();

        $this->put(route('settings.payment-gateway.update'), [
            'active_provider' => 'xendit',
            'xendit_secret_key' => 'xnd_dev_secret',
            'xendit_callback_token' => '',
        ])->assertSessionHasErrors('active_provider');
    }

    public function test_can_activate_xendit_when_config_is_complete(): void
    {
        $this->actingAsSuperAdmin();

        $this->put(route('settings.payment-gateway.update'), [
            'active_provider' => 'xendit',
            'xendit_secret_key' => 'xnd_dev_secret',
            'xendit_callback_token' => 'xnd_cb_token',
        ])->assertSessionHasNoErrors();

        $setting = AppSetting::query()->where('key', 'payment_gateway')->firstOrFail();
        $this->assertSame('xendit', $setting->value['active_provider'] ?? null);
    }

    public function test_cannot_activate_midtrans_when_config_is_incomplete(): void
    {
        $this->actingAsSuperAdmin();

        $this->put(route('settings.payment-gateway.update'), [
            'active_provider' => 'midtrans',
            'midtrans_server_key' => 'SB-MID-123',
            'midtrans_client_key' => '',
        ])->assertSessionHasErrors('active_provider');
    }

    public function test_cannot_activate_duitku_when_config_is_incomplete(): void
    {
        $this->actingAsSuperAdmin();

        $this->put(route('settings.payment-gateway.update'), [
            'active_provider' => 'duitku',
            'duitku_merchant_code' => 'DTEST01',
            'duitku_api_key' => '',
        ])->assertSessionHasErrors('active_provider');
    }
}

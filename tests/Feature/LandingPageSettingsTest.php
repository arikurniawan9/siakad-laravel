<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LandingPageSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsRole(string $role): User
    {
        Role::findOrCreate($role, 'web');
        $user = User::factory()->create();
        $user->assignRole($role);
        $this->actingAs($user);

        return $user;
    }

    public function test_admin_can_update_landing_page_content(): void
    {
        $this->actingAsRole('admin');

        $payload = [
            'campus_name' => 'Kampus Uji',
            'tagline' => 'Tagline Uji',
            'hero_title' => 'Hero Uji',
            'hero_subtitle' => 'Deskripsi hero uji.',
            'hero_image_url' => 'https://example.com/logo.png',
            'about_title' => 'Tentang Uji',
            'about_body' => 'Isi tentang kampus uji.',
            'address' => 'Jl. Test',
            'email' => 'info@example.com',
            'phone' => '021999',
            'whatsapp' => '628123',
            'cta_primary_label' => 'Daftar',
            'cta_primary_url' => 'https://example.com/daftar',
            'cta_secondary_label' => 'Masuk',
            'cta_secondary_url' => 'https://example.com/login',
            'stats' => [
                ['label' => 'A', 'value' => '1'],
                ['label' => 'B', 'value' => '2'],
                ['label' => 'C', 'value' => '3'],
            ],
            'programs' => ['PAI', 'MPI', 'ES'],
            'highlights' => [
                ['title' => 'H1', 'description' => 'D1'],
                ['title' => 'H2', 'description' => 'D2'],
                ['title' => 'H3', 'description' => 'D3'],
            ],
            'colors' => ['primary' => '#0f766e', 'accent' => '#f59e0b'],
            'socials' => ['instagram' => '', 'youtube' => '', 'facebook' => ''],
        ];

        $this->put(route('settings.landing-page.update'), $payload)
            ->assertSessionHasNoErrors();

        $setting = AppSetting::query()->where('key', 'landing_page')->firstOrFail();
        $this->assertSame('Kampus Uji', $setting->value['campus_name'] ?? null);
    }

    public function test_operator_cannot_access_landing_page_settings(): void
    {
        $this->actingAsRole('operator');

        $this->get(route('settings.landing-page.index'))->assertForbidden();
    }
}


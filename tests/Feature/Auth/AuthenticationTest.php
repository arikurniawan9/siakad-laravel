<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Providers\RouteServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();
        $captcha = 'ABC123';

        $response = $this
            ->withSession(['login_captcha' => [
                'challenge_id' => 'test-challenge',
                'question' => $captcha,
                'answer_hash' => hash('sha256', $captcha),
                'issued_at' => now()->timestamp,
            ]])
            ->post('/login', [
                'email' => $user->email,
                'password' => 'password',
                'captcha' => $captcha,
            ]);

        $this->assertAuthenticated();
        $response->assertRedirect(RouteServiceProvider::HOME);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this
            ->withSession(['login_captcha' => [
                'challenge_id' => 'test-challenge',
                'question' => 'ABC123',
                'answer_hash' => hash('sha256', 'ABC123'),
                'issued_at' => now()->timestamp,
            ]])
            ->post('/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
                'captcha' => 'ABC123',
            ]);

        $this->assertGuest();
    }

    public function test_users_can_not_authenticate_without_captcha(): void
    {
        $user = User::factory()->create();

        $response = $this->withSession(['login_captcha' => [
            'challenge_id' => 'test-challenge',
            'question' => 'ABC123',
            'answer_hash' => hash('sha256', 'ABC123'),
            'issued_at' => now()->timestamp,
        ]])->post('/login', [
            'email' => $user->email,
            'password' => 'password',
            'captcha' => '',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('captcha');
    }

    public function test_inactive_users_can_not_authenticate_even_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'is_active' => false,
        ]);
        $captcha = 'ABC123';

        $response = $this
            ->withSession(['login_captcha' => [
                'challenge_id' => 'test-challenge',
                'question' => $captcha,
                'answer_hash' => hash('sha256', $captcha),
                'issued_at' => now()->timestamp,
            ]])
            ->post('/login', [
                'email' => $user->email,
                'password' => 'password',
                'captcha' => $captcha,
            ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');
    }

    public function test_users_with_granular_menu_permissions_are_redirected_to_first_allowed_menu(): void
    {
        Role::findOrCreate('baak', 'web');
        Permission::findOrCreate('menu.dosen.index', 'web');

        $user = User::factory()->create();
        $user->assignRole('baak');
        $user->givePermissionTo('menu.dosen.index');

        $captcha = 'ABC123';

        $response = $this
            ->withSession(['login_captcha' => [
                'challenge_id' => 'test-challenge',
                'question' => $captcha,
                'answer_hash' => hash('sha256', $captcha),
                'issued_at' => now()->timestamp,
            ]])
            ->post('/login', [
                'email' => $user->email,
                'password' => 'password',
                'captcha' => $captcha,
            ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dosen.index'));
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Providers\RouteServiceProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        if (
            request()->boolean('refresh_captcha')
            || ! session()->has('login_captcha')
        ) {
            session(['login_captcha' => $this->generateCaptcha()]);
        }

        $captcha = session('login_captcha');

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'captchaQuestion' => $captcha['question'] ?? null,
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = $request->user();
        $redirectPath = $this->resolveRedirectPath($user);

        if ($redirectPath !== null) {
            return redirect()->to($redirectPath);
        }

        return redirect()->intended(RouteServiceProvider::HOME);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function generateCaptcha(): array
    {
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $answer = '';

        for ($i = 0; $i < 6; $i++) {
            $answer .= $characters[random_int(0, strlen($characters) - 1)];
        }

        return [
            'challenge_id' => (string) Str::uuid(),
            'question' => $answer,
            'answer_hash' => hash('sha256', strtoupper($answer)),
            'issued_at' => now()->timestamp,
        ];
    }

    private function resolveRedirectPath(?Authenticatable $user): ?string
    {
        if (! $user || ! method_exists($user, 'getRoleNames')) {
            return null;
        }

        $role = $user->getRoleNames()->first();

        if (! $role) {
            return null;
        }

        $defaultRoutes = [
            'super-admin' => 'dashboard',
            'admin' => 'dashboard',
            'operator' => 'dashboard',
            'bendahara' => 'keuangan.index',
            'staff' => 'dashboard',
            'baak' => 'akademik.index',
            'dosen' => 'dosen.jadwal',
            'mahasiswa' => 'mahasiswa.krs',
            'keuangan' => 'keuangan.index',
            'calon-mahasiswa' => 'pmb.index',
        ];

        $defaultRoute = $defaultRoutes[$role] ?? null;
        if ($defaultRoute === null) {
            return null;
        }

        if (method_exists($user, 'hasRole') && $user->hasRole('super-admin')) {
            return route($defaultRoute);
        }

        $permissions = method_exists($user, 'getAllPermissions')
            ? $user->getAllPermissions()->pluck('name')
            : collect();

        $hasScopedMenuPermission = $permissions->contains(fn ($name) => str_starts_with((string) $name, 'menu.'));

        if (! $hasScopedMenuPermission) {
            return route($defaultRoute);
        }

        $roleMenu = collect(config("menu.{$role}", []));
        $firstAllowedRoute = $roleMenu
            ->flatMap(fn ($group) => collect($group['items'] ?? []))
            ->map(fn ($item) => $item['route'] ?? null)
            ->filter()
            ->first(fn ($routeName) => $user->can('menu.'.$routeName));

        return $firstAllowedRoute ? route($firstAllowedRoute) : route($defaultRoute);
    }
}

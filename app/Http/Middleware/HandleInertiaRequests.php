<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->getRoleNames() ?? [],
            ],
            'menu' => function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return [];
                }

                $role = $user->getRoleNames()->first();
                $roleMenu = config("menu.{$role}", []);
                if (! $roleMenu) {
                    return [];
                }

                if ($user->hasRole('super-admin')) {
                    return $roleMenu;
                }

                $allPermissions = $user->getAllPermissions()->pluck('name');
                $hasScopedMenuPermission = $allPermissions->contains(fn ($name) => str_starts_with((string) $name, 'menu.'));

                if (! $hasScopedMenuPermission) {
                    return $roleMenu;
                }

                return collect($roleMenu)->map(function ($group) use ($user) {
                    $items = collect($group['items'] ?? [])
                        ->filter(fn ($item) => $user->can('menu.'.$item['route']))
                        ->values()
                        ->all();

                    return [
                        ...$group,
                        'items' => $items,
                    ];
                })->filter(fn ($group) => ! empty($group['items']))->values()->all();
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
                'landing_uploaded_image_url' => fn () => $request->session()->get('landing_uploaded_image_url'),
                'key' => fn () => (string) now()->format('Uu'),
            ],
            'notifications' => [
                'unreadCount' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
                'latestUnread' => fn () => $request->user()?->unreadNotifications()->latest()->limit(6)->get() ?? [],
            ],
        ];
    }
}

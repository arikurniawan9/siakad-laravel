<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActionPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        if ($user->hasRole('super-admin')) {
            return $next($request);
        }

        $scopedPermissions = collect(config('access_control.menu_permissions', []))
            ->keys()
            ->merge(collect(config('access_control.action_permissions', []))->keys());

        $userPermissions = $user->getAllPermissions()->pluck('name');
        $hasGranularAccess = $userPermissions->intersect($scopedPermissions)->isNotEmpty();

        if (! $hasGranularAccess || $user->can($permission)) {
            return $next($request);
        }

        abort(403);
    }
}

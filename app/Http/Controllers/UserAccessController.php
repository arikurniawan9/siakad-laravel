<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserAccessController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureStaffRoles();
        $this->ensurePermissionCatalog();

        $search = trim((string) $request->string('q'));
        $roleFilter = (string) $request->string('role', 'all');
        $statusFilter = (string) $request->string('status', 'all');

        $roles = Role::query()
            ->whereIn('name', $this->manageableRoles())
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::query()
            ->with(['roles:id,name', 'permissions:id,name'])
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'super-admin'))
            ->where(function ($query) {
                $query->whereDoesntHave('roles')
                    ->orWhereHas('roles', fn ($roleQuery) => $roleQuery->whereIn('name', $this->manageableRoles()));
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('identity_number', 'like', "%{$search}%");
                });
            })
            ->when(
                in_array($roleFilter, $this->manageableRoles(), true),
                fn ($query) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', $roleFilter))
            )
            ->when($statusFilter === 'active', fn ($query) => $query->where('is_active', true))
            ->when($statusFilter === 'inactive', fn ($query) => $query->where('is_active', false))
            ->orderBy('name')
            ->get();

        return Inertia::render('Modules/Settings/UserAccess', [
            'roles' => $roles,
            'permissionCatalog' => [
                'menu' => config('access_control.menu_permissions', []),
                'action' => config('access_control.action_permissions', []),
            ],
            'users' => $users->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_active' => (bool) $user->is_active,
                    'role' => $user->roles->first()?->name,
                    'permissions' => $user->permissions->pluck('name')->values(),
                ];
            })->values(),
            'filters' => [
                'q' => $search,
                'role' => in_array($roleFilter, $this->manageableRoles(), true) ? $roleFilter : 'all',
                'status' => in_array($statusFilter, ['active', 'inactive'], true) ? $statusFilter : 'all',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureStaffRoles();
        $this->ensurePermissionCatalog();

        $roles = Role::query()
            ->whereIn('name', $this->manageableRoles())
            ->pluck('name')
            ->all();

        $allowedPermissions = $this->allowedPermissions();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'identity_number' => ['nullable', 'string', 'max:50', 'unique:users,identity_number'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:'.implode(',', $roles)],
            'is_active' => ['boolean'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'in:'.implode(',', $allowedPermissions)],
        ]);

        $user = User::query()->create([
            'name' => trim((string) $validated['name']),
            'email' => trim((string) $validated['email']),
            'phone' => filled($validated['phone'] ?? null) ? trim((string) $validated['phone']) : null,
            'identity_number' => filled($validated['identity_number'] ?? null) ? trim((string) $validated['identity_number']) : null,
            'password' => $validated['password'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'email_verified_at' => now(),
        ]);

        $permissions = collect($validated['permissions'] ?? [])->unique()->values()->all();
        $user->syncRoles([$validated['role']]);
        $user->syncPermissions($permissions);

        return back()->with('success', "Akun staf {$user->name} berhasil dibuat.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->ensureStaffRoles();
        $this->ensurePermissionCatalog();

        if ($user->hasRole('super-admin')) {
            return back()->withErrors([
                'access' => 'Akun super-admin tidak dapat diubah dari halaman ini.',
            ]);
        }

        if (! $this->isManageableUser($user)) {
            return back()->withErrors([
                'access' => 'Hanya akun staf internal yang dapat diubah dari halaman ini.',
            ]);
        }

        $roles = Role::query()
            ->whereIn('name', $this->manageableRoles())
            ->pluck('name')
            ->all();

        $allowedPermissions = $this->allowedPermissions();

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:'.implode(',', $roles)],
            'is_active' => ['boolean'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'in:'.implode(',', $allowedPermissions)],
        ]);

        $permissions = collect($validated['permissions'] ?? [])->unique()->values()->all();

        $user->update([
            'is_active' => (bool) ($validated['is_active'] ?? $user->is_active),
        ]);
        $user->syncRoles([$validated['role']]);
        $user->syncPermissions($permissions);

        return back()->with('success', "Akses user {$user->name} berhasil diperbarui.");
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        if ($user->hasRole('super-admin')) {
            return back()->withErrors([
                'password_reset' => 'Password super-admin tidak dapat direset dari halaman ini.',
            ]);
        }

        if (! $this->isManageableUser($user)) {
            return back()->withErrors([
                'password_reset' => 'Hanya akun staf internal yang dapat direset dari halaman ini.',
            ]);
        }

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user->update([
            'password' => $validated['password'],
        ]);

        return back()->with('success', "Password user {$user->name} berhasil direset.");
    }

    private function ensurePermissionCatalog(): void
    {
        $permissions = collect(config('access_control.menu_permissions', []))
            ->keys()
            ->merge(collect(config('access_control.action_permissions', []))->keys())
            ->values();

        foreach ($permissions as $permissionName) {
            Permission::findOrCreate($permissionName, 'web');
        }
    }

    private function ensureStaffRoles(): void
    {
        foreach (['admin', 'operator', 'bendahara', 'staff', 'keuangan', 'baak', 'dosen', 'mahasiswa', 'calon-mahasiswa'] as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }
    }

    private function allowedPermissions(): array
    {
        return collect(config('access_control.menu_permissions', []))
            ->keys()
            ->merge(collect(config('access_control.action_permissions', []))->keys())
            ->values()
            ->all();
    }

    private function manageableRoles(): array
    {
        return ['admin', 'operator', 'bendahara', 'staff', 'keuangan', 'baak'];
    }

    private function isManageableUser(User $user): bool
    {
        $roles = $user->roles()->pluck('name');

        return $roles->isEmpty() || $roles->intersect($this->manageableRoles())->isNotEmpty();
    }
}

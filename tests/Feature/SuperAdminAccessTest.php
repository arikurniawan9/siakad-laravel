<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SuperAdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private function seedRoles(): void
    {
        foreach (['super-admin', 'admin', 'operator', 'bendahara', 'staff', 'keuangan', 'baak', 'dosen', 'mahasiswa', 'calon-mahasiswa'] as $role) {
            Role::findOrCreate($role, 'web');
        }
    }

    public function test_super_admin_can_access_core_admin_pages(): void
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $user->assignRole('super-admin');

        $this->actingAs($user)->get('/dashboard')->assertOk();
        $this->actingAs($user)->get('/akademik')->assertOk();
        $this->actingAs($user)->get('/akademik/jurusan')->assertOk();
        $this->actingAs($user)->get('/akademik/mata-kuliah')->assertOk();
        $this->actingAs($user)->get('/akademik/mata-kuliah/template')->assertOk();
        $this->actingAs($user)->get('/akademik/mata-kuliah/export')->assertOk();
        $this->actingAs($user)->get('/akademik/prodi')->assertOk();
        $this->actingAs($user)->get('/akademik/prodi/template')->assertOk();
        $this->actingAs($user)->get('/akademik/prodi/export')->assertOk();
        $this->actingAs($user)->get('/akademik/kurikulum')->assertOk();
        $this->actingAs($user)->get('/akademik/kurikulum/template')->assertOk();
        $this->actingAs($user)->get('/akademik/kurikulum/export')->assertOk();
        $this->actingAs($user)->get('/akademik/kelas')->assertOk();
        $this->actingAs($user)->get('/akademik/kelas/template')->assertOk();
        $this->actingAs($user)->get('/akademik/kelas/export')->assertOk();
        $this->actingAs($user)->get('/akademik/ruangan')->assertOk();
        $this->actingAs($user)->get('/akademik/ruangan/template')->assertOk();
        $this->actingAs($user)->get('/akademik/ruangan/export')->assertOk();
        $this->actingAs($user)->get('/akademik/jurusan/template')->assertOk();
        $this->actingAs($user)->get('/akademik/jurusan/export')->assertOk();
        $this->actingAs($user)->get('/keuangan')->assertOk();
        $this->actingAs($user)->get('/keuangan/setup-tarif')->assertOk();
        $this->actingAs($user)->get('/mahasiswa')->assertOk();
        $this->actingAs($user)->get('/dosen')->assertOk();
        $this->actingAs($user)->get('/laporan')->assertOk();
        $this->actingAs($user)->get('/settings')->assertOk();
        $this->actingAs($user)->get('/settings/database')->assertOk();
        $this->actingAs($user)->get('/settings/user-access')->assertOk();
    }

    public function test_non_admin_role_cannot_access_super_admin_only_pages(): void
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $user->assignRole('mahasiswa');

        $this->actingAs($user)->get('/akademik')->assertForbidden();
        $this->actingAs($user)->get('/akademik/tahun-akademik')->assertForbidden();
        $this->actingAs($user)->get('/akademik/mata-kuliah')->assertForbidden();
        $this->actingAs($user)->get('/akademik/prodi')->assertForbidden();
        $this->actingAs($user)->get('/akademik/kurikulum')->assertForbidden();
        $this->actingAs($user)->get('/akademik/kelas')->assertForbidden();
        $this->actingAs($user)->get('/akademik/ruangan')->assertForbidden();
        $this->actingAs($user)->post('/akademik/jurusan', [])->assertForbidden();
        $this->actingAs($user)->get('/akademik/jurusan/template')->assertForbidden();
        $this->actingAs($user)->get('/akademik/jurusan/export')->assertForbidden();
        $this->actingAs($user)->get('/akademik/mata-kuliah/template')->assertForbidden();
        $this->actingAs($user)->get('/akademik/mata-kuliah/export')->assertForbidden();
        $this->actingAs($user)->get('/akademik/prodi/template')->assertForbidden();
        $this->actingAs($user)->get('/akademik/prodi/export')->assertForbidden();
        $this->actingAs($user)->get('/akademik/kurikulum/template')->assertForbidden();
        $this->actingAs($user)->get('/akademik/kurikulum/export')->assertForbidden();
        $this->actingAs($user)->get('/akademik/kelas/template')->assertForbidden();
        $this->actingAs($user)->get('/akademik/kelas/export')->assertForbidden();
        $this->actingAs($user)->get('/akademik/ruangan/template')->assertForbidden();
        $this->actingAs($user)->get('/akademik/ruangan/export')->assertForbidden();
        $this->actingAs($user)->get('/akademik/tahun-akademik/template')->assertForbidden();
        $this->actingAs($user)->get('/settings')->assertForbidden();
        $this->actingAs($user)->get('/keuangan/setup-tarif')->assertForbidden();
    }

    public function test_baak_can_access_baak_and_shared_pages(): void
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $user->assignRole('baak');

        $this->actingAs($user)->get('/akademik')->assertOk();
        $this->actingAs($user)->get('/akademik/tahun-akademik')->assertOk();
        $this->actingAs($user)->get('/krs')->assertOk();
        $this->actingAs($user)->get('/dosen/nilai')->assertOk();
    }

    public function test_shared_menu_is_filtered_by_granular_menu_permissions(): void
    {
        $this->seedRoles();

        Permission::findOrCreate('menu.dosen.index', 'web');

        $user = User::factory()->create();
        $user->assignRole('baak');
        $user->givePermissionTo('menu.dosen.index');

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('menu', function (Collection|array $menu) {
                    $groups = collect($menu)->values();

                    return $groups->count() === 1
                        && $groups->first()['group'] === 'Perkuliahan'
                        && collect($groups->first()['items'] ?? [])->pluck('route')->all() === ['dosen.index'];
                })
            );
    }

    public function test_shared_menu_uses_default_role_menu_when_no_scoped_permission_exists(): void
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $user->assignRole('baak');

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('menu', function (Collection|array $menu) {
                    $routes = collect($menu)
                        ->flatMap(fn ($group) => collect($group['items'] ?? [])->pluck('route'))
                        ->values()
                        ->all();

                    return in_array('akademik.index', $routes, true)
                        && in_array('krs.index', $routes, true)
                        && in_array('notifications.index', $routes, true);
                })
            );
    }

    public function test_dosen_can_access_dosen_pages_but_not_akademik(): void
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $user->assignRole('dosen');

        $this->actingAs($user)->get('/dosen/jadwal')->assertOk();
        $this->actingAs($user)->get('/dosen/nilai')->assertOk();
        $this->actingAs($user)->get('/dosen')->assertForbidden();
        $this->actingAs($user)->post('/dosen', [])->assertForbidden();
        $this->actingAs($user)->get('/akademik')->assertForbidden();
        $this->actingAs($user)->get('/akademik/jurusan')->assertForbidden();
    }

    public function test_mahasiswa_can_access_mahasiswa_pages_but_not_dosen_nilai(): void
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $user->assignRole('mahasiswa');

        $this->actingAs($user)->get('/mahasiswa/krs')->assertOk();
        $this->actingAs($user)->get('/mahasiswa/khs')->assertOk();
        $this->actingAs($user)->get('/dosen/nilai')->assertForbidden();
    }

    public function test_super_admin_can_create_staff_user(): void
    {
        $this->seedRoles();

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $this->actingAs($superAdmin)->post('/settings/user-access', [
            'name' => 'Operator Akademik',
            'email' => 'operator@siakad.test',
            'phone' => '08123456789',
            'identity_number' => 'OP-001',
            'password' => 'password123',
            'role' => 'operator',
            'is_active' => true,
            'permissions' => ['menu.dashboard', 'menu.mahasiswa.index', 'action.create'],
        ])->assertRedirect();

        $staff = User::query()->where('email', 'operator@siakad.test')->firstOrFail();

        $this->assertTrue($staff->hasRole('operator'));
        $this->assertTrue($staff->can('action.create'));
    }

    public function test_super_admin_can_update_staff_access_and_activation_status(): void
    {
        $this->seedRoles();

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $staff = User::factory()->create([
            'is_active' => true,
        ]);
        $staff->assignRole('baak');
        Permission::findOrCreate('menu.dashboard', 'web');
        Permission::findOrCreate('action.update', 'web');
        $staff->givePermissionTo('menu.dashboard');

        $this->actingAs($superAdmin)->put('/settings/user-access/'.$staff->id, [
            'role' => 'admin',
            'is_active' => false,
            'permissions' => ['menu.dashboard', 'action.update'],
        ])->assertRedirect();

        $staff->refresh();

        $this->assertFalse($staff->is_active);
        $this->assertTrue($staff->hasRole('admin'));
        $this->assertTrue($staff->can('action.update'));
        $this->assertFalse($staff->can('menu.mahasiswa.index'));
    }

    public function test_super_admin_can_filter_user_access_list(): void
    {
        $this->seedRoles();

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $operator = User::factory()->create([
            'name' => 'Operator Filter',
            'email' => 'operator-filter@siakad.test',
            'is_active' => true,
        ]);
        $operator->assignRole('operator');

        $inactiveStaff = User::factory()->create([
            'name' => 'Staff Nonaktif',
            'email' => 'staff-nonaktif@siakad.test',
            'is_active' => false,
        ]);
        $inactiveStaff->assignRole('staff');

        $mahasiswa = User::factory()->create([
            'name' => 'Mahasiswa Tidak Tampil',
            'email' => 'mahasiswa-hidden@siakad.test',
        ]);
        $mahasiswa->assignRole('mahasiswa');

        $this->actingAs($superAdmin)
            ->get('/settings/user-access?q=filter&role=operator&status=active')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Modules/Settings/UserAccess')
                ->where('filters.q', 'filter')
                ->where('filters.role', 'operator')
                ->where('filters.status', 'active')
                ->where('users', function (Collection|array $users) use ($operator, $inactiveStaff, $mahasiswa) {
                    $emails = collect($users)->pluck('email');

                    return $emails->contains($operator->email)
                        && ! $emails->contains($inactiveStaff->email)
                        && ! $emails->contains($mahasiswa->email);
                })
            );
    }

    public function test_super_admin_can_reset_staff_password(): void
    {
        $this->seedRoles();

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $staff = User::factory()->create([
            'password' => 'old-password',
        ]);
        $staff->assignRole('operator');

        $this->actingAs($superAdmin)
            ->patch('/settings/user-access/'.$staff->id.'/password', [
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('new-password-123', $staff->refresh()->password));
    }

    public function test_super_admin_user_access_rejects_external_user_targets(): void
    {
        $this->seedRoles();

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $mahasiswa = User::factory()->create();
        $mahasiswa->assignRole('mahasiswa');

        $this->actingAs($superAdmin)->put('/settings/user-access/'.$mahasiswa->id, [
            'role' => 'operator',
            'is_active' => true,
            'permissions' => [],
        ])->assertSessionHasErrors('access');

        $this->actingAs($superAdmin)->patch('/settings/user-access/'.$mahasiswa->id.'/password', [
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertSessionHasErrors('password_reset');
    }

    public function test_super_admin_dashboard_receives_shared_roles_and_panel_data(): void
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $user->assignRole('super-admin');

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('auth.roles', ['super-admin'])
                ->where('superAdminPanel.snapshot.backup_total', fn ($value) => is_int($value) && $value >= 0)
                ->where('superAdminPanel.snapshot.inactive_user_total', fn ($value) => is_int($value) && $value >= 0)
                ->where('superAdminPanel.snapshot.staff_user_total', fn ($value) => is_int($value) && $value >= 0)
                ->has('superAdminPanel.trend.labels', 7)
                ->has('superAdminPanel.trend.pmb_daily', 7)
                ->has('superAdminPanel.trend.user_daily', 7)
                ->has('superAdminPanel.trend.maintenance_daily', 7)
                ->has('superAdminPanel.audit_trail')
            );
    }

    public function test_super_admin_settings_pages_receive_shared_roles(): void
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $user->assignRole('super-admin');

        $this->actingAs($user)
            ->get('/settings')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Modules/Settings/Index')
                ->where('auth.roles', ['super-admin'])
                ->has('stats')
                ->has('recentUsers')
            );

        $this->actingAs($user)
            ->get('/settings/database')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Modules/Settings/Database')
                ->where('auth.roles', ['super-admin'])
                ->has('backups')
                ->has('maintenanceLogs')
            );

        $this->actingAs($user)
            ->get('/settings/user-access')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Modules/Settings/UserAccess')
                ->where('auth.roles', ['super-admin'])
                ->where('roles', fn (Collection|array $roles) => ! collect($roles)->pluck('name')->contains('mahasiswa'))
                ->where('roles', fn (Collection|array $roles) => ! collect($roles)->pluck('name')->contains('calon-mahasiswa'))
                ->where('permissionCatalog.menu', fn (Collection|array $menu) => ! array_key_exists('menu.settings.index', collect($menu)->all()))
                ->where('permissionCatalog.menu', fn (Collection|array $menu) => ! array_key_exists('menu.settings.database.index', collect($menu)->all()))
                ->where('permissionCatalog.menu', fn (Collection|array $menu) => ! array_key_exists('menu.settings.user-access.index', collect($menu)->all()))
            );
    }

    public function test_super_admin_user_access_rejects_non_staff_roles(): void
    {
        $this->seedRoles();

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $this->actingAs($superAdmin)->post('/settings/user-access', [
            'name' => 'Mahasiswa Manual',
            'email' => 'manual-mahasiswa@siakad.test',
            'password' => 'password123',
            'role' => 'mahasiswa',
        ])->assertSessionHasErrors('role');

        $staff = User::factory()->create();
        $staff->assignRole('operator');

        $this->actingAs($superAdmin)->put('/settings/user-access/'.$staff->id, [
            'role' => 'calon-mahasiswa',
            'is_active' => true,
            'permissions' => [],
        ])->assertSessionHasErrors('role');
    }

    public function test_granular_action_permission_is_enforced_for_staff(): void
    {
        $this->seedRoles();

        Permission::findOrCreate('menu.dosen.index', 'web');
        Permission::findOrCreate('action.create', 'web');

        $user = User::factory()->create();
        $user->assignRole('baak');
        $user->givePermissionTo('menu.dosen.index');

        $this->actingAs($user)->post('/dosen', [])->assertForbidden();

        $user->givePermissionTo('action.create');

        $this->actingAs($user)->post('/dosen', [])->assertSessionHasErrors(['nidn', 'nama']);
    }
}

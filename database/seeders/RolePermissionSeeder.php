<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $guard = 'web';
        $roles = [
            'super-admin',
            'baak',
            'admin',
            'operator',
            'bendahara',
            'staff',
            'dosen',
            'mahasiswa',
            'keuangan',
            'calon-mahasiswa',
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate([
                'name' => $role,
                'guard_name' => $guard,
            ]);
        }
    }
}

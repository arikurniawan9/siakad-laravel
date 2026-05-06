<?php

namespace Tests\Feature;

use App\Models\DatabaseMaintenanceLog;
use App\Models\Jurusan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DatabaseMaintenanceTest extends TestCase
{
    use RefreshDatabase;

    private function makeSuperAdmin(): User
    {
        Role::findOrCreate('super-admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        return $user;
    }

    public function test_non_super_admin_cannot_access_database_maintenance_routes(): void
    {
        Role::findOrCreate('mahasiswa', 'web');
        $user = User::factory()->create();
        $user->assignRole('mahasiswa');

        $this->actingAs($user)->post('/settings/database/backup')->assertForbidden();
        $this->actingAs($user)->post('/settings/database/reset', ['confirmation' => 'RESET DATABASE'])->assertForbidden();
    }

    public function test_super_admin_can_create_database_backup(): void
    {
        Storage::fake('local');
        $user = $this->makeSuperAdmin();

        $this->actingAs($user)
            ->post('/settings/database/backup')
            ->assertSessionHasNoErrors();

        $this->assertNotEmpty(Storage::disk('local')->files('backups'));
        $this->assertTrue(DatabaseMaintenanceLog::query()->where('action', 'backup')->where('status', 'success')->exists());
    }

    public function test_reset_database_preserves_only_super_admin_user_data(): void
    {
        $superAdmin = $this->makeSuperAdmin();
        User::factory()->count(2)->create();
        Jurusan::query()->create([
            'kode' => 'TEMP',
            'nama' => 'Sementara',
        ]);

        $this->actingAs($superAdmin)
            ->post('/settings/database/reset', ['confirmation' => 'RESET DATABASE'])
            ->assertSessionHasNoErrors();

        $this->assertEquals(1, User::query()->count());
        $this->assertTrue(User::query()->whereKey($superAdmin->id)->exists());
        $this->assertEquals(0, Jurusan::query()->count());
    }

    public function test_restore_database_validates_backup_file(): void
    {
        $superAdmin = $this->makeSuperAdmin();

        $this->actingAs($superAdmin)
            ->post('/settings/database/restore')
            ->assertSessionHasErrors('backup_file');

        $sqlFile = UploadedFile::fake()->createWithContent('dummy.sql', "SET FOREIGN_KEY_CHECKS=1;\n");
        $this->actingAs($superAdmin)
            ->post('/settings/database/restore', ['backup_file' => $sqlFile])
            ->assertSessionHasNoErrors();

        $this->assertTrue(DatabaseMaintenanceLog::query()->where('action', 'restore')->where('status', 'success')->exists());
    }

    public function test_super_admin_can_download_backup_file(): void
    {
        $superAdmin = $this->makeSuperAdmin();

        $this->actingAs($superAdmin)->post('/settings/database/backup')->assertSessionHasNoErrors();
        $files = Storage::disk('local')->files('backups');
        $this->assertNotEmpty($files);
        $filename = basename($files[0]);

        $response = $this->actingAs($superAdmin)->get('/settings/database/backup/'.$filename);
        $response->assertOk();
        $response->assertHeader('content-disposition');
    }

    public function test_super_admin_can_delete_backup_file(): void
    {
        $superAdmin = $this->makeSuperAdmin();

        $this->actingAs($superAdmin)->post('/settings/database/backup')->assertSessionHasNoErrors();
        $files = Storage::disk('local')->files('backups');
        $this->assertNotEmpty($files);
        $filename = basename($files[0]);

        $this->actingAs($superAdmin)
            ->delete('/settings/database/backup/'.$filename)
            ->assertSessionHasNoErrors();

        $this->assertFalse(Storage::disk('local')->exists('backups/'.$filename));
    }

    public function test_super_admin_can_purge_old_backups(): void
    {
        $superAdmin = $this->makeSuperAdmin();

        Storage::disk('local')->put('backups/old-backup.sql', '-- old');
        $oldTs = now()->subDays(90)->timestamp;
        touch(storage_path('app/backups/old-backup.sql'), $oldTs);

        $this->actingAs($superAdmin)
            ->post('/settings/database/purge', ['older_than_days' => 30])
            ->assertSessionHasNoErrors();

        $this->assertFalse(Storage::disk('local')->exists('backups/old-backup.sql'));
    }

    public function test_super_admin_can_export_maintenance_logs_csv(): void
    {
        $superAdmin = $this->makeSuperAdmin();
        $this->actingAs($superAdmin)->post('/settings/database/backup')->assertSessionHasNoErrors();

        $response = $this->actingAs($superAdmin)->get('/settings/database/logs/export');
        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $response->assertHeader('content-disposition');
    }
}

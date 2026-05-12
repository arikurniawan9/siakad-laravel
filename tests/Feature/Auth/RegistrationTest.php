<?php

namespace Tests\Feature\Auth;

use Carbon\Carbon;
use App\Models\Jurusan;
use App\Models\Prodi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        Carbon::setTestNow('2026-05-05 10:00:00');

        $jurusan = Jurusan::create([
            'kode' => 'JRS-01',
            'nama' => 'Jurusan Test',
            'is_active' => true,
        ]);

        $prodi = Prodi::create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRD-01',
            'nama' => 'Prodi Test',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
            'is_active' => true,
        ]);

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '081234567890',
            'prodi_id' => $prodi->id,
            'jenis_kelamin' => 'L',
            'confirm_data' => '1',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $this->assertTrue(auth()->user()->hasRole('mahasiswa'));
        $this->assertDatabaseHas('mahasiswas', [
            'user_id' => auth()->id(),
            'prodi_id' => $prodi->id,
            'nim' => '2026PRD010001',
        ]);
        $response->assertRedirect('/pmb');
    }
}

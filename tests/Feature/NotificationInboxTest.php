<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Jurusan;
use App\Models\Dosen;
use App\Models\Prodi;
use App\Models\Mahasiswa;
use App\Models\Pmb;
use App\Notifications\KrsStatusUpdated;
use App\Notifications\DosenUpdated;
use App\Notifications\MahasiswaStatusChanged;
use App\Notifications\PaymentFailed;
use App\Notifications\PmbRegistered;
use App\Notifications\PmbVerificationChanged;
use App\Notifications\PaymentSucceeded;
use App\Notifications\TagihanIssued;
use App\Notifications\TagihanStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class NotificationInboxTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_inbox_and_mark_all_read_work(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new KrsStatusUpdated(1, 'approved', '2025/2026', 2, 20));
        $user->notify(new KrsStatusUpdated(2, 'Diproses', '2025/2026', 1, 18));

        $this->actingAs($user)
            ->get(route('notifications.index'))
            ->assertOk();

        $this->actingAs($user)
            ->patch(route('notifications.readAll'))
            ->assertRedirect();

        $user->refresh();

        $this->assertSame(0, $user->unreadNotifications()->count());
        $this->assertSame(2, $user->readNotifications()->count());
    }

    public function test_notification_inbox_returns_expected_inertia_payload(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new DosenUpdated('Dr. Inbox', 'status', 'tetap', 'luar_biasa', 'Sistem Informasi'));
        $user->notify(new PmbRegistered('PMB-2026-0099', 'Inbox PMB'));

        $this->actingAs($user)
            ->get(route('notifications.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Modules/Notifications/Index')
                ->where('summary.total', 2)
                ->where('summary.unread', 2)
                ->where('summary.read', 0)
                ->where('filters.read', 'all')
                ->where('filters.module', 'all')
                ->where('filters.per_page', 10)
                ->has('modules', fn (Assert $modules) => $modules
                    ->where('0.value', 'all')
                    ->where('0.label', 'Semua Modul')
                    ->etc()
                )
                ->has('inbox.data', 2)
            );
    }

    public function test_notification_can_be_marked_read_individually(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new KrsStatusUpdated(1, 'approved', '2025/2026', 2, 20));
        $user->notify(new PmbRegistered('PMB-2026-0100', 'Inbox Tunggal'));

        $target = $user->notifications()->latest()->first();

        $this->assertNotNull($target);

        $this->actingAs($user)
            ->patch(route('notifications.read', $target->id))
            ->assertRedirect();

        $user->refresh();

        $this->assertSame(1, $user->unreadNotifications()->count());
        $this->assertSame(1, $user->readNotifications()->count());
        $this->assertNotNull($user->notifications()->find($target->id)?->read_at);
    }

    public function test_krs_notification_carries_action_route(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new KrsStatusUpdated(1, 'approved', '2025/2026', 2, 20));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('krs.show', $notification?->data['action_route'] ?? null);
        $this->assertSame('Lihat Disetujui', $notification?->data['action_label'] ?? null);
        $this->assertNotEmpty($notification?->data['action_url'] ?? null);
    }

    public function test_pmb_notification_carries_action_route(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new PmbRegistered('PMB-2026-0001', 'Budi Santoso'));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('pmb.index', $notification?->data['action_route'] ?? null);
        $this->assertSame('Buka PMB', $notification?->data['action_label'] ?? null);
    }

    public function test_pmb_verification_notification_has_action_route(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new PmbVerificationChanged('PMB-2026-0002', 'Budi Santoso', 'pending', 'verified', 'Sistem Informasi'));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('pmb.index', $notification?->data['action_route'] ?? null);
        $this->assertSame('verified', $notification?->data['status'] ?? null);
        $this->assertSame('pending', $notification?->data['status_sebelumnya'] ?? null);
        $this->assertSame('Lihat PMB', $notification?->data['action_label'] ?? null);
    }

    public function test_payment_notification_carries_action_route(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new PaymentSucceeded(
            'Pembayaran tagihan berhasil',
            'Tagihan INV-001 telah lunas.',
            'finance',
            'mahasiswa.tagihan',
            'Buka Tagihan',
            'success',
            'INV-001',
            'ORD-001',
        ));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('mahasiswa.tagihan', $notification?->data['action_route'] ?? null);
        $this->assertSame('Buka Tagihan', $notification?->data['action_label'] ?? null);
        $this->assertSame('finance', $notification?->data['module'] ?? null);
    }

    public function test_payment_failed_notification_carries_action_route(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new PaymentFailed(
            'Pembayaran tagihan belum berhasil',
            'Tagihan INV-002 masih menunggu pembayaran.',
            'finance',
            'mahasiswa.tagihan',
            'Lihat Tagihan',
            'warning',
            'INV-002',
            'ORD-002',
        ));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('mahasiswa.tagihan', $notification?->data['action_route'] ?? null);
        $this->assertSame('Lihat Tagihan', $notification?->data['action_label'] ?? null);
        $this->assertSame('warning', $notification?->data['status'] ?? null);
    }

    public function test_krs_rejected_notification_has_perbaiki_label(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new KrsStatusUpdated(99, 'rejected', '2025/2026', 2, 20));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('Perbaiki KRS', $notification?->data['action_label'] ?? null);
        $this->assertSame('rejected', $notification?->data['status'] ?? null);
    }

    public function test_tagihan_issued_notification_carries_action_url(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new TagihanIssued('INV-2026-0001', 'SPP', 'Budi Santoso', 1500000));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('mahasiswa.tagihan', $notification?->data['action_route'] ?? null);
        $this->assertNotEmpty($notification?->data['action_url'] ?? null);
        $this->assertSame('Lihat Tagihan', $notification?->data['action_label'] ?? null);
        $this->assertSame('finance', $notification?->data['module'] ?? null);
    }

    public function test_store_tagihan_sends_notification_to_mahasiswa(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        Role::findOrCreate('super-admin', 'web');
        $user->assignRole('super-admin');

        $jurusan = Jurusan::query()->create([
            'kode' => 'JRN',
            'nama' => 'Jurusan Uji',
            'deskripsi' => null,
            'is_active' => true,
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRD',
            'nama' => 'Prodi Uji',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
            'is_active' => true,
        ]);

        $mahasiswaUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $mahasiswa = Mahasiswa::query()->create([
            'user_id' => $mahasiswaUser->id,
            'prodi_id' => $prodi->id,
            'nim' => '20260001',
            'nisn' => '1234567890',
            'nama' => 'Budi Santoso',
            'email' => 'budi@example.test',
            'phone' => '08123456789',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2000-01-01',
            'tempat_lahir' => 'Jakarta',
            'alamat' => 'Jl. Uji Coba',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);

        $this->actingAs($user)
            ->post(route('keuangan.tagihan.store'), [
                'mahasiswa_id' => $mahasiswa->id,
                'jenis' => 'SPP',
                'tahun_akademik' => '2025/2026',
                'semester_akademik' => 1,
                'nominal' => 1500000,
                'potongan' => 0,
                'denda' => 0,
            ])
            ->assertRedirect();

        $mahasiswaUser->refresh();

        $this->assertSame(1, $mahasiswaUser->notifications()->count());
        $notification = $mahasiswaUser->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('mahasiswa.tagihan', $notification?->data['action_route'] ?? null);
        $this->assertSame('Lihat Tagihan', $notification?->data['action_label'] ?? null);
        $this->assertSame('INV-', substr((string) ($notification?->data['kode_tagihan'] ?? ''), 0, 4));
    }

    public function test_update_pmb_verification_sends_notification_to_related_user(): void
    {
        $actor = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        Role::findOrCreate('super-admin', 'web');
        $actor->assignRole('super-admin');

        $pmbUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $jurusan = Jurusan::query()->create([
            'kode' => 'JRN-PMB',
            'nama' => 'Jurusan PMB Uji',
            'deskripsi' => null,
            'is_active' => true,
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRD-PMB',
            'nama' => 'Prodi PMB Uji',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
            'is_active' => true,
        ]);

        $pmb = Pmb::query()->create([
            'user_id' => $pmbUser->id,
            'prodi_id' => $prodi->id,
            'nomor_pendaftaran' => 'PMB-2026-0003',
            'gelombang' => 'Gelombang 1',
            'nama_lengkap' => 'Andi PMB',
            'email' => 'andi-pmb@example.test',
            'phone' => '08123456782',
            'asal_sekolah' => 'SMA Uji',
            'dokumen_ktp' => null,
            'dokumen_ijazah' => null,
            'dokumen_foto' => null,
            'status_verifikasi' => 'pending',
            'status_pembayaran' => 'unpaid',
            'nim_generated' => false,
            'catatan' => null,
        ]);

        $this->actingAs($actor)
            ->patch(route('pmb.verification.update', $pmb), [
                'status_verifikasi' => 'verified',
                'catatan' => 'Dokumen lengkap.',
            ])
            ->assertRedirect();

        $pmbUser->refresh();

        $this->assertSame(1, $pmbUser->notifications()->count());
        $notification = $pmbUser->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('pmb', $notification?->data['module'] ?? null);
        $this->assertSame('verified', $notification?->data['status'] ?? null);
        $this->assertSame('pending', $notification?->data['status_sebelumnya'] ?? null);
        $this->assertSame('Lihat PMB', $notification?->data['action_label'] ?? null);
        $this->assertSame('PMB-2026-0003', $notification?->data['nomor_pendaftaran'] ?? null);
    }

    public function test_mahasiswa_status_changed_notification_carries_action_route(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new MahasiswaStatusChanged('Budi Santoso', 'aktif', 'cuti', 'Sistem Informasi'));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('dashboard', $notification?->data['action_route'] ?? null);
        $this->assertSame('Buka Dashboard', $notification?->data['action_label'] ?? null);
        $this->assertSame('mahasiswa', $notification?->data['module'] ?? null);
    }

    public function test_update_mahasiswa_status_sends_notification_to_related_user(): void
    {
        $actor = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        Role::findOrCreate('super-admin', 'web');
        $actor->assignRole('super-admin');

        $mahasiswaUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $jurusan = Jurusan::query()->create([
            'kode' => 'JRN2',
            'nama' => 'Jurusan Uji 2',
            'deskripsi' => null,
            'is_active' => true,
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRD2',
            'nama' => 'Prodi Uji 2',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
            'is_active' => true,
        ]);

        $mahasiswa = Mahasiswa::query()->create([
            'user_id' => $mahasiswaUser->id,
            'prodi_id' => $prodi->id,
            'nim' => '20260002',
            'nisn' => '2234567890',
            'nama' => 'Siti Aminah',
            'email' => 'siti@example.test',
            'phone' => '08123456780',
            'jenis_kelamin' => 'P',
            'tanggal_lahir' => '2000-01-02',
            'tempat_lahir' => 'Bandung',
            'alamat' => 'Jl. Uji Coba 2',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);

        $this->actingAs($actor)
            ->put(route('mahasiswa.update', $mahasiswa), [
                'prodi_id' => $prodi->id,
                'nim' => '20260002',
                'nisn' => '2234567890',
                'nama' => 'Siti Aminah',
                'email' => 'siti@example.test',
                'phone' => '08123456780',
                'jenis_kelamin' => 'P',
                'tanggal_lahir' => '2000-01-02',
                'tempat_lahir' => 'Bandung',
                'alamat' => 'Jl. Uji Coba 2',
                'angkatan' => '2026',
                'status_mahasiswa' => 'cuti',
            ])
            ->assertRedirect();

        $mahasiswaUser->refresh();

        $this->assertSame(1, $mahasiswaUser->notifications()->count());
        $notification = $mahasiswaUser->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('dashboard', $notification?->data['action_route'] ?? null);
        $this->assertSame('cuti', $notification?->data['status'] ?? null);
        $this->assertSame('aktif', $notification?->data['status_sebelumnya'] ?? null);
    }

    public function test_tagihan_status_changed_notification_carries_action_url(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new TagihanStatusChanged('INV-2026-0002', 'Budi Santoso', 'pending', 'paid', 1750000));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('mahasiswa.tagihan', $notification?->data['action_route'] ?? null);
        $this->assertNotEmpty($notification?->data['action_url'] ?? null);
        $this->assertSame('paid', $notification?->data['status'] ?? null);
        $this->assertSame('pending', $notification?->data['status_sebelumnya'] ?? null);
    }

    public function test_tagihan_partial_notification_has_lanjut_bayar_label(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(new TagihanStatusChanged('INV-2026-0004', 'Budi Santoso', 'pending', 'partial', 1750000));

        $notification = $user->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('partial', $notification?->data['status'] ?? null);
        $this->assertSame('Lanjut Bayar', $notification?->data['action_label'] ?? null);
        $this->assertStringContainsString('dibayar sebagian', (string) ($notification?->data['message'] ?? ''));
    }

    public function test_update_tagihan_status_sends_notification_to_mahasiswa(): void
    {
        $actor = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        Role::findOrCreate('super-admin', 'web');
        $actor->assignRole('super-admin');

        $mahasiswaUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $jurusan = Jurusan::query()->create([
            'kode' => 'JRN5',
            'nama' => 'Jurusan Uji 5',
            'deskripsi' => null,
            'is_active' => true,
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRD6',
            'nama' => 'Prodi Uji 6',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
            'is_active' => true,
        ]);

        $mahasiswa = Mahasiswa::query()->create([
            'user_id' => $mahasiswaUser->id,
            'prodi_id' => $prodi->id,
            'nim' => '20260003',
            'nisn' => '3234567890',
            'nama' => 'Andi Saputra',
            'email' => 'andi@example.test',
            'phone' => '08123456781',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2000-01-03',
            'tempat_lahir' => 'Surabaya',
            'alamat' => 'Jl. Uji Coba 3',
            'angkatan' => '2026',
            'status_mahasiswa' => 'aktif',
        ]);

        $tagihan = \App\Models\Tagihan::query()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kode_tagihan' => 'INV-2026-0003',
            'jenis' => 'SPP',
            'tahun_akademik' => '2025/2026',
            'semester_akademik' => 1,
            'nominal' => 1750000,
            'potongan' => 0,
            'denda' => 0,
            'total' => 1750000,
            'status' => 'pending',
        ]);

        $this->actingAs($actor)
            ->patch(route('keuangan.tagihan.status', $tagihan), [
                'status' => 'paid',
            ])
            ->assertRedirect();

        $mahasiswaUser->refresh();

        $this->assertSame(1, $mahasiswaUser->notifications()->count());
        $notification = $mahasiswaUser->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('mahasiswa.tagihan', $notification?->data['action_route'] ?? null);
        $this->assertSame('paid', $notification?->data['status'] ?? null);
        $this->assertSame('pending', $notification?->data['status_sebelumnya'] ?? null);
    }

    public function test_dosen_status_change_sends_notification_to_related_user(): void
    {
        $actor = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        Role::findOrCreate('super-admin', 'web');
        $actor->assignRole('super-admin');

        $dosenUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $jurusan = Jurusan::query()->create([
            'kode' => 'JRN3',
            'nama' => 'Jurusan Uji 3',
            'deskripsi' => null,
            'is_active' => true,
        ]);

        $prodi = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRD3',
            'nama' => 'Prodi Uji 3',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
            'is_active' => true,
        ]);

        $dosen = Dosen::query()->create([
            'user_id' => $dosenUser->id,
            'prodi_id' => $prodi->id,
            'nidn' => '19870001',
            'nip' => '19870001',
            'nama' => 'Dr. Dosen Uji',
            'email' => 'dosen@example.test',
            'phone' => '08111111111',
            'status_dosen' => 'tetap',
        ]);

        $this->actingAs($actor)
            ->put(route('dosen.update', $dosen), [
                'nidn' => '19870001',
                'nip' => '19870001',
                'nama' => 'Dr. Dosen Uji',
                'email' => 'dosen@example.test',
                'phone' => '08111111111',
                'status_dosen' => 'luar_biasa',
            ])
            ->assertRedirect();

        $dosenUser->refresh();

        $this->assertSame(1, $dosenUser->notifications()->count());
        $notification = $dosenUser->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('dosen', $notification?->data['module'] ?? null);
        $this->assertSame('dashboard', $notification?->data['action_route'] ?? null);
        $this->assertSame('luar_biasa', $notification?->data['status'] ?? null);
    }

    public function test_dosen_relasi_change_sends_notification_to_related_user(): void
    {
        $actor = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        Role::findOrCreate('super-admin', 'web');
        $actor->assignRole('super-admin');

        $dosenUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $jurusan = Jurusan::query()->create([
            'kode' => 'JRN4',
            'nama' => 'Jurusan Uji 4',
            'deskripsi' => null,
            'is_active' => true,
        ]);

        $prodi1 = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRD4',
            'nama' => 'Prodi Uji 4',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
            'is_active' => true,
        ]);

        $prodi2 = Prodi::query()->create([
            'jurusan_id' => $jurusan->id,
            'kode' => 'PRD5',
            'nama' => 'Prodi Uji 5',
            'jenjang' => 'S1',
            'semester_total' => 8,
            'sks_lulus' => 144,
            'is_active' => true,
        ]);

        $dosen = Dosen::query()->create([
            'user_id' => $dosenUser->id,
            'prodi_id' => $prodi1->id,
            'nidn' => '19870002',
            'nip' => '19870002',
            'nama' => 'Dr. Relasi Uji',
            'email' => 'relasi@example.test',
            'phone' => '08111111112',
            'status_dosen' => 'tetap',
        ]);

        $this->actingAs($actor)
            ->put(route('dosen.relasi.update', $dosen), [
                'prodi_id' => $prodi2->id,
            ])
            ->assertRedirect();

        $dosenUser->refresh();

        $this->assertSame(1, $dosenUser->notifications()->count());
        $notification = $dosenUser->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('dosen', $notification?->data['module'] ?? null);
        $this->assertSame('dashboard', $notification?->data['action_route'] ?? null);
        $this->assertSame('Prodi Uji 4', $notification?->data['before'] ?? null);
        $this->assertSame('Prodi Uji 5', $notification?->data['after'] ?? null);
    }
}

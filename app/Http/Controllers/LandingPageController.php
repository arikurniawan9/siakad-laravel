<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'content' => $this->landingContent(),
        ]);
    }

    public function edit(Request $request): Response
    {
        return Inertia::render('Modules/Settings/LandingPage', [
            'content' => $this->landingContent(),
            'previewUrl' => url('/'),
            'canPublish' => $request->user()?->hasAnyRole(['super-admin', 'admin']) ?? false,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'campus_name' => ['required', 'string', 'max:150'],
            'tagline' => ['nullable', 'string', 'max:180'],
            'hero_title' => ['required', 'string', 'max:180'],
            'hero_subtitle' => ['required', 'string', 'max:1000'],
            'hero_image_url' => ['nullable', 'url', 'max:500'],
            'about_title' => ['required', 'string', 'max:140'],
            'about_body' => ['required', 'string', 'max:2000'],
            'address' => ['required', 'string', 'max:500'],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:60'],
            'whatsapp' => ['nullable', 'string', 'max:40'],
            'cta_primary_label' => ['required', 'string', 'max:60'],
            'cta_primary_url' => ['required', 'url', 'max:500'],
            'cta_secondary_label' => ['nullable', 'string', 'max:60'],
            'cta_secondary_url' => ['nullable', 'url', 'max:500'],
            'stats' => ['required', 'array', 'min:3', 'max:4'],
            'stats.*.label' => ['required', 'string', 'max:50'],
            'stats.*.value' => ['required', 'string', 'max:50'],
            'programs' => ['required', 'array', 'min:3', 'max:8'],
            'programs.*' => ['required', 'string', 'max:120'],
            'highlights' => ['required', 'array', 'min:3', 'max:6'],
            'highlights.*.title' => ['required', 'string', 'max:80'],
            'highlights.*.description' => ['required', 'string', 'max:240'],
            'colors' => ['required', 'array'],
            'colors.primary' => ['required', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'colors.accent' => ['required', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'socials' => ['nullable', 'array'],
            'socials.instagram' => ['nullable', 'url', 'max:500'],
            'socials.youtube' => ['nullable', 'url', 'max:500'],
            'socials.facebook' => ['nullable', 'url', 'max:500'],
            'nav_menus' => ['required', 'array', 'min:3', 'max:10'],
            'nav_menus.*.label' => ['required', 'string', 'max:40'],
            'nav_menus.*.url' => ['required', 'url', 'max:500'],
            'slider_items' => ['required', 'array', 'min:1', 'max:8'],
            'slider_items.*.title' => ['required', 'string', 'max:120'],
            'slider_items.*.subtitle' => ['required', 'string', 'max:220'],
            'slider_items.*.image_url' => ['required', 'url', 'max:500'],
            'slider_items.*.cta_label' => ['nullable', 'string', 'max:50'],
            'slider_items.*.cta_url' => ['nullable', 'url', 'max:500'],
        ]);

        AppSetting::query()->updateOrCreate(
            ['key' => 'landing_page'],
            ['value' => $validated]
        );

        Audit::log(
            source: 'settings',
            action: 'landing_page.update',
            entityType: 'app_setting',
            message: 'Landing page diperbarui',
            meta: [
                'campus_name' => $validated['campus_name'],
                'updated_by' => $request->user()?->email,
            ],
        );

        return back()->with('success', 'Konten landing page berhasil diperbarui.');
    }

    private function landingContent(): array
    {
        $default = $this->defaultContent();
        $stored = AppSetting::query()->where('key', 'landing_page')->first();
        $value = is_array($stored?->value) ? $stored->value : [];

        return array_replace_recursive($default, $value);
    }

    private function defaultContent(): array
    {
        return [
            'campus_name' => 'STAI Al-Ittihad',
            'tagline' => 'Kampus Islam Modern untuk Generasi Pemimpin Umat',
            'hero_title' => 'Bangun Masa Depan Akademik dan Karier Islami Anda',
            'hero_subtitle' => 'Program studi relevan, dosen berpengalaman, dan ekosistem pembelajaran yang kuat untuk menghasilkan lulusan berakhlak, adaptif, dan siap bersaing.',
            'hero_image_url' => url('/logostai.png'),
            'about_title' => 'Tentang Kampus',
            'about_body' => 'STAI Al-Ittihad berkomitmen menghadirkan pendidikan tinggi Islam yang berkualitas, berorientasi mutu, dan selaras dengan kebutuhan zaman melalui tata kelola kampus yang profesional.',
            'address' => 'Jl. Pendidikan No. 1, Indonesia',
            'email' => 'info@kampus.ac.id',
            'phone' => '(021) 1234 5678',
            'whatsapp' => '6281234567890',
            'cta_primary_label' => 'Daftar PMB Sekarang',
            'cta_primary_url' => url('/pmb'),
            'cta_secondary_label' => 'Masuk Sistem Akademik',
            'cta_secondary_url' => url('/login'),
            'stats' => [
                ['label' => 'Mahasiswa Aktif', 'value' => '2.500+'],
                ['label' => 'Program Studi', 'value' => '12'],
                ['label' => 'Dosen Profesional', 'value' => '140+'],
                ['label' => 'Kemitraan', 'value' => '60+'],
            ],
            'programs' => [
                'Manajemen Pendidikan Islam',
                'Pendidikan Agama Islam',
                'Ekonomi Syariah',
                'Komunikasi dan Penyiaran Islam',
            ],
            'highlights' => [
                ['title' => 'Kurikulum Adaptif', 'description' => 'Sinkron dengan kebutuhan industri, organisasi, dan penguatan kompetensi abad 21.'],
                ['title' => 'Ekosistem Digital', 'description' => 'Didukung sistem akademik terintegrasi dari PMB, KRS, hingga pelaporan.'],
                ['title' => 'Pembinaan Karakter', 'description' => 'Menjaga keseimbangan akademik, spiritual, dan kepemimpinan mahasiswa.'],
            ],
            'colors' => [
                'primary' => '#0f766e',
                'accent' => '#f59e0b',
            ],
            'socials' => [
                'instagram' => '',
                'youtube' => '',
                'facebook' => '',
            ],
            'nav_menus' => [
                ['label' => 'Beranda', 'url' => url('/')],
                ['label' => 'Profil', 'url' => url('/#profil')],
                ['label' => 'Program Studi', 'url' => url('/#program')],
                ['label' => 'Informasi', 'url' => url('/#informasi')],
                ['label' => 'Kontak', 'url' => url('/#kontak')],
            ],
            'slider_items' => [
                [
                    'title' => 'Penerimaan Mahasiswa Baru Telah Dibuka',
                    'subtitle' => 'Daftar sekarang dan raih beasiswa pendidikan untuk calon mahasiswa berprestasi.',
                    'image_url' => url('/halaman utama.png'),
                    'cta_label' => 'Daftar PMB',
                    'cta_url' => url('/pmb'),
                ],
                [
                    'title' => 'Akreditasi dan Mutu Pembelajaran Terjaga',
                    'subtitle' => 'Kampus fokus pada kualitas lulusan melalui kurikulum adaptif dan dosen profesional.',
                    'image_url' => url('/logostai.png'),
                    'cta_label' => 'Lihat Profil',
                    'cta_url' => url('/#profil'),
                ],
            ],
        ];
    }
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

function toTextList(values = []) {
    return Array.isArray(values) ? values.join('\n') : '';
}

function fromTextList(text = '') {
    return String(text)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

function childrenToText(children = []) {
    if (!Array.isArray(children) || children.length === 0) return '';
    return children.map((item) => `${item?.label || ''}|${item?.url || ''}`).join('\n');
}

function childrenFromText(text = '') {
    return String(text)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [label = '', url = ''] = line.split('|');
            return { label: label.trim(), url: url.trim() };
        })
        .filter((item) => item.label && item.url);
}

const quickTemplates = {
    islami: {
        campus_name: 'STAI Al-Ittihad',
        tagline: 'Kampus Islam Berdaya Saing Global',
        hero_title: 'Sekolah Tinggi Agama Islam yang Mengintegrasikan Akhlak, Keilmuan, dan Profesionalisme',
        hero_subtitle: 'Kami berkomitmen mencetak generasi muslim berilmu, berakhlak mulia, dan siap berkontribusi untuk umat, bangsa, dan peradaban.',
        hero_layout: 'two-column',
        hero_image_url: '/logostai.png',
        about_title: 'Tentang Kampus Kami',
        about_body: 'STAI Al-Ittihad hadir sebagai institusi pendidikan tinggi Islam yang fokus pada mutu akademik, penguatan karakter, dan pengembangan kepemimpinan mahasiswa.',
        address: 'Cianjur, Jawa Barat',
        email: 'admin@stai-alittihad.ac.id',
        phone: '(0263) 000000',
        whatsapp: '6281234567890',
        cta_primary_label: 'Daftar PMB Sekarang',
        cta_primary_url: '/daftar-pmb',
        cta_secondary_label: 'Masuk Sistem Akademik',
        cta_secondary_url: '/login-mahasiswa',
        colors: { primary: '#0f766e', accent: '#f59e0b' },
        stats: [
            { label: 'Mahasiswa Aktif', value: '250+' },
            { label: 'Program Studi', value: '3' },
            { label: 'Dosen & Tendik', value: '25+' },
            { label: 'Tahun Pengalaman', value: '5+' },
        ],
        programs: [
            'S1 Ekonomi Syariah',
            'S1 Pendidikan Islam Anak Usia Dini',
            'S1 Manajemen Pendidikan Islam',
        ],
        highlights: [
            { title: 'Pendidikan Berkualitas', description: 'Kurikulum berbasis kompetensi dengan penguatan karakter islami.' },
            { title: 'Kampus Islami', description: 'Lingkungan akademik yang kondusif, religius, dan adaptif terhadap perkembangan zaman.' },
            { title: 'Biaya Terjangkau', description: 'Akses pendidikan tinggi Islam bermutu dengan skema biaya yang terencana.' },
        ],
        nav_menus: [
            { label: 'Beranda', url: '/', children_text: '', is_visible: true },
            { label: 'Profil', url: '/#profil', children_text: 'Visi Misi|/#profil\nKontak|/#kontak', is_visible: true },
            { label: 'Program Studi', url: '/#program', children_text: '', is_visible: true },
            { label: 'Informasi', url: '/#informasi', children_text: 'Berita Kampus|/#berita', is_visible: true },
            { label: 'Kontak', url: '/#kontak', children_text: '', is_visible: true },
        ],
        slider_items: [
            { title: 'Selamat Datang di STAI Al-Ittihad', subtitle: 'Kampus Islam modern yang membina akhlak, ilmu, dan kepemimpinan mahasiswa.', image_url: '/halaman utama.png', cta_label: 'Pelajari Kampus', cta_url: '/#profil' },
            { title: 'Penerimaan Mahasiswa Baru Dibuka', subtitle: 'Daftarkan diri Anda sekarang dan raih peluang beasiswa pendidikan.', image_url: '/logostai.png', cta_label: 'Daftar PMB', cta_url: '/daftar-pmb' },
        ],
        news_items: [
            { title: 'Pembukaan PMB Gelombang Baru', date: '12 Mei 2026', excerpt: 'Pendaftaran mahasiswa baru resmi dibuka dengan kuota terbatas.', url: '/daftar-pmb' },
            { title: 'Seminar Nasional Pendidikan Islam', date: '05 Mei 2026', excerpt: 'Diskusi strategis pengembangan pendidikan Islam berbasis teknologi.', url: '/#' },
            { title: 'Program Penguatan Karier Mahasiswa', date: '29 April 2026', excerpt: 'Kampus membuka pendampingan karier dan kewirausahaan bagi mahasiswa aktif.', url: '/#' },
        ],
    },
    modern: {
        campus_name: 'Kampus Digital Nusantara',
        tagline: 'Smart Campus for Future Leaders',
        hero_title: 'Bangun Kompetensi Akademik dan Karier Anda di Kampus Berbasis Teknologi',
        hero_subtitle: 'Pembelajaran adaptif, sistem digital terintegrasi, dan ekosistem inovatif untuk melahirkan lulusan unggul dan relevan dengan industri.',
        hero_layout: 'one-column',
        hero_image_url: '/logostai.png',
        about_title: 'Profil Kampus',
        about_body: 'Kami menggabungkan kualitas akademik, teknologi pembelajaran, dan kolaborasi industri untuk menciptakan pengalaman belajar yang transformatif.',
        address: 'Jakarta, Indonesia',
        email: 'info@kampusdigital.ac.id',
        phone: '(021) 1234 5678',
        whatsapp: '6289876543210',
        cta_primary_label: 'Gabung Sekarang',
        cta_primary_url: '/daftar-pmb',
        cta_secondary_label: 'Lihat Program',
        cta_secondary_url: '/#program',
        colors: { primary: '#0b5cab', accent: '#f97316' },
        stats: [
            { label: 'Mahasiswa Aktif', value: '3.200+' },
            { label: 'Program Studi', value: '10' },
            { label: 'Mitra Industri', value: '85+' },
            { label: 'Alumni Terserap', value: '91%' },
        ],
        programs: [
            'S1 Sistem Informasi',
            'S1 Teknik Informatika',
            'S1 Bisnis Digital',
            'S1 Manajemen',
        ],
        highlights: [
            { title: 'Smart Learning', description: 'Kelas hybrid dengan LMS terintegrasi dan monitoring akademik real-time.' },
            { title: 'Industry Collaboration', description: 'Magang, proyek riil, dan mentoring langsung dari praktisi industri.' },
            { title: 'Career Center', description: 'Pendampingan karier dari semester awal hingga penyaluran kerja alumni.' },
        ],
        nav_menus: [
            { label: 'Beranda', url: '/', children_text: '', is_visible: true },
            { label: 'Profil', url: '/#profil', children_text: 'Tentang Kami|/#profil\nKontak|/#kontak', is_visible: true },
            { label: 'Program', url: '/#program', children_text: '', is_visible: true },
            { label: 'Keunggulan', url: '/#informasi', children_text: 'Berita|/#berita', is_visible: true },
            { label: 'Kontak', url: '/#kontak', children_text: '', is_visible: true },
        ],
        slider_items: [
            { title: 'Future-Ready Campus', subtitle: 'Kurikulum modern untuk mempersiapkan lulusan menghadapi transformasi digital.', image_url: '/halaman utama.png', cta_label: 'Lihat Program', cta_url: '/#program' },
            { title: 'Join Our Innovation Ecosystem', subtitle: 'Bangun portofolio, jejaring, dan peluang karier sejak dini bersama kampus kami.', image_url: '/logostai.png', cta_label: 'Daftar Sekarang', cta_url: '/daftar-pmb' },
        ],
        news_items: [
            { title: 'Kuliah Umum AI for Education', date: '10 Mei 2026', excerpt: 'Pembahasan implementasi AI dalam pembelajaran dan manajemen kampus.', url: '/#' },
            { title: 'Bootcamp Karier Digital', date: '02 Mei 2026', excerpt: 'Pelatihan intensif untuk meningkatkan kesiapan kerja mahasiswa tingkat akhir.', url: '/#' },
            { title: 'MoU dengan Mitra Industri Baru', date: '25 April 2026', excerpt: 'Kolaborasi strategis untuk riset, magang, dan rekrutmen alumni.', url: '/#' },
        ],
    },
};

export default function Page({ auth, content = null, previewUrl = '#', canPublish = false }) {
    const { menu, flash, errors } = usePage().props;

    const form = useForm({
        campus_name: content?.campus_name || '',
        tagline: content?.tagline || '',
        hero_title: content?.hero_title || '',
        hero_subtitle: content?.hero_subtitle || '',
        hero_image_url: content?.hero_image_url || '',
        about_title: content?.about_title || '',
        about_body: content?.about_body || '',
        address: content?.address || '',
        email: content?.email || '',
        phone: content?.phone || '',
        whatsapp: content?.whatsapp || '',
        cta_primary_label: content?.cta_primary_label || '',
        cta_primary_url: content?.cta_primary_url || '',
        cta_secondary_label: content?.cta_secondary_label || '',
        cta_secondary_url: content?.cta_secondary_url || '',
        stats: Array.isArray(content?.stats) ? content.stats : [],
        programs_text: toTextList(content?.programs),
        highlights: Array.isArray(content?.highlights) ? content.highlights : [],
        colors: content?.colors || { primary: '#0f766e', accent: '#f59e0b' },
        socials: content?.socials || { instagram: '', youtube: '', facebook: '' },
        nav_menus: Array.isArray(content?.nav_menus) ? content.nav_menus.map((item) => ({ ...item, is_visible: item?.is_visible !== false, children_text: childrenToText(item?.children) })) : [],
        slider_items: Array.isArray(content?.slider_items) ? content.slider_items : [],
        hero_layout: content?.hero_layout || 'two-column',
        news_items: Array.isArray(content?.news_items) ? content.news_items : [],
    });
    const initialData = useMemo(() => ({ ...form.data }), []);

    const contentChecklist = useMemo(() => {
        const checks = [
            { label: 'Nama kampus', ok: String(form.data.campus_name || '').trim().length >= 4 },
            { label: 'Hero title', ok: String(form.data.hero_title || '').trim().length >= 12 },
            { label: 'Hero subtitle', ok: String(form.data.hero_subtitle || '').trim().length >= 40 },
            { label: 'Menu navbar', ok: Array.isArray(form.data.nav_menus) && form.data.nav_menus.length >= 3 },
            { label: 'Slider informasi', ok: Array.isArray(form.data.slider_items) && form.data.slider_items.length >= 1 },
            { label: 'Program studi', ok: fromTextList(form.data.programs_text || '').length >= 3 },
            { label: 'Berita kampus', ok: Array.isArray(form.data.news_items) && form.data.news_items.length >= 3 },
            { label: 'Kontak email/telepon', ok: !!String(form.data.email || '').trim() || !!String(form.data.phone || '').trim() },
        ];
        const passed = checks.filter((item) => item.ok).length;
        return { checks, passed, total: checks.length };
    }, [form.data]);

    const save = () => {
        form.transform((data) => ({
            ...data,
            programs: fromTextList(data.programs_text),
            nav_menus: (data.nav_menus || []).map((item) => ({
                label: item?.label || '',
                url: item?.url || '',
                is_visible: item?.is_visible !== false,
                children: childrenFromText(item?.children_text || ''),
            })),
        })).put(route('settings.landing-page.update'));
    };

    const applyQuickTemplate = (key) => {
        const tpl = quickTemplates[key];
        if (!tpl) return;
        form.setData((prev) => ({
            ...prev,
            campus_name: tpl.campus_name,
            tagline: tpl.tagline,
            hero_title: tpl.hero_title,
            hero_subtitle: tpl.hero_subtitle,
            hero_layout: tpl.hero_layout || prev.hero_layout,
            hero_image_url: tpl.hero_image_url || prev.hero_image_url,
            about_title: tpl.about_title,
            about_body: tpl.about_body,
            address: tpl.address || prev.address,
            email: tpl.email || prev.email,
            phone: tpl.phone || prev.phone,
            whatsapp: tpl.whatsapp || prev.whatsapp,
            cta_primary_label: tpl.cta_primary_label || prev.cta_primary_label,
            cta_primary_url: tpl.cta_primary_url || prev.cta_primary_url,
            cta_secondary_label: tpl.cta_secondary_label || prev.cta_secondary_label,
            cta_secondary_url: tpl.cta_secondary_url || prev.cta_secondary_url,
            colors: tpl.colors || prev.colors,
            stats: tpl.stats || prev.stats,
            programs_text: Array.isArray(tpl.programs) ? tpl.programs.join('\n') : prev.programs_text,
            highlights: tpl.highlights || prev.highlights,
            nav_menus: tpl.nav_menus || prev.nav_menus,
            slider_items: tpl.slider_items || prev.slider_items,
            news_items: tpl.news_items || prev.news_items,
        }));
    };

    const applyAndSaveTemplate = (key) => {
        const tpl = quickTemplates[key];
        if (!tpl) return;
        const nextData = {
            ...form.data,
            campus_name: tpl.campus_name,
            tagline: tpl.tagline,
            hero_title: tpl.hero_title,
            hero_subtitle: tpl.hero_subtitle,
            hero_layout: tpl.hero_layout || form.data.hero_layout,
            hero_image_url: tpl.hero_image_url || form.data.hero_image_url,
            about_title: tpl.about_title,
            about_body: tpl.about_body,
            address: tpl.address || form.data.address,
            email: tpl.email || form.data.email,
            phone: tpl.phone || form.data.phone,
            whatsapp: tpl.whatsapp || form.data.whatsapp,
            cta_primary_label: tpl.cta_primary_label || form.data.cta_primary_label,
            cta_primary_url: tpl.cta_primary_url || form.data.cta_primary_url,
            cta_secondary_label: tpl.cta_secondary_label || form.data.cta_secondary_label,
            cta_secondary_url: tpl.cta_secondary_url || form.data.cta_secondary_url,
            colors: tpl.colors || form.data.colors,
            stats: tpl.stats || form.data.stats,
            programs_text: Array.isArray(tpl.programs) ? tpl.programs.join('\n') : form.data.programs_text,
            highlights: tpl.highlights || form.data.highlights,
            nav_menus: tpl.nav_menus || form.data.nav_menus,
            slider_items: tpl.slider_items || form.data.slider_items,
            news_items: tpl.news_items || form.data.news_items,
        };
        form.setData(nextData);
        form.transform(() => ({
            ...nextData,
            programs: fromTextList(nextData.programs_text),
            nav_menus: (nextData.nav_menus || []).map((item) => ({
                label: item?.label || '',
                url: item?.url || '',
                is_visible: item?.is_visible !== false,
                children: childrenFromText(item?.children_text || ''),
            })),
        })).put(route('settings.landing-page.update'));
    };

    const resetToInitial = () => {
        form.setData({ ...initialData });
    };

    const updateStat = (index, key, value) => {
        const next = [...form.data.stats];
        next[index] = { ...next[index], [key]: value };
        form.setData('stats', next);
    };

    const updateHighlight = (index, key, value) => {
        const next = [...form.data.highlights];
        next[index] = { ...next[index], [key]: value };
        form.setData('highlights', next);
    };

    const updateNavMenu = (index, key, value) => {
        const next = [...form.data.nav_menus];
        next[index] = { ...next[index], [key]: value };
        form.setData('nav_menus', next);
    };

    const addNavMenu = () => {
        form.setData('nav_menus', [...form.data.nav_menus, { label: '', url: '', children_text: '', is_visible: true }]);
    };

    const removeNavMenu = (index) => {
        form.setData('nav_menus', form.data.nav_menus.filter((_, idx) => idx !== index));
    };

    const moveNavMenu = (index, direction) => {
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= form.data.nav_menus.length) return;
        const next = [...form.data.nav_menus];
        const current = next[index];
        next[index] = next[nextIndex];
        next[nextIndex] = current;
        form.setData('nav_menus', next);
    };

    const updateSlider = (index, key, value) => {
        const next = [...form.data.slider_items];
        next[index] = { ...next[index], [key]: value };
        form.setData('slider_items', next);
    };

    const addSlider = () => {
        form.setData('slider_items', [...form.data.slider_items, { title: '', subtitle: '', image_url: '', cta_label: '', cta_url: '' }]);
    };

    const removeSlider = (index) => {
        form.setData('slider_items', form.data.slider_items.filter((_, idx) => idx !== index));
    };

    const updateNews = (index, key, value) => {
        const next = [...form.data.news_items];
        next[index] = { ...next[index], [key]: value };
        form.setData('news_items', next);
    };

    const addNews = () => {
        form.setData('news_items', [...form.data.news_items, { title: '', date: '', excerpt: '', url: '' }]);
    };

    const removeNews = (index) => {
        form.setData('news_items', form.data.news_items.filter((_, idx) => idx !== index));
    };

    const uploadSliderImage = (index, file) => {
        if (!file) return;
        const uploadForm = new FormData();
        uploadForm.append('image', file);
        uploadForm.append('target', 'slider');
        router.post(route('settings.landing-page.upload-image'), uploadForm, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const uploadedUrl = page.props?.flash?.landing_uploaded_image_url;
                if (uploadedUrl) {
                    updateSlider(index, 'image_url', uploadedUrl);
                }
            },
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Landing Page Kampus" />

            <div className="space-y-5">
                <section className="panel overflow-hidden p-0">
                    <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
                        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.20),_transparent_54%),linear-gradient(130deg,_#ecfeff,_#f8fafc)] px-5 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Website Profile</p>
                            <h3 className="mt-2 text-xl font-black text-slate-900">Landing Page Builder</h3>
                            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
                                Kelola konten utama website kampus agar tampil premium, konsisten, dan siap konversi untuk PMB.
                            </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 bg-white px-5 py-5">
                            <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-outline">
                                Preview Landing
                            </a>
                            <button type="button" className="btn-primary" onClick={save} disabled={form.processing || !canPublish}>
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </section>

                {flash?.success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}

                <section className="panel p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Kesiapan Publish</h3>
                            <p className="mt-1 text-xs text-slate-500">Checklist kualitas konten untuk landing page production-ready.</p>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {contentChecklist.passed}/{contentChecklist.total} lengkap
                        </div>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {contentChecklist.checks.map((item) => (
                            <div key={item.label} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${item.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                {item.ok ? 'OK' : 'Perlu cek'}: {item.label}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" className="btn-outline" onClick={() => applyQuickTemplate('islami')}>Template Kampus Islami</button>
                        <button type="button" className="btn-outline" onClick={() => applyQuickTemplate('modern')}>Template Kampus Modern</button>
                        <button type="button" className="btn-primary" onClick={() => applyAndSaveTemplate('islami')} disabled={form.processing}>Terapkan + Simpan (Islami)</button>
                        <button type="button" className="btn-primary" onClick={() => applyAndSaveTemplate('modern')} disabled={form.processing}>Terapkan + Simpan (Modern)</button>
                        <button type="button" className="btn-outline" onClick={resetToInitial}>Reset ke Data Awal</button>
                    </div>
                </section>

                <section className="panel p-5">
                    <h3 className="text-sm font-bold text-slate-900">Identitas & Hero</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input className="form-input" placeholder="Nama Kampus" value={form.data.campus_name} onChange={(e) => form.setData('campus_name', e.target.value)} />
                        <input className="form-input" placeholder="Tagline Kampus" value={form.data.tagline} onChange={(e) => form.setData('tagline', e.target.value)} />
                        <input className="form-input md:col-span-2" placeholder="Judul Hero" value={form.data.hero_title} onChange={(e) => form.setData('hero_title', e.target.value)} />
                        <textarea className="form-input min-h-[110px] md:col-span-2" placeholder="Deskripsi Hero" value={form.data.hero_subtitle} onChange={(e) => form.setData('hero_subtitle', e.target.value)} />
                        <input className="form-input md:col-span-2" placeholder="URL Gambar Hero / Logo" value={form.data.hero_image_url} onChange={(e) => form.setData('hero_image_url', e.target.value)} />
                        <select className="form-input md:col-span-2" value={form.data.hero_layout} onChange={(e) => form.setData('hero_layout', e.target.value)}>
                            <option value="two-column">Hero 2 Kolom</option>
                            <option value="one-column">Hero 1 Kolom</option>
                        </select>
                    </div>
                </section>

                <section className="panel p-5">
                    <h3 className="text-sm font-bold text-slate-900">Tentang & Kontak</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input className="form-input md:col-span-2" placeholder="Judul Tentang Kampus" value={form.data.about_title} onChange={(e) => form.setData('about_title', e.target.value)} />
                        <textarea className="form-input min-h-[110px] md:col-span-2" placeholder="Profil singkat kampus" value={form.data.about_body} onChange={(e) => form.setData('about_body', e.target.value)} />
                        <textarea className="form-input min-h-[88px] md:col-span-2" placeholder="Alamat kampus" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                        <input className="form-input" placeholder="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                        <input className="form-input" placeholder="Telepon" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                        <input className="form-input" placeholder="WhatsApp (628xxx)" value={form.data.whatsapp} onChange={(e) => form.setData('whatsapp', e.target.value)} />
                    </div>
                </section>

                <section className="panel p-5">
                    <h3 className="text-sm font-bold text-slate-900">CTA, Program, dan Warna</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input className="form-input" placeholder="Label CTA Utama" value={form.data.cta_primary_label} onChange={(e) => form.setData('cta_primary_label', e.target.value)} />
                        <input className="form-input" placeholder="URL CTA Utama" value={form.data.cta_primary_url} onChange={(e) => form.setData('cta_primary_url', e.target.value)} />
                        <input className="form-input" placeholder="Label CTA Kedua" value={form.data.cta_secondary_label} onChange={(e) => form.setData('cta_secondary_label', e.target.value)} />
                        <input className="form-input" placeholder="URL CTA Kedua" value={form.data.cta_secondary_url} onChange={(e) => form.setData('cta_secondary_url', e.target.value)} />
                        <textarea className="form-input min-h-[140px] md:col-span-2" placeholder={'Daftar Program (1 baris 1 item)\nContoh:\nPendidikan Agama Islam'} value={form.data.programs_text} onChange={(e) => form.setData('programs_text', e.target.value)} />
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Warna Primer</label>
                            <input type="color" className="h-10 w-full rounded-lg border border-slate-200" value={form.data.colors?.primary || '#0f766e'} onChange={(e) => form.setData('colors', { ...(form.data.colors || {}), primary: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Warna Aksen</label>
                            <input type="color" className="h-10 w-full rounded-lg border border-slate-200" value={form.data.colors?.accent || '#f59e0b'} onChange={(e) => form.setData('colors', { ...(form.data.colors || {}), accent: e.target.value })} />
                        </div>
                    </div>
                </section>

                <section className="panel p-5">
                    <h3 className="text-sm font-bold text-slate-900">Menu Navbar</h3>
                    <p className="mt-1 text-xs text-slate-500">Atur menu yang tampil di navbar landing page.</p>
                    <div className="mt-4 space-y-3">
                        {form.data.nav_menus.map((item, index) => (
                            <div key={`menu-${index}`} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_auto]">
                                <input className="form-input" placeholder="Label menu" value={item?.label || ''} onChange={(e) => updateNavMenu(index, 'label', e.target.value)} />
                                <input className="form-input" placeholder="https://..." value={item?.url || ''} onChange={(e) => updateNavMenu(index, 'url', e.target.value)} />
                                <div className="flex flex-wrap items-center gap-1">
                                    <button type="button" className="btn-outline px-3" onClick={() => moveNavMenu(index, 'up')} disabled={index === 0}>Up</button>
                                    <button type="button" className="btn-outline px-3" onClick={() => moveNavMenu(index, 'down')} disabled={index === form.data.nav_menus.length - 1}>Down</button>
                                    <button type="button" className="btn-outline" onClick={() => removeNavMenu(index)}>Hapus</button>
                                </div>
                                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 md:col-span-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300"
                                        checked={item?.is_visible !== false}
                                        onChange={(e) => updateNavMenu(index, 'is_visible', e.target.checked)}
                                    />
                                    Tampilkan menu ini di navbar publik
                                </label>
                                <textarea className="form-input md:col-span-3 min-h-[70px]" placeholder={'Submenu (opsional) format per baris: Label|URL\nContoh:\nVisi Misi|https://kampus.ac.id/visi'} value={item?.children_text || ''} onChange={(e) => updateNavMenu(index, 'children_text', e.target.value)} />
                            </div>
                        ))}
                    </div>
                    <button type="button" className="btn-outline mt-3" onClick={addNavMenu}>Tambah Menu</button>
                </section>

                <section className="panel p-5">
                    <h3 className="text-sm font-bold text-slate-900">Slider Informasi Kampus</h3>
                    <p className="mt-1 text-xs text-slate-500">Slider utama di bawah hero, bisa berisi pengumuman/promo/informasi akademik.</p>
                    <div className="mt-4 space-y-3">
                        {form.data.slider_items.map((item, index) => (
                            <div key={`slider-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="grid gap-2 md:grid-cols-2">
                                    <input className="form-input md:col-span-2" placeholder="Judul slide" value={item?.title || ''} onChange={(e) => updateSlider(index, 'title', e.target.value)} />
                                    <textarea className="form-input min-h-[80px] md:col-span-2" placeholder="Deskripsi singkat" value={item?.subtitle || ''} onChange={(e) => updateSlider(index, 'subtitle', e.target.value)} />
                                    <input className="form-input md:col-span-2" placeholder="URL gambar slide" value={item?.image_url || ''} onChange={(e) => updateSlider(index, 'image_url', e.target.value)} />
                                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="form-input md:col-span-2" onChange={(e) => uploadSliderImage(index, e.target.files?.[0])} />
                                    <input className="form-input" placeholder="Label CTA (opsional)" value={item?.cta_label || ''} onChange={(e) => updateSlider(index, 'cta_label', e.target.value)} />
                                    <input className="form-input" placeholder="URL CTA (opsional)" value={item?.cta_url || ''} onChange={(e) => updateSlider(index, 'cta_url', e.target.value)} />
                                </div>
                                <button type="button" className="btn-outline mt-2" onClick={() => removeSlider(index)}>Hapus Slide</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" className="btn-outline mt-3" onClick={addSlider}>Tambah Slide</button>
                </section>

                <section className="panel p-5">
                    <h3 className="text-sm font-bold text-slate-900">Berita Kampus</h3>
                    <p className="mt-1 text-xs text-slate-500">Daftar berita/informasi singkat yang tampil pada landing page.</p>
                    <div className="mt-4 space-y-3">
                        {form.data.news_items.map((item, index) => (
                            <div key={`news-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="grid gap-2 md:grid-cols-2">
                                    <input className="form-input md:col-span-2" placeholder="Judul berita" value={item?.title || ''} onChange={(e) => updateNews(index, 'title', e.target.value)} />
                                    <input className="form-input" placeholder="Tanggal (contoh: 12 Mei 2026)" value={item?.date || ''} onChange={(e) => updateNews(index, 'date', e.target.value)} />
                                    <input className="form-input" placeholder="URL berita (opsional)" value={item?.url || ''} onChange={(e) => updateNews(index, 'url', e.target.value)} />
                                    <textarea className="form-input min-h-[80px] md:col-span-2" placeholder="Ringkasan berita" value={item?.excerpt || ''} onChange={(e) => updateNews(index, 'excerpt', e.target.value)} />
                                </div>
                                <button type="button" className="btn-outline mt-2" onClick={() => removeNews(index)}>Hapus Berita</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" className="btn-outline mt-3" onClick={addNews}>Tambah Berita</button>
                </section>

                <section className="panel p-5">
                    <h3 className="text-sm font-bold text-slate-900">Statistik & Keunggulan</h3>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <div className="space-y-3">
                            {form.data.stats.map((item, index) => (
                                <div key={`stat-${index}`} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                                    <input className="form-input" placeholder="Label" value={item?.label || ''} onChange={(e) => updateStat(index, 'label', e.target.value)} />
                                    <input className="form-input" placeholder="Value" value={item?.value || ''} onChange={(e) => updateStat(index, 'value', e.target.value)} />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {form.data.highlights.map((item, index) => (
                                <div key={`highlight-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <input className="form-input" placeholder="Judul keunggulan" value={item?.title || ''} onChange={(e) => updateHighlight(index, 'title', e.target.value)} />
                                    <textarea className="form-input mt-2 min-h-[80px]" placeholder="Deskripsi singkat" value={item?.description || ''} onChange={(e) => updateHighlight(index, 'description', e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="panel p-5">
                    <h3 className="text-sm font-bold text-slate-900">Sosial Media</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <input className="form-input" placeholder="URL Instagram" value={form.data.socials?.instagram || ''} onChange={(e) => form.setData('socials', { ...(form.data.socials || {}), instagram: e.target.value })} />
                        <input className="form-input" placeholder="URL YouTube" value={form.data.socials?.youtube || ''} onChange={(e) => form.setData('socials', { ...(form.data.socials || {}), youtube: e.target.value })} />
                        <input className="form-input" placeholder="URL Facebook" value={form.data.socials?.facebook || ''} onChange={(e) => form.setData('socials', { ...(form.data.socials || {}), facebook: e.target.value })} />
                    </div>
                </section>

                {Object.keys(errors || {}).length > 0 ? (
                    <section className="panel border-rose-200 bg-rose-50 p-4">
                        <p className="text-xs font-bold text-rose-700">Periksa kembali input, masih ada field yang belum valid.</p>
                    </section>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}

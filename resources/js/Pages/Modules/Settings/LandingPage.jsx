import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

function toTextList(values = []) {
    return Array.isArray(values) ? values.join('\n') : '';
}

function fromTextList(text = '') {
    return String(text)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

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
    });

    const save = () => {
        form.transform((data) => ({
            ...data,
            programs: fromTextList(data.programs_text),
        })).put(route('settings.landing-page.update'));
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
                    <h3 className="text-sm font-bold text-slate-900">Identitas & Hero</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input className="form-input" placeholder="Nama Kampus" value={form.data.campus_name} onChange={(e) => form.setData('campus_name', e.target.value)} />
                        <input className="form-input" placeholder="Tagline Kampus" value={form.data.tagline} onChange={(e) => form.setData('tagline', e.target.value)} />
                        <input className="form-input md:col-span-2" placeholder="Judul Hero" value={form.data.hero_title} onChange={(e) => form.setData('hero_title', e.target.value)} />
                        <textarea className="form-input min-h-[110px] md:col-span-2" placeholder="Deskripsi Hero" value={form.data.hero_subtitle} onChange={(e) => form.setData('hero_subtitle', e.target.value)} />
                        <input className="form-input md:col-span-2" placeholder="URL Gambar Hero / Logo" value={form.data.hero_image_url} onChange={(e) => form.setData('hero_image_url', e.target.value)} />
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


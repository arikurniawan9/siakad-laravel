import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function safe(value, fallback = '-') {
    const text = String(value ?? '').trim();
    return text === '' ? fallback : text;
}

export default function Welcome({ auth, canLogin = true, canRegister = false, content = null }) {
    const primary = content?.colors?.primary || '#0f766e';
    const accent = content?.colors?.accent || '#f59e0b';
    const socials = content?.socials || {};
    const stats = Array.isArray(content?.stats) ? content.stats : [];
    const programs = Array.isArray(content?.programs) ? content.programs : [];
    const highlights = Array.isArray(content?.highlights) ? content.highlights : [];
    const navMenus = Array.isArray(content?.nav_menus) ? content.nav_menus.filter((item) => item?.is_visible !== false) : [];
    const sliderItems = Array.isArray(content?.slider_items) ? content.slider_items : [];
    const newsItems = Array.isArray(content?.news_items) ? content.news_items : [];
    const heroLayout = content?.hero_layout || 'two-column';
    const safeSliderItems = useMemo(() => (sliderItems.length ? sliderItems : [{
        title: 'Informasi Kampus',
        subtitle: 'Slider informasi kampus dapat diatur dari panel admin.',
        image_url: '/halaman utama.png',
        cta_label: '',
        cta_url: '',
    }]), [sliderItems]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [activeSection, setActiveSection] = useState('');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setActiveSlide((prev) => (prev + 1) % safeSliderItems.length), 5000);
        return () => clearInterval(timer);
    }, [safeSliderItems.length]);

    useEffect(() => {
        setMobileNavOpen(false);
    }, [activeSection]);

    useEffect(() => {
        const ids = ['profil', 'program', 'informasi', 'kontak', 'berita'];
        const onScroll = () => {
            const fromTop = window.scrollY + 120;
            let current = '';
            ids.forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.offsetTop <= fromTop) current = id;
            });
            setActiveSection(current);
        };
        onScroll();
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <Head title={safe(content?.campus_name, 'Landing Page Kampus')} />
            <div className="min-h-screen bg-slate-100 text-slate-900" style={{ '--brand-primary': primary, '--brand-accent': accent }}>
                <div className="bg-slate-900 text-slate-100">
                    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 lg:px-8">
                        <p>{safe(content?.email, 'admin@kampus.ac.id')}</p>
                        <p>Senin-Sabtu: 09.00-19.00 WIB</p>
                        <p>{safe(content?.address, 'Indonesia')}</p>
                    </div>
                </div>

                <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                            <div className="flex items-center gap-3">
                                <img src={safe(content?.hero_image_url, '/logostai.png')} alt="Logo" className="h-14 w-14 object-contain" />
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Website Resmi</p>
                                    <h1 className="text-lg font-black text-slate-900">{safe(content?.campus_name)}</h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden"
                                    onClick={() => setMobileNavOpen((prev) => !prev)}
                                    aria-label="Toggle menu"
                                >
                                    <span className="text-lg leading-none">{mobileNavOpen ? 'X' : '|||'}</span>
                                </button>
                                {auth?.user ? <Link href={route('dashboard')} className="btn-outline">Dashboard</Link> : null}
                                {!auth?.user && canLogin ? <Link href={route('login')} className="btn-outline">Masuk</Link> : null}
                                {!auth?.user && canRegister ? <Link href={route('register')} className="btn-primary">Daftar</Link> : null}
                            </div>
                        </div>
                        <nav className="hidden flex-wrap items-center gap-1 border-t border-slate-200 py-2 lg:flex">
                            {navMenus.map((menu, index) => (
                                <div key={`nav-${index}`} className="group relative">
                                    <a
                                        href={menu?.url || '#'}
                                        className={`block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100 ${String(menu?.url || '').includes(`#${activeSection}`) ? 'text-emerald-700' : 'text-slate-700'}`}
                                    >
                                        {safe(menu?.label)}
                                    </a>
                                    {Array.isArray(menu?.children) && menu.children.length > 0 ? (
                                        <div className="invisible absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                                            {menu.children.map((child, childIndex) => (
                                                <a key={`child-${index}-${childIndex}`} href={child?.url || '#'} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                                                    {safe(child?.label)}
                                                </a>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </nav>
                        {mobileNavOpen ? (
                            <nav className="border-t border-slate-200 py-3 lg:hidden">
                                <div className="space-y-1">
                                    {navMenus.map((menu, index) => (
                                        <div key={`m-nav-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                            <a href={menu?.url || '#'} className="block rounded-md px-2 py-1.5 text-sm font-semibold text-slate-800">
                                                {safe(menu?.label)}
                                            </a>
                                            {Array.isArray(menu?.children) && menu.children.length > 0 ? (
                                                <div className="mt-1 space-y-1 pl-2">
                                                    {menu.children.map((child, childIndex) => (
                                                        <a key={`m-child-${index}-${childIndex}`} href={child?.url || '#'} className="block rounded-md px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                                                            {safe(child?.label)}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </nav>
                        ) : null}
                    </div>
                </header>

                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <section className={`grid gap-5 ${heroLayout === 'one-column' ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.2fr_0.8fr]'}`}>
                        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="relative h-[340px] overflow-hidden">
                                {safeSliderItems.map((slide, index) => (
                                    <img
                                        key={`slide-${index}`}
                                        src={slide?.image_url || '/halaman utama.png'}
                                        alt={slide?.title || 'slide'}
                                        className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${activeSlide === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                                    />
                                ))}
                            </div>
                            <div className="p-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Selamat Datang</p>
                                <h2 className="mt-2 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">{safe(safeSliderItems[activeSlide]?.title)}</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{safe(safeSliderItems[activeSlide]?.subtitle)}</p>
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    {safeSliderItems[activeSlide]?.cta_label && safeSliderItems[activeSlide]?.cta_url ? (
                                        <a href={safeSliderItems[activeSlide]?.cta_url} className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
                                            {safeSliderItems[activeSlide]?.cta_label}
                                        </a>
                                    ) : null}
                                    <a href={safe(content?.cta_primary_url, '#')} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-900" style={{ backgroundColor: 'var(--brand-accent)' }}>
                                        {safe(content?.cta_primary_label, 'Daftar PMB')}
                                    </a>
                                    <div className="ml-auto flex gap-1">
                                        {safeSliderItems.map((_, index) => (
                                            <button key={`dot-${index}`} type="button" className={`h-2.5 w-7 rounded-full ${activeSlide === index ? 'bg-slate-800' : 'bg-slate-300'}`} onClick={() => setActiveSlide(index)} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </article>
                        <article className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${heroLayout === 'one-column' ? 'hidden' : ''}`}>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{safe(content?.tagline)}</p>
                            <h3 className="mt-2 text-2xl font-black leading-tight text-slate-900">{safe(content?.hero_title)}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{safe(content?.hero_subtitle)}</p>
                            <div className="mt-5 grid gap-2 sm:grid-cols-2">
                                {stats.map((item, index) => (
                                    <div key={`stat-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{safe(item?.label)}</p>
                                        <p className="mt-1 text-xl font-black" style={{ color: 'var(--brand-primary)' }}>{safe(item?.value)}</p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </section>

                    <section id="profil" className="mt-5 grid gap-5 lg:grid-cols-2">
                        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xl font-black text-slate-900">{safe(content?.about_title)}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{safe(content?.about_body)}</p>
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                <p>{safe(content?.address)}</p>
                                <p className="mt-1">Email: {safe(content?.email)}</p>
                                <p className="mt-1">Telepon: {safe(content?.phone)}</p>
                                <p className="mt-1">WhatsApp: {safe(content?.whatsapp)}</p>
                            </div>
                        </article>
                        <article id="program" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xl font-black text-slate-900">Program Studi</h3>
                            <div className="mt-4 grid gap-2">
                                {programs.map((program, index) => (
                                    <div key={`program-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{safe(program)}</div>
                                ))}
                            </div>
                        </article>
                    </section>

                    <section id="informasi" className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900">Apa Yang Kami Tawarkan</h3>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {highlights.map((item, index) => (
                                <article key={`highlight-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>{safe(item?.title)}</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{safe(item?.description)}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section id="berita" className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900">Blog & Berita Kampus</h3>
                        <p className="mt-1 text-sm text-slate-500">Dapatkan update terbaru seputar kegiatan dan informasi akademik.</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {newsItems.map((item, index) => (
                                <article key={`news-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{safe(item?.date)}</p>
                                    <h4 className="mt-2 text-base font-bold text-slate-900">{safe(item?.title)}</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{safe(item?.excerpt)}</p>
                                    {item?.url ? <a href={item.url} className="mt-3 inline-block text-sm font-bold text-emerald-700 hover:text-emerald-800">Read More</a> : null}
                                </article>
                            ))}
                        </div>
                    </section>

                    <footer id="kontak" className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                            <p>© {new Date().getFullYear()} {safe(content?.campus_name)}. All rights reserved.</p>
                            <div className="flex flex-wrap gap-3">
                                {socials?.instagram ? <a href={socials.instagram} target="_blank" rel="noreferrer" className="hover:text-slate-900">Instagram</a> : null}
                                {socials?.youtube ? <a href={socials.youtube} target="_blank" rel="noreferrer" className="hover:text-slate-900">YouTube</a> : null}
                                {socials?.facebook ? <a href={socials.facebook} target="_blank" rel="noreferrer" className="hover:text-slate-900">Facebook</a> : null}
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}

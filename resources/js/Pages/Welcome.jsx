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
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setActiveSlide((prev) => (prev + 1) % safeSliderItems.length), 6000);
        return () => clearInterval(timer);
    }, [safeSliderItems.length]);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 20);
            
            const ids = ['profil', 'program', 'informasi', 'berita', 'kontak'];
            const fromTop = window.scrollY + 150;
            let current = '';
            ids.forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.offsetTop <= fromTop) current = id;
            });
            setActiveSection(current);
        };
        window.addEventListener('scroll', onScroll);
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <Head title={safe(content?.campus_name, 'SIAKAD STAI')} />
            
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900" style={{ '--brand-primary': primary, '--brand-accent': accent }}>
                
                {/* Navbar */}
                <header 
                    className={`fixed top-0 z-50 w-full transition-all duration-500 ${
                        scrolled 
                        ? 'bg-white/80 py-3 shadow-xl shadow-slate-900/5 backdrop-blur-xl' 
                        : 'bg-transparent py-5'
                    }`}
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="group relative">
                                    <div className="absolute -inset-2 rounded-full bg-emerald-500/20 opacity-0 blur-xl transition duration-500 group-hover:opacity-100"></div>
                                    <img src={safe(content?.hero_image_url, '/logostai.png')} alt="Logo" className="relative h-12 w-12 object-contain" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className={`text-xl font-black tracking-tighter transition-colors duration-500 ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>
                                        {safe(content?.campus_name)}
                                    </h1>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Premium Academic System</p>
                                </div>
                            </div>

                            {/* Desktop Nav */}
                            <nav className="hidden items-center gap-1 lg:flex">
                                {navMenus.map((menu, idx) => (
                                    <div key={idx} className="group relative">
                                        <a 
                                            href={menu?.url || '#'} 
                                            className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${
                                                activeSection === (menu?.url || '').replace('/#', '') 
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                            }`}
                                        >
                                            {safe(menu?.label)}
                                        </a>
                                        {menu.children?.length > 0 && (
                                            <div className="invisible absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-2xl ring-1 ring-slate-900/5 transition-all duration-300 group-hover:visible group-hover:opacity-100">
                                                {menu.children.map((child, cidx) => (
                                                    <a key={cidx} href={child.url} className="block rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
                                                        {safe(child.label)}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>

                            <div className="flex items-center gap-3">
                                {auth?.user ? (
                                    <Link href={route('dashboard')} className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-800 active:scale-95">
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={route('login')} className="hidden text-sm font-bold text-slate-600 transition hover:text-emerald-700 sm:block">Masuk</Link>
                                        <Link href={route('public.daftar-pmb')} className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95">
                                            Daftar Sekarang
                                        </Link>
                                    </>
                                )}
                                <button 
                                    onClick={() => setMobileNavOpen(!mobileNavOpen)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 lg:hidden"
                                >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d={mobileNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`absolute inset-x-4 top-20 overflow-hidden rounded-3xl border border-slate-100 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-500 lg:hidden ${mobileNavOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                        <div className="space-y-1">
                            {navMenus.map((menu, idx) => (
                                <div key={idx}>
                                    <a href={menu.url} className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => setMobileNavOpen(false)}>
                                        {safe(menu.label)}
                                    </a>
                                    {menu.children?.map((child, cidx) => (
                                        <a key={cidx} href={child.url} className="block rounded-2xl px-8 py-2 text-xs font-bold text-slate-500 hover:text-emerald-700" onClick={() => setMobileNavOpen(false)}>
                                            {safe(child.label)}
                                        </a>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                <main>
                    {/* Hero Section */}
                    <section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-48">
                        {/* Mesh Gradients */}
                        <div className="absolute -top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-emerald-400/20 blur-[120px]"></div>
                        <div className="absolute right-[5%] top-[5%] h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-[100px]"></div>
                        
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid items-center gap-16 lg:grid-cols-2">
                                <div className="relative z-10 text-center lg:text-left">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                        {safe(content?.tagline, 'Terakreditasi & Modern')}
                                    </div>
                                    <h2 className="mt-8 text-5xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-6xl xl:text-7xl">
                                        {safe(content?.hero_title).split(' ').map((word, i) => (
                                            <span key={i} className={i % 3 === 2 ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500' : ''}>
                                                {word}{' '}
                                            </span>
                                        ))}
                                    </h2>
                                    <p className="mt-8 text-lg leading-relaxed text-slate-600 lg:max-w-xl">
                                        {safe(content?.hero_subtitle)}
                                    </p>
                                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                                        <a href={safe(content?.cta_primary_url, '#')} className="group relative flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-slate-900/20 transition hover:bg-slate-800 active:scale-95">
                                            {safe(content?.cta_primary_label)}
                                            <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </a>
                                        <a href={safe(content?.cta_secondary_url, '#')} className="flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition hover:bg-slate-50 active:scale-95">
                                            {safe(content?.cta_secondary_label)}
                                        </a>
                                    </div>

                                    {/* Small Stats */}
                                    <div className="mt-16 grid grid-cols-2 gap-8 border-t border-slate-200 pt-10 sm:grid-cols-4">
                                        {stats.slice(0, 4).map((stat, i) => (
                                            <div key={i}>
                                                <p className="text-3xl font-black tracking-tighter text-slate-900">{safe(stat.value)}</p>
                                                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{safe(stat.label)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative lg:ml-10">
                                    <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-emerald-500/10 to-amber-500/10 blur-3xl"></div>
                                    <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-slate-200 shadow-2xl ring-8 ring-white/50">
                                        {safeSliderItems.map((slide, i) => (
                                            <div key={i} className={`absolute inset-0 transition-all duration-1000 ${activeSlide === i ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
                                                <img src={slide.image_url} alt={slide.title} className="h-full w-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                                                <div className="absolute bottom-10 left-10 right-10">
                                                    <h4 className="text-2xl font-black text-white">{safe(slide.title)}</h4>
                                                    <p className="mt-2 text-sm text-slate-200 line-clamp-2">{safe(slide.subtitle)}</p>
                                                    {slide.cta_label && (
                                                        <a href={slide.cta_url} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300">
                                                            {slide.cta_label}
                                                            <span>→</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Slider Nav */}
                                        <div className="absolute bottom-8 right-8 flex gap-1.5">
                                            {safeSliderItems.map((_, i) => (
                                                <button key={i} onClick={() => setActiveSlide(i)} className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-8 bg-emerald-500' : 'w-2 bg-white/40 hover:bg-white/60'}`}></button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Floating Element */}
                                    <div className="absolute -bottom-6 -left-6 hidden animate-bounce-slow rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-100 lg:block">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">Kurikulum 2026</p>
                                                <p className="text-xs font-bold text-slate-500">Berbasis Industri</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section - Bento Grid */}
                    <section id="informasi" className="bg-slate-900 py-24 lg:py-32">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h3 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Mengapa Memilih Kami?</h3>
                                <p className="mt-4 text-lg text-slate-400">Standar pendidikan tinggi dengan ekosistem digital terintegrasi.</p>
                            </div>
                            <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {highlights.map((h, i) => (
                                    <div key={i} className={`group relative overflow-hidden rounded-[32px] bg-slate-800 p-10 transition hover:-translate-y-2 ${i === 0 ? 'lg:col-span-2' : ''}`}>
                                        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition group-hover:bg-emerald-500/20"></div>
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700 text-emerald-500">
                                            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                                                <path d="M12 1L3 5v6c0 5.25 3.84 10.74 9 12 5.16-1.26 9-6.75 9-12V5l-9-4z" />
                                            </svg>
                                        </div>
                                        <h4 className="mt-8 text-xl font-black text-white">{safe(h.title)}</h4>
                                        <p className="mt-4 leading-relaxed text-slate-400">{safe(h.description)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Academic Section */}
                    <section id="profil" className="py-24 lg:py-32">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
                                <div className="order-2 lg:order-1">
                                    <div className="relative aspect-video overflow-hidden rounded-[40px] shadow-2xl">
                                        <img src="/halaman utama.png" alt="About" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-emerald-900/10"></div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-600">{safe(content?.about_title, 'Tentang Kampus')}</h3>
                                    <p className="mt-6 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                                        Berkomitmen Mencetak Generasi Qur'ani dan Kompeten
                                    </p>
                                    <div className="mt-8 space-y-6 text-lg leading-relaxed text-slate-600">
                                        {safe(content?.about_body).split('\n').map((para, i) => (
                                            <p key={i}>{para}</p>
                                        ))}
                                    </div>
                                    <div id="program" className="mt-12 grid gap-4">
                                        <p className="text-sm font-black text-slate-900">Program Unggulan:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {programs.map((p, i) => (
                                                <span key={i} className="rounded-full bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                                                    {safe(p)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* News Section */}
                    <section id="berita" className="bg-slate-50 py-24 lg:py-32">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex items-end justify-between gap-6">
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Info & Kegiatan</h3>
                                    <p className="mt-3 text-lg text-slate-500">Update terbaru seputar dunia kampus kami.</p>
                                </div>
                                <a href="#" className="hidden text-sm font-bold text-emerald-600 hover:text-emerald-700 lg:block">Lihat Semua Berita →</a>
                            </div>
                            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {newsItems.map((news, i) => (
                                    <article key={i} className="group flex flex-col overflow-hidden rounded-[32px] bg-white shadow-xl shadow-slate-200/50 transition hover:-translate-y-2">
                                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                                            <img src="/halaman utama.png" alt="News" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                                            <div className="absolute left-6 top-6 rounded-2xl bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 backdrop-blur shadow-lg">
                                                {safe(news.date)}
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col p-8">
                                            <h4 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                                                {safe(news.title)}
                                            </h4>
                                            <p className="mt-4 text-sm leading-relaxed text-slate-500 line-clamp-3">
                                                {safe(news.excerpt)}
                                            </p>
                                            <div className="mt-auto pt-8">
                                                <a href={news.url || '#'} className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-emerald-600">
                                                    Baca Selengkapnya
                                                    <span className="h-px w-8 bg-slate-200 group-hover:bg-emerald-400 transition-colors"></span>
                                                </a>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
                        <div className="relative overflow-hidden rounded-[48px] bg-emerald-600 px-8 py-20 text-center lg:py-28">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/40 via-transparent to-transparent"></div>
                            <div className="relative z-10 mx-auto max-w-2xl">
                                <h3 className="text-4xl font-black text-white sm:text-5xl">Sudah Siap Memilih Masa Depan?</h3>
                                <p className="mt-8 text-lg font-medium text-emerald-50">
                                    Bergabunglah dengan ribuan mahasiswa lainnya dan dapatkan pengalaman pendidikan yang transformatif di STAI SIAKAD.
                                </p>
                                <div className="mt-12 flex flex-wrap justify-center gap-4">
                                    <Link href={route('public.daftar-pmb')} className="rounded-2xl bg-white px-10 py-5 text-base font-bold text-emerald-700 shadow-2xl transition hover:bg-emerald-50 active:scale-95">
                                        Daftar Sekarang
                                    </Link>
                                    <Link href={route('login')} className="rounded-2xl bg-emerald-700 px-10 py-5 text-base font-bold text-white shadow-2xl ring-1 ring-emerald-500 transition hover:bg-emerald-800 active:scale-95">
                                        Hubungi Kami
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer id="kontak" className="bg-slate-900 pb-12 pt-24 text-slate-400">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-12 lg:grid-cols-4">
                            <div className="lg:col-span-2">
                                <div className="flex items-center gap-4">
                                    <img src={safe(content?.hero_image_url, '/logostai.png')} alt="Logo" className="h-14 w-14 brightness-0 invert" />
                                    <div>
                                        <h5 className="text-xl font-black tracking-tight text-white">{safe(content?.campus_name)}</h5>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">Premium Academic System</p>
                                    </div>
                                </div>
                                <p className="mt-8 max-w-md text-sm leading-relaxed">
                                    Sistem Informasi Akademik Terpadu yang dirancang untuk mendukung visi kampus dalam mencetak lulusan unggul dan berakhlak mulia di era digital.
                                </p>
                                <div className="mt-10 flex gap-4">
                                    {Object.entries(socials).map(([key, url]) => url && (
                                        <a key={key} href={url} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white transition hover:bg-emerald-600">
                                            <span className="text-xs font-bold capitalize">{key[0]}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h6 className="text-sm font-black uppercase tracking-widest text-white">Hubungi Kami</h6>
                                <ul className="mt-8 space-y-4 text-sm">
                                    <li className="flex gap-3">
                                        <span className="text-emerald-500">📍</span>
                                        {safe(content?.address)}
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-emerald-500">📧</span>
                                        {safe(content?.email)}
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-emerald-500">📞</span>
                                        {safe(content?.phone)}
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h6 className="text-sm font-black uppercase tracking-widest text-white">Tautan Cepat</h6>
                                <ul className="mt-8 space-y-4 text-sm font-bold">
                                    {navMenus.slice(0, 5).map((menu, i) => (
                                        <li key={i}>
                                            <a href={menu.url} className="transition hover:text-emerald-500">{safe(menu.label)}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="mt-20 border-t border-slate-800 pt-8 text-center text-xs font-bold uppercase tracking-widest">
                            <p>© {new Date().getFullYear()} {safe(content?.campus_name)}. Dikelola secara profesional.</p>
                        </div>
                    </div>
                </footer>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
            ` }} />
        </>
    );
}

import { Head, Link } from '@inertiajs/react';

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

    return (
        <>
            <Head title={safe(content?.campus_name, 'Landing Page Kampus')} />
            <div className="min-h-screen bg-slate-950 text-white" style={{ '--brand-primary': primary, '--brand-accent': accent }}>
                <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.26),transparent_32%),radial-gradient(circle_at_85%_0%,rgba(245,158,11,0.2),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(6,182,212,0.2),transparent_36%)]" />
                <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <header className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Official Website</p>
                                <h1 className="text-lg font-black">{safe(content?.campus_name)}</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                {auth?.user ? <Link href={route('dashboard')} className="btn-outline border-white/30 text-white hover:bg-white/10">Dashboard</Link> : null}
                                {!auth?.user && canLogin ? <Link href={route('login')} className="rounded-xl px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/35 hover:bg-white/10">Masuk</Link> : null}
                                {!auth?.user && canRegister ? <Link href={route('register')} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-900" style={{ backgroundColor: 'var(--brand-accent)' }}>Daftar</Link> : null}
                            </div>
                        </div>
                    </header>

                    <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
                            <p className="text-xs uppercase tracking-[0.25em] text-white/60">{safe(content?.tagline)}</p>
                            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">{safe(content?.hero_title)}</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">{safe(content?.hero_subtitle)}</p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <a href={safe(content?.cta_primary_url, '#')} className="rounded-xl px-5 py-3 text-sm font-bold text-slate-900" style={{ backgroundColor: 'var(--brand-accent)' }}>
                                    {safe(content?.cta_primary_label, 'Daftar Sekarang')}
                                </a>
                                <a href={safe(content?.cta_secondary_url, '#')} className="rounded-xl border border-white/35 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                                    {safe(content?.cta_secondary_label, 'Lihat Informasi')}
                                </a>
                            </div>
                            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {stats.map((item, index) => (
                                    <div key={`stat-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">{safe(item?.label)}</p>
                                        <p className="mt-1 text-xl font-black" style={{ color: 'var(--brand-accent)' }}>{safe(item?.value)}</p>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/15 to-white/5 p-6">
                            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: 'var(--brand-primary)', opacity: 0.35 }} />
                            <div className="relative">
                                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-white/20 bg-black/20 shadow-2xl shadow-black/30">
                                    <img src={safe(content?.hero_image_url, '/logostai.png')} alt="Logo kampus" className="h-36 w-36 object-contain" />
                                </div>
                                <p className="mt-5 text-center text-sm text-white/75">Sistem Akademik Terintegrasi untuk PMB, Keuangan, KRS, KHS, dan pelaporan kampus.</p>
                            </div>
                        </article>
                    </section>

                    <section className="mt-5 grid gap-5 lg:grid-cols-2">
                        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
                            <h3 className="text-xl font-black">{safe(content?.about_title)}</h3>
                            <p className="mt-3 text-sm leading-7 text-white/80">{safe(content?.about_body)}</p>
                            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                                <p>{safe(content?.address)}</p>
                                <p className="mt-1">Email: {safe(content?.email)}</p>
                                <p className="mt-1">Telepon: {safe(content?.phone)}</p>
                                <p className="mt-1">WhatsApp: {safe(content?.whatsapp)}</p>
                            </div>
                        </article>

                        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
                            <h3 className="text-xl font-black">Program Unggulan</h3>
                            <div className="mt-4 grid gap-2">
                                {programs.map((program, index) => (
                                    <div key={`program-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium">
                                        {safe(program)}
                                    </div>
                                ))}
                            </div>
                        </article>
                    </section>

                    <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-xl font-black">Kenapa Memilih {safe(content?.campus_name)}</h3>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {highlights.map((item, index) => (
                                <article key={`highlight-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-sm font-bold" style={{ color: 'var(--brand-accent)' }}>{safe(item?.title)}</p>
                                    <p className="mt-2 text-sm leading-6 text-white/75">{safe(item?.description)}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <footer className="mt-5 rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
                            <p>© {new Date().getFullYear()} {safe(content?.campus_name)}. All rights reserved.</p>
                            <div className="flex flex-wrap gap-3">
                                {socials?.instagram ? <a href={socials.instagram} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a> : null}
                                {socials?.youtube ? <a href={socials.youtube} target="_blank" rel="noreferrer" className="hover:text-white">YouTube</a> : null}
                                {socials?.facebook ? <a href={socials.facebook} target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a> : null}
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}


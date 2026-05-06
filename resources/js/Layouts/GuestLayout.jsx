import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(14,116,144,0.25),transparent_28%),radial-gradient(circle_at_80%_90%,rgba(30,64,175,0.22),transparent_35%)]" />
            <div className="guest-grid-overlay absolute inset-0 opacity-35" />
            <div className="guest-noise-overlay absolute inset-0 opacity-15" />
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full border border-sky-300/20 bg-sky-500/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full border border-cyan-300/20 bg-cyan-500/10 blur-3xl" />

            <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-6 sm:px-5 sm:py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8">
                <section className="hidden lg:block motion-safe:animate-[guestFadeIn_500ms_ease-out]">
                    <Link href="/" className="flex min-h-[520px] flex-col items-center justify-center text-center">
                        <img src="/logostai.png" alt="Logo Kampus" className="h-52 w-52 object-contain drop-shadow-[0_20px_45px_rgba(56,189,248,0.35)]" />
                        <h1 className="mt-8 text-4xl font-black uppercase tracking-[0.12em] text-white">
                            STAI AL-ITTIHAD
                        </h1>
                    </Link>
                </section>

                <section className="w-full motion-safe:animate-[guestSlideIn_520ms_ease-out]">
                    {children}
                </section>
            </div>
        </div>
    );
}

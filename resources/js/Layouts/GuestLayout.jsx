import { Link } from '@inertiajs/react';
import ThemeToggle from '@/Components/ThemeToggle';
import useTheme from '@/hooks/useTheme';

export default function Guest({ children }) {
    const { theme, toggleTheme, ready } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            {ready && (
                <div className="absolute right-4 top-4 z-20">
                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </div>
            )}
            <div className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(14,116,144,0.25),transparent_28%),radial-gradient(circle_at_80%_90%,rgba(30,64,175,0.22),transparent_35%)]' : 'bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_80%_90%,rgba(125,211,252,0.16),transparent_35%)]'}`} />
            <div className={`guest-grid-overlay absolute inset-0 ${isDark ? 'opacity-35' : 'opacity-60'}`} />
            <div className={`guest-noise-overlay absolute inset-0 ${isDark ? 'opacity-15' : 'opacity-25'}`} />
            <div className={`absolute -left-24 top-20 h-72 w-72 rounded-full blur-3xl ${isDark ? 'border border-sky-300/20 bg-sky-500/10' : 'border border-sky-400/30 bg-sky-400/20'}`} />
            <div className={`absolute bottom-0 right-0 h-80 w-80 rounded-full blur-3xl ${isDark ? 'border border-cyan-300/20 bg-cyan-500/10' : 'border border-cyan-400/30 bg-cyan-300/20'}`} />

            <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-6 sm:px-5 sm:py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8">
                <section className="hidden lg:block motion-safe:animate-[guestFadeIn_500ms_ease-out]">
                    <Link href="/" className="flex min-h-[520px] flex-col items-center justify-center text-center">
                        <img src="/logostai.png" alt="Logo Kampus" className="h-52 w-52 object-contain drop-shadow-[0_20px_45px_rgba(56,189,248,0.35)]" />
                        <h1 className={`mt-8 text-4xl font-black uppercase tracking-[0.12em] ${isDark ? 'text-white' : 'text-slate-800'}`}>
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

import { useEffect, useRef, useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword, captchaQuestion }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        captcha: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [shake, setShake] = useState(false);
    const [captchaLockSeconds, setCaptchaLockSeconds] = useState(0);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const captchaRef = useRef(null);

    useEffect(() => {
        return () => {
            reset('password', 'captcha');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'));
    };

    useEffect(() => {
        const hasError = !!errors.email || !!errors.password || !!errors.captcha;
        if (!hasError) return;

        setShake(true);
        const timer = setTimeout(() => setShake(false), 420);

        if (errors.email && emailRef.current) {
            emailRef.current.focus();
        } else if (errors.password && passwordRef.current) {
            passwordRef.current.focus();
        } else if (errors.captcha && captchaRef.current) {
            captchaRef.current.focus();
        }

        return () => clearTimeout(timer);
    }, [errors.email, errors.password, errors.captcha]);

    useEffect(() => {
        const message = errors.captcha || '';
        const match = message.match(/(\d+)\s*detik/i);
        if (!match) return;

        setCaptchaLockSeconds(Number.parseInt(match[1], 10));
    }, [errors.captcha]);

    useEffect(() => {
        if (captchaLockSeconds <= 0) return;

        const timer = setInterval(() => {
            setCaptchaLockSeconds((prev) => (prev > 1 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [captchaLockSeconds]);

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className={`guest-xs-tight mx-auto w-full max-w-md rounded-3xl border border-slate-200/20 bg-slate-900/65 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur-xl motion-safe:animate-[guestFadeIn_420ms_ease-out] sm:p-7 ${shake ? 'motion-safe:animate-[guestShake_420ms_ease-in-out]' : ''}`}>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">Sign In</p>
                        <h2 className="mt-1 text-2xl font-black text-white">Portal Login</h2>
                    </div>
                    <img src="/logostai.png" alt="Logo STAI" className="h-10 w-10 rounded-xl border border-slate-200/20 bg-slate-800/60 p-1.5 object-contain" />
                </div>

                {status && <div className="mb-4 rounded-xl border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">{status}</div>}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="email" value="Email" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />

                        <TextInput
                            ref={emailRef}
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400"
                            placeholder="nama@kampus.ac.id"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Password" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />

                        <div className="relative">
                            <TextInput
                                ref={passwordRef}
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 pr-24 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400"
                                placeholder="Masukkan password"
                                autoComplete="current-password"
                                onKeyUp={(e) => setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'))}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-300/20 bg-slate-800/70 text-slate-200 hover:bg-slate-700/80"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                        <path d="M3.53 2.47a.75.75 0 10-1.06 1.06l2.06 2.06A12.3 12.3 0 001.3 12a12.25 12.25 0 002.52 3.44 12.77 12.77 0 003.33 2.51 10.95 10.95 0 004.85 1.2c1.72 0 3.33-.38 4.85-1.2 1.35-.73 2.47-1.57 3.33-2.51.75-.83 1.55-1.9 2.52-3.44a.75.75 0 000-.8 16.38 16.38 0 00-4.02-4.43l1.79 1.79a.75.75 0 101.06-1.06L3.53 2.47zM17.2 14.02l-1.6-1.6a3.75 3.75 0 01-3.98-3.98l-1.6-1.6c.53-.2 1.08-.3 1.68-.3a5.25 5.25 0 015.25 5.25c0 .6-.1 1.15-.3 1.68z" />
                                        <path d="M12 9.75a2.25 2.25 0 012.25 2.25c0 .2-.03.4-.08.58l-2.75-2.75c.18-.05.38-.08.58-.08z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                        <path d="M12 5.25c-3.9 0-7.45 2.33-10.7 6.75 3.25 4.42 6.8 6.75 10.7 6.75s7.45-2.33 10.7-6.75c-3.25-4.42-6.8-6.75-10.7-6.75zM12 16.5A4.5 4.5 0 1112 7.5a4.5 4.5 0 010 9z" />
                                        <path d="M12 14.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {capsLockOn && <p className="mt-2 text-[11px] font-semibold text-amber-300">Caps Lock aktif</p>}

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="captcha" value="Captcha Keamanan" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                        <div className="mt-2 flex items-center justify-between rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2">
                            <p className="text-sm font-bold tracking-[0.18em] text-cyan-100">{captchaQuestion ?? '------'}</p>
                            <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/25 bg-slate-800/70 text-slate-200 hover:bg-slate-700/80 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => router.get(route('login'), { refresh_captcha: 1 }, { preserveScroll: true, replace: true })}
                                disabled={captchaLockSeconds > 0}
                                aria-label="Acak ulang captcha"
                                title="Acak ulang captcha"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                    <path d="M12 6a6 6 0 015.7 4h-2.2a.75.75 0 000 1.5h3.75A.75.75 0 0020 10.75V7a.75.75 0 00-1.5 0v1.78A7.5 7.5 0 104.53 16.7a.75.75 0 001.35-.66A6 6 0 1112 6z" />
                                </svg>
                            </button>
                        </div>
                        <TextInput
                            ref={captchaRef}
                            id="login_captcha_input"
                            type="text"
                            name="login_captcha_input"
                            value={data.captcha}
                            className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400"
                            placeholder="Masukkan 6 karakter captcha"
                            maxLength={6}
                            autoComplete="new-password"
                            autoCorrect="off"
                            spellCheck={false}
                            inputMode="text"
                            onChange={(e) => setData('captcha', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                        />
                        <InputError message={errors.captcha} className="mt-2" />
                        {captchaLockSeconds > 0 && (
                            <p className="mt-1 text-[11px] font-semibold text-amber-300">
                                Coba lagi dalam {captchaLockSeconds} detik
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ms-2 text-xs font-semibold text-slate-300">Ingat saya</span>
                        </label>

                        {canResetPassword && (
                            <Link href={route('password.request')} className="text-xs font-semibold text-sky-300 hover:text-sky-200">
                                Lupa password?
                            </Link>
                        )}
                    </div>

                    <PrimaryButton className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] text-white hover:bg-sky-500" disabled={processing || captchaLockSeconds > 0}>
                        {processing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
                        {processing ? 'Memproses...' : captchaLockSeconds > 0 ? `Tunggu ${captchaLockSeconds} detik` : 'Masuk ke Workspace'}
                    </PrimaryButton>

                    <p className="pt-1 text-center text-[11px] text-slate-400">
                        Dilindungi oleh gateway autentikasi SIAKAD
                    </p>
                </form>
            </div>
        </GuestLayout>
    );
}


import GuestLayout from '@/Layouts/GuestLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="guest-xs-tight mx-auto w-full max-w-md rounded-3xl border border-slate-200/20 bg-slate-900/65 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur-xl motion-safe:animate-[guestFadeIn_420ms_ease-out] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">Verification</p>
                <h2 className="mt-1 text-2xl font-black text-white">Verify Email</h2>
                <p className="mt-3 text-xs leading-6 text-slate-300">
                    Silakan verifikasi email untuk mengaktifkan akses penuh. Jika belum menerima email, kirim ulang link verifikasi.
                </p>

                {status === 'verification-link-sent' && (
                    <div className="mt-4 rounded-xl border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                        Link verifikasi baru sudah dikirim ke email Anda.
                    </div>
                )}

                <form onSubmit={submit} className="mt-5">
                    <div className="flex items-center justify-between gap-2">
                        <PrimaryButton className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-sky-500" disabled={processing}>
                            {processing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
                            {processing ? 'Mengirim...' : 'Kirim Ulang Email'}
                        </PrimaryButton>

                        <Link href={route('logout')} method="post" as="button" className="text-xs font-semibold text-slate-300 hover:text-white">
                            Keluar
                        </Link>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}

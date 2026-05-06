import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="guest-xs-tight mx-auto w-full max-w-md rounded-3xl border border-slate-200/20 bg-slate-900/65 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur-xl motion-safe:animate-[guestFadeIn_420ms_ease-out] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">Recovery</p>
                <h2 className="mt-1 text-2xl font-black text-white">Reset Access</h2>
                <p className="mt-3 text-xs leading-6 text-slate-300">
                    Masukkan email akun Anda. Sistem akan mengirimkan link aman untuk setel ulang password.
                </p>

                {status && <div className="mt-4 rounded-xl border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">{status}</div>}

                <form onSubmit={submit} className="mt-4 space-y-3">
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400"
                        placeholder="admin@kampus.ac.id"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-1" />

                    <PrimaryButton className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] text-white hover:bg-sky-500" disabled={processing}>
                        {processing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
                        {processing ? 'Mengirim...' : 'Kirim Link Reset'}
                    </PrimaryButton>
                </form>
            </div>
        </GuestLayout>
    );
}

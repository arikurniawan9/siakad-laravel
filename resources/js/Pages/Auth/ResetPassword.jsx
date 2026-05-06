import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'));
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div className="guest-xs-tight mx-auto w-full max-w-md rounded-3xl border border-slate-200/20 bg-slate-900/65 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur-xl motion-safe:animate-[guestFadeIn_420ms_ease-out] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">Password Reset</p>
                <h2 className="mt-1 text-2xl font-black text-white">Set New Password</h2>

                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div>
                        <InputLabel htmlFor="email" value="Email" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                        <TextInput id="email" type="email" name="email" value={data.email} className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400" autoComplete="username" onChange={(e) => setData('email', e.target.value)} />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Password" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                        <TextInput id="password" type="password" name="password" value={data.password} className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400" autoComplete="new-password" isFocused={true} onChange={(e) => setData('password', e.target.value)} />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                        <TextInput type="password" name="password_confirmation" value={data.password_confirmation} className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    <PrimaryButton className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] text-white hover:bg-sky-500" disabled={processing}>
                        {processing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
                        {processing ? 'Memperbarui...' : 'Perbarui Password'}
                    </PrimaryButton>
                </form>
            </div>
        </GuestLayout>
    );
}

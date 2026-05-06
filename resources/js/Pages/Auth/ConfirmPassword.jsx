import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'));
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="premium-auth-card w-full max-w-md rounded-3xl border border-white/20 bg-slate-900/70 p-8 text-slate-100 shadow-2xl backdrop-blur-xl motion-safe:animate-[guestFadeIn_420ms_ease-out]">
                <div className="mb-6">
                    <p className="text-xs uppercase tracking-[0.34em] text-amber-300/80">Security</p>
                    <h2 className="mt-2 text-3xl font-black leading-tight text-white">Confirm Password</h2>
                    <p className="mt-3 text-sm text-slate-300">
                        Area ini dilindungi. Masukkan password akun Anda untuk melanjutkan proses.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel htmlFor="password" value="Password" className="text-sm font-semibold text-slate-200" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-2 block w-full rounded-2xl border border-slate-500/40 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-amber-300/80 focus:ring-amber-300/30"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Masukkan password akun"
                        />

                        <InputError message={errors.password} className="mt-2 text-rose-300" />
                    </div>

                    <div className="pt-1">
                        <PrimaryButton
                            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-amber-200/40 bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200 px-5 py-3 font-extrabold tracking-wide text-slate-900 shadow-[0_18px_42px_-22px_rgba(252,211,77,0.95)] transition duration-300 hover:brightness-105 focus:ring-2 focus:ring-amber-200/50 disabled:opacity-60"
                            disabled={processing}
                        >
                            {processing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />}
                            {processing ? 'Memverifikasi...' : 'Konfirmasi Akses'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}

import { useEffect, useMemo, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register({ prodis = [] }) {
    const [step, setStep] = useState(1);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        prodi_id: prodis?.[0]?.id ?? '',
        nisn: '',
        jenis_kelamin: 'L',
        tempat_lahir: '',
        tanggal_lahir: '',
        alamat: '',
        confirm_data: false,
        password: '',
        password_confirmation: '',
    });

    const stepForErrors = (errs) => {
        const keys = new Set(Object.keys(errs || {}));

        const step1 = ['name', 'email', 'phone'];
        const step2 = ['prodi_id', 'nisn', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'alamat'];
        const step3 = ['password', 'password_confirmation', 'confirm_data'];

        if (step1.some((k) => keys.has(k))) return 1;
        if (step2.some((k) => keys.has(k))) return 2;
        if (step3.some((k) => keys.has(k))) return 3;
        return 1;
    };

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const canNextFromStep1 = useMemo(() => {
        return String(data.name).trim().length > 0 && String(data.email).trim().length > 0;
    }, [data.email, data.name]);

    const canNextFromStep2 = useMemo(() => {
        return String(data.prodi_id).trim().length > 0 && ['L', 'P'].includes(String(data.jenis_kelamin));
    }, [data.jenis_kelamin, data.prodi_id]);

    const canSubmit = useMemo(() => {
        return (
            String(data.password).length > 0 &&
            String(data.password_confirmation).length > 0 &&
            data.confirm_data === true
        );
    }, [data.confirm_data, data.password, data.password_confirmation]);

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onError: (errs) => {
                setStep(stepForErrors(errs));
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="guest-xs-tight mx-auto w-full max-w-md rounded-3xl border border-slate-200/20 bg-slate-900/65 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur-xl motion-safe:animate-[guestFadeIn_420ms_ease-out] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">Registration</p>
                <h2 className="mt-1 text-2xl font-black text-white">Create Account</h2>

                <div className="mt-3 flex items-center gap-2">
                    {[
                        { id: 1, label: 'Akun' },
                        { id: 2, label: 'Mahasiswa' },
                        { id: 3, label: 'Keamanan' },
                    ].map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2">
                            <div
                                className={[
                                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold',
                                    step === s.id ? 'bg-sky-500 text-slate-950' : step > s.id ? 'bg-sky-500/30 text-sky-200' : 'bg-slate-800 text-slate-300',
                                ].join(' ')}
                            >
                                {s.id}
                            </div>
                            <span className={['text-xs font-bold', step === s.id ? 'text-white' : 'text-slate-300'].join(' ')}>{s.label}</span>
                            {idx < 2 && <span className="text-slate-600">—</span>}
                        </div>
                    ))}
                </div>

                <form onSubmit={submit} className="mt-4 space-y-4">
                    {step === 1 && (
                        <>
                            <div>
                                <InputLabel htmlFor="name" value="Name" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                <TextInput id="name" name="name" value={data.name} className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400" autoComplete="name" isFocused={true} onChange={(e) => setData('name', e.target.value)} required />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                <TextInput id="email" type="email" name="email" value={data.email} className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400" autoComplete="username" onChange={(e) => setData('email', e.target.value)} required />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="phone" value="No. HP (opsional)" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                <TextInput id="phone" name="phone" value={data.phone} className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400" autoComplete="tel" onChange={(e) => setData('phone', e.target.value)} />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div>
                                <InputLabel htmlFor="prodi_id" value="Program Studi" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                <select
                                    id="prodi_id"
                                    name="prodi_id"
                                    value={data.prodi_id}
                                    onChange={(e) => setData('prodi_id', e.target.value)}
                                    className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 focus:border-sky-400 focus:ring-sky-400"
                                    required
                                >
                                    {prodis.length === 0 ? (
                                        <option value="" disabled>
                                            Prodi belum tersedia
                                        </option>
                                    ) : (
                                        prodis.map((prodi) => (
                                            <option key={prodi.id} value={prodi.id}>
                                                {prodi.jenjang} - {prodi.nama}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <InputError message={errors.prodi_id} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="jenis_kelamin" value="Jenis Kelamin" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                    <select
                                        id="jenis_kelamin"
                                        name="jenis_kelamin"
                                        value={data.jenis_kelamin}
                                        onChange={(e) => setData('jenis_kelamin', e.target.value)}
                                        className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 focus:border-sky-400 focus:ring-sky-400"
                                        required
                                    >
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                    <InputError message={errors.jenis_kelamin} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="nisn" value="NISN (opsional)" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                    <TextInput
                                        id="nisn"
                                        name="nisn"
                                        value={data.nisn}
                                        className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400"
                                        onChange={(e) => setData('nisn', e.target.value)}
                                    />
                                    <InputError message={errors.nisn} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="tempat_lahir" value="Tempat Lahir (opsional)" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                    <TextInput
                                        id="tempat_lahir"
                                        name="tempat_lahir"
                                        value={data.tempat_lahir}
                                        className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400"
                                        onChange={(e) => setData('tempat_lahir', e.target.value)}
                                    />
                                    <InputError message={errors.tempat_lahir} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="tanggal_lahir" value="Tanggal Lahir (opsional)" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                    <TextInput
                                        id="tanggal_lahir"
                                        type="date"
                                        name="tanggal_lahir"
                                        value={data.tanggal_lahir}
                                        className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400"
                                        onChange={(e) => setData('tanggal_lahir', e.target.value)}
                                    />
                                    <InputError message={errors.tanggal_lahir} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="alamat" value="Alamat (opsional)" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                <textarea
                                    id="alamat"
                                    name="alamat"
                                    value={data.alamat}
                                    rows={3}
                                    onChange={(e) => setData('alamat', e.target.value)}
                                    className="mt-2 block w-full resize-none rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400"
                                    placeholder="Alamat lengkap"
                                />
                                <InputError message={errors.alamat} className="mt-2" />
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div>
                                <InputLabel htmlFor="password" value="Password" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                <TextInput id="password" type="password" name="password" value={data.password} className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400" autoComplete="new-password" onChange={(e) => setData('password', e.target.value)} required />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300" />
                                <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} className="mt-2 block w-full rounded-xl border border-slate-300/20 bg-slate-950/45 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-400" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} required />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>

                    <div className="flex items-start gap-2 pt-1">
                        <input
                            id="confirm_data"
                            name="confirm_data"
                            type="checkbox"
                            checked={data.confirm_data}
                            onChange={(e) => setData('confirm_data', e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300/30 bg-slate-950/45 text-sky-500 focus:ring-sky-400"
                            required
                        />
                        <label htmlFor="confirm_data" className="text-xs font-semibold text-slate-200/90">
                            Saya konfirmasi data yang saya isi sudah benar.
                        </label>
                    </div>
                    <InputError message={errors.confirm_data} className="mt-2" />
                        </>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                                    className="rounded-xl border border-slate-300/20 bg-slate-950/30 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-200 hover:bg-slate-950/50"
                                >
                                    Kembali
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep((s) => Math.min(3, s + 1))}
                                    disabled={(step === 1 && !canNextFromStep1) || (step === 2 && !canNextFromStep2)}
                                    className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Lanjut
                                </button>
                            ) : (
                                <PrimaryButton
                                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={processing || !canSubmit}
                                >
                                    {processing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
                                    {processing ? 'Memproses...' : 'Daftar'}
                                </PrimaryButton>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <Link href={route('login')} className="text-xs font-semibold text-sky-300 hover:text-sky-200">
                            Sudah punya akun?
                        </Link>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Step {step}/3
                        </span>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}

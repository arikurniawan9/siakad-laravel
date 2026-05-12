import { Head, Link } from '@inertiajs/react';

export default function Page() {
    return (
        <>
            <Head title="Daftar PMB" />
            <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Portal PMB</p>
                    <h1 className="mt-2 text-3xl font-black text-slate-900">Daftar Mahasiswa Baru</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        Untuk mendaftar PMB, silakan buat akun mahasiswa terlebih dahulu. Setelah akun aktif,
                        Anda dapat melengkapi data PMB, upload dokumen, dan melanjutkan pembayaran pendaftaran.
                    </p>

                    <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p>1. Buat akun mahasiswa baru.</p>
                        <p>2. Lengkapi profil awal calon mahasiswa.</p>
                        <p>3. Masuk ke modul PMB dan lanjutkan proses pendaftaran.</p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href={route('register')} className="btn-primary">
                            Buat Akun & Daftar
                        </Link>
                        <Link href={route('public.login-mahasiswa')} className="btn-outline">
                            Sudah Punya Akun? Login
                        </Link>
                        <Link href={route('landing.index')} className="btn-outline">
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}


import { Head, Link } from '@inertiajs/react';

export default function Page() {
    return (
        <>
            <Head title="Login Mahasiswa" />
            <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Portal Mahasiswa</p>
                    <h1 className="mt-2 text-3xl font-black text-slate-900">Login Mahasiswa</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        Masuk menggunakan akun mahasiswa untuk mengakses KRS, KHS, transkrip,
                        serta status pendaftaran PMB dan pembayaran.
                    </p>

                    <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p>Gunakan email dan password yang didaftarkan saat registrasi.</p>
                        <p>Akses ini khusus mahasiswa/calon mahasiswa. Admin tetap login dari halaman admin.</p>
                        <p>Jika lupa password, gunakan fitur reset password di halaman login.</p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href={route('login')} className="btn-primary">
                            Login Sekarang
                        </Link>
                        <Link href={route('public.daftar-pmb')} className="btn-outline">
                            Belum Punya Akun? Daftar PMB
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

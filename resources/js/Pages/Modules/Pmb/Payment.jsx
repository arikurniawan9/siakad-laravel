import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

const statusStyles = {
    paid: 'bg-emerald-100 text-emerald-700',
    unpaid: 'bg-slate-100 text-slate-700',
    failed: 'bg-rose-100 text-rose-700',
};

function PmbCard({ item, onCreateSnap, onPayNow }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.nomor_pendaftaran}</p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{item.nama_lengkap}</h4>
                    <p className="mt-1 text-xs text-slate-500">Status pembayaran</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[item.status_pembayaran] || 'bg-slate-100 text-slate-700'}`}>
                    {item.status_pembayaran}
                </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {!item.snap_token && item.status_pembayaran !== 'paid' && (
                    <button onClick={() => onCreateSnap(item.id)} className="btn-primary">
                        Buat Pembayaran
                    </button>
                )}
                {item.snap_token && item.status_pembayaran !== 'paid' && (
                    <button onClick={() => onPayNow(item.snap_token)} className="btn-primary">
                        Bayar Sekarang
                    </button>
                )}
                <Link href={route('pmb.index')} className="btn-outline">
                    Kembali
                </Link>
            </div>
        </article>
    );
}

export default function Page({ auth, pmbItems = [], registrationFee = 0, summary = null }) {
    const { menu, flash } = usePage().props;

    useEffect(() => {
        const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
        if (!clientKey || window.snap) return;

        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const createSnap = (id) => router.post(route('pmb.snap', id));

    const payNow = (token) => {
        if (!window.snap || !token) return;
        window.snap.pay(token, {
            onSuccess: () => router.reload({ only: ['pmbItems'] }),
            onPending: () => router.reload({ only: ['pmbItems'] }),
            onError: () => router.reload({ only: ['pmbItems'] }),
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-2xl font-extrabold text-slate-900">PMB - Payment Gateway</h2>}>
            <Head title="Payment" />

            <ModuleHero
                eyebrow="Payment Gateway"
                title="Pembayaran PMB"
                description="Kelola pembayaran pendaftaran dan lanjutkan ke Snap Midtrans ketika siap dibayar."
                note={`Total pendaftaran: ${summary?.total ?? 0}`}
            />

            {flash?.success && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{flash.success}</div>}
            {flash?.error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{flash.error}</div>}

            <div className="grid gap-4 md:grid-cols-3">
                <article className="panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Biaya Pendaftaran</p>
                    <p className="mt-1 text-2xl font-extrabold text-blue-800">Rp {registrationFee.toLocaleString('id-ID')}</p>
                </article>
                <article className="panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Pendaftar</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary?.total ?? 0}</p>
                </article>
                <article className="panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sudah Bayar</p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-700">{summary?.paid ?? 0}</p>
                </article>
            </div>

            <div className="mt-4 panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Daftar Pendaftaran</h3>
                        <p className="text-sm text-slate-600">Gunakan Snap untuk pembayaran ketika status masih belum lunas.</p>
                    </div>
                    <Link href={route('pmb.index')} className="btn-outline">
                        Kembali ke PMB
                    </Link>
                </div>

                <div className="mt-4 space-y-3">
                    {pmbItems.length === 0 && <p className="text-sm text-slate-500">Belum ada data PMB.</p>}
                    {pmbItems.map((item) => (
                        <PmbCard key={item.id} item={item} onCreateSnap={createSnap} onPayNow={payNow} />
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

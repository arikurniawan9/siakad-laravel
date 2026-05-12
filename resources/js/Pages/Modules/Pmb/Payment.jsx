import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

const statusStyles = {
    paid: 'bg-emerald-100 text-emerald-700',
    unpaid: 'bg-slate-100 text-slate-700',
    failed: 'bg-rose-100 text-rose-700',
    pending: 'bg-amber-100 text-amber-700',
};

const statusLabels = {
    paid: 'Lunas',
    unpaid: 'Belum Bayar',
    failed: 'Gagal',
    pending: 'Pending',
};

function formatCurrency(value) {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

function PmbCard({ item, registrationFee, onCreateSnap, onPayNow, midtransEnabled }) {
    const isPaid = item.status_pembayaran === 'paid';
    const canCreatePayment = !item.snap_token && !isPaid;
    const canPay = item.snap_token && !isPaid;

    return (
        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.nomor_pendaftaran}</p>
                    <h4 className="mt-1 text-base font-bold text-slate-900">{item.nama_lengkap}</h4>
                    <p className="mt-1 text-xs text-slate-500">Tagihan pendaftaran: {formatCurrency(registrationFee)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[item.status_pembayaran] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[item.status_pembayaran] || item.status_pembayaran}
                </span>
            </div>

            <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
                <div>
                    <p className="font-semibold text-slate-500">Snap Token</p>
                    <p className="mt-1 font-bold text-slate-900">{item.snap_token ? 'Tersedia' : 'Belum dibuat'}</p>
                </div>
                <div>
                    <p className="font-semibold text-slate-500">Status</p>
                    <p className="mt-1 font-bold text-slate-900">{statusLabels[item.status_pembayaran] || item.status_pembayaran}</p>
                </div>
                <div>
                    <p className="font-semibold text-slate-500">Nominal</p>
                    <p className="mt-1 font-bold text-slate-900">{formatCurrency(registrationFee)}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {canCreatePayment && (
                    <button onClick={() => onCreateSnap(item.id)} className="btn-primary" disabled={!midtransEnabled}>
                        Buat Pembayaran
                    </button>
                )}
                {canPay && (
                    <button onClick={() => onPayNow(item.snap_token)} className="btn-primary">
                        Bayar Sekarang
                    </button>
                )}
                {isPaid && (
                    <span className="inline-flex items-center rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                        Pembayaran sudah lunas
                    </span>
                )}
                <Link href={route('pmb.index')} className="btn-outline">
                    Kembali
                </Link>
            </div>
        </article>
    );
}

export default function Page({ auth, pmbItems = [], registrationFee = 0, summary = null, midtrans = null }) {
    const { menu, flash } = usePage().props;
    const unpaid = summary?.unpaid ?? Math.max((summary?.total ?? 0) - (summary?.paid ?? 0), 0);
    const gatewayStatus = midtrans?.enabled ? 'Aktif' : 'Belum Siap';

    useEffect(() => {
        const clientKey = midtrans?.client_key || '';
        if (!clientKey || window.snap) return;

        const script = document.createElement('script');
        script.src = midtrans?.is_production
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [midtrans?.client_key, midtrans?.is_production]);

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
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Payment" />

            <ModuleHero
                eyebrow="Payment Gateway"
                title="Pembayaran PMB"
                description="Kelola pembayaran pendaftaran dan lanjutkan ke Snap Midtrans ketika siap dibayar."
                note={`Total pendaftaran: ${summary?.total ?? 0}`}
            />

            {flash?.success && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{flash.success}</div>}
            {flash?.error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{flash.error}</div>}
            {!midtrans?.enabled && (
                <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                    Payment gateway Midtrans belum aktif/siap. Cek Settings &gt; Payment Gateway.
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
                <article className="panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Biaya Pendaftaran</p>
                    <p className="mt-1 text-2xl font-extrabold text-blue-800">{formatCurrency(registrationFee)}</p>
                </article>
                <article className="panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Pendaftar</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary?.total ?? 0}</p>
                </article>
                <article className="panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sudah Bayar</p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-700">{summary?.paid ?? 0}</p>
                </article>
                <article className="panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Belum Bayar</p>
                    <p className="mt-1 text-2xl font-extrabold text-amber-700">{unpaid}</p>
                </article>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
                <section className="panel p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Gateway Status</p>
                    <h3 className="mt-2 text-base font-bold text-slate-900">Midtrans Snap</h3>
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-slate-600">Status koneksi</span>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${midtrans?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {gatewayStatus}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                            <span className="text-sm font-semibold text-slate-600">Mode</span>
                            <span className="text-sm font-bold text-slate-900">{midtrans?.is_production ? 'Production' : 'Sandbox'}</span>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 text-xs leading-5 text-slate-600">
                        <p>Buat pembayaran untuk menghasilkan Snap token, lalu lanjutkan pembayaran dengan tombol bayar.</p>
                        <p>Status lunas akan mengikuti callback payment gateway setelah transaksi berhasil diproses.</p>
                    </div>
                    <Link href={route('pmb.index')} className="btn-outline mt-4 w-full">
                        Kembali ke Form PMB
                    </Link>
                </section>

                <section className="panel p-5">
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
                    {pmbItems.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                            Belum ada data PMB. Buat pendaftaran terlebih dahulu sebelum melakukan pembayaran.
                        </div>
                    )}
                    {pmbItems.map((item) => (
                        <PmbCard
                            key={item.id}
                            item={item}
                            registrationFee={registrationFee}
                            onCreateSnap={createSnap}
                            onPayNow={payNow}
                            midtransEnabled={!!midtrans?.enabled}
                        />
                    ))}
                </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

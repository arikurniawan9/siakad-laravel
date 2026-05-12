import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import ModuleHero from '@/Components/ModuleHero';
import EmptyState from '../Akademik/EmptyState';

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatDateTime(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

const statusStyles = {
    success: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-rose-100 text-rose-700',
    expired: 'bg-slate-200 text-slate-700',
    cancelled: 'bg-slate-200 text-slate-700',
    partial: 'bg-sky-100 text-sky-700',
    paid: 'bg-emerald-100 text-emerald-700',
};

const statusLabel = {
    success: 'Berhasil',
    pending: 'Pending',
    failed: 'Gagal',
    expired: 'Expired',
    cancelled: 'Dibatalkan',
    partial: 'Partial',
    paid: 'Lunas',
};

function RecentTransactionCard({ trx }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{trx.order_id}</p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{trx.mahasiswa?.nama || '-'}</h4>
                    <p className="text-xs text-slate-500">{trx.mahasiswa?.nim || '-'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[trx.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabel[trx.status] || trx.status}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <p className="text-slate-400">Invoice</p>
                    <p className="mt-1 font-semibold text-slate-700">{trx.tagihan?.kode_tagihan || '-'}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{trx.tagihan?.jenis || '-'}</p>
                </div>
                <div>
                    <p className="text-slate-400">Metode</p>
                    <p className="mt-1 font-semibold text-slate-700">{trx.payment_type || '-'}</p>
                </div>
                <div>
                    <p className="text-slate-400">Nominal</p>
                    <p className="mt-1 font-semibold text-slate-900">{formatRupiah(trx.gross_amount)}</p>
                </div>
                <div>
                    <p className="text-slate-400">Waktu</p>
                    <p className="mt-1 font-semibold text-slate-700">{formatDateTime(trx.paid_at || trx.created_at)}</p>
                </div>
            </div>
        </article>
    );
}

function PendingBillCard({ tagihan }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{tagihan.kode_tagihan}</p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{tagihan.mahasiswa?.nama || '-'}</h4>
                    <p className="text-xs text-slate-500">{tagihan.mahasiswa?.nim || '-'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[tagihan.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabel[tagihan.status] || tagihan.status}
                </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <p className="text-slate-400">Jenis</p>
                    <p className="mt-1 font-semibold text-slate-700">{tagihan.jenis || '-'}</p>
                </div>
                <div>
                    <p className="text-slate-400">Periode</p>
                    <p className="mt-1 font-semibold text-slate-700">
                        {tagihan.tahun_akademik || '-'} / {tagihan.semester_akademik || '-'}
                    </p>
                </div>
                <div>
                    <p className="text-slate-400">Total</p>
                    <p className="mt-1 font-semibold text-slate-900">{formatRupiah(tagihan.total)}</p>
                </div>
                <div>
                    <p className="text-slate-400">Transaksi</p>
                    <p className="mt-1 font-semibold text-slate-700">{tagihan.transaksis_count || 0} record</p>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <Link href={route('keuangan.tagihan', { search: tagihan.kode_tagihan })} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 hover:bg-sky-100">
                    Buka Tagihan
                </Link>
                <Link href={route('keuangan.transaksi', { search: tagihan.kode_tagihan })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                    Lihat Transaksi
                </Link>
            </div>
        </article>
    );
}

export default function Page({ auth, stats, transactionStats = null, recentTransaksis = [], recentTagihans = [] }) {
    const { menu } = usePage().props;
    const pendingOver24h = transactionStats?.reconciliation_pending_over_24h ?? 0;
    const oldestPendingHours = transactionStats?.reconciliation_oldest_pending_hours ?? 0;
    const shouldShowSlaWarning = pendingOver24h > 0;

    const cards = [
        { label: 'Total Tagihan', value: stats?.total_tagihan || 0 },
        { label: 'Tagihan Pending', value: stats?.pending || 0 },
        { label: 'Tagihan Lunas', value: stats?.paid || 0 },
    ];

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Keuangan - Dashboard" />

            <ModuleHero
                eyebrow="Modul Keuangan"
                title="Dashboard Keuangan"
                description="Ringkasan tagihan, status pembayaran, dan nominal yang sedang diproses dalam sistem."
                note={`Total tagihan aktif: ${stats?.total_tagihan || 0}`}
            />

            {shouldShowSlaWarning ? (
                <section className="panel border-rose-200 bg-rose-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">SLA Rekonsiliasi</p>
                            <p className="mt-1 text-sm font-bold text-rose-900">
                                {pendingOver24h} item pending lebih dari 24 jam, oldest {oldestPendingHours} jam.
                            </p>
                            <p className="mt-1 text-xs text-rose-700">Prioritaskan penyelesaian agar data transaksi dan buku kas tetap sinkron.</p>
                        </div>
                        <Link href={route('settings.finance-reconciliation.index', { status: 'pending' })} className="btn-outline border-rose-300 bg-white text-rose-700 hover:bg-rose-100">
                            Tinjau Rekonsiliasi
                        </Link>
                    </div>
                </section>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-3">
                {cards.map((item) => (
                    <article key={item.label} className="panel p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="mt-1 text-2xl font-extrabold text-slate-900">{item.value}</p>
                    </article>
                ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <section className="panel p-4">
                    <h3 className="text-sm font-bold text-slate-900">Nominal Pending</h3>
                    <p className="mt-2 text-2xl font-extrabold text-amber-600">{formatRupiah(stats?.nominal_pending || 0)}</p>
                </section>
                <section className="panel p-4">
                    <h3 className="text-sm font-bold text-slate-900">Nominal Lunas</h3>
                    <p className="mt-2 text-2xl font-extrabold text-emerald-600">{formatRupiah(stats?.nominal_paid || 0)}</p>
                </section>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <section className="panel p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Status Transaksi</h3>
                            <p className="mt-1 text-xs text-slate-500">Gambaran cepat transaksi pembayaran yang masuk.</p>
                        </div>
                        <Link href={route('keuangan.transaksi')} className="btn-outline">
                            Buka log
                        </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Success</p>
                            <p className="mt-2 text-2xl font-black text-emerald-800">{transactionStats?.success ?? 0}</p>
                            <p className="mt-1 text-xs text-emerald-700">{formatRupiah(transactionStats?.nominal_success || 0)}</p>
                        </article>
                        <article className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Pending</p>
                            <p className="mt-2 text-2xl font-black text-amber-800">{transactionStats?.pending ?? 0}</p>
                            <p className="mt-1 text-xs text-amber-700">{formatRupiah(transactionStats?.nominal_pending || 0)}</p>
                        </article>
                        <article className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">Failed</p>
                            <p className="mt-2 text-2xl font-black text-rose-800">{transactionStats?.failed ?? 0}</p>
                            <p className="mt-1 text-xs text-rose-700">{transactionStats?.total ?? 0} total</p>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Rasio Success</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">
                                {transactionStats?.total ? Math.round(((transactionStats?.success || 0) / transactionStats.total) * 100) : 0}%
                            </p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${transactionStats?.total ? Math.round(((transactionStats?.success || 0) / transactionStats.total) * 100) : 0}%` }}
                                />
                            </div>
                        </article>
                    </div>
                </section>

                <section className="panel p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Posisi Invoice</h3>
                            <p className="mt-1 text-xs text-slate-500">Perbandingan tagihan yang masih perlu dipantau.</p>
                        </div>
                        <Link href={route('keuangan.tagihan')} className="btn-outline">
                            Buka tagihan
                        </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                        <article className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Pending Invoice</p>
                                <p className="text-lg font-black text-amber-800">{stats?.pending || 0}</p>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
                                <div
                                    className="h-full rounded-full bg-amber-500"
                                    style={{ width: `${stats?.total_tagihan ? Math.round(((stats?.pending || 0) / stats.total_tagihan) * 100) : 0}%` }}
                                />
                            </div>
                        </article>
                        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Lunas Invoice</p>
                                <p className="text-lg font-black text-emerald-800">{stats?.paid || 0}</p>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${stats?.total_tagihan ? Math.round(((stats?.paid || 0) / stats.total_tagihan) * 100) : 0}%` }}
                                />
                            </div>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Saldo Terbuka</p>
                            <p className="mt-2 text-lg font-black text-slate-900">{formatRupiah(stats?.nominal_pending || 0)}</p>
                            <p className="mt-1 text-xs text-slate-500">Nilai tagihan yang belum lunas dan masih aktif dipantau.</p>
                        </article>
                    </div>
                </section>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
                <section className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Tagihan Pending Terbaru</h3>
                            <p className="mt-1 text-xs text-slate-500">Tagihan yang butuh dipantau atau ditagih ulang.</p>
                        </div>
                        <Link href={route('keuangan.tagihan')} className="btn-outline">
                            Lihat semua
                        </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                        {recentTagihans.length ? (
                            recentTagihans.map((tagihan) => <PendingBillCard key={tagihan.id} tagihan={tagihan} />)
                        ) : (
                            <EmptyState title="Tidak ada tagihan pending" description="Semua tagihan sedang lunas atau belum dibuat." />
                        )}
                    </div>
                </section>

                <section className="panel p-4">
                    <h3 className="text-sm font-bold text-slate-900">Aksi Cepat</h3>
                    <p className="mt-1 text-xs text-slate-500">Akses langsung ke halaman kerja utama keuangan.</p>

                    <div className="mt-4 grid gap-3">
                        <a href={route('keuangan.dashboard.pdf')} className="btn-outline w-full justify-center">
                            Export Dashboard PDF
                        </a>
                        <Link href={route('keuangan.tagihan')} className="btn-primary w-full justify-center">
                            Kelola Tagihan
                        </Link>
                        <Link href={route('keuangan.transaksi')} className="btn-outline w-full justify-center">
                            Pantau Transaksi
                        </Link>
                    </div>
                </section>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
                <section className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Transaksi Terbaru</h3>
                            <p className="mt-1 text-xs text-slate-500">Lima transaksi terakhir yang diterima sistem pembayaran.</p>
                        </div>
                        <Link href={route('keuangan.transaksi')} className="btn-outline">
                            Lihat semua
                        </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                        {recentTransaksis.length ? (
                            recentTransaksis.map((trx) => <RecentTransactionCard key={trx.id} trx={trx} />)
                        ) : (
                            <EmptyState title="Belum ada transaksi" description="Transaksi yang masuk akan tampil di sini." />
                        )}
                    </div>
                </section>

                <section className="panel p-4">
                    <h3 className="text-sm font-bold text-slate-900">Ringkasan Status</h3>
                    <p className="mt-1 text-xs text-slate-500">Distribusi tagihan yang sedang diproses.</p>
                    <div className="mt-4 grid gap-3">
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Invoice Pending</p>
                            <p className="mt-2 text-2xl font-black text-amber-700">{stats?.pending || 0}</p>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Invoice Lunas</p>
                            <p className="mt-2 text-2xl font-black text-emerald-700">{stats?.paid || 0}</p>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nominal Berjalan</p>
                            <p className="mt-2 text-lg font-black text-slate-900">{formatRupiah((stats?.nominal_pending || 0) + (stats?.nominal_paid || 0))}</p>
                        </article>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

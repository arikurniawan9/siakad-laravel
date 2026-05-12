import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, router, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ModuleHero from '@/Components/ModuleHero';
import EmptyState from '../Akademik/EmptyState';

const currency = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const dateFormat = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const statusStyles = {
    pending: 'bg-amber-100 text-amber-700',
    success: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700',
    expired: 'bg-slate-200 text-slate-700',
    cancelled: 'bg-slate-200 text-slate-700',
};

const statusLabel = {
    pending: 'Pending',
    success: 'Berhasil',
    failed: 'Gagal',
    expired: 'Expired',
    cancelled: 'Dibatalkan',
};

const flowStepsByStatus = {
    pending: ['Dibuat', 'Menunggu Callback', 'Belum Tercatat', 'Belum Final'],
    success: ['Dibuat', 'Callback Masuk', 'Pembayaran Tercatat', 'Final'],
    failed: ['Dibuat', 'Callback Masuk', 'Tidak Tercatat', 'Perlu Tindak Lanjut'],
    expired: ['Dibuat', 'Expired', 'Tidak Tercatat', 'Perlu Tindak Lanjut'],
    cancelled: ['Dibuat', 'Dibatalkan', 'Tidak Tercatat', 'Perlu Tindak Lanjut'],
};

const flowToneByStatus = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    expired: 'bg-slate-100 text-slate-700 border-slate-200',
    cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

function FlowBadge({ status }) {
    const steps = flowStepsByStatus[status] || flowStepsByStatus.pending;
    const tone = flowToneByStatus[status] || flowToneByStatus.pending;

    return (
        <div className={`rounded-xl border px-2.5 py-2 text-[11px] font-semibold ${tone}`}>
            <p className="uppercase tracking-[0.16em] opacity-75">Progress Alur</p>
            <p className="mt-1 leading-5">{steps.join(' • ')}</p>
        </div>
    );
}

function PaginationButtons({ links = [], onClick }) {
    if (!links.length) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link, index) => (
                <button
                    key={`${link.label}-${index}`}
                    type="button"
                    disabled={!link.url}
                    onClick={() => link.url && onClick(link.url)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
                    }`}
                >
                    {link.label}
                </button>
            ))}
        </div>
    );
}

function ActionButton({ children, ...props }) {
    return (
        <button
            type="button"
            {...props}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
            {children}
        </button>
    );
}

function TransactionCard({ trx, onCopy, onDetail }) {
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

            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <dt className="text-slate-400">Invoice</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{trx.tagihan?.kode_tagihan || '-'}</dd>
                    <p className="mt-1 text-[11px] text-slate-500">{trx.tagihan?.jenis || '-'}</p>
                </div>
                <div>
                    <dt className="text-slate-400">Metode</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{trx.payment_type || '-'}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Nominal</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{currency(trx.gross_amount)}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Waktu</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{dateFormat(trx.paid_at || trx.created_at)}</dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-slate-400">Transaction ID</dt>
                    <dd className="mt-1 font-semibold text-slate-700 break-all">{trx.transaction_id || '-'}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Fraud</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{trx.fraud_status || '-'}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Link</dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                        {trx.snap_redirect_url ? (
                            <a href={trx.snap_redirect_url} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-dotted underline-offset-2">
                                Buka Snap
                            </a>
                        ) : (
                            '-'
                        )}
                    </dd>
                </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton onClick={() => onCopy(trx.order_id, 'Order ID')}>Salin Order</ActionButton>
                <ActionButton onClick={() => onCopy(trx.transaction_id, 'Transaction ID')} disabled={!trx.transaction_id}>
                    Salin TX
                </ActionButton>
                <ActionButton onClick={() => onDetail(trx)}>Detail</ActionButton>
                {trx.reconciliation ? (
                    <a
                        href={route('settings.finance-reconciliation.index', { status: 'pending', search: trx.order_id })}
                        className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-[11px] font-semibold text-fuchsia-700 hover:bg-fuchsia-100"
                    >
                        Buka Rekonsiliasi
                    </a>
                ) : null}
                {trx.snap_redirect_url ? (
                    <a
                        href={trx.snap_redirect_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                    >
                        Buka Snap
                    </a>
                ) : null}
            </div>
            {trx.reconciliation ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800">
                    Perlu Rekonsiliasi: {trx.reconciliation.reason || 'Callback sukses masuk saat periode terkunci.'}
                </div>
            ) : null}
            <div className="mt-3">
                <FlowBadge status={trx.status} />
            </div>
        </article>
    );
}

export default function Page({ auth, stats = null, filters = null, transaksis = { data: [], meta: null, links: [] } }) {
    const { menu } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [reconciliationFilter, setReconciliationFilter] = useState(filters?.reconciliation || 'all');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'latest');
    const [sortDir, setSortDir] = useState(filters?.sort_dir || 'desc');
    const [toast, setToast] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const cards = [
        { label: 'Total', value: stats?.total_transaksi ?? 0, tone: 'text-slate-900' },
        { label: 'Success', value: stats?.success ?? 0, tone: 'text-emerald-700' },
        { label: 'Pending', value: stats?.pending ?? 0, tone: 'text-amber-700' },
        { label: 'Gagal', value: stats?.failed ?? 0, tone: 'text-rose-700' },
        { label: 'Rekonsiliasi', value: stats?.reconciliation_pending ?? 0, tone: 'text-fuchsia-700' },
    ];
    const callbackHealth = Math.max(0, (stats?.total_transaksi ?? 0) - (stats?.success ?? 0) - (stats?.pending ?? 0));

    const applyFilters = (pageUrl = null) => {
        const params = {
            search,
            status: statusFilter,
            reconciliation: reconciliationFilter,
            per_page: perPage,
            sort_by: sortBy,
            sort_dir: sortDir,
        };

        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('keuangan.transaksi'), params, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setReconciliationFilter('all');
        setPerPage('10');
        setSortBy('latest');
        setSortDir('desc');
        router.get(route('keuangan.transaksi'), {}, { preserveScroll: true, preserveState: true });
    };

    useEffect(() => {
        const normalizedSearch = filters?.search || '';
        if (search === normalizedSearch) {
            return undefined;
        }

        const timeout = setTimeout(() => {
            router.get(
                route('keuangan.transaksi'),
                {
                    search,
                    status: statusFilter,
                    reconciliation: reconciliationFilter,
                    per_page: perPage,
                    sort_by: sortBy,
                    sort_dir: sortDir,
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 2400);
        return () => clearTimeout(timer);
    }, [toast]);

    const copyValue = async (value, label) => {
        if (!value) {
            setToast({ type: 'error', message: `${label} tidak tersedia` });
            return;
        }

        try {
            await navigator.clipboard.writeText(String(value));
            setToast({ type: 'success', message: `${label} disalin` });
        } catch {
            setToast({ type: 'error', message: `Gagal menyalin ${label}` });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Transaksi Keuangan" />

            {toast?.message && (
                <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-sm">
                    <div
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${
                            toast.type === 'error'
                                ? 'border-rose-200 bg-rose-50 text-rose-800'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        }`}
                    >
                        {toast.message}
                    </div>
                </div>
            )}

            <ModuleHero
                eyebrow="Midtrans Monitor"
                title="Rekonsiliasi Pembayaran"
                description="Pantau transaksi pembayaran, status callback, dan keterkaitan invoice mahasiswa."
                note={`Total transaksi tercatat: ${stats?.total_transaksi ?? 0}`}
            />

            <div className="space-y-5">
                <section className="panel overflow-hidden p-0">
                    <div className="grid gap-0 lg:grid-cols-[1.35fr_1fr]">
                        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_55%),linear-gradient(135deg,_#f8fafc,_#eff6ff)] px-5 py-5 sm:px-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Ringkasan Pembayaran</p>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                Nominal berhasil berikut merepresentasikan pembayaran yang sudah masuk dan terkonfirmasi.
                            </p>
                            <div className="mt-5 rounded-2xl border border-sky-100 bg-white/80 px-4 py-4 shadow-sm shadow-sky-100/40">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nominal Berhasil</p>
                                <p className="mt-2 text-2xl font-black text-emerald-700">{currency(stats?.nominal_success ?? 0)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white px-5 py-5 sm:px-6 lg:border-l lg:border-t-0">
                            {cards.map((item) => (
                                <article key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                                    <p className={`mt-2 text-2xl font-black ${item.tone}`}>{item.value}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs sm:grid-cols-3 sm:px-6">
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <p className="font-semibold uppercase tracking-[0.16em] text-slate-500">Callback Aktif</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{(stats?.success ?? 0) + (stats?.failed ?? 0) + (stats?.expired ?? 0) + (stats?.cancelled ?? 0)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <p className="font-semibold uppercase tracking-[0.16em] text-slate-500">Belum Final</p>
                            <p className="mt-1 text-sm font-bold text-amber-700">{stats?.pending ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <p className="font-semibold uppercase tracking-[0.16em] text-slate-500">Perlu Review</p>
                            <p className="mt-1 text-sm font-bold text-rose-700">{callbackHealth}</p>
                        </div>
                    </div>
                </section>

                <section className="panel p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Log Transaksi</h3>
                            <p className="mt-1 text-xs text-slate-500">Daftar transaksi terbaru yang diterima sistem pembayaran.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={route('keuangan.transaksi.pdf', { search, status: statusFilter, sort_by: sortBy, sort_dir: sortDir })} className="btn-outline">
                                Export PDF
                            </a>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{transaksis.meta?.total ?? 0} record</div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_190px_120px_170px_120px_auto_auto]">
                        <input
                            className="form-input"
                            placeholder="Cari order, mahasiswa, invoice, metode"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Semua status</option>
                            <option value="success">Success</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select className="form-input" value={reconciliationFilter} onChange={(e) => setReconciliationFilter(e.target.value)}>
                            <option value="all">Semua rekonsiliasi</option>
                            <option value="pending">Hanya perlu rekonsiliasi</option>
                        </select>
                        <select className="form-input" value={perPage} onChange={(e) => setPerPage(e.target.value)}>
                            <option value="10">10 / halaman</option>
                            <option value="30">30 / halaman</option>
                            <option value="50">50 / halaman</option>
                            <option value="100">100 / halaman</option>
                        </select>
                        <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="latest">Urut terbaru</option>
                            <option value="order_id">Order ID</option>
                            <option value="payment_type">Metode</option>
                            <option value="gross_amount">Nominal</option>
                            <option value="status">Status</option>
                            <option value="paid_at">Waktu bayar</option>
                        </select>
                        <select className="form-input" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                            <option value="desc">Z-A / besar-kecil</option>
                            <option value="asc">A-Z / kecil-besar</option>
                        </select>
                        <button type="button" className="btn-primary" onClick={() => applyFilters()}>
                            Terapkan
                        </button>
                        <button type="button" className="btn-outline" onClick={resetFilters}>
                            Reset
                        </button>
                    </div>

                    <div className="mt-4 space-y-3 md:hidden">
                        {transaksis.data.length ? (
                            transaksis.data.map((trx) => <TransactionCard key={trx.id} trx={trx} onCopy={copyValue} onDetail={setSelectedTransaction} />)
                        ) : (
                            <EmptyState title="Belum ada transaksi" description="Data transaksi akan muncul saat callback pembayaran masuk." />
                        )}
                    </div>

                    <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                        <table className="min-w-full text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                    <th className="px-3 py-2 font-semibold">Order</th>
                                    <th className="px-3 py-2 font-semibold">Mahasiswa</th>
                                    <th className="px-3 py-2 font-semibold">Invoice</th>
                                    <th className="px-3 py-2 font-semibold">Metode</th>
                                    <th className="px-3 py-2 font-semibold">Nominal</th>
                                    <th className="px-3 py-2 font-semibold">Status</th>
                                    <th className="px-3 py-2 font-semibold">Waktu</th>
                                    <th className="px-3 py-2 font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transaksis.data.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-3 py-8 text-center text-sm text-slate-500">
                                            Tidak ada transaksi yang cocok dengan filter.
                                        </td>
                                    </tr>
                                )}
                                {transaksis.data.map((trx) => (
                                    <tr key={trx.id} className="border-t border-slate-100 align-top">
                                        <td className="px-3 py-3 font-medium text-slate-700">{trx.order_id}</td>
                                        <td className="px-3 py-3 text-slate-600">
                                            <div>{trx.mahasiswa?.nama || '-'}</div>
                                            <div className="text-xs text-slate-400">{trx.mahasiswa?.nim || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">
                                            <div>{trx.tagihan?.kode_tagihan || '-'}</div>
                                            <div className="text-xs text-slate-400">{trx.tagihan?.jenis || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">{trx.payment_type || '-'}</td>
                                        <td className="px-3 py-3 text-slate-600">
                                            <div>{currency(trx.gross_amount)}</div>
                                            <div className="mt-1 text-xs text-slate-400 break-all">{trx.transaction_id || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[trx.status] || 'bg-slate-100 text-slate-700'}`}>
                                                {statusLabel[trx.status] || trx.status}
                                            </span>
                                            {trx.reconciliation ? (
                                                <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800">Perlu rekonsiliasi</p>
                                            ) : null}
                                            <div className="mt-2">
                                                <FlowBadge status={trx.status} />
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">
                                            <div>{dateFormat(trx.paid_at || trx.created_at)}</div>
                                            <div className="mt-1 text-xs text-slate-400">{trx.fraud_status || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <ActionButton onClick={() => copyValue(trx.order_id, 'Order ID')}>Salin Order</ActionButton>
                                                <ActionButton onClick={() => copyValue(trx.transaction_id, 'Transaction ID')} disabled={!trx.transaction_id}>
                                                    Salin TX
                                                </ActionButton>
                                                <ActionButton onClick={() => setSelectedTransaction(trx)}>Detail</ActionButton>
                                                {trx.reconciliation ? (
                                                    <a
                                                        href={route('settings.finance-reconciliation.index', { status: 'pending', search: trx.order_id })}
                                                        className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-[11px] font-semibold text-fuchsia-700 hover:bg-fuchsia-100"
                                                    >
                                                        Rekonsiliasi
                                                    </a>
                                                ) : null}
                                                {trx.snap_redirect_url ? (
                                                    <a
                                                        href={trx.snap_redirect_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                                                    >
                                                        Buka Snap
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan {transaksis.meta?.from ?? 0}-{transaksis.meta?.to ?? 0} dari {transaksis.meta?.total ?? 0} record
                        </p>
                        <PaginationButtons links={transaksis.links} onClick={(url) => applyFilters(url)} />
                    </div>
                </section>
            </div>

            <Modal show={Boolean(selectedTransaction)} onClose={() => setSelectedTransaction(null)} maxWidth="2xl">
                {selectedTransaction && (
                    <div className="max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Detail Transaksi</p>
                                <h3 className="mt-1 text-lg font-bold text-slate-900">{selectedTransaction.order_id}</h3>
                                <p className="text-sm text-slate-500">
                                    {selectedTransaction.mahasiswa?.nama || '-'} - {selectedTransaction.mahasiswa?.nim || '-'}
                                </p>
                            </div>
                            <SecondaryButton onClick={() => setSelectedTransaction(null)}>Tutup</SecondaryButton>
                        </div>

                        <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_1.05fr]">
                            <section className="space-y-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                                    <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[selectedTransaction.status] || 'bg-slate-100 text-slate-700'}`}>
                                        {statusLabel[selectedTransaction.status] || selectedTransaction.status}
                                    </p>
                                    <div className="mt-3">
                                        <FlowBadge status={selectedTransaction.status} />
                                    </div>
                                </div>
                                {selectedTransaction.reconciliation ? (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">Rekonsiliasi</p>
                                        <p className="mt-2 text-sm font-semibold text-rose-900">Perlu tindakan super-admin</p>
                                        <p className="mt-1 text-xs text-rose-800">{selectedTransaction.reconciliation.reason || 'Callback masuk saat periode terkunci.'}</p>
                                    </div>
                                ) : null}
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Invoice</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedTransaction.tagihan?.kode_tagihan || '-'}</p>
                                    <p className="mt-1 text-xs text-slate-500">{selectedTransaction.tagihan?.jenis || '-'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nominal</p>
                                    <p className="mt-2 text-lg font-black text-slate-900">{currency(selectedTransaction.gross_amount)}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Metode {selectedTransaction.payment_type || '-'} | Fraud {selectedTransaction.fraud_status || '-'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Waktu</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">{dateFormat(selectedTransaction.paid_at || selectedTransaction.created_at)}</p>
                                    <p className="mt-1 text-xs text-slate-500 break-all">{selectedTransaction.transaction_id || '-'}</p>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Konteks Tagihan</h4>
                                        <p className="text-xs text-slate-500">Data tagihan yang terhubung dengan transaksi ini.</p>
                                    </div>
                                    {selectedTransaction.snap_redirect_url ? (
                                        <a href={selectedTransaction.snap_redirect_url} target="_blank" rel="noreferrer" className="btn-outline">
                                            Buka Snap
                                        </a>
                                    ) : null}
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Mahasiswa</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedTransaction.mahasiswa?.nama || '-'}</p>
                                    <p className="mt-1 text-xs text-slate-500">{selectedTransaction.mahasiswa?.nim || '-'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Invoice Total</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">{currency(selectedTransaction.tagihan?.total || 0)}</p>
                                    <p className="mt-1 text-xs text-slate-500">{selectedTransaction.tagihan?.status || '-'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Aksi Cepat</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <ActionButton onClick={() => copyValue(selectedTransaction.order_id, 'Order ID')}>Salin Order</ActionButton>
                                        <ActionButton onClick={() => copyValue(selectedTransaction.transaction_id, 'Transaction ID')} disabled={!selectedTransaction.transaction_id}>
                                            Salin TX
                                        </ActionButton>
                                        {selectedTransaction.tagihan?.kode_tagihan ? (
                                            <Link
                                                href={route('keuangan.tagihan', { search: selectedTransaction.tagihan.kode_tagihan })}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                Buka Tagihan
                                            </Link>
                                        ) : null}
                                        {selectedTransaction.reconciliation ? (
                                            <a
                                                href={route('settings.finance-reconciliation.index', { status: 'pending', search: selectedTransaction.order_id })}
                                                className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-[11px] font-semibold text-fuchsia-700 hover:bg-fuchsia-100"
                                            >
                                                Buka Rekonsiliasi
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}

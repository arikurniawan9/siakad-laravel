import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const currency = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const dateFormat = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
};

const statusStyles = {
    pending: 'bg-amber-100 text-amber-700',
    partial: 'bg-sky-100 text-sky-700',
    paid: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
    success: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700',
    expired: 'bg-slate-200 text-slate-700',
};

const statusLabel = {
    pending: 'Pending',
    partial: 'Partial',
    paid: 'Lunas',
    cancelled: 'Dibatalkan',
    success: 'Berhasil',
    failed: 'Gagal',
    expired: 'Expired',
};

function ActionButton({ children, className = '', ...props }) {
    return (
        <button
            type="button"
            {...props}
            className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 ${className}`}
        >
            {children}
        </button>
    );
}

function TransactionCard({ trx, onCopy }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{trx.order_id}</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{trx.payment_type || '-'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[trx.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabel[trx.status] || trx.status}
                </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <p className="text-slate-400">Nominal</p>
                    <p className="mt-1 font-semibold text-slate-900">{currency(trx.gross_amount)}</p>
                </div>
                <div>
                    <p className="text-slate-400">Waktu</p>
                    <p className="mt-1 font-semibold text-slate-700">{dateFormat(trx.paid_at)}</p>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton onClick={() => onCopy(trx.order_id, 'Order ID')}>Salin Order</ActionButton>
                {trx.redirect_url ? (
                    <a
                        href={trx.redirect_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                    >
                        Buka Snap
                    </a>
                ) : null}
            </div>
        </article>
    );
}

export default function Page({ auth, mahasiswa = null, ringkasan = null, filters = null, tagihans = { data: [], meta: null, links: [] }, pesan = null }) {
    const { menu } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [toast, setToast] = useState(null);

    const stats = [
        { label: 'Invoice', value: ringkasan?.total_tagihan ?? 0, tone: 'text-slate-900' },
        { label: 'Pending', value: ringkasan?.pending ?? 0, tone: 'text-amber-700' },
        { label: 'Partial', value: ringkasan?.partial ?? 0, tone: 'text-sky-700' },
        { label: 'Lunas', value: ringkasan?.paid ?? 0, tone: 'text-emerald-700' },
    ];
    const applyFilters = (pageUrl = null) => {
        const params = {
            search,
            status: statusFilter,
            per_page: perPage,
        };

        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('mahasiswa.tagihan'), params, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPerPage('10');
        router.get(route('mahasiswa.tagihan'), {}, { preserveScroll: true, preserveState: true });
    };

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

    useEffect(() => {
        const normalizedSearch = filters?.search || '';
        if (search === normalizedSearch) {
            return undefined;
        }

        const timeout = setTimeout(() => {
            router.get(route('mahasiswa.tagihan'), {
                search,
                status: statusFilter,
                per_page: perPage,
            }, { preserveScroll: true, preserveState: true, replace: true });
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            menu={menu}
            header={<h2 className="text-xl font-bold text-slate-900">Tagihan Mahasiswa</h2>}
        >
            <Head title="Tagihan Mahasiswa" />

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
                eyebrow="Mahasiswa"
                title="Tagihan Akademik"
                description="Pantau invoice aktif, status pembayaran, dan ringkasan saldo mahasiswa."
                note={`Saldo terbuka: ${currency(ringkasan?.saldo_terbuka ?? 0)}`}
            />

            <div className="space-y-5">
                <section className="panel overflow-hidden p-0">
                    <div className="grid gap-0 lg:grid-cols-[1.45fr_1fr]">
                        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_52%),linear-gradient(135deg,_#f8fafc,_#f0fdf4)] px-5 py-5 sm:px-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Keuangan Akademik</p>
                            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{mahasiswa?.nama || auth.user.name}</h3>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                                <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">NIM: {mahasiswa?.nim || '-'}</span>
                                <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">Prodi: {mahasiswa?.prodi || '-'}</span>
                                <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">Angkatan: {mahasiswa?.angkatan || '-'}</span>
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <article className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-4 shadow-sm shadow-emerald-100/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Saldo Terbuka</p>
                                    <p className="mt-2 text-2xl font-black text-amber-700">{currency(ringkasan?.saldo_terbuka ?? 0)}</p>
                                </article>
                                <article className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-4 shadow-sm shadow-emerald-100/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total Lunas</p>
                                    <p className="mt-2 text-2xl font-black text-emerald-700">{currency(ringkasan?.total_lunas ?? 0)}</p>
                                </article>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white px-5 py-5 sm:px-6 lg:border-l lg:border-t-0">
                            {stats.map((item) => (
                                <article key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                                    <p className={`mt-2 text-2xl font-black ${item.tone}`}>{item.value}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {pesan && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{pesan}</div>}

                <section className="panel p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Daftar Tagihan</h3>
                            <p className="mt-1 text-xs text-slate-500">Invoice akademik dan riwayat transaksi pembayaran per tagihan.</p>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {tagihans.meta?.total ?? 0} invoice
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_120px_auto_auto]">
                        <input
                            className="form-input"
                            placeholder="Cari invoice, jenis, tahun, order ID"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Semua status</option>
                            <option value="pending">Pending</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Lunas</option>
                            <option value="cancelled">Dibatalkan</option>
                        </select>
                        <select className="form-input" value={perPage} onChange={(e) => setPerPage(e.target.value)}>
                            <option value="10">10 / halaman</option>
                            <option value="30">30 / halaman</option>
                            <option value="50">50 / halaman</option>
                            <option value="100">100 / halaman</option>
                        </select>
                        <button type="button" className="btn-primary" onClick={() => applyFilters()}>
                            Terapkan
                        </button>
                        <button type="button" className="btn-outline" onClick={resetFilters}>
                            Reset
                        </button>
                    </div>

                    <div className="mt-4 space-y-4">
                        {tagihans.data.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                                Tidak ada invoice yang cocok dengan filter.
                            </div>
                        )}

                        {tagihans.data.map((tagihan) => (
                            <article key={tagihan.id} className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                                {tagihan.kode_tagihan}
                                            </span>
                                            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyles[tagihan.status] || 'bg-slate-100 text-slate-700'}`}>
                                                {statusLabel[tagihan.status] || tagihan.status}
                                            </span>
                                        </div>
                                        <h4 className="mt-3 text-base font-bold text-slate-900">{tagihan.jenis}</h4>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {tagihan.tahun_akademik || '-'} | Semester {tagihan.semester_akademik || '-'} | Jatuh tempo {dateFormat(tagihan.jatuh_tempo)}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                                        <p className="mt-2 text-2xl font-black text-slate-900">{currency(tagihan.total)}</p>
                                        <p className="mt-1 text-xs text-slate-500">Lunas: {tagihan.paid_at ? dateFormat(tagihan.paid_at) : 'Belum'}</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nominal</p>
                                        <p className="mt-2 text-sm font-bold text-slate-900">{currency(tagihan.nominal)}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Potongan</p>
                                        <p className="mt-2 text-sm font-bold text-emerald-700">{currency(tagihan.potongan)}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Denda</p>
                                        <p className="mt-2 text-sm font-bold text-rose-700">{currency(tagihan.denda)}</p>
                                    </div>
                                </div>

                                {tagihan.keterangan && (
                                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        {tagihan.keterangan}
                                    </div>
                                )}

                                <div className="mt-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h5 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Riwayat Transaksi</h5>
                                        <span className="text-xs text-slate-400">{tagihan.transactions.length} transaksi</span>
                                    </div>

                                    <div className="mt-3 space-y-3 md:hidden">
                                        {tagihan.transactions.length === 0 && (
                                            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500">
                                                Belum ada transaksi untuk invoice ini.
                                            </div>
                                        )}

                                        {tagihan.transactions.map((trx) => (
                                            <TransactionCard key={trx.id} trx={trx} onCopy={copyValue} />
                                        ))}
                                    </div>

                                    <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                                        <table className="min-w-full text-left text-sm">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                    <th className="px-3 py-2 font-semibold">Order ID</th>
                                                    <th className="px-3 py-2 font-semibold">Metode</th>
                                                    <th className="px-3 py-2 font-semibold">Nominal</th>
                                                    <th className="px-3 py-2 font-semibold">Status</th>
                                                    <th className="px-3 py-2 font-semibold">Waktu</th>
                                                    <th className="px-3 py-2 font-semibold">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tagihan.transactions.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="px-3 py-4 text-center text-sm text-slate-500">
                                                            Belum ada transaksi untuk invoice ini.
                                                        </td>
                                                    </tr>
                                                )}

                                                {tagihan.transactions.map((trx) => (
                                                    <tr key={trx.id} className="border-t border-slate-100">
                                                        <td className="px-3 py-3 font-medium text-slate-700">{trx.order_id}</td>
                                                        <td className="px-3 py-3 text-slate-600">{trx.payment_type || '-'}</td>
                                                        <td className="px-3 py-3 text-slate-600">{currency(trx.gross_amount)}</td>
                                                        <td className="px-3 py-3">
                                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[trx.status] || 'bg-slate-100 text-slate-700'}`}>
                                                                {statusLabel[trx.status] || trx.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-slate-600">{dateFormat(trx.paid_at)}</td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                <ActionButton onClick={() => copyValue(trx.order_id, 'Order ID')}>Salin Order</ActionButton>
                                                                {trx.redirect_url ? (
                                                                    <a
                                                                        href={trx.redirect_url}
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
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan {tagihans.meta?.from ?? 0}-{tagihans.meta?.to ?? 0} dari {tagihans.meta?.total ?? 0} invoice
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {tagihans.links?.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => link.url && applyFilters(link.url)}
                                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                        link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 disabled:opacity-50'
                                    }`}
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

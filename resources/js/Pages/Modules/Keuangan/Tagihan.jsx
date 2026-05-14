import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import ModuleHero from '@/Components/ModuleHero';
import EmptyState from '../Akademik/EmptyState';
import { ActionIcon, FieldError, IconButton } from '../Akademik/CrudParts';
import ConfirmationModal from '@/Components/ConfirmationModal';

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatDateTime(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

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

const invoiceTimelineByStatus = {
    pending: ['Dibuat', 'Menunggu Pembayaran', 'Belum Lunas'],
    partial: ['Dibuat', 'Cicilan Masuk', 'Belum Lunas'],
    paid: ['Dibuat', 'Pembayaran Tercatat', 'Lunas'],
    cancelled: ['Dibuat', 'Dibatalkan', 'Ditutup'],
};

function PaymentProgress({ total = 0, paid = 0 }) {
    const safeTotal = Number(total || 0);
    const safePaid = Number(paid || 0);
    const percent = safeTotal > 0 ? Math.min(100, Math.max(0, Math.round((safePaid / safeTotal) * 100))) : 0;

    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>Progress Bayar</span>
                <span>{percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

function InvoiceTimeline({ status }) {
    const steps = invoiceTimelineByStatus[status] || invoiceTimelineByStatus.pending;

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Timeline Invoice</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-700">{steps.join(' • ')}</p>
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

function ActionButton({ children, className = '', ...props }) {
    return (
        <button
            type="button"
            {...props}
            className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${className}`}
        >
            {children}
        </button>
    );
}

function TagihanCard({ item, onStatusChange, onDelete, onDetail, onCopy, onGatewayCreate }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.kode_tagihan}</p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{item.mahasiswa?.nama || '-'}</h4>
                    <p className="text-xs text-slate-500">{item.mahasiswa?.nim || '-'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[item.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabel[item.status] || item.status}
                </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <dt className="text-slate-400">Jenis</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{item.jenis}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Periode</dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                        {item.tahun_akademik || '-'} / {item.semester_akademik || '-'}
                    </dd>
                </div>
                <div>
                    <dt className="text-slate-400">Total</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{formatRupiah(item.total)}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Tempo</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{item.jatuh_tempo || '-'}</dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-slate-400">Transaksi</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{item.transaksis_count || 0} record</dd>
                </div>
            </dl>

            <div className="mt-4 space-y-2">
                <PaymentProgress total={item.total} paid={item.paid_amount || 0} />
                <select className="form-input" value={item.status} onChange={(e) => onStatusChange(item.id, e.target.value)}>
                    <option value="pending">pending</option>
                    <option value="partial">partial</option>
                    <option value="paid">paid</option>
                    <option value="cancelled">cancelled</option>
                </select>
                <div className="flex flex-wrap justify-end gap-2">
                    {item.status !== 'paid' ? (
                        <ActionButton onClick={() => onGatewayCreate(item.id)}>Buat Gateway</ActionButton>
                    ) : null}
                    <ActionButton onClick={() => onCopy(item.kode_tagihan, 'Kode tagihan')}>Salin Kode</ActionButton>
                    <ActionButton onClick={() => onDetail(item)}>Detail</ActionButton>
                    {item.transaksis_count > 0 ? (
                        <Link
                            href={route('keuangan.transaksi', { search: item.kode_tagihan })}
                            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                        >
                            Transaksi
                        </Link>
                    ) : null}
                    <IconButton variant="danger" label={`Hapus tagihan ${item.kode_tagihan}`} onClick={() => onDelete(item.id)}>
                        <ActionIcon name="trash" />
                    </IconButton>
                </div>
            </div>
        </article>
    );
}

function TransactionRow({ trx, onCopy }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{trx.order_id}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{trx.payment_type || '-'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[trx.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabel[trx.status] || trx.status}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <p className="text-slate-400">Nominal</p>
                    <p className="mt-1 font-semibold text-slate-900">{formatRupiah(trx.gross_amount)}</p>
                </div>
                <div>
                    <p className="text-slate-400">Waktu</p>
                    <p className="mt-1 font-semibold text-slate-700">{formatDateTime(trx.paid_at || trx.created_at)}</p>
                </div>
                <div>
                    <p className="text-slate-400">Fraud</p>
                    <p className="mt-1 font-semibold text-slate-700">{trx.fraud_status || '-'}</p>
                </div>
                <div>
                    <p className="text-slate-400">Snap</p>
                    <p className="mt-1 font-semibold text-slate-700">
                        {trx.redirect_url ? (
                            <a href={trx.redirect_url} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-dotted underline-offset-2">
                                Buka
                            </a>
                        ) : (
                            '-'
                        )}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton onClick={() => onCopy(trx.order_id, 'Order ID')}>Salin Order</ActionButton>
                <ActionButton onClick={() => onCopy(trx.payment_type, 'Metode pembayaran')} disabled={!trx.payment_type}>
                    Salin Metode
                </ActionButton>
            </div>
        </article>
    );
}

export default function Page({
    auth,
    mahasiswas = [],
    jenisPembayarans = [],
    prodis = [],
    angkatans = [],
    activeTarifs = [],
    filters = null,
    tagihans = { data: [], meta: null, links: [] },
}) {
    const { menu, flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'latest');
    const [sortDir, setSortDir] = useState(filters?.sort_dir || 'desc');
    const [toast, setToast] = useState(null);
    const [selectedTagihan, setSelectedTagihan] = useState(null);
    const [allocationDraft, setAllocationDraft] = useState({});
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const form = useForm({
        mahasiswa_id: '',
        tarif_id: '',
        tahun_akademik: '2025/2026',
        semester_akademik: 1,
        installment_months: 1,
        jatuh_tempo: '',
        keterangan: '',
    });

    const deleteForm = useForm();
    const paymentForm = useForm({
        jenis_pembayaran_id: '',
        provider: 'manual',
        reference: '',
        paid_at: '',
        amount: '',
        notes: '',
        allocations: [],
    });
    const bulkForm = useForm({
        prodi_id: '',
        angkatan: '',
        tahun_akademik: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        semester_akademik: 1,
        tarif_ids: [],
        jatuh_tempo: '',
    });

    const selectedTransactions = useMemo(() => selectedTagihan?.transactions || [], [selectedTagihan]);
    const selectedItems = useMemo(() => selectedTagihan?.items || [], [selectedTagihan]);
    const selectedPayments = useMemo(() => selectedTagihan?.pembayarans || [], [selectedTagihan]);
    const selectedTarif = useMemo(
        () => (activeTarifs || []).find((tarif) => Number(tarif.id) === Number(form.data.tarif_id)) || null,
        [activeTarifs, form.data.tarif_id]
    );
    const installmentPreview = useMemo(() => {
        if (!selectedTarif) return null;
        const months = Math.max(1, Number(form.data.installment_months || 1));
        const total = Number(selectedTarif.nominal || 0);
        return {
            months,
            perMonth: months > 0 ? Math.floor(total / months) : total,
            remainder: months > 0 ? total % months : 0,
        };
    }, [selectedTarif, form.data.installment_months]);
    const activeCheckoutUrl = useMemo(() => {
        const pending = selectedTransactions.find((trx) => trx.status === 'pending' && trx.redirect_url);
        return pending?.redirect_url || null;
    }, [selectedTransactions]);

    useEffect(() => {
        if (!selectedTagihan) return;
        setAllocationDraft({});
        paymentForm.reset('reference', 'paid_at', 'notes', 'amount', 'allocations');
        paymentForm.setData('jenis_pembayaran_id', '');
        paymentForm.setData('provider', 'manual');
    }, [selectedTagihan]); // eslint-disable-line react-hooks/exhaustive-deps

    const allocationTotal = useMemo(() => {
        return Object.values(allocationDraft).reduce((sum, raw) => sum + (Number(raw) || 0), 0);
    }, [allocationDraft]);

    const submit = (e) => {
        e.preventDefault();
        if (!selectedTarif) {
            form.setError('tarif_id', 'Pilih tarif dari Setup Tarif terlebih dahulu.');
            return;
        }

        form.clearErrors('tarif_id');
        const payload = {
            mahasiswa_id: form.data.mahasiswa_id,
            tahun_akademik: form.data.tahun_akademik || selectedTarif.tahun_akademik,
            semester_akademik: Number(form.data.semester_akademik || selectedTarif.semester_akademik || 1),
            jatuh_tempo: form.data.jatuh_tempo || null,
            keterangan: form.data.keterangan || null,
            installment_months: Number(form.data.installment_months || 1),
            items: [
                {
                    jenis_tagihan_id: selectedTarif.jenis_tagihan_id,
                    kode: selectedTarif.kode,
                    nama: selectedTarif.nama,
                    nominal: Number(selectedTarif.nominal || 0),
                    potongan: 0,
                    denda: 0,
                    sort_order: 0,
                },
            ],
        };

        form.transform(() => payload);
        form.post(route('keuangan.tagihan.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('tarif_id', 'installment_months', 'jatuh_tempo', 'keterangan');
                setCreateModalOpen(false);
            },
            onFinish: () => form.transform((data) => data),
        });
    };

    const updateStatus = (id, status) => {
        router.patch(route('keuangan.tagihan.status', id), { status }, { preserveScroll: true });
    };

    const createGatewayTransaksi = (id) => {
        router.post(route('keuangan.tagihan.gateway', id), {}, { preserveScroll: true });
    };

    const submitPayment = (e) => {
        e.preventDefault();
        if (!selectedTagihan?.id) return;

        const allocations = Object.entries(allocationDraft)
            .map(([tagihan_item_id, amount]) => ({ tagihan_item_id: Number(tagihan_item_id), amount: Number(amount) }))
            .filter((row) => row.tagihan_item_id && row.amount > 0);

        paymentForm.setData('amount', allocationTotal);
        paymentForm.setData('allocations', allocations);

        paymentForm.post(route('keuangan.tagihan.pembayaran.store', selectedTagihan.id), {
            preserveScroll: true,
            onSuccess: () => {
                setAllocationDraft({});
                paymentForm.reset('reference', 'paid_at', 'notes', 'amount', 'allocations');
                paymentForm.setData('jenis_pembayaran_id', '');
                paymentForm.setData('provider', 'manual');
            },
        });
    };

    const submitBulk = (e) => {
        e.preventDefault();
        bulkForm.post(route('keuangan.tagihan.bulk'), {
            preserveScroll: true,
            onSuccess: () => {
                setBulkModalOpen(false);
                bulkForm.reset('prodi_id', 'angkatan', 'tarif_ids', 'jatuh_tempo');
            },
        });
    };

    const confirmDeletion = (id) => {
        const item = tagihans.data.find(t => t.id === id);
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const removeItem = () => {
        deleteForm.delete(route('keuangan.tagihan.destroy', itemToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingDeletion(false);
                setItemToDelete(null);
            },
        });
    };

    const applyFilters = (pageUrl = null) => {
        const params = {
            search,
            status: statusFilter,
            per_page: perPage,
            sort_by: sortBy,
            sort_dir: sortDir,
        };

        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('keuangan.tagihan'), params, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPerPage('10');
        setSortBy('latest');
        setSortDir('desc');
        router.get(route('keuangan.tagihan'), {}, { preserveScroll: true, preserveState: true });
    };

    useEffect(() => {
        const normalizedSearch = filters?.search || '';
        if (search === normalizedSearch) {
            return undefined;
        }

        const timeout = setTimeout(() => {
            router.get(
                route('keuangan.tagihan'),
                {
                    search,
                    status: statusFilter,
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
            <Head title="Keuangan - Tagihan" />

            <ConfirmationModal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={removeItem}
                title="Hapus Tagihan"
                message={`Apakah Anda yakin ingin menghapus tagihan ${itemToDelete?.kode_tagihan} sebesar ${formatRupiah(itemToDelete?.total)}?`}
                processing={deleteForm.processing}
            />

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
                eyebrow="Penagihan"
                title="Manajemen Tagihan"
                description="Buat tagihan mahasiswa, atur status pembayaran, dan pantau invoice aktif dalam satu layar."
                note={`Total tagihan terdata: ${tagihans.meta?.total ?? 0}`}
            />

            <div className="grid gap-4">
                <section className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">Daftar Tagihan</h3>
                        <div className="flex items-center gap-2">
                            <button type="button" className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                                Tambah Tagihan
                            </button>
                            <button type="button" className="btn-primary" onClick={() => setBulkModalOpen(true)}>
                                Tagihan Kolektif
                            </button>
                            <a href={route('keuangan.tagihan.pdf', { search, status: statusFilter, sort_by: sortBy, sort_dir: sortDir })} className="btn-outline">
                                Export PDF
                            </a>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tagihans.meta?.total ?? 0} data</div>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_150px_130px_120px_auto_auto]">
                        <input
                            className="form-input"
                            placeholder="Cari kode, jenis, tahun, mahasiswa"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Semua status</option>
                            <option value="pending">pending</option>
                            <option value="partial">partial</option>
                            <option value="paid">paid</option>
                            <option value="cancelled">cancelled</option>
                        </select>
                        <select className="form-input" value={perPage} onChange={(e) => setPerPage(e.target.value)}>
                            <option value="10">10 / halaman</option>
                            <option value="30">30 / halaman</option>
                            <option value="50">50 / halaman</option>
                            <option value="100">100 / halaman</option>
                        </select>
                        <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="latest">Urut terbaru</option>
                            <option value="kode_tagihan">Kode tagihan</option>
                            <option value="jenis">Jenis</option>
                            <option value="tahun_akademik">Tahun akademik</option>
                            <option value="total">Total</option>
                            <option value="status">Status</option>
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
                        {tagihans.data.length ? (
                            tagihans.data.map((item) => (
                                <TagihanCard
                                    key={item.id}
                                    item={item}
                                    onStatusChange={updateStatus}
                                    onDelete={confirmDeletion}
                                    onDetail={setSelectedTagihan}
                                    onCopy={copyValue}
                                    onGatewayCreate={createGatewayTransaksi}
                                />
                            ))
                        ) : (
                            <EmptyState title="Belum ada tagihan" description="Data tagihan akan muncul setelah dibuat." />
                        )}
                    </div>

                    <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                        <table className="min-w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="px-2 py-2">Kode</th>
                                    <th className="px-2 py-2">Mahasiswa</th>
                                    <th className="px-2 py-2">Jenis</th>
                                    <th className="px-2 py-2">Periode</th>
                                    <th className="px-2 py-2">Total</th>
                                    <th className="px-2 py-2">Status</th>
                                    <th className="px-2 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tagihans.data.length ? (
                                    tagihans.data.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100 align-top">
                                            <td className="px-2 py-2 font-semibold text-slate-700">{item.kode_tagihan}</td>
                                            <td className="px-2 py-2 text-slate-600">
                                                {item.mahasiswa?.nim} - {item.mahasiswa?.nama}
                                            </td>
                                            <td className="px-2 py-2 text-slate-600">{item.jenis}</td>
                                            <td className="px-2 py-2 text-slate-600">
                                                {item.tahun_akademik || '-'} / {item.semester_akademik || '-'}
                                            </td>
                                            <td className="px-2 py-2 text-slate-700">{formatRupiah(item.total)}</td>
                                            <td className="px-2 py-2">
                                                <select className="form-input py-1 text-xs" value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)}>
                                                    <option value="pending">pending</option>
                                                    <option value="partial">partial</option>
                                                    <option value="paid">paid</option>
                                                    <option value="cancelled">cancelled</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                                        onClick={() => copyValue(item.kode_tagihan, 'Kode tagihan')}
                                                    >
                                                        Salin Kode
                                                    </button>
                                                    {item.status !== 'paid' ? (
                                                        <button
                                                            type="button"
                                                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                                            onClick={() => createGatewayTransaksi(item.id)}
                                                        >
                                                            Buat Gateway
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                                        onClick={() => setSelectedTagihan(item)}
                                                    >
                                                        Detail
                                                    </button>
                                                    {item.transaksis_count > 0 ? (
                                                        <Link
                                                            href={route('keuangan.transaksi', { search: item.kode_tagihan })}
                                                            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                                                        >
                                                            Transaksi
                                                        </Link>
                                                    ) : null}
                                                    <IconButton variant="danger" label={`Hapus tagihan ${item.kode_tagihan}`} onClick={() => confirmDeletion(item.id)}>
                                                        <ActionIcon name="trash" />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-2 py-3 text-slate-500" colSpan="7">
                                            Tidak ada data tagihan yang cocok dengan filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan {tagihans.meta?.from ?? 0}-{tagihans.meta?.to ?? 0} dari {tagihans.meta?.total ?? 0} data
                        </p>
                        <PaginationButtons links={tagihans.links} onClick={(url) => applyFilters(url)} />
                    </div>
                </section>
            </div>
            <Modal show={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="2xl">
                <div className="px-5 py-4">
                    <h3 className="text-lg font-bold text-slate-900">Tambah Tagihan</h3>
                    <p className="mt-1 text-xs text-slate-500">Pilih mahasiswa, tarif, dan opsi cicilan. Sistem akan membuat rincian tagihan otomatis.</p>
                    {flash?.error && <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">{flash.error}</p>}
                    <form onSubmit={submit} className="mt-4 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700">Mahasiswa</label>
                                <select className="form-input mt-1" value={form.data.mahasiswa_id} onChange={(e) => form.setData('mahasiswa_id', e.target.value)}>
                                    <option value="">Pilih mahasiswa</option>
                                    {mahasiswas.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.nim} - {m.nama}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={form.errors.mahasiswa_id} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700">Tarif (Setup Tarif)</label>
                                <select
                                    className="form-input mt-1"
                                    value={form.data.tarif_id}
                                    onChange={(e) => {
                                        const nextId = e.target.value;
                                        form.setData('tarif_id', nextId);
                                        const tarif = (activeTarifs || []).find((row) => Number(row.id) === Number(nextId));
                                        form.setData('installment_months', tarif?.can_installment ? (tarif.installment_default || 1) : 1);
                                    }}
                                >
                                    <option value="">Pilih tarif aktif</option>
                                    {activeTarifs.map((tarif) => (
                                        <option key={tarif.id} value={tarif.id}>
                                            {tarif.label}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={form.errors.tarif_id} />
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700">Tahun Akademik</label>
                                <input className="form-input mt-1" value={form.data.tahun_akademik} onChange={(e) => form.setData('tahun_akademik', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700">Semester</label>
                                <input type="number" min="1" max="14" className="form-input mt-1" value={form.data.semester_akademik} onChange={(e) => form.setData('semester_akademik', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700">Jatuh Tempo</label>
                                <input type="date" className="form-input mt-1" value={form.data.jatuh_tempo} onChange={(e) => form.setData('jatuh_tempo', e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700">Skema Pembayaran</label>
                            {selectedTarif?.can_installment ? (
                                <select className="form-input mt-1" value={form.data.installment_months} onChange={(e) => form.setData('installment_months', Number(e.target.value || 1))}>
                                    {Array.from({ length: Math.max(1, Number(selectedTarif.installment_max || 1)) }, (_, idx) => idx + 1).map((months) => (
                                        <option key={`inst-${months}`} value={months}>
                                            {months === 1 ? 'Lunas Sekali Bayar' : `Cicil ${months} Bulan`}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input className="form-input mt-1 bg-slate-50" value="Tarif ini tidak mendukung cicilan (sekali bayar)" disabled />
                            )}
                            {installmentPreview ? (
                                <p className="mt-1 text-[11px] font-semibold text-slate-600">
                                    Total {formatRupiah(selectedTarif?.nominal || 0)} dibagi {installmentPreview.months} bulan.
                                    Per cicilan sekitar {formatRupiah(installmentPreview.perMonth)}
                                    {installmentPreview.remainder > 0 ? ` (sisa pembulatan ${installmentPreview.remainder} akan ditambahkan ke cicilan awal).` : '.'}
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700">Keterangan</label>
                            <textarea rows="2" className="form-input mt-1" value={form.data.keterangan} onChange={(e) => form.setData('keterangan', e.target.value)} placeholder="Catatan tambahan (opsional)" />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <SecondaryButton type="button" onClick={() => setCreateModalOpen(false)}>
                                Batal
                            </SecondaryButton>
                            <button type="submit" disabled={form.processing} className="btn-primary">
                                {form.processing ? 'Menyimpan...' : 'Simpan Tagihan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal show={Boolean(selectedTagihan)} onClose={() => setSelectedTagihan(null)} maxWidth="2xl">
                {selectedTagihan && (
                    <div className="max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Detail Tagihan</p>
                                <h3 className="mt-1 text-lg font-bold text-slate-900">{selectedTagihan.kode_tagihan}</h3>
                                <p className="text-sm text-slate-500">
                                    {selectedTagihan.mahasiswa?.nim} - {selectedTagihan.mahasiswa?.nama}
                                </p>
                            </div>
                            <SecondaryButton onClick={() => setSelectedTagihan(null)}>Tutup</SecondaryButton>
                        </div>

                        <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_1.1fr]">
                            <section className="space-y-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                                    <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[selectedTagihan.status] || 'bg-slate-100 text-slate-700'}`}>
                                        {statusLabel[selectedTagihan.status] || selectedTagihan.status}
                                    </p>
                                    <div className="mt-3">
                                        <InvoiceTimeline status={selectedTagihan.status} />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Jenis & Periode</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedTagihan.jenis}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {selectedTagihan.tahun_akademik || '-'} / {selectedTagihan.semester_akademik || '-'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nominal</p>
                                    <p className="mt-2 text-lg font-black text-slate-900">{formatRupiah(selectedTagihan.total)}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Nominal {formatRupiah(selectedTagihan.nominal)} | Potongan {formatRupiah(selectedTagihan.potongan)} | Denda {formatRupiah(selectedTagihan.denda)}
                                    </p>
                                    <p className="mt-2 text-xs font-semibold text-slate-600">
                                        Terbayar {formatRupiah(selectedTagihan.paid_amount || 0)} • Sisa {formatRupiah(selectedTagihan.remaining_amount || 0)}
                                    </p>
                                    <div className="mt-3">
                                        <PaymentProgress total={selectedTagihan.total} paid={selectedTagihan.paid_amount || 0} />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Keterangan</p>
                                    <p className="mt-2 text-sm text-slate-700">{selectedTagihan.keterangan || '-'}</p>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Rincian Tagihan</h4>
                                    <p className="text-xs text-slate-500">{selectedItems.length} item</p>
                                </div>

                                <div className="space-y-2">
                                    {selectedItems.length ? (
                                        selectedItems.map((item) => (
                                            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.kode}</p>
                                                        <h5 className="mt-1 text-sm font-bold text-slate-900">{item.nama}</h5>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Total {formatRupiah(item.total)} - Terbayar {formatRupiah(item.paid_amount || 0)} - Sisa {formatRupiah(item.remaining_amount || 0)}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-slate-500">Jatuh tempo item: {item.jatuh_tempo || '-'}</p>
                                                    </div>
                                                </div>
                                                {item.keterangan ? <p className="mt-3 text-xs text-slate-600">{item.keterangan}</p> : null}
                                            </article>
                                        ))
                                    ) : (
                                        <EmptyState title="Belum ada rincian" description="Tagihan ini belum memiliki item rincian." />
                                    )}
                                </div>

                                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <h4 className="text-sm font-bold text-slate-900">Catat Pembayaran / Cicilan</h4>
                                    <p className="mt-1 text-xs text-slate-500">Isi nominal per item yang ingin dibayar. Total pembayaran akan mengikuti jumlah alokasi.</p>

                                    <form onSubmit={submitPayment} className="mt-3 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <select
                                                    className="form-input"
                                                    value={paymentForm.data.jenis_pembayaran_id}
                                                    onChange={(e) => paymentForm.setData('jenis_pembayaran_id', e.target.value)}
                                                >
                                                    <option value="">Pilih jenis pembayaran</option>
                                                    {jenisPembayarans.map((jp) => (
                                                        <option key={jp.id} value={jp.id}>
                                                            {jp.kode} - {jp.nama}
                                                        </option>
                                                    ))}
                                                </select>
                                                <FieldError message={paymentForm.errors.jenis_pembayaran_id} />
                                            </div>
                                            <div>
                                                <input
                                                    className="form-input"
                                                    placeholder="Referensi (opsional)"
                                                    value={paymentForm.data.reference}
                                                    onChange={(e) => paymentForm.setData('reference', e.target.value)}
                                                />
                                                <FieldError message={paymentForm.errors.reference} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={paymentForm.data.paid_at}
                                                    onChange={(e) => paymentForm.setData('paid_at', e.target.value)}
                                                />
                                                <FieldError message={paymentForm.errors.paid_at} />
                                            </div>
                                            <div>
                                                <input className="form-input" value={formatRupiah(allocationTotal)} disabled />
                                                <FieldError message={paymentForm.errors.amount} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {selectedItems.map((item) => (
                                                <div key={`alloc-${item.id}`} className="grid grid-cols-[1fr_160px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">{item.nama}</p>
                                                        <p className="text-[11px] text-slate-500">Sisa {formatRupiah(item.remaining_amount || 0)}</p>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-input"
                                                        placeholder="0"
                                                        value={allocationDraft[item.id] ?? ''}
                                                        onChange={(e) => setAllocationDraft((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                                    />
                                                </div>
                                            ))}
                                            <FieldError message={paymentForm.errors.allocations} />
                                        </div>

                                        <div>
                                            <textarea
                                                className="form-input min-h-[90px]"
                                                placeholder="Catatan (opsional)"
                                                value={paymentForm.data.notes}
                                                onChange={(e) => paymentForm.setData('notes', e.target.value)}
                                            />
                                            <FieldError message={paymentForm.errors.notes} />
                                        </div>

                                        <button className="btn-primary w-full" type="submit" disabled={paymentForm.processing || allocationTotal <= 0}>
                                            {paymentForm.processing ? 'Menyimpan...' : 'Catat Pembayaran'}
                                        </button>
                                    </form>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Riwayat Transaksi</h4>
                                        <p className="text-xs text-slate-500">{selectedTransactions.length} record</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeCheckoutUrl ? (
                                            <a
                                                href={activeCheckoutUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                                            >
                                                Buka Checkout
                                            </a>
                                        ) : null}
                                        {selectedTagihan.status !== 'paid' ? (
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                onClick={() => createGatewayTransaksi(selectedTagihan.id)}
                                            >
                                                Buat Gateway
                                            </button>
                                        ) : null}
                                        <Link href={route('keuangan.transaksi', { search: selectedTagihan.kode_tagihan })} className="btn-outline">
                                            Buka Transaksi
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {selectedTransactions.length ? (
                                        selectedTransactions.map((trx) => <TransactionRow key={trx.id} trx={trx} onCopy={copyValue} />)
                                    ) : (
                                        <EmptyState title="Belum ada transaksi" description="Invoice ini belum memiliki riwayat transaksi." />
                                    )}
                                </div>

                                <div className="mt-2">
                                    <h4 className="text-sm font-bold text-slate-900">Riwayat Pembayaran</h4>
                                    <p className="text-xs text-slate-500">{selectedPayments.length} record</p>
                                </div>
                                <div className="space-y-2">
                                    {selectedPayments.length ? (
                                        selectedPayments.map((p) => (
                                            <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                            {p.jenis_pembayaran ? `${p.jenis_pembayaran.kode} - ${p.jenis_pembayaran.nama}` : 'Pembayaran'}
                                                        </p>
                                                        <p className="mt-1 text-sm font-bold text-slate-900">{formatRupiah(p.amount)}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(p.paid_at)}</p>
                                                    </div>
                                                    {p.reference ? (
                                                        <button type="button" className="btn-outline" onClick={() => copyValue(p.reference, 'Referensi')}>
                                                            Salin Ref
                                                        </button>
                                                    ) : null}
                                                </div>
                                                {p.notes ? <p className="mt-3 text-xs text-slate-600">{p.notes}</p> : null}
                                            </article>
                                        ))
                                    ) : (
                                        <EmptyState title="Belum ada pembayaran" description="Belum ada cicilan/pembayaran manual yang dicatat." />
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal show={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="lg">
                <div className="px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">Buat Tagihan Kolektif</h3>
                    <p className="mt-1 text-xs text-slate-500 text-pretty">Pilih kriteria mahasiswa dan jenis tagihan. Sistem akan otomatis membuat tagihan untuk seluruh mahasiswa aktif yang sesuai.</p>
                    
                    <form onSubmit={submitBulk} className="mt-5 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700">Filter Prodi</label>
                            <select className="form-input mt-1" value={bulkForm.data.prodi_id} onChange={(e) => bulkForm.setData('prodi_id', e.target.value)}>
                                <option value="">Semua Program Studi</option>
                                {prodis.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700">Filter Angkatan</label>
                            <select className="form-input mt-1" value={bulkForm.data.angkatan} onChange={(e) => bulkForm.setData('angkatan', e.target.value)}>
                                <option value="">Semua Angkatan</option>
                                {angkatans.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700">Tahun Akademik</label>
                                <input className="form-input mt-1" value={bulkForm.data.tahun_akademik} onChange={(e) => bulkForm.setData('tahun_akademik', e.target.value)} />
                                <FieldError message={bulkForm.errors.tahun_akademik} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700">Semester</label>
                                <input type="number" className="form-input mt-1" value={bulkForm.data.semester_akademik} onChange={(e) => bulkForm.setData('semester_akademik', e.target.value)} />
                                <FieldError message={bulkForm.errors.semester_akademik} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700">Pilih Tarif (Bisa pilih lebih dari satu)</label>
                            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                                {activeTarifs.map((t) => (
                                    <label key={t.id} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-emerald-600"
                                            value={t.id}
                                            checked={bulkForm.data.tarif_ids.includes(t.id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const ids = [...bulkForm.data.tarif_ids];
                                                if (checked) ids.push(t.id);
                                                else ids.splice(ids.indexOf(t.id), 1);
                                                bulkForm.setData('tarif_ids', ids);
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-slate-600">{t.nama}</span>
                                    </label>
                                ))}
                            </div>
                            <FieldError message={bulkForm.errors.tarif_ids} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700">Jatuh Tempo</label>
                            <input type="date" className="form-input mt-1" value={bulkForm.data.jatuh_tempo} onChange={(e) => bulkForm.setData('jatuh_tempo', e.target.value)} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <SecondaryButton onClick={() => setBulkModalOpen(false)}>Batal</SecondaryButton>
                            <button type="submit" disabled={bulkForm.processing} className="btn-primary">
                                {bulkForm.processing ? 'Memproses...' : 'Generate Tagihan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

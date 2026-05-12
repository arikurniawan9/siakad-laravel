import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDateTime(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

const statusBadge = {
    pending: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    ignored: 'bg-slate-200 text-slate-700',
};

export default function Page({ auth, items = [], filters = null }) {
    const { menu, flash } = usePage().props;
    const [status, setStatus] = useState(filters?.status || 'pending');
    const [search, setSearch] = useState(filters?.search || '');
    const [limit, setLimit] = useState(String(filters?.limit || 50));

    const [confirmingAction, setConfirmingAction] = useState(null); // resolve|ignore
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const notesForm = useForm({ resolution_notes: '' });

    const summary = useMemo(() => {
        const pending = items.filter((i) => i.status === 'pending').length;
        const resolved = items.filter((i) => i.status === 'resolved').length;
        const ignored = items.filter((i) => i.status === 'ignored').length;
        return { total: items.length, pending, resolved, ignored };
    }, [items]);

    const applyFilters = () => {
        router.get(route('settings.finance-reconciliation.index'), { status, search, limit }, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setStatus('pending');
        setSearch('');
        setLimit('50');
        router.get(route('settings.finance-reconciliation.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const openAction = (action, item) => {
        setSelectedItem(item);
        setConfirmingAction(action);
        notesForm.setData('resolution_notes', item?.resolution_notes || '');
    };

    const submitAction = () => {
        if (!selectedItem?.id) return;
        const targetRoute =
            confirmingAction === 'resolve'
                ? route('settings.finance-reconciliation.resolve', selectedItem.id)
                : route('settings.finance-reconciliation.ignore', selectedItem.id);

        notesForm.patch(targetRoute, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingAction(null);
                setSelectedItem(null);
                notesForm.reset('resolution_notes');
            },
        });
    };

    const pendingItems = useMemo(() => items.filter((item) => item.status === 'pending'), [items]);
    const allPendingSelected = pendingItems.length > 0 && pendingItems.every((item) => selectedIds.includes(item.id));

    const toggleSelectAllPending = () => {
        if (allPendingSelected) {
            setSelectedIds([]);
            return;
        }
        setSelectedIds(pendingItems.map((item) => item.id));
    };

    const toggleSelectItem = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const bulkSubmit = (action) => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Proses ${action} untuk ${selectedIds.length} item terpilih?`)) return;

        notesForm.transform((data) => ({
            ...data,
            action,
            item_ids: selectedIds,
        })).patch(route('settings.finance-reconciliation.bulk'), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds([]);
                notesForm.reset('resolution_notes');
            },
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Rekonsiliasi Keuangan" />

            <ConfirmationModal
                show={!!confirmingAction}
                onClose={() => setConfirmingAction(null)}
                onConfirm={submitAction}
                title={confirmingAction === 'resolve' ? 'Resolve Item' : 'Ignore Item'}
                message={
                    selectedItem
                        ? `Order ${selectedItem.order_id} sebesar ${formatRupiah(selectedItem.amount)} akan ditandai ${confirmingAction}.`
                        : 'Konfirmasi aksi.'
                }
                confirmText={confirmingAction === 'resolve' ? 'Resolve + Catat' : 'Ignore'}
                processing={notesForm.processing}
            />

            <ModuleHero
                eyebrow="Keuangan"
                title="Antrian Rekonsiliasi"
                description="Daftar callback pembayaran gateway yang tidak dicatat otomatis (mis. karena periode sudah dikunci)."
                note={`Total: ${summary.total} • Pending: ${summary.pending} • Resolved: ${summary.resolved} • Ignored: ${summary.ignored}`}
            />

            <section className="panel p-4">
                {flash?.error && <p className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">{flash.error}</p>}
                {flash?.success && <p className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}

                <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_120px_auto_auto]">
                    <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="pending">pending</option>
                        <option value="resolved">resolved</option>
                        <option value="ignored">ignored</option>
                        <option value="all">all</option>
                    </select>
                    <input
                        className="form-input"
                        placeholder="Cari order ID / transaction ID / kode tagihan"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    />
                    <select className="form-input" value={limit} onChange={(e) => setLimit(e.target.value)}>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                    </select>
                    <button type="button" className="btn-primary" onClick={applyFilters}>
                        Terapkan
                    </button>
                    <button type="button" className="btn-outline" onClick={resetFilters}>
                        Reset
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <button type="button" className="btn-outline" onClick={toggleSelectAllPending}>
                        {allPendingSelected ? 'Batal Pilih Semua Pending' : 'Pilih Semua Pending'}
                    </button>
                    <button type="button" className="btn-primary" onClick={() => bulkSubmit('resolve')} disabled={selectedIds.length === 0 || notesForm.processing}>
                        Resolve Terpilih ({selectedIds.length})
                    </button>
                    <button type="button" className="btn-outline" onClick={() => bulkSubmit('ignore')} disabled={selectedIds.length === 0 || notesForm.processing}>
                        Ignore Terpilih
                    </button>
                    <input
                        className="form-input ml-auto max-w-sm"
                        placeholder="Catatan bulk (opsional)"
                        value={notesForm.data.resolution_notes}
                        onChange={(e) => notesForm.setData('resolution_notes', e.target.value)}
                    />
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full text-left text-xs">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-3 py-2">Pilih</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Order</th>
                                <th className="px-3 py-2">Tagihan</th>
                                <th className="px-3 py-2">Nominal</th>
                                <th className="px-3 py-2">Waktu</th>
                                <th className="px-3 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-3 py-6 text-center text-slate-500">
                                        Tidak ada item.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100 align-top">
                                        <td className="px-3 py-2">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300"
                                                disabled={item.status !== 'pending'}
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelectItem(item.id)}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadge[item.status] || 'bg-slate-100 text-slate-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="font-semibold text-slate-800">{item.order_id}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">{item.provider} • {item.payment_type || '-'} • trx {item.transaction_id || '-'}</p>
                                        </td>
                                        <td className="px-3 py-2 text-slate-600">
                                            <p className="font-semibold text-slate-800">{item.tagihan?.kode_tagihan || '-'}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                {item.tagihan?.tahun_akademik || '-'} / {item.tagihan?.semester_akademik || '-'} • {item.tagihan?.status || '-'}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2 font-semibold text-slate-900">{formatRupiah(item.amount)}</td>
                                        <td className="px-3 py-2 text-slate-600">{formatDateTime(item.created_at)}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" className="btn-outline" onClick={() => openAction('resolve', item)} disabled={item.status !== 'pending'}>
                                                    Resolve + Catat
                                                </button>
                                                <button type="button" className="btn-outline" onClick={() => openAction('ignore', item)} disabled={item.status !== 'pending'}>
                                                    Ignore
                                                </button>
                                                {item.undo_available ? (
                                                    <button
                                                        type="button"
                                                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                                        onClick={() => router.patch(route('settings.finance-reconciliation.undoIgnore', item.id), {}, { preserveScroll: true })}
                                                    >
                                                        Undo Ignore
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

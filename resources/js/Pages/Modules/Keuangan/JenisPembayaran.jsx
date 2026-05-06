import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import ConfirmationModal from '@/Components/ConfirmationModal';
import EmptyState from '../Akademik/EmptyState';
import { ActionIcon, FieldError, IconButton, StatusBadge } from '../Akademik/CrudParts';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Fragment, useEffect, useMemo, useState } from 'react';

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

function RowActions({ onEdit, onDelete, kode }) {
    return (
        <div className="flex items-center justify-end gap-2">
            <IconButton variant="neutral" label={`Edit ${kode}`} onClick={onEdit}>
                <ActionIcon name="edit" />
            </IconButton>
            <IconButton variant="danger" label={`Hapus ${kode}`} onClick={onDelete}>
                <ActionIcon name="trash" />
            </IconButton>
        </div>
    );
}

export default function Page({ auth, filters = null, jenisPembayarans = { data: [], meta: null, links: [] } }) {
    const { menu, flash } = usePage().props;
    const data = jenisPembayarans.data || [];
    const meta = jenisPembayarans.meta || {};
    const links = jenisPembayarans.links || [];

    const [search, setSearch] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'sort_order');
    const [sortDir, setSortDir] = useState(filters?.sort_dir || 'asc');

    const [editing, setEditing] = useState(null);
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const form = useForm({ kode: '', nama: '', provider: 'manual', payment_type: '', sort_order: 0, is_active: true, keterangan: '' });
    const edit = useForm({ kode: '', nama: '', provider: 'manual', payment_type: '', sort_order: 0, is_active: true, keterangan: '' });
    const deleteForm = useForm();

    useEffect(() => {
        if (!editing) return;
        edit.setData({
            kode: editing.kode || '',
            nama: editing.nama || '',
            provider: editing.provider || 'manual',
            payment_type: editing.payment_type || '',
            sort_order: editing.sort_order ?? 0,
            is_active: !!editing.is_active,
            keterangan: editing.keterangan || '',
        });
    }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

    const applyFilters = (pageUrl = null) => {
        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(
            route('keuangan.jenis-pembayaran'),
            { search, per_page: perPage, sort_by: sortBy, sort_dir: sortDir },
            { preserveScroll: true, preserveState: true }
        );
    };

    const resetFilters = () => {
        setSearch('');
        setPerPage('10');
        setSortBy('sort_order');
        setSortDir('asc');
        router.get(route('keuangan.jenis-pembayaran'), {}, { preserveScroll: true, preserveState: true });
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('keuangan.jenis-pembayaran.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('kode', 'nama', 'provider', 'payment_type', 'sort_order', 'is_active', 'keterangan'),
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editing?.id) return;

        edit.put(route('keuangan.jenis-pembayaran.update', editing.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    const confirmDeletion = (item) => {
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const removeItem = () => {
        if (!itemToDelete?.id) return;
        deleteForm.delete(route('keuangan.jenis-pembayaran.destroy', itemToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingDeletion(false);
                setItemToDelete(null);
            },
        });
    };

    const providerLabel = useMemo(() => ({
        manual: 'Manual',
        midtrans: 'Midtrans',
    }), []);

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">Keuangan - Jenis Pembayaran</h2>}>
            <Head title="Keuangan - Jenis Pembayaran" />

            <ModuleHero
                eyebrow="Modul Keuangan"
                title="Setup Jenis Pembayaran"
                description="Atur daftar metode/jenis pembayaran yang digunakan untuk pencatatan transaksi (manual maupun gateway)."
                actions={(
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('keuangan.tagihan')} className="btn-outline">Tagihan</Link>
                        <Link href={route('keuangan.transaksi')} className="btn-outline">Transaksi</Link>
                    </div>
                )}
            />

            {flash?.error && <div className="mb-3 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">{flash.error}</div>}
            {flash?.success && <div className="mb-3 rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">{flash.success}</div>}

            <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                <section className="panel p-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tambah Data</p>
                        <h3 className="mt-1 text-sm font-bold text-slate-900">Jenis Pembayaran Baru</h3>
                        <p className="mt-1 text-xs text-slate-500">Gunakan `KODE` singkat, misalnya: CASH, TRANSFER_BCA, QRIS.</p>
                    </div>

                    <form onSubmit={submit} className="mt-4 space-y-3">
                        <div>
                            <input className="form-input" placeholder="Kode (unik)" value={form.data.kode} onChange={(e) => form.setData('kode', e.target.value)} />
                            <FieldError message={form.errors.kode} />
                        </div>
                        <div>
                            <input className="form-input" placeholder="Nama tampilan" value={form.data.nama} onChange={(e) => form.setData('nama', e.target.value)} />
                            <FieldError message={form.errors.nama} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <select className="form-input" value={form.data.provider} onChange={(e) => form.setData('provider', e.target.value)}>
                                    <option value="manual">Manual</option>
                                    <option value="midtrans">Midtrans</option>
                                </select>
                                <FieldError message={form.errors.provider} />
                            </div>
                            <div>
                                <input
                                    className="form-input"
                                    placeholder="Sort (0..)"
                                    type="number"
                                    value={form.data.sort_order}
                                    onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                                />
                                <FieldError message={form.errors.sort_order} />
                            </div>
                        </div>
                        <div>
                            <input
                                className="form-input"
                                placeholder="payment_type (opsional, mapping gateway)"
                                value={form.data.payment_type}
                                onChange={(e) => form.setData('payment_type', e.target.value)}
                            />
                            <FieldError message={form.errors.payment_type} />
                        </div>
                        <div>
                            <textarea className="form-input min-h-[90px]" placeholder="Keterangan (opsional)" value={form.data.keterangan} onChange={(e) => form.setData('keterangan', e.target.value)} />
                            <FieldError message={form.errors.keterangan} />
                        </div>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                            <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                            Aktif digunakan
                        </label>
                        <button className="btn-primary w-full" type="submit" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </form>
                </section>

                <section className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Daftar Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Jenis Pembayaran</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{meta.total ?? 0} data</span>
                    </div>

                    <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_160px_140px_auto_auto]">
                        <input
                            className="form-input"
                            placeholder="Cari kode/nama/provider"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                        <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="sort_order">Sort</option>
                            <option value="kode">Kode</option>
                            <option value="nama">Nama</option>
                            <option value="provider">Provider</option>
                            <option value="is_active">Status</option>
                            <option value="created_at">Terbaru</option>
                        </select>
                        <select className="form-input" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                            <option value="asc">Asc</option>
                            <option value="desc">Desc</option>
                        </select>
                        <select className="form-input" value={perPage} onChange={(e) => setPerPage(e.target.value)}>
                            <option value="10">10 / halaman</option>
                            <option value="30">30 / halaman</option>
                            <option value="50">50 / halaman</option>
                            <option value="100">100 / halaman</option>
                        </select>
                        <div className="flex gap-2">
                            <button type="button" className="btn-primary" onClick={() => applyFilters()}>Terapkan</button>
                            <button type="button" className="btn-outline" onClick={resetFilters}>Reset</button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3 md:hidden">
                        {data.length ? data.map((item) => (
                            <Fragment key={item.id}>
                                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.kode}</p>
                                            <h4 className="mt-1 text-sm font-bold text-slate-900">{item.nama}</h4>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {providerLabel[item.provider] || item.provider}{item.payment_type ? ` • ${item.payment_type}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <StatusBadge active={item.is_active} />
                                            <RowActions kode={item.kode} onEdit={() => setEditing(item)} onDelete={() => confirmDeletion(item)} />
                                        </div>
                                    </div>
                                    {item.keterangan && <p className="mt-3 text-xs leading-relaxed text-slate-600">{item.keterangan}</p>}
                                </article>
                            </Fragment>
                        )) : <EmptyState title="Belum ada data" description="Tambahkan jenis pembayaran terlebih dahulu untuk mulai dipakai di modul keuangan." />}
                    </div>

                    <div className="mt-4 hidden overflow-x-auto md:block">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                <tr className="border-b border-slate-200">
                                    <th className="px-3 py-3">Kode</th>
                                    <th className="px-3 py-3">Nama</th>
                                    <th className="px-3 py-3">Provider</th>
                                    <th className="px-3 py-3">payment_type</th>
                                    <th className="px-3 py-3">Sort</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.length ? data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-3">
                                            <p className="text-xs font-black tracking-[0.16em] text-slate-900">{item.kode}</p>
                                        </td>
                                        <td className="px-3 py-3">
                                            <p className="font-semibold text-slate-900">{item.nama}</p>
                                            {item.keterangan && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.keterangan}</p>}
                                        </td>
                                        <td className="px-3 py-3 text-slate-700">{providerLabel[item.provider] || item.provider}</td>
                                        <td className="px-3 py-3 text-slate-700">{item.payment_type || '-'}</td>
                                        <td className="px-3 py-3 text-slate-700">{item.sort_order ?? 0}</td>
                                        <td className="px-3 py-3">
                                            <StatusBadge active={item.is_active} />
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <RowActions kode={item.kode} onEdit={() => setEditing(item)} onDelete={() => confirmDeletion(item)} />
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={7}>
                                            Belum ada data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">Menampilkan {meta.from ?? 0}-{meta.to ?? 0} dari {meta.total ?? 0} data</p>
                        <PaginationButtons links={links} onClick={(url) => applyFilters(url)} />
                    </div>
                </section>
            </div>

            <Modal show={!!editing} onClose={() => setEditing(null)} maxWidth="2xl">
                <div className="p-6">
                    <h3 className="text-lg font-extrabold text-slate-900">Edit Jenis Pembayaran</h3>
                    <p className="mt-1 text-sm text-slate-500">Perbarui nama, mapping, dan status aktif.</p>

                    <form onSubmit={submitEdit} className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Kode</label>
                                <input className="form-input mt-1" value={edit.data.kode} onChange={(e) => edit.setData('kode', e.target.value)} />
                                <FieldError message={edit.errors.kode} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sort</label>
                                <input type="number" className="form-input mt-1" value={edit.data.sort_order} onChange={(e) => edit.setData('sort_order', Number(e.target.value))} />
                                <FieldError message={edit.errors.sort_order} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nama</label>
                            <input className="form-input mt-1" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                            <FieldError message={edit.errors.nama} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Provider</label>
                                <select className="form-input mt-1" value={edit.data.provider} onChange={(e) => edit.setData('provider', e.target.value)}>
                                    <option value="manual">Manual</option>
                                    <option value="midtrans">Midtrans</option>
                                </select>
                                <FieldError message={edit.errors.provider} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">payment_type</label>
                                <input className="form-input mt-1" value={edit.data.payment_type} onChange={(e) => edit.setData('payment_type', e.target.value)} />
                                <FieldError message={edit.errors.payment_type} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Keterangan</label>
                            <textarea className="form-input mt-1 min-h-[100px]" value={edit.data.keterangan} onChange={(e) => edit.setData('keterangan', e.target.value)} />
                            <FieldError message={edit.errors.keterangan} />
                        </div>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                            <input type="checkbox" checked={!!edit.data.is_active} onChange={(e) => edit.setData('is_active', e.target.checked)} />
                            Aktif digunakan
                        </label>

                        <div className="mt-2 flex justify-end gap-2">
                            <SecondaryButton type="button" onClick={() => setEditing(null)}>
                                Batal
                            </SecondaryButton>
                            <button className="btn-primary" type="submit" disabled={edit.processing}>
                                {edit.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmationModal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                title="Hapus jenis pembayaran?"
                message={`Anda yakin ingin menghapus ${itemToDelete?.kode || 'data ini'}?`}
                confirmText="Hapus"
                cancelText="Batal"
                onConfirm={removeItem}
                processing={deleteForm.processing}
            />
        </AuthenticatedLayout>
    );
}


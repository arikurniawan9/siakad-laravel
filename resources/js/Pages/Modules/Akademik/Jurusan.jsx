import { Fragment, useEffect, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import EmptyState from './EmptyState';
import PageShell from './PageShell';
import { ActionIcon, FieldError, IconButton } from './CrudParts';
import ConfirmationModal from '@/Components/ConfirmationModal';

function Pagination({ links = [], meta = {} }) {
    if (!links.length) return null;

    return (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
                Menampilkan {meta.from ?? 0}-{meta.to ?? 0} dari {meta.total ?? 0} data
            </p>
            <div className="flex flex-wrap gap-2">
                {links.map((link, index) => (
                    <button
                        key={`${link.label}-${index}`}
                        type="button"
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                            link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
                        }`}
                    >
                        {link.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ImportSpinner() {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Memproses import</p>
                <p className="text-sm font-semibold text-slate-800">Harap tunggu, data jurusan sedang disimpan.</p>
            </div>
        </div>
    );
}

function RowActions({ onEdit, onDelete, kode }) {
    return (
        <div className="flex items-center gap-2">
            <IconButton variant="neutral" label={`Edit jurusan ${kode}`} onClick={onEdit}>
                <ActionIcon name="edit" />
            </IconButton>
            <IconButton variant="danger" label={`Hapus jurusan ${kode}`} onClick={onDelete}>
                <ActionIcon name="trash" />
            </IconButton>
        </div>
    );
}

export default function Page({ auth, tabs = [], filters = null, jurusans = { data: [], meta: null, links: [] } }) {
    const { flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [toast, setToast] = useState(null);

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const data = jurusans.data || [];
    const meta = jurusans.meta || {};
    const links = jurusans.links || [];

    const form = useForm({ kode: '', nama: '', deskripsi: '' });
    const edit = useForm({ kode: '', nama: '', deskripsi: '' });
    const importForm = useForm({ file: null });

    const deleteForm = useForm();

    useEffect(() => {
        if (!flash?.success) return undefined;

        setToast({ type: 'success', message: flash.success });
        const timer = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(timer);
    }, [flash?.success]);

    const applyFilters = (pageUrl = null) => {
        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('akademik.jurusan.index'), { search, per_page: perPage }, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setPerPage('10');
        router.get(route('akademik.jurusan.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('akademik.jurusan.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('kode', 'nama', 'deskripsi'),
        });
    };

    const handleImport = (e) => {
        e.preventDefault();
        importForm.post(route('akademik.jurusan.import'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => importForm.reset('file'),
        });
    };

    const confirmDeletion = (item) => {
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const removeItem = () => {
        deleteForm.delete(route('akademik.jurusan.destroy', itemToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingDeletion(false);
                setItemToDelete(null);
            },
        });
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        edit.setData({
            kode: item.kode || '',
            nama: item.nama || '',
            deskripsi: item.deskripsi || '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        edit.reset();
    };

    return (
        <PageShell auth={auth} title="Jurusan" tabs={tabs} showFlash={false} heroVariant="corner" layoutHeader={false}>
            <ConfirmationModal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={removeItem}
                title="Hapus Jurusan"
                message={`Apakah Anda yakin ingin menghapus jurusan ${itemToDelete?.nama}? Data yang sudah dihapus tidak dapat dikembalikan.`}
                processing={deleteForm.processing}
            />
            <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <form onSubmit={submit} className="panel space-y-3 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Input Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Tambah Jurusan</h3>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Kode Jurusan</label>
                            <input className="form-input" placeholder="Kode" value={form.data.kode} onChange={(e) => form.setData('kode', e.target.value)} />
                            <FieldError message={form.errors.kode} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Nama Jurusan</label>
                            <input className="form-input" placeholder="Nama" value={form.data.nama} onChange={(e) => form.setData('nama', e.target.value)} />
                            <FieldError message={form.errors.nama} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Deskripsi</label>
                            <textarea className="form-input min-h-28" placeholder="Deskripsi" value={form.data.deskripsi} onChange={(e) => form.setData('deskripsi', e.target.value)} />
                            <FieldError message={form.errors.deskripsi} />
                        </div>

                        <button className="btn-primary w-full" type="submit" disabled={form.processing}>
                            Simpan Jurusan
                        </button>
                    </form>

                    <section className="panel relative space-y-3 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Import Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Upload Excel / CSV</h3>
                        </div>

                        <a href={route('akademik.jurusan.template')} className="btn-outline flex w-full items-center justify-center">
                            Download Template
                        </a>

                        <form onSubmit={handleImport} className="space-y-3">
                            <input
                                type="file"
                                className="form-input"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)}
                            />
                            <FieldError message={importForm.errors.file} />
                            <button className="btn-primary w-full" type="submit" disabled={importForm.processing || !importForm.data.file}>
                                {importForm.processing ? 'Mengimpor...' : 'Import Jurusan'}
                            </button>
                        </form>

                        <p className="text-xs text-slate-500">
                            Kolom yang dibaca: kode, nama, deskripsi.
                        </p>

                        {importForm.processing && (
                            <div className="absolute inset-0 rounded-2xl bg-white/75 p-4 backdrop-blur-[1px]">
                                <ImportSpinner />
                            </div>
                        )}
                    </section>
                </div>

                <section className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Daftar Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Jurusan Terdaftar</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={route('akademik.jurusan.export', { search, per_page: perPage })} className="btn-outline">
                                Export Excel
                            </a>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{meta.total ?? 0} data</span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
                        <input
                            className="form-input"
                            placeholder="Cari kode, nama, atau deskripsi"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
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

                    <div className="mt-4 space-y-3 md:hidden">
                        {data.length ? (
                            data.map((item) => (
                                <Fragment key={item.id}>
                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.kode}</p>
                                                <h4 className="mt-1 truncate text-sm font-bold text-slate-900">{item.nama}</h4>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.deskripsi || 'Tidak ada deskripsi.'}</p>
                                        <div className="mt-4">
                                            <RowActions onEdit={() => startEdit(item)} onDelete={() => confirmDeletion(item)} kode={item.kode} />
                                        </div>
                                    </article>

                                    {editingId === item.id && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                edit.put(route('akademik.jurusan.update', item.id), {
                                                    preserveScroll: true,
                                                    onSuccess: () => setEditingId(null),
                                                });
                                            }}
                                            className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4"
                                        >
                                            <div>
                                                <input className="form-input" value={edit.data.kode} onChange={(e) => edit.setData('kode', e.target.value)} />
                                                <FieldError message={edit.errors.kode} />
                                            </div>
                                            <div>
                                                <input className="form-input" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                                                <FieldError message={edit.errors.nama} />
                                            </div>
                                            <div>
                                                <textarea className="form-input min-h-28" value={edit.data.deskripsi} onChange={(e) => edit.setData('deskripsi', e.target.value)} />
                                                <FieldError message={edit.errors.deskripsi} />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button className="btn-primary w-full" type="submit" disabled={edit.processing}>
                                                    Update
                                                </button>
                                                <button type="button" className="btn-outline w-full" onClick={cancelEdit}>
                                                    Batal
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </Fragment>
                            ))
                        ) : (
                            <EmptyState title="Belum ada jurusan" description="Tambahkan jurusan pertama dari form di sisi kiri atau impor file Excel." />
                        )}
                    </div>

                    <div className="mt-4 hidden max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 md:block">
                        <table className="min-w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="text-slate-500">
                                    <th className="px-3 py-2 whitespace-nowrap">Kode</th>
                                    <th className="px-3 py-2 whitespace-nowrap">Nama</th>
                                    <th className="px-3 py-2">Deskripsi</th>
                                    <th className="px-3 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length ? (
                                    data.map((item) => (
                                        <Fragment key={item.id}>
                                            <tr className="border-t border-slate-100 align-top">
                                                <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">{item.kode}</td>
                                                <td className="px-3 py-3 text-slate-700">{item.nama}</td>
                                                <td className="px-3 py-3 text-slate-600">{item.deskripsi || '-'}</td>
                                                <td className="px-3 py-3">
                                                    <RowActions onEdit={() => startEdit(item)} onDelete={() => confirmDeletion(item)} kode={item.kode} />
                                                </td>
                                            </tr>

                                            {editingId === item.id && (
                                                <tr className="border-t border-slate-100 bg-sky-50/60">
                                                    <td colSpan="4" className="px-3 py-4">
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                edit.put(route('akademik.jurusan.update', item.id), {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => setEditingId(null),
                                                                });
                                                            }}
                                                            className="grid gap-3 lg:grid-cols-2"
                                                        >
                                                            <div>
                                                                <input className="form-input" value={edit.data.kode} onChange={(e) => edit.setData('kode', e.target.value)} />
                                                                <FieldError message={edit.errors.kode} />
                                                            </div>
                                                            <div>
                                                                <input className="form-input" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                                                                <FieldError message={edit.errors.nama} />
                                                            </div>
                                                            <div className="lg:col-span-2">
                                                                <textarea className="form-input min-h-28" value={edit.data.deskripsi} onChange={(e) => edit.setData('deskripsi', e.target.value)} />
                                                                <FieldError message={edit.errors.deskripsi} />
                                                            </div>
                                                            <div className="flex flex-col gap-2 sm:flex-row lg:col-span-2">
                                                                <button className="btn-primary w-full sm:w-auto" type="submit" disabled={edit.processing}>
                                                                    Update
                                                                </button>
                                                                <button type="button" className="btn-outline w-full sm:w-auto" onClick={cancelEdit}>
                                                                    Batal
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-3 py-6">
                                            <EmptyState title="Belum ada jurusan" description="Tambahkan jurusan pertama dari form di sisi kiri atau impor file Excel." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={links} meta={meta} />
                </section>
            </div>

            {toast?.message && (
                <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-md">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg">
                        {toast.message}
                    </div>
                </div>
            )}
        </PageShell>
    );
}

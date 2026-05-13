import { Fragment, useEffect, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import EmptyState from './EmptyState';
import PageShell from './PageShell';
import ConfirmationModal from '@/Components/ConfirmationModal';

function FieldError({ message }) {
    return message ? <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p> : null;
}

function StatusBadge({ active }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {active ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function ActionIcon({ name, className = 'h-4 w-4' }) {
    const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8 };

    switch (name) {
        case 'edit':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4 20 4.5-1 10-10a1.8 1.8 0 0 0 0-2.5l-.5-.5a1.8 1.8 0 0 0-2.5 0l-10 10L4 20Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m13.5 6.5 4 4" />
                </svg>
            );
        case 'trash':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6m4-6v6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l1 12h8l1-12" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5h6v2" />
                </svg>
            );
        case 'filter':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" />
                </svg>
            );
        default:
            return null;
    }
}

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
                <p className="text-sm font-semibold text-slate-800">Harap tunggu, data sedang disimpan.</p>
            </div>
        </div>
    );
}

export default function Page({ auth, tabs = [], filters = null, tahunAkademiks = { data: [], meta: null, links: [] } }) {
    const { errors, flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [toast, setToast] = useState(null);

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const data = tahunAkademiks.data || [];
    const meta = tahunAkademiks.meta || {};
    const links = tahunAkademiks.links || [];

    const form = useForm({
        kode: '',
        nama: '',
        semester_aktif: 1,
        tanggal_mulai: '',
        tanggal_selesai: '',
        is_active: false,
    });

    const edit = useForm({
        kode: '',
        nama: '',
        semester_aktif: 1,
        tanggal_mulai: '',
        tanggal_selesai: '',
        is_active: false,
    });

    const importForm = useForm({ file: null });

    const deleteForm = useForm();

    useEffect(() => {
        if (!flash?.success) return undefined;

        setToast({ type: 'success', message: flash.success });
        const timer = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(timer);
    }, [flash?.success]);

    const applyFilters = (pageUrl = null) => {
        const params = {
            search,
            per_page: perPage,
        };

        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('akademik.tahun.index'), params, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setPerPage('10');
        router.get(route('akademik.tahun.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('akademik.tahun.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('kode', 'nama', 'semester_aktif', 'tanggal_mulai', 'tanggal_selesai', 'is_active'),
        });
    };

    const handleImport = (e) => {
        e.preventDefault();
        importForm.post(route('akademik.tahun.import'), {
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
        deleteForm.delete(route('akademik.tahun.destroy', itemToDelete.id), {
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
            semester_aktif: item.semester_aktif || 1,
            tanggal_mulai: item.tanggal_mulai || '',
            tanggal_selesai: item.tanggal_selesai || '',
            is_active: !!item.is_active,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        edit.reset();
    };

    return (
        <PageShell auth={auth} title="Tahun Akademik" tabs={tabs} showFlash={false} heroVariant="corner" layoutHeader={false}>
            <ConfirmationModal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={removeItem}
                title="Hapus Tahun Akademik"
                message={`Apakah Anda yakin ingin menghapus tahun akademik ${itemToDelete?.kode}? Data yang sudah dihapus tidak dapat dikembalikan.`}
                processing={deleteForm.processing}
            />
            <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <form onSubmit={submit} className="panel space-y-3 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Input Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Tambah Tahun Akademik</h3>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Kode Tahun Akademik</label>
                            <input className="form-input" placeholder="Kode (2025/2026)" value={form.data.kode} onChange={(e) => form.setData('kode', e.target.value)} />
                            <FieldError message={errors.kode || form.errors.kode} />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Nama Periode</label>
                            <input className="form-input" placeholder="Nama (Ganjil/Genap)" value={form.data.nama} onChange={(e) => form.setData('nama', e.target.value)} />
                            <FieldError message={errors.nama || form.errors.nama} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Semester Aktif</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    value={form.data.semester_aktif}
                                    onChange={(e) => form.setData('semester_aktif', e.target.value)}
                                />
                                <FieldError message={errors.semester_aktif || form.errors.semester_aktif} />
                            </div>
                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                                Tahun aktif
                            </label>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Tanggal Mulai</label>
                                <input type="date" className="form-input" value={form.data.tanggal_mulai} onChange={(e) => form.setData('tanggal_mulai', e.target.value)} />
                                <FieldError message={errors.tanggal_mulai || form.errors.tanggal_mulai} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Tanggal Selesai</label>
                                <input type="date" className="form-input" value={form.data.tanggal_selesai} onChange={(e) => form.setData('tanggal_selesai', e.target.value)} />
                                <FieldError message={errors.tanggal_selesai || form.errors.tanggal_selesai} />
                            </div>
                        </div>

                        <button className="btn-primary w-full" type="submit" disabled={form.processing}>
                            Simpan Tahun Akademik
                        </button>
                    </form>

                    <section className="panel relative space-y-3 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Import Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Upload Excel / CSV</h3>
                        </div>

                        <a href={route('akademik.tahun.template')} className="btn-outline flex w-full items-center justify-center">
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
                                {importForm.processing ? 'Mengimpor...' : 'Import Tahun Akademik'}
                            </button>
                        </form>

                        <p className="text-xs text-slate-500">
                            Kolom yang dibaca: kode, nama, semester_aktif, tanggal_mulai, tanggal_selesai, is_active.
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
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Tahun Akademik Terdaftar</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={route('akademik.tahun.export', { search, per_page: perPage })} className="btn-outline">
                                Export Excel
                            </a>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {meta.total ?? 0} data
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
                        <input
                            className="form-input"
                            placeholder="Cari kode, nama, semester, atau tanggal"
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

                    <div className="mt-4 md:hidden">
                        <div className="space-y-3">
                            {data.length ? (
                                data.map((item) => (
                                    <Fragment key={item.id}>
                                        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.kode}</p>
                                                    <h4 className="mt-1 truncate text-sm font-bold text-slate-900">{item.nama}</h4>
                                                </div>
                                                <StatusBadge active={!!item.is_active} />
                                            </div>

                                            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                                <div className="rounded-xl bg-slate-50 p-3">
                                                    <dt className="font-semibold text-slate-500">Semester</dt>
                                                    <dd className="mt-1 font-bold text-slate-800">{item.semester_aktif}</dd>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 p-3">
                                                    <dt className="font-semibold text-slate-500">Periode</dt>
                                                    <dd className="mt-1 font-bold text-slate-800">{item.tanggal_mulai || '-'} - {item.tanggal_selesai || '-'}</dd>
                                                </div>
                                            </dl>

                                            <div className="mt-4 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                                    onClick={() => startEdit(item)}
                                                    aria-label={`Edit tahun akademik ${item.kode}`}
                                                    title={`Edit ${item.kode}`}
                                                >
                                                    <ActionIcon name="edit" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                                                    onClick={() => confirmDeletion(item)}
                                                    aria-label={`Hapus tahun akademik ${item.kode}`}
                                                    title={`Hapus ${item.kode}`}
                                                >
                                                    <ActionIcon name="trash" />
                                                </button>
                                            </div>
                                        </article>

                                        {editingId === item.id && (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    edit.put(route('akademik.tahun.update', item.id), {
                                                        preserveScroll: true,
                                                        onSuccess: () => setEditingId(null),
                                                    });
                                                }}
                                                className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4"
                                            >
                                                <div className="grid gap-3">
                                                    <div>
                                                        <input className="form-input" value={edit.data.kode} onChange={(e) => edit.setData('kode', e.target.value)} />
                                                        <FieldError message={errors.kode || edit.errors.kode} />
                                                    </div>
                                                    <div>
                                                        <input className="form-input" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                                                        <FieldError message={errors.nama || edit.errors.nama} />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="form-input"
                                                            value={edit.data.semester_aktif}
                                                            onChange={(e) => edit.setData('semester_aktif', e.target.value)}
                                                        />
                                                        <FieldError message={errors.semester_aktif || edit.errors.semester_aktif} />
                                                    </div>
                                                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                                                        <input type="checkbox" checked={edit.data.is_active} onChange={(e) => edit.setData('is_active', e.target.checked)} />
                                                        Tahun aktif
                                                    </label>
                                                    <div>
                                                        <input type="date" className="form-input" value={edit.data.tanggal_mulai} onChange={(e) => edit.setData('tanggal_mulai', e.target.value)} />
                                                        <FieldError message={errors.tanggal_mulai || edit.errors.tanggal_mulai} />
                                                    </div>
                                                    <div>
                                                        <input type="date" className="form-input" value={edit.data.tanggal_selesai} onChange={(e) => edit.setData('tanggal_selesai', e.target.value)} />
                                                        <FieldError message={errors.tanggal_selesai || edit.errors.tanggal_selesai} />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button className="btn-primary w-full">Update</button>
                                                        <button type="button" className="btn-outline w-full" onClick={cancelEdit}>
                                                            Batal
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada tahun akademik"
                                    description="Tambahkan periode akademik pertama atau impor file Excel agar data kelas dan KRS bisa dikaitkan."
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-4 hidden max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 md:block">
                        <table className="min-w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="text-slate-500">
                                    <th className="px-3 py-2 whitespace-nowrap">Kode</th>
                                    <th className="px-3 py-2 whitespace-nowrap">Nama</th>
                                    <th className="px-3 py-2">Semester</th>
                                    <th className="px-3 py-2">Mulai</th>
                                    <th className="px-3 py-2">Selesai</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length ? (
                                    data.map((item) => (
                                        <Fragment key={item.id}>
                                            <tr className="border-t border-slate-100 align-top">
                                                <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">{item.kode}</td>
                                                <td className="px-3 py-3 text-slate-700">
                                                    <div className="min-w-0">
                                                        <p className="font-medium leading-5">{item.nama}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500 md:hidden">
                                                            {item.semester_aktif} | {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="hidden px-3 py-3 text-slate-600 md:table-cell">{item.semester_aktif}</td>
                                                <td className="hidden px-3 py-3 text-slate-600 lg:table-cell">{item.tanggal_mulai || '-'}</td>
                                                <td className="hidden px-3 py-3 text-slate-600 lg:table-cell">{item.tanggal_selesai || '-'}</td>
                                                <td className="px-3 py-3">
                                                    <StatusBadge active={!!item.is_active} />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                                            onClick={() => startEdit(item)}
                                                            aria-label={`Edit tahun akademik ${item.kode}`}
                                                            title={`Edit ${item.kode}`}
                                                        >
                                                            <ActionIcon name="edit" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                                                            onClick={() => confirmDeletion(item)}
                                                            aria-label={`Hapus tahun akademik ${item.kode}`}
                                                            title={`Hapus ${item.kode}`}
                                                        >
                                                            <ActionIcon name="trash" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {editingId === item.id && (
                                                <tr className="border-t border-slate-100 bg-sky-50/60">
                                                    <td colSpan="7" className="px-3 py-4">
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                edit.put(route('akademik.tahun.update', item.id), {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => setEditingId(null),
                                                                });
                                                            }}
                                                            className="grid gap-3 lg:grid-cols-2"
                                                        >
                                                            <div>
                                                                <input className="form-input" value={edit.data.kode} onChange={(e) => edit.setData('kode', e.target.value)} />
                                                                <FieldError message={errors.kode || edit.errors.kode} />
                                                            </div>
                                                            <div>
                                                                <input className="form-input" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                                                                <FieldError message={errors.nama || edit.errors.nama} />
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="form-input"
                                                                    value={edit.data.semester_aktif}
                                                                    onChange={(e) => edit.setData('semester_aktif', e.target.value)}
                                                                />
                                                                <FieldError message={errors.semester_aktif || edit.errors.semester_aktif} />
                                                            </div>
                                                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                                                                <input type="checkbox" checked={edit.data.is_active} onChange={(e) => edit.setData('is_active', e.target.checked)} />
                                                                Tahun aktif
                                                            </label>
                                                            <div>
                                                                <input type="date" className="form-input" value={edit.data.tanggal_mulai} onChange={(e) => edit.setData('tanggal_mulai', e.target.value)} />
                                                                <FieldError message={errors.tanggal_mulai || edit.errors.tanggal_mulai} />
                                                            </div>
                                                            <div>
                                                                <input type="date" className="form-input" value={edit.data.tanggal_selesai} onChange={(e) => edit.setData('tanggal_selesai', e.target.value)} />
                                                                <FieldError message={errors.tanggal_selesai || edit.errors.tanggal_selesai} />
                                                            </div>
                                                            <div className="flex flex-col gap-2 sm:flex-row lg:col-span-2">
                                                                <button className="btn-primary w-full sm:w-auto">Update</button>
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
                                        <td colSpan="7" className="px-3 py-6">
                                            <EmptyState
                                                title="Belum ada tahun akademik"
                                                description="Tambahkan periode akademik pertama atau impor file Excel agar data kelas dan KRS bisa dikaitkan."
                                            />
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

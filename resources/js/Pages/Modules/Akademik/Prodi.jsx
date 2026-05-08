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
                <p className="text-sm font-semibold text-slate-800">Harap tunggu, data prodi sedang disimpan.</p>
            </div>
        </div>
    );
}

function RowActions({ onEdit, onDelete, kode }) {
    return (
        <div className="flex items-center gap-2">
            <IconButton variant="neutral" label={`Edit prodi ${kode}`} onClick={onEdit}>
                <ActionIcon name="edit" />
            </IconButton>
            <IconButton variant="danger" label={`Hapus prodi ${kode}`} onClick={onDelete}>
                <ActionIcon name="trash" />
            </IconButton>
        </div>
    );
}

function EditActions({ onCancel, onSave, processing }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-outline px-3 py-2 text-xs" onClick={onCancel} disabled={processing}>
                Batal
            </button>
            <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={onSave} disabled={processing}>
                {processing ? 'Menyimpan...' : 'Simpan'}
            </button>
        </div>
    );
}

export default function Page({ auth, tabs = [], filters = null, jurusans = [], prodis = { data: [], meta: null, links: [] } }) {
    const { flash } = usePage().props;
    const [editingTarget, setEditingTarget] = useState(null);
    const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [toast, setToast] = useState(null);

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const data = prodis.data || [];
    const meta = prodis.meta || {};
    const links = prodis.links || [];

    const jenjangOptions = [
        { value: 'D3', label: 'D3 (Diploma 3)' },
        { value: 'S1', label: 'S1 (Sarjana)' },
        { value: 'S2', label: 'S2 (Magister)' },
        { value: 'S3', label: 'S3 (Doktor)' },
    ];

    const form = useForm({ jurusan_id: '', kode: '', nama: '', jenjang: 'S1', semester_total: 8, sks_lulus: 144 });
    const edit = useForm({ jurusan_id: '', kode: '', nama: '', jenjang: 'S1', semester_total: 8, sks_lulus: 144 });
    const importForm = useForm({ file: null });

    const deleteForm = useForm();

    useEffect(() => {
        if (!flash?.success) return undefined;
        setToast({ message: flash.success });
        const timer = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(timer);
    }, [flash?.success]);

    const applyFilters = (pageUrl = null) => {
        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }
        router.get(route('akademik.prodi.index'), { search, per_page: perPage }, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setPerPage('10');
        router.get(route('akademik.prodi.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('akademik.prodi.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('jurusan_id', 'kode', 'nama', 'jenjang', 'semester_total', 'sks_lulus'),
        });
    };

    const handleImport = (e) => {
        e.preventDefault();
        importForm.post(route('akademik.prodi.import'), {
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
        deleteForm.delete(route('akademik.prodi.destroy', itemToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingDeletion(false);
                setItemToDelete(null);
            },
        });
    };

    const startEdit = (item) => {
        setEditingTarget(item);
        setShowAdvancedEdit(false);
        edit.setData({
            jurusan_id: item.jurusan_id || '',
            kode: item.kode || '',
            nama: item.nama || '',
            jenjang: item.jenjang || 'S1',
            semester_total: item.semester_total ?? 8,
            sks_lulus: item.sks_lulus ?? 144,
        });
    };

    const cancelEdit = () => {
        setEditingTarget(null);
        setShowAdvancedEdit(false);
        edit.reset();
    };

    const submitEdit = () => {
        if (!editingTarget?.id) return;
        edit.put(route('akademik.prodi.update', editingTarget.id), { preserveScroll: true, onSuccess: cancelEdit });
    };

    return (
        <PageShell auth={auth} title="Program Studi" tabs={tabs} showFlash={false}>
            <ConfirmationModal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={removeItem}
                title="Hapus Prodi"
                message={`Apakah Anda yakin ingin menghapus prodi ${itemToDelete?.nama}? Data yang sudah dihapus tidak dapat dikembalikan.`}
                processing={deleteForm.processing}
            />
            <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <form onSubmit={submit} className="panel space-y-3 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Input Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Tambah Prodi</h3>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Jurusan</label>
                            <select className="form-input" value={form.data.jurusan_id} onChange={(e) => form.setData('jurusan_id', e.target.value)}>
                                <option value="">Pilih Jurusan</option>
                                {jurusans.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                            </select>
                            <FieldError message={form.errors.jurusan_id} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Kode Prodi</label>
                            <input className="form-input" placeholder="Contoh: TI" value={form.data.kode} onChange={(e) => form.setData('kode', e.target.value)} />
                            <FieldError message={form.errors.kode} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Nama Prodi</label>
                            <input className="form-input" placeholder="Contoh: Teknik Informatika" value={form.data.nama} onChange={(e) => form.setData('nama', e.target.value)} />
                            <FieldError message={form.errors.nama} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Jenjang</label>
                                <select className="form-input" value={form.data.jenjang} onChange={(e) => form.setData('jenjang', e.target.value)}>
                                    {jenjangOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={form.errors.jenjang} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Total Semester</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="14"
                                    className="form-input"
                                    placeholder="Contoh: 8"
                                    value={form.data.semester_total}
                                    onChange={(e) => form.setData('semester_total', e.target.value)}
                                />
                                <p className="mt-1 text-[11px] text-slate-500">S1 umumnya 8 semester.</p>
                                <FieldError message={form.errors.semester_total} />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">SKS Lulus</label>
                            <input
                                type="number"
                                min="0"
                                className="form-input"
                                placeholder="Contoh: 144"
                                value={form.data.sks_lulus}
                                onChange={(e) => form.setData('sks_lulus', e.target.value)}
                            />
                            <p className="mt-1 text-[11px] text-slate-500">S1 umumnya 144 SKS (sesuaikan kebijakan kampus).</p>
                            <FieldError message={form.errors.sks_lulus} />
                        </div>
                        <button className="btn-primary w-full" type="submit" disabled={form.processing}>
                            Simpan Prodi
                        </button>
                    </form>

                    <section className="panel relative space-y-3 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Import Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Upload Excel / CSV</h3>
                        </div>
                        <a href={route('akademik.prodi.template')} className="btn-outline flex w-full items-center justify-center">
                            Download Template
                        </a>
                        <form onSubmit={handleImport} className="space-y-3">
                            <input type="file" className="form-input" accept=".xlsx,.xls,.csv" onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)} />
                            <FieldError message={importForm.errors.file} />
                            <button className="btn-primary w-full" type="submit" disabled={importForm.processing || !importForm.data.file}>
                                {importForm.processing ? 'Mengimpor...' : 'Import Prodi'}
                            </button>
                        </form>
                        <p className="text-xs text-slate-500">Kolom yang dibaca: jurusan_kode, kode, nama, jenjang, semester_total, sks_lulus, is_active.</p>
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
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Program Studi Terdaftar</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={route('akademik.prodi.export', { search, per_page: perPage })} className="btn-outline">
                                Export Excel
                            </a>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{meta.total ?? 0} data</span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
                        <input className="form-input" placeholder="Cari kode, nama, jenjang, atau jurusan" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
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
                        {data.length ? data.map((item) => (
                            <Fragment key={item.id}>
                                {editingTarget?.id === item.id ? (
                                    <article className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-500">Quick Edit</p>
                                        <div className="mt-3 grid gap-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-bold text-slate-700">Jurusan</label>
                                                <select className="form-input" value={edit.data.jurusan_id} onChange={(e) => edit.setData('jurusan_id', e.target.value)}>
                                                    <option value="">Pilih Jurusan</option>
                                                    {jurusans.map((row) => (
                                                        <option key={row.id} value={row.id}>
                                                            {row.nama}
                                                        </option>
                                                    ))}
                                                </select>
                                                <FieldError message={edit.errors.jurusan_id} />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-bold text-slate-700">Kode Prodi</label>
                                                <input className="form-input" value={edit.data.kode} onChange={(e) => edit.setData('kode', e.target.value)} />
                                                <FieldError message={edit.errors.kode} />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-bold text-slate-700">Nama Prodi</label>
                                                <input className="form-input" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                                                <FieldError message={edit.errors.nama} />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-bold text-slate-700">Jenjang</label>
                                                <select className="form-input" value={edit.data.jenjang} onChange={(e) => edit.setData('jenjang', e.target.value)}>
                                                    {jenjangOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <FieldError message={edit.errors.jenjang} />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setShowAdvancedEdit((prev) => !prev)}
                                                className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                <span>Pengaturan lanjutan (Semester & SKS)</span>
                                                <span className="text-slate-500">{showAdvancedEdit ? 'Sembunyikan' : 'Tampilkan'}</span>
                                            </button>

                                            {showAdvancedEdit && (
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1 block text-xs font-bold text-slate-700">Total Semester</label>
                                                        <input type="number" min="1" max="14" className="form-input" value={edit.data.semester_total} onChange={(e) => edit.setData('semester_total', e.target.value)} />
                                                        <p className="mt-1 text-[11px] text-slate-500">S1 umumnya 8 semester.</p>
                                                        <FieldError message={edit.errors.semester_total} />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs font-bold text-slate-700">SKS Lulus</label>
                                                        <input type="number" min="0" className="form-input" value={edit.data.sks_lulus} onChange={(e) => edit.setData('sks_lulus', e.target.value)} />
                                                        <p className="mt-1 text-[11px] text-slate-500">S1 umumnya 144 SKS.</p>
                                                        <FieldError message={edit.errors.sks_lulus} />
                                                    </div>
                                                </div>
                                            )}
                                            <EditActions onCancel={cancelEdit} onSave={submitEdit} processing={edit.processing} />
                                        </div>
                                    </article>
                                ) : (
                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.kode}</p>
                                        <h4 className="mt-1 text-sm font-bold text-slate-900">{item.nama}</h4>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.jurusan?.nama || '-'} | {item.jenjang} | {item.semester_total} semester | {item.sks_lulus} SKS</p>
                                        <div className="mt-4">
                                            <RowActions onEdit={() => startEdit(item)} onDelete={() => confirmDeletion(item)} kode={item.kode} />
                                        </div>
                                    </article>
                                )}
                            </Fragment>
                        )) : <EmptyState title="Belum ada prodi" description="Tambahkan prodi untuk menghubungkan jurusan dan kurikulum." />}
                    </div>

                    <div className="mt-4 hidden max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 md:block">
                        <table className="min-w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="text-slate-500">
                                    <th className="px-3 py-2 whitespace-nowrap">Kode</th>
                                    <th className="px-3 py-2 whitespace-nowrap">Nama</th>
                                    <th className="px-3 py-2">Jurusan</th>
                                    <th className="px-3 py-2">Info</th>
                                    <th className="px-3 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length ? data.map((item) => (
                                    <Fragment key={item.id}>
                                        {editingTarget?.id === item.id ? (
                                            <tr className="border-t border-slate-100 bg-sky-50/40 align-top">
                                                <td className="px-3 py-3 align-top">
                                                    <input className="form-input h-9 text-xs" value={edit.data.kode} onChange={(e) => edit.setData('kode', e.target.value)} />
                                                    <FieldError message={edit.errors.kode} />
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <input className="form-input h-9 text-xs" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                                                    <FieldError message={edit.errors.nama} />
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <select className="form-input h-9 text-xs" value={edit.data.jurusan_id} onChange={(e) => edit.setData('jurusan_id', e.target.value)}>
                                                        <option value="">Pilih Jurusan</option>
                                                        {jurusans.map((row) => (
                                                            <option key={row.id} value={row.id}>
                                                                {row.nama}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <FieldError message={edit.errors.jurusan_id} />
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="grid gap-2">
                                                        <select className="form-input h-9 text-xs" value={edit.data.jenjang} onChange={(e) => edit.setData('jenjang', e.target.value)} title="Jenjang">
                                                            {jenjangOptions.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <FieldError message={edit.errors.jenjang} />

                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAdvancedEdit((prev) => !prev)}
                                                            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            <span>Semester & SKS</span>
                                                            <span className="text-slate-500">{showAdvancedEdit ? 'Sembunyikan' : 'Tampilkan'}</span>
                                                        </button>

                                                        {showAdvancedEdit && (
                                                            <div className="grid gap-2 lg:grid-cols-2">
                                                                <div>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max="14"
                                                                        className="form-input h-9 text-xs"
                                                                        value={edit.data.semester_total}
                                                                        onChange={(e) => edit.setData('semester_total', e.target.value)}
                                                                        title="Total Semester"
                                                                        placeholder="Total semester"
                                                                    />
                                                                    <FieldError message={edit.errors.semester_total} />
                                                                </div>
                                                                <div>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="form-input h-9 text-xs"
                                                                        value={edit.data.sks_lulus}
                                                                        onChange={(e) => edit.setData('sks_lulus', e.target.value)}
                                                                        title="SKS Lulus"
                                                                        placeholder="SKS lulus"
                                                                    />
                                                                    <FieldError message={edit.errors.sks_lulus} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <EditActions onCancel={cancelEdit} onSave={submitEdit} processing={edit.processing} />
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr className="border-t border-slate-100 align-top">
                                                <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">{item.kode}</td>
                                                <td className="px-3 py-3 text-slate-700">{item.nama}</td>
                                                <td className="px-3 py-3 text-slate-600">{item.jurusan?.nama || '-'}</td>
                                                <td className="px-3 py-3 text-slate-600">{item.jenjang} | {item.semester_total} semester | {item.sks_lulus} SKS</td>
                                                <td className="px-3 py-3"><RowActions onEdit={() => startEdit(item)} onDelete={() => confirmDeletion(item)} kode={item.kode} /></td>
                                            </tr>
                                        )}
                                    </Fragment>
                                )) : (
                                    <tr><td colSpan="5" className="px-3 py-6"><EmptyState title="Belum ada prodi" description="Tambahkan prodi untuk menghubungkan jurusan dan kurikulum." /></td></tr>
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

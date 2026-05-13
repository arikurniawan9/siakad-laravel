import { Fragment, useEffect, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import EmptyState from './EmptyState';
import PageShell from './PageShell';
import { ActionIcon, FieldError, IconButton, StatusBadge } from './CrudParts';
import ConfirmationModal from '@/Components/ConfirmationModal';

function Pagination({ links = [], meta = {} }) {
    if (!links.length) return null;
    return (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Menampilkan {meta.from ?? 0}-{meta.to ?? 0} dari {meta.total ?? 0} data</p>
            <div className="flex flex-wrap gap-2">
                {links.map((link, index) => (
                    <button
                        key={`${link.label}-${index}`}
                        type="button"
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'}`}
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
                <p className="text-sm font-semibold text-slate-800">Harap tunggu, data kelas sedang disimpan.</p>
            </div>
        </div>
    );
}

function RowActions({ onEdit, onDelete, kode }) {
    return (
        <div className="flex items-center gap-2">
            <IconButton variant="neutral" label={`Edit kelas ${kode}`} onClick={onEdit}>
                <ActionIcon name="edit" />
            </IconButton>
            <IconButton variant="danger" label={`Hapus kelas ${kode}`} onClick={onDelete}>
                <ActionIcon name="trash" />
            </IconButton>
        </div>
    );
}

export default function Page({ 
    auth, 
    tabs = [], 
    filters = null, 
    mataKuliahs = [], 
    dosens = [], 
    ruangans = [], 
    tahunAkademiks = [], 
    kelasList = { data: [], meta: null, links: [] } 
}) {
    const { flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [toast, setToast] = useState(null);

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const data = kelasList.data || [];
    const meta = kelasList.meta || {};
    const links = kelasList.links || [];

    const form = useForm({ 
        mata_kuliah_id: '', 
        dosen_id: '', 
        tahun_akademik_id: '', 
        kode_kelas: '', 
        tahun_akademik: '2025/2026', 
        semester_akademik: 1, 
        kapasitas: 40, 
        ruangan_id: '', 
        ruangan: '', 
        is_active: true 
    });

    const edit = useForm({ 
        mata_kuliah_id: '', 
        dosen_id: '', 
        tahun_akademik_id: '', 
        kode_kelas: '', 
        tahun_akademik: '', 
        semester_akademik: 1, 
        kapasitas: 40, 
        ruangan_id: '', 
        ruangan: '', 
        is_active: true 
    });

    const importForm = useForm({ file: null });
    const deleteForm = useForm();

    useEffect(() => { 
        if (!flash?.success) return undefined; 
        setToast({ message: flash.success }); 
        const t = setTimeout(() => setToast(null), 3200); 
        return () => clearTimeout(t); 
    }, [flash?.success]);

    const applyFilters = (pageUrl = null) => { 
        if (pageUrl) { 
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true }); 
            return; 
        } 
        router.get(route('akademik.kelas.index'), { search, per_page: perPage }, { preserveScroll: true, preserveState: true }); 
    };

    const resetFilters = () => { 
        setSearch(''); 
        setPerPage('10'); 
        router.get(route('akademik.kelas.index'), {}, { preserveScroll: true, preserveState: true }); 
    };

    const submit = (e) => { 
        e.preventDefault(); 
        form.post(route('akademik.kelas.store'), { 
            preserveScroll: true, 
            onSuccess: () => form.reset('mata_kuliah_id', 'dosen_id', 'tahun_akademik_id', 'kode_kelas', 'tahun_akademik', 'semester_akademik', 'kapasitas', 'ruangan_id', 'ruangan', 'is_active') 
        }); 
    };

    const handleImport = (e) => { 
        e.preventDefault(); 
        importForm.post(route('akademik.kelas.import'), { 
            preserveScroll: true, 
            forceFormData: true, 
            onSuccess: () => importForm.reset('file') 
        }); 
    };

    const confirmDeletion = (item) => {
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const removeItem = () => {
        deleteForm.delete(route('akademik.kelas.destroy', itemToDelete.id), {
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
            mata_kuliah_id: item.mata_kuliah_id || '', 
            dosen_id: item.dosen_id || '', 
            tahun_akademik_id: item.tahun_akademik_id || '', 
            kode_kelas: item.kode_kelas || '', 
            tahun_akademik: item.tahun_akademik || '', 
            semester_akademik: item.semester_akademik ?? 1, 
            kapasitas: item.kapasitas ?? 40, 
            ruangan_id: item.ruangan_id || '', 
            ruangan: item.ruangan || '', 
            is_active: !!item.is_active 
        }); 
    };

    const cancelEdit = () => { 
        setEditingId(null); 
        edit.reset(); 
    };

    return (
        <PageShell auth={auth} title="Kelas" tabs={tabs} showFlash={false} heroVariant="corner" layoutHeader={false}>
            <ConfirmationModal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={removeItem}
                title="Hapus Kelas"
                message={`Apakah Anda yakin ingin menghapus kelas ${itemToDelete?.kode_kelas}? Data yang sudah dihapus tidak dapat dikembalikan.`}
                processing={deleteForm.processing}
            />
            <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <form onSubmit={submit} className="panel space-y-3 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Input Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Tambah Kelas</h3>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Mata Kuliah</label>
                            <select className="form-input" value={form.data.mata_kuliah_id} onChange={(e) => form.setData('mata_kuliah_id', e.target.value)}>
                                <option value="">Mata Kuliah</option>
                                {mataKuliahs.map((item) => <option key={item.id} value={item.id}>{item.kode} - {item.nama}</option>)}
                            </select>
                            <FieldError message={form.errors.mata_kuliah_id} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Dosen</label>
                            <select className="form-input" value={form.data.dosen_id} onChange={(e) => form.setData('dosen_id', e.target.value)}>
                                <option value="">Dosen</option>
                                {dosens.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                            </select>
                            <FieldError message={form.errors.dosen_id} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Kode Kelas</label>
                                <input className="form-input" placeholder="Kode kelas" value={form.data.kode_kelas} onChange={(e) => form.setData('kode_kelas', e.target.value)} />
                                <FieldError message={form.errors.kode_kelas} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Tahun Akademik (Text)</label>
                                <input className="form-input" placeholder="Tahun akademik" value={form.data.tahun_akademik} onChange={(e) => form.setData('tahun_akademik', e.target.value)} />
                                <FieldError message={form.errors.tahun_akademik} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Semester Akademik</label>
                                <input type="number" className="form-input" placeholder="Semester" value={form.data.semester_akademik} onChange={(e) => form.setData('semester_akademik', e.target.value)} />
                                <FieldError message={form.errors.semester_akademik} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Kapasitas</label>
                                <input type="number" className="form-input" placeholder="Kapasitas" value={form.data.kapasitas} onChange={(e) => form.setData('kapasitas', e.target.value)} />
                                <FieldError message={form.errors.kapasitas} />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Tahun Akademik (Referensi)</label>
                            <select className="form-input" value={form.data.tahun_akademik_id} onChange={(e) => form.setData('tahun_akademik_id', e.target.value)}>
                                <option value="">Pilih Tahun Akademik</option>
                                {tahunAkademiks.map((item) => <option key={item.id} value={item.id}>{item.kode} - Smt {item.semester_aktif}</option>)}
                            </select>
                            <FieldError message={form.errors.tahun_akademik_id} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">Ruangan</label>
                            <select className="form-input" value={form.data.ruangan_id} onChange={(e) => form.setData('ruangan_id', e.target.value)}>
                                <option value="">Pilih Ruang</option>
                                {ruangans.map((item) => <option key={item.id} value={item.id}>{item.kode} - {item.nama}</option>)}
                            </select>
                            <FieldError message={form.errors.ruangan_id} />
                        </div>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                            <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                            Kelas aktif
                        </label>
                        <button className="btn-primary w-full" type="submit" disabled={form.processing}>
                            Simpan Kelas
                        </button>
                    </form>
                    <section className="panel relative space-y-3 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Import Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Upload Excel / CSV</h3>
                        </div>
                        <a href={route('akademik.kelas.template')} className="btn-outline flex w-full items-center justify-center">Download Template</a>
                        <form onSubmit={handleImport} className="space-y-3">
                            <input type="file" className="form-input" accept=".xlsx,.xls,.csv" onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)} />
                            <FieldError message={importForm.errors.file} />
                            <button className="btn-primary w-full" type="submit" disabled={importForm.processing || !importForm.data.file}>
                                {importForm.processing ? 'Mengimpor...' : 'Import Kelas'}
                            </button>
                        </form>
                        <p className="text-xs text-slate-500">Kolom yang dibaca: mata_kuliah_kode, dosen_nidn, tahun_akademik_kode, kode_kelas, tahun_akademik, semester_akademik, kapasitas, ruangan_kode, is_active.</p>
                        {importForm.processing && <div className="absolute inset-0 rounded-2xl bg-white/75 p-4 backdrop-blur-[1px]"><ImportSpinner /></div>}
                    </section>
                </div>
                <section className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Daftar Data</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Kelas Terdaftar</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={route('akademik.kelas.export', { search, per_page: perPage })} className="btn-outline">Export Excel</a>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{meta.total ?? 0} data</span>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
                        <input className="form-input" placeholder="Cari kode kelas, mata kuliah, dosen, ruangan, tahun" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
                        <select className="form-input" value={perPage} onChange={(e) => setPerPage(e.target.value)}>
                            <option value="10">10 / halaman</option>
                            <option value="30">30 / halaman</option>
                            <option value="50">50 / halaman</option>
                            <option value="100">100 / halaman</option>
                        </select>
                        <button type="button" className="btn-primary" onClick={() => applyFilters()}>Terapkan</button>
                        <button type="button" className="btn-outline" onClick={resetFilters}>Reset</button>
                    </div>
                    <div className="mt-4 space-y-3 md:hidden">
                        {data.length ? data.map((item) => (
                            <Fragment key={item.id}>
                                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.kode_kelas}</p>
                                            <h4 className="mt-1 text-sm font-bold text-slate-900">{item.mata_kuliah?.nama || '-'}</h4>
                                        </div>
                                        <StatusBadge active={!!item.is_active} />
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        Dosen {item.dosen?.nama || '-'} | Ruang {item.ruangan_ref?.nama || item.ruangan || '-'} | {item.tahunAkademik?.kode || item.tahun_akademik || '-'} / Semester {item.semester_akademik} | Kapasitas {item.kapasitas}
                                    </p>
                                    <div className="mt-4">
                                        <RowActions onEdit={() => startEdit(item)} onDelete={() => confirmDeletion(item)} kode={item.kode_kelas} />
                                    </div>
                                </article>
                                {editingId === item.id && (
                                    <form onSubmit={(e) => { e.preventDefault(); edit.put(route('akademik.kelas.update', item.id), { preserveScroll: true, onSuccess: () => setEditingId(null) }); }} className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 space-y-3">
                                        <div>
                                            <select className="form-input" value={edit.data.mata_kuliah_id} onChange={(e) => edit.setData('mata_kuliah_id', e.target.value)}>
                                                <option value="">Mata Kuliah</option>
                                                {mataKuliahs.map((mk) => <option key={mk.id} value={mk.id}>{mk.kode} - {mk.nama}</option>)}
                                            </select>
                                            <FieldError message={edit.errors.mata_kuliah_id} />
                                        </div>
                                        <div>
                                            <select className="form-input" value={edit.data.dosen_id} onChange={(e) => edit.setData('dosen_id', e.target.value)}>
                                                <option value="">Dosen</option>
                                                {dosens.map((dosen) => <option key={dosen.id} value={dosen.id}>{dosen.nama}</option>)}
                                            </select>
                                            <FieldError message={edit.errors.dosen_id} />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <input className="form-input" value={edit.data.kode_kelas} onChange={(e) => edit.setData('kode_kelas', e.target.value)} />
                                                <FieldError message={edit.errors.kode_kelas} />
                                            </div>
                                            <div>
                                                <input className="form-input" value={edit.data.tahun_akademik} onChange={(e) => edit.setData('tahun_akademik', e.target.value)} />
                                                <FieldError message={edit.errors.tahun_akademik} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button className="btn-primary w-full" type="submit" disabled={edit.processing}>Update</button>
                                            <button type="button" className="btn-outline w-full" onClick={cancelEdit}>Batal</button>
                                        </div>
                                    </form>
                                )}
                            </Fragment>
                        )) : <EmptyState title="Belum ada kelas" description="Tambah kelas untuk mulai menjadwalkan perkuliahan." />}
                    </div>
                    <div className="mt-4 hidden max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 md:block">
                        <table className="min-w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="text-slate-500">
                                    <th className="px-3 py-2 whitespace-nowrap">Kode</th>
                                    <th className="px-3 py-2">Mata Kuliah</th>
                                    <th className="px-3 py-2">Dosen</th>
                                    <th className="px-3 py-2">Tahun / Semester</th>
                                    <th className="px-3 py-2">Ruang</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length ? data.map((item) => (
                                    <Fragment key={item.id}>
                                        <tr className="border-t border-slate-100 align-top">
                                            <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">{item.kode_kelas}</td>
                                            <td className="px-3 py-3 text-slate-700">{item.mata_kuliah?.nama || '-'}</td>
                                            <td className="px-3 py-3 text-slate-600">{item.dosen?.nama || '-'}</td>
                                            <td className="px-3 py-3 text-slate-600">{item.tahunAkademik?.kode || item.tahun_akademik || '-'} | Smt {item.semester_akademik}</td>
                                            <td className="px-3 py-3 text-slate-600">{item.ruangan_ref?.nama || item.ruangan || '-'}</td>
                                            <td className="px-3 py-3"><StatusBadge active={!!item.is_active} /></td>
                                            <td className="px-3 py-3"><RowActions onEdit={() => startEdit(item)} onDelete={() => confirmDeletion(item)} kode={item.kode_kelas} /></td>
                                        </tr>
                                        {editingId === item.id && (
                                            <tr className="border-t border-slate-100 bg-sky-50/60">
                                                <td colSpan="7" className="px-3 py-4">
                                                    <form onSubmit={(e) => { e.preventDefault(); edit.put(route('akademik.kelas.update', item.id), { preserveScroll: true, onSuccess: () => setEditingId(null) }); }} className="grid gap-3 lg:grid-cols-2">
                                                        <div>
                                                            <select className="form-input" value={edit.data.mata_kuliah_id} onChange={(e) => edit.setData('mata_kuliah_id', e.target.value)}>
                                                                <option value="">Mata Kuliah</option>
                                                                {mataKuliahs.map((mk) => <option key={mk.id} value={mk.id}>{mk.kode} - {mk.nama}</option>)}
                                                            </select>
                                                            <FieldError message={edit.errors.mata_kuliah_id} />
                                                        </div>
                                                        <div>
                                                            <select className="form-input" value={edit.data.dosen_id} onChange={(e) => edit.setData('dosen_id', e.target.value)}>
                                                                <option value="">Dosen</option>
                                                                {dosens.map((dosen) => <option key={dosen.id} value={dosen.id}>{dosen.nama}</option>)}
                                                            </select>
                                                            <FieldError message={edit.errors.dosen_id} />
                                                        </div>
                                                        <div className="flex flex-col gap-2 sm:flex-row lg:col-span-2 mt-2">
                                                            <button className="btn-primary w-full sm:w-auto" type="submit" disabled={edit.processing}>Update</button>
                                                            <button type="button" className="btn-outline w-full sm:w-auto" onClick={cancelEdit}>Batal</button>
                                                        </div>
                                                    </form>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                )) : (
                                    <tr><td colSpan="7" className="px-3 py-6"><EmptyState title="Belum ada kelas" description="Tambah kelas untuk mulai menjadwalkan perkuliahan." /></td></tr>
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

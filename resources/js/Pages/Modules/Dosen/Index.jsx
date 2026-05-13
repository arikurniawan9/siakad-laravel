import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ImportModal from './ImportModal';

const statusTone = {
    tetap: 'bg-emerald-100 text-emerald-700',
    tidak_tetap: 'bg-amber-100 text-amber-700',
    luar_biasa: 'bg-sky-100 text-sky-700',
};

function ActionIcon({ name, className = 'h-4 w-4' }) {
    const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8 };

    switch (name) {
        case 'plus':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                </svg>
            );
        case 'filter':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" />
                </svg>
            );
        case 'search':
            return (
                <svg {...common}>
                    <circle cx="11" cy="11" r="5.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16 16 4 4" />
                </svg>
            );
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
        case 'export':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10m0 0 4-4m-4 4-4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" />
                </svg>
            );
        default:
            return null;
    }
}

function FieldError({ message }) {
    return message ? <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p> : null;
}

function DosenFormFields({ data, setData, errors = {}, nidnRef = null }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div>
                <input ref={nidnRef} className="form-input" placeholder="NIDN" value={data.nidn} onChange={(e) => setData('nidn', e.target.value)} />
                <FieldError message={errors.nidn} />
            </div>
            <div>
                <input className="form-input" placeholder="NIP" value={data.nip} onChange={(e) => setData('nip', e.target.value)} />
                <FieldError message={errors.nip} />
            </div>
            <div className="sm:col-span-2">
                <input className="form-input" placeholder="Nama" value={data.nama} onChange={(e) => setData('nama', e.target.value)} />
                <FieldError message={errors.nama} />
            </div>
            <div>
                <input className="form-input" placeholder="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                <FieldError message={errors.email} />
            </div>
            <div>
                <input className="form-input" placeholder="No HP" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                <FieldError message={errors.phone} />
            </div>
            <div className="sm:col-span-2">
                <select className="form-input" value={data.status_dosen} onChange={(e) => setData('status_dosen', e.target.value)}>
                    <option value="tetap">tetap</option>
                    <option value="tidak_tetap">tidak tetap</option>
                    <option value="luar_biasa">luar biasa</option>
                </select>
                <FieldError message={errors.status_dosen} />
            </div>
        </div>
    );
}

export default function Page({ auth, filters = null, dosens = { data: [], meta: null, links: [] }, summary: serverSummary = null }) {
    const { menu, flash, errors } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'latest');
    const [sortDir, setSortDir] = useState(filters?.sort_dir || 'desc');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [modalMounted, setModalMounted] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const createNidnRef = useRef(null);
    const editNidnRef = useRef(null);

    const form = useForm({ nidn: '', nip: '', nama: '', email: '', phone: '', status_dosen: 'tetap' });
    const edit = useForm({ nidn: '', nip: '', nama: '', email: '', phone: '', status_dosen: 'tetap' });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('dosen.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('nidn', 'nip', 'nama', 'email', 'phone');
                setShowCreateModal(false);
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

        router.get(route('dosen.index'), params, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPerPage('10');
        setSortBy('latest');
        setSortDir('desc');
        setShowMobileFilters(false);
        router.get(route('dosen.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const scrollToFilters = () => {
        document.getElementById('dosen-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        const normalizedSearch = filters?.search || '';
        if (search === normalizedSearch) return undefined;

        const timeout = setTimeout(() => {
            router.get(route('dosen.index'), {
                search,
                status: statusFilter,
                per_page: perPage,
                sort_by: sortBy,
                sort_dir: sortDir,
            }, { preserveScroll: true, preserveState: true, replace: true });
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        const hasModal = showCreateModal || showImportModal || Boolean(editTarget) || Boolean(deleteTarget);
        setModalMounted(hasModal);
        document.body.classList.toggle('overflow-hidden', hasModal);
        return () => document.body.classList.remove('overflow-hidden');
    }, [showCreateModal, showImportModal, editTarget, deleteTarget]);

    useEffect(() => {
        if (!showCreateModal) return;
        const t = setTimeout(() => createNidnRef.current?.focus(), 120);
        return () => clearTimeout(t);
    }, [showCreateModal]);

    useEffect(() => {
        if (!editTarget) return;
        const t = setTimeout(() => editNidnRef.current?.focus(), 120);
        return () => clearTimeout(t);
    }, [editTarget]);

    useEffect(() => {
        if (!modalMounted) return undefined;
        const onEsc = (e) => {
            if (e.key !== 'Escape') return;
            if (!form.processing) setShowCreateModal(false);
            if (!showImportModal) setShowImportModal(false);
            if (!edit.processing) setEditTarget(null);
            if (!isDeleting) setDeleteTarget(null);
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [modalMounted, form.processing, edit.processing, isDeleting, showImportModal]);

    const summary = useMemo(() => {
        if (serverSummary) {
            return {
                total: serverSummary.total ?? 0,
                tetap: serverSummary.tetap ?? 0,
                tidakTetap: serverSummary.tidak_tetap ?? 0,
                luarBiasa: serverSummary.luar_biasa ?? 0,
            };
        }

        const rows = dosens.data || [];
        return {
            total: dosens.meta?.total ?? 0,
            tetap: rows.filter((r) => r.status_dosen === 'tetap').length,
            tidakTetap: rows.filter((r) => r.status_dosen === 'tidak_tetap').length,
            luarBiasa: rows.filter((r) => r.status_dosen === 'luar_biasa').length,
        };
    }, [dosens, serverSummary]);

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Data Dosen" />

            <ImportModal 
                show={showImportModal} 
                onClose={() => setShowImportModal(false)} 
                templateUrl={route('dosen.import.template')}
            />

            <div className="space-y-4 pb-28 md:pb-0">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_45%),linear-gradient(130deg,_#ffffff,_#f8fafc)] p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Faculty Management</p>
                            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Kontrol Data Dosen</h3>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Kelola data dosen dengan alur yang lebih fokus, cepat, dan rapi.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                <ActionIcon name="export" className="mr-2 h-4 w-4" />
                                Import Excel
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,0.9)] transition hover:brightness-105"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <ActionIcon name="plus" className="mr-2 h-4 w-4" />
                                Tambah Dosen
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total Data</p><p className="mt-1 text-xl font-black text-slate-900">{summary.total}</p></div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Dosen Tetap</p><p className="mt-1 text-xl font-black text-emerald-800">{summary.tetap}</p></div>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Tidak Tetap</p><p className="mt-1 text-xl font-black text-amber-800">{summary.tidakTetap}</p></div>
                        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Luar Biasa</p><p className="mt-1 text-xl font-black text-sky-800">{summary.luarBiasa}</p></div>
                    </div>
                </section>

                <section id="dosen-filters" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    {flash?.success && <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}
                    {errors?.delete && <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{errors.delete}</p>}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">Daftar Dosen</h3>
                        <div className="flex items-center gap-2">
                            <a href={route('dosen.index.pdf', { search, status: statusFilter, sort_by: sortBy, sort_dir: sortDir })} className="btn-outline inline-flex items-center gap-2">
                                <ActionIcon name="export" />
                                Export PDF
                            </a>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{dosens.meta?.total ?? 0} data</div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 md:hidden">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Filter & Sort</p>
                        <button
                            type="button"
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
                            onClick={() => setShowMobileFilters((value) => !value)}
                        >
                            <span className="inline-flex items-center gap-2">
                                <ActionIcon name="filter" />
                                {showMobileFilters ? 'Tutup' : 'Buka'} Filter
                            </span>
                        </button>
                    </div>

                    <div className={`mt-3 gap-2 sm:grid-cols-2 xl:grid-cols-4 ${showMobileFilters ? 'grid' : 'hidden md:grid'}`}>
                        <input className="form-input xl:col-span-2" placeholder="Cari NIDN, NIP, nama, email, phone" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
                        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Semua status</option>
                            <option value="tetap">tetap</option>
                            <option value="tidak_tetap">tidak tetap</option>
                            <option value="luar_biasa">luar biasa</option>
                        </select>
                        <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="latest">Terbaru</option>
                            <option value="nidn">NIDN</option>
                            <option value="nama">Nama</option>
                            <option value="status_dosen">Status</option>
                        </select>
                        <select className="form-input" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                            <option value="desc">Desc</option>
                            <option value="asc">Asc</option>
                        </select>
                        <select className="form-input" value={perPage} onChange={(e) => setPerPage(e.target.value)}>
                            <option value="10">10 / halaman</option>
                            <option value="15">15 / halaman</option>
                            <option value="25">25 / halaman</option>
                            <option value="50">50 / halaman</option>
                        </select>
                        <div className="flex gap-2">
                            <button type="button" className="btn-primary w-full" onClick={() => applyFilters()}>Terapkan</button>
                            <button type="button" className="btn-outline w-full" onClick={resetFilters}>Reset</button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3 md:hidden">
                        {dosens.data.map((d) => (
                            <article key={`card-${d.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{d.nidn || '-'}</p>
                                        <h4 className="mt-1 text-sm font-extrabold text-slate-900">{d.nama}</h4>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone[d.status_dosen] || 'bg-slate-100 text-slate-700'}`}>
                                        {d.status_dosen}
                                    </span>
                                </div>
                                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                                    <p><span className="font-semibold text-slate-700">Email:</span> {d.email || '-'}</p>
                                    <p><span className="font-semibold text-slate-700">Phone:</span> {d.phone || '-'}</p>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <button
                                        className="btn-outline inline-flex w-full items-center justify-center gap-2"
                                        onClick={() => {
                                            setEditTarget(d);
                                            edit.setData({
                                                nidn: d.nidn || '',
                                                nip: d.nip || '',
                                                nama: d.nama || '',
                                                email: d.email || '',
                                                phone: d.phone || '',
                                                status_dosen: d.status_dosen || 'tetap',
                                            });
                                        }}
                                    >
                                        <ActionIcon name="edit" />
                                        Edit
                                    </button>
                                    <button className="btn-danger inline-flex w-full items-center justify-center gap-2" onClick={() => setDeleteTarget(d)}>
                                        <ActionIcon name="trash" />
                                        Hapus
                                    </button>
                                </div>
                            </article>
                        ))}
                        {dosens.data.length === 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-xs text-slate-500">
                                Tidak ada data dosen yang cocok dengan filter.
                            </div>
                        )}
                    </div>

                    <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                        <table className="min-w-full text-left text-xs">
                            <thead className="bg-slate-50">
                                <tr className="text-slate-500">
                                    <th className="px-3 py-2">NIDN</th>
                                    <th className="px-3 py-2">Nama</th>
                                    <th className="px-3 py-2">Email</th>
                                    <th className="px-3 py-2">Phone</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dosens.data.map((d) => (
                                    <tr key={d.id} className="border-t border-slate-100">
                                        <td className="px-3 py-3 font-semibold text-slate-700">{d.nidn}</td>
                                        <td className="px-3 py-3 text-slate-700">{d.nama}</td>
                                        <td className="px-3 py-3 text-slate-600">{d.email || '-'}</td>
                                        <td className="px-3 py-3 text-slate-600">{d.phone || '-'}</td>
                                        <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone[d.status_dosen] || 'bg-slate-100 text-slate-700'}`}>{d.status_dosen}</span></td>
                                        <td className="px-3 py-3">
                                            <div className="flex gap-1">
                                                <button
                                                    className="btn-outline inline-flex items-center gap-2"
                                                    onClick={() => {
                                                        setEditTarget(d);
                                                        edit.setData({
                                                            nidn: d.nidn || '',
                                                            nip: d.nip || '',
                                                            nama: d.nama || '',
                                                            email: d.email || '',
                                                            phone: d.phone || '',
                                                            status_dosen: d.status_dosen || 'tetap',
                                                        });
                                                    }}
                                                >
                                                    <ActionIcon name="edit" />
                                                    Edit
                                                </button>
                                                <button className="btn-danger inline-flex items-center gap-2" onClick={() => setDeleteTarget(d)}>
                                                    <ActionIcon name="trash" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {dosens.data.length === 0 && <tr><td className="px-3 py-4 text-slate-500" colSpan="6">Tidak ada data dosen yang cocok dengan filter.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">Menampilkan {dosens.meta?.from ?? 0}-{dosens.meta?.to ?? 0} dari {dosens.meta?.total ?? 0} data</p>
                        <div className="flex flex-wrap gap-2">
                            {dosens.links?.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => link.url && applyFilters(link.url)}
                                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 disabled:opacity-50'}`}
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200" onClick={() => !form.processing && setShowCreateModal(false)} />
                    <div className="relative w-full max-w-2xl rounded-3xl border border-slate-300/30 bg-white p-5 shadow-2xl transition-all duration-300 ease-out">
                        <h3 className="text-lg font-black text-slate-900">Tambah Dosen</h3>
                        <p className="mt-1 text-xs text-slate-500">Isi data dosen baru untuk ditambahkan ke sistem.</p>
                        <form onSubmit={submit} className="mt-4 space-y-3">
                            <DosenFormFields data={form.data} setData={form.setData} errors={form.errors} nidnRef={createNidnRef} />
                            <div className="flex justify-end gap-2">
                                <button type="button" className="btn-outline disabled:opacity-60" disabled={form.processing} onClick={() => setShowCreateModal(false)}>Batal</button>
                                <button type="submit" className="btn-primary min-w-28 disabled:opacity-70" disabled={form.processing}>{form.processing ? 'Menyimpan...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200" onClick={() => !edit.processing && setEditTarget(null)} />
                    <div className="relative w-full max-w-2xl rounded-3xl border border-slate-300/30 bg-white p-5 shadow-2xl transition-all duration-300 ease-out">
                        <h3 className="text-lg font-black text-slate-900">Edit Dosen</h3>
                        <p className="mt-1 text-xs text-slate-500">Perbarui data dosen dengan teliti.</p>
                        <form
                            className="mt-4 space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                edit.put(route('dosen.update', editTarget.id), {
                                    preserveScroll: true,
                                    onSuccess: () => setEditTarget(null),
                                });
                            }}
                        >
                            <DosenFormFields data={edit.data} setData={edit.setData} errors={edit.errors} nidnRef={editNidnRef} />
                            <div className="flex justify-end gap-2">
                                <button type="button" className="btn-outline disabled:opacity-60" disabled={edit.processing} onClick={() => setEditTarget(null)}>Batal</button>
                                <button type="submit" className="btn-primary min-w-28 disabled:opacity-70" disabled={edit.processing}>{edit.processing ? 'Mengupdate...' : 'Update'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200" onClick={() => !isDeleting && setDeleteTarget(null)} />
                    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-200/30 bg-[linear-gradient(150deg,rgba(30,41,59,0.95),rgba(15,23,42,0.94))] p-6 text-slate-100 shadow-2xl transition-all duration-300 ease-out">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">Konfirmasi Hapus</p>
                        <h4 className="mt-2 text-xl font-black text-white">Hapus Data Dosen?</h4>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            Anda akan menghapus data:
                            <span className="mt-1 block rounded-xl border border-rose-200/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200">
                                {deleteTarget.nama} ({deleteTarget.nidn})
                            </span>
                        </p>
                        <p className="mt-3 text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <button className="rounded-xl border border-slate-500/40 bg-slate-700/40 px-3 py-2 text-xs font-bold text-slate-100 transition hover:bg-slate-600/50 disabled:opacity-60" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>Batal</button>
                            <button
                                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_12px_24px_-14px_rgba(244,63,94,0.95)] transition hover:brightness-105 disabled:opacity-70"
                                disabled={isDeleting}
                                onClick={async () => {
                                    setIsDeleting(true);
                                    router.delete(route('dosen.destroy', deleteTarget.id), {
                                        preserveScroll: true,
                                        onFinish: () => {
                                            setIsDeleting(false);
                                            setDeleteTarget(null);
                                        },
                                    });
                                }}
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 px-4 py-3 shadow-[0_-12px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur md:hidden">
                <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2">
                    <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 shadow-sm"
                        onClick={scrollToFilters}
                    >
                        <span className="inline-flex items-center gap-2">
                            <ActionIcon name="filter" />
                            Filter
                        </span>
                    </button>
                    <button
                        type="button"
                        className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-3 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,0.9)]"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <span className="inline-flex items-center gap-2">
                            <ActionIcon name="plus" />
                            Tambah Dosen
                        </span>
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

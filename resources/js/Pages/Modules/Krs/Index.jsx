import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ModuleHero from '@/Components/ModuleHero';
import EmptyState from '../Akademik/EmptyState';

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

function KrsCard({ krs, onSubmit, onApprove, onReject }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{krs.mahasiswa?.nim || '-'}</p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{krs.mahasiswa?.nama || '-'}</h4>
                    <p className="text-xs text-slate-500">
                        {krs.tahun_akademik} / Semester {krs.semester_akademik}
                    </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">{krs.status}</span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <dt className="text-slate-400">Total SKS</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{krs.total_sks}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Detail</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{krs.details?.length || 0} kelas</dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-slate-400">Audit</dt>
                    <dd className="mt-1 text-[11px] text-slate-600">
                        {krs.approved_by_user ? `Approved by ${krs.approved_by_user.name}` : 'Belum di-approve'}
                        {krs.rejected_by_user ? ` | Rejected by ${krs.rejected_by_user.name}` : ''}
                    </dd>
                </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
                {(krs.status === 'draft' || krs.status === 'rejected') && (
                    <button type="button" className="btn-outline" onClick={() => onSubmit(krs.id)}>
                        Submit
                    </button>
                )}
                {krs.status === 'submitted' && (
                    <>
                        <button type="button" className="btn-primary" onClick={() => onApprove(krs.id)}>
                            Approve
                        </button>
                        <button type="button" className="btn-danger" onClick={() => onReject(krs.id)}>
                            Reject
                        </button>
                    </>
                )}
                <Link className="btn-outline" href={route('krs.show', krs.id)}>
                    Detail/Print
                </Link>
            </div>
        </article>
    );
}

export default function Page({ auth, tahunAktif = null, kelasAktif = [], mahasiswas = [], filters = null, krsList = { data: [], meta: null, links: [] }, maxSks = 24 }) {
    const { menu, flash, errors } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'latest');
    const [sortDir, setSortDir] = useState(filters?.sort_dir || 'desc');

    const form = useForm({
        mahasiswa_id: '',
        kelas_ids: [],
        catatan: '',
    });

    const toggleKelas = (id) => {
        const exists = form.data.kelas_ids.includes(id);
        if (exists) {
            form.setData('kelas_ids', form.data.kelas_ids.filter((x) => x !== id));
            return;
        }
        form.setData('kelas_ids', [...form.data.kelas_ids, id]);
    };

    const totalSks = kelasAktif
        .filter((k) => form.data.kelas_ids.includes(k.id))
        .reduce((acc, item) => acc + (item.mata_kuliah?.sks || 0), 0);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('krs.store'), { preserveScroll: true });
    };

    const action = (routeName, id) => {
        router.patch(route(routeName, id), {}, { preserveScroll: true });
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

        router.get(route('krs.index'), params, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPerPage('10');
        setSortBy('latest');
        setSortDir('desc');
        router.get(route('krs.index'), {}, { preserveScroll: true, preserveState: true });
    };

    useEffect(() => {
        const normalizedSearch = filters?.search || '';
        if (search === normalizedSearch) {
            return undefined;
        }

        const timeout = setTimeout(() => {
            router.get(route('krs.index'), {
                search,
                status: statusFilter,
                per_page: perPage,
                sort_by: sortBy,
                sort_dir: sortDir,
            }, { preserveScroll: true, preserveState: true, replace: true });
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">KRS - Perencanaan Studi</h2>}>
            <Head title="KRS - Perencanaan Studi" />

            <ModuleHero
                eyebrow="Perkuliahan"
                title="KRS - Perencanaan Studi"
                description="Susun KRS, pilih kelas aktif, dan pantau workflow persetujuan dalam satu halaman."
                note={`Tahun aktif: ${tahunAktif ? `${tahunAktif.kode} | Semester ${tahunAktif.semester_aktif}` : 'Belum diset'} | Maks SKS: ${maxSks}`}
            />

            <section className="panel p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tahun Akademik Aktif</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{tahunAktif ? `${tahunAktif.kode} - ${tahunAktif.nama}` : 'Belum diset'}</p>
                <p className="text-xs text-slate-600">Semester aktif: {tahunAktif?.semester_aktif || '-'} | Maks SKS: {maxSks}</p>
            </section>

            <section className="panel mt-4 p-4">
                <h3 className="text-sm font-bold text-slate-900">Transaksi KRS</h3>
                {flash?.success && <p className="mt-2 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}
                {errors?.tahun && <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">{errors.tahun}</p>}
                <form onSubmit={submit} className="mt-3 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <select className="form-input" value={form.data.mahasiswa_id} onChange={(e) => form.setData('mahasiswa_id', e.target.value)}>
                            <option value="">Pilih mahasiswa</option>
                            {mahasiswas.map((m) => (
                                <option key={m.id} value={m.id}>{m.nim} - {m.nama}</option>
                            ))}
                        </select>
                        <input className="form-input" value={totalSks} readOnly placeholder="Total SKS" />
                    </div>
                    {errors?.mahasiswa_id && <p className="text-xs text-rose-600">{errors.mahasiswa_id}</p>}
                    {errors?.kelas_ids && <p className="text-xs text-rose-600">{errors.kelas_ids}</p>}

                    <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-200">
                        <table className="min-w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                                    <th className="px-2 py-2">Pilih</th>
                                    <th className="px-2 py-2">Kode Kelas</th>
                                    <th className="px-2 py-2">Mata Kuliah</th>
                                    <th className="px-2 py-2">SKS</th>
                                    <th className="px-2 py-2">Dosen</th>
                                    <th className="px-2 py-2">Ruang</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kelasAktif.map((k) => (
                                    <tr key={k.id} className="border-b border-slate-100">
                                        <td className="px-2 py-2"><input type="checkbox" checked={form.data.kelas_ids.includes(k.id)} onChange={() => toggleKelas(k.id)} /></td>
                                        <td className="px-2 py-2 font-semibold text-slate-700">{k.kode_kelas}</td>
                                        <td className="px-2 py-2 text-slate-700">{k.mata_kuliah?.kode} - {k.mata_kuliah?.nama}</td>
                                        <td className="px-2 py-2 text-slate-600">{k.mata_kuliah?.sks || '-'}</td>
                                        <td className="px-2 py-2 text-slate-600">{k.dosen?.nama || '-'}</td>
                                        <td className="px-2 py-2 text-slate-600">{k.ruangan_ref?.nama || k.ruangan || '-'}</td>
                                    </tr>
                                ))}
                                {kelasAktif.length === 0 && <tr><td className="px-2 py-3 text-slate-500" colSpan="6">Belum ada kelas aktif.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <textarea rows="2" className="form-input" placeholder="Catatan (opsional)" value={form.data.catatan} onChange={(e) => form.setData('catatan', e.target.value)} />
                    <button className="btn-primary" disabled={form.processing || !tahunAktif}>Simpan KRS</button>
                </form>
            </section>

            <section className="panel mt-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900">Workflow KRS</h3>
                    <div className="flex items-center gap-2">
                        <a
                            href={route('krs.index.pdf', { search, status: statusFilter, sort_by: sortBy, sort_dir: sortDir })}
                            className="btn-outline"
                        >
                            Export PDF
                        </a>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{krsList.meta?.total ?? 0} data</div>
                    </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_150px_120px_120px_auto_auto]">
                    <input className="form-input" placeholder="Cari NIM atau nama mahasiswa" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
                    <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Semua status</option>
                        <option value="draft">draft</option>
                        <option value="submitted">submitted</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                    </select>
                    <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="latest">Terbaru</option>
                        <option value="tahun_akademik">Tahun</option>
                        <option value="semester_akademik">Semester</option>
                        <option value="total_sks">Total SKS</option>
                        <option value="status">Status</option>
                    </select>
                    <select className="form-input" value={perPage} onChange={(e) => setPerPage(e.target.value)}>
                        <option value="10">10 / halaman</option>
                        <option value="30">30 / halaman</option>
                        <option value="50">50 / halaman</option>
                        <option value="100">100 / halaman</option>
                    </select>
                    <select className="form-input" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </select>
                    <button type="button" className="btn-primary" onClick={() => applyFilters()}>Terapkan</button>
                    <button type="button" className="btn-outline" onClick={resetFilters}>Reset</button>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                    {krsList.data.length ? (
                        krsList.data.map((krs) => <KrsCard key={krs.id} krs={krs} onSubmit={(id) => action('krs.submit', id)} onApprove={(id) => action('krs.approve', id)} onReject={(id) => action('krs.reject', id)} />)
                    ) : (
                        <EmptyState title="Belum ada data KRS" description="Workflow KRS akan tampil di sini setelah mahasiswa mengajukan." />
                    )}
                </div>

                <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                    <table className="min-w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-50">
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-2 py-2">Mahasiswa</th>
                                <th className="px-2 py-2">Tahun/Smt</th>
                                <th className="px-2 py-2">Total SKS</th>
                                <th className="px-2 py-2">Status</th>
                                <th className="px-2 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {krsList.data.flatMap((krs) => ([
                                <tr key={`main-${krs.id}`} className="border-b border-slate-100">
                                    <td className="px-2 py-2 text-slate-700">{krs.mahasiswa?.nim} - {krs.mahasiswa?.nama}</td>
                                    <td className="px-2 py-2 text-slate-600">{krs.tahun_akademik} / {krs.semester_akademik}</td>
                                    <td className="px-2 py-2 font-semibold text-slate-700">{krs.total_sks}</td>
                                    <td className="px-2 py-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{krs.status}</span></td>
                                    <td className="px-2 py-2">
                                        <div className="flex flex-wrap gap-1">
                                            {(krs.status === 'draft' || krs.status === 'rejected') && <button type="button" className="btn-outline" onClick={() => action('krs.submit', krs.id)}>Submit</button>}
                                            {krs.status === 'submitted' && <button type="button" className="btn-primary" onClick={() => action('krs.approve', krs.id)}>Approve</button>}
                                            {krs.status === 'submitted' && <button type="button" className="btn-danger" onClick={() => action('krs.reject', krs.id)}>Reject</button>}
                                            <Link className="btn-outline" href={route('krs.show', krs.id)}>Detail/Print</Link>
                                        </div>
                                    </td>
                                </tr>,
                                <tr key={`detail-${krs.id}`} className="border-b border-slate-100 bg-slate-50/60">
                                    <td className="px-2 py-2 text-slate-500" colSpan="5">
                                        Detail kelas: {krs.details?.length ? krs.details.map((d) => `${d.kelas?.mata_kuliah?.kode || '-'} ${d.kelas?.mata_kuliah?.nama || ''} (${d.sks} SKS)`).join(' | ') : 'Belum ada detail kelas'}
                                        <br />
                                        Audit: {krs.approved_by_user ? `Approved by ${krs.approved_by_user.name} (${krs.approved_at || '-'})` : 'Belum di-approve'}{krs.rejected_by_user ? ` | Rejected by ${krs.rejected_by_user.name} (${krs.rejected_at || '-'})` : ''}
                                    </td>
                                </tr>,
                            ]))}
                            {krsList.data.length === 0 && <tr><td className="px-2 py-3 text-slate-500" colSpan="5">Tidak ada data KRS yang cocok dengan filter.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">Menampilkan {krsList.meta?.from ?? 0}-{krsList.meta?.to ?? 0} dari {krsList.meta?.total ?? 0} data</p>
                    <PaginationButtons links={krsList.links} onClick={(url) => applyFilters(url)} />
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

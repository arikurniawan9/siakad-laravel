import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function Badge({ children, tone = 'bg-slate-100 text-slate-700' }) {
    return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${tone}`}>{children}</span>;
}

export default function Page({ auth, filters = null, prodis = [], dosens = { data: [], meta: null, links: [] }, summary = null }) {
    const { menu, flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'latest');
    const [sortDir, setSortDir] = useState(filters?.sort_dir || 'desc');
    const [editingId, setEditingId] = useState(null);

    const form = useForm({ prodi_id: '' });

    const applyFilters = (pageUrl = null) => {
        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('dosen.relasi.index'), {
            search,
            status: statusFilter,
            per_page: perPage,
            sort_by: sortBy,
            sort_dir: sortDir,
        }, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPerPage('10');
        setSortBy('latest');
        setSortDir('desc');
        setEditingId(null);
        router.get(route('dosen.relasi.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const displaySummary = useMemo(() => summary || {
        total: dosens.meta?.total ?? 0,
        withProdi: dosens.data.filter((item) => item.prodi_id).length,
        withoutProdi: dosens.data.filter((item) => !item.prodi_id).length,
    }, [summary, dosens]);

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">Relasi Dosen</h2>}>
            <Head title="Relasi Dosen" />

            <ModuleHero
                eyebrow="Dosen"
                title="Relasi Dosen"
                description="Kelola pengaitan prodi setiap dosen tanpa mengganggu data identitas utama."
                note={`Total data: ${displaySummary.total}`}
            />

            <div className="space-y-4">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_45%),linear-gradient(130deg,_#ffffff,_#f8fafc)] p-5 shadow-sm sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Teaching Assignment Console</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Kelola Prodi untuk Setiap Dosen</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        Pengaturan ini dipisahkan dari halaman data dosen agar relasi prodi bisa dikelola tanpa mengganggu data identitas utama.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total Dosen</p>
                            <p className="mt-1 text-xl font-black text-slate-900">{displaySummary.total}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Sudah Punya Prodi</p>
                            <p className="mt-1 text-xl font-black text-emerald-800">{displaySummary.withProdi}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Belum Relasi Prodi</p>
                            <p className="mt-1 text-xl font-black text-amber-800">{displaySummary.withoutProdi}</p>
                        </div>
                    </div>
                </section>

                {flash?.success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">Daftar Relasi Dosen</h3>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{dosens.meta?.total ?? 0} data</div>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                        <input className="form-input xl:col-span-2" placeholder="Cari NIDN, nama, atau email" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
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
                            <option value="prodi">Prodi</option>
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
                        <div className="flex gap-2 md:col-span-2 xl:col-span-5">
                            <button type="button" className="btn-primary w-full" onClick={() => applyFilters()}>Terapkan</button>
                            <button type="button" className="btn-outline w-full" onClick={resetFilters}>Reset</button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3 md:hidden">
                        {dosens.data.map((dosen) => (
                            <article key={dosen.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{dosen.nidn}</p>
                                        <h4 className="mt-1 text-sm font-extrabold text-slate-900">{dosen.nama}</h4>
                                    </div>
                                    <Badge tone={dosen.prodi ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                                        {dosen.prodi ? 'Relasi aktif' : 'Belum relasi'}
                                    </Badge>
                                </div>
                                <p className="mt-2 text-xs text-slate-600">{dosen.email || '-'}</p>
                                <div className="mt-4 rounded-2xl border border-white bg-white p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Prodi</p>
                                    {editingId === dosen.id ? (
                                        <div className="mt-2 space-y-2">
                                            <select className="form-input" value={form.data.prodi_id} onChange={(e) => form.setData('prodi_id', e.target.value)}>
                                                <option value="">Belum dipilih</option>
                                                {prodis.map((prodi) => (
                                                    <option key={prodi.id} value={prodi.id}>{prodi.nama} ({prodi.jenjang})</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn-primary w-full"
                                                    disabled={form.processing}
                                                    onClick={() => form.put(route('dosen.relasi.update', dosen.id), {
                                                        preserveScroll: true,
                                                        onSuccess: () => setEditingId(null),
                                                    })}
                                                >
                                                    {form.processing ? 'Menyimpan...' : 'Simpan'}
                                                </button>
                                                <button type="button" className="btn-outline w-full" onClick={() => setEditingId(null)}>Batal</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{dosen.prodi ? dosen.prodi.nama : 'Belum ada prodi'}</p>
                                                <p className="text-xs text-slate-500">{dosen.prodi?.jenjang || 'Silakan tautkan ke prodi terkait'}</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-outline"
                                                onClick={() => {
                                                    setEditingId(dosen.id);
                                                    form.setData('prodi_id', dosen.prodi_id || '');
                                                }}
                                            >
                                                {dosen.prodi ? 'Ubah' : 'Atur'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                        {dosens.data.length === 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-xs text-slate-500">
                                Tidak ada dosen yang cocok dengan filter.
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
                                    <th className="px-3 py-2">Prodi</th>
                                    <th className="px-3 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dosens.data.map((dosen) => (
                                    <tr key={dosen.id} className="border-t border-slate-100">
                                        <td className="px-3 py-3 font-semibold text-slate-700">{dosen.nidn}</td>
                                        <td className="px-3 py-3 text-slate-700">{dosen.nama}</td>
                                        <td className="px-3 py-3 text-slate-600">{dosen.email || '-'}</td>
                                        <td className="px-3 py-3">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-slate-800">{dosen.prodi ? dosen.prodi.nama : 'Belum ada prodi'}</p>
                                                <p className="text-[11px] text-slate-500">{dosen.prodi?.jenjang || 'Tautkan prodi terkait'}</p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            {editingId === dosen.id ? (
                                                <div className="flex min-w-[280px] items-center gap-2">
                                                    <select className="form-input" value={form.data.prodi_id} onChange={(e) => form.setData('prodi_id', e.target.value)}>
                                                        <option value="">Belum dipilih</option>
                                                        {prodis.map((prodi) => (
                                                            <option key={prodi.id} value={prodi.id}>{prodi.nama} ({prodi.jenjang})</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        className="btn-primary"
                                                        disabled={form.processing}
                                                        onClick={() => form.put(route('dosen.relasi.update', dosen.id), {
                                                            preserveScroll: true,
                                                            onSuccess: () => setEditingId(null),
                                                        })}
                                                    >
                                                        {form.processing ? 'Menyimpan...' : 'Simpan'}
                                                    </button>
                                                    <button type="button" className="btn-outline" onClick={() => setEditingId(null)}>Batal</button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn-outline"
                                                    onClick={() => {
                                                        setEditingId(dosen.id);
                                                        form.setData('prodi_id', dosen.prodi_id || '');
                                                    }}
                                                >
                                                    {dosen.prodi ? 'Ubah Relasi' : 'Atur Relasi'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {dosens.data.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-4 text-slate-500" colSpan="5">Tidak ada dosen yang cocok dengan filter.</td>
                                    </tr>
                                )}
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
        </AuthenticatedLayout>
    );
}

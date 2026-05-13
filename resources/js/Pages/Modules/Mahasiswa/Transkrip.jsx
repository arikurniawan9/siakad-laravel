import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import EmptyState from '../Akademik/EmptyState';

export default function Page({ auth, mahasiswa, ringkasan, rows = [], pesan }) {
    const { menu } = usePage().props;
    const [search, setSearch] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('all');
    const semesterOptions = useMemo(
        () => [...new Set(rows.map((row) => row.semester).filter(Boolean))],
        [rows],
    );
    const filteredRows = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return rows.filter((row) => {
            const matchesSemester = semesterFilter === 'all' || row.semester === semesterFilter;
            const haystack = [row.semester, row.kode, row.nama, row.dosen, row.ruang].filter(Boolean).join(' ').toLowerCase();

            return matchesSemester && (!keyword || haystack.includes(keyword));
        });
    }, [rows, search, semesterFilter]);

    const printPage = () => window.print();

    const statusBadge = (status) => {
        if (status === 'final') return 'bg-emerald-100 text-emerald-700';
        if (status === 'sementara') return 'bg-amber-100 text-amber-700';
        return 'bg-slate-100 text-slate-500';
    };

    const statusLabel = (status) => {
        if (status === 'final') return 'Final';
        if (status === 'sementara') return 'Sementara';
        return 'Belum Input';
    };

    function TranskripCard({ row, index }) {
        return (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Semester {row.semester || '-'}</p>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">{row.nama || '-'}</h4>
                        <p className="text-xs text-slate-500">{row.kode || '-'}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadge(row.status_nilai)}`}>{statusLabel(row.status_nilai)}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-slate-400">SKS</p>
                        <p className="mt-1 font-semibold text-slate-700">{row.sks || 0}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Nilai</p>
                        <p className="mt-1 font-semibold text-slate-700">{row.nilai_huruf || '-'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Bobot</p>
                        <p className="mt-1 font-semibold text-slate-700">{row.bobot ?? '-'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Dosen</p>
                        <p className="mt-1 font-semibold text-slate-700">{row.dosen || '-'}</p>
                    </div>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Ruang: {row.ruang || '-'}
                </div>
            </article>
        );
    }

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Mahasiswa - Transkrip" />

            <ModuleHero
                eyebrow="Mahasiswa"
                title="Transkrip Nilai"
                description="Gabungan seluruh nilai final mahasiswa yang sudah dipublikasikan."
                note={`Total mata kuliah: ${ringkasan?.total_matkul ?? 0} | Total SKS: ${ringkasan?.total_sks ?? 0}`}
            />

            <section className="panel p-4 print:border-none print:shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-bold text-slate-900">Transkrip Nilai Resmi</p>
                        <p className="text-xs text-slate-600">Gabungan seluruh mata kuliah dengan nilai final</p>
                    </div>
                    <div className="flex gap-2">
                        <a href={route('mahasiswa.transkrip.pdf')} className="btn-outline print:hidden">Download PDF</a>
                        <button type="button" onClick={printPage} className="btn-outline print:hidden">Print</button>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-900 p-4 text-white shadow-lg">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-200">Mahasiswa</p>
                        <p className="mt-2 text-lg font-extrabold">{mahasiswa?.nama || '-'}</p>
                        <p className="text-xs text-slate-300">{mahasiswa?.nim || '-'}</p>
                        <p className="text-xs text-slate-300">{mahasiswa?.prodi || '-'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">IPK</p>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">{ringkasan?.ipk ?? '-'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Total SKS</p>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">{ringkasan?.total_sks ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Total MK Final</p>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">{ringkasan?.total_matkul ?? 0}</p>
                    </div>
                </div>

                {pesan && <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{pesan}</div>}

                <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_240px] print:hidden">
                    <input
                        className="form-input"
                        placeholder="Cari semester, kode, mata kuliah, dosen, ruang"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select className="form-input" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
                        <option value="all">Semua semester</option>
                        {semesterOptions.map((semester) => (
                            <option key={semester} value={semester}>{semester}</option>
                        ))}
                    </select>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                    {filteredRows.length ? (
                        filteredRows.map((row, idx) => <TranskripCard key={`${row.semester}-${row.kode}-${idx}`} row={row} index={idx} />)
                    ) : (
                        <EmptyState title="Tidak ada data transkrip" description="Tidak ada nilai final yang cocok dengan filter." />
                    )}
                </div>

                <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                    <table className="min-w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-50">
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-2 py-2">Semester</th>
                                <th className="px-2 py-2">Kode</th>
                                <th className="px-2 py-2">Mata Kuliah</th>
                                <th className="px-2 py-2">SKS</th>
                                <th className="px-2 py-2">Nilai</th>
                                <th className="px-2 py-2">Bobot</th>
                                <th className="px-2 py-2">Dosen</th>
                                <th className="px-2 py-2">Ruang</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row, idx) => (
                                <tr key={`${row.semester}-${row.kode}-${idx}`} className="border-b border-slate-100">
                                    <td className="px-2 py-2 text-slate-600">{row.semester || '-'}</td>
                                    <td className="px-2 py-2 font-semibold text-slate-700">{row.kode || '-'}</td>
                                    <td className="px-2 py-2 text-slate-700">{row.nama || '-'}</td>
                                    <td className="px-2 py-2 text-slate-600">{row.sks || 0}</td>
                                    <td className="px-2 py-2 text-slate-700">{row.nilai_huruf || '-'}</td>
                                    <td className="px-2 py-2 text-slate-700">{row.bobot ?? '-'}</td>
                                    <td className="px-2 py-2 text-slate-600">{row.dosen || '-'}</td>
                                    <td className="px-2 py-2 text-slate-600">{row.ruang || '-'}</td>
                                </tr>
                            ))}
                            {!filteredRows.length && (
                                <tr>
                                    <td className="px-2 py-4 text-slate-500" colSpan="8">Tidak ada nilai final yang cocok dengan filter.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

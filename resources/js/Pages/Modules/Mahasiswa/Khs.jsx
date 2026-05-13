import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import EmptyState from '../Akademik/EmptyState';

function statusBadge(status) {
    if (status === 'final') return 'bg-emerald-100 text-emerald-700';
    if (status === 'sementara') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-500';
}

function SemesterCard({ semester }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-slate-900">{semester.tahun_akademik}</p>
                    <p className="text-xs text-slate-600">
                        Semester {semester.semester_akademik} | IPS {semester.ips ?? '-'} | {semester.semester_sks ?? 0} SKS
                    </p>
                </div>
                <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        semester.sudah_final === (semester.rows?.length || 0)
                            ? 'bg-emerald-100 text-emerald-700'
                            : semester.sudah_final > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                    }`}
                >
                    {semester.sudah_final === (semester.rows?.length || 0) ? 'Final' : semester.sudah_final > 0 ? 'Sebagian Final' : 'Belum Final'}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Final</p>
                    <p className="mt-1 font-bold text-slate-900">{semester.sudah_final || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Sementara</p>
                    <p className="mt-1 font-bold text-slate-900">{semester.sementara || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Belum Input</p>
                    <p className="mt-1 font-bold text-slate-900">{semester.belum_input || 0}</p>
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {semester.rows?.map((row) => (
                    <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-semibold text-slate-800">{row.kode || '-'}</p>
                                <p className="mt-1 text-slate-600">{row.nama || '-'}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusBadge(row.status_nilai)}`}>
                                {row.status_nilai === 'final' ? 'Final' : row.status_nilai === 'sementara' ? 'Sementara' : 'Belum Input'}
                            </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-slate-600">
                            <p>SKS: {row.sks || 0}</p>
                            <p>Nilai: {row.nilai_huruf || '-'}</p>
                            <p>Dosen: {row.dosen || '-'}</p>
                            <p>Bobot: {row.bobot ?? '-'}</p>
                        </div>
                    </div>
                ))}
                {!semester.rows?.length && <EmptyState title="Belum ada nilai" description="Semester ini belum memiliki data nilai." />}
            </div>
        </article>
    );
}

export default function Page({ auth, mahasiswa, ringkasan, semesterRecords = [], pesan }) {
    const { menu } = usePage().props;
    const [openSemester, setOpenSemester] = useState(semesterRecords[0]?.id || null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const filteredSemesters = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return (semesterRecords || []).filter((semester) => {
            const matchesStatus =
                statusFilter === 'all'
                || (statusFilter === 'final' && semester.sudah_final === (semester.rows?.length || 0))
                || (statusFilter === 'partial' && semester.sudah_final > 0 && semester.sudah_final < (semester.rows?.length || 0))
                || (statusFilter === 'empty' && semester.sudah_final === 0);

            if (!matchesStatus) return false;
            if (!keyword) return true;

            const inSemester = `${semester.tahun_akademik} ${semester.semester_akademik}`.toLowerCase().includes(keyword);
            const inRows = (semester.rows || []).some((row) =>
                [row.kode, row.nama, row.dosen].filter(Boolean).join(' ').toLowerCase().includes(keyword),
            );

            return inSemester || inRows;
        });
    }, [semesterRecords, search, statusFilter]);

    const printPage = () => window.print();

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Mahasiswa - KHS" />

            <div className="space-y-4">
                <section className="panel p-4 print:border-none print:shadow-none">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-900">Kartu Hasil Studi</p>
                            <p className="text-xs text-slate-600">Rekap nilai final dari KRS yang telah dipublish</p>
                        </div>
                        <div className="flex gap-2">
                            <a href={route('mahasiswa.khs.pdf')} className="btn-outline print:hidden">
                                Download PDF
                            </a>
                            <a href={route('mahasiswa.transkrip')} className="btn-outline print:hidden">
                                Transkrip
                            </a>
                            <button type="button" onClick={printPage} className="btn-outline print:hidden">
                                Print
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-4 text-white shadow-lg">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-200">Mahasiswa</p>
                            <p className="mt-2 text-lg font-extrabold">{mahasiswa?.nama || '-'}</p>
                            <p className="text-xs text-slate-300">{mahasiswa?.nim || '-'} | {mahasiswa?.prodi || '-'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">IPK</p>
                            <p className="mt-2 text-2xl font-extrabold text-slate-900">{ringkasan?.ipk ?? '-'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Total SKS Lulus</p>
                            <p className="mt-2 text-2xl font-extrabold text-slate-900">{ringkasan?.total_sks_lulus ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Semester Aktif</p>
                            <p className="mt-2 text-2xl font-extrabold text-slate-900">{ringkasan?.total_semester ?? 0}</p>
                        </div>
                    </div>

                    {ringkasan?.semester_terakhir && (
                        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                            Semester terakhir: <span className="font-bold">{ringkasan.semester_terakhir.label}</span> dengan IPS <span className="font-bold">{ringkasan.semester_terakhir.ips ?? '-'}</span> dan {ringkasan.semester_terakhir.sks ?? 0} SKS.
                        </div>
                    )}

                    {pesan && <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{pesan}</div>}
                </section>

                <section className="space-y-3">
                    <div className="panel p-4">
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px]">
                            <input
                                className="form-input"
                                placeholder="Cari semester, kode, mata kuliah, dosen"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">Semua status</option>
                                <option value="final">Semua final</option>
                                <option value="partial">Sebagian final</option>
                                <option value="empty">Belum final</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 md:hidden">
                        {filteredSemesters.map((semester) => (
                            <SemesterCard key={semester.id} semester={semester} />
                        ))}
                        {!filteredSemesters.length && <EmptyState title="Tidak ada data KHS" description="Tidak ada data KHS yang cocok dengan filter." />}
                    </div>

                    <div className="hidden space-y-3 md:block">
                        {filteredSemesters.map((semester) => {
                        const isOpen = openSemester === semester.id;

                        return (
                            <article key={semester.id} className="panel overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setOpenSemester(isOpen ? null : semester.id)}
                                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{semester.tahun_akademik}</p>
                                        <p className="text-xs text-slate-600">
                                            Semester {semester.semester_akademik} | IPS {semester.ips ?? '-'} | {semester.semester_sks ?? 0} SKS
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusBadge(semester.sudah_final === (semester.rows?.length || 0) ? 'final' : semester.sudah_final > 0 ? 'sementara' : 'belum')}`}>
                                            {semester.sudah_final === (semester.rows?.length || 0) ? 'Final' : semester.sudah_final > 0 ? 'Sebagian Final' : 'Belum Final'}
                                        </span>
                                        <span className="text-slate-400">{isOpen ? '-' : '+'}</span>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="border-t border-slate-200 px-4 py-4">
                                        <div className="grid gap-2 text-xs sm:grid-cols-3">
                                            <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                <p className="text-slate-500">Nilai Final</p>
                                                <p className="mt-1 font-bold text-slate-900">{semester.sudah_final || 0}</p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                <p className="text-slate-500">Nilai Sementara</p>
                                                <p className="mt-1 font-bold text-slate-900">{semester.sementara || 0}</p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                <p className="text-slate-500">Belum Input</p>
                                                <p className="mt-1 font-bold text-slate-900">{semester.belum_input || 0}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-slate-500">
                                                        <th className="px-2 py-2">Kode</th>
                                                        <th className="px-2 py-2">Mata Kuliah</th>
                                                        <th className="px-2 py-2">SKS</th>
                                                        <th className="px-2 py-2">Dosen</th>
                                                        <th className="px-2 py-2">Nilai</th>
                                                        <th className="px-2 py-2">Bobot</th>
                                                        <th className="px-2 py-2">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {semester.rows?.map((row) => (
                                                        <tr key={row.id} className="border-b border-slate-100">
                                                            <td className="px-2 py-2 font-semibold text-slate-700">{row.kode || '-'}</td>
                                                            <td className="px-2 py-2 text-slate-700">{row.nama || '-'}</td>
                                                            <td className="px-2 py-2 text-slate-600">{row.sks || 0}</td>
                                                            <td className="px-2 py-2 text-slate-600">{row.dosen || '-'}</td>
                                                            <td className="px-2 py-2 text-slate-700">{row.nilai_huruf || '-'}</td>
                                                            <td className="px-2 py-2 text-slate-700">{row.bobot ?? '-'}</td>
                                                            <td className="px-2 py-2">
                                                                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusBadge(row.status_nilai)}`}>
                                                                    {row.status_nilai === 'final' ? 'Final' : row.status_nilai === 'sementara' ? 'Sementara' : 'Belum Input'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                        })}

                        {!filteredSemesters.length && (
                            <div className="panel px-4 py-10 text-center text-sm text-slate-500">
                                Tidak ada data KHS yang cocok dengan filter.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, usePage } from '@inertiajs/react';
import EmptyState from '../Akademik/EmptyState';

function statusBadge(status) {
    if (status === 'final') return 'bg-emerald-100 text-emerald-700';
    if (status === 'sementara') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-500';
}

function StatusLabel({ nilai }) {
    if (!nilai) {
        return <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">Belum Input</span>;
    }

    if (nilai.published_at) {
        return <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Final</span>;
    }

    return <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">Sementara</span>;
}

function KrsCard({ detail, index }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">#{index + 1}</p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{detail.kelas?.mata_kuliah?.nama || '-'}</h4>
                    <p className="text-xs text-slate-500">{detail.kelas?.mata_kuliah?.kode || '-'}</p>
                </div>
                <StatusLabel nilai={detail.nilai} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                    <dt className="text-slate-400">SKS</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{detail.sks}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Dosen</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{detail.kelas?.dosen?.nama || '-'}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Ruang</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{detail.kelas?.ruangan_ref?.nama || detail.kelas?.ruangan || '-'}</dd>
                </div>
                <div>
                    <dt className="text-slate-400">Nilai</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{detail.nilai?.nilai_huruf || '-'}</dd>
                </div>
            </dl>

            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Bobot: {detail.nilai?.bobot ?? '-'}
            </div>
        </article>
    );
}

export default function Page({ auth, krs, verifyUrl, docHash, qrSvg, academicSummary }) {
    const { menu } = usePage().props;

    const printPage = () => window.print();

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">Detail KRS Mahasiswa</h2>}>
            <Head title="Detail KRS" />

            <ModuleHero
                eyebrow="Dokumen Akademik"
                title="Detail KRS Mahasiswa"
                description="Dokumen ini menampilkan susunan mata kuliah, status nilai, dan data verifikasi KRS."
                note={`${krs.mahasiswa?.nim || '-'} - ${krs.mahasiswa?.nama || '-'} | ${krs.tahun_akademik} / Semester ${krs.semester_akademik}`}
            />

            <section className="panel p-4 print:border-none print:shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-bold text-slate-900">Kartu Rencana Studi</p>
                        <p className="text-xs text-slate-600">{krs.tahun_akademik} • Semester {krs.semester_akademik}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a href={route('krs.pdf', krs.id)} className="btn-outline print:hidden">Download PDF</a>
                        <a href={route('krs.print', krs.id)} target="_blank" rel="noreferrer" className="btn-outline print:hidden">Print Preview</a>
                        <button type="button" onClick={printPage} className="btn-primary print:hidden">Print</button>
                    </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                    <p><span className="font-semibold">NIM:</span> {krs.mahasiswa?.nim}</p>
                    <p><span className="font-semibold">Nama:</span> {krs.mahasiswa?.nama}</p>
                    <p><span className="font-semibold">Prodi:</span> {krs.mahasiswa?.prodi?.nama || '-'}</p>
                    <p><span className="font-semibold">Status:</span> {krs.status}</p>
                </div>

                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] text-slate-500">SKS Ternilai Semester</p>
                        <p className="text-sm font-bold text-slate-800">{academicSummary?.semester_sks_ternilai ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] text-slate-500">IPS Sementara</p>
                        <p className="text-sm font-bold text-slate-800">{academicSummary?.ips_sementara ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] text-slate-500">SKS Kumulatif Lulus</p>
                        <p className="text-sm font-bold text-slate-800">{academicSummary?.total_sks_lulus ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] text-slate-500">IPK Sementara</p>
                        <p className="text-sm font-bold text-slate-800">{academicSummary?.ipk_sementara ?? '-'}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Nilai Final: {academicSummary?.nilai_final_count ?? 0}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Nilai Sementara: {academicSummary?.nilai_sementara_count ?? 0}</span>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                    {krs.details?.length ? (
                        krs.details.map((detail, idx) => <KrsCard key={detail.id} detail={detail} index={idx} />)
                    ) : (
                        <EmptyState title="Tidak ada detail KRS" description="KRS ini belum memiliki mata kuliah." />
                    )}
                </div>

                <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                    <table className="min-w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-50">
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-2 py-2">No</th>
                                <th className="px-2 py-2">Kode</th>
                                <th className="px-2 py-2">Mata Kuliah</th>
                                <th className="px-2 py-2">SKS</th>
                                <th className="px-2 py-2">Dosen</th>
                                <th className="px-2 py-2">Ruang</th>
                                <th className="px-2 py-2">Status Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {krs.details?.map((d, idx) => (
                                <tr key={d.id} className="border-b border-slate-100">
                                    <td className="px-2 py-2">{idx + 1}</td>
                                    <td className="px-2 py-2 font-semibold text-slate-700">{d.kelas?.mata_kuliah?.kode || '-'}</td>
                                    <td className="px-2 py-2 text-slate-700">{d.kelas?.mata_kuliah?.nama || '-'}</td>
                                    <td className="px-2 py-2 text-slate-700">{d.sks}</td>
                                    <td className="px-2 py-2 text-slate-600">{d.kelas?.dosen?.nama || '-'}</td>
                                    <td className="px-2 py-2 text-slate-600">{d.kelas?.ruangan_ref?.nama || d.kelas?.ruangan || '-'}</td>
                                    <td className="px-2 py-2">
                                        <StatusLabel nilai={d.nilai} />
                                    </td>
                                </tr>
                            ))}
                            {!krs.details?.length && <tr><td className="px-2 py-3 text-slate-500" colSpan="7">Tidak ada detail KRS.</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="px-2 py-2 font-bold text-slate-900" colSpan="3">Total SKS</td>
                                <td className="px-2 py-2 font-bold text-slate-900">{krs.total_sks}</td>
                                <td className="px-2 py-2" colSpan="3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-600">
                    <p className="font-bold text-slate-900">Audit</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <p>Approved by: {krs.approved_by_user?.name || '-'} ({krs.approved_at || '-'})</p>
                        <p>Rejected by: {krs.rejected_by_user?.name || '-'} ({krs.rejected_at || '-'})</p>
                        <p className="sm:col-span-2">Link verifikasi: {verifyUrl || '-'}</p>
                        <p className="sm:col-span-2 break-all">Document hash: {docHash || '-'}</p>
                    </div>
                    {qrSvg && (
                        <div className="mt-3 w-[120px] rounded bg-white p-1" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                    )}
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

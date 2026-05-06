import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const currency = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const badge = {
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    pending: 'bg-amber-100 text-amber-700',
    partial: 'bg-sky-100 text-sky-700',
    paid: 'bg-emerald-100 text-emerald-700',
};

export default function Page({ auth, tahunAktif = null, stats = null, recentKrs = [], recentTagihan = [] }) {
    const { menu } = usePage().props;

    const cards = [
        { label: 'Mahasiswa', value: stats?.mahasiswa ?? 0, tone: 'text-slate-900' },
        { label: 'Dosen', value: stats?.dosen ?? 0, tone: 'text-sky-700' },
        { label: 'KRS Pending', value: stats?.krs_pending ?? 0, tone: 'text-amber-700' },
        { label: 'KRS Approved', value: stats?.krs_approved ?? 0, tone: 'text-emerald-700' },
        { label: 'Tagihan Pending', value: stats?.tagihan_pending ?? 0, tone: 'text-amber-700' },
        { label: 'Tagihan Paid', value: stats?.tagihan_paid ?? 0, tone: 'text-emerald-700' },
    ];

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-bold text-slate-900">Laporan Sistem</h2>}>
            <Head title="Laporan Sistem" />

            <div className="space-y-5">
                <section className="panel overflow-hidden p-0">
                    <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
                        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_52%),linear-gradient(135deg,_#fffbeb,_#f8fafc)] px-5 py-5 sm:px-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Snapshot Operasional</p>
                            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Ringkasan Akademik dan Keuangan</h3>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                Laporan singkat untuk memantau volume data inti kampus, status KRS, PMB, serta posisi tagihan berjalan.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                                <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">
                                    Tahun Aktif: {tahunAktif ? `${tahunAktif.kode} / Smt ${tahunAktif.semester_aktif}` : '-'}
                                </span>
                                <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">
                                    PMB Verified: {stats?.pmb_verified ?? 0} / {stats?.pmb_total ?? 0}
                                </span>
                            </div>
                            <div className="mt-5">
                                <Link href={route('laporan.export.pdf')} className="btn-primary">
                                    Export PDF Laporan
                                </Link>
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <article className="rounded-2xl border border-amber-100 bg-white/80 px-4 py-4 shadow-sm shadow-amber-100/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nominal Pending</p>
                                    <p className="mt-2 text-2xl font-black text-amber-700">{currency(stats?.nominal_pending ?? 0)}</p>
                                </article>
                                <article className="rounded-2xl border border-amber-100 bg-white/80 px-4 py-4 shadow-sm shadow-amber-100/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nominal Paid</p>
                                    <p className="mt-2 text-2xl font-black text-emerald-700">{currency(stats?.nominal_paid ?? 0)}</p>
                                </article>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white px-5 py-5 sm:px-6 lg:border-l lg:border-t-0">
                            {cards.map((item) => (
                                <article key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                                    <p className={`mt-2 text-2xl font-black ${item.tone}`}>{item.value}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-2">
                    <section className="panel p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">KRS Terbaru</h3>
                                <p className="mt-1 text-xs text-slate-500">Antrian persetujuan dan aktivitas KRS terbaru.</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{recentKrs.length} record</span>
                        </div>
                        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                        <th className="px-3 py-2 font-semibold">Mahasiswa</th>
                                        <th className="px-3 py-2 font-semibold">Periode</th>
                                        <th className="px-3 py-2 font-semibold">SKS</th>
                                        <th className="px-3 py-2 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentKrs.map((item) => (
                                        <tr key={item.id} className="border-t border-slate-100">
                                            <td className="px-3 py-3 text-slate-700">
                                                <div className="font-medium">{item.mahasiswa || '-'}</div>
                                                <div className="text-xs text-slate-400">{item.nim || '-'}</div>
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">{item.tahun_akademik} / Smt {item.semester_akademik}</td>
                                            <td className="px-3 py-3 text-slate-600">{item.total_sks}</td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[item.status] || 'bg-slate-100 text-slate-700'}`}>{item.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="panel p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Tagihan Terbaru</h3>
                                <p className="mt-1 text-xs text-slate-500">Invoice terbaru untuk memantau arus tagihan aktif.</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{recentTagihan.length} record</span>
                        </div>
                        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                        <th className="px-3 py-2 font-semibold">Invoice</th>
                                        <th className="px-3 py-2 font-semibold">Mahasiswa</th>
                                        <th className="px-3 py-2 font-semibold">Jenis</th>
                                        <th className="px-3 py-2 font-semibold">Total</th>
                                        <th className="px-3 py-2 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTagihan.map((item) => (
                                        <tr key={item.id} className="border-t border-slate-100">
                                            <td className="px-3 py-3 font-medium text-slate-700">{item.kode_tagihan}</td>
                                            <td className="px-3 py-3 text-slate-700">
                                                <div>{item.mahasiswa || '-'}</div>
                                                <div className="text-xs text-slate-400">{item.nim || '-'}</div>
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">{item.jenis}</td>
                                            <td className="px-3 py-3 text-slate-600">{currency(item.total)}</td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[item.status] || 'bg-slate-100 text-slate-700'}`}>{item.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

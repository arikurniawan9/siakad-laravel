import { Link } from '@inertiajs/react';
import PageShell from './PageShell';

const cards = [
    { label: 'Tahun Akademik', route: 'akademik.tahun.index', color: 'bg-gradient-to-br from-slate-700 to-slate-500' },
    { label: 'Jurusan', route: 'akademik.jurusan.index', color: 'bg-gradient-to-br from-sky-600 to-cyan-500' },
    { label: 'Prodi', route: 'akademik.prodi.index', color: 'bg-gradient-to-br from-emerald-600 to-lime-500' },
    { label: 'Ruangan', route: 'akademik.ruangan.index', color: 'bg-gradient-to-br from-rose-600 to-pink-500' },
    { label: 'Kurikulum', route: 'akademik.kurikulum.index', color: 'bg-gradient-to-br from-amber-600 to-orange-500' },
    { label: 'Mata Kuliah', route: 'akademik.matakuliah.index', color: 'bg-gradient-to-br from-violet-600 to-fuchsia-500' },
    { label: 'Kelas', route: 'akademik.kelas.index', color: 'bg-gradient-to-br from-indigo-600 to-sky-500' },
];

export default function Page({ auth, tabs = [], summary = {} }) {
    const metrics = [
        { label: 'Tahun Akademik', value: summary.tahun_akademik ?? 0 },
        { label: 'Jurusan', value: summary.jurusan ?? 0 },
        { label: 'Prodi', value: summary.prodi ?? 0 },
        { label: 'Ruangan', value: summary.ruangan ?? 0 },
        { label: 'Kurikulum', value: summary.kurikulum ?? 0 },
        { label: 'Mata Kuliah', value: summary.mata_kuliah ?? 0 },
        { label: 'Kelas', value: summary.kelas ?? 0 },
    ];

    return (
        <PageShell auth={auth} title="Akademik Management Hub" tabs={tabs}>
            <div className="panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Ringkasan Modul</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                    <Link
                        key={card.route}
                        href={route(card.route)}
                        className={`group relative overflow-hidden rounded-3xl border border-white/10 p-5 text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 ${card.color}`}
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
                        <div className="relative">
                            <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/80">Buka Menu</p>
                            <h3 className="mt-3 text-xl font-black">{card.label}</h3>
                            <p className="mt-2 text-sm text-white/80">Kelola data {card.label.toLowerCase()} secara terpisah.</p>
                        </div>
                    </Link>
                ))}
            </div>
        </PageShell>
    );
}

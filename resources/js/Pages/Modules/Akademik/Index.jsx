import { Link } from '@inertiajs/react';
import PageShell from './PageShell';

const cards = [
    { label: 'Tahun Akademik', route: 'akademik.tahun.index', metricKey: 'tahun_akademik', icon: 'calendar', color: 'bg-gradient-to-br from-slate-700 to-slate-500' },
    { label: 'Jurusan', route: 'akademik.jurusan.index', metricKey: 'jurusan', icon: 'academic', color: 'bg-gradient-to-br from-sky-600 to-cyan-500' },
    { label: 'Prodi', route: 'akademik.prodi.index', metricKey: 'prodi', icon: 'layers', color: 'bg-gradient-to-br from-emerald-600 to-lime-500' },
    { label: 'Ruangan', route: 'akademik.ruangan.index', metricKey: 'ruangan', icon: 'building', color: 'bg-gradient-to-br from-rose-600 to-pink-500' },
    { label: 'Kurikulum', route: 'akademik.kurikulum.index', metricKey: 'kurikulum', icon: 'book', color: 'bg-gradient-to-br from-amber-600 to-orange-500' },
    { label: 'Mata Kuliah', route: 'akademik.matakuliah.index', metricKey: 'mata_kuliah', icon: 'document', color: 'bg-gradient-to-br from-violet-600 to-fuchsia-500' },
    { label: 'Kelas', route: 'akademik.kelas.index', metricKey: 'kelas', icon: 'users', color: 'bg-gradient-to-br from-indigo-600 to-sky-500' },
];

function CardIcon({ name, className = 'h-20 w-20' }) {
    const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.6 };

    switch (name) {
        case 'calendar':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2m8-2v2M4 7h16M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11h3M7.5 15h3M13.5 11h3M13.5 15h3" />
                </svg>
            );
        case 'academic':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 2 8l10 5 10-5-10-5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5V16c0 .9 2.7 3 6 3s6-2.1 6-3v-5.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 8v6" />
                </svg>
            );
        case 'layers':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 3 8l9 5 9-5-9-5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 5 9-5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l9 5 9-5" />
                </svg>
            );
        case 'building':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h3M8 11h3M8 15h3M15 21v-6h6v6" />
                </svg>
            );
        case 'book':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19a2 2 0 0 0 2 2h14" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h14v16H6a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8" />
                </svg>
            );
        case 'document':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h8M8 17h8M8 9h4" />
                </svg>
            );
        case 'users':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 20v-1a3 3 0 0 0-2.3-2.9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.7 3.1a4 4 0 0 1 0 7.8" />
                </svg>
            );
        default:
            return null;
    }
}

export default function Page({ auth, tabs = [], summary = {} }) {
    return (
        <PageShell auth={auth} title="Akademik Management Hub" tabs={tabs} heroVariant="corner" layoutHeader={false}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                    <Link
                        key={card.route}
                        href={route(card.route)}
                        className={`group relative overflow-hidden rounded-3xl border border-white/10 p-5 text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 ${card.color}`}
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
                        <div className="pointer-events-none absolute -bottom-6 -right-6 text-white/20 blur-[0.2px]">
                            <CardIcon name={card.icon} className="h-28 w-28" />
                        </div>
                        <div className="relative">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/80">Buka Menu</p>
                                    <h3 className="mt-3 text-xl font-black">{card.label}</h3>
                                </div>
                                <div className="rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur-[1px]">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">Total</p>
                                    <p className="mt-1 text-2xl font-black leading-none">{summary?.[card.metricKey] ?? 0}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-white/80">Kelola data {card.label.toLowerCase()} secara terpisah.</p>
                        </div>
                    </Link>
                ))}
            </div>
        </PageShell>
    );
}

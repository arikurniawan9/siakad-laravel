import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, usePage } from '@inertiajs/react';

const dayBadgeClasses = {
    Senin: 'bg-sky-100 text-sky-700',
    Selasa: 'bg-emerald-100 text-emerald-700',
    Rabu: 'bg-amber-100 text-amber-700',
    Kamis: 'bg-rose-100 text-rose-700',
    Jumat: 'bg-violet-100 text-violet-700',
    Sabtu: 'bg-cyan-100 text-cyan-700',
    Minggu: 'bg-slate-200 text-slate-700',
};

export default function Page({ auth, tahunAktif = null, dosen = null, summary = null, kelasList = [], agenda = [], pesan = null }) {
    const { menu } = usePage().props;

    const stats = [
        { label: 'Total Kelas', value: summary?.total_kelas ?? 0, tone: 'text-sky-700' },
        { label: 'Beban SKS', value: summary?.total_sks ?? 0, tone: 'text-emerald-700' },
        { label: 'Sesi Mingguan', value: summary?.total_sesi ?? 0, tone: 'text-amber-700' },
        { label: 'Hari Aktif', value: summary?.hari_aktif ?? 0, tone: 'text-rose-700' },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            menu={menu}
            header={<h2 className="text-xl font-bold text-slate-900">Jadwal Mengajar</h2>}
        >
            <Head title="Jadwal Mengajar" />

            <ModuleHero
                eyebrow="Dosen"
                title="Jadwal Mengajar"
                description="Agenda mengajar, daftar kelas, dan ringkasan beban dosen dalam satu tampilan."
                note={`Total kelas: ${summary?.total_kelas ?? 0} | Total sesi: ${summary?.total_sesi ?? 0}`}
            />

            <div className="space-y-5">
                <section className="panel overflow-hidden p-0">
                    <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
                        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_55%),linear-gradient(135deg,_#f8fafc,_#eef6ff)] px-5 py-5 sm:px-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Aktivitas Dosen</p>
                            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                                {dosen?.nama || auth.user.name}
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                                <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">NIDN: {dosen?.nidn || '-'}</span>
                                <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">
                                    Tahun Aktif: {tahunAktif ? `${tahunAktif.kode} / Smt ${tahunAktif.semester_aktif}` : '-'}
                                </span>
                            </div>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                                Agenda mengajar dihimpun dari kelas aktif yang sudah terhubung ke mata kuliah, ruang, dan sesi jadwal.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white px-5 py-5 sm:px-6 lg:border-l lg:border-t-0">
                            {stats.map((item) => (
                                <article key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                                    <p className={`mt-2 text-2xl font-black ${item.tone}`}>{item.value}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {pesan && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{pesan}</div>}

                <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="panel p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Agenda Mingguan</h3>
                                <p className="mt-1 text-xs text-slate-500">Urutan agenda berdasarkan hari dan jam mengajar.</p>
                            </div>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {agenda.length} sesi
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {agenda.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                                    Belum ada sesi jadwal untuk dosen ini.
                                </div>
                            )}

                            {agenda.map((item) => (
                                <article key={`${item.kelas_id}-${item.hari_ke}-${item.jam_mulai}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-100">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${dayBadgeClasses[item.hari_label] || 'bg-slate-100 text-slate-700'}`}>
                                                    {item.hari_label}
                                                </span>
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                    {item.kode_kelas}
                                                </span>
                                            </div>
                                            <h4 className="mt-3 text-base font-bold text-slate-900">{item.mata_kuliah}</h4>
                                            <p className="mt-1 text-xs text-slate-500">{item.kode_mk} | {item.sks} SKS</p>
                                        </div>

                                        <div className="text-right text-sm text-slate-600">
                                            <p className="font-bold text-slate-900">{item.jam_mulai} - {item.jam_selesai}</p>
                                            <p className="mt-1">{item.ruangan || 'Ruang belum diatur'}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{item.mode}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div className="panel p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Daftar Kelas</h3>
                                    <p className="mt-1 text-xs text-slate-500">Ringkasan kelas yang menjadi tanggung jawab pengajar.</p>
                                </div>
                                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {kelasList.length} kelas
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {kelasList.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                                        Belum ada kelas aktif yang terhubung ke dosen ini.
                                    </div>
                                )}

                                {kelasList.map((kelas) => (
                                    <article key={kelas.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{kelas.kode_kelas}</p>
                                                <h4 className="mt-2 text-sm font-bold text-slate-900">{kelas.mata_kuliah?.nama || '-'}</h4>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {kelas.mata_kuliah?.kode || '-'} | {kelas.mata_kuliah?.sks || 0} SKS | Semester {kelas.semester_akademik}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                                                {kelas.jadwal?.length || 0} sesi
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-2">
                                            {(kelas.jadwal || []).map((slot) => (
                                                <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100">
                                                    <span>{slot.hari_label}</span>
                                                    <span>{slot.jam_mulai} - {slot.jam_selesai}</span>
                                                    <span>{slot.ruangan || kelas.ruangan || '-'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

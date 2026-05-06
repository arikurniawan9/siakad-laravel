import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function formatDateTime(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function maxValue(series = []) {
    const highest = Math.max(...series, 0);
    return highest > 0 ? highest : 1;
}

export default function Dashboard({ auth, stats: backendStats = null, superAdminPanel = null }) {
    const { menu } = usePage().props;
    const roleNames = Array.isArray(auth?.roles) ? auth.roles : [];
    const trend = superAdminPanel?.trend ?? { labels: [], pmb_daily: [], user_daily: [], maintenance_daily: [] };
    const trendMax = maxValue([
        ...(trend.pmb_daily || []),
        ...(trend.user_daily || []),
        ...(trend.maintenance_daily || []),
    ]);

    const stats = [
        { label: 'Mahasiswa Aktif', value: (backendStats?.mahasiswa_aktif ?? 0).toLocaleString('id-ID'), tone: 'from-cyan-500 to-sky-600' },
        { label: 'Tagihan Berjalan', value: formatRupiah(backendStats?.tagihan_berjalan ?? 0), tone: 'from-amber-500 to-orange-600' },
        { label: 'Pengajuan PMB', value: (backendStats?.pengajuan_pmb ?? 0).toLocaleString('id-ID'), tone: 'from-emerald-500 to-teal-600' },
        { label: 'Notifikasi Baru', value: (backendStats?.notifikasi_baru ?? 0).toLocaleString('id-ID'), tone: 'from-violet-500 to-indigo-600' },
    ];

    const quickMenus = (Array.isArray(menu) ? menu : [])
        .filter((group) => Array.isArray(group?.items) && group.items.length > 0)
        .slice(0, 4)
        .map((group) => ({
            title: group.group || 'Menu',
            value: group.items.slice(0, 3).map((item) => item.label).join(', '),
        }));

    const isSuperAdmin = roleNames.includes('super-admin');
    const isMahasiswa = roleNames.includes('mahasiswa');
    const currentHour = new Date().getHours();

    let greeting = 'Selamat malam';
    if (currentHour >= 5 && currentHour < 11) greeting = 'Selamat pagi';
    else if (currentHour >= 11 && currentHour < 15) greeting = 'Selamat siang';
    else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat sore';

    const motivationText = isMahasiswa
        ? 'Terus konsisten belajar, setiap langkah kecil hari ini membangun masa depanmu.'
        : 'Kerja cerdas, kerja tuntas, dan jaga dampak terbaik untuk kemajuan kampus hari ini.';

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={null}>
            <Head title="Dashboard" />

            <section className="panel p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role aktif</p>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </span>
                        {isSuperAdmin ? 'Superadmin Online' : 'Online'}
                    </span>
                </div>
                <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">{greeting}, {auth?.user?.name || 'Pengguna'}</h1>
                <p className="mt-2 text-sm italic text-slate-600">{motivationText}</p>
            </section>

            <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                    <article key={item.label} className="panel-soft p-4">
                        <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${item.tone}`} />
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">{item.value}</p>
                    </article>
                ))}
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-3">
                <article className="panel p-4 xl:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900">Grafik Operasional 7 Hari</h2>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Realtime snapshot</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1">
                            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                            PMB Masuk
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            User Baru
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                            Maintenance
                        </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-slate-500 sm:grid-cols-4 xl:grid-cols-7">
                        {trend.labels.map((label, i) => (
                            <div key={label} className="rounded-xl bg-slate-100 p-2">
                                <div className="mx-auto flex h-32 items-end justify-center gap-1 rounded-lg bg-white px-2">
                                    <div className="w-3 rounded-t-md bg-cyan-500" style={{ height: `${((trend.pmb_daily?.[i] || 0) / trendMax) * 100}%` }} title={`PMB ${trend.pmb_daily?.[i] || 0}`} />
                                    <div className="w-3 rounded-t-md bg-emerald-500" style={{ height: `${((trend.user_daily?.[i] || 0) / trendMax) * 100}%` }} title={`User ${trend.user_daily?.[i] || 0}`} />
                                    <div className="w-3 rounded-t-md bg-amber-500" style={{ height: `${((trend.maintenance_daily?.[i] || 0) / trendMax) * 100}%` }} title={`Maintenance ${trend.maintenance_daily?.[i] || 0}`} />
                                </div>
                                <div className="mt-2 space-y-1">
                                    <p>{label}</p>
                                    <p className="text-[10px] text-slate-400">
                                        {trend.pmb_daily?.[i] || 0} / {trend.user_daily?.[i] || 0} / {trend.maintenance_daily?.[i] || 0}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                        Format angka per hari: PMB / User / Maintenance
                    </div>
                </article>

                <article className="panel p-4">
                    <h2 className="text-base font-bold text-slate-900">Pengumuman</h2>
                    <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm italic text-slate-500">Belum ada pengumuman hari ini.</div>
                </article>
            </section>

            <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {quickMenus.map((item) => (
                    <article key={item.title} className="panel p-4">
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{item.value}</p>
                    </article>
                ))}
            </section>

            {isSuperAdmin && superAdminPanel && (
                <section className="mt-4 grid gap-4 xl:grid-cols-3">
                    <article className="panel p-4">
                        <h2 className="text-base font-bold text-slate-900">Security Snapshot</h2>
                        <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-slate-600">Captcha gagal hari ini</span>
                                <span className="font-bold text-rose-700">{superAdminPanel.snapshot.login_failed_today}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-slate-600">Captcha lock hari ini</span>
                                <span className="font-bold text-amber-700">{superAdminPanel.snapshot.captcha_locked_today}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-slate-600">Backup tersedia</span>
                                <span className="font-bold text-emerald-700">{superAdminPanel.snapshot.backup_total}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-slate-600">Backup terakhir</span>
                                <span className="text-xs font-bold text-slate-800">{formatDateTime(superAdminPanel.snapshot.backup_last_at)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-slate-600">User nonaktif</span>
                                <span className="font-bold text-slate-800">{superAdminPanel.snapshot.inactive_user_total}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-slate-600">Staf internal</span>
                                <span className="font-bold text-sky-700">{superAdminPanel.snapshot.staff_user_total}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-slate-600">Maintenance gagal hari ini</span>
                                <span className="font-bold text-rose-700">{superAdminPanel.snapshot.maintenance_failed_today}</span>
                            </div>
                        </div>
                    </article>

                    <article className="panel p-4">
                        <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
                        <div className="mt-3 grid gap-2">
                            <Link href={route('settings.user-access.index')} className="btn-primary">Kelola User & Akses</Link>
                            <Link href={route('settings.database.index')} className="btn-outline">Backup / Restore DB</Link>
                            <Link href={route('settings.index')} className="btn-outline">Buka Pengaturan</Link>
                            <Link href={route('notifications.index')} className="btn-outline">Pusat Notifikasi</Link>
                            <Link href={route('laporan.index')} className="btn-outline">Laporan Sistem</Link>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Aksi berisiko tinggi tetap memerlukan konfirmasi di halaman tujuan.</p>
                    </article>

                    <article className="panel p-4">
                        <h2 className="text-base font-bold text-slate-900">Audit Trail</h2>
                        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                            {superAdminPanel.audit_trail.length ? superAdminPanel.audit_trail.map((item, idx) => (
                                <div key={`${item.source}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                                        <span className="text-[10px] uppercase text-slate-500">{item.source}</span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-600">{item.description}</p>
                                    <p className="mt-1 text-[10px] text-slate-500">{formatDateTime(item.at)}</p>
                                </div>
                            )) : (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                                    Belum ada aktivitas audit.
                                </div>
                            )}
                        </div>
                    </article>
                </section>
            )}
        </AuthenticatedLayout>
    );
}

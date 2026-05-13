import { useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

function StatCard({ label, value, tone = 'slate' }) {
    const palette = {
        slate: 'border-slate-200 bg-white text-slate-900',
        sky: 'border-sky-200 bg-sky-50 text-sky-900',
        amber: 'border-amber-200 bg-amber-50 text-amber-900',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    };

    return (
        <div className={`rounded-2xl border px-4 py-4 shadow-sm ${palette[tone] || palette.slate}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-70">{label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
        </div>
    );
}

function resolveActionRoute(notification) {
    if (notification?.data?.action_url) return notification.data.action_url;
    if (notification?.data?.action_route) return notification.data.action_route;

    const module = notification?.data?.module;
    const map = {
        krs: 'krs.index',
        pmb: 'pmb.index',
        finance: 'keuangan.index',
        academic: 'akademik.index',
        mahasiswa: 'mahasiswa.index',
    };

    return map[module] || null;
}

function resolveModuleLabel(notification) {
    if (notification?.data?.module_label) return notification.data.module_label;

    const module = notification?.data?.module;
    const map = {
        krs: 'KRS',
        pmb: 'PMB',
        finance: 'Keuangan',
        academic: 'Akademik',
        mahasiswa: 'Mahasiswa',
        dosen: 'Dosen',
    };

    return map[module] || module || 'General';
}

function hrefFor(action) {
    if (!action) return route('notifications.index');
    if (action.includes('://') || action.startsWith('/')) return action;
    return route(action);
}

export default function Page({ auth, inbox = { data: [] }, filters = { read: 'all', module: 'all', per_page: 10 }, summary = {}, modules = [] }) {
    const { menu, flash } = usePage().props;

    const filterForm = useForm({
        read: filters?.read || 'all',
        module: filters?.module || 'all',
        per_page: filters?.per_page || 10,
    });

    const markRead = (id) => {
        router.patch(route('notifications.read', id), {}, { preserveScroll: true, only: ['inbox', 'summary', 'notifications', 'flash'] });
    };

    const markAll = () => {
        router.patch(route('notifications.readAll'), {}, { preserveScroll: true, only: ['inbox', 'summary', 'notifications', 'flash'] });
    };

    const applyFilter = (next = {}) => {
        const payload = {
            read: next.read ?? filterForm.data.read,
            module: next.module ?? filterForm.data.module,
            per_page: next.per_page ?? filterForm.data.per_page,
        };
        filterForm.setData(payload);
        router.get(route('notifications.index'), payload, { preserveState: true, preserveScroll: true, replace: true });
    };

    useEffect(() => {
        const timer = setInterval(() => {
            router.reload({ only: ['inbox', 'summary', 'notifications'], preserveState: true, preserveScroll: true });
        }, 15000);
        return () => clearInterval(timer);
    }, []);

    const items = inbox?.data || [];
    const readValue = filterForm.data.read;
    const moduleValue = filterForm.data.module;
    const unreadCount = summary?.unread || 0;

    const moduleOptions = useMemo(() => {
        const active = modules?.length ? modules : [{ value: 'all', label: 'Semua Modul' }];
        return active.some((module) => module.value === 'all')
            ? active
            : [{ value: 'all', label: 'Semua Modul' }, ...active];
    }, [modules]);

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Inbox Notifikasi" />

            <div className="space-y-4">
                <ModuleHero
                    eyebrow="Sistem"
                    title="Inbox Notifikasi"
                    description="Pantau notifikasi sistem, tandai yang sudah dibaca, dan filter berdasarkan status maupun modul."
                    note={unreadCount > 0 ? `Masih ada ${unreadCount} notifikasi belum dibaca.` : 'Tidak ada notifikasi baru saat ini.'}
                />

                <section className="panel p-4">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Total Notifikasi" value={summary?.total ?? 0} tone="slate" />
                        <StatCard label="Belum Dibaca" value={summary?.unread ?? 0} tone="sky" />
                        <StatCard label="Sudah Dibaca" value={summary?.read ?? 0} tone="emerald" />
                        <StatCard label="Tampilan" value={`${inbox?.total ?? items.length} data`} tone="amber" />
                    </div>

                    <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-1 xl:flex-wrap">
                            <label className="block">
                                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Status</span>
                                <select className="form-input w-full xl:w-52" value={readValue} onChange={(e) => applyFilter({ read: e.target.value })}>
                                    <option value="all">Semua</option>
                                    <option value="unread">Belum dibaca</option>
                                    <option value="read">Sudah dibaca</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Modul</span>
                                <select className="form-input w-full xl:w-56" value={moduleValue} onChange={(e) => applyFilter({ module: e.target.value })}>
                                    {moduleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Data per halaman</span>
                                <select className="form-input w-full xl:w-44" value={filterForm.data.per_page} onChange={(e) => applyFilter({ per_page: Number(e.target.value) })}>
                                    <option value={10}>10 / halaman</option>
                                    <option value={30}>30 / halaman</option>
                                    <option value={50}>50 / halaman</option>
                                    <option value={100}>100 / halaman</option>
                                </select>
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button className="btn-outline" onClick={() => applyFilter({ read: 'all', module: 'all', per_page: 10 })}>
                                Reset Filter
                            </button>
                            <button className="btn-primary" onClick={markAll} disabled={unreadCount === 0}>
                                Tandai Semua Dibaca
                            </button>
                        </div>
                    </div>

                    {flash?.success && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{flash.success}</p>}
                    {flash?.error && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{flash.error}</p>}

                    <div className="mt-4 space-y-3">
                        {items.length > 0 ? items.map((n) => {
                            const isUnread = !n.read_at;
                            const actionRoute = resolveActionRoute(n);
                            const actionLabel = n.data?.action_label || 'Buka Modul';
                            const createdAt = n.created_at ? new Date(n.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

                            return (
                                <article key={n.id} className={`rounded-2xl border p-4 shadow-sm transition ${isUnread ? 'border-sky-200 bg-sky-50/80' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="min-w-0 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                                                    {resolveModuleLabel(n)}
                                                </span>
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${isUnread ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                    {isUnread ? 'Belum dibaca' : 'Sudah dibaca'}
                                                </span>
                                                {n.data?.status && (
                                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800">
                                                        {n.data.status}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-extrabold text-slate-900">{n.data?.title || 'Notifikasi'}</h3>
                                            <p className="text-sm leading-6 text-slate-600">{n.data?.message || '-'}</p>
                                            <p className="text-xs text-slate-500">{createdAt}</p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                                            {actionRoute && (
                                                <Link href={hrefFor(actionRoute)} className="btn-outline">
                                                    {actionLabel}
                                                </Link>
                                            )}
                                            {!isUnread ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
                                                    Terselesaikan
                                                </span>
                                            ) : (
                                                <button className="btn-primary" onClick={() => markRead(n.id)}>
                                                    Tandai Dibaca
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        }) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                                <p className="text-sm font-bold text-slate-900">Belum ada notifikasi</p>
                                <p className="mt-2 text-sm text-slate-500">Notifikasi baru akan muncul di sini saat sistem mengirim pembaruan.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>{`Halaman ${inbox?.current_page || 1} / ${inbox?.last_page || 1} | ${inbox?.total || items.length} data`}</p>
                        <div className="flex flex-wrap gap-2">
                            {inbox?.prev_page_url ? (
                                <Link href={inbox.prev_page_url} className="btn-outline">
                                    Sebelumnya
                                </Link>
                            ) : (
                                <button className="btn-outline" disabled>
                                    Sebelumnya
                                </button>
                            )}
                            {inbox?.next_page_url ? (
                                <Link href={inbox.next_page_url} className="btn-outline">
                                    Berikutnya
                                </Link>
                            ) : (
                                <button className="btn-outline" disabled>
                                    Berikutnya
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

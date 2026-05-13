import { useEffect, useMemo, useRef, useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import GlobalFlashToast from '@/Components/GlobalFlashToast';
import ThemeToggle from '@/Components/ThemeToggle';
import useTheme from '@/hooks/useTheme';
import { Link, router, usePage } from '@inertiajs/react';

const iconPalette = [
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
    'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300',
    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
];

function Icon({ name }) {
    const cls = 'h-4 w-4';
    const map = {
        dashboard: 'M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z',
        academic: 'M12 3 1 9l11 6 9-4.91V17h2V9L12 3zm0 13L5 12.18V16l7 4 7-4v-3.82L12 16z',
        classroom: 'M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-3 3-3-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
        course: 'M4 4h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V4zm14 4h2v10H8v2h12a2 2 0 0 0 2-2V8h-4z',
        schedule: 'M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2zm13 8H4v10h16V10z',
        users: 'M16 11c1.66 0 3-1.79 3-4s-1.34-4-3-4-3 1.79-3 4 1.34 4 3 4zM8 11c1.66 0 3-1.79 3-4S9.66 3 8 3 5 4.79 5 7s1.34 4 3 4z',
        student: 'M12 3 2 8l10 5 8-4v6h2V8L12 3zm-7 9v4l7 4 7-4v-4l-7 3-7-3z',
        lecturer: 'M12 2 2 7l10 5 10-5-10-5zm0 7L6 6l6-3 6 3-6 3zm-6 5h12v7H6v-7z',
        finance: 'M12 1 3 5v6c0 5.25 3.84 10.74 9 12 5.16-1.26 9-6.75 9-12V5l-9-4z',
        payment: 'M3 6h18v12H3V6zm2 2v2h14V8H5zm0 4v4h6v-4H5z',
        report: 'M3 3h18v2H3V3zm2 4h14v14H5V7z',
        bell: 'M12 2a7 7 0 0 0-7 7v4.59L3.29 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .71-1.7L19 13.59V9a7 7 0 0 0-7-7zm0 20a3 3 0 0 0 2.82-2h-5.64A3 3 0 0 0 12 22z',
        settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    };

    return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
            <path d={map[name] || map.dashboard} />
        </svg>
    );
}

function iconKey(route = '') {
    if (route.includes('notifications')) return 'bell';
    if (route.includes('dashboard')) return 'dashboard';
    if (route.includes('tahun-akademik') || route.includes('jurusan') || route.includes('prodi')) return 'academic';
    if (route.includes('ruangan') || route.includes('kelas')) return 'classroom';
    if (route.includes('mata-kuliah') || route.includes('kurikulum')) return 'course';
    if (route.includes('jadwal')) return 'schedule';
    if (route.includes('krs')) return 'schedule';
    if (route.includes('dosen')) return 'lecturer';
    if (route.includes('mahasiswa')) return 'student';
    if (route.includes('pmb')) return 'users';
    if (route.includes('finance-period-locks') || route.includes('finance-reconciliation')) return 'finance';
    if (route.includes('keuangan') || route.includes('payment') || route.includes('tagihan') || route.includes('transaksi')) return 'payment';
    if (route.includes('laporan')) return 'report';
    if (route.includes('settings')) return 'settings';
    return 'dashboard';
}

function resolveNotificationAction(notification) {
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

    return map[module] || 'notifications.index';
}

function resolveNotificationModuleLabel(notification) {
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

export default function Authenticated({ user, menu = [], header, children }) {
    const { notifications, flash, errors } = usePage().props;
    const firstValidationError = useMemo(() => {
        const values = Object.values(errors || {});
        if (!values.length) return null;
        const first = values[0];
        if (Array.isArray(first)) return first[0] || null;
        return typeof first === 'string' ? first : null;
    }, [errors]);
    const unreadCount = notifications?.unreadCount ?? 0;
    const latestUnread = notifications?.latestUnread ?? [];
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [floatingMenu, setFloatingMenu] = useState(null);
    const floatingRef = useRef(null);
    const { theme, toggleTheme, ready } = useTheme();

    useEffect(() => {
        const saved = localStorage.getItem('siakad_sidebar_collapsed');
        if (saved === '1') setCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('siakad_sidebar_collapsed', next ? '1' : '0');
            if (!next) setFloatingMenu(null);
            return next;
        });
    };

    const groupedMenu = useMemo(() => {
        return menu.map((group, gIdx) => ({
            ...group,
            key: `group-${gIdx}`,
            items: (group.items || []).map((item, idx) => ({
                ...item,
                badge: item.route === 'notifications.index' && unreadCount > 0 ? unreadCount : null,
                iconClass: item.route === 'dosen.relasi.index'
                    ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/25 dark:text-cyan-200'
                    : iconPalette[(idx + gIdx) % iconPalette.length],
                iconName: iconKey(item.route),
                accent: item.route === 'dosen.relasi.index',
            })),
        }));
    }, [menu, unreadCount]);

    const [openGroups, setOpenGroups] = useState({});

    useEffect(() => {
        const initial = {};
        groupedMenu.forEach((g) => {
            initial[g.key] = g.items.some((i) => route().current(i.route));
        });
        setOpenGroups(initial);
    }, [groupedMenu]);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (!floatingRef.current) return;
            if (!floatingRef.current.contains(event.target)) {
                setFloatingMenu(null);
            }
        };

        const onEscape = (event) => {
            if (event.key === 'Escape') setFloatingMenu(null);
        };

        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onEscape);

        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, []);

    useEffect(() => {
        if (user?.id && window.Echo) {
            window.Echo.private(`App.Models.User.${user.id}`)
                .notification((notification) => {
                    // Trigger Inertia reload to sync notification props
                    router.reload({
                        only: ['notifications'],
                        preserveState: true,
                        preserveScroll: true,
                    });
                });

            return () => {
                window.Echo.leave(`App.Models.User.${user.id}`);
            };
        }
    }, [user?.id]);

    const toggleGroup = (key) => {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const openFloatingMenu = (event, item) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setFloatingMenu({
            item,
            top: rect.top + rect.height / 2,
            left: rect.right + 12,
        });
    };

    return (
        <div className="classic-shell">
            <GlobalFlashToast
                success={flash?.success}
                error={flash?.error || firstValidationError}
                warning={flash?.warning}
                info={flash?.info}
                toastKey={flash?.key}
            />
            <div className="relative flex min-h-screen items-stretch">
                <aside className={`classic-sidebar hidden lg:flex self-stretch sticky top-0 h-dvh min-h-dvh shrink-0 ${collapsed ? 'w-[82px]' : 'w-[258px]'} transition-all duration-500 ease-out`}>
                    <div className="flex h-[84px] items-center gap-3 border-b border-slate-300/70 dark:border-white/10 px-4">
                        <img src="/logostai.png" alt="Logo STAI" className="h-10 w-10 object-contain" />
                        {!collapsed && (
                            <div className="leading-tight">
                                <p className="sidebar-brand">SIAKAD STAI</p>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-scroll">
                        <div className="flex flex-col p-2">
                                {groupedMenu.map((group) => (
                                    <div key={group.key} className="mb-1">
                                        {!collapsed && (
                                            <button
                                                onClick={() => toggleGroup(group.key)}
                                                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400 hover:bg-slate-300/40 dark:hover:bg-white/5"
                                            >
                                                <span>{group.group}</span>
                                                <span className={`transition-transform duration-300 ${openGroups[group.key] ? 'rotate-90' : ''}`}>{'>'}</span>
                                            </button>
                                        )}

                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed || openGroups[group.key] ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="space-y-1">
                                                {group.items.map((item) => {
                                                    const active = route().current(item.route);

                                                    if (collapsed) {
                                                        return (
                                                            <button
                                                                key={item.route}
                                                                type="button"
                                                                onClick={(event) => openFloatingMenu(event, item)}
                                                                className={`classic-menu-item w-full ${active ? 'active' : ''}`}
                                                                title={item.label}
                                                            >
                                                                <span className="flex items-center gap-3 overflow-hidden">
                                                                    <span className={`menu-icon ${item.iconClass}`}>
                                                                        <Icon name={item.iconName} />
                                                                    </span>
                                                                </span>
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <Link
                                                            key={item.route}
                                                            href={route(item.route)}
                                                            className={`classic-menu-item ${item.accent ? 'ring-1 ring-cyan-400/20' : ''} ${active ? 'active' : ''}`}
                                                            title={item.label}
                                                        >
                                                            <span className="flex items-center gap-3 overflow-hidden">
                                                                <span className={`menu-icon ${item.iconClass}`}>
                                                                    <Icon name={item.iconName} />
                                                                </span>
                                                                <span className="truncate">{item.label}</span>
                                                            </span>
                                                            <span className="flex items-center gap-2">
                                                                {item.accent ? (
                                                                    <span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-100">
                                                                        RELASI
                                                                    </span>
                                                                ) : item.badge ? (
                                                                    <span className="classic-badge">{item.badge}</span>
                                                                ) : null}
                                                                <span className="text-slate-500 dark:text-slate-400">{'>'}</span>
                                                            </span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-300/60 bg-gradient-to-t from-sky-100/60 to-transparent dark:border-white/10 dark:from-slate-950/25 p-2 pt-3">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="sidebar-logout-button"
                            title="Log Out"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                <path d="M10 3a1 1 0 0 1 1 1v2H7v12h4v2a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5zm7.59 5.59L21 12l-3.41 3.41-1.42-1.42L17.76 12h-8.5v-2h8.5l-1.59-1.99 1.42-1.42z" />
                            </svg>
                            {!collapsed && <span>Logout</span>}
                        </Link>
                    </div>
                </aside>

                <button
                    onClick={toggleCollapse}
                    className={`absolute top-[94px] z-30 hidden h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-slate-500/40 bg-[#1d2437] text-slate-200 shadow-lg shadow-slate-900/30 transition-all duration-500 hover:bg-[#212b41] lg:inline-flex ${collapsed ? 'left-[82px]' : 'left-[258px]'}`}
                    title="Toggle sidebar"
                >
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
                        <path d={collapsed ? 'M7 4l6 6-6 6' : 'M13 4l-6 6 6 6'} />
                    </svg>
                </button>

                {collapsed && floatingMenu && (
                    <div
                        ref={floatingRef}
                        className="floating-menu-panel hidden lg:block"
                        style={{ top: `${floatingMenu.top}px`, left: `${floatingMenu.left}px`, transform: 'translateY(-50%)' }}
                    >
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Menu</p>
                        <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{floatingMenu.item.label}</p>
                        <div className="mt-3">
                            <Link href={route(floatingMenu.item.route)} className="btn-primary w-full text-[11px]" onClick={() => setFloatingMenu(null)}>
                                Buka Menu
                            </Link>
                        </div>
                    </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                    <nav className="classic-topbar flex items-center justify-between px-4 lg:px-6">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowMobileMenu((v) => !v)} className="top-btn lg:hidden" title="Toggle menu">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                                </svg>
                            </button>
                            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 sm:text-lg">Sistem Informasi Akademik</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button type="button" className="top-btn relative" title="Notifikasi">
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                            <path d="M12 2a7 7 0 0 0-7 7v4.59L3.29 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .71-1.7L19 13.59V9a7 7 0 0 0-7-7zm0 20a3 3 0 0 0 2.82-2h-5.64A3 3 0 0 0 12 22z" />
                                        </svg>
                                        {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="80">
                                    <div className="flex items-center justify-between gap-3 px-3 py-2">
                                        <div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-100">Notifikasi Terbaru</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-300">{unreadCount} belum dibaca</p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <Link href={route('notifications.index')} className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                                                Buka Inbox
                                            </Link>
                                        )}
                                    </div>
                                    {latestUnread.length ? latestUnread.map((n) => (
                                        <div key={n.id} className="border-t border-slate-200 dark:border-slate-700 px-3 py-2">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-100">{n.data?.title || 'Notifikasi'}</p>
                                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">{n.data?.message || '-'}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Dropdown.Link href={route('notifications.read', n.id)} method="patch" as="button">Tandai Dibaca</Dropdown.Link>
                                                <Link href={hrefFor(resolveNotificationAction(n))} className="rounded-md px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-700">
                                                    {n.data?.action_label || 'Buka Modul'}
                                                </Link>
                                                {n.data?.module && (
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-700 dark:text-slate-200">
                                                        {resolveNotificationModuleLabel(n)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )) : <div className="px-3 py-2 text-xs text-slate-500">Tidak ada notifikasi baru.</div>}
                                    <div className="border-t border-slate-200 dark:border-slate-700 px-3 py-2">
                                        <Link href={route('notifications.index')} className="text-xs font-bold text-sky-700 dark:text-sky-300">Lihat semua notifikasi</Link>
                                    </div>
                                </Dropdown.Content>
                            </Dropdown>
                            {ready && <ThemeToggle theme={theme} onToggle={toggleTheme} />}

                            <img src="/logostai.png" alt="Logo" className="h-8 w-8 rounded-full border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800 p-1 object-contain" />
                            <span className="hidden text-xs font-bold text-slate-800 dark:text-slate-100 md:block">{user.name}</span>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button type="button" className="top-btn">
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </nav>

                    {showMobileMenu && (
                        <div className="fixed inset-0 z-40 lg:hidden">
                            <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]" onClick={() => setShowMobileMenu(false)} aria-label="Close menu" />
                            <div className="mobile-sidebar-panel absolute left-2 top-[70px] bottom-2 w-[88vw] max-w-[280px] overflow-y-auto rounded-2xl p-2 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-slate-300/70 dark:border-white/10 px-2 pb-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Menu</p>
                                    <button className="top-btn h-7 w-7 text-xs" onClick={() => setShowMobileMenu(false)} aria-label="Close menu">
                                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                                            <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.3 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.3z" />
                                        </svg>
                                    </button>
                                </div>
                                        <div className="mt-2">
                                            {groupedMenu.map((group) => (
                                                <div key={group.key} className="mb-1">
                                                    <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">{group.group}</p>
                                                    {group.items.map((item) => (
                                                <Link key={item.route} href={route(item.route)} className="classic-menu-item" onClick={() => setShowMobileMenu(false)}>
                                                            <span className="flex items-center gap-3">
                                                                <span className={`menu-icon ${item.iconClass}`}>
                                                                    <Icon name={item.iconName} />
                                                                </span>
                                                                <span>{item.label}</span>
                                                            </span>
                                                            {item.accent ? (
                                                                <span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-100">
                                                                    RELASI
                                                                </span>
                                                            ) : item.badge ? (
                                                                <span className="classic-badge">{item.badge}</span>
                                                            ) : null}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 px-4 pb-4 pt-3 lg:px-5 lg:pb-5 lg:pt-4">
                        {header && <div className="mb-4">{header}</div>}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}





import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

const statusClasses = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-200 text-slate-700',
};

export default function Page({ auth, stats = null, recentUsers = [], backups = [], maintenanceLogs = [], logFilters = {} }) {
    const { menu, flash, errors } = usePage().props;
    const backupForm = useForm({});
    const restoreForm = useForm({ backup_file: null });
    const resetForm = useForm({ confirmation: '' });
    const purgeForm = useForm({ older_than_days: 30 });
    const userRoles = Array.isArray(auth?.roles) ? auth.roles : [];
    const isSuperAdmin = userRoles.includes('super-admin');

    const [confirmingAction, setConfirmingAction] = useState(null); // 'reset' or 'delete-backup'
    const [itemToProcess, setItemToProcess] = useState(null);

    const cards = [
        { label: 'Total User', value: stats?.total_user ?? 0, tone: 'text-slate-900' },
        { label: 'User Aktif', value: stats?.user_aktif ?? 0, tone: 'text-emerald-700' },
        { label: 'Email Verified', value: stats?.email_terverifikasi ?? 0, tone: 'text-sky-700' },
        { label: 'Semester Aktif', value: stats?.semester_aktif ?? '-', tone: 'text-amber-700' },
    ];

    const confirmReset = () => {
        setConfirmingAction('reset');
    };

    const handleReset = () => {
        resetForm.post(route('settings.database.reset'), {
            onSuccess: () => setConfirmingAction(null),
        });
    };

    const confirmDeleteBackup = (filename) => {
        setItemToProcess(filename);
        setConfirmingAction('delete-backup');
    };

    const handleDeleteBackup = () => {
        router.delete(route('settings.database.delete', itemToProcess), {
            onSuccess: () => {
                setConfirmingAction(null);
                setItemToProcess(null);
            },
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Pengaturan Sistem" />

            <ConfirmationModal
                show={confirmingAction === 'reset'}
                onClose={() => setConfirmingAction(null)}
                onConfirm={handleReset}
                title="Reset Database"
                message="Apakah Anda yakin ingin mereset database? Aksi ini akan menghapus seluruh data aplikasi kecuali akun super-admin. Tindakan ini TIDAK DAPAT DIBATALKAN."
                confirmText="Ya, Reset Sekarang"
                processing={resetForm.processing}
            />

            <ConfirmationModal
                show={confirmingAction === 'delete-backup'}
                onClose={() => setConfirmingAction(null)}
                onConfirm={handleDeleteBackup}
                title="Hapus Backup"
                message={`Apakah Anda yakin ingin menghapus file backup ${itemToProcess}?`}
                confirmText="Hapus Backup"
            />

            <div className="space-y-5">
                <section className="panel overflow-hidden p-0">
                    <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
                        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.16),_transparent_52%),linear-gradient(135deg,_#fff7fb,_#f8fafc)] px-4 py-4 sm:px-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">System Health</p>
                            <h3 className="mt-1.5 text-xl font-black tracking-tight text-slate-900">Konfigurasi Operasional</h3>
                            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
                                Ringkasan teknis ini membantu admin memantau lingkungan aplikasi, tahun akademik aktif, dan akun terbaru yang masuk ke sistem.
                            </p>
                            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                                <article className="rounded-xl border border-pink-100 bg-white/80 px-3 py-3 shadow-sm shadow-pink-100/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Aplikasi</p>
                                    <p className="mt-1.5 text-sm font-black text-slate-900">{stats?.app_name || '-'}</p>
                                </article>
                                <article className="rounded-xl border border-pink-100 bg-white/80 px-3 py-3 shadow-sm shadow-pink-100/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Environment</p>
                                    <p className="mt-1.5 text-sm font-black text-slate-900">{stats?.app_env || '-'}</p>
                                </article>
                                <article className="rounded-xl border border-pink-100 bg-white/80 px-3 py-3 shadow-sm shadow-pink-100/40">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">PHP</p>
                                    <p className="mt-1.5 text-sm font-black text-slate-900">{stats?.php_version || '-'}</p>
                                </article>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 border-t border-slate-200 bg-white px-4 py-4 sm:px-5 lg:border-l lg:border-t-0">
                            {cards.map((item) => (
                                <article key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                                    <p className={`mt-1.5 text-xl font-black ${item.tone}`}>{item.value}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <section className="panel p-5">
                        <h3 className="text-sm font-bold text-slate-900">Parameter Aktif</h3>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tahun Akademik</p>
                                <p className="mt-2 text-base font-bold text-slate-900">{stats?.tahun_aktif || 'Belum diatur'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Semester Aktif</p>
                                <p className="mt-2 text-base font-bold text-slate-900">{stats?.semester_aktif || '-'}</p>
                            </div>
                        </div>
                    </section>

                    <section className="panel p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">User Terbaru</h3>
                                <p className="mt-1 text-xs text-slate-500">Akun terbaru untuk audit ringan akses sistem.</p>
                            </div>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{recentUsers.length} user</div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                        <th className="px-3 py-2 font-semibold">Nama</th>
                                        <th className="px-3 py-2 font-semibold">Email</th>
                                        <th className="px-3 py-2 font-semibold">Phone</th>
                                        <th className="px-3 py-2 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map((user) => (
                                        <tr key={user.id} className="border-t border-slate-100">
                                            <td className="px-3 py-3 font-medium text-slate-700">{user.name}</td>
                                            <td className="px-3 py-3 text-slate-600">{user.email || '-'}</td>
                                            <td className="px-3 py-3 text-slate-600">{user.phone || '-'}</td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${user.is_active ? statusClasses.active : statusClasses.inactive}`}>
                                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {isSuperAdmin && (
                    <section className="panel p-5">
                        <h3 className="text-sm font-bold text-slate-900">Pemeliharaan Database</h3>
                        <p className="mt-1 text-xs text-slate-500">Operasi ini sensitif. Gunakan hanya saat maintenance terjadwal.</p>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Keuangan</p>
                                    <p className="mt-1 text-xs text-slate-600">Kunci periode (closing) untuk mencegah perubahan setelah tutup buku.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={route('settings.finance-period-locks.index')} className="btn-outline">
                                        Period Lock
                                    </a>
                                    <a href={route('settings.finance-reconciliation.index')} className="btn-outline">
                                        Rekonsiliasi
                                    </a>
                                </div>
                            </div>
                        </div>

                        {flash?.success && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</div>}

                        <div className="mt-4 grid gap-4 lg:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Backup</p>
                                <p className="mt-2 text-xs text-slate-600">Simpan snapshot SQL database saat ini.</p>
                                <button className="btn-primary mt-3 w-full text-xs" onClick={() => backupForm.post(route('settings.database.backup'))}>Buat Backup</button>
                                <div className="mt-3 border-t border-slate-200 pt-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Purge Backup Lama</p>
                                    <input
                                        type="number"
                                        min={1}
                                        max={3650}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                                        value={purgeForm.data.older_than_days}
                                        onChange={(event) => purgeForm.setData('older_than_days', Number(event.target.value || 1))}
                                    />
                                    <button className="btn-primary mt-2 w-full text-xs" disabled={purgeForm.processing} onClick={() => purgeForm.post(route('settings.database.purge'))}>
                                        Hapus Backup Lama
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Restore</p>
                                <p className="mt-2 text-xs text-slate-600">Pulihkan database dari file SQL backup.</p>
                                <input type="file" accept=".sql,.txt" className="mt-3 block w-full text-xs" onChange={(event) => restoreForm.setData('backup_file', event.target.files?.[0] || null)} />
                                {errors?.backup_file && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.backup_file}</p>}
                                <button className="btn-primary mt-3 w-full text-xs" disabled={restoreForm.processing || !restoreForm.data.backup_file} onClick={() => restoreForm.post(route('settings.database.restore'))}>
                                    Restore Backup
                                </button>
                            </div>

                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Reset Data</p>
                                <p className="mt-2 text-xs text-rose-700">Hapus semua data aplikasi kecuali akun super-admin.</p>
                                <input type="text" placeholder="Ketik: RESET DATABASE" className="mt-3 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs" value={resetForm.data.confirmation} onChange={(event) => resetForm.setData('confirmation', event.target.value)} />
                                {errors?.confirmation && <p className="mt-2 text-xs font-semibold text-rose-700">{errors.confirmation}</p>}
                                <button
                                    className="mt-3 w-full rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                                    disabled={resetForm.processing}
                                    onClick={confirmReset}
                                >
                                    Reset Database
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">File Backup Tersedia</p>
                                <div className="mt-3 space-y-2">
                                    {backups.length === 0 && <p className="text-xs text-slate-500">Belum ada file backup.</p>}
                                    {backups.map((backup) => (
                                        <div key={backup.filename} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-800">{backup.filename}</p>
                                                <p className="text-[11px] text-slate-500">{backup.last_modified_at} | {(backup.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a className="btn-primary text-[11px]" href={route('settings.database.download', backup.filename)}>Download</a>
                                                <button
                                                    className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-bold text-white"
                                                    onClick={() => confirmDeleteBackup(backup.filename)}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Log Pemeliharaan</p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-white"
                                            href={route('settings.database.logs.export', {
                                                log_action: logFilters.log_action || 'all',
                                                log_status: logFilters.log_status || 'all',
                                                limit: logFilters.log_limit || 12,
                                            })}
                                        >
                                            Export CSV
                                        </a>
                                        <select
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
                                            value={logFilters.log_action || 'all'}
                                            onChange={(event) => router.get(route('settings.index'), { log_action: event.target.value, log_status: logFilters.log_status || 'all', log_limit: logFilters.log_limit || 12 }, { preserveState: true, preserveScroll: true })}
                                        >
                                            <option value="all">Semua Aksi</option>
                                            <option value="backup">Backup</option>
                                            <option value="restore">Restore</option>
                                            <option value="reset">Reset</option>
                                            <option value="download">Download</option>
                                            <option value="delete-backup">Delete Backup</option>
                                            <option value="purge-backup">Purge Backup</option>
                                            <option value="purge-backup-scheduled">Purge Scheduled</option>
                                        </select>
                                        <select
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
                                            value={logFilters.log_status || 'all'}
                                            onChange={(event) => router.get(route('settings.index'), { log_action: logFilters.log_action || 'all', log_status: event.target.value, log_limit: logFilters.log_limit || 12 }, { preserveState: true, preserveScroll: true })}
                                        >
                                            <option value="all">Semua Status</option>
                                            <option value="success">Success</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                                    {maintenanceLogs.length === 0 && <p className="text-xs text-slate-500">Belum ada log maintenance.</p>}
                                    {maintenanceLogs.map((log) => (
                                        <div key={log.id} className="rounded-xl border border-slate-100 px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-semibold text-slate-800">{log.action.toUpperCase()} | {log.status}</p>
                                                <p className="text-[11px] text-slate-500">{log.executed_at || '-'}</p>
                                            </div>
                                            <p className="mt-1 text-[11px] text-slate-600">{log.actor?.name || 'System'}{log.filename ? ` | ${log.filename}` : ''}</p>
                                            {log.message && <p className="mt-1 text-[11px] text-slate-500">{log.message}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

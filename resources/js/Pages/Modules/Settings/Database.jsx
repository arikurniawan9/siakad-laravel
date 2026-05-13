import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function formatKb(bytes) {
    return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatBackupDateTime(backup) {
    const ts = Number(backup?.last_modified_ts || 0);
    if (!Number.isFinite(ts) || ts <= 0) return backup?.last_modified_at || '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(ts * 1000));
}

export default function DatabaseMaintenancePage({ auth, backups = [], maintenanceLogs = [], logFilters = {}, availableTables = [] }) {
    const { menu, flash, errors } = usePage().props;
    const backupForm = useForm({ mode: 'full', label: '', tables: [] });
    const restoreForm = useForm({ backup_file: null });
    const restoreStoredForm = useForm({});
    const resetForm = useForm({ confirmation: '' });
    const purgeForm = useForm({ older_than_days: 30 });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [restoreToast, setRestoreToast] = useState(null);
    const [restoreStoredTarget, setRestoreStoredTarget] = useState(null);
    const [restoreCountdown, setRestoreCountdown] = useState(3);
    const [tableSearch, setTableSearch] = useState('');
    const [activeTab, setActiveTab] = useState('backup');

    const isRestoring = restoreForm.processing || restoreStoredForm.processing;
    const isBusy = backupForm.processing || isRestoring || resetForm.processing || purgeForm.processing;
    const currentError = errors?.backup_file || errors?.confirmation;

    const busyOverlay = (() => {
        if (isRestoring) {
            return {
                label: 'Maintenance Window',
                title: 'Restore sedang berjalan',
                description: 'Proses ini bisa memakan waktu beberapa menit. Jangan refresh atau tutup tab.',
                tone: 'emerald',
            };
        }
        if (resetForm.processing) {
            return {
                label: 'Danger Zone',
                title: 'Reset database sedang berjalan',
                description: 'Mohon tunggu. Jangan refresh atau tutup tab sampai proses selesai.',
                tone: 'rose',
            };
        }
        if (backupForm.processing) {
            return {
                label: 'Backup Engine',
                title: 'Membuat backup database...',
                description: 'Mohon tunggu. Jangan refresh atau tutup tab sampai backup selesai.',
                tone: 'sky',
            };
        }
        if (purgeForm.processing) {
            return {
                label: 'Storage Cleanup',
                title: 'Menghapus backup lama...',
                description: 'Mohon tunggu sebentar.',
                tone: 'slate',
            };
        }
        return null;
    })();

    useEffect(() => {
        if (!flash?.success) return;
        if (!String(flash.success).toLowerCase().includes('restore database selesai')) return;
        setRestoreToast({ type: 'success', message: flash.success });
    }, [flash?.success]);

    useEffect(() => {
        if (!restoreToast?.message) return undefined;
        const timer = setTimeout(() => setRestoreToast(null), 3200);
        return () => clearTimeout(timer);
    }, [restoreToast?.message]);

    useEffect(() => {
        if (!restoreStoredTarget) return undefined;
        setRestoreCountdown(3);
        const timer = setInterval(() => {
            setRestoreCountdown((prev) => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [restoreStoredTarget]);

    const openConfirm = (type) => setConfirmAction(type);
    const closeConfirm = () => {
        if (isBusy) {
            return;
        }

        setConfirmAction(null);
    };

    const openRestoreStored = (filename) => {
        if (isBusy) return;
        setRestoreStoredTarget(filename);
    };

    const closeRestoreStored = () => {
        if (isBusy) return;
        setRestoreStoredTarget(null);
    };

    const confirmRestoreStored = () => {
        if (!restoreStoredTarget) return;
        restoreStoredForm.post(route('settings.database.restoreStored', restoreStoredTarget), {
            preserveScroll: true,
            onFinish: () => setRestoreStoredTarget(null),
        });
    };

    const handleConfirmAction = () => {
        if (confirmAction === 'purge') {
            purgeForm.post(route('settings.database.purge'), {
                preserveScroll: true,
                onFinish: () => setConfirmAction(null),
            });

            return;
        }

        if (confirmAction === 'reset') {
            resetForm.post(route('settings.database.reset'), {
                preserveScroll: true,
                onFinish: () => setConfirmAction(null),
            });
        }
    };

    const filteredTables = (availableTables || []).filter((t) => String(t).toLowerCase().includes(tableSearch.toLowerCase()));

    const toggleTable = (table) => {
        const current = backupForm.data.tables || [];
        if (current.includes(table)) {
            backupForm.setData('tables', current.filter((t) => t !== table));
            return;
        }
        backupForm.setData('tables', [...current, table]);
    };

    const selectAllTables = () => {
        backupForm.setData('tables', [...(availableTables || [])]);
    };

    const clearTables = () => {
        backupForm.setData('tables', []);
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Maintenance Database" />

            <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_46%),linear-gradient(140deg,_#ffffff,_#f8fafc)] p-4 shadow-sm sm:p-5">
                    <h3 className="text-xl font-black tracking-tight text-slate-900">Maintenance Database</h3>
                    <p className="mt-1.5 max-w-3xl text-xs leading-5 text-slate-600">Backup, restore, reset, dan log maintenance.</p>

                    {flash?.success && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{flash.success}</div>}
                    {currentError && <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{currentError}</div>}
                </section>

                <section className="panel p-2">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'backup', label: 'Backup' },
                            { key: 'restore', label: 'Restore' },
                            { key: 'files', label: 'Backup Files' },
                            { key: 'logs', label: 'Logs' },
                            { key: 'danger', label: 'Reset' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                disabled={isBusy}
                                onClick={() => setActiveTab(tab.key)}
                                className={`rounded-2xl px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] transition disabled:opacity-60 ${
                                    activeTab === tab.key ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="grid gap-4">
                    {activeTab === 'backup' && (
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Backup</p>
                        <h4 className="mt-2 text-lg font-black text-slate-900">Snapshot Database</h4>
                        <p className="mt-2 text-xs leading-5 text-slate-600">Buat salinan SQL terbaru sebelum perubahan besar.</p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                className={`rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] transition disabled:opacity-60 ${
                                    backupForm.data.mode === 'full' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                                disabled={isBusy}
                                onClick={() => backupForm.setData('mode', 'full')}
                            >
                                Full
                            </button>
                            <button
                                type="button"
                                className={`rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] transition disabled:opacity-60 ${
                                    backupForm.data.mode === 'custom' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                                disabled={isBusy}
                                onClick={() => backupForm.setData('mode', 'custom')}
                            >
                                Parsial
                            </button>
                        </div>

                        {backupForm.data.mode === 'custom' && (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Backup Builder</p>
                                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                                    Pilih tabel yang ingin di-backup. Backup parsial bisa gagal saat restore jika ada relasi yang tidak ikut tersimpan.
                                </p>

                                <div className="mt-3 space-y-2">
                                    <input
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-60"
                                        placeholder="Label opsional (mis. finance-only)"
                                        disabled={isBusy}
                                        value={backupForm.data.label || ''}
                                        onChange={(e) => backupForm.setData('label', e.target.value)}
                                    />
                                    <input
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-60"
                                        placeholder="Cari tabel..."
                                        disabled={isBusy}
                                        value={tableSearch}
                                        onChange={(e) => setTableSearch(e.target.value)}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" className="btn-outline" disabled={isBusy} onClick={selectAllTables}>
                                            Pilih semua
                                        </button>
                                        <button type="button" className="btn-outline" disabled={isBusy} onClick={clearTables}>
                                            Kosongkan
                                        </button>
                                        <span className="ml-auto rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                                            {(backupForm.data.tables || []).length}/{(availableTables || []).length}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 max-h-[180px] space-y-1 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
                                    {filteredTables.length === 0 && <p className="px-2 py-2 text-xs text-slate-500">Tidak ada tabel.</p>}
                                    {filteredTables.map((table) => (
                                        <label key={table} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={(backupForm.data.tables || []).includes(table)}
                                                onChange={() => toggleTable(table)}
                                                disabled={isBusy}
                                            />
                                            <span className="font-mono">{table}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors?.tables && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.tables}</p>}
                            </div>
                        )}

                        <button
                            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,0.9)] transition hover:brightness-105 disabled:opacity-60"
                            disabled={isBusy || (backupForm.data.mode === 'custom' && (backupForm.data.tables || []).length === 0)}
                            onClick={() => backupForm.post(route('settings.database.backup'), { preserveScroll: true })}
                            type="button"
                        >
                            {backupForm.processing ? 'Membuat Backup...' : backupForm.data.mode === 'custom' ? 'Buat Backup Parsial' : 'Buat Backup'}
                        </button>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Purge Backup Lama</p>
                            <p className="mt-2 text-[11px] leading-5 text-slate-500">Hapus file backup yang lebih tua dari ambang hari berikut. Pastikan backup terbaru sudah aman.</p>
                            <input
                                type="number"
                                min={1}
                                max={3650}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-60"
                                disabled={isBusy}
                                value={purgeForm.data.older_than_days}
                                onChange={(event) => purgeForm.setData('older_than_days', Number(event.target.value || 1))}
                            />
                            <button
                                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
                                disabled={isBusy}
                                onClick={() => openConfirm('purge')}
                            >
                                {purgeForm.processing ? 'Menghapus Backup Lama...' : 'Hapus Backup Lama'}
                            </button>
                        </div>
                    </article>
                    )}

                    {activeTab === 'restore' && (
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Restore</p>
                        <h4 className="mt-2 text-lg font-black text-slate-900">Recovery Database</h4>
                        <p className="mt-2 text-xs leading-5 text-slate-600">Pulihkan sistem dari file backup SQL yang valid.</p>

                        <label className="mt-4 block rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-xs text-slate-600">
                            Pilih file backup (.sql/.txt)
                            <input
                                type="file"
                                accept=".sql,.txt"
                                className="mt-2 block w-full text-xs"
                                disabled={isBusy}
                                onChange={(event) => restoreForm.setData('backup_file', event.target.files?.[0] || null)}
                            />
                        </label>
                        <p className="mt-2 text-[11px] text-slate-500">
                            {restoreForm.data.backup_file ? `File terpilih: ${restoreForm.data.backup_file.name}` : 'Belum ada file yang dipilih.'}
                        </p>
                        {errors?.backup_file && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.backup_file}</p>}

                        <button
                            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_-14px_rgba(5,150,105,0.9)] transition hover:brightness-105 disabled:opacity-60"
                            disabled={isBusy || !restoreForm.data.backup_file}
                            onClick={() =>
                                restoreForm.post(route('settings.database.restore'), {
                                    preserveScroll: true,
                                    forceFormData: true,
                                    onSuccess: () => restoreForm.reset('backup_file'),
                                })
                            }
                        >
                            {restoreForm.processing ? 'Menjalankan Restore...' : 'Restore Backup'}
                        </button>
                    </article>
                    )}

                    {activeTab === 'danger' && (
                    <article className="rounded-3xl border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-700">Danger Zone</p>
                        <h4 className="mt-2 text-lg font-black text-rose-800">Reset Data</h4>
                        <p className="mt-2 text-xs leading-5 text-rose-700">Hapus seluruh data aplikasi kecuali akun super-admin.</p>

                        <input
                            type="text"
                            placeholder="Ketik: RESET DATABASE"
                            className="mt-4 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs disabled:opacity-60"
                            disabled={isBusy}
                            value={resetForm.data.confirmation}
                            onChange={(event) => resetForm.setData('confirmation', event.target.value)}
                        />
                        {errors?.confirmation && <p className="mt-2 text-xs font-semibold text-rose-700">{errors.confirmation}</p>}

                        <button
                            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-rose-700 disabled:opacity-60"
                            disabled={isBusy}
                            onClick={() => openConfirm('reset')}
                        >
                            {resetForm.processing ? 'Mereset Database...' : 'Reset Database'}
                        </button>
                    </article>
                    )}
                </section>

                <section className="grid gap-4">
                    {activeTab === 'files' && (
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Backup Files</p>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{backups.length} file</span>
                        </div>
                        <div className="mt-3 space-y-2">
                            {backups.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs text-slate-500">Belum ada file backup.</p>}
                            {backups.map((backup) => (
                                <div key={backup.filename} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-slate-800">{backup.filename}</p>
                                        <p className="text-[11px] text-slate-500">{formatBackupDateTime(backup)} | {formatKb(backup.size)}</p>
                                    </div>
                                    <div className="ml-2 flex items-center gap-2">
                                        <a className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-500" href={route('settings.database.download', backup.filename)}>Download</a>
                                        <button
                                            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                                            disabled={isBusy}
                                            onClick={() => openRestoreStored(backup.filename)}
                                            type="button"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-rose-500 disabled:opacity-60"
                                            disabled={isBusy}
                                            onClick={() => setDeleteTarget(backup.filename)}
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>
                    )}

                    {activeTab === 'logs' && (
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Maintenance Logs</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <a
                                    className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-white"
                                    href={route('settings.database.logs.export', {
                                        log_action: logFilters.log_action || 'all',
                                        log_status: logFilters.log_status || 'all',
                                        limit: logFilters.log_limit || 20,
                                    })}
                                >
                                    Export CSV
                                </a>
                                <select
                                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px]"
                                    value={logFilters.log_action || 'all'}
                                    onChange={(event) => router.get(route('settings.database.index'), { log_action: event.target.value, log_status: logFilters.log_status || 'all', log_limit: logFilters.log_limit || 20 }, { preserveState: true, preserveScroll: true })}
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
                                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px]"
                                    value={logFilters.log_status || 'all'}
                                    onChange={(event) => router.get(route('settings.database.index'), { log_action: logFilters.log_action || 'all', log_status: event.target.value, log_limit: logFilters.log_limit || 20 }, { preserveState: true, preserveScroll: true })}
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="success">Success</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
                            {maintenanceLogs.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs text-slate-500">Belum ada log maintenance.</p>}
                            {maintenanceLogs.map((log) => (
                                <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-slate-800">{log.action.toUpperCase()} | {log.status}</p>
                                        <p className="text-[11px] text-slate-500">{log.executed_at || '-'}</p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-600">{log.actor?.name || 'System'}{log.filename ? ` | ${log.filename}` : ''}</p>
                                    {log.message && <p className="mt-1 text-[11px] text-slate-500">{log.message}</p>}
                                </div>
                            ))}
                        </div>
                    </article>
                    )}
                </section>
            </div>

            {busyOverlay && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-6 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-[linear-gradient(140deg,_#ffffff,_#f8fafc)] p-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-slate-900/5 p-2 ring-1 ring-slate-900/10">
                                <div className="h-full w-full animate-spin rounded-full border-2 border-slate-900/15 border-t-slate-900/70" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{busyOverlay.label}</p>
                                <p className="mt-1 text-base font-black text-slate-900">{busyOverlay.title}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{busyOverlay.description}</p>
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className={`h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r ${
                                    busyOverlay.tone === 'rose'
                                        ? 'from-rose-300/80 to-orange-200/80'
                                        : busyOverlay.tone === 'sky'
                                          ? 'from-sky-300/80 to-cyan-200/80'
                                          : busyOverlay.tone === 'emerald'
                                            ? 'from-emerald-300/80 to-sky-300/80'
                                            : 'from-slate-300/80 to-slate-200/80'
                                }`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {restoreToast?.message && (
                <div className="fixed right-4 top-4 z-[70] w-[calc(100vw-2rem)] max-w-md">
                    <div className="rounded-2xl border border-emerald-200/60 bg-white/70 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg backdrop-blur">
                        {restoreToast.message}
                    </div>
                </div>
            )}

            <Modal show={Boolean(deleteTarget)} onClose={() => !isBusy && setDeleteTarget(null)} maxWidth="md">
                <div className="relative overflow-hidden rounded-3xl border border-rose-200/30 bg-[linear-gradient(150deg,rgba(30,41,59,0.95),rgba(15,23,42,0.94))] p-6 text-slate-100 shadow-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">Konfirmasi Hapus</p>
                    <h4 className="mt-2 text-xl font-black text-white">Hapus File Backup?</h4>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                        Anda akan menghapus file:
                        <span className="mt-1 block rounded-xl border border-rose-200/30 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-200">
                            {deleteTarget}
                        </span>
                    </p>
                    <p className="mt-3 text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                            className="rounded-xl border border-slate-500/40 bg-slate-700/40 px-3 py-2 text-xs font-bold text-slate-100 transition hover:bg-slate-600/50 disabled:opacity-60"
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(null)}
                        >
                            Batal
                        </button>
                        <button
                            className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_12px_24px_-14px_rgba(244,63,94,0.95)] transition hover:brightness-105 disabled:opacity-60"
                            disabled={isBusy}
                            onClick={() => {
                                router.delete(route('settings.database.delete', deleteTarget), {
                                    preserveScroll: true,
                                    onFinish: () => setDeleteTarget(null),
                                });
                            }}
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={Boolean(confirmAction)} onClose={closeConfirm} maxWidth="md">
                <div className="bg-white p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Konfirmasi Maintenance</p>
                    <h4 className="mt-2 text-xl font-black text-slate-900">
                        {confirmAction === 'reset' ? 'Reset Semua Data?' : 'Purge Backup Lama?'}
                    </h4>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        {confirmAction === 'reset'
                            ? 'Aksi ini menghapus seluruh data aplikasi kecuali akun super-admin. Pastikan Anda sudah membuat backup terbaru dan maintenance window sedang aktif.'
                            : `Backup SQL yang lebih tua dari ${purgeForm.data.older_than_days} hari akan dihapus permanen dari storage lokal.`}
                    </p>
                    {confirmAction === 'reset' && (
                        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                            Validasi teks RESET DATABASE tetap wajib benar sebelum aksi dijalankan.
                        </p>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                            disabled={isBusy}
                            onClick={closeConfirm}
                        >
                            Batal
                        </button>
                        <button
                            className={`rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-white transition disabled:opacity-60 ${
                                confirmAction === 'reset' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-800 hover:bg-slate-700'
                            }`}
                            disabled={isBusy}
                            onClick={handleConfirmAction}
                        >
                            {confirmAction === 'reset'
                                ? (resetForm.processing ? 'Mereset Database...' : 'Ya, Reset')
                                : (purgeForm.processing ? 'Menghapus Backup...' : 'Ya, Purge')}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={Boolean(restoreStoredTarget)} onClose={closeRestoreStored} maxWidth="md">
                <div className="relative overflow-hidden rounded-3xl border border-emerald-200/30 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.25),_transparent_55%),linear-gradient(160deg,_rgba(15,23,42,0.95),_rgba(30,41,59,0.95))] p-6 text-white shadow-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">Konfirmasi Restore</p>
                    <h4 className="mt-2 text-xl font-black">Restore dari File Backup</h4>
                    <p className="mt-3 text-sm leading-6 text-white/70">
                        Anda akan me-restore database menggunakan file:
                        <span className="mt-2 block rounded-2xl border border-white/10 bg-white/10 px-3 py-2 font-mono text-xs text-white/90">
                            {restoreStoredTarget}
                        </span>
                    </p>
                    <p className="mt-3 text-xs text-white/60">Pastikan tidak ada aktivitas user saat restore berjalan.</p>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
                            disabled={isBusy}
                            onClick={closeRestoreStored}
                            type="button"
                        >
                            Batal
                        </button>
                        <button
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_12px_24px_-14px_rgba(16,185,129,0.75)] transition hover:brightness-105 disabled:opacity-60"
                            disabled={isBusy || restoreCountdown > 0}
                            onClick={confirmRestoreStored}
                            type="button"
                        >
                            {restoreCountdown > 0 ? `Mulai (${restoreCountdown})` : (restoreStoredForm.processing ? 'Menjalankan...' : 'Mulai Restore')}
                        </button>
                    </div>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}

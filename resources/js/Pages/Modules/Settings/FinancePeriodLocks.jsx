import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function formatDateTime(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function Page({ auth, locks = [], filters = null, tahunAkademiks = [] }) {
    const { menu, flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [limit, setLimit] = useState(String(filters?.limit || 50));
    const [confirmingUnlock, setConfirmingUnlock] = useState(false);
    const [lockToUnlock, setLockToUnlock] = useState(null);

    const form = useForm({
        tahun_akademik: '',
        semester_akademik: '',
        reason: '',
    });

    const summary = useMemo(() => {
        const semesterLocks = locks.filter((l) => l.semester_akademik !== null && l.semester_akademik !== undefined).length;
        const yearLocks = locks.length - semesterLocks;
        return { total: locks.length, yearLocks, semesterLocks };
    }, [locks]);

    useEffect(() => {
        if (form.data.tahun_akademik) return;
        const active = tahunAkademiks.find((t) => t.is_active);
        if (active?.kode) {
            form.setData('tahun_akademik', active.kode);
        } else if (tahunAkademiks[0]?.kode) {
            form.setData('tahun_akademik', tahunAkademiks[0].kode);
        }
    }, [tahunAkademiks]);

    const applyFilters = () => {
        router.get(
            route('settings.finance-period-locks.index'),
            { search, limit },
            { preserveScroll: true, preserveState: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setLimit('50');
        router.get(route('settings.finance-period-locks.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const submit = (event) => {
        event.preventDefault();
        form.post(route('settings.finance-period-locks.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('tahun_akademik', 'semester_akademik', 'reason'),
        });
    };

    const confirmUnlock = (lock) => {
        setLockToUnlock(lock);
        setConfirmingUnlock(true);
    };

    const unlock = () => {
        if (!lockToUnlock?.id) return;
        router.delete(route('settings.finance-period-locks.destroy', lockToUnlock.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingUnlock(false);
                setLockToUnlock(null);
            },
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-bold text-slate-900">Penguncian Periode Keuangan</h2>}>
            <Head title="Penguncian Periode Keuangan" />

            <ConfirmationModal
                show={confirmingUnlock}
                onClose={() => setConfirmingUnlock(false)}
                onConfirm={unlock}
                title="Buka Periode"
                message={`Apakah Anda yakin ingin membuka periode ${lockToUnlock?.tahun_akademik}${lockToUnlock?.semester_akademik ? ` / Semester ${lockToUnlock.semester_akademik}` : ''}?`}
                confirmText="Buka Periode"
            />

            <ModuleHero
                eyebrow="Keuangan"
                title="Period Lock / Closing"
                description="Kunci periode untuk mencegah perubahan tagihan/pembayaran setelah tutup buku."
                note={`Total lock: ${summary.total} (Tahun: ${summary.yearLocks}, Semester: ${summary.semesterLocks})`}
            />

            <div className="grid gap-4 xl:grid-cols-3">
                <section className="panel p-4 xl:col-span-1">
                    <h3 className="text-sm font-bold text-slate-900">Kunci Periode</h3>
                    {flash?.error && <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">{flash.error}</p>}
                    {flash?.success && <p className="mt-2 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}

                    <form onSubmit={submit} className="mt-3 space-y-2">
                        <select className="form-input" value={form.data.tahun_akademik} onChange={(e) => form.setData('tahun_akademik', e.target.value)}>
                            <option value="">Pilih Tahun Akademik</option>
                            {tahunAkademiks.map((t) => (
                                <option key={t.id} value={t.kode}>
                                    {t.kode} — {t.nama}{t.is_active ? ' (Aktif)' : ''}
                                </option>
                            ))}
                        </select>
                        <input
                            className="form-input"
                            type="number"
                            min="1"
                            max="14"
                            value={form.data.semester_akademik}
                            onChange={(e) => form.setData('semester_akademik', e.target.value)}
                            placeholder="Semester (opsional)"
                        />
                        <textarea
                            className="form-input"
                            rows="3"
                            value={form.data.reason}
                            onChange={(e) => form.setData('reason', e.target.value)}
                            placeholder="Alasan/nota closing (opsional)"
                        />
                        <button type="submit" disabled={form.processing} className="btn-primary w-full">
                            Kunci Periode
                        </button>
                    </form>
                </section>

                <section className="panel p-4 xl:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Daftar Periode Terkunci</h3>
                            <p className="mt-1 text-xs text-slate-500">Lock berbasis `tahun_akademik` dan opsional `semester_akademik`.</p>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{locks.length} data</div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
                        <input
                            className="form-input"
                            placeholder="Cari tahun/alasan"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                        <select className="form-input" value={limit} onChange={(e) => setLimit(e.target.value)}>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                        </select>
                        <button type="button" className="btn-primary" onClick={applyFilters}>
                            Terapkan
                        </button>
                        <button type="button" className="btn-outline" onClick={resetFilters}>
                            Reset
                        </button>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="min-w-full text-left text-xs">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="px-3 py-2">Periode</th>
                                    <th className="px-3 py-2">Terkunci</th>
                                    <th className="px-3 py-2">Aktor</th>
                                    <th className="px-3 py-2">Alasan</th>
                                    <th className="px-3 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locks.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-3 py-6 text-center text-slate-500">
                                            Belum ada periode terkunci.
                                        </td>
                                    </tr>
                                ) : (
                                    locks.map((lock) => (
                                        <tr key={lock.id} className="border-b border-slate-100">
                                            <td className="px-3 py-2 font-semibold text-slate-800">
                                                {lock.tahun_akademik}
                                                {lock.semester_akademik ? ` / Semester ${lock.semester_akademik}` : ''}
                                            </td>
                                            <td className="px-3 py-2 text-slate-600">{formatDateTime(lock.locked_at)}</td>
                                            <td className="px-3 py-2 text-slate-600">{lock.actor?.name || 'System'}</td>
                                            <td className="px-3 py-2 text-slate-600">{lock.reason || '-'}</td>
                                            <td className="px-3 py-2">
                                                <button type="button" className="btn-outline" onClick={() => confirmUnlock(lock)}>
                                                    Buka
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

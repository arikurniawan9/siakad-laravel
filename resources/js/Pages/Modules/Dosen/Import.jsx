import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const resultTone = {
    ready: 'bg-sky-100 text-sky-700 ring-sky-200',
    blocked: 'bg-rose-100 text-rose-700 ring-rose-200',
    success: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    failed: 'bg-rose-100 text-rose-700 ring-rose-200',
    skipped: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function FileIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        </svg>
    );
}

function CheckIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
        </svg>
    );
}

export default function Page({ auth, templateUrl, previewRows = [], previewToken = null, successModal = false, importSummary = null }) {
    const { menu, flash } = usePage().props;
    const previewForm = useForm({ file: null });
    const processForm = useForm({ preview_token: previewToken || '', selected_rows: [] });
    const [selectedRows, setSelectedRows] = useState([]);
    const [showSuccess, setShowSuccess] = useState(successModal);

    useEffect(() => {
        setShowSuccess(successModal);
    }, [successModal]);

    useEffect(() => {
        processForm.setData('preview_token', previewToken || '');
        setSelectedRows(previewRows.filter((row) => row.result === 'ready').map((row) => row.row_number));
    }, [previewToken, previewRows]);

    const summary = useMemo(() => ({
        total: previewRows.length,
        ready: previewRows.filter((row) => row.result === 'ready').length,
        blocked: previewRows.filter((row) => row.result === 'blocked').length,
        success: previewRows.filter((row) => row.result === 'success').length,
    }), [previewRows]);

    const toggleRow = (rowNumber) => {
        setSelectedRows((current) => (
            current.includes(rowNumber)
                ? current.filter((value) => value !== rowNumber)
                : [...current, rowNumber]
        ));
    };

    const toggleAll = () => {
        const selectable = previewRows.filter((row) => row.result !== 'success').map((row) => row.row_number);
        const allSelected = selectable.length > 0 && selectable.every((rowNumber) => selectedRows.includes(rowNumber));
        setSelectedRows(allSelected ? [] : selectable);
    };

    const handlePreview = (e) => {
        e.preventDefault();
        previewForm.post(route('dosen.import.preview'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const handleProcess = () => {
        processForm.transform((data) => ({
            ...data,
            preview_token: previewToken || '',
            selected_rows: selectedRows,
        })).post(route('dosen.import.process'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccess(true);
            },
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">Import Dosen</h2>}>
            <Head title="Import Dosen" />

            <ModuleHero
                eyebrow="Dosen"
                title="Import Dosen"
                description="Upload, tinjau, lalu proses data dosen melalui alur pratinjau yang aman."
                note={`Baris pratinjau: ${previewRows.length}`}
            />

            <div className="space-y-4">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_40%),linear-gradient(130deg,_#ffffff,_#f8fafc)] p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Excel Import Console</p>
                            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Upload, Tinjau, Pilih, dan Proses Data Dosen</h3>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                Alur import ini dibuat agar Anda bisa meninjau data sebelum masuk database, memilih baris yang akan diproses, dan melihat baris berhasil ter-highlight hijau setelah tersimpan.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={templateUrl} className="btn-outline inline-flex items-center gap-2">
                                <FileIcon />
                                Template Excel
                            </a>
                            <Link href={route('dosen.index')} className="btn-primary inline-flex items-center gap-2">
                                <CheckIcon />
                                Kembali ke Dosen
                            </Link>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total Baris</p><p className="mt-1 text-xl font-black text-slate-900">{summary.total}</p></div>
                        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Siap Import</p><p className="mt-1 text-xl font-black text-sky-800">{summary.ready}</p></div>
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Perlu Perbaikan</p><p className="mt-1 text-xl font-black text-rose-800">{summary.blocked}</p></div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Berhasil</p><p className="mt-1 text-xl font-black text-emerald-800">{summary.success}</p></div>
                    </div>
                </section>

                {flash?.success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}
                {previewToken && importSummary && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total File</p>
                                <p className="mt-1 text-lg font-black text-slate-900">{importSummary.total}</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Dipilih</p>
                                <p className="mt-1 text-lg font-black text-emerald-800">{importSummary.selected ?? 0}</p>
                            </div>
                            <div className="rounded-2xl bg-cyan-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Berhasil Proses</p>
                                <p className="mt-1 text-lg font-black text-cyan-800">{importSummary.created ?? 0}</p>
                            </div>
                        </div>
                    </div>
                )}

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Upload File Excel</h3>
                            <p className="mt-1 text-xs text-slate-500">Gunakan template agar format kolom terbaca benar.</p>
                        </div>
                    </div>
                    <form onSubmit={handlePreview} className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">File Excel</label>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="form-input"
                                onChange={(e) => previewForm.setData('file', e.target.files?.[0] || null)}
                            />
                            {previewForm.errors.file && <p className="mt-1 text-xs text-rose-600">{previewForm.errors.file}</p>}
                        </div>
                        <button type="submit" className="btn-primary min-w-36" disabled={previewForm.processing || !previewForm.data.file}>
                            {previewForm.processing ? 'Membaca File...' : 'Preview Data'}
                        </button>
                    </form>
                </section>

                {previewRows.length > 0 && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Preview Data Dosen</h3>
                                <p className="mt-1 text-xs text-slate-500">Pilih baris yang ingin diproses. Baris hijau menandakan data berhasil masuk database.</p>
                            </div>
                            <button type="button" className="btn-outline" onClick={toggleAll}>
                                {selectedRows.length === previewRows.filter((row) => row.result !== 'success').length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                            </button>
                        </div>

                        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full text-left text-xs">
                                <thead className="bg-slate-50">
                                    <tr className="text-slate-500">
                                        <th className="px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={previewRows.filter((row) => row.result !== 'success').length > 0 && previewRows.filter((row) => row.result !== 'success').every((row) => selectedRows.includes(row.row_number))}
                                                onChange={toggleAll}
                                            />
                                        </th>
                                        <th className="px-3 py-2">Baris</th>
                                        <th className="px-3 py-2">NIDN</th>
                                        <th className="px-3 py-2">Nama</th>
                                        <th className="px-3 py-2">NIP</th>
                                        <th className="px-3 py-2">Email</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((row) => {
                                        const rowState = row.result || 'ready';
                                        const selectable = rowState !== 'success';
                                        const selected = selectedRows.includes(row.row_number);
                                        return (
                                            <tr key={row.row_number} className={`border-t border-slate-100 ${rowState === 'success' ? 'bg-emerald-50' : rowState === 'failed' || rowState === 'blocked' ? 'bg-rose-50' : rowState === 'skipped' ? 'bg-slate-50 opacity-70' : ''}`}>
                                                <td className="px-3 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        disabled={!selectable}
                                                        onChange={() => toggleRow(row.row_number)}
                                                    />
                                                </td>
                                                <td className="px-3 py-3 font-semibold text-slate-700">{row.row_number}</td>
                                                <td className="px-3 py-3 text-slate-700">{row.nidn || '-'}</td>
                                                <td className="px-3 py-3 text-slate-700">{row.nama || '-'}</td>
                                                <td className="px-3 py-3 text-slate-600">{row.nip || '-'}</td>
                                                <td className="px-3 py-3 text-slate-600">{row.email || '-'}</td>
                                                <td className="px-3 py-3">
                                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${resultTone[rowState] || resultTone.ready}`}>
                                                        {row.result_label || (row.can_import ? 'Siap' : 'Perlu Perbaikan')}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-slate-600">
                                                    {row.issues?.length ? row.issues.join(', ') : rowState === 'success' ? 'Tersimpan ke database' : rowState === 'skipped' ? 'Tidak dipilih' : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-500">
                                Dipilih {selectedRows.length} baris dari {previewRows.length} baris. Baris yang sudah berhasil diimport akan otomatis tertandai hijau.
                            </p>
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={processForm.processing || selectedRows.length === 0}
                                onClick={handleProcess}
                            >
                                {processForm.processing ? 'Memproses...' : 'Proses Terpilih'}
                            </button>
                        </div>
                    </section>
                )}
            </div>

            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowSuccess(false)} />
                    <div className="relative w-full max-w-lg rounded-3xl border border-emerald-200/30 bg-[linear-gradient(150deg,rgba(15,23,42,0.97),rgba(8,15,28,0.95))] p-6 text-slate-100 shadow-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Import Selesai</p>
                        <h4 className="mt-2 text-xl font-black text-white">Data dosen berhasil diproses</h4>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            Silakan cek highlight hijau pada tabel untuk melihat baris yang berhasil tersimpan.
                        </p>
                        <div className="mt-5 grid grid-cols-3 gap-2">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Berhasil</p>
                                <p className="mt-1 text-lg font-black text-emerald-300">{importSummary?.created ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Gagal</p>
                                <p className="mt-1 text-lg font-black text-rose-300">{importSummary?.failed ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Dilewati</p>
                                <p className="mt-1 text-lg font-black text-slate-100">{importSummary?.skipped ?? 0}</p>
                            </div>
                        </div>
                        <div className="mt-5 flex gap-2">
                            <button type="button" className="btn-outline w-full" onClick={() => setShowSuccess(false)}>Tutup</button>
                            <Link href={route('dosen.index')} className="btn-primary w-full text-center">Ke Data Dosen</Link>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

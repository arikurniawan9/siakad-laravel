import { Fragment, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

const resultTone = {
    ready: 'bg-sky-100 text-sky-700 ring-sky-200',
    blocked: 'bg-rose-100 text-rose-700 ring-rose-200',
    success: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    failed: 'bg-rose-100 text-rose-700 ring-rose-200',
    skipped: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function FileIcon({ className = 'h-5 w-5' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        </svg>
    );
}

function CheckIcon({ className = 'h-5 w-5' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
        </svg>
    );
}

export default function ImportModal({ show, onClose, templateUrl, prodis = [] }) {
    const [file, setFile] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [previewToken, setPreviewToken] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [prodiEdits, setProdiEdits] = useState({});

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!show) {
            setFile(null);
            setPreviewRows([]);
            setPreviewToken(null);
            setSelectedRows([]);
            setShowSuccess(false);
            setError(null);
            setCurrentPage(1);
            setProdiEdits({});
        }
    }, [show]);

    const summary = useMemo(() => ({
        total: previewRows.length,
        ready: previewRows.filter((row) => row.result === 'ready').length,
        blocked: previewRows.filter((row) => row.result === 'blocked').length,
        success: previewRows.filter((row) => row.result === 'success').length,
    }), [previewRows]);

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return previewRows.slice(startIndex, startIndex + itemsPerPage);
    }, [previewRows, currentPage]);

    const totalPages = Math.ceil(previewRows.length / itemsPerPage);

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

    const handlePreview = async (e) => {
        e.preventDefault();
        if (!file) return;

        setProcessing(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(route('mahasiswa.import.preview'), formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
            });

            setPreviewRows(response.data.previewRows);
            setPreviewToken(response.data.previewToken);
            setSelectedRows(response.data.previewRows.filter((r) => r.result === 'ready').map((r) => r.row_number));
            setProdiEdits({});
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal membaca file Excel.');
        } finally {
            setProcessing(false);
        }
    };

    const saveProdiKode = async (rowNumber) => {
        if (!previewToken) return;

        const nextKode = (prodiEdits[rowNumber] ?? '').trim();
        if (!nextKode) return;

        setProcessing(true);
        setError(null);

        try {
            const response = await axios.post(route('mahasiswa.import.preview.update'), {
                preview_token: previewToken,
                row_number: rowNumber,
                prodi_kode: nextKode,
            }, {
                headers: { 'Accept': 'application/json' },
            });

            setPreviewRows(response.data.previewRows || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memperbarui prodi.');
        } finally {
            setProcessing(false);
        }
    };

    const handleProcess = async () => {
        if (!previewToken || selectedRows.length === 0) return;

        setProcessing(true);
        setError(null);

        try {
            const response = await axios.post(route('mahasiswa.import.process'), {
                preview_token: previewToken,
                selected_rows: selectedRows
            }, {
                headers: { 'Accept': 'application/json' }
            });

            setPreviewRows(response.data.previewRows);
            setShowSuccess(true);
            router.reload({ only: ['mahasiswas'] });
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memproses import.');
        } finally {
            setProcessing(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-6xl overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 p-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Import Mahasiswa</p>
                        <h3 className="mt-2 text-xl font-black text-slate-900">Upload → Preview → Pilih → Proses</h3>
                        <p className="mt-1 text-sm text-slate-600">Gunakan template agar format kolom sesuai.</p>
                    </div>
                    <button type="button" onClick={onClose} className="btn-outline">
                        Tutup
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto p-6">
                    {!previewToken && (
                        <div className="mx-auto max-w-2xl space-y-4">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="rounded-2xl bg-sky-50 p-4 text-sky-700">
                                        <FileIcon className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-900">Upload file Excel</p>
                                        <p className="mt-1 text-xs text-slate-600">Format: .xlsx / .xls / .csv</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <a href={templateUrl} className="btn-outline">
                                            Download Template
                                        </a>
                                        <button
                                            onClick={handlePreview}
                                            disabled={!file || processing}
                                            className="btn-primary"
                                        >
                                            {processing ? 'Membaca data...' : 'Preview Data'}
                                        </button>
                                    </div>
                                    {error && <p className="text-center text-xs font-bold text-rose-500">{error}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {previewToken && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</p>
                                    <p className="mt-1 text-xl font-black text-slate-900">{summary.total}</p>
                                </div>
                                <div className="rounded-3xl border border-sky-100 bg-sky-50/50 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Siap</p>
                                    <p className="mt-1 text-xl font-black text-sky-700">{summary.ready}</p>
                                </div>
                                <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Error</p>
                                    <p className="mt-1 text-xl font-black text-rose-700">{summary.blocked}</p>
                                </div>
                                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Sukses</p>
                                    <p className="mt-1 text-xl font-black text-emerald-700">{summary.success}</p>
                                </div>
                            </div>

                            {error && <p className="text-center text-xs font-bold text-rose-500">{error}</p>}

                            <div className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-xs">
                                        <thead className="bg-slate-50/80 backdrop-blur">
                                            <tr className="text-slate-500">
                                                <th className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                        checked={previewRows.filter((r) => r.result !== 'success').length > 0 && previewRows.filter((r) => r.result !== 'success').every((r) => selectedRows.includes(r.row_number))}
                                                        onChange={toggleAll}
                                                    />
                                                </th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Baris</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Prodi</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">NIM</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Nama</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedRows.map((row) => {
                                                const rowState = row.result || 'ready';
                                                const selectable = rowState !== 'success';
                                                const selected = selectedRows.includes(row.row_number);
                                                const prodiNeedsFix = (row.issues || []).some((issue) => issue === 'Prodi kode wajib diisi' || issue === 'Prodi kode tidak ditemukan');
                                                return (
                                                    <tr key={row.row_number} className={rowState === 'success' ? 'bg-emerald-50' : rowState === 'failed' || rowState === 'blocked' ? 'bg-rose-50' : ''}>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected}
                                                                disabled={!selectable}
                                                                onChange={() => toggleRow(row.row_number)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-slate-700">{row.row_number}</td>
                                                        <td className="px-4 py-3 text-slate-700">
                                                            {prodiNeedsFix ? (
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        className="form-input h-9 w-56 px-2 py-1 text-xs"
                                                                        value={prodiEdits[row.row_number] ?? row.prodi_kode ?? ''}
                                                                        onChange={(e) => setProdiEdits((prev) => ({ ...prev, [row.row_number]: e.target.value }))}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key !== 'Enter') return;
                                                                            e.preventDefault();
                                                                            saveProdiKode(row.row_number);
                                                                        }}
                                                                        disabled={processing}
                                                                    >
                                                                        <option value="">Pilih prodi</option>
                                                                        {prodis.map((p) => (
                                                                            <option key={p.id} value={p.kode}>
                                                                                {p.kode} - {p.nama}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-outline h-9 px-3 text-[11px]"
                                                                        onClick={() => saveProdiKode(row.row_number)}
                                                                        disabled={processing}
                                                                        title="Simpan prodi"
                                                                    >
                                                                        Simpan
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                row.prodi_kode || '-'
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700">{row.nim || '-'}</td>
                                                        <td className="px-4 py-3 text-slate-700">{row.nama || '-'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${resultTone[rowState] || resultTone.ready}`}>
                                                                {row.result_label || (row.can_import ? 'Siap' : 'Perlu Perbaikan')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">
                                                            {row.issues?.length ? row.issues.join(', ') : rowState === 'success' ? 'Tersimpan ke database' : rowState === 'skipped' ? 'Tidak dipilih' : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-slate-500">
                                        Halaman {currentPage} / {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button className="btn-outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                                            Prev
                                        </button>
                                        <button className="btn-outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-500">
                                    Dipilih {selectedRows.length} baris dari {previewRows.length} baris.
                                </p>
                                <button type="button" className="btn-primary" disabled={processing || selectedRows.length === 0} onClick={handleProcess}>
                                    {processing ? 'Memproses...' : 'Proses Terpilih'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {showSuccess && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                        <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowSuccess(false)} />
                        <div className="relative w-full max-w-lg rounded-3xl border border-emerald-200/30 bg-[linear-gradient(150deg,rgba(15,23,42,0.97),rgba(8,15,28,0.95))] p-6 text-slate-100 shadow-2xl">
                            <div className="flex items-start gap-4">
                                <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-200 ring-1 ring-emerald-400/40">
                                    <CheckIcon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-black">Import selesai</h4>
                                    <p className="mt-1 text-sm text-slate-200/80">Data yang berhasil terimport akan langsung muncul di daftar mahasiswa.</p>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button className="btn-outline" type="button" onClick={() => setShowSuccess(false)}>
                                            Tutup
                                        </button>
                                        <button className="btn-primary" type="button" onClick={() => { setShowSuccess(false); onClose(); }}>
                                            Selesai
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

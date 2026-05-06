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

export default function ImportModal({ show, onClose, templateUrl }) {
    const [file, setFile] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [previewToken, setPreviewToken] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [importSummary, setImportSummary] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!show) {
            setFile(null);
            setPreviewRows([]);
            setPreviewToken(null);
            setSelectedRows([]);
            setImportSummary(null);
            setShowSuccess(false);
            setError(null);
            setCurrentPage(1);
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
            const response = await axios.post(route('dosen.import.preview'), formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
            });
            setPreviewRows(response.data.previewRows);
            setPreviewToken(response.data.previewToken);
            setImportSummary(response.data.importSummary);
            setSelectedRows(response.data.previewRows.filter(r => r.result === 'ready').map(r => r.row_number));
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal membaca file Excel.');
        } finally {
            setProcessing(false);
        }
    };

    const handleProcess = async () => {
        if (!previewToken || selectedRows.length === 0) return;

        setProcessing(true);
        setError(null);

        try {
            const response = await axios.post(route('dosen.import.process'), {
                preview_token: previewToken,
                selected_rows: selectedRows
            }, {
                headers: { 'Accept': 'application/json' }
            });
            
            setPreviewRows(response.data.previewRows);
            setImportSummary(response.data.importSummary);
            setShowSuccess(true);
            
            // Refresh main list after success
            router.reload({ only: ['dosens', 'summary'] });
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memproses import.');
        } finally {
            setProcessing(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => !processing && onClose()} />
            
            <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">Import Data Dosen</h3>
                        <p className="text-xs font-semibold text-slate-500">Upload file Excel untuk menambah data secara massal</p>
                    </div>
                    <button 
                        onClick={() => !processing && onClose()}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    {/* Step 1: Upload */}
                    {!previewToken && (
                        <div className="flex flex-col items-center justify-center space-y-6 py-10">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 text-sky-500 shadow-inner">
                                <FileIcon className="h-10 w-10" />
                            </div>
                            <div className="text-center">
                                <h4 className="text-lg font-bold text-slate-900">Siapkan File Excel Anda</h4>
                                <p className="mt-1 text-sm text-slate-500">Gunakan template yang tersedia agar data terbaca dengan benar.</p>
                            </div>
                            
                            <div className="flex w-full max-w-md flex-col gap-3">
                                <a 
                                    href={templateUrl} 
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <FileIcon className="h-4 w-4" />
                                    Download Template Excel
                                </a>
                                
                                <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition hover:border-sky-400 hover:bg-sky-50/30">
                                    <input 
                                        type="file" 
                                        className="sr-only" 
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col items-center">
                                        <p className="text-sm font-bold text-slate-700">
                                            {file ? file.name : 'Pilih File Excel'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">Klik untuk mencari file atau drag & drop</p>
                                    </div>
                                </label>

                                {error && <p className="text-center text-xs font-bold text-rose-500">{error}</p>}

                                <button 
                                    onClick={handlePreview}
                                    disabled={!file || processing}
                                    className="btn-primary mt-2 py-3 shadow-lg shadow-sky-200"
                                >
                                    {processing ? 'Membaca data...' : 'Preview Data'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview & Process */}
                    {previewToken && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
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

                            {/* Table */}
                            <div className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-xs">
                                        <thead className="bg-slate-50/80 backdrop-blur">
                                            <tr className="text-slate-500">
                                                <th className="px-4 py-3">
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                        checked={previewRows.filter(r => r.result !== 'success').length > 0 && previewRows.filter(r => r.result !== 'success').every(r => selectedRows.includes(r.row_number))}
                                                        onChange={toggleAll}
                                                    />
                                                </th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Baris</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">NIDN</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Nama</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 font-bold uppercase tracking-wider">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedRows.map((row) => {
                                                const isSuccess = row.result === 'success';
                                                const isError = row.result === 'blocked' || row.result === 'failed';
                                                return (
                                                    <tr 
                                                        key={row.row_number} 
                                                        className={`transition-colors duration-500 ${isSuccess ? 'bg-emerald-50/80' : isError ? 'bg-rose-50/40' : 'hover:bg-slate-50'}`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:opacity-30"
                                                                checked={selectedRows.includes(row.row_number)}
                                                                disabled={isSuccess}
                                                                onChange={() => toggleRow(row.row_number)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-slate-400">{row.row_number}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-700">{row.nidn}</td>
                                                        <td className="px-4 py-3 font-semibold text-slate-600">{row.nama}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${resultTone[row.result] || resultTone.ready}`}>
                                                                {row.result_label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500">
                                                            {row.issues?.length ? row.issues.join(', ') : isSuccess ? 'Berhasil diimport' : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Halaman {currentPage} dari {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Sebelumnya
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {previewToken && (
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
                        <p className="text-xs font-bold text-slate-500">
                            {selectedRows.length} baris dipilih untuk diproses
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setPreviewToken(null)}
                                className="btn-outline px-6 py-2.5"
                                disabled={processing}
                            >
                                Ganti File
                            </button>
                            <button 
                                onClick={handleProcess}
                                disabled={processing || selectedRows.length === 0}
                                className="btn-primary flex min-w-40 items-center justify-center gap-2 px-8 py-2.5 shadow-lg shadow-sky-200"
                            >
                                {processing ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="h-4 w-4" />
                                        Proses Import
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Overlay */}
            {showSuccess && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setShowSuccess(false)} />
                    <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                            <CheckIcon className="h-8 w-8" />
                        </div>
                        <h4 className="mt-5 text-xl font-black text-slate-900">Import Selesai!</h4>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                            {importSummary?.created || 0} data dosen telah berhasil ditambahkan ke dalam sistem.
                        </p>
                        
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <div className="rounded-2xl bg-slate-50 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gagal</p>
                                <p className="text-lg font-black text-slate-900">{importSummary?.failed || 0}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dilewati</p>
                                <p className="text-lg font-black text-slate-900">{importSummary?.skipped || 0}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowSuccess(false)}
                            className="btn-primary mt-8 w-full py-3"
                        >
                            Tutup & Tinjau Data
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

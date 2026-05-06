import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

function gradeFromScore(score) {
    const value = Number(score);
    if (Number.isNaN(value)) return null;
    if (value >= 85) return { huruf: 'A', bobot: 4.0 };
    if (value >= 80) return { huruf: 'A-', bobot: 3.75 };
    if (value >= 75) return { huruf: 'B+', bobot: 3.5 };
    if (value >= 70) return { huruf: 'B', bobot: 3.0 };
    if (value >= 65) return { huruf: 'B-', bobot: 2.75 };
    if (value >= 60) return { huruf: 'C+', bobot: 2.5 };
    if (value >= 55) return { huruf: 'C', bobot: 2.0 };
    if (value >= 50) return { huruf: 'D', bobot: 1.0 };
    return { huruf: 'E', bobot: 0.0 };
}

function formatTime(value) {
    if (!value) return '-';
    return value.slice(0, 5);
}

export default function Page({ auth, tahunAktif, kelasList = [], selectedKelas, selectedKelasId }) {
    const { menu, flash, errors } = usePage().props;
    const [rows, setRows] = useState([]);
    const [confirmingPublish, setConfirmingPublish] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const nextRows = (selectedKelas?.details || []).map((detail) => ({
            krs_detail_id: detail.id,
            nilai_angka: detail.nilai?.nilai_angka ?? '',
        }));
        setRows(nextRows);
    }, [selectedKelas?.id]);

    const totalStats = useMemo(() => {
        return kelasList.reduce(
            (acc, kelas) => ({
                kelas: acc.kelas + 1,
                mahasiswa: acc.mahasiswa + (kelas.total_mahasiswa || 0),
                publish: acc.publish + (kelas.sudah_publish || 0),
            }),
            { kelas: 0, mahasiswa: 0, publish: 0 },
        );
    }, [kelasList]);

    const setScore = (detailId, value) => {
        setRows((current) => current.map((row) => (row.krs_detail_id === detailId ? { ...row, nilai_angka: value } : row)));
    };

    const selectKelas = (kelasId) => {
        router.get(route('dosen.nilai'), { kelas: kelasId }, { preserveScroll: true, preserveState: false, replace: true });
    };

    const saveDraft = (e) => {
        e.preventDefault();
        if (!selectedKelas?.id) return;
        router.post(route('dosen.nilai.store', selectedKelas.id), { rows }, { preserveScroll: true, preserveState: false });
    };

    const confirmPublish = () => {
        setConfirmingPublish(true);
    };

    const handlePublish = () => {
        if (!selectedKelas?.id) return;
        setProcessing(true);
        router.patch(route('dosen.nilai.publish', selectedKelas.id), {}, {
            preserveScroll: true,
            preserveState: false,
            onFinish: () => {
                setProcessing(false);
                setConfirmingPublish(false);
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">Dosen - Input Nilai</h2>}>
            <Head title="Dosen - Input Nilai" />

            <ConfirmationModal
                show={confirmingPublish}
                onClose={() => setConfirmingPublish(false)}
                onConfirm={handlePublish}
                title="Publish Nilai"
                message="Apakah Anda yakin ingin mempublikasikan nilai kelas ini? Setelah dipublish, nilai akan muncul di KHS mahasiswa dan tidak dapat diubah lagi secara mandiri."
                confirmText="Ya, Publish Nilai"
                processing={processing}
            />

            <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="panel p-4">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-4 text-white shadow-xl">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-sky-200">Tahun Akademik Aktif</p>
                        <p className="mt-2 text-lg font-extrabold">{tahunAktif?.kode || '-'}</p>
                        <p className="text-sm text-slate-300">Semester {tahunAktif?.semester_aktif || '-'}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="rounded-xl bg-slate-50 px-2 py-3">
                            <p className="text-slate-500">Kelas</p>
                            <p className="text-base font-extrabold text-slate-900">{totalStats.kelas}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-3">
                            <p className="text-slate-500">Mahasiswa</p>
                            <p className="text-base font-extrabold text-slate-900">{totalStats.mahasiswa}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-3">
                            <p className="text-slate-500">Publish</p>
                            <p className="text-base font-extrabold text-slate-900">{totalStats.publish}</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {(kelasList || []).map((kelas) => {
                            const active = Number(selectedKelasId) === Number(kelas.id);
                            return (
                                <button
                                    key={kelas.id}
                                    type="button"
                                    onClick={() => selectKelas(kelas.id)}
                                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
                                        active
                                            ? 'border-sky-300 bg-sky-50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900">
                                                {kelas.mata_kuliah?.kode || '-'} - {kelas.mata_kuliah?.nama || '-'}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                {kelas.kode_kelas || '-'} | {kelas.dosen?.nama || '-'}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                {kelas.total_mahasiswa || 0} mahasiswa | {kelas.sudah_publish || 0} publish
                                            </p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {kelas.mata_kuliah?.sks || 0} SKS
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                        {!kelasList.length && (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                Tidak ada kelas ajar yang tersedia.
                            </div>
                        )}
                    </div>
                </aside>

                <main className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-900">Workspace Penilaian</p>
                            <p className="text-xs text-slate-600">
                                {selectedKelas ? `${selectedKelas.mata_kuliah?.kode || '-'} - ${selectedKelas.mata_kuliah?.nama || '-'}` : 'Pilih kelas untuk mulai input nilai'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <a href={selectedKelas?.id ? route('dosen.nilai.pdf', selectedKelas.id) : '#'} className={`btn-outline ${!selectedKelas ? 'pointer-events-none opacity-50' : ''}`}>
                                Download PDF
                            </a>
                            <button type="button" onClick={saveDraft} className="btn-outline" disabled={!selectedKelas}>
                                Simpan Draft
                            </button>
                            <button type="button" onClick={confirmPublish} className="btn-primary" disabled={!selectedKelas}>
                                Publish Nilai
                            </button>
                        </div>
                    </div>

                    {flash?.success && <p className="mt-3 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}
                    {errors?.publish && <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">{errors.publish}</p>}

                    {selectedKelas ? (
                        <>
                            <div className="mt-4 grid gap-3 text-xs md:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                    <p className="text-slate-500">Kode Kelas</p>
                                    <p className="mt-1 font-bold text-slate-900">{selectedKelas.kode_kelas || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                    <p className="text-slate-500">Dosen</p>
                                    <p className="mt-1 font-bold text-slate-900">{selectedKelas.dosen?.nama || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                    <p className="text-slate-500">Ruang</p>
                                    <p className="mt-1 font-bold text-slate-900">{selectedKelas.ruangan || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                    <p className="text-slate-500">Jadwal</p>
                                    <p className="mt-1 font-bold text-slate-900">
                                        {(selectedKelas.jadwal || [])
                                            .map((item) => `${item.hari_ke} ${formatTime(item.jam_mulai)}-${formatTime(item.jam_selesai)}`)
                                            .join(' / ') || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                            <th className="px-2 py-2">NIM</th>
                                            <th className="px-2 py-2">Mahasiswa</th>
                                            <th className="px-2 py-2">Prodi</th>
                                            <th className="px-2 py-2">SKS</th>
                                            <th className="px-2 py-2">Nilai Angka</th>
                                            <th className="px-2 py-2">Huruf</th>
                                            <th className="px-2 py-2">Bobot</th>
                                            <th className="px-2 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedKelas.details?.map((detail) => {
                                            const row = rows.find((item) => Number(item.krs_detail_id) === Number(detail.id));
                                            const preview = gradeFromScore(row?.nilai_angka);
                                            const published = Boolean(detail.nilai?.published_at);

                                            return (
                                                <tr key={detail.id} className="border-b border-slate-100 align-top">
                                                    <td className="px-2 py-2 font-semibold text-slate-700">{detail.mahasiswa?.nim || '-'}</td>
                                                    <td className="px-2 py-2 text-slate-700">{detail.mahasiswa?.nama || '-'}</td>
                                                    <td className="px-2 py-2 text-slate-600">{detail.mahasiswa?.prodi || '-'}</td>
                                                    <td className="px-2 py-2 text-slate-600">{detail.sks || 0}</td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            className="form-input w-28"
                                                            value={row?.nilai_angka ?? ''}
                                                            onChange={(e) => setScore(detail.id, e.target.value)}
                                                            placeholder="0-100"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                                                            {preview?.huruf || detail.nilai?.nilai_huruf || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                                                            {preview?.bobot ?? detail.nilai?.bobot ?? '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        {!detail.nilai ? (
                                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">Belum Input</span>
                                                        ) : published ? (
                                                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Final</span>
                                                        ) : (
                                                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">Draft</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {!selectedKelas.details?.length && (
                                            <tr>
                                                <td className="px-2 py-4 text-slate-500" colSpan="8">
                                                    Belum ada mahasiswa pada kelas ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            Belum ada kelas yang dipilih.
                        </div>
                    )}
                </main>
            </div>
        </AuthenticatedLayout>
    );
}

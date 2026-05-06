import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

function formatTime(value) {
    if (!value) return '-';
    return value.slice(0, 5);
}

function statusBadge(status) {
    if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
    if (status === 'submitted') return 'bg-sky-100 text-sky-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-600';
}

export default function Page({ auth, mahasiswa, tahunAktif, kelasAktif = [], currentKrs, historyKrs = [], maxSks = 24, pesan }) {
    const { menu, flash, errors } = usePage().props;
    const initialIds = currentKrs?.kelas_ids || [];
    const [search, setSearch] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('all');
    const [confirmingSubmit, setConfirmingSubmit] = useState(false);
    const [processing, setProcessing] = useState(false);

    const form = useForm({
        mahasiswa_id: mahasiswa?.id || '',
        kelas_ids: initialIds,
        catatan: currentKrs?.catatan || '',
    });

    useEffect(() => {
        form.setData({
            mahasiswa_id: mahasiswa?.id || '',
            kelas_ids: currentKrs?.kelas_ids || [],
            catatan: currentKrs?.catatan || '',
        });
    }, [currentKrs?.id, mahasiswa?.id]);

    const selectedClasses = useMemo(
        () => kelasAktif.filter((kelas) => form.data.kelas_ids.includes(kelas.id)),
        [kelasAktif, form.data.kelas_ids],
    );
    const semesterOptions = useMemo(
        () => [...new Set(kelasAktif.map((kelas) => String(kelas.semester_akademik)).filter(Boolean))].sort((a, b) => Number(a) - Number(b)),
        [kelasAktif],
    );
    const filteredKelas = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return kelasAktif.filter((kelas) => {
            const matchesSemester = semesterFilter === 'all' || String(kelas.semester_akademik) === semesterFilter;
            const haystack = [
                kelas.kode_kelas,
                kelas.mata_kuliah?.kode,
                kelas.mata_kuliah?.nama,
                kelas.dosen,
                kelas.ruang,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return matchesSemester && (!keyword || haystack.includes(keyword));
        });
    }, [kelasAktif, search, semesterFilter]);

    const totalSks = useMemo(
        () => selectedClasses.reduce((sum, kelas) => sum + Number(kelas.mata_kuliah?.sks || 0), 0),
        [selectedClasses],
    );

    const toggleClass = (kelasId) => {
        const exists = form.data.kelas_ids.includes(kelasId);
        form.setData('kelas_ids', exists ? form.data.kelas_ids.filter((id) => id !== kelasId) : [...form.data.kelas_ids, kelasId]);
    };

    const saveDraft = (e) => {
        e.preventDefault();
        form.post(route('krs.store'), { preserveScroll: true });
    };

    const confirmKrsSubmit = () => {
        setConfirmingSubmit(true);
    };

    const handleKrsSubmit = () => {
        if (!currentKrs?.id) return;
        setProcessing(true);
        router.patch(route('krs.submit', currentKrs.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setConfirmingSubmit(false);
            }
        });
    };

    const canSubmit = currentKrs && ['draft', 'rejected'].includes(currentKrs.status);

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">Mahasiswa - KRS</h2>}>
            <Head title="Mahasiswa - KRS" />

            <ConfirmationModal
                show={confirmingSubmit}
                onClose={() => setConfirmingSubmit(false)}
                onConfirm={handleKrsSubmit}
                title="Submit KRS"
                message="Apakah Anda yakin ingin mensubmit KRS sekarang? Setelah disubmit, Anda tidak dapat mengubah pilihan mata kuliah lagi secara mandiri."
                confirmText="Ya, Submit KRS"
                processing={processing}
            />

            <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="panel p-4">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 p-4 text-white shadow-xl">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200">Profil Akademik</p>
                        <p className="mt-2 text-lg font-extrabold">{mahasiswa?.nama || '-'}</p>
                        <p className="text-xs text-slate-300">{mahasiswa?.nim || '-'} | {mahasiswa?.prodi || '-'}</p>
                        <p className="mt-3 text-xs text-slate-300">Tahun aktif: {tahunAktif?.kode || '-'}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[11px]">
                        <div className="rounded-xl bg-slate-50 px-2 py-3">
                            <p className="text-slate-500">Kelas Dipilih</p>
                            <p className="text-base font-extrabold text-slate-900">{form.data.kelas_ids.length}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-3">
                            <p className="text-slate-500">Total SKS</p>
                            <p className={`text-base font-extrabold ${totalSks > maxSks ? 'text-rose-600' : 'text-slate-900'}`}>{totalSks}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900">KRS Aktif</p>
                            {currentKrs?.status && (
                                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusBadge(currentKrs.status)}`}>
                                    {currentKrs.status}
                                </span>
                            )}
                        </div>

                        {currentKrs ? (
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                                <p className="text-slate-600">{currentKrs.tahun_akademik} | Semester {currentKrs.semester_akademik}</p>
                                <p className="mt-1 font-semibold text-slate-800">{currentKrs.total_sks} SKS | {currentKrs.details?.length || 0} mata kuliah</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link href={route('krs.show', currentKrs.id)} className="btn-outline">
                                        Lihat Detail
                                    </Link>
                                    <button type="button" onClick={confirmKrsSubmit} className="btn-primary" disabled={!canSubmit}>
                                        Submit KRS
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                Belum ada KRS untuk semester aktif.
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <p className="text-sm font-bold text-slate-900">Riwayat KRS</p>
                        <div className="mt-2 space-y-2">
                            {historyKrs.map((item) => (
                                <Link key={item.id} href={route('krs.show', item.id)} className="block rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs hover:border-sky-200 hover:bg-slate-50">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-bold text-slate-900">{item.tahun_akademik}</p>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusBadge(item.status)}`}>{item.status}</span>
                                    </div>
                                    <p className="mt-1 text-slate-500">Semester {item.semester_akademik} | {item.total_sks} SKS | {item.matkul_count} matkul</p>
                                </Link>
                            ))}
                            {!historyKrs.length && <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">Belum ada riwayat KRS.</p>}
                        </div>
                    </div>
                </aside>

                <main className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-900">Ambil Mata Kuliah</p>
                            <p className="text-xs text-slate-600">Pilih kelas untuk semester aktif, simpan draft, lalu submit saat siap</p>
                        </div>
                        <button type="button" onClick={saveDraft} className="btn-primary" disabled={!mahasiswa || !tahunAktif || form.processing}>
                            Simpan Draft
                        </button>
                    </div>

                    {flash?.success && <p className="mt-3 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</p>}
                    {pesan && <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">{pesan}</p>}
                    {(errors?.kelas_ids || errors?.status || errors?.tahun) && (
                        <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">
                            {errors.kelas_ids || errors.status || errors.tahun}
                        </p>
                    )}

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="overflow-x-auto">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                                <input
                                    className="form-input"
                                    placeholder="Cari kode, mata kuliah, dosen, ruang"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <select className="form-input sm:max-w-[180px]" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
                                    <option value="all">Semua semester</option>
                                    {semesterOptions.map((semester) => (
                                        <option key={semester} value={semester}>Semester {semester}</option>
                                    ))}
                                </select>
                            </div>
                            <table className="min-w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="px-2 py-2">Pilih</th>
                                        <th className="px-2 py-2">Kode</th>
                                        <th className="px-2 py-2">Mata Kuliah</th>
                                        <th className="px-2 py-2">SKS</th>
                                        <th className="px-2 py-2">Dosen</th>
                                        <th className="px-2 py-2">Ruang</th>
                                        <th className="px-2 py-2">Jadwal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredKelas.map((kelas) => {
                                        const checked = form.data.kelas_ids.includes(kelas.id);
                                        return (
                                            <tr key={kelas.id} className="border-b border-slate-100 align-top">
                                                <td className="px-2 py-2">
                                                    <input type="checkbox" checked={checked} onChange={() => toggleClass(kelas.id)} />
                                                </td>
                                                <td className="px-2 py-2 font-semibold text-slate-700">{kelas.mata_kuliah?.kode || '-'}</td>
                                                <td className="px-2 py-2 text-slate-700">
                                                    {kelas.mata_kuliah?.nama || '-'}
                                                    <p className="mt-1 text-[11px] text-slate-500">{kelas.kode_kelas || '-'}</p>
                                                </td>
                                                <td className="px-2 py-2 text-slate-600">{kelas.mata_kuliah?.sks || 0}</td>
                                                <td className="px-2 py-2 text-slate-600">{kelas.dosen || '-'}</td>
                                                <td className="px-2 py-2 text-slate-600">{kelas.ruang || '-'}</td>
                                                <td className="px-2 py-2 text-slate-600">
                                                    {(kelas.jadwal || []).map((item, index) => (
                                                        <p key={`${kelas.id}-${index}`}>{item.hari_ke} {formatTime(item.jam_mulai)}-{formatTime(item.jam_selesai)}</p>
                                                    ))}
                                                    {!kelas.jadwal?.length && '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!filteredKelas.length && (
                                        <tr>
                                            <td className="px-2 py-4 text-slate-500" colSpan="7">Tidak ada kelas yang cocok dengan filter.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-bold text-slate-900">Ringkasan Draft</p>
                            <p className="mt-1 text-xs text-slate-600">Batas maksimal {maxSks} SKS per semester</p>

                            <div className="mt-3 space-y-2">
                                {selectedClasses.map((kelas) => (
                                    <div key={kelas.id} className="rounded-xl bg-white px-3 py-3 text-xs shadow-sm">
                                        <p className="font-semibold text-slate-800">{kelas.mata_kuliah?.kode || '-'} - {kelas.mata_kuliah?.nama || '-'}</p>
                                        <p className="mt-1 text-slate-500">{kelas.mata_kuliah?.sks || 0} SKS | {kelas.dosen || '-'}</p>
                                    </div>
                                ))}
                                {!selectedClasses.length && <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">Belum ada kelas dipilih.</p>}
                            </div>

                            <textarea
                                className="form-input mt-3"
                                rows="4"
                                placeholder="Catatan untuk wali akademik / BAAK"
                                value={form.data.catatan}
                                onChange={(e) => form.setData('catatan', e.target.value)}
                            />

                            <div className="mt-4 rounded-xl bg-white px-3 py-3 text-sm">
                                <p className="text-slate-500">Total SKS</p>
                                <p className={`mt-1 text-2xl font-extrabold ${totalSks > maxSks ? 'text-rose-600' : 'text-slate-900'}`}>{totalSks}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}

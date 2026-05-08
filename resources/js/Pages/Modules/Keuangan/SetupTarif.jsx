import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import ConfirmationModal from '@/Components/ConfirmationModal';
import EmptyState from '../Akademik/EmptyState';
import { ActionIcon, FieldError, IconButton, StatusBadge } from '../Akademik/CrudParts';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Fragment, useEffect, useMemo, useState } from 'react';

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function RowActions({ onDeleteTarif, hasTarif }) {
    if (!hasTarif) return null;
    return (
        <IconButton variant="danger" label="Hapus tarif" onClick={onDeleteTarif}>
            <ActionIcon name="trash" />
        </IconButton>
    );
}

export default function Page({ auth, filters = null, tahunAkademiks = [], jenisTagihans = [], tarifsByJenisId = {} }) {
    const { menu, flash } = usePage().props;

    const [tahunAkademik, setTahunAkademik] = useState(filters?.tahun_akademik || '');
    const [semesterAkademik, setSemesterAkademik] = useState(String(filters?.semester_akademik || 1));

    const [showJenisModal, setShowJenisModal] = useState(false);
    const [editingJenis, setEditingJenis] = useState(null);
    const [confirmingJenisDeletion, setConfirmingJenisDeletion] = useState(false);
    const [jenisToDelete, setJenisToDelete] = useState(null);

    const [confirmingTarifDeletion, setConfirmingTarifDeletion] = useState(false);
    const [tarifToDelete, setTarifToDelete] = useState(null);

    const jenisForm = useForm({ kode: '', nama: '', sort_order: 0, is_active: true, keterangan: '' });
    const jenisEdit = useForm({ kode: '', nama: '', sort_order: 0, is_active: true, keterangan: '' });
    const deleteForm = useForm();

    const tarifForm = useForm({
        jenis_tagihan_id: null,
        tahun_akademik: '',
        semester_akademik: 1,
        nominal: 0,
        keterangan: '',
        is_active: true,
        can_installment: false,
        installment_max: 6,
        installment_default: 6,
    });

    const [drafts, setDrafts] = useState({});

    useEffect(() => {
        const next = {};
        (jenisTagihans || []).forEach((jenis) => {
            const existing = tarifsByJenisId?.[jenis.id] || null;
            next[jenis.id] = {
                nominal: existing?.nominal ?? '',
                is_active: existing?.is_active ?? true,
                keterangan: existing?.keterangan ?? '',
                can_installment: existing?.can_installment ?? false,
                installment_max: existing?.installment_max ?? 6,
                installment_default: existing?.installment_default ?? 6,
                tarif_id: existing?.id ?? null,
            };
        });
        setDrafts(next);
    }, [jenisTagihans, tarifsByJenisId]);

    useEffect(() => {
        if (!editingJenis) return;
        jenisEdit.setData({
            kode: editingJenis.kode || '',
            nama: editingJenis.nama || '',
            sort_order: editingJenis.sort_order ?? 0,
            is_active: !!editingJenis.is_active,
            keterangan: editingJenis.keterangan || '',
        });
    }, [editingJenis]); // eslint-disable-line react-hooks/exhaustive-deps

    const activeTahunOptions = useMemo(() => tahunAkademiks || [], [tahunAkademiks]);

    const applyPeriod = () => {
        router.get(
            route('keuangan.setup.index'),
            { tahun_akademik: tahunAkademik, semester_akademik: semesterAkademik },
            { preserveScroll: true, preserveState: true }
        );
    };

    const submitJenis = (e) => {
        e.preventDefault();
        jenisForm.post(route('keuangan.setup.jenis-tagihan.store'), {
            preserveScroll: true,
            onSuccess: () => {
                jenisForm.reset('kode', 'nama', 'keterangan');
                setShowJenisModal(false);
            },
        });
    };

    const submitEditJenis = (e) => {
        e.preventDefault();
        if (!editingJenis) return;
        jenisEdit.put(route('keuangan.setup.jenis-tagihan.update', editingJenis.id), {
            preserveScroll: true,
            onSuccess: () => setEditingJenis(null),
        });
    };

    const confirmDeleteJenis = (jenis) => {
        setJenisToDelete(jenis);
        setConfirmingJenisDeletion(true);
    };

    const deleteJenis = () => {
        if (!jenisToDelete) return;
        deleteForm.delete(route('keuangan.setup.jenis-tagihan.destroy', jenisToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingJenisDeletion(false);
                setJenisToDelete(null);
            },
        });
    };

    const saveTarif = (jenisId) => {
        const draft = drafts?.[jenisId];
        if (!draft) return;
        tarifForm.setData({
            jenis_tagihan_id: jenisId,
            tahun_akademik: tahunAkademik,
            semester_akademik: Number(semesterAkademik) || 1,
            nominal: Number(draft.nominal || 0),
            keterangan: draft.keterangan || '',
            is_active: !!draft.is_active,
            can_installment: !!draft.can_installment,
            installment_max: Number(draft.installment_max || 0) || 6,
            installment_default: Number(draft.installment_default || 0) || 6,
        });
        tarifForm.post(route('keuangan.setup.tarif.store'), { preserveScroll: true });
    };

    const confirmDeleteTarif = (tarifId) => {
        setTarifToDelete(tarifId);
        setConfirmingTarifDeletion(true);
    };

    const deleteTarif = () => {
        if (!tarifToDelete) return;
        deleteForm.delete(route('keuangan.setup.tarif.destroy', tarifToDelete), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingTarifDeletion(false);
                setTarifToDelete(null);
            },
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">Setup Tarif Keuangan</h2>}>
            <Head title="Setup Tarif Keuangan" />

            <ModuleHero
                title="Setup Tarif Keuangan"
                description="Kelola jenis biaya (pendaftaran, SPP, KKN, dll) dan tarifnya per tahun akademik / semester termasuk opsi cicilan."
                note={flash?.success || flash?.error}
            />

            <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                <section className="panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Periode</p>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">Filter Tahun / Semester</h3>

                    <div className="mt-4 space-y-3">
                        <div>
                            <select className="form-input" value={tahunAkademik} onChange={(e) => setTahunAkademik(e.target.value)}>
                                <option value="">Pilih tahun akademik</option>
                                {activeTahunOptions.map((ta) => (
                                    <option key={ta.id} value={ta.kode}>
                                        {ta.kode} {ta.is_active ? '(aktif)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <input className="form-input" type="number" min="1" max="14" value={semesterAkademik} onChange={(e) => setSemesterAkademik(e.target.value)} />
                        </div>
                        <button type="button" className="btn-primary w-full" onClick={applyPeriod}>
                            Terapkan Periode
                        </button>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Master</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">Jenis Tagihan</h3>
                        </div>
                        <button type="button" className="btn-outline" onClick={() => setShowJenisModal(true)}>
                            Tambah
                        </button>
                    </div>

                    <div className="mt-4 space-y-2">
                        {(jenisTagihans || []).length ? (
                            jenisTagihans.map((jenis) => (
                                <article key={jenis.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{jenis.nama}</p>
                                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{jenis.kode}</p>
                                        </div>
                                        <StatusBadge active={!!jenis.is_active} />
                                    </div>
                                    <div className="mt-2 flex items-center justify-end gap-2">
                                        <IconButton variant="neutral" label="Edit jenis tagihan" onClick={() => setEditingJenis(jenis)}>
                                            <ActionIcon name="edit" />
                                        </IconButton>
                                        <IconButton variant="danger" label="Hapus jenis tagihan" onClick={() => confirmDeleteJenis(jenis)}>
                                            <ActionIcon name="trash" />
                                        </IconButton>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <EmptyState title="Belum ada jenis tagihan" description="Tambahkan jenis biaya (mis. PENDAFTARAN, SPP, KKN) untuk mulai membuat tarif per periode." />
                        )}
                    </div>
                </section>

                <section className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tarif</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">
                                Tarif {tahunAkademik || '-'} / {semesterAkademik || '-'}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">Isi nominal dan opsi cicilan, lalu simpan per baris.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{(jenisTagihans || []).length} jenis</span>
                    </div>

                    <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-white">
                        <div className="min-w-[980px] divide-y divide-slate-200">
                            <div className="grid grid-cols-[220px_140px_120px_160px_160px_120px] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                <div>Jenis</div>
                                <div>Nominal</div>
                                <div>Status</div>
                                <div>Cicilan</div>
                                <div>Catatan</div>
                                <div className="text-right">Aksi</div>
                            </div>

                            {(jenisTagihans || []).map((jenis) => {
                                const draft = drafts?.[jenis.id] || {};
                                const hasTarif = !!draft?.tarif_id;

                                return (
                                    <div key={jenis.id} className="grid grid-cols-[220px_140px_120px_160px_160px_120px] items-start gap-3 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{jenis.nama}</p>
                                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{jenis.kode}</p>
                                            {hasTarif ? <p className="mt-2 text-xs font-semibold text-slate-600">{formatRupiah(draft.nominal)}</p> : <p className="mt-2 text-xs text-slate-400">Belum ada tarif</p>}
                                        </div>

                                        <div>
                                            <input
                                                className="form-input"
                                                type="number"
                                                min="0"
                                                value={draft.nominal ?? ''}
                                                onChange={(e) => setDrafts((prev) => ({ ...prev, [jenis.id]: { ...prev[jenis.id], nominal: e.target.value } }))}
                                            />
                                            {tarifForm.errors.nominal && tarifForm.data.jenis_tagihan_id === jenis.id && <FieldError message={tarifForm.errors.nominal} />}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={!!draft.is_active}
                                                    onChange={(e) => setDrafts((prev) => ({ ...prev, [jenis.id]: { ...prev[jenis.id], is_active: e.target.checked } }))}
                                                />
                                                Aktif
                                            </label>
                                            {tarifForm.errors.is_active && tarifForm.data.jenis_tagihan_id === jenis.id && <FieldError message={tarifForm.errors.is_active} />}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={!!draft.can_installment}
                                                    onChange={(e) => setDrafts((prev) => ({ ...prev, [jenis.id]: { ...prev[jenis.id], can_installment: e.target.checked } }))}
                                                />
                                                Bisa dicicil
                                            </label>
                                            {draft.can_installment ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        className="form-input"
                                                        type="number"
                                                        min="2"
                                                        max="24"
                                                        placeholder="Max"
                                                        value={draft.installment_max ?? 6}
                                                        onChange={(e) =>
                                                            setDrafts((prev) => ({ ...prev, [jenis.id]: { ...prev[jenis.id], installment_max: e.target.value } }))
                                                        }
                                                    />
                                                    <input
                                                        className="form-input"
                                                        type="number"
                                                        min="1"
                                                        max="24"
                                                        placeholder="Default"
                                                        value={draft.installment_default ?? 6}
                                                        onChange={(e) =>
                                                            setDrafts((prev) => ({ ...prev, [jenis.id]: { ...prev[jenis.id], installment_default: e.target.value } }))
                                                        }
                                                    />
                                                </div>
                                            ) : null}
                                            {tarifForm.data.jenis_tagihan_id === jenis.id ? (
                                                <Fragment>
                                                    <FieldError message={tarifForm.errors.can_installment} />
                                                    <FieldError message={tarifForm.errors.installment_max} />
                                                    <FieldError message={tarifForm.errors.installment_default} />
                                                </Fragment>
                                            ) : null}
                                        </div>

                                        <div>
                                            <input
                                                className="form-input"
                                                placeholder="Keterangan (opsional)"
                                                value={draft.keterangan ?? ''}
                                                onChange={(e) => setDrafts((prev) => ({ ...prev, [jenis.id]: { ...prev[jenis.id], keterangan: e.target.value } }))}
                                            />
                                            {tarifForm.errors.keterangan && tarifForm.data.jenis_tagihan_id === jenis.id && <FieldError message={tarifForm.errors.keterangan} />}
                                        </div>

                                        <div className="flex items-center justify-end gap-2">
                                            <button type="button" className="btn-primary" onClick={() => saveTarif(jenis.id)} disabled={tarifForm.processing}>
                                                {tarifForm.processing && tarifForm.data.jenis_tagihan_id === jenis.id ? 'Menyimpan...' : 'Simpan'}
                                            </button>
                                            <RowActions onDeleteTarif={() => confirmDeleteTarif(draft.tarif_id)} hasTarif={hasTarif} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            <Modal show={showJenisModal} onClose={() => setShowJenisModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-black text-slate-900">Tambah Jenis Tagihan</h2>
                    <p className="mt-1 text-sm text-slate-600">Contoh: PENDAFTARAN, SPP, KKN, PKL, PPL, SEMPRO, WISUDA.</p>

                    <form onSubmit={submitJenis} className="mt-4 space-y-3">
                        <div>
                            <input className="form-input" placeholder="Kode (mis. SPP)" value={jenisForm.data.kode} onChange={(e) => jenisForm.setData('kode', e.target.value)} />
                            <FieldError message={jenisForm.errors.kode} />
                        </div>
                        <div>
                            <input className="form-input" placeholder="Nama (mis. SPP Per Semester)" value={jenisForm.data.nama} onChange={(e) => jenisForm.setData('nama', e.target.value)} />
                            <FieldError message={jenisForm.errors.nama} />
                        </div>
                        <div>
                            <textarea
                                className="form-input min-h-[90px]"
                                placeholder="Keterangan (opsional)"
                                value={jenisForm.data.keterangan}
                                onChange={(e) => jenisForm.setData('keterangan', e.target.value)}
                            />
                            <FieldError message={jenisForm.errors.keterangan} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="form-input"
                                type="number"
                                min="0"
                                value={jenisForm.data.sort_order}
                                onChange={(e) => jenisForm.setData('sort_order', Number(e.target.value || 0))}
                            />
                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                <input type="checkbox" checked={jenisForm.data.is_active} onChange={(e) => jenisForm.setData('is_active', e.target.checked)} />
                                Aktif
                            </label>
                        </div>
                        <div className="flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => setShowJenisModal(false)}>
                                Batal
                            </SecondaryButton>
                            <button className="btn-primary" type="submit" disabled={jenisForm.processing}>
                                {jenisForm.processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal show={!!editingJenis} onClose={() => setEditingJenis(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-black text-slate-900">Edit Jenis Tagihan</h2>
                    <form onSubmit={submitEditJenis} className="mt-4 space-y-3">
                        <div>
                            <input className="form-input" placeholder="Kode" value={jenisEdit.data.kode} onChange={(e) => jenisEdit.setData('kode', e.target.value)} />
                            <FieldError message={jenisEdit.errors.kode} />
                        </div>
                        <div>
                            <input className="form-input" placeholder="Nama" value={jenisEdit.data.nama} onChange={(e) => jenisEdit.setData('nama', e.target.value)} />
                            <FieldError message={jenisEdit.errors.nama} />
                        </div>
                        <div>
                            <textarea className="form-input min-h-[90px]" placeholder="Keterangan" value={jenisEdit.data.keterangan} onChange={(e) => jenisEdit.setData('keterangan', e.target.value)} />
                            <FieldError message={jenisEdit.errors.keterangan} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="form-input"
                                type="number"
                                min="0"
                                value={jenisEdit.data.sort_order}
                                onChange={(e) => jenisEdit.setData('sort_order', Number(e.target.value || 0))}
                            />
                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                <input type="checkbox" checked={jenisEdit.data.is_active} onChange={(e) => jenisEdit.setData('is_active', e.target.checked)} />
                                Aktif
                            </label>
                        </div>
                        <div className="flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => setEditingJenis(null)}>
                                Batal
                            </SecondaryButton>
                            <button className="btn-primary" type="submit" disabled={jenisEdit.processing}>
                                {jenisEdit.processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmationModal
                show={confirmingJenisDeletion}
                onClose={() => setConfirmingJenisDeletion(false)}
                title="Hapus Jenis Tagihan"
                message={`Hapus jenis tagihan ${jenisToDelete?.kode || ''}? Data tarif terkait akan ikut hilang (soft delete).`}
                onConfirm={deleteJenis}
                processing={deleteForm.processing}
            />

            <ConfirmationModal
                show={confirmingTarifDeletion}
                onClose={() => setConfirmingTarifDeletion(false)}
                title="Hapus Tarif"
                message="Hapus tarif untuk periode ini?"
                onConfirm={deleteTarif}
                processing={deleteForm.processing}
            />
        </AuthenticatedLayout>
    );
}

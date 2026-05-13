import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import ConfirmationModal from '@/Components/ConfirmationModal';
import EmptyState from '../Akademik/EmptyState';
import { ActionIcon, FieldError, IconButton, StatusBadge } from '../Akademik/CrudParts';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Fragment, useEffect, useMemo, useState } from 'react';

const DRAFT_STORAGE_KEY = 'siakad_setup_tarif_drafts_v1';
const TABLE_PREF_STORAGE_KEY = 'siakad_setup_tarif_table_prefs_v1';

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function parseNominalInput(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return 0;
    const digitsOnly = raw.replace(/[^\d]/g, '');
    if (!digitsOnly) return 0;
    return Number(digitsOnly);
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    const [activeTarifJenisId, setActiveTarifJenisId] = useState(null);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tarifFilter, setTarifFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [sortBy, setSortBy] = useState('kode');
    const [sortDir, setSortDir] = useState('asc');
    const [isFiltering, setIsFiltering] = useState(false);
    const [compactMode, setCompactMode] = useState(false);

    const draftScopeKey = useMemo(
        () => `${tahunAkademik || '-'}::${Number(semesterAkademik) || 1}`,
        [tahunAkademik, semesterAkademik]
    );

    const baselineDrafts = useMemo(() => {
        const base = {};
        (jenisTagihans || []).forEach((jenis) => {
            const existing = tarifsByJenisId?.[jenis.id] || null;
            base[jenis.id] = {
                nominal: existing?.nominal ?? '',
                is_active: existing?.is_active ?? true,
                keterangan: existing?.keterangan ?? '',
                can_installment: existing?.can_installment ?? false,
                installment_max: existing?.installment_max ?? 6,
                installment_default: existing?.installment_default ?? 6,
                tarif_id: existing?.id ?? null,
            };
        });
        return base;
    }, [jenisTagihans, tarifsByJenisId]);

    useEffect(() => {
        const next = { ...baselineDrafts };

        try {
            const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const scoped = parsed?.[draftScopeKey] || {};
                Object.keys(scoped).forEach((jenisId) => {
                    if (!next[jenisId]) return;
                    const serverDraft = next[jenisId];
                    const localDraft = scoped[jenisId] || {};

                    // Keep persisted server identity/state authoritative.
                    // Local draft only overrides mutable input fields, never `tarif_id`.
                    next[jenisId] = {
                        ...serverDraft,
                        nominal: localDraft.nominal ?? serverDraft.nominal,
                        is_active: typeof localDraft.is_active === 'boolean' ? localDraft.is_active : serverDraft.is_active,
                        keterangan: localDraft.keterangan ?? serverDraft.keterangan,
                        can_installment: typeof localDraft.can_installment === 'boolean' ? localDraft.can_installment : serverDraft.can_installment,
                        installment_max: localDraft.installment_max ?? serverDraft.installment_max,
                        installment_default: localDraft.installment_default ?? serverDraft.installment_default,
                        tarif_id: serverDraft.tarif_id,
                    };
                });
            }
        } catch (e) {
            // ignore malformed draft payload
        }

        setDrafts(next);
    }, [baselineDrafts, draftScopeKey]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            parsed[draftScopeKey] = drafts;
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {
            // ignore localStorage write failure
        }
    }, [drafts, draftScopeKey]);

    const clearScopeDraft = () => {
        try {
            const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            delete parsed[draftScopeKey];
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {
            // ignore localStorage write failure
        }
    };

    const hasDraftChanges = useMemo(() => {
        return Object.entries(drafts || {}).some(([jenisId, d]) => {
            if (!d) return false;
            const b = baselineDrafts?.[jenisId] || {};
            return (
                String(d.nominal ?? '') !== String(b.nominal ?? '') ||
                String(d.keterangan ?? '') !== String(b.keterangan ?? '') ||
                !!d.is_active !== !!b.is_active ||
                !!d.can_installment !== !!b.can_installment ||
                Number(d.installment_max ?? 6) !== Number(b.installment_max ?? 6) ||
                Number(d.installment_default ?? 6) !== Number(b.installment_default ?? 6)
            );
        });
    }, [drafts, baselineDrafts]);

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput), 250);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(TABLE_PREF_STORAGE_KEY);
            if (!raw) return;
            const pref = JSON.parse(raw);
            if (typeof pref.searchInput === 'string') setSearchInput(pref.searchInput);
            if (typeof pref.statusFilter === 'string') setStatusFilter(pref.statusFilter);
            if (typeof pref.tarifFilter === 'string') setTarifFilter(pref.tarifFilter);
            if (typeof pref.sortBy === 'string') setSortBy(pref.sortBy);
            if (typeof pref.sortDir === 'string') setSortDir(pref.sortDir);
            if (Number.isFinite(Number(pref.perPage))) setPerPage(Number(pref.perPage));
            if (typeof pref.compactMode === 'boolean') setCompactMode(pref.compactMode);
        } catch (e) {
            // ignore invalid preference payload
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(
                TABLE_PREF_STORAGE_KEY,
                JSON.stringify({ searchInput, statusFilter, tarifFilter, sortBy, sortDir, perPage, compactMode })
            );
        } catch (e) {
            // ignore localStorage write failure
        }
    }, [searchInput, statusFilter, tarifFilter, sortBy, sortDir, perPage, compactMode]);

    useEffect(() => {
        setIsFiltering(true);
        const t = setTimeout(() => setIsFiltering(false), 180);
        return () => clearTimeout(t);
    }, [search, statusFilter, tarifFilter, perPage, sortBy, sortDir, page]);

    const filteredJenisTagihans = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        const filtered = (jenisTagihans || []).filter((jenis) => {
            const draft = drafts?.[jenis.id] || {};
            const hasTarif = !!draft?.tarif_id;
            const matchKeyword =
                keyword === '' ||
                String(jenis.nama || '').toLowerCase().includes(keyword) ||
                String(jenis.kode || '').toLowerCase().includes(keyword);
            const matchStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && !!jenis.is_active) ||
                (statusFilter === 'inactive' && !jenis.is_active);
            const matchTarif =
                tarifFilter === 'all' ||
                (tarifFilter === 'with' && hasTarif) ||
                (tarifFilter === 'without' && !hasTarif);
            return matchKeyword && matchStatus && matchTarif;
        });

        const sorted = [...filtered].sort((a, b) => {
            const draftA = drafts?.[a.id] || {};
            const draftB = drafts?.[b.id] || {};

            let va;
            let vb;
            if (sortBy === 'nama') {
                va = String(a.nama || '').toLowerCase();
                vb = String(b.nama || '').toLowerCase();
            } else if (sortBy === 'nominal') {
                va = Number(parseNominalInput(draftA.nominal));
                vb = Number(parseNominalInput(draftB.nominal));
            } else if (sortBy === 'status') {
                va = a.is_active ? 1 : 0;
                vb = b.is_active ? 1 : 0;
            } else {
                va = String(a.kode || '').toLowerCase();
                vb = String(b.kode || '').toLowerCase();
            }

            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [jenisTagihans, drafts, search, statusFilter, tarifFilter, sortBy, sortDir]);

    const totalFiltered = filteredJenisTagihans.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, tarifFilter, perPage, tahunAkademik, semesterAkademik]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const paginatedJenisTagihans = useMemo(() => {
        const start = (page - 1) * perPage;
        return filteredJenisTagihans.slice(start, start + perPage);
    }, [filteredJenisTagihans, page, perPage]);

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

    useEffect(() => {
        if (tahunAkademik || !activeTahunOptions.length) return;
        const initial = activeTahunOptions[0];
        setTahunAkademik(initial?.kode || '');
        setSemesterAkademik(String(initial?.semester_aktif || 1));
    }, [tahunAkademik, activeTahunOptions]);

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
            preserveState: 'errors',
            onSuccess: () => {
                jenisForm.reset('kode', 'nama', 'keterangan');
                clearScopeDraft();
                setShowJenisModal(false);
            },
        });
    };

    const submitEditJenis = (e) => {
        e.preventDefault();
        if (!editingJenis) return;
        jenisEdit.put(route('keuangan.setup.jenis-tagihan.update', editingJenis.id), {
            preserveScroll: true,
            preserveState: 'errors',
            onSuccess: () => {
                clearScopeDraft();
                setEditingJenis(null);
            },
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
            preserveState: 'errors',
            onSuccess: () => {
                clearScopeDraft();
                setConfirmingJenisDeletion(false);
                setJenisToDelete(null);
            },
        });
    };

    const saveTarif = (jenisId) => {
        const draft = drafts?.[jenisId];
        if (!draft) return;
        setActiveTarifJenisId(jenisId);
        if (!tahunAkademik) {
            tarifForm.setError('tahun_akademik', 'Pilih tahun akademik terlebih dahulu.');
            return;
        }
        tarifForm.clearErrors('tahun_akademik');

        const payload = {
            jenis_tagihan_id: jenisId,
            tahun_akademik: tahunAkademik,
            semester_akademik: Number(semesterAkademik) || 1,
            nominal: parseNominalInput(draft.nominal),
            keterangan: draft.keterangan || '',
            is_active: !!draft.is_active,
            can_installment: !!draft.can_installment,
            installment_max: Number(draft.installment_max || 0) || 6,
            installment_default: Number(draft.installment_default || 0) || 6,
        };

        tarifForm
            .transform(() => payload)
            .post(route('keuangan.setup.tarif.store'), {
                preserveScroll: true,
                preserveState: 'errors',
                onSuccess: () => clearScopeDraft(),
                onError: () => {
                    // Keep row marker so backend validation stays visible on the same row.
                    setActiveTarifJenisId(jenisId);
                },
                onFinish: () => tarifForm.transform((data) => data),
            });
    };

    const confirmDeleteTarif = (tarifId) => {
        setTarifToDelete(tarifId);
        setConfirmingTarifDeletion(true);
    };

    const deleteTarif = () => {
        if (!tarifToDelete) return;
        deleteForm.delete(route('keuangan.setup.tarif.destroy', tarifToDelete), {
            preserveScroll: true,
            preserveState: 'errors',
            onSuccess: () => {
                clearScopeDraft();
                setConfirmingTarifDeletion(false);
                setTarifToDelete(null);
            },
        });
    };

    const saveTarifBulk = () => {
        if (!tahunAkademik) {
            tarifForm.setError('tahun_akademik', 'Pilih tahun akademik terlebih dahulu.');
            return;
        }
        tarifForm.clearErrors('tahun_akademik');

        const items = (jenisTagihans || []).map((jenis) => {
            const draft = drafts?.[jenis.id] || {};
            return {
                jenis_tagihan_id: jenis.id,
                tahun_akademik: tahunAkademik,
                semester_akademik: Number(semesterAkademik) || 1,
                nominal: parseNominalInput(draft.nominal),
                keterangan: draft.keterangan || '',
                is_active: !!draft.is_active,
                can_installment: !!draft.can_installment,
                installment_max: Number(draft.installment_max || 0) || 6,
                installment_default: Number(draft.installment_default || 0) || 6,
            };
        });

        if (!items.length) return;

        setBulkProcessing(true);
        router.post(
            route('keuangan.setup.tarif.bulk'),
            { items },
            {
                preserveScroll: true,
                preserveState: 'errors',
                onSuccess: () => clearScopeDraft(),
                onFinish: () => setBulkProcessing(false),
            }
        );
    };

    const setSort = (key) => {
        if (sortBy === key) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortBy(key);
        setSortDir('asc');
    };

    const renderHighlighted = (text) => {
        const value = String(text || '');
        const keyword = search.trim();
        if (!keyword) return value;
        const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'ig');
        const keywordLower = keyword.toLowerCase();
        const parts = value.split(regex);
        return parts.map((part, idx) =>
            part.toLowerCase() === keywordLower ? (
                <mark key={`${part}-${idx}`} className="rounded bg-amber-100 px-0.5 text-amber-800">
                    {part}
                </mark>
            ) : (
                <Fragment key={`${part}-${idx}`}>{part}</Fragment>
            )
        );
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
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
                            <FieldError message={tarifForm.errors.tahun_akademik} />
                        </div>
                        <div>
                            <input className="form-input" type="number" min="1" max="14" value={semesterAkademik} onChange={(e) => setSemesterAkademik(e.target.value)} />
                            <FieldError message={tarifForm.errors.semester_akademik} />
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
                        {paginatedJenisTagihans.length ? (
                            paginatedJenisTagihans.map((jenis) => (
                                <article key={jenis.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{renderHighlighted(jenis.nama)}</p>
                                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{renderHighlighted(jenis.kode)}</p>
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
                            <EmptyState
                                title={totalFiltered === 0 && (jenisTagihans || []).length ? 'Data tidak ditemukan' : 'Belum ada jenis tagihan'}
                                description={
                                    totalFiltered === 0 && (jenisTagihans || []).length
                                        ? 'Ubah kata kunci atau filter untuk melihat data lain.'
                                        : 'Tambahkan jenis biaya (mis. PENDAFTARAN, SPP, KKN) untuk mulai membuat tarif per periode.'
                                }
                            />
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
                            <p className={`mt-1 text-xs font-semibold ${hasDraftChanges ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {hasDraftChanges ? 'Draft tersimpan lokal (belum semua tersubmit).' : 'Draft sinkron.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{totalFiltered} jenis</span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-5">
                        <input
                            className="form-input xl:col-span-2"
                            placeholder="Cari kode / nama jenis..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Semua status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </select>
                        <select className="form-input" value={tarifFilter} onChange={(e) => setTarifFilter(e.target.value)}>
                            <option value="all">Semua tarif</option>
                            <option value="with">Sudah ada tarif</option>
                            <option value="without">Belum ada tarif</option>
                        </select>
                        <select className="form-input" value={perPage} onChange={(e) => setPerPage(Number(e.target.value || 8))}>
                            <option value={8}>8 / halaman</option>
                            <option value={12}>12 / halaman</option>
                            <option value={20}>20 / halaman</option>
                        </select>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 xl:col-span-5">
                            <input type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
                            Compact table mode
                        </label>
                    </div>

                    <div className="sticky top-[70px] z-20 mt-3 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-600">
                                Aksi Cepat: simpan perubahan massal atau reset draft per periode aktif.
                            </p>
                            <div className="flex items-center gap-2">
                                <button type="button" className="btn-primary" onClick={saveTarifBulk} disabled={bulkProcessing || tarifForm.processing}>
                                    {bulkProcessing ? 'Menyimpan Massal...' : 'Simpan Massal'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => {
                                        clearScopeDraft();
                                        router.reload({ only: ['filters', 'tahunAkademiks', 'jenisTagihans', 'tarifsByJenisId'], preserveScroll: true });
                                    }}
                                >
                                    Reset Draft
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-white">
                        <div className="min-w-[940px] divide-y divide-slate-200">
                            <div className="grid grid-cols-[220px_140px_120px_160px_160px_140px] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                <button type="button" className="text-left" onClick={() => setSort('nama')}>
                                    Jenis {sortBy === 'nama' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                </button>
                                <button type="button" className="text-left" onClick={() => setSort('nominal')}>
                                    Nominal {sortBy === 'nominal' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                </button>
                                <button type="button" className="text-left" onClick={() => setSort('status')}>
                                    Status {sortBy === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                </button>
                                <div>Cicilan</div>
                                <div>Catatan</div>
                                <div className="sticky right-0 bg-slate-50 text-right">Aksi</div>
                            </div>

                            {(isFiltering
                                ? Array.from({ length: Math.min(perPage, 5) }, (_, idx) => ({ id: `skeleton-${idx}` }))
                                : paginatedJenisTagihans
                            ).map((jenis) => {
                                if (isFiltering) {
                                    return (
                                        <div key={jenis.id} className={`grid grid-cols-[220px_140px_120px_160px_160px_140px] items-start gap-3 px-4 ${compactMode ? 'py-2' : 'py-3'}`}>
                                            <div className="space-y-2">
                                                <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                                                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                                            </div>
                                            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-200" />
                                            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-200" />
                                            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-200" />
                                            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-200" />
                                            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-200" />
                                        </div>
                                    );
                                }
                                const draft = drafts?.[jenis.id] || {};
                                const hasTarif = !!draft?.tarif_id;

                                return (
                                    <div key={jenis.id} className={`grid grid-cols-[220px_140px_120px_160px_160px_140px] items-start gap-3 px-4 ${compactMode ? 'py-2' : 'py-3'}`}>
                                        <div>
                                            <p className={`${compactMode ? 'text-xs' : 'text-sm'} font-bold text-slate-900`}>{renderHighlighted(jenis.nama)}</p>
                                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{renderHighlighted(jenis.kode)}</p>
                                            {hasTarif ? <p className={`${compactMode ? 'mt-1' : 'mt-2'} text-xs font-semibold text-slate-600`}>{formatRupiah(draft.nominal)}</p> : <p className={`${compactMode ? 'mt-1' : 'mt-2'} text-xs text-slate-400`}>Belum ada tarif</p>}
                                        </div>

                                        <div>
                                            <input
                                                className="form-input"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Contoh: 1500000"
                                                value={draft.nominal ?? ''}
                                                onChange={(e) => setDrafts((prev) => ({ ...prev, [jenis.id]: { ...prev[jenis.id], nominal: e.target.value } }))}
                                            />
                                            {tarifForm.errors.nominal && activeTarifJenisId === jenis.id && <FieldError message={tarifForm.errors.nominal} />}
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
                                            {tarifForm.errors.is_active && activeTarifJenisId === jenis.id && <FieldError message={tarifForm.errors.is_active} />}
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
                                            {activeTarifJenisId === jenis.id ? (
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
                                            {tarifForm.errors.keterangan && activeTarifJenisId === jenis.id && <FieldError message={tarifForm.errors.keterangan} />}
                                        </div>

                                        <div className="sticky right-0 flex items-center justify-end gap-2 bg-white">
                                            <button type="button" className="btn-primary" onClick={() => saveTarif(jenis.id)} disabled={tarifForm.processing}>
                                                {tarifForm.processing && activeTarifJenisId === jenis.id ? 'Menyimpan...' : 'Simpan'}
                                            </button>
                                            <RowActions onDeleteTarif={() => confirmDeleteTarif(draft.tarif_id)} hasTarif={hasTarif} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">
                            Menampilkan {(totalFiltered === 0 ? 0 : (page - 1) * perPage + 1)}-{Math.min(page * perPage, totalFiltered)} dari {totalFiltered} data
                        </p>
                        <div className="flex items-center gap-2">
                            <button type="button" className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                Sebelumnya
                            </button>
                            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                                Hal {page} / {totalPages}
                            </span>
                            <button type="button" className="btn-outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                Berikutnya
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <Modal show={showJenisModal} onClose={() => setShowJenisModal(false)}>
                <div className="p-5 sm:p-6">
                    <h2 className="text-lg font-black text-slate-900">Tambah Jenis Tagihan</h2>
                    <p className="mt-1 text-sm text-slate-600">Buat master jenis biaya agar tarif bisa dikelola per periode akademik.</p>

                    <form onSubmit={submitJenis} className="mt-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="label">Kode Jenis Tagihan</label>
                                <input className="form-input" placeholder="Kode (mis. SPP)" value={jenisForm.data.kode} onChange={(e) => jenisForm.setData('kode', e.target.value)} />
                                <FieldError message={jenisForm.errors.kode} />
                            </div>
                            <div>
                                <label className="label">Nama Jenis Tagihan</label>
                                <input className="form-input" placeholder="Nama (mis. SPP Per Semester)" value={jenisForm.data.nama} onChange={(e) => jenisForm.setData('nama', e.target.value)} />
                                <FieldError message={jenisForm.errors.nama} />
                            </div>
                        </div>
                        <div>
                            <label className="label">Keterangan</label>
                            <textarea
                                className="form-input min-h-[90px]"
                                placeholder="Keterangan (opsional)"
                                value={jenisForm.data.keterangan}
                                onChange={(e) => jenisForm.setData('keterangan', e.target.value)}
                            />
                            <FieldError message={jenisForm.errors.keterangan} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="label">Urutan</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    value={jenisForm.data.sort_order}
                                    onChange={(e) => jenisForm.setData('sort_order', Number(e.target.value || 0))}
                                />
                            </div>
                            <div>
                                <label className="label">Status</label>
                                <label className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                    <input type="checkbox" checked={jenisForm.data.is_active} onChange={(e) => jenisForm.setData('is_active', e.target.checked)} />
                                    Aktif
                                </label>
                            </div>
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
                <div className="p-5 sm:p-6">
                    <h2 className="text-lg font-black text-slate-900">Edit Jenis Tagihan</h2>
                    <form onSubmit={submitEditJenis} className="mt-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <input className="form-input" placeholder="Kode" value={jenisEdit.data.kode} onChange={(e) => jenisEdit.setData('kode', e.target.value)} />
                                <FieldError message={jenisEdit.errors.kode} />
                            </div>
                            <div>
                                <input className="form-input" placeholder="Nama" value={jenisEdit.data.nama} onChange={(e) => jenisEdit.setData('nama', e.target.value)} />
                                <FieldError message={jenisEdit.errors.nama} />
                            </div>
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

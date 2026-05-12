import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const badge = {
    verified: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-rose-100 text-rose-700',
    paid: 'bg-emerald-100 text-emerald-700',
    unpaid: 'bg-slate-100 text-slate-700',
    failed: 'bg-rose-100 text-rose-700',
};

const label = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Rejected',
    paid: 'Paid',
    unpaid: 'Unpaid',
    failed: 'Failed',
};

function PaginationButtons({ links = [], onClick }) {
    if (!links.length) return null;

    return (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            {links.map((link, index) => (
                <button
                    key={`${link.label}-${index}`}
                    type="button"
                    disabled={!link.url}
                    onClick={() => link.url && onClick(link.url)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
                    }`}
                >
                    {link.label}
                </button>
            ))}
        </div>
    );
}

function HistoryCard({ item }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.nomor_pendaftaran}</p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{item.nama_lengkap || '-'}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                        {item.created_at ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(item.created_at)) : '-'}
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[item.status_verifikasi] || 'bg-slate-100 text-slate-700'}`}>
                        {label[item.status_verifikasi] || item.status_verifikasi}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[item.status_pembayaran] || 'bg-slate-100 text-slate-700'}`}>
                        {label[item.status_pembayaran] || item.status_pembayaran}
                    </span>
                </div>
            </div>
        </article>
    );
}

function VerificationCard({ item, onApprove, onReject, onDetail }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.nomor_pendaftaran}</p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{item.nama_lengkap || '-'}</h4>
                    <p className="mt-1 text-sm text-slate-600">
                        {item.prodi ? `${item.prodi.nama} (${item.prodi.jenjang})` : '-'} - {item.gelombang || '-'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{item.user?.email || item.email || '-'}</p>
                    {item.catatan && <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">Catatan: {item.catatan}</p>}
                </div>
                <div className="flex flex-col gap-2 lg:items-end">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[item.status_verifikasi] || 'bg-slate-100 text-slate-700'}`}>
                        {label[item.status_verifikasi] || item.status_verifikasi}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[item.status_pembayaran] || 'bg-slate-100 text-slate-700'}`}>
                        {label[item.status_pembayaran] || item.status_pembayaran}
                    </span>
                    <p className="text-xs text-slate-500">{item.created_at ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(item.created_at)) : '-'}</p>
                    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
                        <button type="button" className="btn-outline w-full" onClick={() => onDetail(item)}>
                            Detail
                        </button>
                        <button type="button" className="btn-primary w-full" onClick={() => onApprove(item)}>
                            Verifikasi
                        </button>
                        <button type="button" className="btn-outline w-full" onClick={() => onReject(item)}>
                            Tolak
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function Page({ auth, prodis = [], riwayat = [], summary = null, verificationItems = { data: [], meta: null, links: [] }, verificationSummary = null, canManageVerification = false, verificationFilters = null }) {
    const { menu, flash } = usePage().props;
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectNote, setRejectNote] = useState('');
    const [detailTarget, setDetailTarget] = useState(null);
    const [toast, setToast] = useState(null);
    const [verificationSearch, setVerificationSearch] = useState(verificationFilters?.search || '');
    const [verificationStatus, setVerificationStatus] = useState(verificationFilters?.status || 'all');
    const [verificationPaymentStatus, setVerificationPaymentStatus] = useState(verificationFilters?.payment_status || 'all');
    const [verificationPerPage, setVerificationPerPage] = useState(String(verificationFilters?.per_page || 10));
    const [formStep, setFormStep] = useState(1);
    const [stepError, setStepError] = useState('');
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [draftNotice, setDraftNotice] = useState('');
    const [draftSavedAt, setDraftSavedAt] = useState('');
    const initialFormData = {
        prodi_id: '',
        gelombang: 'Gelombang 1',
        nama_lengkap: auth.user.name || '',
        email: auth.user.email || '',
        phone: '',
        asal_sekolah: '',
        dokumen_ktp: null,
        dokumen_ijazah: null,
        dokumen_foto: null,
    };
    const form = useForm(initialFormData);
    const draftStorageKey = `pmb-draft:${auth.user?.id || auth.user?.email || 'guest'}`;
    const draftFields = ['prodi_id', 'gelombang', 'nama_lengkap', 'email', 'phone', 'asal_sekolah'];

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const raw = window.localStorage.getItem(draftStorageKey);
            if (!raw) {
                setDraftLoaded(true);
                return;
            }

            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                const nextData = {};
                draftFields.forEach((field) => {
                    if (parsed.data && Object.prototype.hasOwnProperty.call(parsed.data, field)) {
                        nextData[field] = parsed.data[field];
                    }
                });

                form.setData((current) => ({
                    ...current,
                    ...nextData,
                }));

                if (Number.isInteger(parsed.step) && parsed.step >= 1 && parsed.step <= 3) {
                    setFormStep(parsed.step);
                }

                if (parsed.updated_at) {
                    setDraftSavedAt(parsed.updated_at);
                }
                setDraftNotice('Draft PMB terakhir berhasil dimuat dari perangkat ini.');
            }
        } catch {
            window.localStorage.removeItem(draftStorageKey);
        } finally {
            setDraftLoaded(true);
        }
    }, [auth.user?.email, auth.user?.id, draftStorageKey]);

    useEffect(() => {
        if (!draftLoaded || typeof window === 'undefined') {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            const payload = {
                step: formStep,
                data: draftFields.reduce((acc, field) => {
                    acc[field] = form.data[field];
                    return acc;
                }, {}),
                updated_at: new Date().toISOString(),
            };

            window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
            setDraftSavedAt(payload.updated_at);
            setDraftNotice('Draft PMB tersimpan otomatis pada perangkat ini.');
        }, 350);

        return () => window.clearTimeout(timer);
    }, [draftLoaded, draftStorageKey, form.data, formStep]);

    const submit = (e) => {
        e.preventDefault();
        if (!isStepValid(3)) {
            setStepError('Lengkapi dokumen wajib sebelum mengirim pendaftaran.');
            return;
        }
        form.post(route('pmb.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('prodi_id', 'gelombang', 'phone', 'asal_sekolah', 'dokumen_ktp', 'dokumen_ijazah', 'dokumen_foto');
                setFormStep(1);
                setStepError('');
                setDraftNotice('');
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(draftStorageKey);
                }
            },
        });
    };

    const requiredByStep = useMemo(() => ({
        1: ['gelombang', 'prodi_id'],
        2: ['nama_lengkap', 'email', 'phone', 'asal_sekolah'],
        3: ['dokumen_ktp', 'dokumen_ijazah', 'dokumen_foto'],
    }), []);

    const isFieldFilled = (field) => {
        const value = form.data[field];
        if (field.startsWith('dokumen_')) {
            return Boolean(value);
        }
        return String(value || '').trim() !== '';
    };

    const isStepValid = (step) => {
        const fields = requiredByStep[step] || [];
        return fields.every((field) => isFieldFilled(field));
    };

    const fileLabel = (file) => {
        if (!file) {
            return 'Belum ada file';
        }

        return file.name || 'File terpilih';
    };

    const completedSteps = [1, 2, 3].filter((step) => isStepValid(step)).length;
    const progressPercent = Math.round((completedSteps / 3) * 100);

    const goNextStep = () => {
        if (!isStepValid(formStep)) {
            setStepError(`Lengkapi data wajib pada Tahap ${formStep} sebelum lanjut.`);
            return;
        }
        setStepError('');
        setFormStep((prev) => Math.min(3, prev + 1));
    };

    const goPrevStep = () => {
        setStepError('');
        setFormStep((prev) => Math.max(1, prev - 1));
    };

    const clearDocument = (field) => {
        form.setData(field, null);
        setStepError('');
    };

    const resetDraft = () => {
        form.setData({ ...initialFormData });
        setFormStep(1);
        setStepError('');
        setDraftNotice('Draft PMB telah dihapus dari perangkat ini.');
        setDraftSavedAt('');
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(draftStorageKey);
        }
    };

    const selectedProdi = useMemo(
        () => prodis.find((item) => String(item.id) === String(form.data.prodi_id)) || null,
        [form.data.prodi_id, prodis],
    );

    const formatTimestamp = (value) => {
        if (!value) {
            return '-';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }

        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const summaryItems = [
        { label: 'Nama', value: form.data.nama_lengkap || '-' },
        { label: 'Email', value: form.data.email || '-' },
        { label: 'No. HP', value: form.data.phone || '-' },
        { label: 'Asal Sekolah', value: form.data.asal_sekolah || '-' },
        { label: 'Gelombang', value: form.data.gelombang || '-' },
        { label: 'Program Studi', value: selectedProdi ? `${selectedProdi.nama} (${selectedProdi.jenjang})` : '-' },
        { label: 'KTP', value: fileLabel(form.data.dokumen_ktp) },
        { label: 'Ijazah', value: fileLabel(form.data.dokumen_ijazah) },
        { label: 'Pas Foto', value: fileLabel(form.data.dokumen_foto) },
    ];

    const stepStatus = [
        { step: 1, title: 'Gelombang & Prodi', done: isStepValid(1) },
        { step: 2, title: 'Identitas Pendaftar', done: isStepValid(2) },
        { step: 3, title: 'Upload Dokumen', done: isStepValid(3) },
    ];

    const stats = [
        { label: 'Total Pendaftar', value: summary?.total ?? 0 },
        { label: 'Pending Verifikasi', value: summary?.pending ?? 0 },
        { label: 'Verified', value: summary?.verified ?? 0 },
        { label: 'Sudah Bayar', value: summary?.paid ?? 0 },
    ];

    const verificationStats = [
        { label: 'Total PMB', value: verificationSummary?.total ?? 0 },
        { label: 'Pending', value: verificationSummary?.pending ?? 0 },
        { label: 'Verified', value: verificationSummary?.verified ?? 0 },
        { label: 'Rejected', value: verificationSummary?.rejected ?? 0 },
    ];

    const updateVerification = (item, status_verifikasi, catatan = null) => {
        router.patch(route('pmb.verification.update', item.id), { status_verifikasi, catatan }, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['verificationItems', 'summary', 'riwayat'] }),
        });
    };

    const approveItem = (item) => updateVerification(item, 'verified');
    const detailItem = (item) => setDetailTarget(item);
    const rejectItem = (item) => {
        setRejectTarget(item);
        setRejectNote(item.catatan || '');
    };

    const submitReject = (e) => {
        e.preventDefault();
        if (!rejectTarget) {
            return;
        }

        updateVerification(rejectTarget, 'rejected', rejectNote.trim() || null);
        setRejectTarget(null);
        setRejectNote('');
    };

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timer = setTimeout(() => setToast(null), 2400);
        return () => clearTimeout(timer);
    }, [toast]);

    const copyValue = async (value, labelText) => {
        if (!value) {
            setToast({ type: 'error', message: `${labelText} tidak tersedia` });
            return;
        }

        try {
            await navigator.clipboard.writeText(String(value));
            setToast({ type: 'success', message: `${labelText} disalin` });
        } catch {
            setToast({ type: 'error', message: `Gagal menyalin ${labelText}` });
        }
    };

    const applyVerificationFilters = (pageUrl = null) => {
        const payload = {
            verification_search: verificationSearch,
            verification_status: verificationStatus,
            verification_payment_status: verificationPaymentStatus,
            verification_per_page: verificationPerPage,
        };

        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('pmb.index'), payload, { preserveScroll: true, preserveState: true, replace: true });
    };

    const resetVerificationFilters = () => {
        setVerificationSearch('');
        setVerificationStatus('all');
        setVerificationPaymentStatus('all');
        setVerificationPerPage('10');
        router.get(route('pmb.index'), {}, { preserveScroll: true, preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="PMB" />

            {toast?.message && (
                <div
                    className={`fixed inset-x-4 top-4 z-50 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg sm:inset-x-auto sm:right-4 ${
                        toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                >
                    {toast.message}
                </div>
            )}

            {flash?.success && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{flash.success}</div>}
            {flash?.error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{flash.error}</div>}

            <ModuleHero
                eyebrow="Penerimaan Mahasiswa Baru"
                title="Admission Center"
                description="Kelola pendaftaran, status verifikasi, dan progres pembayaran PMB dalam satu layar."
                note={`Total pendaftaran: ${summary?.total ?? 0}`}
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                    <article key={item.label} className="panel p-4 sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="mt-1 text-2xl font-extrabold text-slate-900">{item.value}</p>
                    </article>
                ))}
            </div>

            <div className="mt-4 grid gap-5 xl:grid-cols-5">
                <form onSubmit={submit} className="panel p-5 xl:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Formulir Pendaftaran</h3>
                            <p className="mt-1 text-sm text-slate-600">Lengkapi data calon mahasiswa dengan benar untuk proses verifikasi.</p>
                        </div>
                        <Link href={route('pmb.payment')} className="btn-outline">
                            Payment Gateway
                        </Link>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Progress Form PMB</p>
                            <p className="text-xs font-bold text-slate-700">{progressPercent}% selesai</p>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-sky-600 transition-all" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {[
                                { step: 1, title: 'Tahap 1', subtitle: 'Gelombang & Prodi' },
                                { step: 2, title: 'Tahap 2', subtitle: 'Identitas Pendaftar' },
                                { step: 3, title: 'Tahap 3', subtitle: 'Upload Dokumen' },
                            ].map((item) => (
                                <button
                                    key={item.step}
                                    type="button"
                                    onClick={() => setFormStep(item.step)}
                                    className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                                        formStep === item.step
                                            ? 'border-sky-300 bg-sky-50 text-sky-700'
                                            : isStepValid(item.step)
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-white text-slate-600'
                                    }`}
                                >
                                    <p className="font-bold">{item.title}</p>
                                    <p className="mt-0.5">{item.subtitle}</p>
                                </button>
                            ))}
                        </div>
                        <p className="mt-3 text-[11px] text-slate-500">
                            Draft tersimpan otomatis di perangkat ini. File upload perlu dipilih ulang jika halaman dimuat ulang.
                        </p>
                    </div>

                    {draftNotice ? <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">{draftNotice}</p> : null}

                    {formStep === 1 && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="label">Gelombang</label>
                                <input className="field" value={form.data.gelombang} onChange={(e) => form.setData('gelombang', e.target.value)} placeholder="Gelombang 1" />
                            </div>
                            <div>
                                <label className="label">Program Studi</label>
                                <select className="field" value={form.data.prodi_id} onChange={(e) => form.setData('prodi_id', e.target.value)}>
                                    <option value="">Pilih Prodi</option>
                                    {prodis.map((p) => <option key={p.id} value={p.id}>{p.nama} ({p.jenjang})</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {formStep === 2 && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="label">Nama Lengkap</label>
                                <input className="field" value={form.data.nama_lengkap} onChange={(e) => form.setData('nama_lengkap', e.target.value)} autoComplete="name" placeholder="Nama sesuai identitas" />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input type="email" className="field" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} autoComplete="email" placeholder="nama@email.com" />
                            </div>
                            <div>
                                <label className="label">No. HP</label>
                                <input type="tel" className="field" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} autoComplete="tel" placeholder="08xxxxxxxxxx" />
                            </div>
                            <div>
                                <label className="label">Asal Sekolah</label>
                                <input className="field" value={form.data.asal_sekolah} onChange={(e) => form.setData('asal_sekolah', e.target.value)} placeholder="SMA/SMK/MA ..." />
                            </div>
                        </div>
                    )}

                    {formStep === 3 && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="label">Dokumen KTP</label>
                                <input key={`dokumen-ktp-${form.data.dokumen_ktp?.name || 'empty'}`} type="file" className="field file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-700" onChange={(e) => form.setData('dokumen_ktp', e.target.files?.[0] || null)} />
                                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    <span className="truncate font-semibold">{fileLabel(form.data.dokumen_ktp)}</span>
                                    <button type="button" className="font-bold text-sky-700 hover:text-sky-800" onClick={() => clearDocument('dokumen_ktp')}>
                                        Hapus
                                    </button>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">Format disarankan: PDF / JPG / PNG.</p>
                            </div>
                            <div>
                                <label className="label">Dokumen Ijazah</label>
                                <input key={`dokumen-ijazah-${form.data.dokumen_ijazah?.name || 'empty'}`} type="file" className="field file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-700" onChange={(e) => form.setData('dokumen_ijazah', e.target.files?.[0] || null)} />
                                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    <span className="truncate font-semibold">{fileLabel(form.data.dokumen_ijazah)}</span>
                                    <button type="button" className="font-bold text-sky-700 hover:text-sky-800" onClick={() => clearDocument('dokumen_ijazah')}>
                                        Hapus
                                    </button>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">Format disarankan: PDF / JPG / PNG.</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="label">Pas Foto</label>
                                <input key={`dokumen-foto-${form.data.dokumen_foto?.name || 'empty'}`} type="file" className="field file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-700" onChange={(e) => form.setData('dokumen_foto', e.target.files?.[0] || null)} />
                                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    <span className="truncate font-semibold">{fileLabel(form.data.dokumen_foto)}</span>
                                    <button type="button" className="font-bold text-sky-700 hover:text-sky-800" onClick={() => clearDocument('dokumen_foto')}>
                                        Hapus
                                    </button>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">Gunakan foto formal dengan latar yang jelas.</p>
                            </div>
                        </div>
                    )}

                    {stepError && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{stepError}</p>}

                    <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" className="btn-outline" onClick={goPrevStep} disabled={formStep === 1}>
                            Kembali
                        </button>
                        {formStep < 3 ? (
                            <button type="button" className="btn-primary" onClick={goNextStep}>
                                Lanjut
                            </button>
                        ) : (
                            <button type="submit" className="btn-primary" disabled={form.processing}>
                                {form.processing ? 'Menyimpan...' : 'Simpan Pendaftaran'}
                            </button>
                        )}
                    </div>
                </form>

                <div className="panel p-5 xl:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Riwayat Pendaftaran</h3>
                            <p className="mt-1 text-sm text-slate-600">Monitoring status verifikasi dan pembayaran PMB.</p>
                        </div>
                        <Link href={route('pmb.payment')} className="btn-outline">
                            Ke Payment
                        </Link>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ringkasan Draft</p>
                                <p className="mt-1 text-sm font-bold text-slate-900">Cek ulang sebelum submit</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${isStepValid(3) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isStepValid(3) ? 'Siap submit' : 'Belum lengkap'}
                            </span>
                        </div>
                        <div className="mt-3 grid gap-2">
                            {summaryItems.map((item) => (
                                <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs">
                                    <span className="font-semibold text-slate-500">{item.label}</span>
                                    <span className="max-w-[65%] text-right font-bold text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {stepStatus.map((item) => (
                                <div
                                    key={item.step}
                                    className={`rounded-xl border px-3 py-2 text-[11px] font-semibold ${
                                        formStep === item.step
                                            ? 'border-sky-300 bg-sky-50 text-sky-700'
                                            : item.done
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-white text-slate-500'
                                    }`}
                                >
                                    <p className="text-[10px] uppercase tracking-[0.14em]">Tahap {item.step}</p>
                                    <p className="mt-1">{item.title}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                            <p>Langkah aktif: Tahap {formStep} dari 3</p>
                            <p className="mt-1">Draft terakhir: {formatTimestamp(draftSavedAt)}</p>
                        </div>
                        <button type="button" className="btn-outline mt-3 w-full" onClick={resetDraft}>
                            Reset Draft
                        </button>
                    </div>

                    <div className="mt-4 space-y-3">
                        {riwayat.length === 0 && <p className="text-sm text-slate-500">Belum ada data pendaftaran.</p>}
                        {riwayat.map((item) => (
                            <HistoryCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            </div>

            {canManageVerification && (
                <div className="panel mt-5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Verifikasi PMB</h3>
                            <p className="mt-1 text-sm text-slate-600">Kelola status verifikasi pendaftar yang masuk.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={route('pmb.verification.export.csv', { verification_search: verificationSearch, verification_payment_status: verificationPaymentStatus })}
                                className="btn-outline"
                            >
                                Export CSV Pending
                            </a>
                            <a
                                href={route('pmb.verification.export.pdf', { verification_search: verificationSearch, verification_payment_status: verificationPaymentStatus })}
                                className="btn-primary"
                            >
                                Export PDF Pending
                            </a>
                            <a
                                href={route('pmb.verification.export.xlsx', { verification_search: verificationSearch, verification_payment_status: verificationPaymentStatus })}
                                className="btn-outline"
                            >
                                Export XLSX Pending
                            </a>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {(verificationItems?.meta?.total ?? verificationItems?.data?.length ?? 0)} pendaftar
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {verificationStats.map((item) => (
                            <article key={item.label} className="panel-soft p-4 sm:p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                                <p className="mt-1 text-2xl font-extrabold text-slate-900">{item.value}</p>
                            </article>
                        ))}
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                        <input
                            className="form-input sm:col-span-2 lg:col-span-2"
                            placeholder="Cari nomor, nama, email, atau prodi"
                            value={verificationSearch}
                            onChange={(e) => setVerificationSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyVerificationFilters()}
                        />
                        <select className="form-input" value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value)}>
                            <option value="all">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select className="form-input" value={verificationPaymentStatus} onChange={(e) => setVerificationPaymentStatus(e.target.value)}>
                            <option value="all">Semua Pembayaran</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                        </select>
                        <select className="form-input" value={verificationPerPage} onChange={(e) => setVerificationPerPage(e.target.value)}>
                            <option value="10">10 / halaman</option>
                            <option value="30">30 / halaman</option>
                            <option value="50">50 / halaman</option>
                            <option value="100">100 / halaman</option>
                        </select>
                        <button type="button" className="btn-primary w-full" onClick={() => applyVerificationFilters()}>
                            Terapkan
                        </button>
                        <button type="button" className="btn-outline w-full" onClick={resetVerificationFilters}>
                            Reset
                        </button>
                    </div>

                    <div className="mt-4 space-y-3">
                        {(verificationItems?.data || []).length === 0 && <p className="text-sm text-slate-500">Belum ada data PMB untuk diverifikasi.</p>}
                        {(verificationItems?.data || []).map((item) => (
                            <VerificationCard key={item.id} item={item} onApprove={approveItem} onReject={rejectItem} onDetail={detailItem} />
                        ))}
                    </div>
                    <PaginationButtons links={verificationItems?.links || []} onClick={(pageUrl) => applyVerificationFilters(pageUrl)} />
                </div>
            )}

            <Modal show={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} maxWidth="lg">
                <form onSubmit={submitReject} className="p-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Tolak PMB</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Tambahkan catatan jika diperlukan untuk pendaftar {rejectTarget?.nomor_pendaftaran || '-'}.
                        </p>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{rejectTarget?.nama_lengkap || '-'}</p>
                        <p className="mt-1">{rejectTarget?.prodi ? `${rejectTarget.prodi.nama} (${rejectTarget.prodi.jenjang})` : '-'}</p>
                    </div>

                    <div className="mt-4">
                        <label className="label">Catatan Penolakan</label>
                        <textarea
                            className="field min-h-28"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Contoh: Dokumen belum lengkap atau foto tidak terbaca."
                        />
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setRejectTarget(null)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit">
                            Tolak PMB
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={Boolean(detailTarget)} onClose={() => setDetailTarget(null)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Detail PMB</h3>
                            <p className="mt-1 text-sm text-slate-600">Informasi lengkap pendaftar sebelum verifikasi.</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[detailTarget?.status_verifikasi] || 'bg-slate-100 text-slate-700'}`}>
                            {label[detailTarget?.status_verifikasi] || detailTarget?.status_verifikasi || '-'}
                        </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Nomor Pendaftaran</p>
                            <p className="mt-1 font-semibold text-slate-900">{detailTarget?.nomor_pendaftaran || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Gelombang</p>
                            <p className="mt-1 font-semibold text-slate-900">{detailTarget?.gelombang || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Nama Lengkap</p>
                            <p className="mt-1 font-semibold text-slate-900">{detailTarget?.nama_lengkap || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Program Studi</p>
                            <p className="mt-1 font-semibold text-slate-900">{detailTarget?.prodi ? `${detailTarget.prodi.nama} (${detailTarget.prodi.jenjang})` : '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Email</p>
                            <p className="mt-1 font-semibold text-slate-900">{detailTarget?.email || detailTarget?.user?.email || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">No. HP</p>
                            <p className="mt-1 font-semibold text-slate-900">{detailTarget?.phone || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Asal Sekolah</p>
                            <p className="mt-1 font-semibold text-slate-900">{detailTarget?.asal_sekolah || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Status Pembayaran</p>
                            <p className="mt-1 font-semibold text-slate-900">{label[detailTarget?.status_pembayaran] || detailTarget?.status_pembayaran || '-'}</p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {[
                            ['KTP', 'dokumen_ktp', detailTarget?.dokumen_ktp],
                            ['Ijazah', 'dokumen_ijazah', detailTarget?.dokumen_ijazah],
                            ['Foto', 'dokumen_foto', detailTarget?.dokumen_foto],
                        ].map(([title, field, path]) => (
                            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{title}</p>
                                {path ? (
                                    <a
                                        href={route('pmb.documents.download', [detailTarget?.id, field])}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 inline-flex items-center gap-2 font-semibold text-sky-700 hover:text-sky-600"
                                    >
                                        Download dokumen
                                    </a>
                                ) : (
                                    <p className="mt-1 break-all font-semibold text-slate-900">-</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <button type="button" className="btn-outline" onClick={() => copyValue(detailTarget?.nomor_pendaftaran, 'Nomor pendaftaran')}>
                            Copy Nomor
                        </button>
                        <button type="button" className="btn-outline" onClick={() => copyValue(detailTarget?.email || detailTarget?.user?.email, 'Email')}>
                            Copy Email
                        </button>
                        <button type="button" className="btn-outline" onClick={() => copyValue(detailTarget?.phone, 'No. HP')}>
                            Copy No. HP
                        </button>
                    </div>

                    {detailTarget?.catatan && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <p className="text-xs uppercase tracking-[0.14em] text-amber-500">Catatan</p>
                            <p className="mt-1 font-medium">{detailTarget.catatan}</p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={() => setDetailTarget(null)}>
                            Tutup
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

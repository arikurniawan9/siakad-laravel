import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModuleHero from '@/Components/ModuleHero';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import EmptyState from '../Akademik/EmptyState';
import { ActionIcon, IconButton } from '../Akademik/CrudParts';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import ImportModal from './ImportModal';

const statusStyles = {
    aktif: 'bg-emerald-100 text-emerald-700',
    cuti: 'bg-amber-100 text-amber-700',
    lulus: 'bg-sky-100 text-sky-700',
    dropout: 'bg-rose-100 text-rose-700',
    nonaktif: 'bg-slate-200 text-slate-700',
};

export default function Page({ auth, prodis = [], filters = null, mahasiswas = { data: [], meta: null, links: [] } }) {
    const { menu, flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [modalMounted, setModalMounted] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [prodiFilter, setProdiFilter] = useState(filters?.prodi_id || 'all');
    const [perPage, setPerPage] = useState(String(filters?.per_page || 10));
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'latest');
    const [sortDir, setSortDir] = useState(filters?.sort_dir || 'desc');
    const [editingIdMobile, setEditingIdMobile] = useState(null);

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const form = useForm({
        prodi_id: '', nim: '', nisn: '', nama: '', email: '', phone: '',
        jenis_kelamin: 'L', tanggal_lahir: '', tempat_lahir: '', alamat: '', angkatan: '2026', status_mahasiswa: 'aktif',
    });

    const edit = useForm({
        prodi_id: '', nim: '', nisn: '', nama: '', email: '', phone: '',
        jenis_kelamin: 'L', tanggal_lahir: '', tempat_lahir: '', alamat: '', angkatan: '', status_mahasiswa: 'aktif',
    });

    const deleteForm = useForm();

    const submit = (e) => {
        e.preventDefault();
        form.post(route('mahasiswa.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('nim', 'nisn', 'nama', 'email', 'phone', 'tempat_lahir', 'alamat');
                setShowCreateModal(false);
            },
        });
    };

    const IconLink = ({ href, label, children }) => (
        <a
            href={href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            aria-label={label}
            title={label}
        >
            {children}
        </a>
    );

    const confirmDeletion = (item) => {
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const removeItem = () => {
        deleteForm.delete(route('mahasiswa.destroy', itemToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmingDeletion(false);
                setItemToDelete(null);
            },
        });
    };

    const applyFilters = (pageUrl = null) => {
        const params = {
            search,
            status: statusFilter,
            prodi_id: prodiFilter,
            per_page: perPage,
            sort_by: sortBy,
            sort_dir: sortDir,
        };

        if (pageUrl) {
            router.get(pageUrl, {}, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('mahasiswa.index'), params, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setProdiFilter('all');
        setPerPage('10');
        setSortBy('latest');
        setSortDir('desc');
        router.get(route('mahasiswa.index'), {}, { preserveScroll: true, preserveState: true });
    };

    useEffect(() => {
        const normalizedSearch = filters?.search || '';
        if (search === normalizedSearch) {
            return undefined;
        }

        const timeout = setTimeout(() => {
            router.get(route('mahasiswa.index'), {
                search,
                status: statusFilter,
                prodi_id: prodiFilter,
                per_page: perPage,
                sort_by: sortBy,
                sort_dir: sortDir,
            }, { preserveScroll: true, preserveState: true, replace: true });
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        const hasModal = showCreateModal || showImportModal || Boolean(editingId) || confirmingDeletion;
        setModalMounted(hasModal);
        document.body.classList.toggle('overflow-hidden', hasModal);
        return () => document.body.classList.remove('overflow-hidden');
    }, [showCreateModal, showImportModal, editingId, confirmingDeletion]);

    useEffect(() => {
        if (!modalMounted) return undefined;
        const onEsc = (e) => {
            if (e.key !== 'Escape') return;
            if (!form.processing) setShowCreateModal(false);
            setShowImportModal(false);
            setConfirmingDeletion(false);
            setEditingId(null);
            setEditingIdMobile(null);
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [modalMounted, form.processing]);

    const setEditData = (item) => {
        edit.setData({
            prodi_id: item.prodi_id || '',
            nim: item.nim || '',
            nisn: item.nisn || '',
            nama: item.nama || '',
            email: item.email || '',
            phone: item.phone || '',
            jenis_kelamin: item.jenis_kelamin || 'L',
            tanggal_lahir: item.tanggal_lahir || '',
            tempat_lahir: item.tempat_lahir || '',
            alamat: item.alamat || '',
            angkatan: item.angkatan || '',
            status_mahasiswa: item.status_mahasiswa || 'aktif',
        });
    };

    const openEdit = (item) => {
        setEditingId(item.id);
        setEditingIdMobile(item.id);
        setEditData(item);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingIdMobile(null);
    };

    function PaginationButtons({ links = [], onClick }) {
        if (!links.length) return null;

        return (
            <div className="flex flex-wrap gap-2">
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

    function MahasiswaCard({ item }) {
        return (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.nim}</p>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">{item.nama}</h4>
                        <p className="text-xs text-slate-500">{item.prodi?.nama || '-'}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.status_mahasiswa === 'aktif' ? 'bg-emerald-100 text-emerald-700' : item.status_mahasiswa === 'cuti' ? 'bg-amber-100 text-amber-700' : item.status_mahasiswa === 'lulus' ? 'bg-sky-100 text-sky-700' : item.status_mahasiswa === 'dropout' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                        {item.status_mahasiswa}
                    </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <dt className="text-slate-400">Angkatan</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{item.angkatan || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-400">Email</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{item.email || '-'}</dd>
                    </div>
                    <div className="col-span-2">
                        <dt className="text-slate-400">Phone</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{item.phone || '-'}</dd>
                    </div>
                </dl>

                <div className="mt-4 flex justify-end gap-2">
                    <IconButton variant="neutral" label={`Edit mahasiswa ${item.nim}`} onClick={() => openEdit(item)}>
                        <ActionIcon name="edit" />
                    </IconButton>
                    <IconButton variant="danger" label={`Hapus mahasiswa ${item.nim}`} onClick={() => confirmDeletion(item)}>
                        <ActionIcon name="trash" />
                    </IconButton>
                </div>

                {editingIdMobile === item.id && (
                    <form
                        className="mt-4 space-y-2 rounded-2xl border border-sky-200 bg-sky-50/60 p-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            edit.put(route('mahasiswa.update', item.id), { preserveScroll: true, onSuccess: cancelEdit });
                        }}
                    >
                        <input className="form-input" value={edit.data.nim} onChange={(e) => edit.setData('nim', e.target.value)} />
                        <input className="form-input" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                        <select className="form-input" value={edit.data.prodi_id} onChange={(e) => edit.setData('prodi_id', e.target.value)}>
                            <option value="">Pilih prodi</option>
                            {prodis.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama}
                                </option>
                            ))}
                        </select>
                        <select className="form-input" value={edit.data.status_mahasiswa} onChange={(e) => edit.setData('status_mahasiswa', e.target.value)}>
                            <option value="aktif">aktif</option>
                            <option value="cuti">cuti</option>
                            <option value="lulus">lulus</option>
                            <option value="dropout">dropout</option>
                            <option value="nonaktif">nonaktif</option>
                        </select>
                        <div className="flex gap-2">
                            <button className="btn-primary" type="submit">
                                Update
                            </button>
                            <button className="btn-outline" type="button" onClick={cancelEdit}>
                                Batal
                            </button>
                        </div>
                    </form>
                )}
            </article>
        );
    }

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Data Mahasiswa" />

            <ImportModal
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
                templateUrl={route('mahasiswa.import.template')}
                prodis={prodis}
            />

            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Mahasiswa</p>
                            <h3 className="mt-1 text-lg font-black text-slate-900">Tambah Mahasiswa</h3>
                            <p className="mt-1 text-sm text-slate-600">Isi data dasar mahasiswa lalu simpan.</p>
                        </div>
                        <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)} disabled={form.processing}>
                            Tutup
                        </button>
                    </div>

                    {flash?.success && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{flash.success}</p>}

                    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <select className="form-input" value={form.data.prodi_id} onChange={(e) => form.setData('prodi_id', e.target.value)}>
                                <option value="">Pilih prodi</option>
                                {prodis.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <input className="form-input" placeholder="NIM" value={form.data.nim} onChange={(e) => form.setData('nim', e.target.value)} />
                        <input className="form-input" placeholder="NISN" value={form.data.nisn} onChange={(e) => form.setData('nisn', e.target.value)} />
                        <div className="sm:col-span-2">
                            <input className="form-input" placeholder="Nama" value={form.data.nama} onChange={(e) => form.setData('nama', e.target.value)} />
                        </div>
                        <input className="form-input" placeholder="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                        <input className="form-input" placeholder="No HP" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                        <select className="form-input" value={form.data.jenis_kelamin} onChange={(e) => form.setData('jenis_kelamin', e.target.value)}>
                            <option value="L">L</option>
                            <option value="P">P</option>
                        </select>
                        <input type="date" className="form-input" value={form.data.tanggal_lahir} onChange={(e) => form.setData('tanggal_lahir', e.target.value)} />
                        <input className="form-input" placeholder="Tempat lahir" value={form.data.tempat_lahir} onChange={(e) => form.setData('tempat_lahir', e.target.value)} />
                        <input className="form-input" placeholder="Angkatan" value={form.data.angkatan} onChange={(e) => form.setData('angkatan', e.target.value)} />
                        <div className="sm:col-span-2">
                            <textarea rows="2" className="form-input" placeholder="Alamat" value={form.data.alamat} onChange={(e) => form.setData('alamat', e.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                            <select className="form-input" value={form.data.status_mahasiswa} onChange={(e) => form.setData('status_mahasiswa', e.target.value)}>
                                <option value="aktif">aktif</option>
                                <option value="cuti">cuti</option>
                                <option value="lulus">lulus</option>
                                <option value="dropout">dropout</option>
                                <option value="nonaktif">nonaktif</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
                            <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)} disabled={form.processing}>
                                Batal
                            </button>
                            <button className="btn-primary" type="submit" disabled={form.processing}>
                                {form.processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmationModal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={removeItem}
                title="Hapus Mahasiswa"
                message={`Apakah Anda yakin ingin menghapus mahasiswa ${itemToDelete?.nama}? Tindakan ini akan menghapus seluruh data akademik terkait.`}
                processing={deleteForm.processing}
            />

            <ModuleHero
                eyebrow="Mahasiswa"
                title="Data Master Mahasiswa"
                description="Kelola identitas, status, dan filter data mahasiswa dalam satu layar."
                note={`Total data terdaftar: ${mahasiswas.meta?.total ?? 0}`}
            />

            <div className="grid gap-4">
                <section className="panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">Daftar Mahasiswa</h3>
                        <div className="flex items-center gap-2">
                            <IconButton variant="neutral" label="Tambah Mahasiswa" onClick={() => setShowCreateModal(true)}>
                                <ActionIcon name="plus" />
                            </IconButton>
                            <IconButton variant="neutral" label="Import Excel" onClick={() => setShowImportModal(true)}>
                                <ActionIcon name="upload" />
                            </IconButton>
                            <IconLink
                                href={route('mahasiswa.index.pdf', { search, status: statusFilter, prodi_id: prodiFilter, sort_by: sortBy, sort_dir: sortDir })}
                                label="Export PDF"
                            >
                                <ActionIcon name="download" />
                            </IconLink>
                            <IconLink
                                href={route('mahasiswa.index.xlsx', { search, status: statusFilter, prodi_id: prodiFilter, sort_by: sortBy, sort_dir: sortDir })}
                                label="Export Excel"
                            >
                                <ActionIcon name="sheet" />
                            </IconLink>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{mahasiswas.meta?.total ?? 0} data</div>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_170px_150px_120px_120px_auto_auto]">
                        <input className="form-input" placeholder="Cari NIM, nama, email, phone" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
                        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Semua status</option>
                            <option value="aktif">aktif</option>
                            <option value="cuti">cuti</option>
                            <option value="lulus">lulus</option>
                            <option value="dropout">dropout</option>
                            <option value="nonaktif">nonaktif</option>
                        </select>
                        <select className="form-input" value={prodiFilter} onChange={(e) => setProdiFilter(e.target.value)}>
                            <option value="all">Semua prodi</option>
                            {prodis.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                        <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="latest">Terbaru</option>
                            <option value="nim">NIM</option>
                            <option value="nama">Nama</option>
                            <option value="angkatan">Angkatan</option>
                            <option value="status_mahasiswa">Status</option>
                        </select>
                        <select className="form-input" value={perPage} onChange={(e) => setPerPage(e.target.value)}>
                            <option value="10">10 / halaman</option>
                            <option value="30">30 / halaman</option>
                            <option value="50">50 / halaman</option>
                            <option value="100">100 / halaman</option>
                        </select>
                        <select className="form-input" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                            <option value="desc">Desc</option>
                            <option value="asc">Asc</option>
                        </select>
                        <button type="button" className="btn-primary" onClick={() => applyFilters()}>Terapkan</button>
                        <button type="button" className="btn-outline" onClick={resetFilters}>Reset</button>
                    </div>

                    <div className="mt-4 space-y-3 md:hidden">
                        {mahasiswas.data.length ? (
                            mahasiswas.data.map((m) => <MahasiswaCard key={m.id} item={m} />)
                        ) : (
                            <EmptyState title="Belum ada mahasiswa" description="Data mahasiswa akan muncul setelah ditambahkan." />
                        )}
                    </div>

                    <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                        <table className="min-w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="px-2 py-2">NIM</th>
                                    <th className="px-2 py-2">Nama</th>
                                    <th className="px-2 py-2">Prodi</th>
                                    <th className="px-2 py-2">Angkatan</th>
                                    <th className="px-2 py-2">Status</th>
                                    <th className="px-2 py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mahasiswas.data.length ? (
                                    mahasiswas.data.map((m) => (
                                        <tr key={m.id} className="border-b border-slate-100 align-top">
                                            <td className="px-2 py-2 font-semibold text-slate-700">{m.nim}</td>
                                            <td className="px-2 py-2 text-slate-700">{m.nama}</td>
                                            <td className="px-2 py-2 text-slate-600">{m.prodi?.nama || '-'}</td>
                                            <td className="px-2 py-2 text-slate-600">{m.angkatan}</td>
                                            <td className="px-2 py-2">
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[m.status_mahasiswa] || 'bg-slate-100 text-slate-700'}`}>
                                                    {m.status_mahasiswa}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    <IconButton
                                                        variant="neutral"
                                                        label={`Edit mahasiswa ${m.nim}`}
                                                        onClick={() => {
                                                            openEdit(m);
                                                        }}
                                                    >
                                                        <ActionIcon name="edit" />
                                                    </IconButton>
                                                    <IconButton variant="danger" label={`Hapus mahasiswa ${m.nim}`} onClick={() => confirmDeletion(m)}>
                                                        <ActionIcon name="trash" />
                                                    </IconButton>
                                                </div>
                                                {editingId === m.id && (
                                                    <form
                                                        className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-sky-200 bg-sky-50/60 p-4"
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            edit.put(route('mahasiswa.update', m.id), { preserveScroll: true, onSuccess: cancelEdit });
                                                        }}
                                                    >
                                                        <input className="form-input" value={edit.data.nim} onChange={(e) => edit.setData('nim', e.target.value)} />
                                                        <input className="form-input" value={edit.data.nama} onChange={(e) => edit.setData('nama', e.target.value)} />
                                                        <select className="form-input" value={edit.data.prodi_id} onChange={(e) => edit.setData('prodi_id', e.target.value)}>
                                                            <option value="">Pilih prodi</option>
                                                            {prodis.map((p) => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.nama}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <select className="form-input" value={edit.data.status_mahasiswa} onChange={(e) => edit.setData('status_mahasiswa', e.target.value)}>
                                                            <option value="aktif">aktif</option>
                                                            <option value="cuti">cuti</option>
                                                            <option value="lulus">lulus</option>
                                                            <option value="dropout">dropout</option>
                                                            <option value="nonaktif">nonaktif</option>
                                                        </select>
                                                        <div className="col-span-2 flex gap-2">
                                                            <button className="btn-primary" type="submit">
                                                                Update
                                                            </button>
                                                            <button className="btn-outline" type="button" onClick={cancelEdit}>
                                                                Batal
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-2 py-3 text-slate-500" colSpan="6">
                                            Tidak ada data mahasiswa yang cocok dengan filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan {mahasiswas.meta?.from ?? 0}-{mahasiswas.meta?.to ?? 0} dari {mahasiswas.meta?.total ?? 0} data
                        </p>
                        <PaginationButtons links={mahasiswas.links} onClick={(url) => applyFilters(url)} />
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function UserAccessPage({ auth, users = [], roles = [], permissionCatalog = { menu: {}, action: {} }, filters = { q: '', role: 'all', status: 'all' } }) {
    const { menu, flash, errors } = usePage().props;
    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        identity_number: '',
        password: '',
        role: 'staff',
        is_active: true,
        permissions: [],
    });
    const form = useForm({
        role: '',
        is_active: true,
        permissions: [],
    });
    const filterForm = useForm({
        q: filters?.q || '',
        role: filters?.role || 'all',
        status: filters?.status || 'all',
    });
    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
    });
    const [activeUserId, setActiveUserId] = useState(null);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);

    const menuEntries = Object.entries(permissionCatalog.menu || {});
    const actionEntries = Object.entries(permissionCatalog.action || {});

    const startEdit = (user, overrides = {}) => {
        setActiveUserId(user.id);
        form.setData({
            role: overrides.role ?? user.role ?? '',
            is_active: overrides.is_active ?? !!user.is_active,
            permissions: overrides.permissions ?? user.permissions ?? [],
        });
    };

    const togglePermission = (user, key) => {
        const current = activeUserId === user.id ? (form.data.permissions || []) : (user.permissions || []);
        const next = current.includes(key)
            ? current.filter((item) => item !== key)
            : [...current, key];

        startEdit(user, { permissions: next });
    };

    const setUserRole = (user, role) => {
        startEdit(user, { role });
    };

    const setUserActive = (user, isActive) => {
        startEdit(user, { is_active: isActive });
    };

    const applyFilters = (next = {}) => {
        const payload = {
            q: next.q ?? filterForm.data.q,
            role: next.role ?? filterForm.data.role,
            status: next.status ?? filterForm.data.status,
        };

        filterForm.setData(payload);
        router.get(route('settings.user-access.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const payload = { q: '', role: 'all', status: 'all' };

        filterForm.setData(payload);
        router.get(route('settings.user-access.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const openResetPassword = (user) => {
        passwordForm.reset();
        passwordForm.clearErrors();
        setResetPasswordUser(user);
    };

    const closeResetPassword = () => {
        if (passwordForm.processing) return;

        setResetPasswordUser(null);
        passwordForm.reset();
        passwordForm.clearErrors();
    };

    const submitResetPassword = (event) => {
        event.preventDefault();
        if (!resetPasswordUser) return;

        passwordForm.patch(route('settings.user-access.password', resetPasswordUser.id), {
            preserveScroll: true,
            onSuccess: closeResetPassword,
        });
    };

    const toggleCreatePermission = (key) => {
        const current = createForm.data.permissions || [];
        if (current.includes(key)) {
            createForm.setData('permissions', current.filter((item) => item !== key));
            return;
        }
        createForm.setData('permissions', [...current, key]);
    };

    const isFormBusy = form.processing || passwordForm.processing;

    const submitCreateStaff = (event) => {
        event.preventDefault();
        createForm.post(route('settings.user-access.store'), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-bold text-slate-900">Manajemen User & Akses</h2>}>
            <Head title="Manajemen User & Akses" />

            <div className="space-y-5">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_46%),linear-gradient(140deg,_#ffffff,_#f8fafc)] p-5 shadow-sm sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Superadmin Access Console</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Role, Menu, dan Hak Aksi</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Atur user non-superadmin secara granular: role utama, akses menu sidebar, dan hak aksi tambah/edit/hapus.</p>

                    {flash?.success && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{flash.success}</div>}
                    {errors?.access && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{errors.access}</div>}
                    {errors?.password_reset && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{errors.password_reset}</div>}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tambah Staf</p>
                            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">Buat Akun Operator, Bendahara, Admin, atau Staf</h3>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                Akun yang dibuat dari sini langsung aktif sebagai user internal dan bisa diberi role serta hak akses granular.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submitCreateStaff} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <input className="form-input" placeholder="Nama staf" value={createForm.data.name} onChange={(event) => createForm.setData('name', event.target.value)} />
                                {createForm.errors.name && <p className="mt-1 text-xs font-semibold text-rose-600">{createForm.errors.name}</p>}
                            </div>
                            <div>
                                <input className="form-input" placeholder="Email login" value={createForm.data.email} onChange={(event) => createForm.setData('email', event.target.value)} />
                                {createForm.errors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{createForm.errors.email}</p>}
                            </div>
                            <div>
                                <input className="form-input" placeholder="No HP" value={createForm.data.phone} onChange={(event) => createForm.setData('phone', event.target.value)} />
                                {createForm.errors.phone && <p className="mt-1 text-xs font-semibold text-rose-600">{createForm.errors.phone}</p>}
                            </div>
                            <div>
                                <input className="form-input" placeholder="NIP/NIK/ID internal" value={createForm.data.identity_number} onChange={(event) => createForm.setData('identity_number', event.target.value)} />
                                {createForm.errors.identity_number && <p className="mt-1 text-xs font-semibold text-rose-600">{createForm.errors.identity_number}</p>}
                            </div>
                            <div>
                                <input className="form-input" type="password" placeholder="Password awal" value={createForm.data.password} onChange={(event) => createForm.setData('password', event.target.value)} />
                                {createForm.errors.password && <p className="mt-1 text-xs font-semibold text-rose-600">{createForm.errors.password}</p>}
                            </div>
                            <div>
                                <select className="form-input" value={createForm.data.role} onChange={(event) => createForm.setData('role', event.target.value)}>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>{role.name}</option>
                                    ))}
                                </select>
                                {createForm.errors.role && <p className="mt-1 text-xs font-semibold text-rose-600">{createForm.errors.role}</p>}
                            </div>
                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                                <input type="checkbox" checked={createForm.data.is_active} onChange={(event) => createForm.setData('is_active', event.target.checked)} />
                                Akun aktif dan bisa login
                            </label>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Akses Menu</p>
                                <div className="mt-2 max-h-56 space-y-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                                    {menuEntries.map(([key, label]) => (
                                        <label key={`create-${key}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-white">
                                            <input type="checkbox" checked={createForm.data.permissions.includes(key)} onChange={() => toggleCreatePermission(key)} />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Hak Aksi</p>
                                <div className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                                    {actionEntries.map(([key, label]) => (
                                        <label key={`create-${key}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-white">
                                            <input type="checkbox" checked={createForm.data.permissions.includes(key)} onChange={() => toggleCreatePermission(key)} />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                                {createForm.errors.permissions && <p className="mt-1 text-xs font-semibold text-rose-600">{createForm.errors.permissions}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end lg:col-span-2">
                            <button type="submit" className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,0.9)] transition hover:brightness-105 disabled:opacity-60" disabled={createForm.processing}>
                                {createForm.processing ? 'Membuat akun...' : 'Tambah Staf'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto] lg:items-end">
                            <label className="block">
                                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Cari User</span>
                                <input
                                    className="form-input"
                                    placeholder="Nama, email, HP, atau ID internal"
                                    value={filterForm.data.q}
                                    onChange={(event) => filterForm.setData('q', event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') applyFilters({ q: event.currentTarget.value });
                                    }}
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Role</span>
                                <select className="form-input" value={filterForm.data.role} onChange={(event) => applyFilters({ role: event.target.value })}>
                                    <option value="all">Semua Role</option>
                                    {roles.map((role) => (
                                        <option key={`filter-${role.id}`} value={role.name}>{role.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Status</span>
                                <select className="form-input" value={filterForm.data.status} onChange={(event) => applyFilters({ status: event.target.value })}>
                                    <option value="all">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </label>
                            <button type="button" className="btn-primary justify-center" onClick={() => applyFilters()}>
                                Terapkan
                            </button>
                            <button type="button" className="btn-outline justify-center" onClick={resetFilters}>
                                Reset
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">{users.length} user ditampilkan sesuai filter aktif.</p>
                    </div>

                    {users.length === 0 && (
                        <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <p className="text-sm font-bold text-slate-800">Belum ada user selain superadmin.</p>
                            <p className="mt-2 text-xs text-slate-600">
                                Tambahkan akun staf dari formulir di atas, atau kelola user yang dibuat dari modul lain setelah akun tersebut masuk ke sistem.
                            </p>
                        </article>
                    )}

                    {users.map((user) => {
                        const isEditingThisUser = activeUserId === user.id;

                        return (
                            <article key={user.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900">{user.name}</h4>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pengaturan Akses</p>
                                        <button
                                            type="button"
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                                            onClick={() => startEdit(user)}
                                        >
                                            Edit User Ini
                                        </button>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Role Utama</label>
                                        <select
                                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                            value={isEditingThisUser ? form.data.role : (user.role || '')}
                                            onChange={(event) => {
                                                setUserRole(user, event.target.value);
                                            }}
                                        >
                                            <option value="">Pilih role</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.name}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={isEditingThisUser ? form.data.is_active : !!user.is_active}
                                            onChange={(event) => {
                                                setUserActive(user, event.target.checked);
                                            }}
                                        />
                                        Akun aktif dan bisa login
                                    </label>

                                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Akses Menu</p>
                                            <div className="mt-2 max-h-52 space-y-1 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
                                                {menuEntries.map(([key, label]) => {
                                                    const checked = (isEditingThisUser ? form.data.permissions : user.permissions || []).includes(key);
                                                    return (
                                                        <label key={key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => togglePermission(user, key)}
                                                            />
                                                            <span>{label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Hak Aksi</p>
                                            <div className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-white p-2">
                                                {actionEntries.map(([key, label]) => {
                                                    const checked = (isEditingThisUser ? form.data.permissions : user.permissions || []).includes(key);
                                                    return (
                                                        <label key={key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => togglePermission(user, key)}
                                                            />
                                                            <span>{label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                                            disabled={isFormBusy}
                                            onClick={() => openResetPassword(user)}
                                        >
                                            Reset Password
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,0.9)] transition hover:brightness-105 disabled:opacity-60"
                                            disabled={isFormBusy}
                                            onClick={() => {
                                                if (!isEditingThisUser) startEdit(user);
                                                form.put(route('settings.user-access.update', user.id), {
                                                    preserveScroll: true,
                                                });
                                            }}
                                        >
                                            Simpan Akses
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            </div>

            <Modal show={Boolean(resetPasswordUser)} onClose={closeResetPassword} maxWidth="md">
                <form onSubmit={submitResetPassword} className="bg-white p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Reset Password</p>
                    <h4 className="mt-2 text-xl font-black text-slate-900">{resetPasswordUser?.name || 'User'}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Password baru akan langsung aktif untuk akun ini. Gunakan password sementara yang kuat dan minta user menggantinya dari profil.
                    </p>

                    <div className="mt-5 space-y-3">
                        <div>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Password baru"
                                value={passwordForm.data.password}
                                onChange={(event) => passwordForm.setData('password', event.target.value)}
                            />
                            {passwordForm.errors.password && <p className="mt-1 text-xs font-semibold text-rose-600">{passwordForm.errors.password}</p>}
                        </div>
                        <div>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Konfirmasi password baru"
                                value={passwordForm.data.password_confirmation}
                                onChange={(event) => passwordForm.setData('password_confirmation', event.target.value)}
                            />
                            {passwordForm.errors.password_confirmation && <p className="mt-1 text-xs font-semibold text-rose-600">{passwordForm.errors.password_confirmation}</p>}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                            disabled={passwordForm.processing}
                            onClick={closeResetPassword}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-slate-800 disabled:opacity-60"
                            disabled={passwordForm.processing}
                        >
                            {passwordForm.processing ? 'Mereset...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

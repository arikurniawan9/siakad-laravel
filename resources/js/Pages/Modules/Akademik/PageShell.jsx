import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import SectionNav from './SectionNav';

export default function PageShell({ auth, title, tabs = [], children, showFlash = true, heroVariant = 'default' }) {
    const { menu, flash } = usePage().props;

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title={title} />
            <SectionNav tabs={tabs} />
            {heroVariant === 'default' && (
                <div className="panel mb-4 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Modul Akademik</p>
                    <h3 className="mt-2 text-base font-black text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">Halaman khusus untuk mengelola data {title.toLowerCase()} secara terpisah dan lebih fokus.</p>
                </div>
            )}
            {heroVariant === 'corner' && (
                <div className="mb-3 flex justify-end">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 shadow-sm backdrop-blur">
                        {title}
                    </div>
                </div>
            )}
            {flash?.error && <div className="mb-3 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">{flash.error}</div>}
            {showFlash && flash?.success && <div className="mb-3 rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">{flash.success}</div>}
            {children}
        </AuthenticatedLayout>
    );
}

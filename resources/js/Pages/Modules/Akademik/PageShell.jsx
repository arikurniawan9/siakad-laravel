import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import SectionNav from './SectionNav';

export default function PageShell({ auth, title, tabs = [], children, showFlash = true }) {
    const { menu, flash } = usePage().props;

    return (
        <AuthenticatedLayout user={auth.user} menu={menu} header={<h2 className="text-xl font-extrabold text-slate-900">{title}</h2>}>
            <Head title={title} />
            <SectionNav tabs={tabs} />
            <div className="panel mb-4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Modul Akademik</p>
                <h3 className="mt-2 text-base font-black text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">Halaman khusus untuk mengelola data {title.toLowerCase()} secara terpisah dan lebih fokus.</p>
            </div>
            {flash?.error && <div className="mb-3 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">{flash.error}</div>}
            {showFlash && flash?.success && <div className="mb-3 rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">{flash.success}</div>}
            {children}
        </AuthenticatedLayout>
    );
}

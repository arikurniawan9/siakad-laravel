export default function EmptyState({ title = 'Belum ada data', description = 'Silakan tambahkan data pertama dari form di sisi kiri.' }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
            <p className="font-bold text-slate-900">{title}</p>
            <p className="mt-1 text-slate-500">{description}</p>
        </div>
    );
}

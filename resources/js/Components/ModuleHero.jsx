export default function ModuleHero({ eyebrow, title, description, note }) {
    return (
        <section className="panel overflow-hidden">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_55%),linear-gradient(135deg,_#f8fafc,_#eef2ff)] px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
                {note ? (
                    <div className="mt-5 rounded-2xl border border-sky-100 bg-white/80 px-4 py-4 shadow-sm shadow-sky-100/40">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Catatan</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">{note}</p>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

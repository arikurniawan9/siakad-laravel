import { Link } from '@inertiajs/react';

export default function SectionNav({ tabs = [] }) {
    return (
        <div className="panel sticky top-4 z-20 mb-4 p-2 shadow-sm">
            <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                    const active = route().current(tab.route);

                    return (
                        <Link
                            key={tab.route}
                            href={route(tab.route)}
                            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

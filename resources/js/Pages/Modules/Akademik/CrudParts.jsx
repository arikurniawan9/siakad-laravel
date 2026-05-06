export function FieldError({ message }) {
    return message ? <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p> : null;
}

export function StatusBadge({ active, activeLabel = 'Aktif', inactiveLabel = 'Nonaktif' }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {active ? activeLabel : inactiveLabel}
        </span>
    );
}

export function ActionIcon({ name, className = 'h-4 w-4' }) {
    const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8 };

    switch (name) {
        case 'plus':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                </svg>
            );
        case 'upload':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10m0-10 4 4m-4-4-4 4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" />
                </svg>
            );
        case 'download':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11m0 10 4-4m-4 4-4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 9V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" />
                </svg>
            );
        case 'sheet':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h8M8 17h8M8 9h4" />
                </svg>
            );
        case 'edit':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4 20 4.5-1 10-10a1.8 1.8 0 0 0 0-2.5l-.5-.5a1.8 1.8 0 0 0-2.5 0l-10 10L4 20Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m13.5 6.5 4 4" />
                </svg>
            );
        case 'trash':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6m4-6v6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l1 12h8l1-12" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5h6v2" />
                </svg>
            );
        default:
            return null;
    }
}

export function IconButton({ variant = 'neutral', label, title, onClick, children }) {
    const styles = {
        neutral: 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700',
        danger: 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700',
    };

    return (
        <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${styles[variant]}`}
            onClick={onClick}
            aria-label={label}
            title={title || label}
        >
            {children}
        </button>
    );
}

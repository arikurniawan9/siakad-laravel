import { useEffect, useMemo, useRef, useState } from 'react';

const TOAST_DURATION_MS = 3200;
const TOAST_EXIT_MS = 220;

export default function GlobalFlashToast({ success, error, warning, info, toastKey }) {
    const [queue, setQueue] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const closeButtonRef = useRef(null);

    const toneClasses = useMemo(
        () => ({
            success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
            error: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200',
            warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
            info: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
        }),
        []
    );

    const enqueue = (type, message) => {
        if (!message) return;
        setQueue((prev) => [...prev, { id: `${type}-${Date.now()}-${Math.random()}`, type, message: String(message) }]);
    };

    useEffect(() => enqueue('success', success), [success, toastKey]);
    useEffect(() => enqueue('error', error), [error, toastKey]);
    useEffect(() => enqueue('warning', warning), [warning, toastKey]);
    useEffect(() => enqueue('info', info), [info, toastKey]);

    const current = queue[0] || null;

    useEffect(() => {
        if (!current) return undefined;
        setIsVisible(true);

        const hideTimer = setTimeout(() => setIsVisible(false), TOAST_DURATION_MS);
        const shiftTimer = setTimeout(() => {
            setQueue((prev) => prev.slice(1));
        }, TOAST_DURATION_MS + TOAST_EXIT_MS);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(shiftTimer);
        };
    }, [current]);

    useEffect(() => {
        if (!current || !isVisible) return;
        closeButtonRef.current?.focus();
    }, [current, isVisible]);

    useEffect(() => {
        if (!current) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setIsVisible(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [current]);

    if (!current) return null;

    const progressClass = {
        success: 'bg-emerald-500 dark:bg-emerald-300',
        error: 'bg-rose-500 dark:bg-rose-300',
        warning: 'bg-amber-500 dark:bg-amber-300',
        info: 'bg-sky-500 dark:bg-sky-300',
    }[current.type] || 'bg-sky-500 dark:bg-sky-300';

    return (
        <div className="fixed inset-x-3 top-16 z-50 sm:inset-x-auto sm:right-4 sm:top-20" aria-live="polite" aria-atomic="true">
            <div
                role="status"
                className={`w-full max-w-[min(92vw,28rem)] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-200 sm:max-w-[28rem] ${
                    toneClasses[current.type] || toneClasses.info
                } ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}
            >
                <div className="flex items-start gap-3">
                    <p className="pr-1">{current.message}</p>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={() => setIsVisible(false)}
                        className="rounded-md border border-current/25 px-2 py-0.5 text-xs font-bold opacity-80 transition hover:opacity-100"
                        aria-label="Tutup notifikasi"
                        title="Tutup"
                    >
                        x
                    </button>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div
                        key={current.id}
                        className={`h-full origin-left animate-[toastProgress_3200ms_linear_forwards] ${progressClass}`}
                    />
                </div>
            </div>
        </div>
    );
}


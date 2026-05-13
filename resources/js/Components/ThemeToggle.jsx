export default function ThemeToggle({ theme = 'light', onToggle, className = '' }) {
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`top-btn ${className}`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M12 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1zm0 13a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm8-5a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM7 12a1 1 0 0 1-1 1H5a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zm8.66 4.24a1 1 0 0 1 1.41 0l.71.71a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41zM7.22 7.81a1 1 0 0 1 1.41 0l.71.71A1 1 0 1 1 7.93 9.93l-.71-.71a1 1 0 0 1 0-1.41zm10.56 0a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0zM9.34 15.66a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M21 14.25A8.25 8.25 0 1 1 9.75 3a.75.75 0 0 1 .92.95 6.75 6.75 0 0 0 8.38 8.38.75.75 0 0 1 .95.92z" />
                </svg>
            )}
        </button>
    );
}

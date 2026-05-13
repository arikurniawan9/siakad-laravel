import { useEffect, useState } from 'react';

const STORAGE_KEY = 'siakad_theme_mode';
const DEFAULT_THEME = 'light';

function applyThemeClass(mode) {
    document.documentElement.classList.toggle('dark', mode === 'dark');
}

export default function useTheme() {
    const [theme, setTheme] = useState(DEFAULT_THEME);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        const initialTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : DEFAULT_THEME;
        setTheme(initialTheme);
        applyThemeClass(initialTheme);
        setReady(true);
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => {
            const nextTheme = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem(STORAGE_KEY, nextTheme);
            applyThemeClass(nextTheme);
            return nextTheme;
        });
    };

    return { theme, toggleTheme, ready };
}

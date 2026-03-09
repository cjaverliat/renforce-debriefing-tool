import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
    }
    return 'system';
}

function applyTheme(theme: Theme) {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({children}: {children: ReactNode}) {
    const [theme, setThemeState] = useState<Theme>(getStoredTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        const stored = getStoredTheme();
        return stored === 'system' ? getSystemTheme() : stored;
    });

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
        setResolvedTheme(resolved);
        applyTheme(newTheme);
    };

    // Apply theme on mount and when it changes
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // Update resolvedTheme when system preference changes
    useEffect(() => {
        if (theme !== 'system') {
            setResolvedTheme(theme);
            return;
        }

        const updateResolved = () => {
            const resolved = getSystemTheme();
            setResolvedTheme(resolved);
            applyTheme('system');
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', updateResolved);
        return () => mediaQuery.removeEventListener('change', updateResolved);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{theme, setTheme, resolvedTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

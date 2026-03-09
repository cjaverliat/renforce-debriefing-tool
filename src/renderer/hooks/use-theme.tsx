/**
 * Theme context and hooks for light/dark/system theme management.
 *
 * The theme preference is persisted in `localStorage` under the key `'theme'`
 * and applied by toggling the `'dark'` class on `document.documentElement`,
 * which Tailwind CSS uses for its `dark:` variant.
 *
 * When set to `'system'`, the resolved theme follows the OS preference
 * (`prefers-color-scheme: dark`) and updates automatically via a
 * `MediaQueryList` change event listener.
 *
 * Usage:
 *   Wrap the app in `<ThemeProvider>`, then call `useTheme()` in any child
 *   component to read `theme`, `resolvedTheme`, and `setTheme`.
 */
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

/**
 * Applies the given theme to the DOM by toggling the `dark` class on `<html>`.
 * Called on mount, on theme change, and when the system preference changes.
 */
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

/**
 * Provides theme state to the component tree.
 * Must wrap the root `<App>` component (see `src/renderer/main.tsx`).
 *
 * @param props.children - The application subtree that needs theme access.
 */
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

/**
 * Returns the current theme context value.
 *
 * @returns `{ theme, setTheme, resolvedTheme }` where:
 *   - `theme`         — the stored preference (`'light' | 'dark' | 'system'`)
 *   - `setTheme`      — updates the preference and persists it to localStorage
 *   - `resolvedTheme` — the actually applied theme (`'light' | 'dark'`), never `'system'`
 * @throws If called outside a `ThemeProvider`.
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

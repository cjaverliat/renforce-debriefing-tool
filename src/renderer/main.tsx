/**
 * Renderer entry point.
 *
 * Bootstraps the React application:
 *   1. Queries the main process for the `--mock-session` flag via IPC.
 *   2. Wraps the app in `ThemeProvider` so all components can access the current theme.
 *   3. Mounts the `App` component into `#root`.
 *
 * The IPC call must complete before the first render so that `App` knows
 * upfront whether to display mock data or the real session-loading flow.
 */
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import '@/renderer/i18n';
import { App } from '@/renderer/app.tsx';
import { ThemeProvider } from '@/renderer/hooks/use-theme.tsx';

window.electronAPI.getMockSession().then((mockSession) => {
    createRoot(document.getElementById('root')!).render(
        <ThemeProvider>
            <App mockSession={mockSession} />
        </ThemeProvider>
    );
});

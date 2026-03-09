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

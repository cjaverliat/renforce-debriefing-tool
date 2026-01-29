import { createRoot } from 'react-dom/client';
import './styles/index.css';
import '@/renderer/i18n';
import { App } from '@/renderer/app.tsx';

createRoot(document.getElementById('root')!).render(<App />);

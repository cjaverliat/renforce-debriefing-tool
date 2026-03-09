/**
 * Vite configuration for the renderer (React) process.
 *
 * Plugins:
 *   - @vitejs/plugin-react        — JSX transform and fast-refresh in development
 *   - @tailwindcss/vite           — Tailwind CSS v4 integration (no PostCSS config required)
 *
 * Path aliases match the main/preload configs so that shared types can be imported
 * using @/shared/... from renderer code:
 *   @/     → src/
 *   @proto/ → generated/typescript/
 */
import {defineConfig} from 'vite';
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config
export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@proto': path.resolve(__dirname, './generated/typescript'),
        },
    },
})
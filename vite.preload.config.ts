/**
 * Vite configuration for the Electron preload script bundle.
 *
 * The preload script runs in a sandboxed renderer context with access to
 * Node.js and Electron APIs. It uses the same path aliases as the main
 * process so that shared types can be imported consistently.
 *
 * Path aliases:
 *   @/     → src/
 *   @proto/ → generated/typescript/
 */
import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@proto': path.resolve(__dirname, './generated/typescript'),
        },
    },
});

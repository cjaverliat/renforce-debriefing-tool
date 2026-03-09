/**
 * Vite configuration for the Electron main process bundle.
 *
 * Path aliases:
 *   @/     → src/                            (shared types, parsers, utils)
 *   @proto/ → generated/typescript/          (protobuf-generated TypeScript bindings)
 */
import {defineConfig} from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@proto': path.resolve(__dirname, './generated/typescript'),
        },
    }
});

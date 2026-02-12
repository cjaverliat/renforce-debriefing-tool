import {defineConfig} from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@proto': path.resolve(__dirname, './generated/typescript'),
        },
    },
    build: {
        rollupOptions: {
            external: ["lz4", "xxhash"]
        }
    }
});

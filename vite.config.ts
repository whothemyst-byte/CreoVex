import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ['../../../engine/pkg/creovox_engine.js'] // Exclude Wasm module from pre-bundling
    },
    assetsInclude: ['**/*.wasm'], // Treat .wasm files as assets
    base: './',
    build: {
        outDir: 'dist/renderer'
    },
    server: {
        port: 5173,
        fs: {
            // Allow serving files from engine/pkg
            allow: ['..']
        }
    }
});

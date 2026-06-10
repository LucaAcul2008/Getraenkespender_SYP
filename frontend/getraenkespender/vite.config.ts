import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/www',
    assetsDir: '',
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: (info) => {
          if (info.names?.[0]?.endsWith('.css')) return 'app.css';
          return '[name][extname]';
        },
        manualChunks: undefined,
        inlineDynamicImports: true,
      }
    },
    cssCodeSplit: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
  }
})
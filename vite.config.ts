import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/popup/index.html',
          dest: '',
          rename: 'popup.html'
        },
        {
          src: 'src/dashboard/index.html',
          dest: '',
          rename: 'dashboard.html'
        },
        {
          src: 'src/options/index.html',
          dest: '',
          rename: 'options.html'
        },
        {
          src: 'src/blocked/index.html',
          dest: '',
          rename: 'blocked.html'
        },
        {
          src: 'public/manifest.json',
          dest: ''
        }
      ]
    })
  ],
  base: './',
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/main.tsx'),
        dashboard: resolve(__dirname, 'src/dashboard/main.tsx'),
        options: resolve(__dirname, 'src/options/main.tsx'),
        blocked: resolve(__dirname, 'src/blocked/main.tsx'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
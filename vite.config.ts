import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Three.js 單獨成一個延遲載入的檔案（約 145 kB gzip），清單介面不必等它
    chunkSizeWarningLimit: 700,
  },
});

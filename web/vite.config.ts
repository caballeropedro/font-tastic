import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@font-tastic/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@font-tastic/devtool': path.resolve(__dirname, '../packages/devtool/src/index.tsx')
    }
  },
  server: {
    port: 3000
  }
});

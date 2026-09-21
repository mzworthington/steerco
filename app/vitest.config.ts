import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appRoot, '..');

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [appRoot, path.join(repoRoot, 'docs')],
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.{test,spec}.{ts,tsx}',
        '**/test/**',
        '**/tests/**',
        '**/scripts/**',
        '**/vite.config.*',
        '**/vitest.config.*',
        '**/.vite/**',
        '**/vite/**',
        '**/*.d.ts',
      ],
    },
  },
});

/// <reference types="vitest/config" />
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const alias = {
  '@': path.resolve(import.meta.dirname, 'src'),
  '@server': path.resolve(import.meta.dirname, 'server'),
  '@shared': path.resolve(import.meta.dirname, 'shared'),
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias },
  server: {
    // `npm run dev` starts the API on :3000 next to Vite; the browser only ever sees `/api`.
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'web',
          environment: 'jsdom',
          // Needed for React Testing Library's automatic cleanup. Tests still import from 'vitest'.
          globals: true,
          // Must match VITE_API_URL in .env.test: MSW resolves handler paths against this origin.
          environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          css: false,
        },
      },
      {
        extends: true,
        test: {
          name: 'api',
          environment: 'node',
          include: ['server/**/*.test.ts', 'shared/**/*.test.ts'],
        },
      },
    ],
  },
});

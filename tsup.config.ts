import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // `typescript` stays external: we use the compiler API at runtime and it is a real dependency.
  external: ['typescript'],
  banner: { js: '#!/usr/bin/env node' },
});

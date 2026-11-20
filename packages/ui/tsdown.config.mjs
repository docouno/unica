import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['esm'],
  dts: { isolatedDeclarations: true },
  clean: true,
  css: {
    splitting: false,
    fileName: 'style.css',
  },
  copy: ['src/styles.d.ts'],
  deps: {
    neverBundle: [/^[^./]/],
  },
});

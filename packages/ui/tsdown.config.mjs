import { Features } from 'lightningcss';
import { defineConfig } from 'tsdown';
import { createLightningCssOptions } from '../../css.config.mjs';

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['esm'],
  dts: { isolatedDeclarations: true },
  clean: true,
  css: {
    splitting: false,
    fileName: 'style.css',
    lightningcss: createLightningCssOptions(Features),
  },
  copy: ['src/styles.d.ts'],
  deps: {
    neverBundle: [/^[^./]/],
  },
});

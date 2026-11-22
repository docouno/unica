import { env } from 'node:process';
import { devkitWorkspaceSource } from '@docouno/env/vite';
import react from '@vitejs/plugin-react';
import { Features } from 'lightningcss';
import { defineConfig } from 'vite';
import { VITE_CSS_TARGET } from '../../css.config.mjs';

export default defineConfig({
  plugins: [devkitWorkspaceSource(), react()],
  cacheDir: 'node_modules/.cache/devkit-vite',
  resolve: { dedupe: ['react', 'react-dom'] },
  css: {
    lightningcss: {
      exclude: Features.DirSelector,
    },
  },
  optimizeDeps: {
    include: ['@phosphor-icons/react'],
  },
  build: {
    cssTarget: [...VITE_CSS_TARGET],
    rolldownOptions: {
      output: {
        // Shared example modules must initialize before the catalog's split specimens.
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            { name: 'react', test: /\/node_modules\/(?:react|react-dom|scheduler)\// },
            { name: 'icons', test: /\/node_modules\/@phosphor-icons\/react\// },
            { name: 'jsx-parser', test: /\/node_modules\/prettier\/plugins\/babel\.mjs$/ },
            { name: 'workbench-definitions', test: /\/src\/workbench\/types\.ts$/ },
            {
              name: 'specimens',
              test: /\/src\/specimens\//,
              // Statically import examples within this group so a chunk never awaits itself.
              // Keep each declaration's prototype dependencies in the native module graph.
              includeDependenciesRecursively: false,
              maxSize: 300_000,
            },
          ],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    ...(env.DEVKIT_API_TARGET ? { proxy: { '/api': env.DEVKIT_API_TARGET } } : {}),
  },
});

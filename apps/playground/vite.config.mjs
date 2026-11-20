import { env } from 'node:process';
import { devkitWorkspaceSource } from '@docouno/env/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [devkitWorkspaceSource(), react()],
  cacheDir: 'node_modules/.cache/devkit-vite',
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: {
    include: ['@phosphor-icons/react'],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /\/node_modules\/(?:react|react-dom|scheduler)\// },
            { name: 'icons', test: /\/node_modules\/@phosphor-icons\/react\// },
            { name: 'workbench-definitions', test: /\/src\/workbench\/types\.ts$/ },
            {
              name: 'specimens',
              test: /\/src\/specimens\//,
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

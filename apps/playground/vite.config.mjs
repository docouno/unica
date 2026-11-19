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
              name: 'disclosure',
              test: /\/src\/prototypes\/disclosure\//,
              includeDependenciesRecursively: false,
            },
            {
              name: 'combobox',
              test: /\/src\/prototypes\/combobox\//,
              includeDependenciesRecursively: false,
            },
            {
              name: 'select',
              test: /\/src\/prototypes\/select\//,
              includeDependenciesRecursively: false,
            },
            {
              name: 'menu',
              test: /\/src\/prototypes\/menu\//,
              includeDependenciesRecursively: false,
            },
            {
              name: 'pagination',
              test: /\/src\/prototypes\/pagination\//,
              includeDependenciesRecursively: false,
            },
            {
              name: 'tabs',
              test: /\/src\/prototypes\/tabs\//,
              includeDependenciesRecursively: false,
            },
            {
              name: 'table',
              test: /\/src\/prototypes\/table\//,
              includeDependenciesRecursively: false,
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

import { env } from 'node:process';
import { devkitWorkspaceSource } from '@docouno/env/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function resolveAllowedHosts() {
  const hosts = new Set(['localhost', '127.0.0.1']);
  if (env.VITE_ALLOWED_HOSTS) {
    for (const entry of env.VITE_ALLOWED_HOSTS.split(',')) {
      const trimmed = entry.trim();
      if (trimmed) {
        hosts.add(trimmed);
      }
    }
  }
  return [...hosts];
}

export default defineConfig({
  plugins: [devkitWorkspaceSource(), react()],
  cacheDir: 'node_modules/.cache/devkit-vite',
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: {
    include: ['@phosphor-icons/react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: resolveAllowedHosts(),
    ...(env.DEVKIT_API_TARGET ? { proxy: { '/api': env.DEVKIT_API_TARGET } } : {}),
  },
});

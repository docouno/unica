import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { devkitWorkspaceSource } from '@docouno/env/vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const item = process.env.VISUAL_ITEM ?? '';
const mode = process.env.VISUAL_MODE ?? '6up';
const theme = process.env.VISUAL_THEME ?? 'frost-dark';
const surface = process.env.VISUAL_SURFACE ?? 'auto';
const vp = process.env.VISUAL_VP ?? '';
const scale = process.env.VISUAL_SCALE ?? '100';
const dir = process.env.VISUAL_DIR ?? 'ltr';
const section = process.env.VISUAL_SECTION ?? 'all';
const raw = process.env.VISUAL_RAW ?? '1';
const slug = item || 'workbench';
const outName =
  process.env.VISUAL_OUT ||
  `${slug}-${mode}${mode === 'focus' ? `-${theme}` : ''}${surface !== 'auto' ? `-${surface}` : ''}${section !== 'all' ? `-${section}` : ''}${vp ? `-vp${vp}` : ''}${scale !== '100' ? `-s${scale}` : ''}${dir !== 'ltr' ? `-${dir}` : ''}${raw === '0' ? '-chrome' : ''}.png`;

const appRoot = resolve(import.meta.dirname, '..');
const outDir = resolve(appRoot, '../../.artifacts/visual');
await mkdir(outDir, { recursive: true });

const t0 = performance.now();

const [server, browser] = await Promise.all([
  createServer({
    configFile: false,
    root: appRoot,
    cacheDir: process.env.VITE_CACHE_DIR ?? '/tmp/vite-visual-cache',
    logLevel: 'error',
    plugins: [devkitWorkspaceSource(), react()],
    resolve: { dedupe: ['react', 'react-dom'] },
    optimizeDeps: { include: ['@phosphor-icons/react'] },
    server: { host: '127.0.0.1', port: 0 },
  }).then((s) => s.listen()),
  chromium.launch({
    headless: true,
    chromiumSandbox: false,
    args: ['--disable-gpu', '--font-render-hinting=none'],
  }),
]);

try {
  const addr = server.httpServer?.address();
  const port = typeof addr === 'object' && addr ? addr.port : 5173;
  const params = new URLSearchParams({
    mode,
    theme,
    scale,
    dir,
    section,
    freeze: '1',
  });
  if (item) {
    params.set('item', item);
  }
  if (vp) {
    params.set('vp', vp);
  }
  if (surface !== 'auto') {
    params.set('surface', surface);
  }
  if (raw === '1') {
    params.set('raw', '1');
  }

  const vpNum = Number(vp);
  const baseWidth = raw === '0' ? 1560 : mode === 'focus' ? 1120 : 1440;
  const width =
    mode === 'focus' && Number.isFinite(vpNum) && vpNum > 0
      ? Math.max(baseWidth, vpNum + (raw === '0' ? 360 : 96))
      : baseWidth;

  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 2,
  });

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  const url = `http://127.0.0.1:${String(port)}/?${params.toString()}`;
  const resp = await page.goto(url, { waitUntil: 'networkidle' });
  if (!resp || resp.status() >= 400) {
    throw new Error(`HTTP ${String(resp?.status())} for ${url}`);
  }

  await page.waitForSelector('html[data-wb-ready="1"]', { timeout: 8000 });
  if (mode === 'focus') {
    const neededWidth = await page.evaluate(() => {
      const inner = document.querySelector('.wb-viewport-inner');
      if (!inner) {
        return 0;
      }
      const rect = inner.getBoundingClientRect();
      const hasRail = Boolean(document.querySelector('.wb-rail'));
      return Math.ceil(rect.width) + (hasRail ? 360 : 96);
    });
    if (neededWidth > width) {
      await page.setViewportSize({ width: neededWidth, height: 900 });
    }
  }
  if (errors.length > 0) {
    throw new Error(`Runtime errors:\n${errors.join('\n')}`);
  }

  const outPath = resolve(outDir, outName);
  await page.screenshot({ path: outPath, fullPage: true });
  const elapsedMs = Math.round(performance.now() - t0);
  process.stdout.write(`visual: wrote ${outPath} (${String(elapsedMs)} ms)\n`);
} finally {
  await Promise.all([browser.close(), server.close()]);
}

import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { devkitWorkspaceSource } from '@docouno/env/vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const raw = process.env.VISUAL_RAW !== '0';
const params = new URLSearchParams({ freeze: '1' });
for (const key of [
  'item',
  'tab',
  'family',
  'scheme',
  'slice',
  'mode',
  'block',
  'bounds',
  'surface',
  'vp',
  'scale',
  'dir',
]) {
  const value = process.env[`VISUAL_${key.toUpperCase()}`];
  if (value) {
    params.set(key, value);
  }
}
params.set('raw', raw ? '1' : '0');

function filenamePart(value) {
  return encodeURIComponent(value).replaceAll('_', '%5F');
}

const nameParts = [filenamePart(params.get('item') || 'workbench')];
for (const [key, value] of params) {
  if (key !== 'item' && key !== 'freeze') {
    nameParts.push(`${key}-${filenamePart(value)}`);
  }
}
const outName = process.env.VISUAL_OUT || `${nameParts.join('_')}.png`;

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
    server: { host: '127.0.0.1', port: 0, watch: null, hmr: false },
  }).then((s) => s.listen()),
  chromium.launch({
    headless: true,
    chromiumSandbox: false,
    // Keep native overflow visible in design review, including classic scrollbars.
    ignoreDefaultArgs: ['--hide-scrollbars'],
    args: [
      '--disable-gpu',
      '--font-render-hinting=none',
      // Paint the full document without changing viewport units or inner overflow.
      '--blink-settings=mainFrameClipsContent=false',
    ],
  }),
]);

try {
  const addr = server.httpServer?.address();
  const port = typeof addr === 'object' && addr ? addr.port : 5173;
  const width = raw ? 1440 : 1560;

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

  async function waitForReady() {
    try {
      await page.waitForSelector('html[data-wb-ready="1"]', { timeout: 8000 });
    } catch (error) {
      if (errors.length > 0) {
        throw new Error(`Runtime errors:\n${errors.join('\n')}`, { cause: error });
      }
      throw error;
    }
  }

  await waitForReady();
  if ((await page.locator('.wb-artboard').count()) === 1) {
    const fitWidth = await page.evaluate(() => {
      const host = document.querySelector('.wb-viewport-host');
      const inner = document.querySelector('.wb-viewport-inner');
      if (!host || !inner) {
        return 0;
      }
      const { paddingInlineStart, paddingInlineEnd } = window.getComputedStyle(host);
      const chromeWidth = window.innerWidth - host.clientWidth;
      const innerWidth = inner.getBoundingClientRect().width;
      return Math.ceil(
        innerWidth + chromeWidth + parseFloat(paddingInlineStart) + parseFloat(paddingInlineEnd),
      );
    });
    const isolatedWidth = Math.max(raw ? 1120 : 1560, fitWidth);
    if (isolatedWidth !== width) {
      // A previous readiness signal describes the old CSS viewport.
      await page.evaluate(() => document.documentElement.removeAttribute('data-wb-ready'));
      await page.setViewportSize({ width: isolatedWidth, height: 900 });
      await waitForReady();
    }
  }
  if (errors.length > 0) {
    throw new Error(`Runtime errors:\n${errors.join('\n')}`);
  }

  const outPath = resolve(outDir, outName);
  const layoutViewport = page.viewportSize();
  const captureSize = await page.evaluate(() => ({
    width: Math.max(window.innerWidth, document.documentElement.scrollWidth),
    height: Math.max(window.innerHeight, document.documentElement.scrollHeight),
  }));
  if (!layoutViewport) {
    throw new Error('A fixed layout viewport is required for visual capture.');
  }
  const captureSession = await page.context().newCDPSession(page);
  await captureSession.send('Emulation.setDeviceMetricsOverride', {
    mobile: false,
    ...layoutViewport,
    deviceScaleFactor: 2,
  });
  // The fullPage path hides native scrollbars and changes their occupied space.
  // Capture the unclipped document directly while preserving its layout viewport.
  const capture = await captureSession.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, ...captureSize, scale: 1 },
  });
  if (errors.length > 0) {
    throw new Error(`Runtime errors:\n${errors.join('\n')}`);
  }
  await writeFile(outPath, Buffer.from(capture.data, 'base64'));
  const elapsedMs = Math.round(performance.now() - t0);
  process.stdout.write(`visual: wrote ${outPath} (${String(elapsedMs)} ms)\n`);
} finally {
  await Promise.all([browser.close(), server.close()]);
}

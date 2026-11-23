import { Buffer } from 'node:buffer';
import { constants } from 'node:fs';
import { mkdir, realpath, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve, sep } from 'node:path';
import process from 'node:process';
import { devkitWorkspaceSource } from '@docouno/env/vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const rawOption = process.env.VISUAL_RAW || '1';
if (!['0', '1'].includes(rawOption)) {
  throw new Error('raw must be 0 or 1.');
}
const raw = rawOption === '1';
const params = new URLSearchParams({ freeze: '1' });
for (const key of [
  'item',
  'tab',
  'family',
  'scheme',
  'solo',
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
const output = resolve(outDir, outName);
const outPath = resolve(await realpath(dirname(output)), basename(output));
if (!outPath.startsWith((await realpath(outDir)) + sep)) {
  throw new Error('out must name a file inside .artifacts/visual/.');
}

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
  const actual = await page.locator('[data-wb-capture-route]').evaluate((shell) => {
    if (shell.hasAttribute('data-wb-not-found')) {
      throw new Error(`Unknown workbench item: ${shell.dataset.wbItem}`);
    }
    const route = JSON.parse(shell.dataset.wbCaptureRoute);
    return {
      ...route,
      tab: shell.dataset.wbTab,
      mode:
        shell.dataset.wbTabKind === 'states'
          ? (shell.querySelector('[data-wb-matrix-mode]')?.dataset.wbMatrixMode ?? route.mode)
          : undefined,
      slice: shell.dataset.wbSlice,
    };
  });
  const expectedAliases = {
    tab: {
      matrix: 'states',
      cases: 'states',
      ...(params.has('block') ? { usage: 'compositions' } : {}),
    },
    mode: { combinator: 'slice' },
  };
  for (const [key, requested] of params) {
    const value = actual[key];
    const rendered = typeof value === 'boolean' ? String(Number(value)) : String(value ?? '');
    const normalized = expectedAliases[key]?.[requested] ?? requested;
    if (rendered !== requested && rendered !== normalized) {
      throw new Error(
        `Requested ${key}=${requested}, but the rendered view has ${key}=${rendered || '(none)'}.`,
      );
    }
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const fitWidth = await page.evaluate(() => {
      const boards = document.querySelectorAll('.wb-artboards');
      if (boards.length === 0 || [...boards].some((board) => !board.hasAttribute('data-single'))) {
        return null;
      }
      let widest = 0;
      for (const inner of document.querySelectorAll('.wb-viewport-inner')) {
        const viewport = inner.closest('.wb-playground-preview, .wb-canvas, .wb-raw-canvas');
        if (viewport) {
          const { paddingInlineStart, paddingInlineEnd } = window.getComputedStyle(viewport);
          const available =
            viewport.clientWidth - parseFloat(paddingInlineStart) - parseFloat(paddingInlineEnd);
          const chromeWidth = window.innerWidth - available;
          widest = Math.max(widest, Math.ceil(inner.getBoundingClientRect().width + chromeWidth));
        }
      }
      return widest;
    });
    if (fitWidth === null) {
      break;
    }
    const isolatedWidth = Math.max(raw ? 1120 : 1560, fitWidth);
    if (isolatedWidth === page.viewportSize()?.width) {
      break;
    }
    // Recalculate after resizing because the sidebars respond to the viewport width.
    await page.evaluate(() => document.documentElement.removeAttribute('data-wb-ready'));
    await page.setViewportSize({ width: isolatedWidth, height: 900 });
    await waitForReady();
  }
  if (errors.length > 0) {
    throw new Error(`Runtime errors:\n${errors.join('\n')}`);
  }

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
  await writeFile(outPath, Buffer.from(capture.data, 'base64'), {
    flag: constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW,
  });
  const elapsedMs = Math.round(performance.now() - t0);
  process.stdout.write(`visual: wrote ${outPath} (${String(elapsedMs)} ms)\n`);
} finally {
  await Promise.all([browser.close(), server.close()]);
}

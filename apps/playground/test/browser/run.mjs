import assert from 'node:assert/strict';
import { globSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { devkitWorkspaceSource } from '@docouno/env/vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright-core';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const scenarioFiles = globSync('suites/**/*.browser.mjs', { cwd: import.meta.dirname }).sort();
const scenarios = [];
for (const file of scenarioFiles) {
  const { default: suite } = await import(new URL(file, import.meta.url).href);
  scenarios.push(...Object.entries(suite));
}
assert.ok(scenarios.length, 'No browser tests found in suites/**/*.browser.mjs');

async function runScenario(t, browser, origin, renderFixture, scenario) {
  const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(10000);

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      errors.push(`HTTP ${response.status()} from ${response.url()}`);
    }
  });

  async function mount(
    fixture,
    {
      theme = 'soft-dark',
      surface = 'base',
      textScale = 100,
      direction = 'ltr',
      forcedColors = 'none',
      reducedMotion = 'no-preference',
    } = {},
  ) {
    await page.emulateMedia({ forcedColors, reducedMotion });
    const url = new URL('/test/browser/index.html', origin);
    url.search = new URLSearchParams({
      fixture,
      theme,
      surface,
      textScale,
      direction,
    }).toString();
    await page.goto(url.href, { waitUntil: 'commit' });
    // A cold Vite fixture has to load and compile its modules before React can mount.
    await page.locator('[data-browser-ready]').waitFor({ state: 'attached', timeout: 15_000 });
  }

  try {
    await scenario({ page, mount, renderFixture });
  } catch (error) {
    if (!errors.length) {
      throw error;
    }
    throw new Error(`${error.message}\nBrowser errors:\n${errors.join('\n')}`, { cause: error });
  }
  assert.deepEqual(errors, [], 'Browser errors');
}

async function launchChromium() {
  try {
    return await chromium.launch({
      headless: true,
      chromiumSandbox: false,
      ignoreDefaultArgs: ['--hide-scrollbars'],
    });
  } catch (error) {
    throw new Error('Chromium launch failed. Run make visual-setup.', { cause: error });
  }
}

const cacheDir = await mkdtemp(join(tmpdir(), 'unica-browser-'));
let browser;
let server;
try {
  browser = await launchChromium();
  server = await createServer({
    configFile: false,
    root: resolve(import.meta.dirname, '../..'),
    cacheDir,
    logLevel: 'error',
    plugins: [devkitWorkspaceSource(), react()],
    resolve: { dedupe: ['react', 'react-dom'] },
    optimizeDeps: {
      entries: ['test/browser/index.html'],
      // Bundle icon entry points before a fixture reaches the navigation timeout.
      include: ['@phosphor-icons/react', '@phosphor-icons/react/ssr'],
    },
    server: { host: '127.0.0.1', port: 0, watch: null, hmr: false },
  });
  await server.listen();
  const address = server.httpServer?.address();
  assert.ok(address && typeof address === 'object', 'Vite needs a loopback TCP address');
  const origin = `http://127.0.0.1:${address.port}`;

  const serverFixtures = new Set(
    globSync('fixtures/*.tsx', { cwd: import.meta.dirname }).map((file) =>
      file.slice('fixtures/'.length, -'.tsx'.length),
    ),
  );

  async function renderFixture(fixture) {
    assert.ok(serverFixtures.has(fixture), `Unknown server fixture: ${fixture}`);
    const ssrErrors = [];
    const originalError = console.error;
    console.error = (...args) => {
      ssrErrors.push(args.map(String).join(' '));
    };
    try {
      const { default: Fixture } = await server.ssrLoadModule(
        `/test/browser/fixtures/${fixture}.tsx`,
      );
      assert.equal(typeof Fixture, 'function', `Unknown server fixture: ${fixture}`);
      const html = renderToString(createElement(Fixture));
      assert.deepEqual(ssrErrors, [], `Node SSR console.error in ${fixture}`);
      return html;
    } finally {
      console.error = originalError;
    }
  }

  for (const [name, scenario] of scenarios) {
    await test(name, { timeout: 30000 }, (t) =>
      runScenario(t, browser, origin, renderFixture, scenario),
    );
  }
} finally {
  try {
    await browser?.close();
  } finally {
    try {
      await server?.close();
    } finally {
      await rm(cacheDir, { recursive: true, force: true });
    }
  }
}

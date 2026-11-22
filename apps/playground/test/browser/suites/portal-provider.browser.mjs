import assert from 'node:assert/strict';

const scenarios = {};

scenarios[
  'UnicaProvider portals inherit local host theme, color-scheme, and surface cascade across transitions and hydration'
] = async ({ page, mount, renderFixture }) => {
  // 1. Verify Node SSR with getUnicaRootProps and waiting portals produces 0 console errors.
  const ssrHtml = await renderFixture('portal-provider');
  assert.ok(
    ssrHtml.includes('data-theme="pixel-light"'),
    'SSR markup includes data-theme from getUnicaRootProps',
  );
  assert.ok(
    ssrHtml.includes('<output data-testid="waiting-status">waiting</output>'),
    'SSR waiting portal consumer renders waiting state',
  );
  assert.ok(
    !ssrHtml.includes('data-testid="portaled-probe"'),
    'Enabled Portal does not render portaled content on the server',
  );

  // Extract exact SSR HTML of HydratableScope (<section data-theme="pixel-light" data-testid="ssr-themed-root">...</section>)
  const match = ssrHtml.match(
    /<section[^>]*data-testid="ssr-themed-root"[^>]*>[\s\S]*?<\/section>/,
  );
  assert.ok(match, 'SSR HTML contains HydratableScope section');
  const hydratableHtml = match[0];

  // 2. Mount in Chromium under outer frost-dark theme.
  await mount('portal-provider', { theme: 'frost-dark' });

  const readStyle = (selector) =>
    page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) {
        return null;
      }
      const cs = getComputedStyle(el);
      return {
        parentTestId: el.parentElement?.getAttribute('data-testid') ?? null,
        parentTag: el.parentElement?.tagName ?? null,
        colorScheme: cs.colorScheme,
        bgCanvas: cs.getPropertyValue('--bg-canvas').trim(),
        fgPrimary: cs.getPropertyValue('--fg-primary').trim(),
        radiusFactor: cs.getPropertyValue('--radius-factor').trim(),
      };
    }, selector);

  const outerRef = await readStyle('[data-testid="outer-body-ref"]');
  const scopedSection = await readStyle('[data-testid="scoped-theme-section"]');
  assert.equal(outerRef.colorScheme, 'dark');
  assert.equal(scopedSection.colorScheme, 'light');
  assert.notEqual(outerRef.bgCanvas, scopedSection.bgCanvas);
  assert.equal(outerRef.radiusFactor, '1');
  assert.equal(scopedSection.radiusFactor, '0');

  // 3. portalContainer=undefined falls back to document.body (inherits outer frost-dark) + self-nesting Portal.
  const bodyProbe = await readStyle('[data-testid="portaled-probe"]');
  const bodyNested = await readStyle('[data-testid="nested-portaled-probe"]');
  assert.equal(bodyProbe.parentTag, 'BODY');
  assert.equal(bodyNested.parentTag, 'BODY', 'Self-nested Portal inherits outer Portal host');
  assert.equal(bodyProbe.colorScheme, 'dark');
  assert.equal(bodyProbe.bgCanvas, outerRef.bgCanvas);
  assert.equal(await page.getByTestId('mode-portal-status').textContent(), 'ready');

  // 4. Transition undefined -> local host: computed custom properties & color-scheme switch to pixel-light.
  await page.getByRole('button', { name: 'Mode host' }).click();
  const hostProbe = await readStyle('[data-testid="portaled-probe"]');
  const hostNested = await readStyle('[data-testid="nested-portaled-probe"]');
  assert.equal(hostProbe.parentTestId, 'scoped-portal-host');
  assert.equal(
    hostNested.parentTestId,
    'scoped-portal-host',
    'Self-nested Portal moves to scoped host with outer Portal',
  );
  assert.equal(hostProbe.colorScheme, 'light');
  assert.equal(hostProbe.bgCanvas, scopedSection.bgCanvas);
  assert.equal(hostProbe.fgPrimary, scopedSection.fgPrimary);
  assert.equal(hostProbe.radiusFactor, '0');

  // 5. Waiting portal (portalContainer=null) never falls back to document.body, then resolves on null -> host.
  assert.equal(await page.getByTestId('waiting-status').textContent(), 'waiting');
  assert.equal(await page.locator('[data-testid="waiting-portaled-probe"]').count(), 0);
  await page.getByRole('button', { name: 'Resolve waiting host' }).click();
  assert.equal(await page.getByTestId('waiting-status').textContent(), 'ready');
  const resolvedWaiting = await readStyle('[data-testid="waiting-portaled-probe"]');
  assert.equal(resolvedWaiting.parentTestId, 'waiting-portal-host');
  assert.equal(resolvedWaiting.colorScheme, 'light');
  assert.equal(resolvedWaiting.bgCanvas, scopedSection.bgCanvas);

  // 6. Explicit surface cascade verification:
  //    - nested <div data-surface="overlay"><div data-theme="pixel-light|frost-light"> resets surface
  //      tokens (--card-bg, --control-bg, --_indicator-surface-separator) to base while keeping
  //      Divider's --_divider-overlay-share at overlay.
  //    - colocated <div data-theme="..." data-surface="overlay"> remains overlay on all tokens.
  const cascade = await page.evaluate(() => {
    const read = (sel, divSel) => {
      const el = document.querySelector(sel);
      const div = divSel ? document.querySelector(divSel) : null;
      const cs = getComputedStyle(el);
      const dcs = div ? getComputedStyle(div) : null;
      return {
        cardBg: cs.getPropertyValue('--card-bg').trim(),
        controlBg: cs.getPropertyValue('--control-bg').trim(),
        indicatorSep: cs.getPropertyValue('--_indicator-surface-separator').trim(),
        dividerShare: dcs ? dcs.getPropertyValue('--_divider-overlay-share').trim() : null,
      };
    };
    return {
      pixelBase: read('[data-testid="ref-base"]', '[data-testid="ref-base-divider"]'),
      pixelColocated: read(
        '[data-testid="colocated-overlay"]',
        '[data-testid="colocated-overlay-divider"]',
      ),
      pixelNested: read(
        '[data-testid="nested-theme-in-overlay"]',
        '[data-testid="nested-theme-divider"]',
      ),
      frostBase: read('[data-testid="frost-ref-base"]', null),
      frostColocated: read('[data-testid="frost-colocated-overlay"]', null),
      frostNested: read('[data-testid="frost-nested-theme-in-overlay"]', null),
    };
  });
  assert.notEqual(cascade.pixelBase.controlBg, cascade.pixelColocated.controlBg);
  assert.notEqual(cascade.pixelBase.indicatorSep, cascade.pixelColocated.indicatorSep);
  assert.notEqual(cascade.pixelBase.dividerShare, cascade.pixelColocated.dividerShare);
  assert.notEqual(cascade.frostBase.cardBg, cascade.frostColocated.cardBg);
  assert.notEqual(cascade.frostBase.controlBg, cascade.frostColocated.controlBg);

  assert.equal(
    cascade.pixelNested.controlBg,
    cascade.pixelBase.controlBg,
    'Nested [data-theme="pixel-light"] inside [data-surface="overlay"] resets --control-bg to base',
  );
  assert.equal(
    cascade.pixelNested.indicatorSep,
    cascade.pixelBase.indicatorSep,
    'Nested [data-theme="pixel-light"] inside [data-surface="overlay"] resets --_indicator-surface-separator to base',
  );
  assert.equal(
    cascade.pixelNested.dividerShare,
    cascade.pixelColocated.dividerShare,
    'Divider overlay share persists inside nested [data-theme] within [data-surface="overlay"]',
  );
  assert.equal(
    cascade.frostNested.cardBg,
    cascade.frostBase.cardBg,
    'Nested [data-theme="frost-light"] inside [data-surface="overlay"] resets --card-bg to base',
  );
  assert.equal(
    cascade.frostNested.controlBg,
    cascade.frostBase.controlBg,
    'Nested [data-theme="frost-light"] inside [data-surface="overlay"] resets --control-bg to base',
  );

  // 7. Real Chromium SSR -> hydrate with getUnicaRootProps and local portalContainer.
  const handle = await page.evaluateHandle(
    (html) => window.__runPortalHydration(html),
    hydratableHtml,
  );
  const leaf = page.getByTestId('hydrate-portal-host').getByTestId('ssr-portaled-leaf');
  const status = page.getByTestId('hydrate-box').getByTestId('ssr-portal-status');
  await leaf.waitFor({ state: 'attached' });
  const hydration = await handle.evaluate((result) => ({
    ok: result.ok,
    preservedNode: result.preservedNode(),
    errors: result.getErrors(),
  }));
  assert.equal(hydration.ok, true);
  assert.equal(hydration.preservedNode, true, 'Hydration preserves server DOM node');
  assert.deepEqual(hydration.errors, [], 'Hydration produces 0 recoverable errors');
  assert.equal(await status.textContent(), 'ready');
  const hydratedTheme = await leaf.evaluate((node) => ({
    colorScheme: getComputedStyle(node).colorScheme,
    bgCanvas: getComputedStyle(node).getPropertyValue('--bg-canvas').trim(),
  }));
  assert.equal(hydratedTheme.colorScheme, 'light');
  assert.equal(hydratedTheme.bgCanvas, scopedSection.bgCanvas);
  await handle.evaluate((result) => result.unmount());
  await handle.dispose();
};

export default scenarios;

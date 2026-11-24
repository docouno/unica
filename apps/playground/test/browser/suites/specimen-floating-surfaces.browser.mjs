import assert from 'node:assert/strict';

const examples = [{ item: 'pagination', width: 360, padding: '--surface-m-padding' }];

async function checkSurface({ page, mount }, { item, width, padding }) {
  await mount('native');
  const url = new URL('/', page.url());
  url.search = new URLSearchParams({
    item,
    tab: 'states',
    block: 'overlay',
    family: 'frost',
    scheme: 'light',
    raw: '1',
    freeze: '1',
    vp: '1280',
  });
  await page.goto(url.href);

  const panel = page.locator(
    '[data-wb-block="overlay"] [data-stage-content] .unica-overlay-surface[data-surface="overlay"]',
  );
  await panel.waitFor({ timeout: 20_000 });
  for (const vp of [1280, 360, 1440]) {
    await page.setViewportSize({ width: vp, height: 900 });
    url.searchParams.set('vp', String(vp));
    url.searchParams.set('dir', vp === 360 ? 'rtl' : 'ltr');
    await page.evaluate((address) => {
      history.pushState(null, '', address);
      dispatchEvent(new PopStateEvent('popstate'));
    }, url.href);
    await page.waitForFunction((requested) => {
      const route = document.querySelector('[data-wb-capture-route]')?.dataset.wbCaptureRoute;
      return route && JSON.parse(route).vp === requested;
    }, vp);
    const box = await panel.evaluate(async (node, token) => {
      await document.fonts.ready;
      const stage = node.closest('[data-stage-content]');
      const host = stage.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        width: node.offsetWidth,
        available: stage.offsetWidth,
        start: rect.left - host.left,
        end: host.right - rect.right,
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
        expectedPadding: style.getPropertyValue(token).trim(),
      };
    }, padding);
    assert.ok(vp === 360 ? box.available <= vp : box.available > width);
    assert.equal(box.width, Math.min(width, box.available), JSON.stringify({ item, vp, box }));
    assert.ok(Math.abs(box.start - box.end) < 1, JSON.stringify({ item, vp, box }));
    assert.ok(parseFloat(box.expectedPadding) > 0);
    assert.deepEqual(box.padding, Array(4).fill(box.expectedPadding));
  }
}

export default Object.fromEntries(
  examples.map((example) => [
    `The ${example.item} floating specimen keeps its material centered and fitted`,
    (fixture) => checkSurface(fixture, example),
  ]),
);

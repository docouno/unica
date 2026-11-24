import assert from 'node:assert/strict';

async function repeatTabClick({ page, mount }, { block, name, vp, scale, dir }) {
  await mount('native');
  await page.setViewportSize({ width: 1500, height: 950 });
  const url = new URL('/', page.url());
  url.search = new URLSearchParams({
    item: 'tabs',
    tab: 'states',
    block,
    family: 'frost',
    scheme: 'light',
    surface: 'overlay',
    vp,
    scale,
    dir,
    raw: '1',
  });
  await page.goto(url.href);
  const board = page.locator(`[data-wb-block="${block}"] .wb-artboard`);
  const tab = board.getByRole('tab', { name, exact: true });
  await tab.waitFor({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
  await tab.scrollIntoViewIfNeeded();
  const box = await tab.boundingBox();
  assert.ok(box);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.click(x, y);
  assert.equal(await tab.getAttribute('aria-selected'), 'true');
  await page.mouse.click(x, y);
  assert.equal(await tab.getAttribute('aria-selected'), 'true');
  assert.ok(await board.getByRole('tabpanel', { name, exact: true }).isVisible());
  assert.ok(
    await tab.evaluate(
      (node, point) => node.contains(document.elementFromPoint(point.x, point.y)),
      { x, y },
    ),
  );
}

export default {
  'Tabs snapshot keeps Details under repeated pointer activation': (fixture) =>
    repeatTabClick(fixture, {
      block: 'overlay',
      name: 'Details',
      vp: '1440',
      scale: '120',
      dir: 'rtl',
    }),
  'Tabs report keeps Recipients under repeated pointer activation': (fixture) =>
    repeatTabClick(fixture, {
      block: 'manual',
      name: 'Recipients',
      vp: '1280',
      scale: '100',
      dir: 'ltr',
    }),
};

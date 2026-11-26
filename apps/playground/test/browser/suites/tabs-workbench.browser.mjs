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
  'Tabs drives the Folio reader and keeps the editor toolbar and reference in their view': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1550, height: 1000 });
    const open = async (item) => {
      const url = new URL('/', origin);
      url.search = new URLSearchParams({
        item,
        family: 'soft',
        scheme: 'dark',
        vp: '1440',
        raw: '1',
      });
      await page.goto(url.href);
    };
    await open('04-document-reader');
    const details = page.getByRole('tab', { name: 'Details', exact: true });
    const history = page.getByRole('tab', { name: /History.*3 revisions/u });
    await details.waitFor();
    await details.press('ArrowRight');
    assert.equal(await history.getAttribute('aria-selected'), 'true');
    assert.equal(await page.getByRole('tabpanel', { name: /History/u }).count(), 1);
    await history.press('ArrowRight');
    assert.equal(await page.getByRole('tabpanel', { name: 'Links', exact: true }).count(), 1);

    await open('05-rich-editor');
    const write = page.getByRole('tab', { name: 'Write', exact: true });
    const diff = page.getByRole('tab', { name: /Diff.*42 changed lines/u });
    const split = page.getByRole('tab', { name: 'Split', exact: true });
    await write.press('Tab');
    const bold = page.getByRole('button', { name: 'Bold', exact: true });
    assert.equal(await bold.evaluate((node) => node === document.activeElement), true);
    const reference = page.getByRole('button', { name: 'Edit document reference', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Edit document reference' });
    await reference.click();
    await dialog.waitFor();
    await diff.click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.getByRole('tabpanel', { name: /Diff/u }).count(), 1);
    await diff.press('ArrowRight');
    assert.equal(await split.getAttribute('aria-selected'), 'true');
    await split.press('Home');
    assert.equal(await write.getAttribute('aria-selected'), 'true');
    await reference.waitFor();
  },
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

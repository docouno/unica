import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

function archive(page, theme) {
  return page.locator(`[data-wb-block="links"] .wb-artboard[data-theme="${theme}"]`);
}

async function expectEntry(board, title, day) {
  await board.getByRole('heading', { name: title, exact: true }).waitFor({ timeout: 20_000 });
  assert.equal(await board.locator('time').getAttribute('datetime'), `2025-11-0${day}`);
  const nav = board.getByRole('navigation', { name: 'Archive pages' });
  assert.equal(
    await nav.locator('[aria-current="page"]').getAttribute('aria-label'),
    `Page ${day}`,
  );
}

export default {
  'Pagination archive links preserve the pages and boundaries of independent artboards': async ({
    page,
    mount,
  }) => {
    await mount('native');
    await page.setViewportSize({ width: 1920, height: 960 });
    const url = new URL(
      '/?item=pagination&tab=states&block=links&family=all&scheme=both&vp=1280',
      page.url(),
    );
    await page.goto(url.href);
    const frost = archive(page, 'frost-light');
    const pixel = archive(page, 'pixel-dark');
    await expectEntry(frost, 'First frost', 1);
    assert.equal(
      await frost.getByRole('link', { name: 'Previous page' }).getAttribute('href'),
      null,
    );
    await frost.getByRole('link', { name: 'Next page' }).press('Enter');
    await expectEntry(frost, 'Reed beds', 2);
    await assertFocused(frost.getByRole('heading', { name: 'Reed beds' }));
    await expectEntry(pixel, 'First frost', 1);
    await pixel.getByRole('link', { name: 'Page 7', exact: true }).click();
    await expectEntry(pixel, 'Open pools', 7);
    await assertFocused(pixel.getByRole('heading', { name: 'Open pools' }));
    assert.equal(await pixel.getByRole('link', { name: 'Next page' }).getAttribute('href'), null);
    await expectEntry(frost, 'Reed beds', 2);
  },

  'Pagination archive opens a dated page directly from the States overview': async ({
    page,
    mount,
  }) => {
    await mount('native');
    await page.goto(
      new URL('/?item=pagination&tab=states&family=frost&scheme=light', page.url()).href,
    );
    await page.locator('[data-wb-block="links"]').scrollIntoViewIfNeeded();
    const source = archive(page, 'frost-light');
    const next = source.getByRole('link', { name: 'Next page' });
    const destination = new URL(await next.getAttribute('href'), page.url()).href;
    const [other] = await Promise.all([
      page.context().waitForEvent('page'),
      next.click({ modifiers: ['Control'] }),
    ]);
    const target = archive(other, 'frost-light');
    await expectEntry(target, 'Reed beds', 2);
    assert.equal(other.url(), destination);
    await assertFocused(target.getByRole('heading', { name: 'Reed beds' }));
    await other.reload();
    await expectEntry(target, 'Reed beds', 2);
    await assertFocused(target.getByRole('heading', { name: 'Reed beds' }));
    await other.close();
    await expectEntry(source, 'First frost', 1);
  },

  'Pagination archive preserves browser history across existing and current page addresses':
    async ({ page, mount }) => {
      await mount('native');
      await page.goto(
        new URL(
          '/?item=pagination&tab=cases&block=links&family=all&scheme=both#pagination-page-7',
          page.url(),
        ).href,
      );
      const board = archive(page, 'frost-light');
      const neighbor = archive(page, 'pixel-dark');
      await expectEntry(board, 'Open pools', 7);
      await expectEntry(neighbor, 'Open pools', 7);
      await board.getByRole('link', { name: 'Previous page' }).press('Enter');
      await expectEntry(board, 'Otter trail', 6);
      await assertFocused(board.getByRole('heading', { name: 'Otter trail' }));
      await expectEntry(neighbor, 'Open pools', 7);
      await page.goBack();
      await expectEntry(board, 'Open pools', 7);
      await page.goForward();
      await expectEntry(board, 'Otter trail', 6);
    },
};

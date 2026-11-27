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

async function assertFooter(owner, wrapped) {
  const geometry = await owner.evaluate((footer) => {
    const nav = footer.querySelector('nav');
    const range = footer.querySelector('[role=status] bdi').getBoundingClientRect();
    const previous = nav.querySelector('[aria-label="Previous page"]').getBoundingClientRect();
    const next = nav.querySelector('[aria-label="Next page"]').getBoundingClientRect();
    const rect = footer.getBoundingClientRect();
    const rtl = getComputedStyle(footer).direction === 'rtl';
    return {
      direction: getComputedStyle(footer).direction,
      wrapped: previous.top >= range.bottom,
      rowGap:
        nav.getBoundingClientRect().top -
        footer.querySelector('[role=status]').getBoundingClientRect().bottom,
      commonStart: Math.abs(
        (rtl ? range.right : range.left) - (rtl ? previous.right : previous.left),
      ),
      endGap: Math.abs((rtl ? rect.left : rect.right) - (rtl ? next.left : next.right)),
    };
  });
  assert.equal(geometry.wrapped, wrapped);
  if (wrapped) {
    assert.equal(geometry.rowGap, 8);
    assert.ok(geometry.commonStart <= 0.25);
  } else {
    assert.ok(geometry.endGap <= 0.25, JSON.stringify(geometry));
  }
}

export default {
  'Pagination consumers keep a sibling result range and logical footer alignment': async ({
    page,
    mount,
  }) => {
    await mount('pagination-consumers');
    const references = page.getByTestId('references');
    const referenceFooter = references.locator('.recovery-reference-footer');
    for (const direction of ['ltr', 'rtl']) {
      await references.evaluate((node, dir) => {
        node.dir = dir;
        node.style.boxSizing = 'content-box';
        node.style.inlineSize = '278px';
      }, direction);
      await assertFooter(referenceFooter, true);
      await references.evaluate((node) => {
        node.style.inlineSize = '480px';
      });
      await assertFooter(referenceFooter, false);
    }
    await references.getByRole('button', { name: 'Next page' }).press('Enter');
    assert.equal(await referenceFooter.getByRole('status').textContent(), '4–6 of 6 documents');
    await assertFocused(references.getByRole('button', { name: 'Previous page' }));

    const collection = page.getByTestId('collection');
    assert.equal(await collection.getByRole('navigation').count(), 1);
    const footer = collection.locator('.document-collection-footer:has(nav)');
    const pager = footer.getByRole('navigation');
    const status = footer.getByRole('status');
    const before = await footer.boundingBox();
    await pager.getByRole('button', { name: 'Page 4' }).click();
    assert.equal(await status.textContent(), '10–11 of 11');
    assert.equal((await footer.boundingBox()).y, before.y);
    assert.equal(await collection.getByText('No matching documents').count(), 1);
  },
  'Pagination changes Folio results while preserving selection and resetting with filters': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    await page.goto(new URL('/?item=03-document-collection&solo=soft-light&vp=1440', origin).href);
    const scene = page.locator('[data-wb-scene]');
    const footer = scene.locator('.folio-collection-footer');
    const pager = footer.getByRole('navigation', { name: 'Runbook pages' });
    const range = footer.getByRole('status');
    await pager.waitFor({ timeout: 20_000 });
    assert.equal(await range.textContent(), 'Showing 1–4 of 6 runbooks');
    await pager.getByRole('button', { name: 'Next page' }).press('Enter');
    assert.equal(await range.textContent(), 'Showing 5–6 of 6 runbooks');
    await scene.getByRole('radio', { name: 'Cards', exact: true }).click();
    assert.equal(await range.textContent(), 'Showing 5–6 of 6 runbooks');
    await scene.getByText(/2 selected/).waitFor();
    await scene.getByRole('radio', { name: 'Drafts (0)', exact: true }).click();
    assert.equal(await range.textContent(), 'Showing 0 runbooks');
    assert.equal(await pager.count(), 0);
    await scene.getByRole('link', { name: 'Reset', exact: true }).click();
    assert.equal(await range.textContent(), 'Showing 1–4 of 8 runbooks');
    await pager.waitFor();
  },

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
    origin,
  }) => {
    await page.goto(
      new URL('/?item=pagination&tab=states&family=frost&scheme=light', origin).href,
      { waitUntil: 'commit' },
    );
    await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 20_000 });
    await page.getByRole('button', { name: 'Inspector', exact: true }).click();
    await page
      .getByRole('navigation', { name: 'State sections' })
      .getByRole('button', { name: /Addressable pages/ })
      .click();
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

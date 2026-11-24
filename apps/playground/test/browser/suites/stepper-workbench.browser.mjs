import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

export default {
  'Stepper setup requires a separate activation for each workflow action': async ({
    page,
    mount,
  }) => {
    await mount('native');
    await page.goto(
      new URL(
        '/?item=stepper&tab=compositions&block=journey&family=soft&scheme=light&vp=360',
        page.url(),
      ).href,
    );
    const board = page.locator('[data-wb-block="journey"] .wb-artboard[data-theme="soft-light"]');
    const proceed = board.getByRole('button', { name: 'Continue', exact: true });
    const assign = board.getByRole('button', { name: 'Assign me' });
    await proceed.waitFor({ timeout: 20_000 });
    await proceed.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await assertFocused(assign);
    assert.equal(await proceed.isDisabled(), true);

    await board.getByRole('button', { name: 'All steps' }).press('Enter');
    await board.getByRole('button', { name: /Workspace details/ }).press('Enter');
    await proceed.press('Enter');
    await assertFocused(assign);
    assert.equal(await proceed.isDisabled(), true);

    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await assertFocused(proceed);
    assert.equal(await board.getByText('You are the workspace owner.', { exact: true }).count(), 1);

    await page.keyboard.press('Enter');
    await assertFocused(board.getByRole('heading', { name: 'Review setup' }));
    await board.getByRole('button', { name: 'Create workspace' }).press('Space');
    await assertFocused(board.getByRole('heading', { name: 'Workspace created' }));
  },

  'Stepper compact disclosure stays under the pointer on both surfaces': async ({
    page,
    mount,
  }) => {
    await mount('native');
    await page.setViewportSize({ width: 1470, height: 900 });
    const url = new URL('/?item=stepper&vp=360&dir=rtl&scale=120&raw=1&surface=base', page.url());
    await page.goto(url.href);
    const button = page
      .locator('.wb-artboard[data-theme="frost-light"]')
      .getByRole('button', { name: 'All steps' });
    await button.waitFor({ timeout: 20_000 });
    for (const surface of ['base', 'overlay']) {
      url.searchParams.set('surface', surface);
      await page.evaluate((address) => {
        history.pushState(null, '', address);
        dispatchEvent(new PopStateEvent('popstate'));
      }, url.href);
      await button.evaluate((node) =>
        node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }),
      );
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const rect = await button.boundingBox();
      assert.ok(rect);
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height * 0.85;
      await page.mouse.click(x, y);
      assert.equal(await button.getAttribute('aria-expanded'), 'true', surface);
      await page.mouse.click(x, y);
      assert.equal(await button.getAttribute('aria-expanded'), 'false', surface);
    }
  },
};

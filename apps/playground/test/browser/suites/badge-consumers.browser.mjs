import assert from 'node:assert/strict';
import { assertBox, assertFocused } from '../helpers.mjs';

export default {
  'Alert and Tag retain semantic paint without a mounted Badge': async ({ page, mount }) => {
    await mount('badge-consumers', { theme: 'frost-light', surface: 'overlay' });
    assert.equal(await page.locator('.unica-badge').count(), 0);
    for (const [id, prefix, painted] of [
      ['alert', 'status-warning', null],
      ['tag', 'accent', '::before'],
    ]) {
      const { actual, expected } = await page.getByTestId(id).evaluate(
        (root, { prefix, painted }) => {
          const probe = document.createElement('span');
          root.append(probe);
          const surface = getComputedStyle(root, painted);
          const expected = ['soft-bg', 'soft-fg', 'border'].map((suffix) => {
            probe.style.color = 'var(--' + prefix + '-' + suffix + ')';
            return getComputedStyle(probe).color;
          });
          const actual = [
            surface.backgroundColor,
            getComputedStyle(root).color,
            surface.borderTopColor,
          ];
          probe.remove();
          return { actual, expected };
        },
        { prefix, painted },
      );
      assert.deepEqual(actual, expected);
    }
  },

  'Tabs keeps Badge count geometry, clipping, and the separately named quantity': async ({
    page,
    mount,
  }) => {
    await mount('badge-consumers', { theme: 'pixel-dark', direction: 'rtl' });
    await page.getByRole('button', { name: 'Show tabs' }).click();
    const updates = page.getByRole('tab', { name: 'Updates 0 updates' });
    const review = page.getByRole('tab', { name: 'Review 104 pending reviews' });
    const visibleCount = updates.locator('.unica-badge.unica-tabs-count');
    const clippedCount = review.locator('.unica-badge.unica-tabs-count');
    assert.equal(await visibleCount.textContent(), '0');
    assert.equal(await visibleCount.getAttribute('data-unica-badge-size'), 's');
    assert.equal(await visibleCount.getAttribute('aria-hidden'), 'true');
    await assertBox(visibleCount, { width: 20, height: 20 });
    await clippedCount
      .locator('xpath=self::*[@data-unica-tabs-count-clipped]')
      .waitFor({ state: 'attached' });
    assert.ok(await clippedCount.isHidden());
    assert.equal(await clippedCount.textContent(), '99+');

    await updates.focus();
    await page.keyboard.press('End');
    await assertFocused(review);
    await clippedCount.waitFor({ state: 'visible' });
    await assertBox(clippedCount, { height: 20 });
    assert.equal(await review.getAttribute('aria-selected'), 'true');
  },
};

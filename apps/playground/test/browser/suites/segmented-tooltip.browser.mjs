import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys } from '../helpers.mjs';

export default {
  'SegmentedControl icon-only Tooltip uses the radio anchor inside a scrolling modal': async ({
    page,
    mount,
  }) => {
    await mount('segmented-tooltip', { theme: 'frost-dark' });
    const dialog = page.getByRole('dialog', { name: 'Layout settings' });
    const rail = dialog.getByRole('radiogroup', { name: 'Layout mode' });
    const list = rail.getByRole('radio', { name: 'List layout' });
    const grid = rail.getByRole('radio', { name: 'Grid layout' });
    const tip = page.locator('[popover="manual"]:popover-open');
    assert.ok(await rail.evaluate((node) => node.scrollWidth > node.clientWidth));
    await list.hover();
    await tip.getByText('List layout', { exact: true }).waitFor();
    const bounds = await getBox(rail);
    const hint = await getBox(tip);
    assert.ok(hint.width > bounds.width);
    assert.ok(hint.y + hint.height <= bounds.y);
    await pressKeys(page, 'Escape');
    await tip.waitFor({ state: 'hidden' });
    assert.equal(await dialog.evaluate((node) => node.open), true);
    await grid.hover();
    await tip.getByText('Grid layout', { exact: true }).click();
    assert.equal(await list.isChecked(), true);
    assert.equal(await grid.isChecked(), false);
    await page.mouse.move(0, 0);

    await page.getByRole('button', { name: 'Before layout' }).focus();
    await pressKeys(page, 'Tab');
    await tip.getByText('List layout', { exact: true }).waitFor();
    await assertFocused(list);
    await pressKeys(page, 'ArrowRight');
    await tip.getByText('Grid layout', { exact: true }).waitFor();
    await assertFocused(grid);
    assert.equal(await grid.isChecked(), true);
    await pressKeys(page, 'Escape');
    await tip.waitFor({ state: 'hidden' });
    await assertFocused(grid);
    assert.equal(await dialog.evaluate((node) => node.open), true);
    await pressKeys(page, 'Tab');
    await assertFocused(page.getByRole('button', { name: 'After layout' }));
  },

  'SegmentedControl reveals overflow when icon-only options become text with the same keys':
    async ({ page, mount }) => {
      await mount('segmented-tooltip');
      const density = page.getByRole('radiogroup', { name: 'Density' });
      const toggle = page.getByRole('button', { name: 'Toggle density labels' });
      const compact = density.getByRole('radio', { name: 'Compact density', exact: true });
      const hint = page.locator('[popover="manual"]:popover-open').getByText('Compact density', {
        exact: true,
      });
      await page.getByRole('button', { name: 'After layout' }).focus();
      await pressKeys(page, 'Tab');
      await assertFocused(compact);
      await hint.waitFor();
      assert.equal(await density.getAttribute('data-unica-segmented-overflow'), null);
      await toggle.evaluate((button) => button.click());
      const text = density.getByRole('radio', { name: 'Compact density with short spacing' });
      await assertFocused(text);
      assert.equal(await text.isChecked(), true);
      assert.equal(await density.getAttribute('data-unica-segmented-overflow'), '');
      await toggle.evaluate((button) => button.click());
      await assertFocused(compact);
      assert.equal(await compact.isChecked(), true);
      assert.equal(await density.getAttribute('data-unica-segmented-overflow'), null);
      await hint.waitFor();
      await page.clock.install();
      await compact.hover();
      await page.mouse.move(0, 0);
      await page.clock.runFor(250);
      assert.equal(await hint.isVisible(), true);
      await pressKeys(page, 'Escape');
      await hint.waitFor({ state: 'hidden' });
      await assertFocused(compact);
      await pressKeys(page, 'Tab');
      await assertFocused(toggle);
    },

  'SegmentedControl opens the Tooltip for the recovered option when its focused peer is removed':
    async ({ page, mount }) => {
      await mount('segmented-tooltip');
      const density = page.getByRole('radiogroup', { name: 'Density' });
      const toggle = page.getByRole('button', { name: 'Toggle density labels' });
      await toggle.focus();
      await toggle.evaluate((button) => button.click());
      await pressKeys(page, 'Shift+Tab', 'ArrowRight');
      const roomy = density.getByRole('radio', { name: 'Comfortable density with roomy spacing' });
      await assertFocused(roomy);
      await page
        .getByRole('button', { name: 'Remove comfortable density and show icons' })
        .evaluate((button) => button.click());
      const compact = density.getByRole('radio', { name: 'Compact density', exact: true });
      await assertFocused(compact);
      assert.equal(await compact.isChecked(), false);
      await page
        .locator('[popover="manual"]:popover-open')
        .getByText('Compact density', { exact: true })
        .waitFor();
    },
};

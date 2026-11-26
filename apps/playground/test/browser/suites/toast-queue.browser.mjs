import assert from 'node:assert/strict';

export default {
  'A visible notification stays readable and actionable after its neighbor is dismissed': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    for (const placement of ['bottom-end', 'top-end']) {
      await mount('scrollbar-toast', { theme: 'pixel-light', textScale: 120, direction: 'rtl' });
      await page.getByRole('button', { name: 'Expand 12 notifications' }).press('Enter');
      const list = page.getByRole('group', { name: 'Notification list' });
      await page.getByRole('combobox', { name: 'Placement' }).selectOption(placement);
      await list.evaluate((node) => node.style.setProperty('--_toast-list-height', '200px'));
      const neighbor = list.getByRole('button', {
        name: 'Dismiss: Activity update 11',
        exact: true,
      });
      await neighbor.press('Enter');
      const newest = list.locator('.unica-toast').filter({ hasText: 'Activity update 12' });
      const action = newest.getByRole('button', { name: 'Review', exact: true });
      await list.evaluate((node, top) => {
        node.scrollTop = top ? 0 : node.scrollHeight;
      }, placement === 'top-end');
      await action.click();
      assert.equal(await action.evaluate((button) => button.matches(':focus')), true);
    }
  },
};

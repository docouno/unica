import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

async function open(page, route) {
  await page.evaluate((params) => {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ fixture: 'typography-workbench', ...params }).toString();
    history.pushState(null, '', url);
    dispatchEvent(new PopStateEvent('popstate'));
  }, route);
}

export default {
  'Text switches native roots, constrains inline overflow and copies the linked label JSX': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1560, height: 900 });
    await mount('typography-workbench');
    await open(page, {
      item: 'text',
      family: 'pixel',
      scheme: 'light',
      vp: 360,
      scale: 120,
      dir: 'rtl',
      bounds: 1,
    });

    const tag = page.getByRole('combobox', { name: 'as', exact: true });
    const forField = page.getByRole('combobox', { name: 'htmlFor', exact: true });
    assert.equal(await forField.locator('option[value="field"]').isDisabled(), true);
    await tag.selectOption('span');
    await page.getByRole('checkbox', { name: 'truncate' }).check();
    await page.getByRole('combobox', { name: 'size', exact: true }).selectOption('body-xs');
    const input = page.getByRole('textbox', { name: 'children' });
    const subject = page.locator('[data-wb-subject]');
    await input.fill(
      'Keep the release checklist together with all of the decisions and reference notes that explain it.',
    );
    await page.evaluate(() => document.fonts.ready);
    const long = await subject.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const parent = node.parentElement.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        left: box.left - parent.left,
        right: parent.right - box.right,
        clips: node.scrollWidth > node.clientWidth,
        width: node.clientWidth,
        ellipsis: style.textOverflow,
        direction: style.direction,
        size: parseFloat(style.fontSize),
      };
    });
    assert.ok(long.left >= -1 && long.right >= -1, JSON.stringify(long));
    assert.equal(long.clips, true);
    assert.equal(long.direction, 'rtl');
    assert.equal(long.ellipsis, 'ellipsis');
    assert.ok(Math.abs(long.size - 13.2) < 0.01);

    await input.fill('Name');
    assert.ok(await subject.evaluate((node) => node.clientWidth === node.scrollWidth));
    assert.ok((await subject.evaluate((node) => node.clientWidth)) < long.width);
    await tag.selectOption('label');
    await forField.selectOption('field');
    await subject.click();
    await assertFocused(page.locator('.wb-artboard').getByRole('textbox', { name: 'Name' }));
    const code = await page.getByRole('region', { name: 'JSX' }).textContent();
    assert.match(code, /<Text[^>]*as=\{['"]label['"]\}[^>]*htmlFor="text-field"/);
    assert.match(code, /<input id="text-field"/);
  },

  'Text settings usage links each artboard label to its own field': async ({ page, mount }) => {
    await mount('typography-workbench');
    await open(page, {
      item: 'text',
      tab: 'compositions',
      block: 'settings',
      family: 'soft',
      scheme: 'both',
    });
    const boards = page.locator('.wb-artboard');
    const labels = boards.locator('label').filter({ hasText: 'Display name' });
    await labels.last().waitFor();
    assert.equal(await labels.count(), 2);
    const ids = await labels.evaluateAll((items) => items.map((label) => label.htmlFor));
    assert.equal(new Set(ids).size, 2);
    for (const board of await boards.all()) {
      await board.locator('label').filter({ hasText: 'Display name' }).click();
      await assertFocused(board.getByRole('textbox', { name: 'Display name' }));
    }
  },

  'Empty retry moves keyboard focus to the migrated Reports title with a system outline': async ({
    page,
    mount,
  }) => {
    await mount('typography-workbench', { forcedColors: 'active' });
    await open(page, {
      item: 'empty',
      tab: 'states',
      block: 'retry',
      family: 'soft',
      scheme: 'dark',
    });
    const preview = page.locator('.wb-artboard');
    const retry = preview.getByRole('button', { name: 'Try again' });
    await retry.focus();
    await page.keyboard.press('Enter');
    await preview.getByRole('status').getByText('Retry failed').waitFor();
    await assertFocused(retry);
    await page.keyboard.press('Enter');
    const reports = preview.getByRole('heading', { name: 'Reports', level: 3 });
    await reports.and(page.locator(':focus')).waitFor();
    const outline = await reports.evaluate((node) => {
      const probe = document.createElement('span');
      probe.style.color = 'Highlight';
      node.after(probe);
      const css = getComputedStyle(node);
      return [css.outlineStyle, css.outlineWidth, css.outlineColor, getComputedStyle(probe).color];
    });
    assert.deepEqual(outline.slice(0, 3), ['solid', '2px', outline[3]]);
  },
};

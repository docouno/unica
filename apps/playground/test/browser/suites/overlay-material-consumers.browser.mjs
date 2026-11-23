import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

const openSurface = '[popover]:popover-open.unica-overlay-surface[data-surface="overlay"]';

async function assertRadius(panel, radius) {
  assert.deepEqual(
    await panel.evaluate((node) => {
      const material = getComputedStyle(node);
      return {
        host: material.borderRadius,
        rim: getComputedStyle(node, '::before').borderRadius,
        corners: getComputedStyle(node, '::after').borderRadius,
        inheritsRadius:
          getComputedStyle(node.firstElementChild).getPropertyValue('--element-radius') ===
          material.getPropertyValue('--element-radius'),
      };
    }),
    { host: radius, rim: radius, corners: radius, inheritsRadius: true },
  );
}

const scenarios = {
  'Shared overlay material preserves Select and Combobox focus and semantics': async ({
    page,
    mount,
  }) => {
    await mount('overlay-material-consumers', { theme: 'frost-light' });
    const select = page.getByRole('button', { name: /^Workspace role/ });
    assert.equal(await select.getAttribute('aria-haspopup'), 'listbox');
    await select.press('ArrowDown');
    const plain = page.locator(openSurface);
    const options = plain.getByRole('listbox', { name: 'Workspace role' });
    await options.waitFor();
    assert.equal(await plain.getAttribute('role'), 'presentation');
    await assertFocused(options);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await plain.waitFor({ state: 'hidden' });
    assert.match(await select.getAttribute('aria-label'), /Editor$/);
    await assertFocused(select);

    const searchable = page.getByRole('button', { name: /^Project role/ });
    assert.equal(await searchable.getAttribute('aria-haspopup'), 'dialog');
    await searchable.press('ArrowDown');
    const searchPanel = page.getByRole('dialog', { name: 'Project role' });
    const search = searchPanel.getByRole('textbox', { name: 'Search options' });
    await search.waitFor();
    await assertFocused(search);
    await search.fill('Editor');
    await page.keyboard.press('Enter');
    await searchPanel.waitFor({ state: 'hidden' });
    assert.match(await searchable.getAttribute('aria-label'), /Editor$/);
    await assertFocused(searchable);

    const combobox = page.getByRole('combobox', { name: 'Assigned role' });
    await combobox.press('ArrowDown');
    const manual = page.locator(openSurface + '[popover="manual"]');
    await manual.getByRole('listbox').waitFor();
    await assertFocused(combobox);
    await page.keyboard.press('Enter');
    await manual.waitFor({ state: 'hidden' });
    assert.equal(await combobox.inputValue(), 'Viewer');
    await assertFocused(combobox);
  },
};

for (const theme of [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
]) {
  scenarios[`Shared overlay material preserves Popover and calendar radii in ${theme}`] = async ({
    page,
    mount,
  }) => {
    await mount('overlay-material-consumers', { theme });
    const square = theme.startsWith('pixel');

    await page.getByRole('button', { name: 'Open note' }).click();
    const note = page.getByRole('dialog', { name: 'Project note' });
    await note.waitFor();
    assert.equal(await note.getAttribute('popover'), 'auto');
    await assertRadius(note, square ? '0px' : '10px');
    await note.getByRole('button', { name: 'Close popover' }).click();

    for (const name of ['Select date', 'Choose date range']) {
      await page.getByRole('button', { name, exact: true }).click();
      const calendar = page.getByRole('dialog', { name, exact: true });
      await calendar.getByRole('grid').waitFor();
      assert.equal(await calendar.getAttribute('popover'), 'manual');
      await assertRadius(calendar, square ? '0px' : '12px');
    }
  };
}

export default scenarios;

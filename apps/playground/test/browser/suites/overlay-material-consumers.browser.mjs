import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

const openSurface = '[popover]:popover-open.unica-overlay-surface[data-surface="overlay"]';

async function assertOptionNames(page) {
  const accessibility = await page.context().newCDPSession(page);
  try {
    const { nodes } = await accessibility.send('Accessibility.getFullAXTree');
    const choices = nodes.filter((node) => node.role?.value === 'option');
    assert.deepEqual(
      choices.map((option) => [option.name.value, option.description?.value]),
      [
        ['Viewer', undefined],
        ['Editor', 'Edit pages and publish changes'],
      ],
    );
  } finally {
    await accessibility.detach();
  }
}

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
    const select = page.getByRole('button', { name: 'Workspace role', exact: true });
    assert.equal(await select.getAttribute('aria-haspopup'), 'listbox');
    await select.press('ArrowDown');
    const plain = page.locator(openSurface);
    const options = plain.getByRole('listbox', { name: 'Workspace role' });
    await options.waitFor();
    assert.equal(await plain.getAttribute('role'), 'presentation');
    assert.equal(await options.getAttribute('id'), await select.getAttribute('aria-controls'));
    await assertFocused(options);
    await assertOptionNames(page);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await plain.waitFor({ state: 'hidden' });
    assert.equal(await select.getAttribute('title'), 'Editor');
    await assertFocused(select);

    const searchable = page.getByRole('button', { name: 'Project role', exact: true });
    assert.equal(await searchable.getAttribute('aria-haspopup'), 'dialog');
    await searchable.press('ArrowDown');
    const searchPanel = page.getByRole('dialog', { name: 'Project role' });
    const search = searchPanel.getByRole('textbox', { name: 'Search options' });
    await search.waitFor();
    assert.equal(
      await searchPanel.getAttribute('id'),
      await searchable.getAttribute('aria-controls'),
    );
    await assertFocused(search);
    await search.fill('Editor');
    await page.keyboard.press('Enter');
    await searchPanel.waitFor({ state: 'hidden' });
    assert.equal(await searchable.getAttribute('title'), 'Editor');
    await assertFocused(searchable);

    const combobox = page.getByRole('combobox', { name: 'Assigned role', exact: true });
    await combobox.press('ArrowDown');
    const manual = page.locator(openSurface + '[popover="manual"]');
    await manual.getByRole('listbox').waitFor();
    await assertFocused(combobox);
    await assertOptionNames(page);
    await page.keyboard.press('Enter');
    await manual.waitFor({ state: 'hidden' });
    assert.equal(await combobox.inputValue(), 'Viewer');
    await assertFocused(combobox);
  },

  'Combobox renders public option rows at each desktop and touch density': async ({
    page,
    mount,
    watchPage,
  }) => {
    const touch = await page
      .context()
      .browser()
      .newContext({
        hasTouch: true,
        viewport: { width: 360, height: 780 },
      });
    try {
      await mount('overlay-material-consumers');
      const phone = watchPage(await touch.newPage());
      phone.setDefaultTimeout(5000);
      await phone.goto(page.url(), { waitUntil: 'commit' });
      for (const [current, coarse] of [
        [page, false],
        [phone, true],
      ]) {
        assert.equal(await current.evaluate(() => matchMedia('(pointer: coarse)').matches), coarse);
        for (const [size, expectedHeight, expectedIcon] of [
          ['s', 30, 14],
          ['m', 40, 16],
          ['l', 48, 20],
        ]) {
          const editor = current.getByRole('combobox', { name: `Assigned role ${size}` });
          await editor.scrollIntoViewIfNeeded();
          await editor.press('ArrowDown');
          const surface = current.locator(openSurface + '[popover="manual"]');
          const row = surface.getByRole('option', { name: 'Viewer', exact: true });
          const glyph = row.locator('svg:visible');
          await glyph.waitFor();
          const expected = coarse ? Math.max(44, expectedHeight) : expectedHeight;
          assert.equal(
            await row.evaluate((node) => parseFloat(getComputedStyle(node).minBlockSize)),
            expected,
          );
          assert.ok((await getBox(row)).height >= expected);
          assert.equal((await getBox(glyph)).width, expectedIcon);
          await assertFocused(editor);
          await editor.press('Escape');
          await surface.waitFor({ state: 'hidden' });
        }
      }

      const editor = page.getByRole('combobox', { name: 'Assigned role', exact: true });
      await editor.press('ArrowDown');
      const surface = page.locator(openSurface + '[popover="manual"]');
      const row = surface.getByRole('option', { name: 'Viewer', exact: true });
      await row.locator('svg:visible').waitFor();
      await surface.evaluate((node) => node.style.setProperty('inline-size', '220px', 'important'));
      await row.locator('svg:visible').waitFor({ state: 'hidden' });
      assert.equal(await row.count(), 1);
      assert.equal(
        await editor.getAttribute('aria-activedescendant'),
        await row.getAttribute('id'),
      );
    } finally {
      await touch.close();
    }
  },

  'Folio invite submits the role and expiry chosen inside its dialog': async ({ page, origin }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(
      new URL('/?item=07-invite-access-modal&family=frost&scheme=dark&vp=1440', origin).href,
    );
    const dialog = page.getByRole('dialog', {
      name: 'Invite members to Platform Eng',
      exact: true,
    });
    const role = dialog.getByRole('button', { name: 'Default workspace role', exact: true });
    await role.waitFor({ timeout: 20_000 });
    await role.press('ArrowDown');
    const popup = dialog.getByRole('dialog', { name: 'Default workspace role', exact: true });
    const search = popup.getByRole('textbox', { name: 'Search options' });
    await search.fill('viewer');
    await search.press('Escape');
    await popup.waitFor({ state: 'hidden' });
    assert.equal(await dialog.isVisible(), true);
    await assertFocused(role);
    assert.equal(await role.getAttribute('title'), 'Editor');

    await role.press('Enter');
    await search.fill('viewer');
    await search.press('Enter');
    await popup.waitFor({ state: 'hidden' });
    assert.equal(await role.getAttribute('title'), 'Viewer');
    const expiry = dialog.getByRole('button', { name: 'Invite link expiry', exact: true });
    await expiry.click();
    await dialog.getByRole('option', { name: '14 days', exact: true }).click();

    assert.deepEqual(
      await dialog.locator('form').evaluate((form) => {
        const entries = new FormData(form);
        return [entries.getAll('role'), entries.getAll('expiry')];
      }),
      [['viewer'], ['14']],
    );
    await dialog.getByRole('button', { name: 'Send 2 invites' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByText('Workspace role: Viewer. Invite links expire in 14 days.').waitFor();
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

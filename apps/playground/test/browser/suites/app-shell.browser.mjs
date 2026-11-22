import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox } from '../helpers.mjs';

async function stageCorner(page, stage, direction) {
  const { x, y, width } = await getBox(stage);
  const start = direction === 'rtl' ? x + width - 3 : x + 2;
  const png = await page.screenshot({
    clip: { x: Math.floor(start), y: Math.floor(y + 2), width: 1, height: 1 },
  });
  return stage.evaluate(async (element, base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const context = new OffscreenCanvas(1, 1).getContext('2d');
    context.drawImage(image, 0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return {
      painted: `rgb(${r}, ${g}, ${b})`,
      canvas: getComputedStyle(element).backgroundColor,
      aside: getComputedStyle(element.querySelector('.app-shell-aside')).backgroundColor,
      shell: getComputedStyle(element.closest('.app-shell-proto')).backgroundColor,
    };
  }, png.toString('base64'));
}

export default {
  'Preferences keeps its desktop shortcut cue and its labelled mobile destination': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mount('app-shell');
    const desktop = page.getByRole('link', { name: 'Preferences', exact: true });
    await desktop.hover();
    const hint = page.locator('[role="tooltip"]:popover-open');
    await hint.waitFor();
    assert.equal(
      await hint.locator('.unica-tooltip-label').textContent(),
      'Preferences & shortcuts',
    );
    assert.equal(await hint.locator('kbd svg').count(), 1);
    assert.equal(await hint.locator('kbd .unica-kbd-face').textContent(), ',');
    assert.equal(await desktop.getAttribute('href'), '#preferences');
    assert.equal(await page.getByRole('button', { name: 'Notifications, 3 unread' }).count(), 1);

    await page.setViewportSize({ width: 520, height: 720 });
    await hint.waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Navigation', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Navigation' });
    await sheet.getByText('Workspace sections', { exact: true }).click();
    const mobile = sheet.getByRole('link', { name: 'Preferences', exact: true });
    await mobile.hover();
    assert.equal(await mobile.getAttribute('href'), '#preferences');
    assert.equal(await sheet.locator('.app-shell-sheet-rail [role="tooltip"]').count(), 0);
  },

  'Inspector toggle and glyph keep their coordinates next to a taller canvas header': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    for (const direction of ['ltr', 'rtl']) {
      await mount('app-shell', { theme: 'frost-light', textScale: 120, direction });
      await page.evaluate(() => document.fonts.ready);

      const hide = page.getByRole('button', { name: 'Hide inspector' });
      const show = page.getByRole('button', { name: 'Show inspector' });
      const buttonBox = await getBox(hide);
      const glyphBox = await getBox(hide.locator('svg'));

      await hide.focus();
      await page.keyboard.press('Enter');
      await assertFocused(show);
      await assertBox(show, buttonBox);
      await assertBox(show.locator('svg'), glyphBox);

      await page.mouse.click(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
      await assertFocused(hide);
      await assertBox(hide, buttonBox);
      await assertBox(hide.locator('svg'), glyphBox);
    }
  },

  'The inspector keeps its owner preview and draft across dock and modal layouts': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mount('app-shell', { theme: 'frost-dark' });
    const owner = page.getByRole('link', { name: 'Owner team' });
    const preview = page.locator('.unica-hover-card:popover-open[data-side]');
    const openDock = page.locator('.app-shell-panel-end[open][role="presentation"]:not(:modal)');
    const trigger = page.getByRole('button', { name: 'Inspector', exact: true });
    const sheet = page.getByRole('dialog', { name: 'Inspector' });

    await preview.waitFor();
    await openDock.waitFor();
    assert.equal(await preview.textContent(), 'Maintains the reference documentation.');
    await page.keyboard.press('Escape');
    await preview.waitFor({ state: 'detached' });
    assert.equal(await openDock.isVisible(), true);
    await owner.hover();
    await preview.waitFor();

    await page.setViewportSize({ width: 520, height: 720 });
    await preview.waitFor({ state: 'detached' });
    assert.equal(await openDock.isVisible(), false);
    assert.equal(await owner.count(), 0);
    await trigger.click();
    await assertFocused(sheet.getByRole('heading', { name: 'Inspector', exact: true }));
    await owner.hover();
    await preview.waitFor();
    await page.keyboard.press('Escape');
    await preview.waitFor({ state: 'detached' });
    assert.equal(await sheet.isVisible(), true);
    await page.keyboard.press('Escape');
    await openDock.waitFor({ state: 'attached' });
    assert.equal(await openDock.isVisible(), false);
    await assertFocused(trigger);

    await trigger.click();
    await sheet.getByRole('textbox', { name: 'Reference' }).fill('RS-105');
    await page.setViewportSize({ width: 1280, height: 720 });
    await openDock.waitFor();
    await assertFocused(page.getByRole('region', { name: 'Workspace canvas' }));
    assert.equal(await page.getByRole('textbox', { name: 'Reference' }).inputValue(), 'RS-105');
    await owner.hover();
    await preview.waitFor();
  },

  'The L-shaped corner keeps its material geometry when navigation collapses': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    for (const [theme, direction] of [
      ['soft-light', 'ltr'],
      ['frost-dark', 'rtl'],
      ['pixel-light', 'ltr'],
    ]) {
      await mount('app-shell', { theme, direction });
      const stage = page.locator('.app-shell-stage');
      const square = theme.startsWith('pixel');
      const open = await stageCorner(page, stage, direction);
      assert.equal(open.painted, square ? open.aside : open.shell);
      await page.getByRole('button', { name: 'Hide navigation' }).click();
      const closed = await stageCorner(page, stage, direction);
      assert.equal(closed.painted, square ? closed.canvas : closed.shell);
      await page.getByRole('button', { name: 'Show navigation' }).click();
      assert.deepEqual(await stageCorner(page, stage, direction), open);
    }
  },

  'Overflowing document tabs align with their actions and keep the complete picker usable': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 520, height: 720 });
    for (const direction of ['ltr', 'rtl']) {
      await mount('app-shell', { theme: 'frost-light', textScale: 120, direction });
      await page.evaluate(() => document.fonts.ready);
      const picker = page.getByRole('button', { name: 'All open documents' });
      const add = page.getByRole('button', { name: 'Open another document' });
      const viewport = page.locator('.app-shell-document-scroll');
      await picker.waitFor();
      assert.deepEqual(
        await viewport.evaluate((element) => ({
          overflow: element.scrollWidth > element.clientWidth,
          gutter: element.offsetHeight - element.clientHeight,
        })),
        { overflow: true, gutter: 0 },
      );
      const tab = page.getByRole('button', { name: 'Platform architecture' });
      const [tabBox, pickerBox, addBox] = await Promise.all([tab, picker, add].map(getBox));
      const center = (box) => box.y + box.height / 2;
      assert.equal(center(tabBox), center(pickerBox));
      assert.equal(center(tabBox), center(addBox));

      await picker.click();
      const list = page.getByRole('region', { name: 'All open documents' });
      assert.equal(await list.getByRole('button').count(), 6);
      await list.getByRole('button', { name: 'Field observations' }).click();
      const current = page.getByRole('button', { name: 'Field observations' });
      await assertFocused(current);
      assert.equal(await current.getAttribute('aria-current'), 'page');
      const visible = await getBox(viewport);
      const selected = await getBox(current);
      assert.ok(
        selected.x >= visible.x && selected.x + selected.width <= visible.x + visible.width,
      );
    }
  },
};

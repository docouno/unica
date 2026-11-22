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

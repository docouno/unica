import assert from 'node:assert/strict';
import {
  assertBox,
  assertFocused,
  assertHitTarget,
  pressKeys,
  resetForm,
  submitForm,
} from '../helpers.mjs';

function readContext(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      fontSize: parseFloat(style.fontSize),
      direction: style.direction,
    };
  });
}

export default {
  'Mounts fixtures that have no visible content': async ({ page, mount }) => {
    await mount('closed-dialog');
    const dialog = page.getByRole('dialog', { includeHidden: true });
    assert.equal(await dialog.evaluate((element) => element.open), false);
    assert.equal(await dialog.isVisible(), false);
  },

  'Applies surface, text scale, direction and emulated media to fixtures': async ({
    page,
    mount,
  }) => {
    const probe = page.getByTestId('context');
    await mount('native');
    const base = await readContext(probe);
    assert.equal(base.direction, 'ltr');
    assert.equal(base.background, 'rgb(26, 32, 38)');

    await mount('native', { surface: 'overlay', textScale: 120, direction: 'rtl' });
    const overlay = await readContext(probe);
    assert.equal(overlay.background, 'rgb(31, 39, 46)');
    assert.equal(overlay.direction, 'rtl');
    assert.ok(base.fontSize > 0);
    assert.ok(Math.abs(overlay.fontSize / base.fontSize - 1.2) < 0.001);

    await mount('native', { forcedColors: 'active', reducedMotion: 'reduce' });
    assert.deepEqual(
      await page.evaluate(() => [
        matchMedia('(forced-colors: active)').matches,
        matchMedia('(prefers-reduced-motion: reduce)').matches,
      ]),
      [true, true],
    );
  },

  'Traverses native controls and hits the top-layer dialog before the background': async ({
    page,
    mount,
  }) => {
    await mount('native');
    const first = page.getByRole('button', { name: 'First stop' });
    const firstChoice = page.getByRole('radio', { name: 'First choice' });
    const secondChoice = page.getByRole('radio', { name: 'Second choice' });
    await pressKeys(page, 'Tab');
    await assertFocused(first);
    await pressKeys(page, 'Tab');
    await assertFocused(firstChoice);
    await pressKeys(page, 'ArrowRight');
    await assertFocused(secondChoice);
    assert.equal(await secondChoice.isChecked(), true);
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(first);

    const background = page.getByRole('button', { name: 'Background', includeHidden: true });
    const box = await assertBox(background, { width: 127.5, height: 40 }, { tolerance: 0.05 });
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await assertHitTarget(background, point);

    const open = page.getByRole('button', { name: 'Open dialog' });
    await open.click();
    const dialog = page.getByRole('dialog');
    await assertFocused(dialog.getByRole('button', { name: 'Dialog action' }));
    await assertHitTarget(dialog, point);
    await page.mouse.click(point.x, point.y);
    const clicks = page.getByTestId('background-clicks');
    assert.equal(await clicks.textContent(), '0');

    await pressKeys(page, 'Escape');
    await dialog.waitFor({ state: 'hidden' });
    await assertFocused(open);
    await assertHitTarget(background, point);
    await page.mouse.click(point.x, point.y);
    assert.equal(await clicks.textContent(), '1');
  },

  'Captures named native form entries and restores default values on reset': async ({
    page,
    mount,
  }) => {
    await mount('native');
    const form = page.getByRole('form', { name: 'Native form' });
    const submit = form.getByRole('button', { name: 'Submit form' });
    await form.getByRole('textbox', { name: 'Answer' }).fill('edited');
    assert.deepEqual(await submitForm(form, submit), [
      ['answer', 'edited'],
      ['answer', 'fixed'],
      ['action', 'save'],
    ]);
    await resetForm(form);
    assert.deepEqual(await submitForm(form, submit), [
      ['answer', 'original'],
      ['answer', 'fixed'],
      ['action', 'save'],
    ]);
  },
};

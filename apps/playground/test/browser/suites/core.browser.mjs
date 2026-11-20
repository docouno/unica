import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys } from '../helpers.mjs';

function waitForFrames(page) {
  return page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

export default {
  'FocusOrigin reports pointer focus, then keyboard focus on the next owner': async ({
    page,
    mount,
  }) => {
    await mount('core');
    const first = page.getByRole('button', { name: 'First owner' });
    const second = page.getByRole('button', { name: 'Second owner' });

    await first.click();
    await assertFocused(first);
    assert.equal(await first.getAttribute('data-focus-origin'), 'pointer');
    assert.equal(await first.evaluate((element) => element.matches(':focus-visible')), false);

    await pressKeys(page, 'Tab');
    await assertFocused(second);
    assert.equal(await second.getAttribute('data-focus-origin'), 'keyboard');
    assert.equal(await second.evaluate((element) => element.matches(':focus-visible')), true);
    assert.equal(await first.getAttribute('data-focus-origin'), 'none');
  },

  'PointerProximity samples real mouse movement and pauses for reduced motion': async ({
    page,
    mount,
  }) => {
    await mount('core');
    assert.equal(
      await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches),
      true,
    );
    const target = page.getByTestId('pointer');
    const box = await getBox(target);
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + box.height / 2);
    await page.mouse.move(x, y);
    await page.locator(`[data-testid="pointer"][data-position="${x},${y}"]`).waitFor();
    const measurements = await target.getAttribute('data-measurements');
    assert.ok(Number(measurements) > 0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-testid="pointer"][data-position="none"]').waitFor();
    await page.mouse.move(x + 10, y);
    await waitForFrames(page);
    assert.equal(await target.getAttribute('data-position'), 'none');
    assert.equal(await target.getAttribute('data-measurements'), measurements);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: no-preference)').matches);
    // Let the media change handler clear the old sample before sending new input.
    await waitForFrames(page);
    await page.mouse.move(x + 20, y);
    await page.locator(`[data-testid="pointer"][data-position="${x + 20},${y}"]`).waitFor();
    assert.ok(Number(await target.getAttribute('data-measurements')) > Number(measurements));
  },
};

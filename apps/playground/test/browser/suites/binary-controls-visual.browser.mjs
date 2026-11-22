import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

async function readPaint(control) {
  return control.evaluate((node) => {
    const paint = getComputedStyle(node.nextElementSibling);
    return [paint.backgroundColor, paint.borderColor];
  });
}

async function pointerSamples(page, control, text) {
  const box = await getBox(text);
  await page.mouse.move(1, 1);
  const rest = await readPaint(control);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const hover = await readPaint(control);
  await page.mouse.down();
  const press = await readPaint(control);
  await page.mouse.up();
  return { rest, hover, press, released: await readPaint(control) };
}

async function indicatorGeometry(control) {
  return control.evaluate((node) => {
    const indicator = node.nextElementSibling;
    const { x, y, width, height } = indicator.getBoundingClientRect();
    const child = indicator.firstElementChild?.getBoundingClientRect();
    const styles = getComputedStyle(indicator);
    const row = node.closest('label').getBoundingClientRect();
    return {
      width,
      height,
      rowWidth: row.width,
      rowHeight: row.height,
      radius: styles.borderTopLeftRadius.replace(/^min\(([\d.]+)px, 25%\)$/, '$1px'),
      centered: child && {
        x: Math.abs(child.x + child.width / 2 - (x + width / 2)),
        y: Math.abs(child.y + child.height / 2 - (y + height / 2)),
      },
      childWidth: child?.width,
      childHeight: child?.height,
    };
  });
}

export default {
  'Binary controls respond to external label text like an internal label in both polarities':
    async ({ page, mount }) => {
      await mount('binary-controls-visual', { theme: 'frost-light', surface: 'overlay' });
      for (const kind of ['checkbox', 'switch']) {
        for (const state of ['off', 'on', 'locked']) {
          const prefix = `${kind}-${state}`;
          const internal = page.locator(`#${prefix}-internal`);
          const external = page.locator(`#${prefix}-external`);
          const internalText = page.getByText(`${kind} ${state} internal`, { exact: true });
          const externalText = page.getByTestId(`${prefix}-external-text`);
          const internalPaint = await pointerSamples(page, internal, internalText);
          assert.equal(
            await page.getByTestId(`${prefix}-changes`).textContent(),
            state === 'locked' ? '0' : '1',
          );
          const externalPaint = await pointerSamples(page, external, externalText);
          assert.deepEqual(externalPaint, internalPaint, prefix);
          assert.equal(
            await page.getByTestId(`${prefix}-changes`).textContent(),
            state === 'locked' ? '0' : '2',
          );
          assert.equal((await external.evaluate((node) => node.labels.length)) > 0, true);

          if (state === 'locked') {
            assert.deepEqual(externalPaint.hover, externalPaint.rest);
            assert.deepEqual(externalPaint.press, externalPaint.rest);
            await internal.focus();
            await page.keyboard.press('Tab');
            await assertFocused(external);
            assert.equal(
              await external.evaluate(
                (node) => getComputedStyle(node.nextElementSibling).outlineWidth,
              ),
              '2px',
            );
          } else {
            assert.notDeepEqual(externalPaint.hover, externalPaint.rest);
            assert.notDeepEqual(externalPaint.press, externalPaint.hover);
          }
        }
      }
    },

  'Binary controls retain all size geometry across six themes, forced colors and coarse pointers':
    async ({ page, mount }) => {
      const variants = [
        ['s', 16, 40, 22, 18],
        ['m', 20, 44, 24, 20],
        ['l', 24, 52, 28, 24],
      ];
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setTouchEmulationEnabled', {
        enabled: true,
        maxTouchPoints: 1,
      });
      await page.setViewportSize({ width: 360, height: 900 });

      for (const family of ['soft', 'frost', 'pixel']) {
        for (const scheme of ['dark', 'light']) {
          await mount('binary-controls-visual', {
            theme: `${family}-${scheme}`,
            surface: scheme === 'light' ? 'overlay' : 'base',
            direction: 'rtl',
            textScale: 120,
          });
          assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);

          for (const [size, glyph, trackWidth, trackHeight, thumb] of variants) {
            const checkbox = await indicatorGeometry(page.locator(`#geometry-checkbox-${size}`));
            const radio = await indicatorGeometry(page.locator(`#geometry-radio-${size}`));
            const toggle = await indicatorGeometry(page.locator(`#geometry-switch-${size}`));
            assert.deepEqual([checkbox.width, checkbox.height], [glyph, glyph]);
            assert.deepEqual(
              [radio.width, radio.height, radio.childWidth, radio.childHeight],
              [glyph, glyph, glyph / 2, glyph / 2],
            );
            assert.ok(radio.centered.x <= 0.5 && radio.centered.y <= 0.5);
            assert.equal(radio.radius, '50%');
            assert.equal(checkbox.radius, family === 'pixel' ? '0px' : '4px');
            assert.deepEqual(
              [toggle.width, toggle.height, toggle.childWidth, toggle.childHeight],
              [trackWidth, trackHeight, thumb, thumb],
            );
            for (const geometry of [checkbox, radio, toggle]) {
              assert.ok(geometry.rowWidth >= 44 && geometry.rowHeight >= 44);
            }
          }
        }
      }

      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
      const control = page.locator('#geometry-switch-s');
      const thumb = () =>
        control.evaluate((node) => {
          const indicator = node.nextElementSibling;
          const part = indicator.firstElementChild;
          return {
            x: part.getBoundingClientRect().x - indicator.getBoundingClientRect().x,
            duration: getComputedStyle(part).transitionDuration,
            border: getComputedStyle(indicator).borderColor,
          };
        });
      const off = await thumb();
      await control.press('Space');
      const on = await thumb();
      assert.equal(off.duration, '0s');
      assert.equal(on.duration, '0s');
      assert.equal(off.x - on.x, 18);
      assert.notEqual(off.border, on.border);
    },
};

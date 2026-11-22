import assert from 'node:assert/strict';
import { assertBox, assertFocused, assertHitTarget, getBox, pressKeys } from '../helpers.mjs';

const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];
const sizes = [
  ['s', 30, 14],
  ['m', 40, 16],
  ['l', 48, 20],
];
const variants = ['primary', 'secondary', 'ghost'];
const tones = ['accent', 'neutral', 'danger'];
const face = '.unica-button-face';
const content = '.unica-button-content';
const spinner = '.unica-button-spinner svg';
const button = (scope, name) => scope.getByRole('button', { name, exact: true });

async function computed(locator, ...properties) {
  return locator.evaluate(
    (element, keys) => keys.map((key) => getComputedStyle(element).getPropertyValue(key)),
    properties,
  );
}

async function systemColor(locator, value, property = 'color') {
  return locator.evaluate(
    (element, { value, property }) => {
      const probe = element.ownerDocument.createElement('span');
      probe.style.forcedColorAdjust = 'none';
      probe.style.setProperty(property, value);
      element.append(probe);
      const result = getComputedStyle(probe).getPropertyValue(property);
      probe.remove();
      return result;
    },
    { value, property },
  );
}

async function checkSizeGrid(page, coarse = false) {
  const rows = await page.getByTestId('button-s').evaluate(
    (element, { sizes, content }) => {
      const section = element.closest('section');
      return sizes.map(([size]) =>
        ['button-', 'square-'].map((prefix) => {
          const node = section.querySelector(`[data-testid="${prefix}${size}"]`);
          const { x, width, height } = node.getBoundingClientRect();
          const icon = node.querySelector(`${content} svg`).getBoundingClientRect();
          return { x, width, height, icon: [icon.width, icon.height] };
        }),
      );
    },
    { sizes, content },
  );
  for (const [index, [size, height, glyph]] of sizes.entries()) {
    const expected = coarse ? Math.max(height, 44) : height;
    const [box, next] = rows[index];
    assert.equal(box.height, expected, size);
    assert.deepEqual([next.width, next.height], [expected, expected], size);
    assert.ok(box.width >= (coarse ? 44 : height), size);
    const gap = Math.max(next.x - (box.x + box.width), box.x - (next.x + next.width));
    assert.equal(gap, 8);
    for (const action of [box, next]) {
      assert.deepEqual(action.icon, [glyph, glyph], size);
    }
  }
}

async function checkPendingMarks(page, theme) {
  const mark = theme.startsWith('pixel')
    ? '.unica-activity-icon-wait-cell'
    : '.unica-activity-icon-wait-arc';
  const metrics = await page.getByTestId('button-s').evaluate(
    (element, properties) => {
      const section = element.closest('section');
      return properties.sizes.map(([size]) =>
        ['button-', 'square-'].map((prefix) => {
          const activity = section.querySelector(
            `[data-testid="${prefix}${size}"] ${properties.spinner}`,
          );
          const { width, height } = activity.getBoundingClientRect();
          return [
            width,
            height,
            getComputedStyle(activity.querySelector(properties.mark)).animationName,
          ];
        }),
      );
    },
    { sizes, spinner, mark },
  );
  for (const [index, [size, , glyph]] of sizes.entries()) {
    assert.deepEqual(
      metrics[index],
      [
        [glyph, glyph, 'none'],
        [glyph, glyph, 'none'],
      ],
      size,
    );
  }
}

async function waitForFacePosition(page, action, y) {
  await action.locator(face).evaluate(async (element, expected) => {
    const limit = performance.now() + 2000;
    while (Math.abs(element.getBoundingClientRect().y - expected) > 0.1) {
      if (performance.now() >= limit) {
        throw new Error(
          `Expected face at ${expected}px, found ${element.getBoundingClientRect().y}px`,
        );
      }
      await new Promise(requestAnimationFrame);
    }
  }, y);
  await page.evaluate(() => new Promise(requestAnimationFrame));
}

async function selectedContrast(palette) {
  const snapshot = await palette.screenshot({
    animations: 'disabled',
    scale: 'css',
    style: `${content} { opacity: 0 !important; }`,
  });
  return palette.evaluate(
    async (element, { png, face }) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + png;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const pixels = canvas.getContext('2d', { willReadFrequently: true });
      pixels.drawImage(image, 0, 0);
      const inkCanvas = document.createElement('canvas');
      inkCanvas.width = 1;
      inkCanvas.height = 1;
      const inkPixel = inkCanvas.getContext('2d', { willReadFrequently: true });
      const origin = element.getBoundingClientRect();
      const pixel = (x, y) =>
        [
          ...pixels.getImageData(Math.round(x - origin.x), Math.round(y - origin.y), 1, 1).data,
        ].slice(0, 3);
      const luminance = (values) => {
        const [r, g, b] = values.map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (first, second) => {
        const firstLum = luminance(first);
        const secondLum = luminance(second);
        return (Math.max(firstLum, secondLum) + 0.05) / (Math.min(firstLum, secondLum) + 0.05);
      };
      return [...element.querySelectorAll('[aria-pressed="true"]')].map((action) => {
        const id = action.getAttribute('data-testid');
        const rect = action.querySelector(face).getBoundingClientRect();
        const other = element.querySelector(`[data-testid="${id.replace(/-(on|icon)$/, '-off')}"]`);
        const otherRect = other.querySelector(face).getBoundingClientRect();
        const y = Math.floor(rect.y + rect.height / 2);
        let contrast;
        let changed;
        let fillDifference;
        let textContrast;
        if (id.startsWith('primary')) {
          const background = pixel(rect.x + rect.width / 2, rect.top - 4);
          const paint = [0.2, 0.5, 0.8].map((position) =>
            pixel(rect.x + rect.width / 2, rect.y + position * rect.height),
          );
          const off = pixel(otherRect.x + otherRect.width / 2, y);
          contrast = Math.min(...paint.map((color) => ratio(color, background)));
          fillDifference = ratio(paint[1], off);
          changed = String(paint[1]) !== String(off);
          inkPixel.clearRect(0, 0, 1, 1);
          inkPixel.fillStyle = getComputedStyle(action).color;
          inkPixel.fillRect(0, 0, 1, 1);
          const ink = [...inkPixel.getImageData(0, 0, 1, 1).data].slice(0, 3);
          textContrast = Math.min(...paint.map((color) => ratio(color, ink)));
        } else {
          const interior = pixel(rect.x + 8, y);
          const outside = pixel(rect.x - 4, y);
          // The one-pixel contour may start at a fractional CSS x coordinate.
          const sampleEdge = (left) =>
            [0, 1, 2].map((offset) => pixel(Math.floor(left) + offset, y));
          const strokes = sampleEdge(rect.x);
          contrast = Math.max(
            1,
            ...strokes
              .filter((stroke) => String(stroke) !== String(outside))
              .map((stroke) => ratio(stroke, interior)),
          );
          const oldStrokes = sampleEdge(otherRect.x);
          changed = String(strokes) !== String(oldStrokes);
        }
        return { id, contrast, changed, fillDifference, textContrast };
      });
    },
    { png: snapshot.toString('base64'), face },
  );
}

export default {
  ...Object.fromEntries(
    themes.map((theme) => [
      `Button and IconButton retain exact geometry and touch targets in ${theme}`,
      async ({ page, mount }) => {
        await mount('button-material', { theme });
        assert.equal(await page.evaluate(() => matchMedia('(pointer: fine)').matches), true);
        await checkSizeGrid(page);
        const touch = await page.context().newCDPSession(page);
        try {
          await touch.send('Emulation.setTouchEmulationEnabled', {
            enabled: true,
            maxTouchPoints: 1,
          });
          await page.waitForFunction(() => matchMedia('(pointer: coarse)').matches);
          await checkSizeGrid(page, true);
          const lightPaint = await page
            .getByTestId('button-s')
            .evaluate((element) => getComputedStyle(element, '::before').content);
          assert.equal(lightPaint, 'none');
        } finally {
          await touch.detach();
        }
      },
    ]),
  ),

  ...Object.fromEntries(
    themes.map((theme, index) => [
      `Button RTL text stress preserves names, glyph order and loading geometry in ${theme}`,
      async ({ page, mount }) => {
        const widths = [360, 768, 1280, 1440, 360, 768];
        await page.setViewportSize({ width: widths[index], height: 750 });
        await mount('button-material', {
          theme,
          textScale: 120,
          direction: 'rtl',
          surface: index % 2 ? 'overlay' : 'base',
          reducedMotion: 'reduce',
        });
        const action = page.getByRole('button', { name: /^Export אבג SuperficiallyUnbreakable/ });
        const adjacent = page.getByTestId('adjacent');
        const row = page.getByTestId('wrapping-actions');
        const before = await getBox(action);
        const beforeAdjacent = await getBox(adjacent);
        assert.ok(before.height > 40, theme + ': action text wraps');
        assert.equal(
          await row.evaluate((element) => element.scrollWidth <= element.clientWidth),
          true,
        );
        const glyph = action.locator(`${content} svg`);
        assert.ok((await getBox(glyph.first())).x > (await getBox(glyph.last())).x);
        assert.deepEqual(await computed(glyph.first(), 'scale'), ['none']);
        assert.deepEqual(await computed(glyph.last(), 'scale'), ['none']);
        assert.equal(await action.locator('kbd').count(), 1);

        await action.focus();
        const pending = button(page, 'Toggle metrics loading');
        await pending.evaluate((element) => element.click());
        await assertFocused(action);
        assert.equal(await action.getAttribute('aria-busy'), 'true');
        assert.equal(await action.getAttribute('disabled'), null);
        await assertBox(action, before, { tolerance: 0.1 });
        await assertBox(adjacent, beforeAdjacent, { tolerance: 0.1 });
        assert.deepEqual(await computed(action.locator(content), 'opacity'), ['0']);
        await checkPendingMarks(page, theme);
        await pending.evaluate((element) => element.click());
        await assertFocused(action);
        await assertBox(action, before, { tolerance: 0.1 });
        await assertBox(adjacent, beforeAdjacent, { tolerance: 0.1 });
        assert.deepEqual(await computed(action.locator(content), 'opacity'), ['1']);
      },
    ]),
  ),

  'Button Frost press travel leaves the original root hittable through mouse release': async ({
    page,
    mount,
  }) => {
    for (const theme of ['frost-dark', 'soft-dark', 'pixel-dark']) {
      await mount('button-material', { theme });
      await button(page, 'Before travel').focus();
      await pressKeys(page, 'Tab');
      await assertFocused(button(page, 'Hold primary'));
      assert.deepEqual(
        await computed(button(page, 'Hold primary'), 'outline-width', 'outline-offset'),
        ['2px', '2px'],
      );
      const count = page.getByTestId('travel-actions');
      for (const [variant, travel] of [
        ['primary', 2],
        ['secondary', 1],
        ['ghost', 0],
        ['selected', 0],
      ]) {
        const action = button(page, 'Hold ' + variant);
        const before = await getBox(action);
        const paint = await getBox(action.locator(face));
        const label = await getBox(action.locator(content));
        const offset = theme === 'frost-dark' ? travel : 0;
        const point = { x: before.x + before.width / 2, y: before.y + 0.5 };
        await page.mouse.move(point.x, point.y);
        await page.mouse.down();
        await waitForFacePosition(page, action, paint.y + offset);
        await assertBox(action, before);
        await assertBox(action.locator(content), { y: label.y + offset }, { tolerance: 0.1 });
        await assertHitTarget(action, point);
        await page.mouse.up();
        await waitForFacePosition(page, action, paint.y);
      }
      assert.equal(await count.textContent(), '4');
      const primary = await getBox(button(page, 'Hold primary'));
      await page.mouse.move(primary.x + primary.width / 2, primary.y + 0.5);
      await page.mouse.down();
      await page.mouse.move(primary.x + primary.width / 2, primary.y - 8);
      await page.mouse.up();
      assert.equal(await count.textContent(), '4', 'release outside does not activate');
    }

    await mount('button-material', { theme: 'frost-dark', reducedMotion: 'reduce' });
    const action = button(page, 'Hold primary');
    const before = await getBox(action.locator(face));
    const root = await getBox(action);
    await page.mouse.move(root.x + root.width / 2, root.y + 0.5);
    await page.mouse.down();
    const [durations, transform] = await computed(
      action.locator(face),
      'transition-duration',
      'transform',
    );
    assert.ok(durations.split(',').every((duration) => duration.trim() === '0s'));
    assert.equal(transform, 'none');
    await assertBox(action.locator(face), before);
    await page.mouse.up();
  },

  'Button selected loading and expanded triggers retain their cues in system colors': async ({
    page,
    mount,
  }) => {
    for (const [scheme, theme] of [
      ['dark', 'frost-dark'],
      ['light', 'pixel-light'],
    ]) {
      await page.emulateMedia({ colorScheme: scheme });
      await mount('button-material', { theme, forcedColors: 'active', reducedMotion: 'reduce' });
      const active = page.getByTestId('forced-active');
      const disabled = page.getByTestId('forced-disabled');
      const selected = page.getByTestId('forced-selected');
      const standalone = page.getByTestId('forced-standalone');
      await button(page, 'Before forced colors').focus();
      await pressKeys(page, 'Tab');
      await assertFocused(active);
      const highlight = await systemColor(active, 'Highlight');
      const highlightText = await systemColor(active, 'HighlightText');
      const neutral = await systemColor(active, 'CanvasText');
      const gray = await systemColor(active, 'GrayText');
      const buttonFace = await systemColor(active, 'ButtonFace');
      const buttonText = await systemColor(active, 'ButtonText');
      const property = scheme === 'dark' ? 'stroke' : 'fill';
      const glyph =
        scheme === 'dark' ? '.unica-activity-icon-wait-arc' : '.unica-activity-icon-wait-cell';
      assert.deepEqual(
        await computed(active.locator(face), 'background-color', 'border-top-color'),
        [highlight, highlight],
      );
      assert.deepEqual(await computed(active, 'outline-color', 'outline-width', 'outline-offset'), [
        highlight,
        '2px',
        '2px',
      ]);
      const marks = await active.locator(glyph).all();
      assert.equal(marks.length, scheme === 'dark' ? 1 : 8);
      for (const mark of marks) {
        assert.deepEqual(await computed(mark, property, 'animation-name'), [highlightText, 'none']);
      }
      assert.deepEqual(await computed(standalone.locator(glyph).first(), property), [neutral]);
      assert.deepEqual(await computed(selected, 'color'), [highlightText]);
      assert.deepEqual(await computed(disabled, 'color'), [gray]);
      assert.deepEqual(await computed(disabled.locator(face), 'border-top-style'), ['dashed']);
      assert.deepEqual(await computed(disabled.locator(content), 'opacity'), ['1']);
      assert.equal(await disabled.locator(spinner).isVisible(), false);
      for (const variant of ['secondary', 'ghost']) {
        const closed = page.getByTestId(variant + '-closed');
        const expanded = page.getByTestId(variant + '-expanded');
        const expandedSelected = page.getByTestId(variant + '-expanded-on');
        const expandedDisabled = page.getByTestId(variant + '-expanded-disabled');
        const faceProperties = ['background-color', 'border-top-color', 'border-top-width'];
        assert.deepEqual(await computed(closed.locator(face), ...faceProperties), [
          buttonFace,
          buttonText,
          '1px',
        ]);
        assert.deepEqual(await computed(expanded.locator(face), ...faceProperties), [
          buttonFace,
          highlight,
          '2px',
        ]);
        assert.deepEqual(await computed(expandedSelected.locator(face), ...faceProperties), [
          highlight,
          highlight,
          '1px',
        ]);
        assert.deepEqual(await computed(expandedDisabled.locator(face), ...faceProperties), [
          await systemColor(active, 'Canvas'),
          gray,
          '1px',
        ]);
        await closed.focus();
        await pressKeys(page, 'Tab');
        await assertFocused(expanded);
        assert.deepEqual(
          await computed(expanded, 'outline-color', 'outline-width', 'outline-offset'),
          [highlight, '2px', '2px'],
        );
      }
    }
  },

  ...Object.fromEntries(
    themes.map((theme) => [
      `Button preserves distinguishable selected paint and Alert action context in ${theme}`,
      async ({ page, mount }) => {
        await page.setViewportSize({ width: 1100, height: 750 });
        await mount('button-material', { theme, reducedMotion: 'reduce' });
        const selected = page.getByTestId('selected-palette');
        const states = await selected.evaluate((element) =>
          [...element.querySelectorAll('button')].map((action) => [
            action.dataset.testid,
            action.getAttribute('aria-pressed'),
          ]),
        );
        const expected = variants.flatMap((variant) =>
          tones.flatMap((tone) => [
            [variant + '-' + tone + '-off', 'false'],
            [variant + '-' + tone + '-on', 'true'],
            [variant + '-' + tone + '-icon', 'true'],
          ]),
        );
        assert.deepEqual(states, expected);
        for (const {
          id,
          contrast,
          changed,
          fillDifference,
          textContrast,
        } of await selectedContrast(selected)) {
          assert.equal(changed, true, id + ': selected paint differs');
          assert.ok(contrast >= 3, `${id}: selected cue contrast ${contrast.toFixed(2)}:1`);
          if (textContrast !== undefined) {
            assert.ok(
              textContrast >= 4.5,
              `${id}: selected text contrast ${textContrast.toFixed(2)}:1`,
            );
          }
          if (theme === 'soft-light' && id.startsWith('primary-accent')) {
            // The original 1.01:1 fill shift changed pixels without a visible selected cue.
            assert.ok(
              fillDifference >= 1.2,
              `${id}: selected vs resting fill ${fillDifference.toFixed(2)}:1`,
            );
          }
        }

        const contextual = page.getByTestId('context-neutral');
        const standalone = page.getByTestId('outside-neutral');
        const [outsideInk] = await computed(standalone, 'color');
        const [ink] = await computed(contextual, 'color');
        const contextInk = await systemColor(
          contextual,
          'color-mix(in srgb, var(--action-context-ink) 80%, var(--fg-primary))',
        );
        assert.equal(ink, contextInk);
        assert.notEqual(ink, outsideInk);
        assert.deepEqual(await computed(page.getByTestId('card-neutral'), 'color'), [outsideInk]);
        assert.deepEqual(await computed(page.getByTestId('overlay-neutral'), 'color'), [
          outsideInk,
        ]);
        assert.notDeepEqual(await computed(page.getByTestId('context-accent'), 'color'), [ink]);
        assert.notDeepEqual(await computed(page.getByTestId('context-danger'), 'color'), [ink]);
        assert.notDeepEqual(await computed(page.getByTestId('context-disabled'), 'color'), [ink]);

        await page.keyboard.press('Tab');
        await contextual.focus();
        assert.deepEqual(await computed(contextual, 'outline-color'), [
          await systemColor(contextual, 'var(--action-context-ink)'),
        ]);
        await mount('button-material', { theme, surface: 'overlay', reducedMotion: 'reduce' });
        const overlay = page.getByTestId('context-neutral');
        assert.deepEqual(await computed(overlay, 'color'), [
          await systemColor(
            overlay,
            'color-mix(in srgb, var(--action-context-ink) 80%, var(--fg-primary))',
          ),
        ]);
      },
    ]),
  ),

  ...Object.fromEntries(
    ['soft-dark', 'soft-light', 'pixel-dark', 'pixel-light'].map((theme) => [
      `Button keeps primary selection distinct from a held command in ${theme}`,
      async ({ page, mount }) => {
        await page.setViewportSize({ width: 1100, height: 750 });
        await mount('button-material', { theme, reducedMotion: 'reduce' });
        const palette = page.getByTestId('selected-palette');
        for (const tone of tones) {
          const held = page.getByTestId('primary-' + tone + '-off');
          await held.hover();
          await page.mouse.down();
          try {
            assert.equal(await held.evaluate((element) => element.matches(':active')), true);
            const { fillDifference } = (await selectedContrast(palette)).find(
              ({ id }) => id === 'primary-' + tone + '-on',
            );
            assert.ok(
              fillDifference >= 1.12,
              `${tone}: selected vs held fill ${fillDifference.toFixed(2)}:1`,
            );
          } finally {
            await page.mouse.up();
          }
        }
      },
    ]),
  ),
};

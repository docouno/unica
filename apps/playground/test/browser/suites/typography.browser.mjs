import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

const presets = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.1, `${message}: expected ${expected}, got ${actual}`);
}

async function loadFonts(page) {
  await page.evaluate(async () => {
    for (const family of ['Inter Variable', 'JetBrains Mono Variable']) {
      for (const weight of [400, 600]) {
        const faces = await document.fonts.load(`${weight} 16px "${family}"`, 'cache');
        if (
          !faces.some(
            (face) => face.family.replaceAll('"', '') === family && face.status === 'loaded',
          )
        ) {
          throw new Error(`Failed to load ${family} at ${weight}`);
        }
      }
    }
    await document.fonts.ready;
  });
}

function typography(locator) {
  return locator.evaluate((node) => {
    const css = getComputedStyle(node);
    const baseline = node.querySelector('[data-baseline]');
    const box = node.getBoundingClientRect();
    return {
      height: box.height,
      baseline: baseline ? baseline.getBoundingClientRect().top - box.top : null,
      family: css.fontFamily,
      size: Number.parseFloat(css.fontSize),
      weight: css.fontWeight,
      lineHeight: css.lineHeight,
    };
  });
}

function paint(locator) {
  return locator.evaluate((node) => {
    const css = getComputedStyle(node);
    return [css.backgroundColor, css.color, css.borderInlineStartColor];
  });
}

function expectedPaint(locator, tone, contextual) {
  return locator.evaluate(
    (node, { tone, contextual }) => {
      const prefix = tone === 'neutral' ? '--neutral' : `--status-${tone}`;
      const expected = document.createElement('span');
      const base = contextual ? 'transparent' : `var(${prefix}-soft-bg)`;
      expected.style.color = `var(${prefix}-soft-fg)`;
      expected.style.backgroundColor = `color-mix(in srgb, var(${prefix}-soft-fg) 8%, ${base})`;
      expected.style.borderInlineStart = `solid 1px var(${prefix}-border)`;
      node.parentElement.append(expected);
      const computed = getComputedStyle(expected);
      const triplet = [computed.backgroundColor, computed.color, computed.borderInlineStartColor];
      expected.remove();
      return triplet;
    },
    { tone, contextual },
  );
}

async function quoteGeometry(locator) {
  return locator.evaluate((figure) => {
    const body = figure.querySelector(':scope > div');
    const passage = body.querySelector(':scope > blockquote');
    const [start, end] = Array.from(body.children).reduce(
      (slots, node) => {
        const svg = node.querySelector(':scope > svg');
        if (svg) {
          slots[node.compareDocumentPosition(passage) & Node.DOCUMENT_POSITION_FOLLOWING ? 0 : 1] =
            svg.getBoundingClientRect().toJSON();
        }
        return slots;
      },
      [null, null],
    );
    const style = getComputedStyle(figure);
    const figureBox = figure.getBoundingClientRect();
    const rail = getComputedStyle(figure, '::before');
    return {
      width:
        figureBox.width -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight) -
        Number.parseFloat(style.borderLeftWidth) -
        Number.parseFloat(style.borderRightWidth),
      figureHeight: figureBox.height,
      body: body.getBoundingClientRect().toJSON(),
      passage: passage.getBoundingClientRect().toJSON(),
      caption: figure.querySelector(':scope > figcaption').getBoundingClientRect().toJSON(),
      start,
      end,
      gap: getComputedStyle(body).gap,
      rail: {
        width: rail.borderInlineStartWidth,
        style: rail.borderInlineStartStyle,
        inset: rail.insetInlineStart,
        left: rail.borderLeftWidth,
        right: rail.borderRightWidth,
        blockStart: rail.insetBlockStart,
      },
      background: style.backgroundColor,
    };
  });
}

function assertEmptySlotMatches(empty, omitted) {
  for (const key of ['passage', 'caption', 'start', 'end']) {
    if (!omitted[key]) {
      assert.equal(empty[key], null);
      continue;
    }
    for (const metric of ['left', 'width', 'height']) {
      near(empty[key][metric], omitted[key][metric], `${key} ${metric}`);
    }
    near(empty[key].top - empty.body.top, omitted[key].top - omitted.body.top, `${key} top`);
  }
  near(empty.figureHeight, omitted.figureHeight, 'figure height');
}

async function captionContrast(page) {
  const caption = page.getByTestId('surface-quote').locator('figcaption');
  const foreground = await caption.evaluate((node) => {
    const color = getComputedStyle(node).color;
    let opacity = 1;
    for (let parent = node; parent; parent = parent.parentElement) {
      opacity *= +getComputedStyle(parent).opacity;
    }
    if (!node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
      throw new Error('The reference caption is hidden');
    }
    node.style.color = 'transparent';
    return { color, opacity };
  });
  const png = await caption.screenshot({ animations: 'disabled' });
  return page.evaluate(
    async ({ png, color, opacity }) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      const { data: backdrop } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, alpha] = ctx.getImageData(0, 0, 1, 1).data;
      const blend = (opacity * alpha) / 255;
      const weights = [0.2126, 0.7152, 0.0722];
      const luminance = (rgb) =>
        rgb.reduce((sum, value, axis) => {
          const s = value / 255;
          return sum + weights[axis] * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
        }, 0);
      let weakest = Infinity;
      for (let index = 0; index < backdrop.length; index += 4) {
        const bg = backdrop.subarray(index, index + 3);
        const text = [r, g, b].map((channel, axis) => channel * blend + bg[axis] * (1 - blend));
        const backgroundLight = luminance(bg);
        const textLight = luminance(text);
        weakest = Math.min(
          weakest,
          (Math.max(backgroundLight, textLight) + 0.05) /
            (Math.min(backgroundLight, textLight) + 0.05),
        );
      }
      return weakest;
    },
    { png: png.toString('base64'), ...foreground },
  );
}

const scenarios = {
  'Code inherits context from real surfaces without replacing the text color of its host action':
    async ({ page, mount }) => {
      await mount('editorial', { theme: 'frost-light' });
      for (const [id, tone, onSurface] of [
        ['canvas', 'neutral', false],
        ['neutral', 'neutral', false],
        ['alert-quote', 'info', true],
        ['resumed', 'info', true],
        ['card', 'neutral', true],
        ['base-reset', 'neutral', false],
        ['theme-reset', 'neutral', false],
        ['overlay', 'neutral', true],
        ['explicit', 'info', false],
      ]) {
        const code = page.getByTestId(id);
        assert.deepEqual(await paint(code), await expectedPaint(code, tone, onSurface), id);
      }

      for (const id of ['button', 'link']) {
        const host = page.getByTestId(id);
        const plain = host.locator('code');
        assert.equal(
          await plain.evaluate((el) => getComputedStyle(el).color),
          await host.evaluate((el) => getComputedStyle(el).color),
        );
        assert.deepEqual(
          await plain.evaluate((el) => {
            const style = getComputedStyle(el);
            return [style.backgroundColor, style.borderInlineStartWidth, style.paddingInlineStart];
          }),
          ['rgba(0, 0, 0, 0)', '0px', '0px'],
        );
      }
    },

  'A wrapped Code literal preserves selection and clipboard text': async ({ page, mount }) => {
    await mount('editorial', { theme: 'pixel-light' });
    await loadFonts(page);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const literal = page.getByTestId('wrapping');
    await literal.evaluate((el) => el.parentElement.scrollIntoView({ block: 'center' }));
    const { start, end, fragments, width, scrollWidth, decoration } = await literal.evaluate(
      (el) => {
        const text = el.firstChild;
        const range = document.createRange();
        const cursor = (offset, edge) => {
          range.setStart(text, offset);
          range.setEnd(text, offset + 1);
          const { x, y, width, height } = range.getBoundingClientRect();
          return { x: x + width * edge, y: y + height / 2 };
        };
        return {
          start: cursor(0, 0.15),
          end: cursor(text.length - 1, 0.85),
          fragments: el.getClientRects().length,
          width: el.parentElement.clientWidth,
          scrollWidth: el.parentElement.scrollWidth,
          decoration: getComputedStyle(el).boxDecorationBreak,
        };
      },
    );
    assert.ok(fragments >= 3);
    assert.equal(scrollWidth, width);
    assert.equal(decoration, 'slice');

    const original = await literal.textContent();
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 16 });
    await page.mouse.up();
    assert.equal(await page.evaluate(() => getSelection()?.toString()), original);
    await page.keyboard.press('Control+c');
    const destination = page.getByRole('textbox', { name: 'Clipboard destination' });
    await destination.focus();
    await page.keyboard.press('Control+v');
    assert.equal(await destination.inputValue(), original);
  },

  'Blockquote uses its own content width, logical order, and rendered glyphs': async ({
    page,
    mount,
  }) => {
    for (const direction of ['ltr', 'rtl']) {
      await mount('editorial', { theme: 'frost-dark', direction, textScale: 120 });
      const layout = page.getByTestId('quote-layout');
      const quote = page.getByTestId('both');
      for (const narrow of [true, false]) {
        // M figure padding is 24px on each side.
        const extra = narrow ? 0 : 1;
        await layout.evaluate((node, addition) => {
          node.style.width = `calc(20rem + ${48 + addition}px)`;
        }, extra);
        const { width, body, passage, caption, start, end, gap, rail, background } =
          await quoteGeometry(quote);
        near(
          width,
          (await page
            .locator('html')
            .evaluate((node) => 20 * Number.parseFloat(getComputedStyle(node).fontSize))) + extra,
          'content width',
        );
        near(caption.left, passage.left, 'caption left');
        near(caption.right, passage.right, 'caption right');
        near(start.width, 16, 'start glyph size');
        near(end.height, 16, 'end glyph size');
        near(caption.top - body.bottom, 8, 'caption gap');
        assert.deepEqual(rail, {
          width: '2px',
          style: 'solid',
          inset: '0px',
          left: direction === 'ltr' ? '2px' : '0px',
          right: direction === 'rtl' ? '2px' : '0px',
          blockStart: '8px',
        });
        assert.equal(background, 'rgba(0, 0, 0, 0)');

        if (narrow) {
          assert.equal(gap, '8px');
          near(passage.top - start.bottom, 8, 'leading row gap');
          near(end.top - passage.bottom, 8, 'trailing row gap');
          near(passage.width, body.width, 'full text width');
          near(
            start[direction === 'ltr' ? 'left' : 'right'],
            body[direction === 'ltr' ? 'left' : 'right'],
            'start alignment',
          );
          near(
            end[direction === 'ltr' ? 'right' : 'left'],
            body[direction === 'ltr' ? 'right' : 'left'],
            'end alignment',
          );
        } else {
          assert.equal(gap, '12px');
          const lineHeight = await quote
            .locator('blockquote')
            .evaluate((node) => Number.parseFloat(getComputedStyle(node).lineHeight));
          const inset = (lineHeight - 16) / 2;
          near(start.top - passage.top, inset, 'first line alignment');
          near(passage.bottom - end.bottom, inset, 'last line alignment');
          near(
            direction === 'ltr' ? passage.left - start.right : start.left - passage.right,
            12,
            'start column gap',
          );
          near(
            direction === 'ltr' ? end.left - passage.right : passage.left - end.right,
            12,
            'end column gap',
          );
        }

        for (const [empty, omitted] of [
          ['adapter-null', 'end-only'],
          ['component-null', 'start-only'],
        ]) {
          assertEmptySlotMatches(
            await quoteGeometry(page.getByTestId(empty)),
            await quoteGeometry(page.getByTestId(omitted)),
          );
        }
      }
      const nested = await page.getByTestId('inner-quote').evaluate((node) => {
        const css = getComputedStyle(node);
        return [
          css.paddingBlockStart,
          css.paddingInlineEnd,
          getComputedStyle(node, '::before').insetBlockStart,
        ];
      });
      assert.deepEqual(nested, ['4px', '0px', '0px']);
    }
  },

  'Passive roots preserve native link focus, editor inheritance, and form data in forced colors':
    async ({ page, mount }) => {
      await mount('editorial', { forcedColors: 'active', reducedMotion: 'reduce' });
      await page.keyboard.press('Tab');
      await assertFocused(page.getByRole('button', { name: 'Before' }));
      await page.keyboard.press('Tab');
      const source = page.getByRole('link', { name: 'Quoted source' });
      await assertFocused(source);
      const linkStyle = await source.evaluate((node) => {
        const css = getComputedStyle(node);
        return [css.outlineWidth, css.outlineStyle, css.outlineOffset, css.textDecorationLine];
      });
      assert.deepEqual(linkStyle, ['2px', 'solid', '3px', 'underline']);
      await page.keyboard.press('Enter');
      assert.equal(new URL(page.url()).hash, '#source');
      await source.focus();
      await page.keyboard.press('Tab');
      await assertFocused(page.getByRole('button', { name: 'After' }));
      await page.keyboard.press('Tab');
      await assertFocused(page.getByTestId('editor'));
      await page.keyboard.press('Tab');
      await assertFocused(page.locator('input[name="topic"]'));

      for (const [id, editable] of [
        ['passive-code', false],
        ['passive-quote', false],
        ['editor-code', true],
        ['editor-quote', true],
        ['fixed-code', false],
        ['fixed-quote', false],
      ]) {
        assert.equal(
          await page.getByTestId(id).evaluate((node) => node.isContentEditable),
          editable,
          id,
        );
      }
      assert.deepEqual(await page.getByTestId('form').evaluate((node) => [...new FormData(node)]), [
        ['topic', 'Reading'],
      ]);

      const contrast = await page.getByTestId('both').evaluate((node) => {
        const css = getComputedStyle(node);
        const rail = getComputedStyle(node, '::before');
        const body = node.querySelector('blockquote');
        const svg = node.querySelector('svg');
        const caption = node.querySelector('figcaption');
        return [
          rail.borderInlineStartColor,
          getComputedStyle(body).color,
          getComputedStyle(svg).color,
          getComputedStyle(caption).color,
          css.animationName,
          css.transitionDuration,
        ];
      });
      assert.equal(contrast[0], contrast[1]);
      assert.equal(contrast[2], contrast[1]);
      assert.equal(contrast[3], contrast[1]);
      assert.deepEqual(contrast.slice(4), ['none', '0s']);
      assert.deepEqual(
        await page.getByTestId('passive-code').evaluate((node) => {
          const css = getComputedStyle(node);
          return [css.outlineWidth, css.outlineStyle, css.animationName, css.transitionDuration];
        }),
        ['1px', 'solid', 'none', '0s'],
      );
      assert.equal(
        await page
          .getByTestId('button')
          .locator('code')
          .evaluate((el) => getComputedStyle(el).outlineStyle),
        'none',
      );
    },
};

for (const theme of presets) {
  scenarios[`Editorial typography, rail, and caption contrast in ${theme}`] = async ({
    page,
    mount,
  }) => {
    const scaleFactor = theme.startsWith('pixel-') ? 1 : 0.9;
    for (const [textScale, surface] of [
      [100, 'base'],
      [120, 'overlay'],
    ]) {
      await mount('editorial', { theme, surface, textScale });
      await loadFonts(page);
      for (const id of ['heading', 'caption']) {
        const host = page.getByTestId(id);
        const parent = await typography(host);
        const reference = await typography(page.getByTestId(`${id}-reference`));
        const code = await typography(host.locator('code'));
        near(code.size, parent.size * scaleFactor, `${id} scale`);
        near(parent.height, reference.height, `${id} line box`);
        near(parent.baseline, reference.baseline, `${id} baseline`);
        assert.equal(code.weight, parent.weight);
        assert.match(code.family, /JetBrains Mono Variable/);
      }

      for (const size of ['s', 'm', 'l']) {
        const code = await typography(page.getByTestId(`standalone-${size}`));
        const reference = await typography(page.getByTestId(`body-${size}`));
        near(code.size, reference.size * scaleFactor, `standalone ${size} font size`);
        assert.equal(code.lineHeight, reference.lineHeight);
      }

      for (const [id, direction] of [
        ['ltr', 'ltr'],
        ['auto', 'rtl'],
        ['rtl', 'rtl'],
      ]) {
        assert.deepEqual(
          await page.getByTestId(id).evaluate((node) => {
            const css = getComputedStyle(node);
            return [css.direction, css.unicodeBidi];
          }),
          [direction, 'isolate'],
        );
      }
      assert.equal(
        await page.getByTestId('empty-code').evaluate((node) => {
          const css = getComputedStyle(node);
          return (
            css.paddingInlineStart === '0px' &&
            css.borderInlineStartWidth === '0px' &&
            css.backgroundColor === 'rgba(0, 0, 0, 0)'
          );
        }),
        true,
      );
      for (const id of ['empty-quote', 'hidden-code', 'hidden-quote']) {
        assert.equal(await page.getByTestId(id).isVisible(), false);
      }
      const { rail } = await quoteGeometry(page.getByTestId('both'));
      assert.equal(rail.style, theme.startsWith('pixel-') ? 'double' : 'solid');
      assert.equal(rail.width, theme.startsWith('frost-') ? '2px' : '3px');
      const contrast = await captionContrast(page);
      assert.ok(contrast >= 4.5, `${theme} ${surface} caption contrast ${contrast.toFixed(2)}:1`);
    }
  };
}

export default scenarios;

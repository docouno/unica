import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];

// Inter size, JetBrains Mono size, line height (CSS px at 100%).
const metrics = {
  'body-l': [18, 15, 28],
  'body-m': [16, 14, 24],
  'body-s': [14, 12, 20],
  'body-xs': [13, 11, 20],
  'caption-l': [12, 11, 16],
  'caption-m': [11, 10, 16],
  'caption-s': [9, 9, 12],
  'display-l': [60, 52, 72],
  'display-m': [48, 42, 56],
  'display-s': [36, 31, 44],
  'heading-xl': [30, 26, 36],
  'heading-l': [24, 21, 32],
  'heading-m': [20, 17, 28],
  'heading-s': [16, 14, 24],
};
const tracking = {
  'display-l': -1.5,
  'display-m': -1.2,
  'display-s': -0.9,
  'heading-xl': -0.7,
  'heading-l': -0.5,
  'heading-m': -0.3,
  'heading-s': -0.15,
};

function near(actual, expected, label, tolerance = 0.04) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);
}

async function loadedFont(page, family) {
  const faces = await page.evaluate(async (name) => {
    const matches = await Promise.all(
      ['normal', 'italic'].map((style) => document.fonts.load(`${style} 600 16px "${name}"`, 'Aa')),
    );
    await document.fonts.ready;
    return matches.map((faces) =>
      faces.map(({ family, status, style }) => [family, status, style]),
    );
  }, family);
  assert.deepEqual(faces, [[[family, 'loaded', 'normal']], [[family, 'loaded', 'italic']]]);
}

async function layout(locator) {
  return locator.evaluate((node) => {
    const css = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return {
      height: box.height,
      width: node.clientWidth,
      scrollWidth: node.scrollWidth,
      line: parseFloat(css.lineHeight),
      whitespace: css.whiteSpace,
      ellipsis: css.textOverflow,
      overflow: css.overflow,
      display: css.display,
    };
  });
}

function rgba(css) {
  assert.match(css, /^rgba?\(/);
  const [r, g, b, a = 1] = css.match(/[\d.]+/g).map(Number);
  return { channels: [r, g, b], alpha: a };
}

function paintedColor(front, back) {
  return front.channels.map((channel, i) => channel * front.alpha + back[i] * (1 - front.alpha));
}

function luminance(color) {
  return color.reduce((sum, channel, index) => {
    const srgb = channel / 255;
    const linear = srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

export default {
  ...Object.fromEntries(
    themes.map((theme) => [
      `Typography uses scaled line boxes, genuine fonts and readable inks in ${theme}`,
      async ({ page, mount }) => {
        const pixel = theme.startsWith('pixel');
        const family = pixel ? 'JetBrains Mono Variable' : 'Inter Variable';
        for (const textScale of [100, 120]) {
          await mount('typography', { theme, textScale });
          await loadedFont(page, family);
          const scale = textScale / 100;
          const samples = await page
            .locator('[data-text-metric], [data-title-metric]')
            .evaluateAll((nodes) =>
              nodes.map((node) => {
                const css = getComputedStyle(node);
                return {
                  textSize: node.dataset.textMetric,
                  titleSize: node.dataset.titleMetric,
                  family: css.fontFamily.split(',')[0].replaceAll('"', ''),
                  size: parseFloat(css.fontSize),
                  line: parseFloat(css.lineHeight),
                  height: node.getBoundingClientRect().height,
                  tracking: css.letterSpacing,
                  weight: css.fontWeight,
                };
              }),
            );
          assert.equal(samples.length, 15);
          for (const sample of samples) {
            const key = sample.textSize ?? sample.titleSize;
            const [inter, mono, line] = metrics[key];
            assert.equal(sample.family, family);
            near(sample.size, (pixel ? mono : inter) * scale, `${key} font size`);
            near(sample.line, line * scale, `${key} computed line height`);
            near(sample.height, line * scale, `${key} actual line box`);
            assert.equal(sample.weight, sample.titleSize ? '600' : '400');
            if (sample.titleSize && key in tracking) {
              near(parseFloat(sample.tracking), tracking[key] * scale, `${key} tracking`);
            } else {
              assert.equal(sample.tracking, 'normal');
            }
          }
          const clamp = await layout(page.getByTestId('priority'));
          near(clamp.height, 2 * 24 * scale, 'scaled two-line heading');
        }

        const ink = await page.locator('[data-ink-surface]').evaluateAll((nodes) =>
          nodes.map((node) => ({
            surface: node.dataset.inkSurface,
            back: getComputedStyle(node).backgroundColor,
            canvas: getComputedStyle(node.parentElement).backgroundColor,
            roles: [...node.children].map((row) => [
              row.dataset.inkRole,
              ...[...row.children].map((child) => getComputedStyle(child).color),
            ]),
          })),
        );
        for (const { surface, back, canvas, roles } of ink) {
          const bg = paintedColor(rgba(back), rgba(canvas).channels);
          assert.equal(roles.length, 9);
          for (const [role, text, title, token] of roles) {
            assert.equal(text, token, `Text ${role}`);
            assert.equal(title, token, `Title ${role}`);
            const fg = paintedColor(rgba(text), bg);
            const values = [luminance(fg), luminance(bg)].sort((a, b) => a - b);
            const contrast = (values[1] + 0.05) / (values[0] + 0.05);
            assert.ok(
              contrast >= 4.5,
              `${theme}/${surface}/${role} contrast: ${contrast.toFixed(2)}:1`,
            );
          }
        }
        const color = (id) => page.getByTestId(id).evaluate((node) => getComputedStyle(node).color);
        assert.equal(await color('ink-inherit'), await color('ink-owner'));
        assert.equal(await color('heading-inherit'), await color('ink-owner'));
      },
    ]),
  ),

  'Text and Title preserve native label, focus, form, and accessible heading semantics': async ({
    page,
    mount,
  }) => {
    await mount('typography');
    const name = 'Long linked label with a complete accessible name';
    const heading = page.getByRole('heading', {
      level: 2,
      name: 'Editorial heading with a complete accessible name',
    });
    const form = page.getByTestId('native-form');
    assert.equal(await heading.count(), 1);
    await page.keyboard.press('Tab');
    await assertFocused(form.locator('#first'));
    await page.keyboard.press('Tab');
    await assertFocused(form.locator('#second'));
    await page.keyboard.press('Tab');
    await assertFocused(heading.getByRole('link', { name: 'accessible name' }));

    for (const id of ['first', 'second']) {
      const field = form.locator(`[data-field="${id}"]`);
      await field.locator('label').click();
      await assertFocused(field.getByRole('textbox', { name }));
    }
    assert.deepEqual(await form.evaluate((element) => [...new FormData(element)]), [
      ['first', 'first'],
      ['second', 'second'],
    ]);
    const destination = form.getByRole('heading', { name: 'Programmatic destination' });
    await destination.evaluate((node) => node.focus());
    await assertFocused(destination);
    const clamp = page.getByTestId('clamp-1');
    assert.match(await clamp.ariaSnapshot(), /complete record to the next team/);
    assert.equal(await clamp.getAttribute('title'), null);
    assert.equal(await form.locator('label[tabindex]').count(), 0);
  },

  'Typography wraps, clamps, clips and respects hidden through real layout': async ({
    page,
    mount,
  }) => {
    await mount('typography', { theme: 'pixel-light', textScale: 120, direction: 'rtl' });
    const measure = (id) => layout(page.getByTestId(id));
    for (const id of ['block-truncate', 'inline-truncate', 'truncate-title']) {
      const box = await measure(id);
      near(box.height, box.line, id);
      assert.ok(box.scrollWidth > box.width, id);
      assert.equal(box.overflow, 'hidden');
      assert.equal(box.ellipsis, 'ellipsis');
    }
    assert.equal((await measure('inline-truncate')).display, 'inline-block');
    const short = await measure('inline-short');
    assert.equal(short.width, short.scrollWidth);
    assert.ok(short.width < 164);
    for (const id of ['text-default-wrap', 'title-nowrap', 'title-short']) {
      const box = await measure(id);
      near(box.height, box.line, id);
    }
    const wrap = await measure('title-wrap');
    const nowrap = await measure('title-nowrap');
    assert.ok(nowrap.scrollWidth > nowrap.width);
    for (const id of [
      'title-default-wrap',
      'title-wrap',
      'title-pretty',
      'title-balance',
      'long-word',
    ]) {
      const box = await measure(id);
      assert.ok(box.height > box.line, id);
      assert.equal(box.scrollWidth, box.width, id);
    }
    near((await measure('title-default-wrap')).height, wrap.height, 'explicit and default wrap');
    for (const [id, lines] of [
      ['clamp-1', 1],
      ['clamp-2', 2],
      ['clamp-3', 3],
      ['priority', 2],
    ]) {
      const box = await measure(id);
      near(box.height, box.line * lines, id);
      assert.equal(box.whitespace, 'normal');
      assert.equal(box.overflow, 'hidden');
    }
    for (const row of await page.locator('[data-invalid-clamp]').all()) {
      const text = await layout(row.locator('p'));
      const title = await layout(row.locator('h2'));
      near(text.height, text.line, 'invalid clamp falls through to truncate');
      assert.equal(text.ellipsis, 'ellipsis');
      assert.ok(title.height > 3 * title.line, 'invalid clamp allows ordinary wrapping');
    }
    for (const id of ['hidden-truncate', 'hidden-clamp']) {
      assert.equal((await measure(id)).height, 0);
      assert.equal((await measure(id)).display, 'none');
    }
    assert.equal(await page.getByRole('heading', { name: 'Hidden clamped heading' }).count(), 0);
  },

  'Ordinary title wrapping and line clamp override an inherited balance style': async ({
    page,
    mount,
  }) => {
    await mount('typography', { theme: 'pixel-light' });
    await loadedFont(page, 'JetBrains Mono Variable');
    const widths = (id) =>
      page.getByTestId(id).evaluate((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return [...range.getClientRects()].map((line) => line.width);
      });

    const ordinary = await widths('ordinary-wrap-reference');
    assert.ok(ordinary.length > 1);
    assert.notDeepEqual(await widths('explicit-balance'), ordinary);
    assert.deepEqual(await widths('wrap-under-balance'), ordinary);
    assert.deepEqual(await widths('explicit-wrap-under-balance'), ordinary);

    for (const id of ['text-clamp-under-balance', 'title-clamp-under-balance']) {
      const node = page.getByTestId(id);
      assert.equal(await node.evaluate((element) => getComputedStyle(element).textWrap), 'wrap');
      const box = await layout(node);
      near(box.height, box.line, id);
    }
  },

  'Logical alignment, real italics and tabular digits use the requested typography': async ({
    page,
    mount,
  }) => {
    await mount('typography');
    await loadedFont(page, 'Inter Variable');
    for (const direction of ['ltr', 'rtl']) {
      await page.locator('html').evaluate((node, dir) => {
        node.dir = dir;
      }, direction);
      for (const [align, expected] of [
        ['start', direction === 'rtl' ? 'right' : 'left'],
        ['center', 'center'],
        ['end', direction === 'rtl' ? 'left' : 'right'],
        ['inherit', direction === 'rtl' ? 'left' : 'right'],
      ]) {
        const gaps = await page.locator(`[data-align-sample="${align}"] > *`).evaluateAll((nodes) =>
          nodes.map((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const ink = range.getBoundingClientRect();
            const box = node.getBoundingClientRect();
            return [ink.left - box.left, box.right - ink.right];
          }),
        );
        for (const [left, right] of gaps) {
          near(
            expected === 'center' ? left - right : expected === 'left' ? left : right,
            0,
            `${align}/${direction}`,
          );
        }
      }
    }

    for (const [id, expected] of [
      ['italic-text', 'italic'],
      ['upright-em', 'normal'],
      ['italic-context-title', 'italic'],
      ['italic-title', 'italic'],
      ['upright-title', 'normal'],
      ['upright-text', 'normal'],
    ]) {
      assert.equal(
        await page.getByTestId(id).evaluate((node) => getComputedStyle(node).fontStyle),
        expected,
      );
    }

    for (const [id, expected] of [
      ['tabular-text', 'tabular-nums'],
      ['tabular-title', 'tabular-nums'],
      ['inherited-digits', 'tabular-nums'],
      ['auto-digits', 'normal'],
    ]) {
      const probe = await page.getByTestId(id).evaluate((node) => {
        const css = getComputedStyle(node);
        const range = document.createRange();
        range.selectNodeContents(node);
        const first = range.getBoundingClientRect().width;
        node.textContent = node.textContent === '1111' ? '8888' : '1111';
        range.selectNodeContents(node);
        return {
          first,
          second: range.getBoundingClientRect().width,
          variant: css.fontVariantNumeric,
        };
      });
      assert.equal(probe.variant, expected);
      if (expected === 'tabular-nums') {
        near(probe.first, probe.second, id);
      }
    }
  },

  'Typography uses system foregrounds in forced colors and stays static with reduced motion':
    async ({ page, mount }) => {
      await mount('typography', {
        theme: 'frost-dark',
        surface: 'overlay',
        forcedColors: 'active',
        reducedMotion: 'reduce',
      });
      const result = await page.getByTestId('system-link-text').evaluate((text) => {
        const bodyColor = getComputedStyle(text.closest('#fixture')).color;
        const linkColor = getComputedStyle(text.parentElement).color;
        return {
          bodyColor,
          linkColor,
          titleColor: getComputedStyle(
            text.closest('#fixture').querySelector('[data-ink-role="danger"] h3'),
          ).color,
          textColor: getComputedStyle(text).color,
          animations: text.closest('#fixture').getAnimations({ subtree: true }).length,
        };
      });
      assert.equal(result.titleColor, result.bodyColor);
      assert.equal(result.textColor, result.linkColor);
      assert.notEqual(result.linkColor, result.bodyColor);
      assert.equal(result.animations, 0);
    },
};

import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys, submitForm } from '../helpers.mjs';

const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];
const paint = ['backgroundColor', 'borderTopColor', 'boxShadow', 'backdropFilter'];

function readStyle(locator, ...keys) {
  return locator.evaluate((node, properties) => {
    const style = getComputedStyle(node);
    return properties.map((property) => style[property]);
  }, keys);
}

function referenceStyle(locator, values) {
  return locator.evaluate((node, properties) => {
    const probe = document.createElement('span');
    Object.assign(probe.style, { border: '1px solid transparent', ...properties });
    node.append(probe);
    const style = getComputedStyle(probe);
    const result = Object.keys(properties).map((property) => style[property]);
    probe.remove();
    return result;
  }, values);
}

function backgroundPixel(locator) {
  return locator.evaluate((node) => {
    const context = new OffscreenCanvas(1, 1).getContext('2d');
    context.fillStyle = getComputedStyle(node).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
  });
}

function near(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) <= 0.2, `${label}: got ${actual}, expected ${expected}`);
}

async function pixelContrast(page, png, foreground) {
  return page.evaluate(
    async ({ png, foreground }) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      const image = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      const pixel = (index) => Array.from(image.data.subarray(index, index + 3));
      const luminance = (channels) =>
        channels.reduce((sum, byte, axis) => {
          const value = byte / 255;
          return (
            sum +
            [0.2126, 0.7152, 0.0722][axis] *
              (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
          );
        }, 0);
      let weakest = { ratio: Infinity };
      function compare(ink, background) {
        const a = luminance(ink);
        const b = luminance(background);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (ratio < weakest.ratio) {
          weakest = { ratio, ink, background };
        }
      }

      if (foreground) {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = foreground.color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, alpha] = ctx.getImageData(0, 0, 1, 1).data;
        const opacity = (alpha / 255) * foreground.opacity;
        for (let index = 0; index < image.data.length; index += 4) {
          const background = pixel(index);
          compare(
            [r, g, b].map((value, axis) => value * opacity + background[axis] * (1 - opacity)),
            background,
          );
        }
      } else {
        // Outline occupies rows 2 and 3; the two adjoining rows sample the stage.
        for (let x = 0; x < bitmap.width; x++) {
          const sample = (y) => pixel(4 * (x + y * bitmap.width));
          compare(sample(2), sample(1));
          compare(sample(3), sample(4));
        }
      }
      return weakest;
    },
    { png: png.toString('base64'), foreground },
  );
}

async function assertTextContrast(page, text, context) {
  const foreground = await text.evaluate((node) => {
    const color = getComputedStyle(node).color;
    let opacity = 1;
    for (let parent = node; parent; parent = parent.parentElement) {
      opacity *= Number(getComputedStyle(parent).opacity);
    }
    assertVisible(node);
    node.style.color = 'transparent';
    return { color, opacity };

    function assertVisible(element) {
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
        throw new Error('Expected a visible text sample');
      }
    }
  });
  const png = await text.screenshot({ animations: 'disabled' });
  await text.evaluate((node) => node.style.removeProperty('color'));
  const result = await pixelContrast(page, png, foreground);
  assert.ok(
    result.ratio >= 4.5,
    `${context} ${await text.textContent()}: ${JSON.stringify(result)}`,
  );
}

async function assertFocusContrast(page, link, context) {
  await link.scrollIntoViewIfNeeded();
  const box = await getBox(link);
  const png = await page.screenshot({
    clip: {
      x: Math.round(box.x + box.width / 2) - 20,
      y: Math.round(box.y) - 6,
      width: 40,
      height: 7,
    },
    animations: 'disabled',
  });
  const result = await pixelContrast(page, png);
  assert.ok(result.ratio >= 3, `${context} focus: ${JSON.stringify(result)}`);
}

function materialScenarios() {
  const entries = [];
  for (const theme of themes) {
    for (const surface of ['base', 'overlay']) {
      const context = `${theme} on ${surface}`;
      entries.push([
        `Card material and painted text meet the contract in ${context}`,
        async ({ page, mount }) => {
          await mount('card', { theme, surface });
          const normal = page.getByTestId('default');
          const subtle = page.getByTestId('restricted');
          const link = page.getByRole('link', { name: 'Field guide', exact: true });
          const painted = page.getByTestId('painted-surface');
          const defaultRef = await referenceStyle(painted, {
            backgroundColor: 'var(--card-bg)',
            borderTopColor: 'var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          });
          const subtleRef = await referenceStyle(painted, {
            backgroundColor: 'var(--card-bg-subtle)',
            borderTopColor: 'var(--card-border-subtle)',
          });
          assert.deepEqual(await readStyle(normal, ...paint), [...defaultRef, 'none']);
          assert.deepEqual(await readStyle(subtle, ...paint), [...subtleRef, 'none', 'none']);
          assert.deepEqual(await readStyle(normal, 'opacity', 'borderTopLeftRadius'), [
            '1',
            theme.startsWith('pixel') ? '0px' : '12px',
          ]);
          const [mark] = await normal.evaluate((node) => [
            getComputedStyle(node, '::after').backgroundImage,
          ]);
          if (theme.startsWith('pixel')) {
            assert.notEqual(mark, 'none');
          }
          assert.equal(
            await subtle.evaluate((node) => getComputedStyle(node, '::after').content),
            'none',
          );
          if (surface === 'overlay') {
            assert.equal(defaultRef[2], 'none');
            assert.equal(/^rgba\(/.test(defaultRef[0]), theme.startsWith('frost'));
            assert.equal(/^rgba\(/.test(subtleRef[0]), theme.startsWith('frost'));
            assert.equal(
              (await readStyle(painted, 'backdropFilter'))[0] !== 'none',
              theme.startsWith('frost'),
            );
          }

          for (const sample of [normal.locator('h3'), normal.locator('p'), subtle.locator('p')]) {
            await assertTextContrast(page, sample, context);
          }
          await pressKeys(page, 'Tab');
          await assertFocused(link);
          assert.deepEqual(await readStyle(link, 'outlineWidth', 'outlineOffset'), ['2px', '2px']);
          await assertFocusContrast(page, link, context);
        },
      ]);
    }
  }
  return Object.fromEntries(entries);
}

function layoutGeometry(wrapper) {
  return wrapper.evaluate((node) => {
    const bounds = (selector) => node.querySelector(selector).getBoundingClientRect().toJSON();
    const section = node.querySelector('[data-section]');
    const style = section && getComputedStyle(section);
    return {
      card: bounds('[data-layout]'),
      frame: bounds('[data-frame]'),
      body: bounds('[data-body]'),
      section: section?.getBoundingClientRect().toJSON(),
      divider: style && [
        style.borderInlineEndWidth,
        style.borderBlockEndWidth,
        style.borderStartStartRadius,
        style.borderStartEndRadius,
        style.borderEndStartRadius,
      ],
    };
  });
}

async function assertColumns(wrapper, direction) {
  const { card, body, frame, section, divider } = await layoutGeometry(wrapper);
  const media = section ?? frame;
  const leading =
    direction === 'rtl' ? card.x + card.width - (media.x + media.width) : media.x - card.x;
  const gap = direction === 'rtl' ? media.x - body.x - body.width : body.x - media.x - media.width;
  near(leading, section ? 1 : 17, 'media leading inset');
  near(gap, 16, 'inline gap');
  near(body.width, 2 * (media.width - (section ? 16 : 0)), '1:2 content tracks');
  if (divider) {
    assert.deepEqual(divider, ['1px', '0px', '11px', '0px', '11px']);
  }
  return { frame, body };
}

async function assertStacked(wrapper) {
  const { body, frame, section, divider } = await layoutGeometry(wrapper);
  const media = section ?? frame;
  near(body.y - media.y - media.height, 16, 'stacked media gap');
  near(frame.width / frame.height, 4 / 3, 'stacked aspect ratio');
  if (divider) {
    assert.deepEqual(divider, ['0px', '1px', '11px', '11px', '0px']);
  }
}

async function assertNarrowGeometry(page, theme, direction) {
  for (const [size, inset, radius] of [
    ['s', 12, 10],
    ['m', 16, 12],
    ['l', 24, 16],
  ]) {
    const card = page.getByTestId(`geometry-${size}`);
    const { bounds, first, second, middle, last, heading, action, body, radii } =
      await card.evaluate((node) => {
        const box = (element) => element.getBoundingClientRect().toJSON();
        const part = (selector) => box(node.querySelector(selector));
        const frames = [...node.querySelectorAll('[data-frame]')];
        return {
          bounds: box(node),
          first: part('[data-first]'),
          second: box(frames[1]),
          middle: part('[data-middle]'),
          last: part('[data-last]'),
          heading: part('[data-heading]'),
          action: part('[data-heading] button'),
          body: part('[data-body]'),
          radii: frames.map((frame) => {
            const style = getComputedStyle(frame);
            return [style.borderStartStartRadius, style.borderEndStartRadius];
          }),
        };
      });
    near(first.x, bounds.x + 1, 'flush inline');
    near(first.y, bounds.y + 1, 'flush block');
    near(last.y + last.height, bounds.y + bounds.height - 1, 'bottom flush');
    near(second.y - first.y - first.height, inset, 'adjacent media');
    near(heading.y - second.y - second.height, inset, 'media after');
    near(middle.y - heading.y - heading.height, inset, 'middle media before');
    near(body.y - middle.y - middle.height, inset, 'middle media after');
    near(action.y, heading.y, 'action top');
    near(
      direction === 'rtl' ? action.x - bounds.x : bounds.x + bounds.width - action.x - action.width,
      inset + 1,
      'action inline-end',
    );
    near(action.width, 30, 'precision target width');
    near(action.height, 30, 'precision target height');
    assert.ok(bounds.width <= 360);
    const edge = theme.startsWith('pixel') ? '0px' : `${radius - 1}px`;
    const inner = theme.startsWith('pixel') ? '0px' : '4px';
    assert.deepEqual(radii, [
      [edge, '0px'],
      [inner, inner],
      ['0px', '0px'],
      ['0px', edge],
    ]);
  }
  const only = page.getByTestId('only-section').locator('[data-frame]');
  assert.deepEqual(
    await readStyle(
      only,
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomLeftRadius',
      'borderBottomRightRadius',
    ),
    Array(4).fill(theme.startsWith('pixel') ? '0px' : '11px'),
  );
  assert.ok((await getBox(page.getByTestId('intrinsic-card'))).width > 80);
}

export default {
  ...materialScenarios(),

  'Card responds to its own 28rem and restores tracks when media returns in LTR or RTL': async ({
    page,
    mount,
  }) => {
    for (const direction of ['ltr', 'rtl']) {
      await mount('card', { direction, textScale: direction === 'rtl' ? 120 : 100 });
      const wrappers = ['direct', 'section'].map((key) => page.getByTestId(`geometry-${key}`));
      for (const wrapper of wrappers) {
        await wrapper.evaluate((node) => {
          node.style.inlineSize = 'calc(28rem + 33px)';
        });
        await assertStacked(wrapper);
        await wrapper.evaluate((node) => {
          node.style.inlineSize = 'calc(28rem + 34px)';
        });
        await assertColumns(wrapper, direction);
        await wrapper.evaluate((node) => {
          node.style.inlineSize = 'calc(28rem + 58px)';
        });
        await assertColumns(wrapper, direction);
      }
      const toggle = page.getByRole('button', { name: 'Toggle media' });
      await toggle.click();
      for (const wrapper of wrappers) {
        const card = await getBox(wrapper.locator('[data-layout]'));
        const body = await getBox(wrapper.locator('[data-body]'));
        near(body.x - card.x, 17, 'full-width Body start');
        near(body.width, card.width - 34, 'full-width Body');
      }
      await toggle.click();
      const before = await Promise.all(
        wrappers.map((wrapper) => assertColumns(wrapper, direction)),
      );
      const failure = page.getByRole('button', { name: 'Toggle image failure' });
      await failure.click();
      for (const [index, wrapper] of wrappers.entries()) {
        const { frame, body } = await assertColumns(wrapper, direction);
        near(frame.height, before[index].frame.height, 'failure frame height');
        near(body.width, before[index].body.width, 'failure body width');
      }
      await failure.click();
      for (const wrapper of wrappers) {
        await assertColumns(wrapper, direction);
      }
    }
  },

  ...Object.fromEntries(
    [
      ['soft-dark', 'base', 'ltr'],
      ['frost-light', 'overlay', 'rtl'],
      ['pixel-dark', 'overlay', 'rtl'],
    ].map(([theme, surface, direction]) => [
      `Card preserves flush corners, media rhythm and header targets at 360px in ${theme}`,
      async ({ page, mount }) => {
        await page.setViewportSize({ width: 360, height: 740 });
        await mount('card', { theme, surface, direction, textScale: 120 });
        await assertNarrowGeometry(page, theme, direction);
      },
    ]),
  ),

  'Card honors native hidden and fragment reveal': async ({ page, mount }) => {
    await mount('card');
    assert.deepEqual(await readStyle(page.getByTestId('hidden-card'), 'display'), ['none']);
    const reveal = page.getByTestId('reveal-card');
    await reveal.evaluate((node) => {
      node.setAttribute('hidden', 'until-found');
    });
    assert.deepEqual(await readStyle(reveal, 'display', 'contentVisibility'), ['block', 'hidden']);
    await page.evaluate(() => {
      location.hash = 'reveal-card';
    });
    await page.waitForFunction(
      () => !document.getElementById('reveal-card').hasAttribute('hidden'),
    );
    assert.deepEqual(await readStyle(reveal, 'display', 'contentVisibility'), ['flex', 'visible']);
  },

  'CardMedia keeps natural proportions for computed auto ratios and honors hidden media': async ({
    page,
    mount,
  }) => {
    await mount('card');
    const card = page.getByTestId('natural-media');
    const heading = await getBox(card.getByRole('heading'));
    const frames = await card.locator('[data-natural]').all();
    for (const frame of frames) {
      const box = await getBox(frame);
      near(box.height, (box.width * 405) / 720, 'natural height');
      const image = await getBox(frame.locator('img'));
      near(image.height, box.height, 'image fills its frame');
    }
    near(
      (await getBox(frames[0])).y - heading.y - heading.height,
      16,
      'hidden media does not erase the next visible inset',
    );
    assert.deepEqual(await readStyle(card.locator('[data-hidden-image] img'), 'display'), ['none']);
  },

  'Card clears contextual ink without breaking nested material, dividers or sticky headers':
    async ({ page, mount }) => {
      await mount('card', { theme: 'frost-dark', surface: 'overlay' });
      const nested = page.getByTestId('nested');
      const neutral = page.getByTestId('sibling-card');
      const base = page.getByTestId('base-card');
      const theme = page.getByTestId('theme-card');
      for (const suffix of ['card', 'nested', 'sibling']) {
        const link = page.getByTestId(`link-${suffix}`);
        const code = page.getByTestId(`code-${suffix}`);
        assert.deepEqual(
          await readStyle(link, 'color'),
          await readStyle(page.getByTestId('link-sibling'), 'color'),
        );
        assert.deepEqual(
          await readStyle(code, 'backgroundColor', 'color', 'borderTopColor'),
          await readStyle(
            page.getByTestId('code-sibling'),
            'backgroundColor',
            'color',
            'borderTopColor',
          ),
        );
      }
      assert.notDeepEqual(
        await readStyle(page.getByTestId('link-alert'), 'color'),
        await readStyle(page.getByTestId('link-card'), 'color'),
      );
      assert.notDeepEqual(
        await readStyle(page.getByTestId('code-alert'), 'backgroundColor', 'color'),
        await readStyle(page.getByTestId('code-card'), 'backgroundColor', 'color'),
      );
      const divider = (key) => page.getByTestId(`divider-${key}`).locator('hr');
      assert.deepEqual(
        await readStyle(divider('nested'), 'borderTopColor'),
        await readStyle(divider('sibling'), 'borderTopColor'),
      );
      assert.notDeepEqual(
        await readStyle(divider('nested'), 'borderTopColor'),
        await readStyle(divider('base'), 'borderTopColor'),
      );
      for (const locator of [base, theme]) {
        assert.match((await readStyle(locator, 'backgroundColor'))[0], /^rgb\(/);
      }
      assert.match((await readStyle(neutral, 'backgroundColor'))[0], /^rgba\(/);
      const head = (key) => page.getByTestId(`table-${key}`).locator('thead');
      const [overlayHeader] = await referenceStyle(neutral, {
        backgroundColor: 'var(--_table-overlay-header-bg)',
      });
      for (const key of ['subtle', 'default']) {
        assert.deepEqual(await readStyle(head(key), 'backgroundColor', 'position'), [
          overlayHeader,
          'sticky',
        ]);
      }
      await page.getByTestId('contexts').evaluate((node) => {
        node.dataset.surface = 'base';
      });
      assert.deepEqual(await backgroundPixel(head('subtle')), await backgroundPixel(nested));
      assert.deepEqual(await backgroundPixel(head('default')), await backgroundPixel(neutral));

      const table = page.getByTestId('table-default');
      await table.evaluate((node) => {
        node.parentElement.dataset.theme = 'soft-light';
      });
      const inTheme = await readStyle(head('default'), 'backgroundColor');
      const local = await referenceStyle(table, {
        backgroundColor: 'color-mix(in srgb, var(--card-bg) 100%, var(--card-bg-subtle))',
      });
      assert.deepEqual(inTheme, local);
      assert.notDeepEqual(await backgroundPixel(head('default')), await backgroundPixel(neutral));
    },

  'Card navigates as one native target by pointer and keyboard': async ({ page, mount }) => {
    await mount('card', { theme: 'frost-dark', surface: 'overlay' });
    const whole = page.getByRole('link', { name: 'Field guide', exact: true });
    const title = whole.getByRole('heading');
    const destination = page.locator('#guide');
    await pressKeys(page, 'Tab');
    await assertFocused(whole);
    await pressKeys(page, 'Space');
    assert.equal(new URL(page.url()).hash, '');
    await whole.hover();
    await page.waitForFunction(() => {
      const card = getComputedStyle(document.querySelector('[data-testid="whole-link"]'));
      const reference = getComputedStyle(document.querySelector('[data-testid="hover-reference"]'));
      return (
        card.backgroundColor === reference.backgroundColor &&
        card.borderTopColor === reference.borderTopColor
      );
    });
    assert.deepEqual(
      await readStyle(whole, ...paint.slice(0, 2)),
      await readStyle(page.getByTestId('hover-reference'), ...paint.slice(0, 2)),
    );
    assert.deepEqual(await readStyle(title, 'textDecorationLine'), ['underline']);
    await page.mouse.down();
    await page.waitForFunction(() => {
      const card = getComputedStyle(document.querySelector('[data-testid="whole-link"]'));
      const reference = getComputedStyle(document.querySelector('[data-testid="press-reference"]'));
      return (
        card.backgroundColor === reference.backgroundColor &&
        card.borderTopColor === reference.borderTopColor &&
        card.boxShadow === 'none'
      );
    });
    assert.deepEqual(await readStyle(whole, ...paint.slice(0, 3)), [
      ...(await readStyle(page.getByTestId('press-reference'), ...paint.slice(0, 2))),
      'none',
    ]);
    if (await whole.evaluate((node) => node.matches(':focus-visible'))) {
      assert.deepEqual(await readStyle(whole, 'outlineWidth'), ['2px']);
    }
    await page.mouse.up();
    await page.waitForURL('**#guide');
    await assertFocused(destination);

    const clearDestination = () =>
      page.evaluate(() => {
        history.replaceState(null, '', location.pathname + location.search);
      });
    await clearDestination();
    await whole.focus();
    await pressKeys(page, 'Enter');
    await page.waitForURL('**#guide');
    await assertFocused(destination);

    await clearDestination();
    await whole.getByText('Read the guide →').click({ position: { x: 10, y: 7 } });
    await page.waitForURL('**#guide');

    await clearDestination();
    await whole.evaluate((node) => {
      node.ownerDocument.addEventListener(
        'click',
        (event) => {
          node.dataset.modified = String(event.ctrlKey && !event.defaultPrevented);
        },
        { once: true },
      );
    });
    await whole.click({ modifiers: ['Control'] });
    assert.equal(await whole.getAttribute('data-modified'), 'true');
    assert.equal(new URL(page.url()).hash, '');
  },

  'Card keeps rich actions, selection and native form state independent': async ({
    page,
    mount,
  }) => {
    await mount('card', { theme: 'frost-dark', surface: 'overlay' });
    const whole = page.getByRole('link', { name: 'Field guide', exact: true });
    const rich = page.getByTestId('rich');
    const titleLink = rich.getByRole('link', { name: 'Technical notes' });
    const save = rich.getByRole('button', { name: 'Save notes' });
    const select = rich.getByRole('checkbox');
    const form = page.getByRole('form', { name: 'Export form' });
    await whole.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(page.getByRole('button', { name: 'Request access' }));
    await pressKeys(page, 'Tab');
    await assertFocused(titleLink);
    assert.deepEqual(
      await readStyle(titleLink, 'textDecorationLine', 'outlineWidth', 'outlineOffset'),
      ['underline', '2px', '2px'],
    );
    const rest = await readStyle(rich, ...paint);
    await pressKeys(page, 'Tab', 'Space');
    await assertFocused(save);
    assert.equal(await save.getAttribute('aria-pressed'), 'true');
    await pressKeys(page, 'Tab', 'Space');
    await assertFocused(select);
    assert.equal(await select.isChecked(), true);
    assert.deepEqual(await submitForm(form, rich.getByRole('button', { name: 'Export' })), [
      ['include', 'notes'],
      ['action', 'export'],
    ]);
    await rich.getByRole('button', { name: 'Reset' }).click();
    assert.equal(await select.isChecked(), false);
    assert.equal(new URL(page.url()).hash, '');
    assert.deepEqual(await readStyle(rich, ...paint), rest);

    const copy = page.getByTestId('copy');
    await copy.scrollIntoViewIfNeeded();
    const box = await getBox(copy);
    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 140, box.y + box.height / 2, { steps: 12 });
    await page.mouse.up();
    assert.match(await page.evaluate(() => getSelection().toString()), /Select and copy/);
  },

  'Card uses system edges and keeps independent focus in forced colors and reduced motion': async ({
    page,
    mount,
  }) => {
    await mount('card', { forcedColors: 'active', reducedMotion: 'reduce' });
    const surface = page.getByTestId('painted-surface');
    const link = page.getByRole('link', { name: 'Field guide', exact: true });
    const normal = page.getByTestId('default');
    const restricted = page.getByTestId('restricted');
    assert.deepEqual(await readStyle(link, 'transitionDuration', 'transitionProperty'), [
      '0s',
      'none',
    ]);
    assert.deepEqual(await readStyle(normal, 'backgroundColor', 'borderTopColor', 'boxShadow'), [
      ...(await referenceStyle(surface, {
        backgroundColor: 'Canvas',
        borderTopColor: 'CanvasText',
      })),
      'none',
    ]);
    assert.deepEqual(await readStyle(restricted, 'borderTopStyle', 'borderTopColor'), [
      'dashed',
      ...(await referenceStyle(surface, {
        borderTopColor: 'GrayText',
        forcedColorAdjust: 'none',
      }).then(([color]) => [color])),
    ]);
    await pressKeys(page, 'Tab');
    await assertFocused(link);
    assert.deepEqual(await readStyle(link, 'outlineWidth', 'outlineOffset', 'outlineColor'), [
      '1px',
      '2px',
      ...(await referenceStyle(surface, { outlineColor: 'ButtonText' })),
    ]);
    await pressKeys(page, 'Tab', 'Tab', 'Tab', 'Tab');
    const select = page.getByRole('checkbox', { name: 'Include notes' });
    await assertFocused(select);
    assert.deepEqual(await readStyle(select, 'forcedColorAdjust'), ['auto']);
  },

  'Card diagnoses a mounted title with visible markup but no visible text in development': async ({
    page,
    mount,
  }) => {
    const warnings = [];
    page.on('console', (message) => {
      if (
        message.type() === 'warning' &&
        message.text().includes('visible, uniquely identified CardTitle')
      ) {
        warnings.push(message.text());
      }
    });
    await mount('card-diagnostics');
    const link = page.getByRole('link', { name: 'Field guide', exact: true });
    await link.waitFor();
    assert.equal(warnings.length, 0);
    await page.getByRole('button', { name: 'Hide title text' }).click();
    await page.waitForFunction(() => !document.querySelector('h3').innerText.trim());
    assert.equal(warnings.length, 1);
  },

  'Card diagnoses a hidden title when a native popover reveals its anchor': async ({
    page,
    mount,
  }) => {
    const warnings = [];
    page.on('console', (message) => {
      if (
        message.type() === 'warning' &&
        message.text().includes('visible, uniquely identified CardTitle')
      ) {
        warnings.push(message.text());
      }
    });
    await mount('card-diagnostics');
    assert.equal(warnings.length, 0);
    await page.getByText('Read related material').click();
    await page.getByRole('link', { name: 'Related guide', exact: true }).waitFor();
    assert.equal(warnings.length, 0);
    await page.getByRole('button', { name: 'Show reference popup' }).click();
    const popup = page.getByTestId('reference-popup');
    await popup.waitFor();
    await popup.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(warnings.length, 1);
  },

  'Card respects native popover visibility and tab order on its own hosts and parts': async ({
    page,
    mount,
  }) => {
    await mount('card-diagnostics');
    const popoverLink = page.getByTestId('anchor-popover');
    await pressKeys(page, 'Tab', 'Tab');
    await assertFocused(page.getByRole('link', { name: 'Field guide', exact: true }));
    await pressKeys(page, 'Tab');
    await assertFocused(page.getByText('Read related material', { exact: true }));
    for (const [testId, display] of [
      ['card-popover', 'grid'],
      ['anchor-popover', 'flex'],
      ['title-popover', null],
    ]) {
      const popover = page.getByTestId(testId);
      assert.deepEqual(await readStyle(popover, 'display'), ['none']);
      await popover.evaluate((node) => {
        node.showPopover();
      });
      assert.equal(await popover.evaluate((node) => node.matches(':popover-open')), true);
      if (display) {
        assert.deepEqual(await readStyle(popover, 'display'), [display]);
      } else {
        assert.equal(await popover.isVisible(), true);
      }
      if (testId === 'anchor-popover') {
        await popoverLink.focus();
        await assertFocused(popoverLink);
      }
      await popover.evaluate((node) => {
        node.hidePopover();
      });
      assert.deepEqual(await readStyle(popover, 'display'), ['none']);
    }
  },

  'Card keeps native popover parts outside the horizontal layout in all states': async ({
    page,
    mount,
  }) => {
    await mount('card-diagnostics');
    for (const variant of ['direct-media', 'section', 'wrapped-media', 'body']) {
      const card = page.getByTestId(`popover-${variant}`);
      const popup = card.locator('[popover]');
      const content = card.locator('[data-flowing]');
      const measure = async () => {
        const outer = await getBox(card);
        const inner = await getBox(content);
        near(inner.width, outer.width - 34, `${variant} flow width`);
        near(inner.x - outer.x, 17, `${variant} flow inset`);
      };
      await measure();
      await popup.evaluate((node) => {
        node.showPopover();
      });
      assert.equal(await popup.isVisible(), true);
      await measure();
      await popup.evaluate((node) => {
        node.hidePopover();
      });
      assert.equal(await popup.isVisible(), false);
      await measure();
    }
  },

  'Card hydration preserves both native nodes, their exact AX names and the focused link': async ({
    page,
    mount,
    renderFixture,
  }) => {
    await mount('card-hydration');
    const container = page.getByTestId('ssr-cards');
    const html = await renderFixture('card-ssr');
    const before = await container.evaluateHandle((node, markup) => {
      node.innerHTML = markup;
      const links = [...node.querySelectorAll('a')];
      links[0].focus();
      return { links, ids: links.map((link) => link.getAttribute('aria-labelledby')) };
    }, html);
    for (const title of ['First guide', 'Second guide']) {
      assert.equal(await page.getByRole('link', { name: title, exact: true }).count(), 1);
    }
    const first = page.getByRole('link', { name: 'First guide', exact: true });
    await assertFocused(first);
    await page.getByRole('button', { name: 'Hydrate cards' }).evaluate((button) => button.click());
    await container.locator('a[data-hydrated]').last().waitFor();
    const unchanged = await before.evaluate(
      ({ links, ids }) =>
        ids[0] !== ids[1] &&
        links.every(
          (link, index) =>
            link.isConnected &&
            link.dataset.hydrated === 'true' &&
            link.getAttribute('aria-labelledby') === ids[index],
        ),
    );
    assert.equal(unchanged, true);
    await before.dispose();
    await assertFocused(first);
    assert.equal(await page.getByTestId('hydration-errors').textContent(), '');
    await pressKeys(page, 'Tab');
    await assertFocused(page.getByRole('link', { name: 'Second guide', exact: true }));
    await pressKeys(page, 'Enter');
    await page.waitForURL('**#guide');
    await assertFocused(container.locator('#guide'));
  },
};

import assert from 'node:assert/strict';
import { assertBox, assertFocused, assertHitTarget, getBox } from '../helpers.mjs';

const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];

function closeTo(actual, expected, context, tolerance = 0.1) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${context}: ${actual} ≈ ${expected}`);
}

function measureLines(page) {
  return page.locator('[data-metric]').evaluateAll((rows) => {
    function box(node) {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    }
    return rows.map((row) => {
      const [content, beside, below] = row.children;
      const rowBox = box(row);
      return {
        key: row.dataset.metric,
        content: box(content),
        besideOffset: box(beside).x - rowBox.x,
        belowOffset: box(below).y - rowBox.y,
        overflow: content.scrollWidth > content.clientWidth,
        lines: [...content.children].map((line) => ({
          line: box(line),
          bar: box(line.firstChild),
        })),
      };
    });
  });
}

async function checkMetrics(page, direction) {
  const before = await measureLines(page);
  assert.equal(before.length, 26);
  // Use the actual ready Text/Title elements for independent font sizes and line boxes.
  await page.getByRole('button', { name: 'Show text' }).click();
  await page.locator('[data-ready="true"]').waitFor();
  const ready = await page.locator('[data-metric]').evaluateAll((rows) =>
    rows.map((row) => {
      const [content, beside, below] = row.children;
      const style = getComputedStyle(content);
      const rowBox = row.getBoundingClientRect();
      return {
        height: content.getBoundingClientRect().height,
        fontSize: parseFloat(style.fontSize),
        lineHeight: parseFloat(style.lineHeight),
        besideOffset: beside.getBoundingClientRect().x - rowBox.x,
        belowOffset: below.getBoundingClientRect().y - rowBox.y,
        overflow: content.scrollWidth > content.clientWidth,
      };
    }),
  );
  for (const [
    index,
    { key, content, besideOffset, belowOffset, overflow, lines },
  ] of before.entries()) {
    const after = ready[index];
    assert.equal(overflow || after.overflow, false, key);
    closeTo(content.height, after.height, `${key} replacement height`);
    closeTo(besideOffset, after.besideOffset, `${key} inline neighbor`);
    closeTo(belowOffset, after.belowOffset, `${key} following neighbor`);
    assert.equal(lines.length, Number(key.split('/')[1]));
    for (const [lineIndex, { line, bar }] of lines.entries()) {
      const short = lines.length > 1 && lineIndex === lines.length - 1;
      closeTo(line.height, after.lineHeight, `${key} line box`);
      closeTo(bar.height, 0.72 * after.fontSize, `${key} bar height`);
      closeTo(bar.y + bar.height / 2, line.y + line.height / 2, `${key} vertical centering`);
      closeTo(bar.width, content.width * (short ? 0.6 : 1), `${key} bar width`);
      const inlineStart = (bounds) => (direction === 'rtl' ? bounds.x + bounds.width : bounds.x);
      closeTo(inlineStart(bar), inlineStart(content), `${key} inline start`);
    }
  }
}

async function surfacePixels(page) {
  const surfaces = page.getByTestId('surfaces');
  const screenshot = await surfaces.screenshot();
  return surfaces.evaluate(
    async (element, bytes) => {
      const bitmap = await createImageBitmap(
        new Blob([Uint8Array.from(bytes)], { type: 'image/png' }),
      );
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0);
      const origin = element.getBoundingClientRect();
      function sample(node, edge = false) {
        const { x, y, width, height } = node.getBoundingClientRect();
        const offsetX = Math.floor(x - origin.x + (edge ? -2 : width / 2));
        const offsetY = Math.floor(y - origin.y + height / 2);
        return [...context.getImageData(offsetX, offsetY, 1, 1).data].slice(0, 3);
      }

      return Array.from(element.querySelectorAll('[data-test-surface]'), (surface) => {
        const swatches = Object.fromEntries(
          Array.from(surface.querySelectorAll('[data-sample]'), (node) => [
            node.dataset.sample,
            sample(node),
          ]),
        );
        const statusColor = getComputedStyle(surface.querySelector('[role="status"]')).color;
        context.fillStyle = statusColor;
        context.fillRect(0, 0, 1, 1);
        return {
          name: surface.dataset.testSurface,
          ...swatches,
          status: [...context.getImageData(0, 0, 1, 1).data].slice(0, 3),
          beside: sample(surface.querySelector('[data-sample="actual"]'), true),
        };
      });
    },
    [...screenshot],
  );
}

function luminance(color) {
  const linear = color.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function paints(page) {
  return page
    .locator('[data-testid="motion"], [data-testid="motion-text"] > span > span')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        const sweep = getComputedStyle(node, '::after');
        return {
          fill: style.backgroundColor,
          outline: style.outlineColor,
          width: style.outlineWidth,
          offset: style.outlineOffset,
          content: sweep.content,
          animation: sweep.animationName,
          box: node.getBoundingClientRect().toJSON(),
        };
      }),
    );
}

const scenarios = {};

for (const theme of themes) {
  scenarios[`SkeletonText matches all 13 Text/Title steps in ${theme} at 100% and 120% RTL`] =
    async ({ page, mount }) => {
      await mount('skeleton-metrics', { theme });
      await checkMetrics(page, 'ltr');
      await page.setViewportSize({ width: 360, height: 640 });
      await mount('skeleton-metrics', { theme, textScale: 120, direction: 'rtl' });
      await checkMetrics(page, 'rtl');
    };

  scenarios[`Skeleton neutral fill and readable status on Canvas, Card and Overlay in ${theme}`] =
    async ({ page, mount }) => {
      await mount('skeleton', { theme, reducedMotion: 'reduce' });
      const pixels = await surfacePixels(page);
      assert.deepEqual(
        pixels.map(({ name }) => name),
        ['canvas', 'card', 'overlay'],
      );
      for (const { name, actual, expected, background, beside, status } of pixels) {
        for (let channel = 0; channel < 3; channel += 1) {
          closeTo(actual[channel], expected[channel], `${name} fill channel ${channel}`, 2);
          closeTo(beside[channel], background[channel], `${name} background channel ${channel}`, 2);
        }
        assert.notDeepEqual(actual, background, `${name} has a visible silhouette`);
        const light = luminance(status) + 0.05;
        const dark = luminance(background) + 0.05;
        const contrast = Math.max(light, dark) / Math.min(light, dark);
        assert.ok(contrast >= 4.5, `${name} status contrast is ${contrast.toFixed(2)}:1`);
      }

      const avatarRadius = theme.startsWith('pixel') ? '0px' : '9999px';
      const blockRadius = theme.startsWith('pixel') ? '0px' : '8px';
      const radii = await page.getByTestId('shapes').evaluate((node) =>
        Array.from(node.children, (shape) => {
          const paint = shape.querySelector('span > span') ?? shape;
          return getComputedStyle(paint).borderRadius;
        }),
      );
      assert.deepEqual(radii.slice(0, 7), [blockRadius, ...Array(6).fill(avatarRadius)]);
      assert.equal(radii[7], radii[8], 'The media override and text bars share the small radius');
      assert.equal(radii[8], theme.startsWith('pixel') ? '0px' : '4px');
    };
}

for (const direction of ['ltr', 'rtl']) {
  scenarios[`Skeleton reserves the Avatar flex slot and hidden layouts in ${direction}`] = async ({
    page,
    mount,
  }) => {
    await mount('skeleton', { direction });
    for (const [id, width, height] of [
      ['rect', 160, 16],
      ['avatar-default', 40, 40],
      ['avatar-width', 32, 32],
      ['avatar-height', 40, 24],
      ['avatar-both', 32, 24],
      ['avatar-constrained', 160, 160],
      ['avatar-percentage', 96, 96],
    ]) {
      await assertBox(page.getByTestId(id), { width, height });
    }
    const avatarRows = page.locator('[data-avatar-row]');
    const measureRows = () =>
      avatarRows.evaluateAll((rows) =>
        rows.map((row) => {
          const [avatar, copy] = row.children;
          const rowBox = row.getBoundingClientRect();
          const avatarBox = avatar.getBoundingClientRect();
          const copyBox = copy.getBoundingClientRect();
          const rtl = getComputedStyle(row).direction === 'rtl';
          return {
            width: avatarBox.width,
            height: avatarBox.height,
            top: avatarBox.top - rowBox.top,
            copyWidth: copyBox.width,
            copyInset: rtl ? rowBox.right - copyBox.right : copyBox.left - rowBox.left,
          };
        }),
      );
    const before = await measureRows();
    assert.deepEqual(before, [
      { width: 40, height: 40, top: 0, copyWidth: 132, copyInset: 48 },
      { width: 40, height: 40, top: 20, copyWidth: 132, copyInset: 48 },
    ]);
    await page.getByRole('button', { name: 'Show avatar' }).click();
    assert.deepEqual(await measureRows(), before);

    const rows = page.locator('[data-hidden-row]');
    const readHidden = () =>
      rows.evaluateAll((elements) =>
        elements.map((row) => {
          const [subject, next] = row.children;
          return {
            display: getComputedStyle(subject).display,
            rects: subject.getClientRects().length,
            width: subject.getBoundingClientRect().width,
            next: next.getBoundingClientRect().x,
          };
        }),
      );
    const shown = await readHidden();
    assert.equal(shown.length, 4);
    for (const state of shown) {
      assert.equal(state.display, 'grid');
      assert.equal(state.rects, 1);
      assert.equal(state.width, 64);
    }
    const toggle = page.getByRole('button', { name: 'Toggle hidden' });
    await toggle.click();
    for (const [index, state] of (await readHidden()).entries()) {
      assert.deepEqual(state, {
        display: 'none',
        rects: 0,
        width: 0,
        next: shown[index].next + (direction === 'rtl' ? 72 : -72),
      });
    }
    await toggle.click();
    assert.deepEqual(await readHidden(), shown);

    // hidden="until-found" must not be forced to display: none by the [hidden] rule.
    const untilFound = await page.evaluate(() => {
      const shape = document.querySelector('[data-testid="rect"]');
      const text = document.querySelector('[data-testid="text-shape"]');
      shape.setAttribute('hidden', 'until-found');
      text.setAttribute('hidden', 'UNTIL-FOUND');
      const result = [shape, text].map((node) => {
        const style = getComputedStyle(node);
        return {
          display: style.display,
          contentVisibility: style.contentVisibility,
        };
      });
      shape.removeAttribute('hidden');
      text.removeAttribute('hidden');
      return result;
    });
    assert.deepEqual(untilFound, [
      { display: 'block', contentVisibility: 'hidden' },
      { display: 'block', contentVisibility: 'hidden' },
    ]);
  };

  scenarios[
    `Skeleton sweeps twice toward inline end in ${direction} and maintains phase on rerender`
  ] = async ({ page, mount }) => {
    await mount('skeleton', { direction });
    const shape = page.getByTestId('motion');
    const bar = page.getByTestId('motion-text').locator('span > span');
    const animationSign = direction === 'ltr' ? 1 : -1;
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll(
          '[data-testid="motion"], [data-testid="motion-text"] > span > span',
        ),
      ].every((node) => parseFloat(getComputedStyle(node, '::after').width) > 0),
    );
    for (const paint of [shape, bar]) {
      const sweep = await paint.evaluate((node) => {
        const animation = node.getAnimations({ subtree: true })[0];
        animation.pause();
        const { left, top } = node.getBoundingClientRect();
        const { clientWidth, clientHeight } = document.documentElement;
        const positions = [0, 600, 1250, 2050].map((time) => {
          animation.currentTime = time;
          const style = getComputedStyle(node, '::after');
          const { m41: shift, m21: slope } = new DOMMatrix(style.transform);
          const width = parseFloat(style.width);
          const atTop = left + shift - top * slope;
          const atBottom = atTop + clientHeight * slope;
          return {
            left: Math.min(atTop, atBottom),
            right: Math.max(atTop, atBottom) + width,
            center: (atTop + atBottom + width) / 2,
          };
        });
        const { duration, iterations, endTime } = animation.effect.getComputedTiming();
        return {
          positions,
          slope: new DOMMatrix(getComputedStyle(node, '::after').transform).m21,
          duration,
          iterations,
          endTime,
          viewport: clientWidth,
        };
      });
      assert.equal(sweep.duration, 2200);
      assert.equal(sweep.iterations, 2);
      assert.equal(sweep.endTime, 4400);
      assert.ok(Math.abs(sweep.slope * animationSign + Math.tan(Math.PI / 15)) < 0.001);
      const [first, early, late, last] = sweep.positions;
      const outsideLeft = ({ right }) => right < 0.05;
      const outsideRight = ({ left }) => left > sweep.viewport - 0.05;
      assert.ok(direction === 'ltr' ? outsideLeft(first) : outsideRight(first));
      assert.ok(direction === 'ltr' ? outsideRight(last) : outsideLeft(last));
      assert.ok(early.center * animationSign < late.center * animationSign);
    }

    const original = await shape.evaluateHandle((node) => node.getAnimations({ subtree: true })[0]);
    await page.getByRole('button', { name: 'Update 0' }).click();
    await page.getByRole('button', { name: 'Update 1' }).waitFor();
    assert.equal(
      await shape.evaluate(
        (node, animation) =>
          node.getAnimations({ subtree: true })[0] === animation && animation.currentTime === 2050,
        original,
      ),
      true,
    );
    for (const paint of [shape, bar]) {
      const rest = await paint.evaluate(async (node) => {
        const animation = node.getAnimations({ subtree: true })[0];
        animation.finish();
        await animation.finished;
        const sweep = getComputedStyle(node, '::after');
        return {
          count: node.getAnimations({ subtree: true }).length,
          width: sweep.width,
        };
      });
      assert.deepEqual(rest, { count: 0, width: '0px' });
    }
    await original.dispose();
  };
}

scenarios['Skeleton shares a diagonal band and phase with a late Frost overlay and nested scroll'] =
  async ({ page, mount }) => {
    let releaseImage;
    const imageReady = new Promise((resolve) => {
      releaseImage = resolve;
    });
    await page.route('**/wave-intrinsic.svg', async (route) => {
      await imageReady;
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="16"></svg>',
      });
    });
    await mount('skeleton-wave', { theme: 'frost-dark' });
    const samples =
      '[data-wave-sample], [data-wave-text] > span > span, [data-wave-intrinsic], [data-wave-overlay]';
    const overlay = page.getByRole('dialog', { name: 'Frost overlay' });
    const toggle = page.getByRole('button', { name: 'Toggle overlay' });
    await page.waitForFunction((selector) => {
      const paint = document.querySelector(selector);
      const animation = paint.getAnimations({ subtree: true })[0];
      return (
        animation?.currentTime >= 250 && parseFloat(getComputedStyle(paint, '::after').width) > 0
      );
    }, samples);
    const firstStart = await page
      .locator(samples)
      .first()
      .evaluate((node) => node.getAnimations({ subtree: true })[0].startTime);

    await toggle.evaluate((button) => button.click());
    await overlay.waitFor();
    assert.notEqual(
      await overlay.evaluate((node) => getComputedStyle(node).backdropFilter),
      'none',
    );
    await page.waitForFunction(() => {
      const paint = document.querySelector('[data-wave-overlay]');
      return parseFloat(getComputedStyle(paint, '::after').width) > 0;
    });

    const starts = await page.locator(samples).evaluateAll((nodes) =>
      nodes.map((node) => {
        const animation = node.getAnimations({ subtree: true })[0];
        const start = animation.startTime;
        animation.pause();
        animation.currentTime = 850;
        return start;
      }),
    );
    assert.equal(starts.length, 6);
    assert.deepEqual(starts, Array(6).fill(firstStart));

    const coordinates = (selector) =>
      Array.from(document.querySelectorAll(selector), (node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const scaleX = rect.width / parseFloat(style.width);
        const scaleY = rect.height / parseFloat(style.height);
        const layer = getComputedStyle(node, '::after');
        const matrix = new DOMMatrix(layer.transform);
        const width = parseFloat(layer.width) * scaleX;
        const slope = (matrix.m21 * scaleX) / scaleY;
        // Compare each diagonal at the same viewport Y, regardless of the paint box's position.
        const center = rect.left + matrix.m41 * scaleX + width / 2 - slope * rect.top;
        return { left: rect.left, top: rect.top, center, slope, width };
      });
    const aligned = (positions) =>
      positions.every(
        ({ center, slope, width }) =>
          Math.abs(center - positions[0].center) <= 0.15 &&
          Math.abs(slope + Math.tan(Math.PI / 15)) < 0.001 &&
          Math.abs(width - positions[0].width) <= 0.15,
      );
    const settleLayout = () =>
      page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
    const before = await page.evaluate(coordinates, samples);
    assert.ok(aligned(before), JSON.stringify(before));

    const scroll = page.getByTestId('wave-scroll');
    await scroll.evaluate((node) => {
      node.scrollLeft = 64;
      node.scrollTop = 24;
    });
    await page.waitForFunction(() => {
      const node = document.querySelector('[data-testid="wave-scroll"]');
      return node.scrollLeft === 64 && node.scrollTop === 24;
    });
    await settleLayout();
    const afterScroll = await page.evaluate(coordinates, samples);
    assert.ok(afterScroll.some(({ left }, index) => Math.abs(left - before[index].left) >= 60));
    assert.ok(afterScroll.some(({ top }, index) => Math.abs(top - before[index].top) >= 20));
    assert.ok(aligned(afterScroll), JSON.stringify(afterScroll));
    closeTo(
      afterScroll[0].center,
      before[0].center,
      'nested scroll leaves the viewport wave fixed',
    );

    await page.setViewportSize({ width: 680, height: 600 });
    await settleLayout();
    const resized = await page.evaluate(coordinates, samples);
    assert.ok(aligned(resized), JSON.stringify(resized));
    assert.ok(Math.abs(resized[0].center - afterScroll[0].center) > 10);

    const card = page.getByTestId('wave-card');
    await card.evaluate((node) => {
      node.style.transform = 'translateX(56px) scale(1.125, 0.875)';
    });
    await settleLayout();
    const moved = await page.evaluate(coordinates, samples);
    closeTo(moved[0].left - resized[0].left, 32, 'position-only layout change');
    assert.ok(aligned(moved), JSON.stringify(moved));
    closeTo(moved[0].center, resized[0].center, 'layout change leaves the viewport wave fixed');

    await card.evaluate((node) => {
      node.dataset.waveShifted = '';
    });
    await settleLayout();
    const shifted = await page.evaluate(coordinates, samples);
    closeTo(shifted[0].left - moved[0].left, 32, 'attribute-driven layout change');
    assert.ok(aligned(shifted), JSON.stringify(shifted));

    releaseImage();
    await page.getByTestId('wave-image').evaluate((node) => node.decode());
    await settleLayout();
    const loaded = await page.evaluate(coordinates, samples);
    closeTo(
      loaded[4].left - shifted[4].left,
      64,
      'intrinsic sibling moves a fixed-width placeholder',
    );
    assert.ok(aligned(loaded), JSON.stringify(loaded));

    for (const [attribute, name] of [
      ['data-wave-moving', 'wave-fixture-enter'],
      ['data-wave-inset-moving', 'wave-fixture-inset'],
    ]) {
      await card.evaluate((node, attribute) => node.setAttribute(attribute, ''), attribute);
      await page.waitForFunction((name) => {
        const node = document.querySelector('[data-testid="wave-card"]');
        return (
          node.getAnimations().find((animation) => animation.animationName === name)?.currentTime >=
          120
        );
      }, name);
      const entering = await page.evaluate(coordinates, samples);
      const traveled = entering[0].left - loaded[0].left;
      assert.ok(
        traveled > 5 && traveled < 48,
        `Expected to sample during ${name}, traveled ${traveled}px`,
      );
      if (name === 'wave-fixture-inset') {
        assert.ok(entering[0].top - loaded[0].top > 4);
      }
      assert.ok(aligned(entering), JSON.stringify(entering));
      await card.evaluate((node, attribute) => node.removeAttribute(attribute), attribute);
    }

    await page.locator(samples).evaluateAll(async (nodes) => {
      const animations = nodes.map((node) => node.getAnimations({ subtree: true })[0]);
      for (const animation of animations) {
        animation.finish();
      }
      await Promise.all(animations.map((animation) => animation.finished));
    });
    await toggle.evaluate((button) => button.click());
    await overlay.waitFor({ state: 'hidden' });
    await toggle.evaluate((button) => button.click());
    await page.waitForFunction(() => {
      const paint = document.querySelector('[data-wave-overlay]');
      return parseFloat(getComputedStyle(paint, '::after').width) > 0;
    });
    const nextStart = await page
      .locator('[data-wave-overlay]')
      .evaluate((node) => node.getAnimations({ subtree: true })[0].startTime);
    assert.ok(nextStart > firstStart);
    const oldMotion = await page
      .locator('[data-wave-sample]')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node, '::after').width));
    assert.deepEqual(oldMotion, ['0px', '0px']);
  };

scenarios[
  'Skeleton uses static system colors without changing geometry and removes reduced-motion shine'
] = async ({ page, mount }) => {
  await mount('skeleton');
  const normal = await paints(page);
  assert.equal(normal.length, 2);
  for (const shape of normal) {
    assert.equal(shape.animation, 'unica-skeleton-sweep');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [index, shape] of (await paints(page)).entries()) {
    assert.equal(shape.content, 'none');
    assert.equal(shape.animation, 'none');
    assert.deepEqual(shape.box, normal[index].box);
  }
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' });
  const reference = await page.getByTestId('forced-colors-reference').evaluate((node) => {
    const style = getComputedStyle(node);
    return { fill: style.backgroundColor, outline: style.outlineColor };
  });
  for (const [index, shape] of (await paints(page)).entries()) {
    assert.equal(shape.content, 'none');
    assert.equal(shape.animation, 'none');
    assert.deepEqual(shape.box, normal[index].box);
    assert.deepEqual({ fill: shape.fill, outline: shape.outline }, reference);
    assert.equal(shape.width, '1px');
    assert.equal(shape.offset, '-1px');
  }
};

scenarios[
  'Skeleton stays out of the accessibility tree, editing and Tab order while retaining hit testing'
] = async ({ page, mount }) => {
  await mount('skeleton');
  const host = page.getByTestId('focus-host');
  const next = host.getByRole('button', { name: 'Next action' });
  const first = host.getByRole('button', { name: 'Update 0' });
  await first.focus();
  await assertFocused(first);
  await page.keyboard.press('Tab');
  await assertFocused(next);
  const aria = await host.ariaSnapshot();
  assert.doesNotMatch(aria, /Decorative placeholder|generic|progressbar/u);
  for (const id of ['motion', 'motion-text']) {
    const placeholder = page.getByTestId(id);
    assert.deepEqual(
      await placeholder.evaluate((node) => ({
        ariaHidden: node.getAttribute('aria-hidden'),
        cursor: getComputedStyle(node).cursor,
        select: getComputedStyle(node).userSelect,
        hit: getComputedStyle(node).pointerEvents,
      })),
      { ariaHidden: 'true', cursor: 'progress', select: 'none', hit: 'auto' },
    );
  }

  assert.equal(
    await page.getByTestId('edit-host').evaluate((node) => node.isContentEditable),
    true,
  );
  for (const id of ['editable-shape', 'editable-text']) {
    assert.equal(await page.getByTestId(id).evaluate((node) => node.isContentEditable), false);
  }

  const shape = page.getByTestId('motion');
  await shape.scrollIntoViewIfNeeded();
  const { x, y, width, height } = await getBox(shape);
  await assertHitTarget(shape, { x: x + width / 2, y: y + height / 2 });
};

scenarios['Skeleton SSR markup hydrates both existing roots without changing their geometry'] =
  async ({ page, mount, renderFixture }) => {
    const html = await renderFixture('skeleton-ssr');
    await mount('skeleton-hydration');
    const before = await page.evaluateHandle((markup) => {
      const host = document.createElement('div');
      host.dataset.ssrHost = '';
      host.innerHTML = markup;
      document.body.append(host);
      return [...host.children];
    }, html);
    const shape = page.locator('#ssr-shape');
    const text = page.locator('#ssr-text');
    await assertBox(shape, { width: 32, height: 32 });
    const textBox = await getBox(text);
    assert.equal(await text.locator(':scope > span').count(), 2);
    await page.getByRole('button', { name: 'Hydrate placeholders' }).click();
    await page.getByTestId('hydration').getByText('Hydrated').waitFor();
    assert.equal(
      await before.evaluate((nodes) =>
        nodes.every((node) => node === document.getElementById(node.id)),
      ),
      true,
    );
    await assertBox(text, textBox);
    await before.dispose();
  };

scenarios['Skeleton sweeps in English RTL and nested LTR without :dir(rtl) CSS'] = async ({
  page,
  mount,
}) => {
  await mount('skeleton', { direction: 'rtl' });
  const shape = page.getByTestId('motion');
  await shape.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () =>
      parseFloat(
        getComputedStyle(document.querySelector('[data-testid="motion"]'), '::after').width,
      ) > 0,
  );
  const rtlSweep = await shape.evaluate((node) => {
    document.documentElement.lang = 'en';
    const start = parseFloat(node.style.getPropertyValue('--_skeleton-sweep-start'));
    const end = parseFloat(node.style.getPropertyValue('--_skeleton-sweep-end'));
    const slope = new DOMMatrix(getComputedStyle(node, '::after').transform).m21;
    return { start, end, slope };
  });
  assert.ok(rtlSweep.start > rtlSweep.end, 'RTL sweep moves from right to left');
  assert.ok(rtlSweep.slope > 0, 'RTL sweep tilts toward inline end');

  await shape.evaluate((node) => {
    node.setAttribute('dir', 'ltr');
  });
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-testid="motion"]');
    const start = parseFloat(node.style.getPropertyValue('--_skeleton-sweep-start'));
    const end = parseFloat(node.style.getPropertyValue('--_skeleton-sweep-end'));
    return start < end;
  });
  const nestedLtr = await shape.evaluate((node) => ({
    start: parseFloat(node.style.getPropertyValue('--_skeleton-sweep-start')),
    end: parseFloat(node.style.getPropertyValue('--_skeleton-sweep-end')),
    slope: new DOMMatrix(getComputedStyle(node, '::after').transform).m21,
  }));
  assert.ok(nestedLtr.start < nestedLtr.end, 'Nested LTR sweep moves from left to right');
  assert.ok(nestedLtr.slope < 0, 'Nested LTR sweep tilts toward inline end');
};

scenarios[
  'Skeleton targeted observers ignore unrelated mutations and track >64 siblings, display:contents, and dir=auto'
] = async ({ page, mount }) => {
  await mount('skeleton', { direction: 'ltr' });
  await page.getByRole('button', { name: 'Mount observer probes' }).click();
  const probes = page.getByTestId('observer-probes');
  await probes.waitFor();
  await probes.scrollIntoViewIfNeeded();
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );

  // Wait for all probe skeletons to receive their initial sweep geometry.
  await page.waitForFunction(() =>
    [
      'probe-overridden-ltr',
      'probe-many-skel',
      'probe-contents-skel',
      'probe-dir-auto-skel',
      'probe-text-skel',
    ].every((id) => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      return el && Boolean(el.style.getPropertyValue('--_skeleton-sweep-start'));
    }),
  );

  // Pause all running sweep animations so earlier skeletons cannot expire and probes stay active.
  await page.evaluate(async () => {
    for (const anim of document.getAnimations()) {
      anim.pause();
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });

  // 1. Unrelated mutation inside overridden <div dir="auto"><div unrelated/><main dir="ltr"><Skeleton/></main></div> -> 0 reads,
  //    while a real mutation on its own parent <main> -> >0 reads (proves it IS actively observed).
  const overriddenReads = await page.evaluate(async () => {
    const skel = document.querySelector('[data-testid="probe-overridden-ltr"]');
    const orig = skel.getBoundingClientRect.bind(skel);
    let reads = 0;
    skel.getBoundingClientRect = () => {
      reads++;
      return orig();
    };
    const nextFrames = () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const meta = document.head.appendChild(document.createElement('meta'));
    meta.setAttribute('name', 'application-name');
    meta.remove();
    const metadataLink = document.createElement('link');
    metadataLink.rel = 'canonical';
    document.head.append(metadataLink);
    await nextFrames();
    metadataLink.rel = 'alternate';
    await nextFrames();
    metadataLink.remove();
    const unrelated = document.querySelector('[data-testid="unrelated-subtree"]');
    unrelated.textContent = 'Mutated unrelated text 12345';
    unrelated.setAttribute('data-noise', '1');
    unrelated.appendChild(document.createElement('span')).textContent = 'extra';
    await nextFrames();
    const unrelatedCount = reads;

    document.querySelector('[data-testid="overridden-ltr-main"]').setAttribute('data-touched', '1');
    await nextFrames();
    const relevantCount = reads - unrelatedCount;

    skel.getBoundingClientRect = orig;
    return { unrelatedCount, relevantCount };
  });
  assert.equal(
    overriddenReads.unrelatedCount,
    0,
    'Unrelated mutation outside ancestors triggers 0 layout reads',
  );
  assert.ok(
    overriddenReads.relevantCount > 0,
    'Positive control: mutation on active parent triggers layout read',
  );

  // 2. >64 siblings: expanding sibling #0 shifts probe-many-skel by 80px.
  const manyDelta = await page.evaluate(async () => {
    const skel = document.querySelector('[data-testid="probe-many-skel"]');
    const before = parseFloat(skel.style.getPropertyValue('--_skeleton-sweep-start'));
    document.querySelector('[data-probe-sibling="0"]').style.inlineSize = '84px';
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const after = parseFloat(skel.style.getPropertyValue('--_skeleton-sweep-start'));
    return before - after;
  });
  assert.ok(
    Math.abs(manyDelta - 80) <= 2,
    `Expected ~80px shift past 64 siblings, got ${manyDelta}`,
  );

  // 3. display: contents: 100px shift from child behind display:contents, dynamic insertion into display:contents,
  //    and toggling a sibling to display:contents mid-sweep.
  const contentsShifts = await page.evaluate(async () => {
    const skel = document.querySelector('[data-testid="probe-contents-skel"]');
    const read = () => parseFloat(skel.style.getPropertyValue('--_skeleton-sweep-start'));
    const nextFrames = () =>
      new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))),
      );

    const s0 = read();
    document.querySelector('[data-testid="probe-contents-child"]').style.inlineSize = '120px';
    await nextFrames();
    const s1 = read();

    const added = document.createElement('div');
    added.style.cssText = 'inline-size: 40px; block-size: 16px; flex: none';
    document.querySelector('[data-testid="probe-contents-wrap"]').appendChild(added);
    await nextFrames();
    const s2 = read();

    document.querySelector('[data-testid="probe-contents-row"]').classList.add('probe-flat');
    await nextFrames();
    document.querySelector('[data-testid="probe-toggle-inner"]').style.inlineSize = '70px';
    await nextFrames();
    const s3 = read();

    return {
      growBehindContents: s0 - s1,
      insertInsideContents: s1 - s2,
      toggledToContents: s2 - s3,
    };
  });
  assert.ok(
    Math.abs(contentsShifts.growBehindContents - 100) <= 2,
    `Expected ~100px shift behind display:contents, got ${contentsShifts.growBehindContents}`,
  );
  assert.ok(
    Math.abs(contentsShifts.insertInsideContents - 40) <= 2,
    `Expected ~40px shift after inserting into display:contents, got ${contentsShifts.insertInsideContents}`,
  );
  assert.ok(
    Math.abs(contentsShifts.toggledToContents - 50) <= 2,
    `Expected ~50px shift after toggling display->contents, got ${contentsShifts.toggledToContents}`,
  );

  // 4. dir="auto": changing nested text Abc -> שלום flips sweep direction and band angle sign.
  const dirAutoFlip = await page.evaluate(async () => {
    const skel = document.querySelector('[data-testid="probe-dir-auto-skel"]');
    const snap = () => ({
      start: parseFloat(skel.style.getPropertyValue('--_skeleton-sweep-start')),
      end: parseFloat(skel.style.getPropertyValue('--_skeleton-sweep-end')),
      angle: parseFloat(skel.style.getPropertyValue('--_skeleton-band-angle')),
    });
    const ltr = snap();
    document.querySelector('[data-testid="probe-dir-auto-text"]').textContent = 'שלום';
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const rtl = snap();
    return { ltr, rtl };
  });
  assert.ok(dirAutoFlip.ltr.start < dirAutoFlip.ltr.end && dirAutoFlip.ltr.angle < 0);
  assert.ok(dirAutoFlip.rtl.start > dirAutoFlip.rtl.end && dirAutoFlip.rtl.angle > 0);

  // 5. Direct Text node mutation + sibling margin change shift probe-text-skel.
  const textAndMargin = await page.evaluate(async () => {
    const row = document.querySelector('[data-testid="probe-text-row"]');
    const skel = document.querySelector('[data-testid="probe-text-skel"]');
    const read = () => parseFloat(skel.style.getPropertyValue('--_skeleton-sweep-start'));
    const nextFrames = () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const s0 = read();
    row.firstChild.data = 'Much longer direct text node content';
    await nextFrames();
    const s1 = read();
    document.querySelector('[data-testid="probe-margin-sibling"]').style.marginInlineStart = '40px';
    await nextFrames();
    const s2 = read();
    return { textShift: s0 - s1, marginShift: s1 - s2 };
  });
  assert.ok(
    textAndMargin.textShift > 20,
    `Expected text node shift > 20, got ${textAndMargin.textShift}`,
  );
  assert.ok(
    Math.abs(textAndMargin.marginShift - 40) <= 2,
    `Expected ~40px sibling margin shift, got ${textAndMargin.marginShift}`,
  );

  const inline = await page.evaluate(async () => {
    const skel = document.querySelector('[data-testid="probe-inline-skel"]');
    const read = () => [
      skel.getBoundingClientRect().left,
      parseFloat(skel.style.getPropertyValue('--_skeleton-sweep-start')),
    ];
    const [left, start] = read();
    document.querySelector('[data-testid="probe-inline-label"] em').firstChild.data =
      'Substantially longer inline text';
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const [newLeft, newStart] = read();
    return { shift: newLeft - left, sweepShift: start - newStart };
  });
  assert.ok(inline.shift > 20);
  assert.ok(Math.abs(inline.shift - inline.sweepShift) < 2);

  // 6. Leaving viewport retains written --_skeleton-* geometry without clearing; finishing animation cleans up (idle = 0).
  const offscreenAndIdle = await page.evaluate(async () => {
    const skel = document.querySelector('[data-testid="probe-many-skel"]');
    window.scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const retainedStart = skel.style.getPropertyValue('--_skeleton-sweep-start');

    for (const el of document.querySelectorAll(
      '.unica-skeleton, .unica-skeleton-text > span > span',
    )) {
      for (const anim of el.getAnimations({ subtree: true })) {
        anim.finish();
      }
    }
    await new Promise((r) => setTimeout(r, 50));
    const clearedStart = skel.style.getPropertyValue('--_skeleton-sweep-start');
    return { retainedStart, clearedStart };
  });
  assert.ok(Boolean(offscreenAndIdle.retainedStart), 'Offscreen exit keeps --_skeleton-* geometry');
  assert.equal(offscreenAndIdle.clearedStart, '', 'Animation finish clears --_skeleton-* at idle');
};

scenarios['Skeleton tracks formatting changes at viewport and container breakpoints'] = async ({
  page,
  mount,
}) => {
  await mount('skeleton-responsive');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.unica-skeleton')].every((el) =>
      el.style.getPropertyValue('--_skeleton-sweep-start'),
    ),
  );
  await page.evaluate(() => document.getAnimations().forEach((animation) => animation.pause()));
  for (const id of ['viewport', 'container']) {
    const row = page.getByTestId(id);
    if (id === 'viewport') {
      await page.setViewportSize({ width: 550, height: 600 });
    } else {
      await row.evaluate((node) => {
        node.parentElement.style.width = '400px';
      });
    }
    const shift = await row.evaluate(async (node) => {
      const settle = () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
      await settle();
      const skeleton = node.querySelector('.unica-skeleton');
      const start = () => parseFloat(skeleton.style.getPropertyValue('--_skeleton-sweep-start'));
      const previous = start();
      const wrap = node.firstElementChild;
      const display = getComputedStyle(wrap).display;
      wrap.firstElementChild.style.width = '130px';
      await settle();
      return [display, previous - start()];
    });
    assert.equal(shift[0], 'contents');
    assert.ok(Math.abs(shift[1] - 110) < 1, `${id} shifted the projected sweep by ${shift[1]}px`);
  }
};

scenarios['Skeleton follows translation from a dynamic document stylesheet'] = async ({
  page,
  mount,
}) => {
  await mount('skeleton-responsive');
  const paint = page.getByTestId('viewport').locator('.unica-skeleton');
  await page.waitForFunction(() =>
    document.querySelector('.unica-skeleton')?.style.getPropertyValue('--_skeleton-sweep-start'),
  );
  const samples = await paint.evaluate(async (node) => {
    document.getAnimations().forEach((animation) => animation.pause());
    const settle = () =>
      new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
    const sample = () => [
      node.getBoundingClientRect().left,
      parseFloat(node.style.getPropertyValue('--_skeleton-sweep-start')),
    ];
    await settle();
    const result = [sample()];
    const style = document.createElement('style');
    const rule = (x) => `[data-testid="viewport"] { transform: translateX(${x}px); }`;
    const text = document.createTextNode(rule(100));
    style.append(text);
    document.head.append(style);
    await settle();
    result.push(sample());
    text.data = rule(45);
    await settle();
    result.push(sample());
    style.remove();
    await settle();
    result.push(sample());
    // A route can own CSS in a separate body fragment with no layout dependency on the paint.
    const route = document.body.appendChild(document.createElement('aside'));
    const assets = route.appendChild(document.createElement('div'));
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `data:text/css,${encodeURIComponent(rule(70))}`;
    await new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = reject;
      assets.append(link);
    });
    await settle();
    result.push(sample());
    link.media = 'print';
    await settle();
    result.push(sample());
    link.media = 'all';
    await settle();
    result.push(sample());
    route.remove();
    link.rel = 'alternate';
    await settle();
    result.push(sample());
    return result;
  });
  for (const [i, delta] of [0, 100, 45, 0, 70, 0, 70, 0].entries()) {
    assert.ok(Math.abs(samples[i][0] - samples[0][0] - delta) < 1, 'paint translation');
    assert.ok(
      Math.abs(samples[0][1] - samples[i][1] - delta) < 1,
      `projected band after translation by ${delta}px`,
    );
  }
};

export default scenarios;

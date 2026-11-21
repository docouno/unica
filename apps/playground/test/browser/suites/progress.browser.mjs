import assert from 'node:assert/strict';
import { assertFocused, submitForm } from '../helpers.mjs';

const track = '.unica-progress-track';
const fill = '.unica-progress-fill';
const tip = '.unica-progress-tip';
const wait = '.unica-progress-wait';
const arc = '.unica-activity-icon-wait-arc';
const orbit = '.unica-activity-icon-orbit';
const pixels = '.unica-activity-icon-pixels';
const waitCells = '.unica-activity-icon-wait-cell';
const drawing = '.unica-activity-icon-drawing';
const pixelFill = '.unica-activity-icon-cell-fill';

const choose = (page, value) => page.getByLabel('Measurement').selectOption(value);

function closeTo(actual, expected, tolerance = 0.1) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} near ${expected}`);
}

async function seekSpinner(spinner, time) {
  return spinner.evaluate(
    (element, { time, drawing }) => {
      const artwork = element.querySelector(drawing);
      const reveal = artwork
        .getAnimations()
        .find((animation) => animation.animationName === 'unica-spinner-reveal');
      if (!reveal) {
        throw new Error('Missing reveal animation');
      }
      reveal.pause();
      reveal.currentTime = time;
      const { width, height } = getComputedStyle(element);
      return { width, height, opacity: getComputedStyle(artwork).opacity };
    },
    { time, drawing },
  );
}

async function seekAnimations(locator, time, property) {
  return locator.evaluate(
    (element, { time, property }) => {
      for (const animation of element.getAnimations()) {
        animation.pause();
        animation.currentTime = time;
      }
      return getComputedStyle(element)[property];
    },
    { time, property },
  );
}

export default {
  'Progress: delay follows elapsed time on the same SVG and preserves its slot': async ({
    page,
    mount,
  }) => {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      await mount('progress', { reducedMotion });
      const spinner = page.getByTestId('spinner');
      const svg = await spinner.elementHandle();
      const before = { width: '16px', height: '16px', opacity: '0' };
      const after = { ...before, opacity: '1' };

      assert.deepEqual(await seekSpinner(spinner, 80), before);
      await page.getByRole('button', { name: 'Toggle spinner', exact: true }).click();
      assert.equal(await spinner.count(), 0);
      await page.getByRole('button', { name: 'Toggle spinner', exact: true }).click();
      assert.deepEqual(await seekSpinner(spinner, 80), before);
      assert.equal(await svg.evaluate((node) => node.isConnected), false);

      const sameSvg = await spinner.elementHandle();
      assert.deepEqual(await seekSpinner(spinner, 100), before);
      await page.getByRole('button', { name: 'Threshold 200ms' }).click();
      assert.equal(await sameSvg.evaluate((node) => node.isConnected), true);
      assert.deepEqual(await seekSpinner(spinner, 199), before);
      assert.deepEqual(await seekSpinner(spinner, 200.1), after);

      assert.deepEqual(await seekSpinner(spinner, 250), after);
      await page.getByRole('button', { name: 'Threshold 300ms' }).click();
      assert.deepEqual(
        await spinner.locator(drawing).evaluate((node) => getComputedStyle(node).opacity),
        '0',
      );
      assert.deepEqual(await seekSpinner(spinner, 301), after);
      assert.equal(await sameSvg.evaluate((node) => node.isConnected), true);

      await page.getByRole('button', { name: 'New operation, 300ms' }).click();
      assert.deepEqual(await seekSpinner(spinner, 100), before);
      await page.getByRole('button', { name: 'Threshold 50ms' }).click();
      assert.deepEqual(
        await spinner.locator(drawing).evaluate((node) => getComputedStyle(node).opacity),
        '1',
      );

      const visibleSvg = await spinner.elementHandle();
      const visibility = page.getByRole('button', { name: 'Toggle spinner visibility' });
      const reveal = await spinner
        .locator(drawing)
        .evaluateHandle((node) =>
          node
            .getAnimations()
            .find((animation) => animation.animationName === 'unica-spinner-reveal'),
        );
      await visibility.click();
      assert.equal(await spinner.isVisible(), false);
      assert.equal(await reveal.evaluate((animation) => animation.playState), 'idle');
      await visibility.click();
      assert.equal(await visibleSvg.evaluate((node) => node.isConnected), true);
      assert.deepEqual(await seekSpinner(spinner, 49), before);
      assert.deepEqual(await seekSpinner(spinner, 51), after);
      await reveal.dispose();
    }
  },

  'Progress: round silhouette animates in Soft and Frost, and stays put with reduced motion':
    async ({ page, mount }) => {
      for (const theme of ['soft-dark', 'soft-light', 'frost-dark', 'frost-light']) {
        await mount('progress', { theme });
        const spinner = page.getByTestId('spinner');
        const circle = page.getByTestId('circle');
        assert.equal(await spinner.locator(pixels).isVisible(), false);
        const roundArc = spinner.locator(arc);
        const roundOrbit = spinner.locator(orbit);
        assert.equal(await roundArc.isVisible(), true);
        assert.notEqual(
          await seekAnimations(roundArc, 0, 'strokeDasharray'),
          await seekAnimations(roundArc, 800, 'strokeDasharray'),
        );
        assert.notEqual(
          await seekAnimations(roundOrbit, 0, 'transform'),
          await seekAnimations(roundOrbit, 600, 'transform'),
        );
        assert.equal(
          await circle.evaluate((node) => node.getAnimations({ subtree: true }).length),
          0,
        );

        await choose(page, 'unknown');
        assert.equal(await circle.locator(arc).isVisible(), true);
        assert.equal(await circle.getAttribute('aria-valuetext'), null);
        await choose(page, 'transfer');
        const measured = circle.locator('.unica-activity-icon-fill');
        assert.equal(await measured.getAttribute('stroke-dasharray'), '52.5 100');
        assert.equal(await measured.evaluate((node) => node.getAnimations().length), 0);
        const measurementControl = await page.getByLabel('Measurement').elementHandle();
        assert.equal(
          await measured.evaluate((node, control) => {
            control.value = 'first';
            control.dispatchEvent(new Event('change', { bubbles: true }));
            return node
              .getAnimations()
              .find((animation) => animation.transitionProperty === 'stroke-dasharray')
              ?.effect.getTiming().duration;
          }, measurementControl),
          180,
        );
        await choose(page, 'zero');
        assert.equal(await measured.isVisible(), false);
        await choose(page, 'complete');
        assert.equal(await measured.getAttribute('stroke-dasharray'), '100 100');
      }

      await page.emulateMedia({ reducedMotion: 'reduce' });
      const spinner = page.getByTestId('spinner');
      assert.equal(
        await spinner.locator(arc).evaluate((node) => getComputedStyle(node).strokeDasharray),
        '28px, 72px',
      );
      assert.equal(
        await spinner.locator(orbit).evaluate((node) => getComputedStyle(node).animationName),
        'none',
      );
    },

  'Progress: Pixel uses a moving perimeter and proportional cells in either direction': async ({
    page,
    mount,
  }) => {
    for (const direction of ['ltr', 'rtl']) {
      await mount('progress', { theme: 'pixel-dark', direction });
      const circle = page.getByTestId('circle');
      const original = await circle.elementHandle();
      const spinner = page.getByTestId('spinner');
      const trail = spinner.locator(waitCells);
      assert.equal(await spinner.locator(arc).isVisible(), false);
      assert.equal(await trail.count(), 8);
      assert.equal(await trail.first().isVisible(), true);
      assert.notEqual(
        await seekAnimations(trail.first(), 0, 'opacity'),
        await seekAnimations(trail.first(), 120, 'opacity'),
      );

      const cellAreas = () =>
        circle
          .locator(pixelFill)
          .evaluateAll((cells) =>
            cells.map((node) => (node.getBBox().width * node.getBBox().height) / (4.5 * 4.5)),
          );
      const areas = [
        ['zero', [0, 0, 0, 0, 0, 0, 0, 0]],
        ['one-cell', [1, 0, 0, 0, 0, 0, 0, 0]],
        ['partial-cell', [1, 0.5, 0, 0, 0, 0, 0, 0]],
        ['complete', [1, 1, 1, 1, 1, 1, 1, 1]],
      ];
      await choose(page, 'unknown');
      assert.equal(await circle.locator(waitCells).count(), 8);
      for (const [value, expected] of areas) {
        await choose(page, value);
        assert.deepEqual(await cellAreas(), expected);
        assert.equal(
          await circle.evaluate((node) => node.getAnimations({ subtree: true }).length),
          0,
        );
        assert.equal(await original.evaluate((node) => node.isConnected), true);
        assert.equal(await circle.getAttribute('aria-label'), 'Compact transfer');
      }
      await choose(page, 'partial-cell');
      assert.equal(await circle.locator(pixelFill).nth(1).getAttribute('y'), '2.5');
      assert.equal(await circle.locator(pixelFill).nth(1).getAttribute('height'), '2.25');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.deepEqual(
        await trail.evaluateAll((cells) => cells.map((cell) => getComputedStyle(cell).opacity)),
        ['1', '0.14', '0.14', '0.14', '0.14', '0.14', '0.3', '0.55'],
      );
    }
  },

  'Progress: width, label and waiting footprint follow the current phase in narrow RTL': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await mount('progress', { theme: 'frost-dark', direction: 'rtl', textScale: 120 });
    const root = page.getByTestId('linear');
    const semantic = root.locator(track);
    const amount = root.locator(fill);
    const units = page.getByTestId('units');
    const percentage = root.locator('.unica-progress-value');
    const percentageWidth = () => percentage.evaluate((node) => node.getBoundingClientRect().width);
    const knownWidth = await percentageWidth();
    const unitsTrack = (await units.locator(track).boundingBox()).y;
    const geometry = await semantic.boundingBox();

    await choose(page, 'zero');
    assert.equal(await amount.isVisible(), false);
    assert.equal(await amount.evaluate((node) => node.getBoundingClientRect().width), 0);
    assert.equal(await amount.evaluate((node) => node.getAnimations().length), 0);

    await choose(page, 'unknown');
    closeTo((await root.locator(wait).boundingBox()).width, geometry.width);
    assert.equal(await semantic.getAttribute('aria-valuenow'), null);
    assert.equal(await semantic.getAttribute('aria-valuetext'), null);
    assert.equal(await units.locator('.unica-progress-value').isVisible(), false);
    assert.equal(await percentageWidth(), knownWidth);
    closeTo((await units.locator(track).boundingBox()).y, unitsTrack);

    await choose(page, 'transfer');
    const measured = await amount.boundingBox();
    closeTo(measured.width, geometry.width * 0.525);
    closeTo(measured.x + measured.width, geometry.x + geometry.width);
    assert.equal(await semantic.getAttribute('aria-valuenow'), '42');
    assert.equal(await semantic.getAttribute('aria-valuemax'), '80');
    assert.equal(await root.getByText('52%').isVisible(), true);
    closeTo(
      await percentage.locator('bdi').evaluate((node) => {
        const text = document.createRange();
        text.selectNodeContents(node);
        return text.getBoundingClientRect().left;
      }),
      geometry.x,
    );
    assert.equal(await units.locator('.unica-progress-value bdi').count(), 1);
    closeTo((await units.locator(track).boundingBox()).y, unitsTrack);
    assert.equal(await units.evaluate((node) => node.scrollWidth <= node.clientWidth), true);

    const trackOnly = page.getByTestId('track-only');
    assert.equal(await trackOnly.locator('.unica-progress-heading').count(), 0);
    assert.equal((await trackOnly.boundingBox()).height, 4);
    await page.getByRole('button', { name: 'Toggle units' }).click();
    assert.equal(await units.locator('.unica-progress-value').count(), 0);
    assert.equal(
      await units.locator(track).getAttribute('aria-valuetext'),
      '42 of 80 MB — نسخة الأرشيف الأسبوعية',
    );
  },

  'Progress: Frost animates only active work and fades a visible lead over 600ms': async ({
    page,
    mount,
  }) => {
    await mount('progress', { theme: 'frost-dark' });
    const root = page.getByTestId('linear');
    const lead = root.locator(tip);
    const inspect = () =>
      lead.evaluate((node) => ({
        opacity: Number(getComputedStyle(node).opacity),
        motion: getComputedStyle(node, '::after').animationName,
        animations: node
          .getAnimations({ subtree: true })
          .map((animation) => animation.effect.getTiming().duration),
      }));
    assert.ok((await inspect()).opacity > 0);
    assert.equal((await inspect()).motion, 'unica-progress-tip-breathe');
    assert.ok((await inspect()).animations.includes(2400));

    await page.getByRole('button', { name: 'Toggle active' }).click();
    assert.ok((await inspect()).opacity > 0);
    assert.equal((await inspect()).motion, 'none');
    await page.getByRole('button', { name: 'Toggle active' }).click();
    await page.getByRole('button', { name: 'Toggle pause' }).click();
    assert.equal(await lead.isVisible(), false);
    assert.equal((await inspect()).motion, 'none');
    await page.getByRole('button', { name: 'Toggle pause' }).click();

    const measurementControl = await page.getByLabel('Measurement').elementHandle();
    const fade = await lead.evaluate((node, control) => {
      const opacity = () => Number(getComputedStyle(node).opacity);
      const before = opacity();
      control.value = 'complete';
      control.dispatchEvent(new Event('change', { bubbles: true }));
      const transition = node
        .getAnimations()
        .find((animation) => animation.transitionProperty === 'opacity');
      if (!transition) {
        throw new Error('Missing completion fade');
      }
      transition.pause();
      transition.currentTime = 0;
      const start = opacity();
      transition.currentTime = 300;
      const midpoint = opacity();
      transition.currentTime = 600;
      return {
        before,
        start,
        midpoint,
        end: opacity(),
        duration: transition.effect.getTiming().duration,
      };
    }, measurementControl);
    assert.equal(fade.duration, 600);
    assert.equal(fade.before, fade.start);
    assert.ok(fade.start > fade.midpoint && fade.midpoint > fade.end);
    assert.equal(fade.end, 0);
    assert.equal(await root.getAttribute('data-status'), 'accent');
    const initiallyFull = page.getByTestId('initial-full').locator(tip);
    assert.equal(await initiallyFull.evaluate((node) => getComputedStyle(node).opacity), '0');
    assert.equal(await initiallyFull.evaluate((node) => node.getAnimations().length), 0);

    await choose(page, 'unknown');
    const waiting = root.locator(wait);
    assert.notEqual(
      await seekAnimations(waiting, 0, 'backgroundPosition'),
      await seekAnimations(waiting, 550, 'backgroundPosition'),
    );
    await page.getByRole('button', { name: 'Toggle pause' }).click();
    assert.equal(await waiting.evaluate((node) => getComputedStyle(node).animationName), 'none');
    await page.getByRole('button', { name: 'Toggle pause' }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await waiting.evaluate((node) => node.getAnimations().length), 0);
    assert.match(
      await waiting.evaluate((node) => getComputedStyle(node).backgroundImage),
      /135deg/,
    );
  },

  'Progress: waiting paint is stable in all six themes when Overlay shares the theme node': async ({
    page,
    mount,
  }) => {
    await mount('progress', { reducedMotion: 'reduce' });
    for (const theme of [
      'soft-dark',
      'soft-light',
      'frost-dark',
      'frost-light',
      'pixel-dark',
      'pixel-light',
    ]) {
      const paints = await page
        .getByTestId(theme)
        .locator(track)
        .evaluateAll((tracks) => {
          function resolveColor(node, token) {
            const swatch = document.createElement('span');
            swatch.style.backgroundColor = `var(${token})`;
            node.append(swatch);
            const color = getComputedStyle(swatch).backgroundColor;
            swatch.remove();
            return color;
          }
          return tracks.map((node) => {
            const waiting = node.firstElementChild;
            const styles = getComputedStyle(waiting);
            return {
              track: getComputedStyle(node).backgroundColor,
              control: resolveColor(node, '--control-bg'),
              basePaint: styles.backgroundColor,
              accent: resolveColor(node, '--accent-signal'),
              pattern: styles.backgroundImage,
            };
          });
        });
      const [base, nested, colocated] = paints;
      for (const record of paints) {
        assert.equal(record.track, record.control);
        assert.equal(record.basePaint, record.accent);
        assert.match(record.pattern, /135deg/);
      }
      assert.equal(nested.basePaint, base.basePaint, theme);
      assert.equal(colocated.basePaint, base.basePaint, theme);
      assert.equal(nested.pattern, base.pattern, theme);
      assert.equal(colocated.pattern, base.pattern, theme);
      assert.equal(nested.track, colocated.track, theme);
      if (theme.startsWith('frost')) {
        assert.notEqual(base.track, nested.track, theme);
      }
    }
  },

  'Progress: system colors distinguish the real arc, cells, fill and waiting outline': async ({
    page,
    mount,
  }) => {
    for (const theme of ['frost-light', 'pixel-dark']) {
      await mount('progress', { theme, forcedColors: 'active', reducedMotion: 'reduce' });
      const spinner = page.getByTestId('spinner');
      const circle = page.getByTestId('circle');
      const root = page.getByTestId('linear');
      const semantic = root.locator(track);
      const forced = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.forcedColorAdjust = 'none';
        document.body.append(probe);
        const paints = Object.fromEntries(
          ['Highlight', 'GrayText', 'CanvasText'].map((color) => {
            probe.style.color = color;
            return [color, getComputedStyle(probe).color];
          }),
        );
        probe.remove();
        return paints;
      });

      async function assertWaitingPaint(indicator) {
        if (theme.startsWith('pixel')) {
          const cells = indicator.locator(waitCells);
          assert.equal(await cells.first().isVisible(), true);
          assert.deepEqual(
            await cells.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill)),
            Array(8).fill(forced.CanvasText),
          );
        } else {
          assert.equal(await indicator.locator(arc).isVisible(), true);
          assert.equal(
            await indicator.locator(arc).evaluate((node) => getComputedStyle(node).stroke),
            forced.CanvasText,
          );
        }
      }
      await assertWaitingPaint(spinner);

      if (theme.startsWith('pixel')) {
        for (const [selector, color] of [
          [pixelFill, forced.Highlight],
          ['.unica-activity-icon-cell-track', forced.GrayText],
        ]) {
          assert.equal(await circle.locator(selector).first().isVisible(), true);
          assert.deepEqual(
            await circle
              .locator(selector)
              .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill)),
            Array(8).fill(color),
          );
        }
      } else {
        assert.equal(
          await circle
            .locator('.unica-activity-icon-fill')
            .evaluate((node) => getComputedStyle(node).stroke),
          forced.Highlight,
        );
        assert.equal(
          await circle
            .locator('.unica-activity-icon-track')
            .evaluate((node) => getComputedStyle(node).stroke),
          forced.GrayText,
        );
      }

      assert.equal(
        await semantic.evaluate((node) => getComputedStyle(node).outlineColor),
        forced.CanvasText,
      );
      assert.equal(
        await root.locator(fill).evaluate((node) => getComputedStyle(node).backgroundColor),
        forced.Highlight,
      );
      await choose(page, 'zero');
      assert.equal(await root.locator(fill).isVisible(), false);
      await choose(page, 'unknown');
      await assertWaitingPaint(circle);
      assert.equal(
        await semantic.evaluate((node) => getComputedStyle(node).outlineStyle),
        'dashed',
      );
      assert.equal(
        await semantic.evaluate((node) => getComputedStyle(node).outlineColor),
        forced.Highlight,
      );
      assert.equal(
        await root.locator(wait).evaluate((node) => getComputedStyle(node).backgroundImage),
        'none',
      );
    }
  },

  'Progress: indicators preserve native tab order and leave form submission and reset to the app':
    async ({ page, mount }) => {
      await mount('progress');
      const form = page.getByTestId('form');
      const before = form.getByRole('button', { name: 'Before indicators' });
      const after = form.getByRole('button', { name: 'After indicators' });
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'BODY');
      await before.focus();
      await page.keyboard.press('Tab');
      await assertFocused(after);
      await page.keyboard.press('Shift+Tab');
      await assertFocused(before);
      assert.deepEqual(await submitForm(form, before), [['intent', 'submit']]);
      const semantic = page.getByRole('progressbar', { name: 'Archive transfer', exact: true });
      await after.click();
      assert.equal(await semantic.getAttribute('aria-valuenow'), '64');
      await assertFocused(after);

      await page.getByLabel('Measurement').focus();
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      assert.equal(await semantic.getAttribute('aria-valuenow'), null);
      await assertFocused(page.getByLabel('Measurement'));
    },

  'Progress: hydration preserves both accessible labels and semantic nodes': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const markup = await renderFixture('progress-ssr');
    await mount('progress');
    const host = page.getByTestId('hydrate-target');
    await host.evaluate((node, markup) => {
      node.innerHTML = markup;
    }, markup);
    const archive = host.getByRole('progressbar', { name: 'Archive' });
    const preview = host.getByRole('progressbar', { name: 'Preview' });
    const archiveId = await archive.getAttribute('aria-labelledby');
    const previewId = await preview.getAttribute('aria-labelledby');
    assert.ok(archiveId && previewId && archiveId !== previewId);
    const original = await archive.elementHandle();
    await page.getByRole('button', { name: 'Hydrate indicators' }).click();
    await host.getByRole('button', { name: 'Clear measurement' }).click();
    assert.equal(await archive.getAttribute('aria-valuenow'), null);
    assert.equal(await archive.getAttribute('aria-labelledby'), archiveId);
    assert.equal(await preview.getAttribute('aria-labelledby'), previewId);
    assert.equal(await original.evaluate((node) => node.isConnected), true);
  },

  'Progress mirrors the active tip for Baseline dir attributes and Guarantee dir="auto"': async ({
    page,
    mount,
  }) => {
    await mount('progress', { theme: 'frost-dark', direction: 'rtl' });
    const result = await page.evaluate(() => {
      document.documentElement.lang = 'en';
      const linear = document.querySelector('[data-testid="linear"]');
      const tipEl = linear.querySelector('.unica-progress-tip');
      const read = (node) => ({
        mirror: getComputedStyle(node).getPropertyValue('--_dir-mirror').trim(),
        scaleX: new DOMMatrix(getComputedStyle(node).transform).a,
      });

      const englishRtl = read(tipEl);

      linear.setAttribute('dir', 'ltr');
      const nestedLtr = read(tipEl);

      const labelEl = linear.querySelector('.unica-progress-label');
      const originalText = labelEl.textContent;
      linear.setAttribute('dir', 'auto');
      labelEl.textContent = 'שלום עולם';
      const autoRtl = read(tipEl);

      labelEl.textContent = originalText;
      const autoLtr = read(tipEl);

      return { englishRtl, nestedLtr, autoRtl, autoLtr };
    });
    assert.equal(result.englishRtl.mirror, '-1');
    assert.equal(result.englishRtl.scaleX, -1);
    assert.equal(result.nestedLtr.mirror, '1');
    assert.equal(result.nestedLtr.scaleX, 1);
    assert.equal(result.autoRtl.scaleX, -1);
    assert.equal(result.autoLtr.scaleX, 1);
  },
};

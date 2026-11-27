import assert from 'node:assert/strict';
import { assertFocused, getBox, textContrast } from '../helpers.mjs';

const marker = '.unica-stepper-marker';
const themeIds = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];

async function markerPaint(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      shadow: style.boxShadow,
      radius: style.borderStartStartRadius,
      edge: style.borderTopWidth,
    };
  });
}

async function focusContrast(sample, focusedMarker) {
  await focusedMarker.evaluate((node) => {
    const outline = getComputedStyle(node).outlineColor;
    const probe = document.createElement('span');
    probe.dataset.testid = 'focus-contrast';
    Object.assign(probe.style, {
      position: 'absolute',
      top: `${node.offsetHeight / 2 - 1}px`,
      left: '-4px',
      width: '2px',
      height: '2px',
      color: outline,
    });
    node.style.outlineColor = 'transparent';
    node.before(probe);
  });
  try {
    return await textContrast(sample.getByTestId('focus-contrast'));
  } finally {
    await sample.getByTestId('focus-contrast').evaluate((node) => node.remove());
    await focusedMarker.evaluate((node) => {
      node.style.outlineColor = '';
    });
  }
}

function materialSuite(surface) {
  return async ({ page, mount }) => {
    for (const theme of themeIds) {
      await mount('stepper-material', { theme });
      const sample = page.getByTestId(surface);
      const rows = sample.getByRole('listitem');
      const label = `${theme}/${surface}`;
      const current = await markerPaint(rows.nth(1).locator(marker));
      const danger = await markerPaint(rows.nth(2).locator(marker));
      assert.equal(current.edge, '1px', label);
      assert.equal(danger.edge, '1px', label);
      assert.equal(danger.shadow, 'none', label);
      if (theme.startsWith('frost')) {
        assert.match(
          current.shadow,
          theme.endsWith('dark') ? /0px 0px 10px/ : /0px 0px 8px/,
          label,
        );
      } else {
        assert.equal(current.shadow, 'none', label);
      }
      assert.equal(current.radius === '0px', theme.startsWith('pixel'), label);
      const checks = [
        [rows.nth(1).locator('.unica-stepper-title-text'), 4.5, 'title'],
        [rows.nth(1).locator('.unica-stepper-description'), 4.5, 'description'],
        [rows.nth(2).locator('.unica-stepper-issue bdi[aria-hidden]'), 4.5, 'correction'],
        [rows.nth(0).locator(`${marker} svg`), 3, 'completion glyph'],
        [rows.nth(2).locator(`${marker} svg`), 3, 'correction glyph'],
        [rows.nth(1).locator(`${marker} bdi`), 3, 'current number'],
        [rows.nth(3).locator(`${marker} bdi`), 3, 'upcoming number'],
      ];
      for (const [locator, minimum, part] of checks) {
        const ratio = await textContrast(locator);
        assert.ok(ratio >= minimum, `${label} ${part} measures ${ratio.toFixed(2)}:1`);
      }
      await sample.getByRole('button', { name: `Before ${surface}` }).focus();
      await page.keyboard.press('Tab');
      await assertFocused(rows.nth(0).getByRole('button'));
      const focus = await focusContrast(sample, rows.nth(0).locator(marker));
      assert.ok(focus >= 3, `${label} focus outline measures ${focus.toFixed(2)}:1`);
    }
  };
}

export default {
  'Stepper preserves marker material and contrast on Base in all six themes': materialSuite('base'),
  'Stepper preserves marker material and contrast on Overlay in all six themes':
    materialSuite('overlay'),

  'Stepper retains error signs in forced colors and uses immediate in-flow disclosure with reduced motion':
    async ({ page, mount }) => {
      await mount('stepper', {
        theme: 'frost-dark',
        forcedColors: 'active',
        reducedMotion: 'reduce',
      });
      await page.evaluate(() =>
        window.stepperProbe.update({ layout: 'compact', localized: false }),
      );
      const map = page.getByRole('group', { name: 'Import stages' });
      const segment = map.locator('.unica-stepper-segments [data-unica-stepper-state="danger"]');
      assert.deepEqual(
        await segment.evaluate((node) => {
          const style = getComputedStyle(node);
          return [style.borderTopStyle, style.borderTopWidth];
        }),
        ['dashed', '1px'],
      );
      await map.getByRole('button', { name: 'All steps' }).press('Enter');
      const current = map.locator('li[aria-current="step"]');
      assert.equal((await markerPaint(current.locator(marker))).shadow, 'none');
      const error = map.getByRole('button', { name: 'Step 3: Commit' });
      await error.focus();
      assert.equal(
        await error.locator(marker).evaluate((node) => getComputedStyle(node).outlineWidth),
        '2px',
      );
      assert.equal(await error.locator(`${marker} svg`).count(), 1);
      assert.equal(await map.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
    },

  'Stepper uses 44px touch targets and keeps neighbors in place after a short step is pressed':
    async ({ page, watchPage, origin }) => {
      const context = await page
        .context()
        .browser()
        .newContext({
          hasTouch: true,
          viewport: { width: 360, height: 740 },
        });
      try {
        const touch = watchPage(await context.newPage());
        await touch.goto(
          new URL('/test/browser/index.html?fixture=stepper&theme=soft-light', origin).href,
        );
        await touch.locator('[data-browser-ready]').waitFor();
        await touch.evaluate(() =>
          window.stepperProbe.update({
            accept: 'yes',
            size: 's',
            direction: 'rtl',
            localized: false,
            width: 330,
          }),
        );
        assert.equal(await touch.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
        const map = touch.getByRole('group', { name: 'Import stages' });
        const toggle = map.getByRole('button', { name: 'All steps' });
        const target = await getBox(toggle);
        assert.ok(target.height >= 44 && target.width >= 44);
        await toggle.tap();
        const source = map.getByRole('button', { name: 'Step 1: Source, completed' });
        const sourceBox = await getBox(source);
        const nextBefore = await getBox(map.locator('li#B'));
        assert.ok(sourceBox.height >= 44 && sourceBox.width >= 44);
        await source.tap();
        const nextAfter = await getBox(map.locator('li#B'));
        assert.deepEqual(nextAfter, nextBefore);
        assert.equal(await map.locator('li#A').getAttribute('aria-current'), 'step');
      } finally {
        await context.close();
      }
    },

  'Stepper makes room for adjacent touch actions in dense horizontal maps': async ({
    page,
    watchPage,
    origin,
  }) => {
    const context = await page
      .context()
      .browser()
      .newContext({
        hasTouch: true,
        viewport: { width: 768, height: 640 },
      });
    try {
      const touch = watchPage(await context.newPage());
      await touch.goto(
        new URL('/test/browser/index.html?fixture=stepper&theme=pixel-light', origin).href,
      );
      await touch.locator('[data-browser-ready]').waitFor();
      const map = touch.getByRole('group', { name: 'Import stages' });
      const requests = [];
      for (const direction of ['ltr', 'rtl']) {
        for (const [width, layout, order] of [
          [436, 'responsive', ['B', 'D', 'E', 'F', 'G', 'H', 'I', 'A', 'C']],
          [360, 'horizontal', ['B', 'D', 'E', 'F', 'G', 'A', 'C']],
        ]) {
          await touch.evaluate((options) => window.stepperProbe.update(options), {
            order,
            width,
            layout,
            size: 'l',
            direction,
            localized: false,
          });
          const a = await getBox(map.locator('li#A').getByRole('button'));
          const c = await getBox(map.locator('li#C').getByRole('button'));
          const label = `${width}px ${direction}`;
          assert.ok(a.width >= 43.98 && a.height >= 44, label);
          assert.ok(c.width >= 43.98 && c.height >= 44, label);
          const gap = direction === 'ltr' ? c.x - (a.x + a.width) : a.x - (c.x + c.width);
          assert.ok(gap >= 0, `${label} adjacent buttons overlap by ${-gap}px`);
          assert.equal(
            await map.evaluate((node) => node.scrollWidth <= node.clientWidth),
            true,
            label,
          );
          await touch.touchscreen.tap(
            direction === 'ltr' ? a.x + 43 : a.x + a.width - 43,
            a.y + 22,
          );
          await touch.touchscreen.tap(direction === 'ltr' ? c.x + 1 : c.x + c.width - 1, c.y + 22);
          requests.push('A', 'C');
          assert.equal(
            await touch.getByTestId('requests').textContent(),
            requests.join(','),
            label,
          );
        }
      }
    } finally {
      await context.close();
    }
  },
};

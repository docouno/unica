import assert from 'node:assert/strict';
import { assertHitTarget, getBox } from '../helpers.mjs';

async function positioned(page, id) {
  const panel = page.locator(`#${id}:popover-open[data-side]`);
  await panel.waitFor();
  return panel;
}

async function waitForPlacement(page, expected) {
  await page.waitForFunction(({ id, source, side, physical, align, rtl }) => {
    const panel = document.getElementById(id);
    const anchor = document.getElementById(source);
    if (
      !panel?.matches(':popover-open') ||
      panel.dataset.side !== side ||
      panel.dataset.align !== align
    ) {
      return false;
    }
    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const block = physical === 'top' || physical === 'bottom';
    const distance = {
      top: a.top - p.bottom,
      bottom: p.top - a.bottom,
      left: a.left - p.right,
      right: p.left - a.right,
    }[physical];
    const from = block ? 'left' : 'top';
    const to = block ? 'right' : 'bottom';
    const crossSide =
      align === 'center' ? null : (align === 'start') !== (block && rtl) ? from : to;
    const delta = crossSide ? p[crossSide] - a[crossSide] : (p[from] + p[to] - a[from] - a[to]) / 2;
    return Math.abs(distance - 8) < 1 && Math.abs(delta) < 1;
  }, expected);
}

export default {
  'Preview geometry resolves all twelve placements and responds to live RTL': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1000, height: 720 });
    await mount('hover-preview-geometry');
    await page.getByRole('button', { name: 'Show placement' }).evaluate((button) => button.click());
    await positioned(page, 'placement-panel');
    const sideControl = page.getByLabel('Side', { exact: true });
    const alignControl = page.getByLabel('Align', { exact: true });
    for (const rtl of [false, true]) {
      await page.locator('#geometry').evaluate((element, reverse) => {
        element.dir = reverse ? 'rtl' : 'ltr';
      }, rtl);
      const resolved = {
        top: 'top',
        bottom: 'bottom',
        start: rtl ? 'right' : 'left',
        end: rtl ? 'left' : 'right',
      };
      for (const [side, physical] of Object.entries(resolved)) {
        await sideControl.selectOption(side);
        for (const align of ['start', 'center', 'end']) {
          await alignControl.selectOption(align);
          await waitForPlacement(page, {
            id: 'placement-panel',
            source: 'placement-anchor',
            side,
            physical,
            align,
            rtl,
          });
        }
      }
    }
  },

  'Preview geometry chooses the roomier tight vertical side and gives height to native scrolling':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 800, height: 312 });
      await mount('hover-preview-geometry');
      await page
        .getByRole('button', { name: 'Show tall card' })
        .evaluate((button) => button.click());
      const panel = await positioned(page, 'tall-panel');
      await waitForPlacement(page, {
        id: 'tall-panel',
        source: 'tall-anchor',
        side: 'top',
        physical: 'top',
        align: 'center',
        rtl: false,
      });
      const reading = panel.locator('[data-unica-preview-scroll]');
      assert.ok(
        await reading.evaluate((element) => {
          element.scrollTop = 51;
          return element.scrollHeight > element.clientHeight;
        }),
      );
      assert.equal(Math.round((await getBox(panel)).height), 180);
      await page.locator('#tall-anchor').evaluate((element) => {
        element.style.top = '84px';
      });
      await waitForPlacement(page, {
        id: 'tall-panel',
        source: 'tall-anchor',
        side: 'bottom',
        physical: 'bottom',
        align: 'center',
        rtl: false,
      });
      assert.equal(Math.round((await getBox(panel)).height), 180);
      assert.equal(await reading.evaluate((element) => element.scrollTop), 51);

      await page.getByLabel('Align', { exact: true }).selectOption('start');
      await waitForPlacement(page, {
        id: 'tall-panel',
        source: 'tall-anchor',
        side: 'bottom',
        physical: 'bottom',
        align: 'start',
        rtl: false,
      });
      assert.equal(await reading.evaluate((element) => element.scrollTop), 51);
      await page.getByLabel('Align', { exact: true }).selectOption('center');
      await page.setViewportSize({ width: 460, height: 312 });
      await page.locator('#tall-anchor').evaluate((element) => {
        element.style.left = '172px';
      });
      await page.getByLabel('Side', { exact: true }).selectOption('start');
      await waitForPlacement(page, {
        id: 'tall-panel',
        source: 'tall-anchor',
        side: 'bottom',
        physical: 'bottom',
        align: 'center',
        rtl: false,
      });
      await page.keyboard.press('Escape');
      await page.locator('#tall-panel:not(:popover-open)').waitFor({ state: 'attached' });
      assert.deepEqual(
        await page
          .locator('#tall-panel')
          .evaluate((element) => [
            element.dataset.side,
            element.style.getPropertyValue('--overlay-available-height'),
            element.style.getPropertyValue('--_overlay-bridge-content'),
          ]),
        [undefined, '', ''],
      );
    },

  'Preview geometry honors viewport zoom, side padding, and safe-area insets': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview-geometry', { theme: 'frost-light', textScale: 120 });
    const anchor = page.locator('#placement-anchor');
    await anchor.evaluate((element) => {
      element.style.left = '3px';
      element.style.top = '106px';
    });
    await page.locator('#placement-panel').evaluate((element) => {
      element.style.setProperty('--_overlay-safe-left', '52px');
      element.style.setProperty('--_overlay-safe-right', '48px');
    });
    await page.getByRole('button', { name: 'Show placement' }).click();
    const panel = await positioned(page, 'placement-panel');
    assert.equal(Math.round((await getBox(panel)).x), 52);

    // Chromium changes the visual viewport while preserving the layout viewport.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
    await page.waitForFunction(() => {
      const viewport = window.visualViewport;
      const style = document.getElementById('placement-panel').style;
      const cap = Number.parseFloat(style.getPropertyValue('--overlay-available-width'));
      return viewport.width < innerWidth && Math.abs(cap - (viewport.width - 52 - 48)) < 1;
    });
    const box = await getBox(panel);
    assert.ok(box.x >= 52 && box.x + box.width <= 352);
    assert.ok(box.y + box.height <= 284);

    await anchor.evaluate((element) => {
      element.style.left = '420px';
    });
    await page.locator('#placement-panel:not(:popover-open)').waitFor({ state: 'attached' });
  },

  'Preview geometry respects native clipping inside a lifted auto and on the lifted source itself':
    async ({ page, mount }) => {
      await mount('hover-preview-geometry');
      await page.getByRole('button', { name: 'Show auto parent' }).click();
      const nested = page.locator('#nested-anchor');
      const nestedRect = await getBox(nested);
      await assertHitTarget(nested, { x: nestedRect.x + 5, y: nestedRect.y + 15 });
      await nested.hover();
      const panel = await positioned(page, 'nested-panel');
      const scrollport = page.locator('#geometry-scrollport');
      await scrollport.evaluate((element) => {
        element.scrollTop = 8;
      });
      await page.waitForFunction(() => {
        const panel = document.getElementById('nested-panel');
        const anchor = document.getElementById('nested-anchor');
        const scrollport = document.getElementById('geometry-scrollport');
        const visibleTop = scrollport.getBoundingClientRect().top;
        return (
          panel.matches(':popover-open') &&
          anchor.getBoundingClientRect().top < visibleTop &&
          Math.abs(visibleTop - panel.getBoundingClientRect().bottom - 8) < 1
        );
      });
      const bridgePoint = {
        x: nestedRect.x + nestedRect.width / 2,
        y: (await getBox(scrollport)).y - 4,
      };
      await assertHitTarget(panel, bridgePoint);
      const neighbor = page.locator('#nested-neighbor');
      const neighborBox = await getBox(neighbor);
      await assertHitTarget(neighbor, {
        x: neighborBox.x + neighborBox.width / 2,
        y: bridgePoint.y,
      });
      await page.mouse.move(bridgePoint.x, bridgePoint.y);
      // Linger in the pointer corridor longer than the ordinary close delay.
      await page.waitForTimeout(220);
      assert.equal(await panel.count(), 1);
      await page.mouse.move(bridgePoint.x, bridgePoint.y - 8);
      assert.equal(
        await panel.evaluate(
          (element, { x, y }) => element.contains(document.elementFromPoint(x, y - 8)),
          bridgePoint,
        ),
        true,
      );

      await scrollport.evaluate((element) => {
        element.scrollTop = 100;
      });
      await page.waitForFunction(
        () => document.getElementById('geometry-close').textContent === 'unavailable',
      );
      assert.equal(await page.locator('#nested-panel:popover-open').count(), 0);
      assert.equal(await page.locator('#geometry-native-auto:popover-open').count(), 1);

      await page.getByRole('button', { name: 'Raise anchor' }).click();
      const raised = page.locator('#raised-anchor');
      const raisedRect = await getBox(raised);
      await assertHitTarget(raised, { x: raisedRect.x + 5, y: raisedRect.y + 5 });
      await raised.hover();
      await positioned(page, 'raised-panel');
    },

  'Preview geometry joins ancestor clipping with the visual viewport and tracks a moving partial clip':
    async ({ page, mount }) => {
      await mount('hover-preview-geometry');
      await page.getByRole('button', { name: 'Show auto parent' }).click();
      const anchor = page.locator('#nested-anchor');
      const scrollport = page.locator('#geometry-scrollport');
      await page.locator('#geometry-native-auto').evaluate((element) => {
        Object.assign(element.style, { left: '370px', top: '140px' });
      });
      await anchor.evaluate((element) => {
        element.style.transform = 'translateX(-30px)';
      });
      await page.keyboard.press('Tab');
      await anchor.focus();
      await positioned(page, 'nested-panel');

      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
      await page.waitForFunction(() => window.visualViewport.width === 400);
      await page.waitForFunction(
        () =>
          document
            .querySelector('#nested-panel:popover-open')
            .style.getPropertyValue('--overlay-available-width') === '368px',
      );

      async function moveClip(left) {
        await scrollport.evaluate((element, x) => {
          const bounds = element.getBoundingClientRect();
          const rightInset = bounds.right - x - 20;
          element.style.clipPath = `inset(0 ${rightInset}px 0 ${x - bounds.left}px)`;
        }, left);
        return anchor.evaluate(
          (element) =>
            new Promise((resolve) => {
              const observer = new IntersectionObserver(
                ([entry]) => {
                  observer.disconnect();
                  resolve(entry.intersectionRect.toJSON());
                },
                { root: element.ownerDocument },
              );
              observer.observe(element);
            }),
        );
      }

      const partial = await moveClip(384);
      assert.equal(partial.left, 384);
      assert.equal(partial.right, 404);
      const panel = await positioned(page, 'nested-panel');
      assert.equal(
        await panel.evaluate((element) =>
          element.style.getPropertyValue('--_overlay-bridge-content'),
        ),
        '""',
      );

      const outside = await moveClip(404);
      assert.equal(outside.left, 404);
      assert.equal(outside.width, partial.width);
      assert.equal(outside.height, partial.height);
      // The anchor straddles the visual viewport edge. Only the clipped part
      // outside that viewport remains, even though the layout intersection area is unchanged.
      const box = await getBox(anchor);
      assert.ok(box.x < 400 && box.x + box.width > 400);
      await page.waitForFunction(
        () => document.getElementById('geometry-close').textContent === 'unavailable',
      );
      assert.equal(await page.locator('#nested-panel:popover-open').count(), 0);
      assert.equal(await page.locator('#geometry-native-auto:popover-open').count(), 1);
    },

  'Preview geometry places date feedback outside the nearest available edge and can fall back inside':
    async ({ page, mount }) => {
      await mount('hover-preview-geometry');
      await page.getByRole('button', { name: 'Show rejected date' }).click();
      const panel = await positioned(page, 'date-panel');
      const avoid = page.locator('#geometry-avoid');
      const leftBox = await getBox(panel);
      assert.ok(leftBox.x + leftBox.width <= (await getBox(avoid)).x - 7.5);
      assert.equal(await panel.getAttribute('data-side'), 'start');

      await avoid.evaluate((element) => {
        Object.assign(element.style, { left: '5px', width: '790px', top: '90px', height: '132px' });
      });
      await page.waitForFunction(() => {
        const panel = document.getElementById('date-panel').getBoundingClientRect();
        const avoid = document.getElementById('geometry-avoid').getBoundingClientRect();
        return Math.abs(panel.top - avoid.bottom - 8) < 1;
      });
      assert.equal(await panel.getAttribute('data-side'), 'bottom');

      await avoid.evaluate((element) => {
        Object.assign(element.style, { top: '0px', height: '600px' });
      });
      await page.waitForFunction(() => {
        const panel = document.getElementById('date-panel').getBoundingClientRect();
        const date = document.getElementById('date-anchor').getBoundingClientRect();
        return Math.abs(panel.top - date.bottom - 8) < 1;
      });
      assert.equal(
        await panel.evaluate((element) =>
          element.style.getPropertyValue('--_overlay-bridge-content'),
        ),
        '',
      );
    },
};

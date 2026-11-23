import assert from 'node:assert/strict';
import { assertBox, assertFocused, assertHitTarget, getBox } from '../helpers.mjs';

const byId = (page, id) => page.locator('#geometry-' + id);
const trigger = (page) => byId(page, 'trigger');
const panel = (page) => byId(page, 'panel');
const clip = (page) => byId(page, 'clip');

async function open(page, side) {
  await trigger(page).click();
  await page.locator('#geometry-panel:popover-open[data-side=' + side + ']').waitFor();
}

async function expectChanges(page, values) {
  await page.waitForFunction(
    (expected) => document.querySelector('#geometry-log').textContent === expected,
    JSON.stringify(values),
  );
}

async function waitClosed(page) {
  await page.locator('#geometry-panel:popover-open').waitFor({ state: 'detached' });
  assert.equal(await trigger(page).getAttribute('aria-expanded'), 'false');
}

async function paint(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

function assertNear(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1, message + ': ' + actual + ' vs ' + expected);
}

export default {
  'Popover escapes paint clipping, accepts pointer input and closes on a fully clipped anchor':
    async ({ page, mount }) => {
      await mount('popover-geometry');
      await open(page, 'bottom');
      const anchor = await getBox(trigger(page));
      const box = await getBox(panel(page));
      assertNear(box.y, anchor.y + anchor.height + 8, 'bottom gap in CSS pixels');
      assert.ok(
        box.y + box.height > (await getBox(clip(page))).y + (await getBox(clip(page))).height,
      );

      const action = byId(page, 'action');
      const actionBox = await getBox(action);
      await assertHitTarget(action, {
        x: actionBox.x + actionBox.width / 2,
        y: actionBox.y + actionBox.height / 2,
      });
      await action.click();
      assert.equal(await byId(page, 'log').getAttribute('data-actions'), '1');

      await clip(page).evaluate((element) => {
        element.scrollTop = 24;
      });
      await page.waitForFunction(() => {
        const anchor = document.querySelector('#geometry-trigger').getBoundingClientRect();
        const clip = document.querySelector('#geometry-clip').getBoundingClientRect();
        const panel = document.querySelector('#geometry-panel').getBoundingClientRect();
        return (
          anchor.top < clip.top &&
          anchor.bottom > clip.top &&
          Math.abs(panel.top - anchor.bottom - 8) < 1
        );
      });
      assert.equal(await panel(page).evaluate((element) => element.matches(':popover-open')), true);
      await expectChanges(page, [true]);

      await clip(page).evaluate((element) => {
        element.scrollTop = 64;
      });
      await waitClosed(page);
      await expectChanges(page, [true, false]);
      await assertFocused(byId(page, 'fallback'));
    },

  'Popover observes anchor visibility changes without treating opacity or visible descendants as lost':
    async ({ page, mount }) => {
      await mount('popover-geometry');
      await open(page, 'bottom');
      const before = await getBox(trigger(page));
      await trigger(page).evaluate((element) => {
        element.classList.add('fixture-transparent', 'fixture-visible');
      });
      await clip(page).evaluate((element) => element.classList.add('fixture-invisible'));
      await paint(page);
      await assertBox(trigger(page), before);
      assert.equal(await panel(page).evaluate((element) => element.matches(':popover-open')), true);
      await expectChanges(page, [true]);

      await trigger(page).evaluate((element) => {
        element.classList.remove('fixture-visible');
      });
      await waitClosed(page);
      await expectChanges(page, [true, false]);
      assert.equal(
        await trigger(page).evaluate((element) => element.getBoundingClientRect().height),
        before.height,
      );

      await clip(page).evaluate((element) => element.classList.remove('fixture-invisible'));
      await trigger(page).evaluate((element) => element.classList.remove('fixture-transparent'));
      await open(page, 'bottom');
      await trigger(page).evaluate((element) => element.classList.add('fixture-invisible'));
      await waitClosed(page);
      await expectChanges(page, [true, false, true, false]);
      await assertFocused(byId(page, 'fallback'));

      await trigger(page).evaluate((element) => element.classList.remove('fixture-invisible'));
      await open(page, 'bottom');
      await page.evaluate(() => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(
          ':root:has(#visibility-witness[data-hide-anchor]) #geometry-trigger { visibility: hidden; }',
        );
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        document.querySelector('#visibility-witness').setAttribute('data-hide-anchor', '');
      });
      await waitClosed(page);
      await expectChanges(page, [true, false, true, false, true, false]);
      await assertFocused(byId(page, 'fallback'));
    },

  'Popover resolves logical inline sides, updates live RTL and falls back to vertical': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1080, height: 680 });
    await mount('popover-geometry');
    await byId(page, 'side').evaluate((element) => element.click());
    await panel(page).evaluate((element) => {
      element.style.blockSize = '140px';
    });
    await open(page, 'end');
    const leftAnchor = await getBox(trigger(page));
    const leftPanel = await getBox(panel(page));
    assertNear(leftPanel.x, leftAnchor.x + leftAnchor.width + 8, 'flipped LTR inline gap');

    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    await page.locator('#geometry-panel:popover-open[data-side=start]').waitFor();
    const rtlAnchor = await getBox(trigger(page));
    const rtlPanel = await getBox(panel(page));
    assertNear(rtlPanel.x, rtlAnchor.x + rtlAnchor.width + 8, 'mirrored RTL inline gap');

    await clip(page).evaluate((element) => {
      element.style.left = '920px';
    });
    await page.locator('#geometry-panel:popover-open[data-side=end]').waitFor();
    const rightAnchor = await getBox(trigger(page));
    const rightPanel = await getBox(panel(page));
    assertNear(rightPanel.x + rightPanel.width + 8, rightAnchor.x, 'flipped RTL inline gap');

    await clip(page).evaluate((element) => {
      element.style.left = 'calc(50vw - 70px)';
    });
    await page.setViewportSize({ width: 360, height: 420 });
    await page.locator('#geometry-panel:popover-open[data-side=bottom]').waitFor();
    const narrowAnchor = await getBox(trigger(page));
    const narrowPanel = await getBox(panel(page));
    assertNear(narrowPanel.y, narrowAnchor.y + narrowAnchor.height + 8, 'vertical fallback gap');
    assert.ok(narrowPanel.x >= 15.5, 'leading viewport padding');
    assert.ok(narrowPanel.x + narrowPanel.width <= 344.5, 'trailing viewport padding');
    assert.equal(await panel(page).getAttribute('data-align'), 'center');

    await page.setViewportSize({ width: 760, height: 420 });
    await page.waitForFunction(() => {
      const surface = document.querySelector('#geometry-panel');
      return (
        surface.dataset.side === 'bottom' &&
        Math.abs(surface.getBoundingClientRect().width - 448) < 1
      );
    });
    await expectChanges(page, [true]);
  },

  'Popover holds the surface, heading and actions still while its body scrolls at 360px RTL':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 360, height: 430 });
      await mount('popover-geometry', {
        theme: 'frost-dark',
        direction: 'rtl',
        surface: 'overlay',
        textScale: 120,
        reducedMotion: 'reduce',
      });
      await open(page, 'bottom');
      const panelBox = await getBox(panel(page));
      const headingBox = await getBox(byId(page, 'header'));
      const footerBox = await getBox(byId(page, 'footer'));
      const body = byId(page, 'body');
      const bodyBox = await getBox(body);
      assert.ok(panelBox.x >= 15.5 && panelBox.x + panelBox.width <= 344.5);
      assert.ok(panelBox.y + panelBox.height <= 414.5);
      assert.ok(
        await body.evaluate((element) => element.scrollHeight > element.clientHeight),
        'the content overflows the body',
      );
      assert.deepEqual(
        await panel(page).evaluate((element) => {
          const { animationName, borderRadius } = getComputedStyle(element);
          return [animationName, borderRadius];
        }),
        ['none', '10px'],
      );

      await page.mouse.move(bodyBox.x + bodyBox.width / 2, bodyBox.y + bodyBox.height / 2);
      await page.mouse.wheel(0, 245);
      await page.waitForFunction(() => document.querySelector('#geometry-body').scrollTop > 0);
      await paint(page);
      const scrolled = await body.evaluate((element) => element.scrollTop);
      await paint(page);
      assert.equal(await body.evaluate((element) => element.scrollTop), scrolled);
      assert.equal(await panel(page).evaluate((element) => element.scrollTop), 0);
      await assertBox(panel(page), panelBox, { tolerance: 0.5 });
      await assertBox(byId(page, 'header'), headingBox, { tolerance: 0.5 });
      await assertBox(byId(page, 'footer'), footerBox, { tolerance: 0.5 });
    },

  'Popover keeps the close and last action reachable at extreme height in forced colors': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 218 });
    await mount('popover-geometry', {
      theme: 'pixel-light',
      textScale: 120,
      direction: 'rtl',
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await open(page, 'bottom');
    const close = page.getByRole('button', { name: 'Close popover' });
    await close.focus();
    await assertFocused(close);
    assert.equal(
      await panel(page).evaluate((element) => getComputedStyle(element).borderRadius),
      '0px',
    );
    await byId(page, 'last').click();
    assert.equal(await byId(page, 'log').getAttribute('data-actions'), '1');
    assert.ok(await panel(page).evaluate((element) => element.scrollTop > 0));
    await close.click();
    await waitClosed(page);
    await assertFocused(trigger(page));
  },

  'Popover switches scroll owners before the first body control and its outline are clipped':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 360, height: 330 });
      await mount('popover-geometry', { theme: 'frost-dark', textScale: 120, direction: 'rtl' });
      await open(page, 'bottom');
      await page.locator('#geometry-panel[data-unica-popover-scroll-panel]').waitFor();
      const first = byId(page, 'action');
      const last = byId(page, 'last');
      await first.focus();
      await assertFocused(first);
      const bounds = await getBox(panel(page));
      const control = await getBox(first);
      assert.ok(
        control.y >= bounds.y + 4 && control.y + control.height + 4 <= bounds.y + bounds.height,
      );
      await last.click();
      assert.ok(await panel(page).evaluate((element) => element.scrollTop > 0));
    },

  'Popover reveals keyboard focus inside the measured Body without scrolling the page': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 430 });
    await mount('popover-geometry', { theme: 'frost-dark', textScale: 120, direction: 'rtl' });
    await panel(page).evaluate((element) => {
      element.addEventListener(
        'beforetoggle',
        (event) => {
          if (event.newState === 'open') {
            const preface = document.createElement('p');
            preface.textContent = 'Review the document details before changing settings.';
            preface.style.blockSize = '450px';
            element.querySelector('#geometry-body').prepend(preface);
          }
        },
        { once: true },
      );
    });
    await trigger(page).focus();
    const pageScroll = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('#geometry-body')?.scrollTop > 0);
    const first = byId(page, 'action');
    await assertFocused(first);
    const owner = await getBox(byId(page, 'body'));
    const control = await getBox(first);
    assert.ok(
      control.y >= owner.y + 3.5 && control.y + control.height + 3.5 <= owner.y + owner.height,
    );
    assert.equal(await page.evaluate(() => window.scrollY), pageScroll);
  },

  'Popover updates the scroll owner when the first body control grows': async ({ page, mount }) => {
    await page.setViewportSize({ width: 360, height: 430 });
    await mount('popover-geometry', { theme: 'frost-dark', textScale: 120, direction: 'rtl' });
    await open(page, 'bottom');
    const outerScroll = page.locator('#geometry-panel[data-unica-popover-scroll-panel]');
    assert.equal(await outerScroll.count(), 0);
    const first = byId(page, 'action');
    await first.focus();
    await first.evaluate((element) => {
      element.style.minBlockSize = element.parentElement.clientHeight + 32 + 'px';
    });
    await outerScroll.waitFor();
    await assertFocused(first);
    await first.evaluate((element) => {
      element.style.minBlockSize = '';
    });
    await outerScroll.waitFor({ state: 'detached' });
    await assertFocused(first);
  },

  'Popover closes when an external CSS rule makes its anchor inert without resizing it': async ({
    page,
    mount,
  }) => {
    await mount('popover-geometry');
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent =
        ':root:has(#visibility-witness[data-inert-anchor]) #geometry-trigger { interactivity: inert }';
      document.head.append(style);
    });
    await open(page, 'bottom');
    const before = await getBox(trigger(page));
    await page.evaluate(() => {
      document.querySelector('#visibility-witness').setAttribute('data-inert-anchor', '');
    });
    await waitClosed(page);
    await expectChanges(page, [true, false]);
    await assertBox(trigger(page), before);
    assert.equal(
      await trigger(page).evaluate((element) => getComputedStyle(element).interactivity),
      'inert',
    );
  },

  'Popover updates the scroll owner when a tall link becomes tabbable': async ({ page, mount }) => {
    await page.setViewportSize({ width: 360, height: 430 });
    await mount('popover-geometry', { theme: 'frost-dark', textScale: 120, direction: 'rtl' });
    await open(page, 'bottom');
    const outerScroll = page.locator('#geometry-panel[data-unica-popover-scroll-panel]');
    assert.equal(await outerScroll.count(), 0);
    await byId(page, 'body').evaluate((element) => {
      const link = document.createElement('a');
      link.id = 'geometry-tall-link';
      link.textContent = 'Read the full document history';
      link.style.display = 'block';
      link.style.blockSize = element.clientHeight + 32 + 'px';
      element.prepend(link);
    });
    await paint(page);
    assert.equal(await outerScroll.count(), 0);
    const link = byId(page, 'tall-link');
    await link.evaluate((element) => {
      element.href = '#history';
    });
    await outerScroll.waitFor();
    await byId(page, 'action').focus();
    await page.keyboard.press('Shift+Tab');
    await assertFocused(link);
  },
};

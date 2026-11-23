import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

function nativeParts(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const thumb = getComputedStyle(element, '::-webkit-scrollbar-thumb');
    return {
      blockGutter:
        element.offsetHeight -
        element.clientHeight -
        parseFloat(style.borderTopWidth) -
        parseFloat(style.borderBottomWidth),
      inlineGutter:
        element.offsetWidth -
        element.clientWidth -
        parseFloat(style.borderLeftWidth) -
        parseFloat(style.borderRightWidth),
      thumb: {
        border: thumb.borderLeftWidth,
        clip: thumb.backgroundClip,
        cursor: thumb.cursor,
        minimum: thumb.minHeight,
        radius: thumb.borderTopLeftRadius,
      },
    };
  });
}

async function scrollByKeyboard(page, locator, key) {
  await locator.focus();
  await assertFocused(locator);
  await page.keyboard.press(key);
  const element = await locator.elementHandle();
  await page.waitForFunction((node) => node.scrollTop > 0, element);
}

async function assertToastGeometry(page, gutter, overflow, forcedColors = false) {
  const list = page.locator('.toast-list');
  const dimensions = await list.evaluate((node) => {
    const viewport = node.closest('.toast-viewport');
    const card = node.querySelector('.toast-card');
    const dock = viewport.querySelector('.toast-dock');
    const toastRect = viewport.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const listRect = node.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    const hostRect = viewport.parentElement.getBoundingClientRect();
    return {
      outer: listRect.width,
      client: node.clientWidth,
      reserved: node.offsetWidth - node.clientWidth,
      scrolls: node.scrollHeight > node.clientHeight,
      inlineOverflow: node.scrollWidth - node.clientWidth,
      inlineClip: listRect.left < hostRect.left - 0.5 || listRect.right > hostRect.right + 0.5,
      toastWidth: toastRect.width,
      cardWidth: cardRect.width,
      cardOffset: cardRect.left - toastRect.left,
      startOverhang:
        getComputedStyle(viewport).direction === 'rtl'
          ? listRect.right - toastRect.right
          : toastRect.left - listRect.left,
      dockGap: viewport.dataset.placement.startsWith('top')
        ? listRect.top - dockRect.bottom
        : dockRect.top - listRect.bottom,
    };
  });
  assert.equal(dimensions.reserved, gutter);
  assert.equal(dimensions.scrolls, overflow);
  assert.equal(dimensions.inlineOverflow, 0);
  assert.equal(dimensions.inlineClip, false);
  assert.equal(dimensions.cardOffset, 0);
  assert.equal(dimensions.cardWidth, dimensions.toastWidth);
  assert.equal(dimensions.startOverhang, 12);
  assert.equal(dimensions.dockGap, 4);
  const endPadding = forcedColors ? Math.min(12, Math.max(0, 24 - gutter)) : 12;
  assert.equal(dimensions.client, Math.round(dimensions.toastWidth) + 12 + endPadding);
  assert.equal(dimensions.outer, dimensions.toastWidth + 12 + endPadding + gutter);
}

export default {
  'Migrated scroll owners retain independent density, axes and native interaction': async ({
    page,
    mount,
  }) => {
    for (const [theme, surface, direction, radius] of [
      ['frost-dark', 'overlay', 'rtl', '9999px'],
      ['pixel-light', 'base', 'ltr', '0px'],
    ]) {
      await mount('scrollbar-owners', { theme, surface, direction, reducedMotion: 'reduce' });
      const code = page.getByRole('region', { name: 'Query log' });
      const codeParts = await nativeParts(code);
      assert.equal(codeParts.inlineGutter, 14);
      assert.equal(codeParts.blockGutter, 14);
      assert.deepEqual(codeParts.thumb, {
        border: '3px',
        clip: 'padding-box',
        cursor: 'default',
        minimum: '24px',
        radius,
      });
      assert.equal(await code.evaluate((node) => getComputedStyle(node).direction), 'ltr');

      await page.getByRole('button', { name: 'Open reference' }).click();
      const panel = page.locator('[popover]:popover-open').getByRole('region', {
        name: 'Reference entries',
      });
      for (const scroller of [
        page.getByTestId('nested-compact'),
        page.getByRole('menu', { name: 'Documents' }),
        page.getByRole('textbox', { name: 'Document list' }),
        panel,
      ]) {
        assert.equal((await nativeParts(scroller)).inlineGutter, 10);
      }
      const table = page.getByRole('region', { name: 'Document grid' });
      const tableParts = await nativeParts(table);
      assert.equal(tableParts.inlineGutter, 10);
      assert.equal(tableParts.blockGutter, 10);
      const fits = page.getByRole('region', { name: 'A single entry' });
      assert.equal((await nativeParts(fits)).inlineGutter, 0);
      assert.equal((await nativeParts(fits)).blockGutter, 0);

      const header = page.getByTestId('popover-header');
      const footer = page.getByTestId('popover-footer');
      await page.locator('[popover]:popover-open[data-side]').waitFor();
      const before = [await header.boundingBox(), await footer.boundingBox()];
      await scrollByKeyboard(page, panel, 'PageDown');
      assert.deepEqual([await header.boundingBox(), await footer.boundingBox()], before);
      await page.getByRole('button', { name: 'Close popover' }).click();
    }
    const code = page.getByRole('region', { name: 'Query log' });
    await code.scrollIntoViewIfNeeded();
    const rect = await code.boundingBox();
    assert.ok(rect);
    const track = rect.x + rect.width - 7;
    await page.mouse.move(track, rect.y + 12);
    await page.mouse.down();
    await page.mouse.move(track, rect.y + 54, { steps: 8 });
    await page.mouse.up();
    assert.ok(await code.evaluate((node) => node.scrollTop > 0), 'Native thumb dragged');
  },

  'Dialog transfers its compact scrollbar between the body and short-window panel': async ({
    page,
    mount,
  }) => {
    await mount('scrollbar-dialog', {
      theme: 'frost-light',
      direction: 'rtl',
      reducedMotion: 'reduce',
    });
    const panel = page.getByRole('dialog', { name: 'Document history' });
    const body = panel.locator('.dialog-body');
    const header = panel.locator('.dialog-header');
    const footer = panel.locator('.dialog-footer');
    assert.equal((await nativeParts(panel)).inlineGutter, 0);
    assert.equal((await nativeParts(body)).inlineGutter, 10);
    const before = [await header.boundingBox(), await footer.boundingBox()];
    await scrollByKeyboard(page, body, 'PageDown');
    assert.deepEqual([await header.boundingBox(), await footer.boundingBox()], before);

    await page.setViewportSize({ width: 360, height: 180 });
    await page.locator('.dialog-surface[data-whole-scroll]').waitFor();
    assert.equal((await nativeParts(panel)).inlineGutter, 10);
    assert.equal((await nativeParts(body)).inlineGutter, 0);
    assert.equal(await panel.getAttribute('tabindex'), '0');
    assert.equal(await body.getAttribute('tabindex'), '-1');
    await scrollByKeyboard(page, panel, 'PageDown');
  },

  'Expanded Toast preserves card width, shadows and dock while scrolling': async ({
    page,
    mount,
  }) => {
    for (const [width, height, textScale] of [
      [1200, 720, 100],
      [360, 440, 120],
    ]) {
      await page.setViewportSize({ width, height });
      for (const direction of ['ltr', 'rtl']) {
        await mount('scrollbar-toast', { direction, textScale, reducedMotion: 'reduce' });
        for (const placement of ['top-start', 'top-end', 'bottom-start', 'bottom-end']) {
          await page.getByLabel('Placement').selectOption(placement);
          await assertToastGeometry(page, 10, true);
        }
      }
    }
    const list = page.getByRole('group', { name: 'Notification list' });
    await list.focus();
    await assertFocused(list);
    await page.keyboard.press('Home');
    const element = await list.elementHandle();
    await page.waitForFunction((node) => node.scrollTop === 0, element);
    const last = list.getByRole('button', { name: 'Dismiss: Activity update 12' });
    await last.focus();
    await assertFocused(last);
    await page.keyboard.press('Enter');
    await last.waitFor({ state: 'detached' });

    await page.setViewportSize({ width: 1200, height: 720 });
    await page.getByLabel('Messages').selectOption('2');
    await assertToastGeometry(page, 0, false);

    await page.getByRole('button', { name: 'Collapse 2 notifications' }).click();
    const stack = page.locator('.toast-stack');
    assert.equal(await stack.evaluate((node) => getComputedStyle(node).overflowY), 'visible');
    assert.equal(await stack.evaluate((node) => node.classList.contains('unica-scrollbar')), false);
    await page.getByLabel('Messages').selectOption('1');
    assert.equal(await stack.evaluate((node) => getComputedStyle(node).overflowY), 'auto');
    assert.equal(await stack.evaluate((node) => node.classList.contains('unica-scrollbar')), true);
  },

  'Toast accommodates the scrollbar geometry in forced colors and touch-primary contexts': async ({
    page,
    mount,
  }) => {
    await mount('styles', { forcedColors: 'active' });
    const nativeGutter = (await nativeParts(page.getByTestId('native'))).inlineGutter;
    await page.setViewportSize({ width: 360, height: 440 });
    await mount('scrollbar-toast', { direction: 'rtl', forcedColors: 'active', textScale: 120 });
    await assertToastGeometry(page, nativeGutter, true, true);

    const touch = await page
      .context()
      .browser()
      .newContext({
        viewport: { width: 360, height: 440 },
        hasTouch: true,
        reducedMotion: 'reduce',
      });
    try {
      const touchPage = await touch.newPage();
      await touchPage.goto(page.url());
      await touchPage.locator('[data-browser-ready]').waitFor();
      assert.equal(await touchPage.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
      const list = touchPage.locator('.toast-list');
      assert.equal(
        await list.evaluate((element) => getComputedStyle(element).scrollbarWidth),
        'thin',
      );
      await assertToastGeometry(touchPage, (await nativeParts(list)).inlineGutter, true);
    } finally {
      await touch.close();
    }
  },

  'Expanded Toast settles gutter changes in the same scrollport without observer errors': async ({
    page,
    mount,
  }) => {
    await mount('styles', { forcedColors: 'active' });
    const systemGutter = (await nativeParts(page.getByTestId('native'))).inlineGutter;
    await page.setViewportSize({ width: 1200, height: 720 });
    await mount('scrollbar-toast', { reducedMotion: 'reduce' });
    await page.getByLabel('Messages').selectOption('2');
    const list = await page.locator('.toast-list').elementHandle();
    await page.evaluate(() => {
      window.toastWindowErrors = [];
      window.addEventListener('error', ({ message }) => window.toastWindowErrors.push(message));
    });
    const settle = async (gutter, overflow, forcedColors = false) => {
      await page.waitForFunction(
        ({ element, expectedGutter }) =>
          element.isConnected &&
          element.offsetWidth - element.clientWidth === expectedGutter &&
          getComputedStyle(element).getPropertyValue('--toast-scrollbar-gutter') ===
            `${expectedGutter}px`,
        { element: list, expectedGutter: gutter },
      );
      await assertToastGeometry(page, gutter, overflow, forcedColors);
    };

    await settle(0, false);
    await page.setViewportSize({ width: 1200, height: 230 });
    await settle(10, true);
    await page.emulateMedia({ forcedColors: 'active' });
    await settle(systemGutter, true, true);
    const widerTrack = await page.addStyleTag({
      content: '.toast-list::-webkit-scrollbar { width: 30px; }',
    });
    await settle(30, true, true);
    await widerTrack.evaluate((style) => style.remove());
    await settle(systemGutter, true, true);
    await page.emulateMedia({ forcedColors: 'none' });
    await settle(10, true);
    await page.setViewportSize({ width: 1200, height: 720 });
    await settle(0, false);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    assert.deepEqual(await page.evaluate(() => window.toastWindowErrors), []);
  },
};

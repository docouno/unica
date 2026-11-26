import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox, pressKeys } from '../helpers.mjs';

const drawer = (page) => page.locator('#geometry-drawer:modal');
const surface = (page) => drawer(page).locator('.unica-dialog-surface');
const grip = (page) => drawer(page).locator('.unica-drawer-grip');
const body = (page) => drawer(page).locator('.unica-dialog-body');

async function command(page, id) {
  await page.locator(`#${id}`).evaluate((node) => node.click());
}

async function openDrawer(page) {
  await page.getByRole('button', { name: 'Open geometry drawer' }).click();
  await drawer(page).waitFor();
}

async function side(page, value) {
  await page.locator(`#geometry-drawer:modal[data-unica-dialog-side="${value}"]`).waitFor();
}

async function closeRequests(page, value) {
  await page.waitForFunction(
    (count) => document.querySelector('#drawer-close-requests')?.textContent === String(count),
    value,
  );
}

async function assertAtBottom(page) {
  await page.waitForFunction(() => {
    const dialog = document.querySelector('#geometry-drawer:modal');
    const viewport = window.visualViewport;
    if (!dialog || !viewport) {
      return false;
    }
    const box = dialog.getBoundingClientRect();
    return (
      box.left >= viewport.offsetLeft - 1 &&
      box.right <= viewport.offsetLeft + viewport.width + 1 &&
      box.top >= viewport.offsetTop - 1 &&
      Math.abs(box.bottom - viewport.offsetTop - viewport.height) <= 1
    );
  });
}

async function center(locator) {
  const { x, y, width, height } = await getBox(locator);
  return [x + width / 2, y + height / 2];
}

async function assertCloseAlignment(close, targetSize, inlineTolerance) {
  await assertBox(close, { width: targetSize, height: targetSize });
  await assertBox(close.locator('svg'), { width: 14, height: 14 });
  const geometry = await close.evaluate((button) => {
    const header = button.closest('header');
    const title = header.querySelector('h2');
    const lineHeight = Number.parseFloat(getComputedStyle(title).lineHeight);
    const glyph = button.querySelector('svg').getBoundingClientRect();
    const panel = header.parentElement.getBoundingClientRect();
    const action = header.parentElement.querySelector('footer button:last-child');
    const actionBox = action.getBoundingClientRect();
    const target = button.getBoundingClientRect();
    const rtl = getComputedStyle(header).direction === 'rtl';
    return {
      inlineDelta: rtl ? glyph.left - actionBox.left : actionBox.right - glyph.right,
      blockDelta: glyph.top + glyph.height / 2 - title.getBoundingClientRect().top - lineHeight / 2,
      focusClearance: rtl ? target.left - panel.left : panel.right - target.right,
    };
  });
  assert.ok(
    Math.abs(geometry.blockDelta) <= 1,
    `Glyph is off the title line: ${geometry.blockDelta}px`,
  );
  assert.ok(
    Math.abs(geometry.inlineDelta) <= inlineTolerance,
    `Glyph is off the footer edge: ${geometry.inlineDelta}px`,
  );
  assert.ok(geometry.focusClearance >= 4, 'The focus outline fits inside the panel');
}

export default {
  'Dialog close follows the title line and content edge with native pointer targets': async ({
    page,
    mount,
  }) => {
    await mount('dialog', { theme: 'pixel-dark', reducedMotion: 'reduce' });
    await page.locator('#editor-trigger').click();
    const modal = page.locator('#project-editor:modal');
    const modalClose = modal.getByRole('button', { name: 'Close dialog' });
    await modalClose.waitFor();
    await assertCloseAlignment(modalClose, 30, 1);

    const client = await page.context().newCDPSession(page);
    try {
      await client.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      await page.setViewportSize({ width: 360, height: 650 });
      await mount('dialog-geometry', {
        theme: 'pixel-light',
        direction: 'rtl',
        textScale: 120,
        reducedMotion: 'reduce',
      });
      await openDrawer(page);
      await side(page, 'bottom');
      await assertAtBottom(page);
      const title = drawer(page).getByRole('heading', { name: 'Drawer layout' });
      const wraps = await title.evaluate((heading) => {
        heading.textContent = 'Long delivery settings title that wraps over more than one line';
        return heading.offsetHeight > Number.parseFloat(getComputedStyle(heading).lineHeight) * 1.5;
      });
      assert.ok(wraps);
      const drawerClose = drawer(page).getByRole('button', { name: 'Close drawer' });
      await assertCloseAlignment(drawerClose, 44, 4);
    } finally {
      await client.detach();
    }
  },

  'Drawer mirrors inline edges and Pixel cast and adapts without replacing the editing surface':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 601, height: 560 });
      await mount('dialog-geometry', {
        theme: 'pixel-light',
        direction: 'rtl',
        reducedMotion: 'reduce',
      });
      await openDrawer(page);
      await side(page, 'end');
      const original = await drawer(page).elementHandle();
      assert.ok(original);
      await assertBox(drawer(page), { x: 0, y: 0, height: 560 }, { tolerance: 1 });
      assert.match(
        await surface(page).evaluate((node) => getComputedStyle(node).boxShadow),
        /\b6px 0px 0px 0px/,
      );
      assert.equal(await grip(page).count(), 0);
      const field = drawer(page).getByRole('textbox', { name: 'Drawer draft' });
      await field.fill('same draft');
      await field.evaluate((node) => node.setSelectionRange(2, 6));
      await body(page).evaluate((node) => {
        node.scrollTop = 46;
      });
      await page.setViewportSize({ width: 600, height: 560 });
      await side(page, 'bottom');
      await assertAtBottom(page);
      await assertBox(grip(page), { width: 96, height: 44 });
      await assertBox(grip(page).locator('span'), { width: 32, height: 4 });
      assert.equal(
        await grip(page)
          .locator('span')
          .evaluate((node) => getComputedStyle(node).borderRadius),
        '0px',
      );
      await assertFocused(field);
      assert.equal(await field.inputValue(), 'same draft');
      assert.deepEqual(
        await field.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [2, 6],
      );
      assert.equal(await body(page).evaluate((node) => node.scrollTop), 46);
      await page.setViewportSize({ width: 601, height: 560 });
      await side(page, 'end');
      assert.equal(
        await original.evaluate((node) => node.matches(':modal') && node.id === 'geometry-drawer'),
        true,
      );
      await assertFocused(field);
      await command(page, 'side-start');
      await side(page, 'start');
      const { x, width, y, height } = await getBox(drawer(page));
      assert.ok(Math.abs(x + width - 601) <= 1 && y === 0 && height === 560);
      assert.match(
        await surface(page).evaluate((node) => getComputedStyle(node).boxShadow),
        / -6px 0px 0px 0px/,
      );
      await command(page, 'side-top');
      await side(page, 'top');
      await assertBox(drawer(page), { y: 0 }, { tolerance: 1 });
      assert.match(
        await surface(page).evaluate((node) => getComputedStyle(node).boxShadow),
        /\b0px 6px 0px 0px/,
      );
      await closeRequests(page, 0);
    },

  'Drawer tracks the actual visual viewport and keeps focused form state at 120% text': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await mount('dialog-geometry', {
      theme: 'frost-light',
      textScale: 120,
      reducedMotion: 'reduce',
    });
    await openDrawer(page);
    await side(page, 'end');
    const field = drawer(page).getByRole('textbox', { name: 'Drawer draft' });
    await field.fill('Live viewport');
    await field.evaluate((node) => node.setSelectionRange(3, 7));
    const client = await page.context().newCDPSession(page);
    try {
      await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
      await page.waitForFunction(() => {
        const viewport = window.visualViewport;
        return (
          innerWidth === 800 &&
          innerHeight === 600 &&
          viewport.width < innerWidth &&
          viewport.height < innerHeight
        );
      });
      await side(page, 'bottom');
      await assertAtBottom(page);
      await assertFocused(field);
      assert.equal(await field.inputValue(), 'Live viewport');
      assert.deepEqual(
        await field.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [3, 7],
      );
      const save = drawer(page).getByRole('button', { name: 'Save drawer' });
      await save.evaluate((node) => node.scrollIntoView({ block: 'nearest' }));
      assert.equal(
        await save.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return node.contains(
            document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
          );
        }),
        true,
      );
      await save.press('Enter');
      assert.equal(await page.locator('#drawer-form-submits').textContent(), '1');
    } finally {
      await client.detach();
    }
  },

  'Drawer moves scroll ownership only when short reading space actually conceals content': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 380, height: 460 });
    await mount('dialog-geometry', { textScale: 120, reducedMotion: 'reduce' });
    await openDrawer(page);
    await side(page, 'bottom');
    const panel = surface(page);
    const wholeScroll = panel.and(page.locator('[data-unica-dialog-whole-scroll]'));
    await panel
      .and(
        page.locator('[data-unica-dialog-after-content]:not([data-unica-dialog-before-content])'),
      )
      .waitFor();
    const footer = drawer(page).locator('.unica-dialog-footer');
    const originalFooterY = (await getBox(footer)).y;
    await body(page).focus();
    await assertFocused(body(page));
    await pressKeys(page, 'PageDown');
    await panel
      .and(page.locator('[data-unica-dialog-before-content][data-unica-dialog-after-content]'))
      .waitFor();
    assert.equal((await getBox(footer)).y, originalFooterY);
    await body(page).evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await panel
      .and(
        page.locator('[data-unica-dialog-before-content]:not([data-unica-dialog-after-content])'),
      )
      .waitFor();

    await page.setViewportSize({ width: 380, height: 210 });
    await wholeScroll.waitFor();
    assert.equal(await panel.getAttribute('data-unica-dialog-before-content'), null);
    assert.equal(await panel.getAttribute('data-unica-dialog-after-content'), null);
    await panel.focus();
    await assertFocused(panel);
    await pressKeys(page, 'Home', 'PageDown');
    await page.waitForFunction(() => document.querySelector('.unica-dialog-surface').scrollTop > 0);
    await page.setViewportSize({ width: 380, height: 460 });
    await panel.and(page.locator(':not([data-unica-dialog-whole-scroll])')).waitFor();

    await page.setViewportSize({ width: 380, height: 290 });
    await wholeScroll.waitFor();
    await command(page, 'short-form');
    await drawer(page).getByText('Short content').waitFor();
    await panel
      .and(
        page.locator(
          ':not([data-unica-dialog-whole-scroll], [data-unica-dialog-before-content], [data-unica-dialog-after-content])',
        ),
      )
      .waitFor();
  },

  'Drawer bottom grip follows the primary pointer and settles under cancel or a refused close':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 390, height: 540 });
      await mount('dialog-geometry', { reducedMotion: 'reduce' });
      await openDrawer(page);
      const initial = await getBox(surface(page));
      const [x, y] = await center(grip(page));
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y - 12);
      assert.equal((await getBox(surface(page))).y, initial.y);
      await page.mouse.move(x, y + 20);
      await assertBox(surface(page), { y: initial.y + 20 }, { tolerance: 1 });
      assert.ok(
        Number(
          await drawer(page).evaluate((node) => getComputedStyle(node, '::backdrop').opacity),
        ) < 1,
      );
      await page.mouse.up();
      await assertBox(surface(page), { y: initial.y }, { tolerance: 1 });
      await closeRequests(page, 0);

      await grip(page).evaluate((node) => {
        node.addEventListener(
          'pointerdown',
          (event) => {
            node.dataset.pointer = String(event.pointerId);
          },
          { once: true },
        );
      });
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + 145);
      await assertBox(surface(page), { y: initial.y + 145 }, { tolerance: 1 });
      await grip(page).evaluate((node) => node.releasePointerCapture(Number(node.dataset.pointer)));
      await page.mouse.move(x, y + 146);
      await page.mouse.up();
      await assertBox(surface(page), { y: initial.y }, { tolerance: 1 });
      await closeRequests(page, 0);

      for (const [distance, count] of [
        [119, 0],
        [120, 1],
      ]) {
        await page.mouse.move(x, y);
        await page.mouse.down();
        // The delay keeps both gestures below the velocity threshold.
        await page.waitForTimeout(250);
        await page.mouse.move(x, y + distance);
        await page.mouse.up();
        await closeRequests(page, count);
        await assertBox(surface(page), { y: initial.y }, { tolerance: 1 });
      }
      await drawer(page).waitFor();
      await command(page, 'swipe-off');
      await grip(page).waitFor({ state: 'detached' });
      await command(page, 'allow-close');
      await drawer(page).getByRole('button', { name: 'Close drawer' }).click();
      await drawer(page).waitFor({ state: 'detached' });
      await closeRequests(page, 2);
      await assertFocused(page.getByRole('button', { name: 'Open geometry drawer' }));
    },

  'Drawer exposes its system boundary and grip with forced colors and honors reduced motion':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 380, height: 540 });
      await mount('dialog-geometry', {
        theme: 'frost-light',
        forcedColors: 'active',
        reducedMotion: 'reduce',
      });
      await openDrawer(page);
      const contrast = await surface(page).evaluate((node) => {
        const computed = getComputedStyle(node);
        const bar = getComputedStyle(node.querySelector('.unica-drawer-grip > span'));
        return {
          background: computed.backgroundColor,
          border: computed.borderTopColor,
          borderWidth: Number.parseFloat(computed.borderTopWidth),
          bar: bar.backgroundColor,
          surfaceAnimation: computed.animationName,
          backdropAnimation: getComputedStyle(node.closest('dialog'), '::backdrop').animationName,
          shadow: computed.boxShadow,
        };
      });
      assert.notEqual(contrast.background, contrast.border);
      assert.ok(contrast.borderWidth >= 1);
      assert.notEqual(contrast.background, contrast.bar);
      assert.equal(contrast.shadow, 'none');
      assert.equal(contrast.surfaceAnimation, 'none');
      assert.equal(contrast.backdropAnimation, 'none');
    },
};

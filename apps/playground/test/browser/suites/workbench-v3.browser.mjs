import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { assertFocused } from '../helpers.mjs';

async function navigate(page, params) {
  await page.evaluate((nextParams) => {
    document.documentElement.removeAttribute('data-wb-ready');
    const url = new URL(window.location.href);
    url.search = '';
    for (const [key, value] of Object.entries(nextParams)) {
      url.searchParams.set(key, value);
    }
    history.pushState(null, '', url);
    dispatchEvent(new PopStateEvent('popstate'));
  }, params);
}

async function checkReferenceNames(page) {
  const table = page.getByRole('table', { name: 'Recovery references' });
  await table.waitFor({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Next page', exact: true }).press('Enter');
  await page.evaluate(() => document.fonts.ready);
  for (const name of ['Volume snapshots', 'Restore point retention']) {
    const lines = await table.getByText(name, { exact: true }).evaluate((label) => {
      const text = label.firstChild;
      const range = document.createRange();
      range.setStart(text, text.textContent.lastIndexOf(' ') + 1);
      range.setEnd(text, text.length);
      return range.getClientRects().length;
    });
    assert.equal(lines, 1, name);
  }
}

function tagLabelByText(scope, text) {
  return scope.locator('[data-unica-tag-part="label"]').getByText(text, { exact: true });
}

async function assertLabelFits(label, name) {
  const lines = await label.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getClientRects().length;
  });
  assert.equal(lines, 1, name + ' must fit on one line');
}

async function boundsLeavesTextVisible(locator) {
  return locator.evaluate(async (node) => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const text = document.createRange();
    text.selectNodeContents(node);
    const ink = text.getBoundingClientRect();
    return [...node.closest('.wb-artboard').querySelectorAll('[data-wb-bounds-label]')].every(
      (label) => {
        const box = label.getBoundingClientRect();
        return (
          box.right <= ink.left ||
          box.left >= ink.right ||
          box.bottom <= ink.top ||
          box.top >= ink.bottom
        );
      },
    );
  });
}

export default {
  'Open HoverCard previews survive changing the comparison surface': async ({ page, origin }) => {
    await page.goto(
      new URL(
        '/?item=hover-card&tab=compositions&block=identity&family=frost&scheme=both&surface=base',
        origin,
      ).href,
      { waitUntil: 'domcontentloaded' },
    );
    const frames = page.locator('[data-wb-block="identity"] iframe');
    const preview = (index) => frames.nth(index).contentFrame().locator(':popover-open');
    await preview(0).waitFor({ timeout: 20_000 });
    await preview(1).waitFor();
    await page.getByRole('combobox', { name: 'Surface', exact: true }).selectOption('overlay');
    for (const index of [0, 1]) {
      await frames
        .nth(index)
        .contentFrame()
        .locator('.hint-example-viewport-content[data-surface="overlay"]')
        .waitFor();
      await preview(index).waitFor();
    }
  },

  'An editor keeps its modal open for Escape during IME composition': async ({ page, origin }) => {
    await page.goto(
      new URL('/?item=modal&tab=states&block=guard&family=frost&scheme=both', origin).href,
    );
    const frames = page.locator('[data-wb-block="guard"] iframe[title="Project editor example"]');
    const owner = frames.first().contentFrame();
    const name = owner.getByRole('textbox', { name: /^Project name/ });
    const peer = frames
      .last()
      .contentFrame()
      .getByRole('textbox', { name: /^Project name/ });
    await name.waitFor({ timeout: 20_000 });
    const peerValue = await peer.inputValue();
    await name.click();
    await name.press('End');
    await name.evaluate((node) => {
      const records = [];
      for (const type of ['compositionstart', 'compositionend', 'keydown', 'keyup', 'cancel']) {
        node.ownerDocument.addEventListener(
          type,
          (event) => {
            records.push([event.type, event.key, event.isComposing, event.keyCode]);
            node.dataset.imeTrace = JSON.stringify(records);
          },
          true,
        );
      }
    });
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.imeSetComposition', {
        text: 'とう',
        selectionStart: 2,
        selectionEnd: 2,
      });
      await page.keyboard.press('Escape');
      assert.equal(
        await owner.getByRole('alertdialog').count(),
        0,
        await name.getAttribute('data-ime-trace'),
      );
      assert.ok(await name.evaluate((input) => input === document.activeElement));

      await session.send('Input.insertText', { text: '東京' });
      const accepted = await name.inputValue();
      assert.ok(accepted.endsWith('東京'));
      await name.evaluate((input) => input.setSelectionRange(2, 5));
      await page.keyboard.press('Escape');
      const confirmation = owner.getByRole('alertdialog', { name: 'Discard unsaved changes?' });
      await confirmation.waitFor();
      assert.ok(await confirmation.evaluate((node) => node.matches(':modal')));
      assert.equal(await owner.locator('dialog:modal').count(), 2);
      assert.equal(await frames.last().contentFrame().locator('dialog:modal').count(), 1);
      await confirmation.getByRole('button', { name: 'Keep editing' }).press('Enter');
      assert.ok(await name.evaluate((input) => input === document.activeElement));
      assert.equal(await name.inputValue(), accepted);
      assert.deepEqual(
        await name.evaluate((input) => [input.selectionStart, input.selectionEnd]),
        [2, 5],
      );
      assert.equal(await peer.inputValue(), peerValue);
      await page.keyboard.press('Escape');
      await confirmation.getByRole('button', { name: 'Discard changes' }).click();
      await owner.locator('dialog:modal').first().waitFor({ state: 'detached' });
      assert.equal(await owner.locator('dialog:modal').count(), 0);
      await owner.getByRole('button', { name: 'Edit project' }).click();
      assert.equal(await name.inputValue(), peerValue);
    } finally {
      await session.detach();
    }
  },

  'Two Escape keys return from an inline submenu to its own trigger': async ({ page, origin }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    const route = new URL(
      '/?item=menu&tab=states&block=live&family=soft&scheme=both&vp=768',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const board = page.locator('[data-wb-block="live"] .wb-artboard').first();
    const trigger = board.getByRole('button', { name: 'View options' });
    await trigger.waitFor({ timeout: 20_000 });
    await trigger.press('ArrowDown');
    await board.getByRole('menuitemcheckbox', { name: 'Preview' }).press('End');
    await board.getByRole('menuitem', { name: 'Sort by' }).press('ArrowRight');
    const child = board.getByRole('menu', { name: 'Sort by' });
    const firstChoice = child.getByRole('menuitemradio', { name: 'Last modified' });
    await page.waitForFunction(
      (row) => row === document.activeElement,
      await firstChoice.elementHandle(),
    );
    assert.equal(await board.getByRole('menu').count(), 1);

    // Capture which row owns focus when the parent list replaces the child.
    const transition = await child.evaluateHandle((panel) => {
      const state = { focused: false };
      const observer = new MutationObserver(() => {
        const parentRow = panel.querySelector('[role="menuitem"][aria-haspopup="menu"]');
        if (parentRow) {
          observer.disconnect();
          state.focused = parentRow === document.activeElement;
        }
      });
      observer.observe(panel, { childList: true, subtree: true });
      return state;
    });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    assert.ok(
      await transition.evaluate((state) => state.focused),
      'Restoring the parent list lost focus',
    );
    await board.getByRole('menu').waitFor({ state: 'hidden' });
    assert.ok(await trigger.evaluate((button) => button === document.activeElement));
  },

  'Escape dismisses a hovered frame preview while the catalog keeps keyboard focus': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 2000, height: 950 });
    const route = new URL(
      '/?item=hover-card&tab=states&block=interaction&family=frost&scheme=both&vp=360&dir=rtl',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const frames = page.locator('[data-wb-block="interaction"] .wb-artboard iframe');
    const owner = frames.first().contentFrame();
    const peer = frames.last().contentFrame();
    const link = owner.getByRole('link');
    const card = owner.locator('.unica-hover-card:popover-open');
    const outside = page
      .getByRole('group', { name: 'Component status' })
      .getByRole('button', { name: 'UI', exact: true });
    await link.waitFor({ timeout: 20_000 });
    assert.equal(await frames.count(), 2);
    await outside.focus();
    await link.hover();
    await card.waitFor();
    assert.ok(await outside.evaluate((node) => node === document.activeElement));
    await page.keyboard.press('Escape');
    await card.waitFor({ state: 'hidden' });
    assert.ok(await outside.evaluate((node) => node === document.activeElement));
    assert.equal(await peer.locator('.unica-hover-card:popover-open').count(), 0);

    const side = page
      .locator('[data-wb-block="interaction"]')
      .getByRole('combobox', { name: 'Side', exact: true });
    await outside.hover();
    await side.focus();
    await link.hover();
    await card.waitFor();
    await side.press('Alt+ArrowDown');
    const selector = await side.elementHandle();
    await page.waitForFunction((select) => select.matches(':open'), selector);
    await page.keyboard.press('Escape');
    await page.waitForFunction((select) => !select.matches(':open'), selector);
    assert.ok(await card.isVisible(), 'The open native selector owns its first Escape key');
    await page.keyboard.press('Escape');
    await card.waitFor({ state: 'hidden' });
  },

  'Modal artboards preserve native layers, scoped theme overrides and measured bounds': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    const route = new URL(
      '/?item=modal&tab=states&block=guard&family=pixel&scheme=both&vp=360&scale=120&dir=rtl&bounds=1&freeze=1',
      origin,
    );
    await page.goto(route.href);
    const scope = page.locator('[data-wb-block="guard"]');
    const cell = (theme) =>
      scope.locator(`.wb-artboard[data-theme="${theme}"] iframe[title="Project editor example"]`);
    const dark = cell('pixel-dark').contentFrame();
    const light = cell('pixel-light').contentFrame();
    const panel = dark.locator('dialog:modal[data-wb-subject]');
    const peer = light.locator('dialog:modal[data-wb-subject]');
    const bounds = dark.locator('[data-wb-bounds-label]');
    await bounds.waitFor({ timeout: 20_000 });
    await peer.waitFor();
    const carrier = await panel.elementHandle();
    const nativeFrame = await carrier.ownerFrame();
    const readBackdrop = (node) => getComputedStyle(node, '::backdrop').backgroundColor;
    const peerBackdrop = await peer.evaluate(readBackdrop);
    assert.equal(await panel.evaluate(readBackdrop), 'rgba(10, 6, 16, 0.6)');
    assert.equal(await dark.locator('.hint-example-scrim').count(), 0);
    assert.equal(await dark.locator('[data-unica-underlay]').count(), 1);
    const geometry = await panel.evaluate((node) => {
      const { width, height } = node.getBoundingClientRect();
      return {
        width: window.innerWidth,
        dir: document.documentElement.dir,
        scale: getComputedStyle(node).getPropertyValue('--font-scale').trim(),
        container: getComputedStyle(node.parentElement).containerName,
        label: `${Math.round(width)} × ${Math.round(height)} px`,
      };
    });
    assert.deepEqual(geometry, {
      width: 360,
      dir: 'rtl',
      scale: '1.2',
      container: 'artboard',
      label: await bounds.textContent(),
    });

    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    const editor = page.getByRole('region', { name: 'Theme editor' });
    await editor.getByRole('combobox', { name: 'Theme preset' }).selectOption('pixel-dark');
    await editor.getByRole('searchbox', { name: 'Filter tokens' }).fill('Modal Scrim');
    await editor
      .getByRole('textbox', { name: 'Modal Scrim', exact: true })
      .fill('rgb(180 10 20 / 0.45)');
    await nativeFrame.waitForFunction(
      (node) => getComputedStyle(node, '::backdrop').backgroundColor === 'rgba(180, 10, 20, 0.45)',
      carrier,
    );
    assert.ok(await panel.evaluate((node, original) => node === original, carrier));
    assert.equal(await peer.evaluate(readBackdrop), peerBackdrop);

    route.searchParams.delete('bounds');
    await navigate(page, Object.fromEntries(route.searchParams));
    await bounds.waitFor({ state: 'detached' });
    assert.equal(await panel.evaluate(readBackdrop), 'rgba(180, 10, 20, 0.45)');
    route.searchParams.set('raw', '1');
    await page.goto(route.href);
    await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 20_000 });
    const rawPanel = page
      .locator('.wb-artboard[data-theme="pixel-dark"] iframe[title="Project editor example"]')
      .contentFrame()
      .locator('dialog:modal');
    assert.equal(await rawPanel.evaluate(readBackdrop), 'rgba(10, 6, 16, 0.6)');
  },

  'Drawer Playground uses the selected 360px native viewport on Base and Overlay': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    for (const surface of ['base', 'overlay']) {
      const route = new URL(
        `/?item=drawer&tab=playground&family=pixel&scheme=light&vp=360&surface=${surface}`,
        origin,
      );
      await page.goto(route.href);
      const iframe = page.locator('iframe[title="Activity details example"]');
      await iframe.contentFrame().getByRole('button', { name: 'View activity details' }).waitFor({
        timeout: 20_000,
      });
      const sizes = await iframe.evaluate((node) => ({
        board: node.closest('.wb-artboard').clientWidth,
        frame: node.contentWindow.innerWidth,
        visual: node.contentWindow.visualViewport.width,
      }));
      assert.deepEqual(sizes, { board: 360, frame: 360, visual: 360 }, surface);
    }
  },

  'Modal and Drawer States keep their selected native viewport inside the matrix': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1560, height: 950 });
    for (const [item, mode, viewport] of [
      ['drawer', 'mode=pairwise', 360],
      ['drawer', 'slice=dimensions', 768],
      ['modal', 'slice=dimensions', 768],
    ]) {
      const route = new URL(
        `/?item=${item}&tab=states&${mode}&family=pixel&scheme=light&vp=${viewport}&scale=120&dir=rtl&raw=1`,
        origin,
      );
      await page.goto(route.href, { waitUntil: 'domcontentloaded' });
      const iframe = page.locator('.wb-matrix-artboard iframe').first();
      await iframe.contentFrame().locator('dialog:modal').waitFor({ timeout: 20_000 });
      const measured = await iframe.evaluate((node) => {
        const frame = node.getBoundingClientRect();
        const board = node.closest('.wb-cell').getBoundingClientRect();
        return {
          width: node.contentWindow.innerWidth,
          visual: node.contentWindow.visualViewport.width,
          visible: board.left <= frame.left + 1 && board.right >= frame.right - 1,
        };
      });
      assert.deepEqual(
        measured,
        { width: viewport, visual: viewport, visible: true },
        route.search,
      );
    }
  },

  'Touch launches the project editor at its title and its overlay notice returns focus': async ({
    page,
    origin,
    watchPage,
  }) => {
    const touch = await page
      .context()
      .browser()
      .newContext({
        hasTouch: true,
        viewport: { width: 1500, height: 950 },
      });
    try {
      const canvas = watchPage(await touch.newPage());
      await canvas.goto(
        new URL('/?item=modal&tab=states&block=editor&family=frost&scheme=dark&vp=360', origin)
          .href,
      );
      const frame = canvas
        .locator('[data-wb-block="editor"] iframe[title="Project editor example"]')
        .contentFrame();
      const panel = frame.getByRole('dialog', { name: 'Edit project' });
      await panel.getByRole('button', { name: 'Cancel' }).tap();
      const opener = frame.getByRole('button', { name: 'Edit project' });
      await opener.evaluate((node) => {
        node.ownerDocument.addEventListener('focusin', (event) => {
          if (event.target.closest('dialog:modal')) {
            node.dataset.firstModalFocus ??= event.target.tagName;
          }
        });
      });
      await opener.tap();
      assert.equal(
        await panel.evaluate((node) => node.ownerDocument.activeElement.textContent),
        'Edit project',
      );
      assert.equal(
        await frame.locator('[data-first-modal-focus]').getAttribute('data-first-modal-focus'),
        'H2',
      );

      await canvas.goto(
        new URL(
          '/?item=modal&tab=compositions&block=details&family=frost&scheme=dark&vp=360',
          origin,
        ).href,
      );
      const details = canvas.locator('iframe[title="Export details example"]').contentFrame();
      const dialog = details.getByRole('dialog', { name: 'Export details' });
      await dialog.getByRole('button', { name: 'Dismiss' }).tap();
      assert.ok(
        await dialog.getByRole('heading').evaluate((node) => node === document.activeElement),
      );
      assert.equal(await dialog.getByText('Export ready', { exact: true }).count(), 0);
      await dialog.getByRole('button', { name: 'Close export details' }).tap();
      await dialog.waitFor({ state: 'hidden' });
      await assertFocused(details.getByRole('button', { name: 'View export details' }));
    } finally {
      await touch.close();
    }
  },

  'Drawer scrolls the whole panel when the keyboard leaves too little room': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    const route = new URL(
      '/?item=drawer&tab=states&block=overflow&vp=768&scale=120&dir=rtl',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const story = page.locator('section[data-wb-block="overflow"]');
    const setting = story.getByRole('combobox', { name: 'Available height' }).first();
    await setting.waitFor({ timeout: 20_000 });
    const iframe = story.locator('iframe[title="Delivery settings example"]').first();
    const panel = iframe.contentFrame().getByRole('dialog');
    const surface = panel.locator('.unica-dialog-surface');
    const note = panel.getByRole('textbox', { name: 'Digest note' });
    await note.press('End');
    const frame = await (await iframe.elementHandle()).contentFrame();
    await setting.selectOption('keyboard');
    await frame.waitForFunction(
      (node) => node.tabIndex === 0 && node.scrollHeight > node.clientHeight,
      await surface.elementHandle(),
    );
    await frame.waitForFunction(
      (node) => {
        const panelRect = node.closest('[role="dialog"]').getBoundingClientRect();
        const editorRect = node.getBoundingClientRect();
        return (
          node === document.activeElement &&
          editorRect.top >= panelRect.top - 1 &&
          editorRect.bottom <= panelRect.bottom + 1
        );
      },
      await note.elementHandle(),
    );
    await surface.press('End');
    const save = panel.getByRole('button', { name: 'Save settings' });
    await frame.waitForFunction(
      (button) => {
        const panelRect = button.closest('[role="dialog"]').getBoundingClientRect();
        const actionRect = button.getBoundingClientRect();
        return actionRect.top >= panelRect.top && actionRect.bottom <= panelRect.bottom + 1;
      },
      await save.elementHandle(),
    );
    await save.press('Escape');
    await panel.waitFor({ state: 'hidden' });
    await assertFocused(
      iframe.contentFrame().getByRole('button', { name: 'Edit delivery settings' }),
    );
  },

  'Drawer handle follows the pointer in a scaled artboard': async ({ page, origin }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    const route = new URL('/?item=drawer&tab=states&block=sheet&vp=768&scale=120&dir=rtl', origin);
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const iframe = page
      .locator('section[data-wb-block="sheet"] iframe[title="Delivery settings example"]')
      .first();
    const frame = iframe.contentFrame();
    const panel = frame.getByRole('dialog');
    const surface = panel.locator('.unica-dialog-surface');
    const grip = panel.locator('.unica-drawer-grip');
    await grip.waitFor({ timeout: 20_000 });
    await grip.scrollIntoViewIfNeeded();
    await surface.evaluate((node) =>
      Promise.all(node.getAnimations().map((motion) => motion.finished)),
    );
    const localGrip = await grip.evaluate((node) => node.getBoundingClientRect().toJSON());
    const embedding = await iframe.evaluate((node) => ({
      ...node.getBoundingClientRect().toJSON(),
      scale: node.getBoundingClientRect().width / node.offsetWidth,
    }));
    const before = await surface.evaluate((node) => node.getBoundingClientRect().y);
    const x = embedding.x + (localGrip.x + localGrip.width / 2) * embedding.scale;
    const y = embedding.y + (localGrip.y + localGrip.height / 2) * embedding.scale;
    await page.mouse.move(x, y);
    await page.mouse.down();
    try {
      await page.mouse.move(x, y + 12, { steps: 4 });
      const after = await surface.evaluate((node) => node.getBoundingClientRect().y);
      const displacement = (after - before) * embedding.scale;
      assert.ok(
        Math.abs(displacement - 12) <= 1,
        `The sheet moved ${displacement}px for a 12px drag`,
      );
    } finally {
      await page.mouse.up();
    }
    assert.equal(await panel.isVisible(), true);
  },

  'Drawer backdrop keeps focus and consumes a dismissing tap above the opener': async ({
    page,
    origin,
    watchPage,
  }) => {
    const touch = await page
      .context()
      .browser()
      .newContext({ hasTouch: true, viewport: { width: 1500, height: 950 } });
    try {
      const canvas = watchPage(await touch.newPage());
      const route = new URL(
        '/?item=drawer&tab=playground&family=frost&scheme=dark&vp=1440',
        origin,
      );
      await canvas.goto(route.href, { waitUntil: 'domcontentloaded' });
      const frame = canvas
        .locator('iframe[title="Activity details example"]')
        .first()
        .contentFrame();
      const opener = frame.getByRole('button', { name: 'View activity details', exact: true });
      const panel = frame.getByRole('dialog', { name: 'Release notes', exact: true });
      await opener.waitFor({ timeout: 20_000 });
      const trigger = await opener.elementHandle();
      for (const dismissible of [false, true]) {
        if (dismissible) {
          await canvas.getByRole('checkbox', { name: /^dismissOnBackdrop/i }).check();
        }
        await opener.press('Enter');
        await panel.waitFor();
        assert.equal(
          await panel.evaluate(
            (node) =>
              node.ownerDocument.getElementById(node.getAttribute('aria-describedby'))?.textContent,
          ),
          'QA approved version 3.',
        );
        await panel.getByText('QA approved version 3.', { exact: true }).waitFor();
        const hitsBackdrop = await trigger.evaluate((button) => {
          const box = button.getBoundingClientRect();
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;
          const dialog = document.querySelector('dialog:modal');
          const rect = dialog.getBoundingClientRect();
          return document.elementFromPoint(x, y) === dialog && (x < rect.left || x > rect.right);
        });
        assert.ok(hitsBackdrop, 'The native backdrop must cover the opener at the tested point');
        const box = await trigger.boundingBox();
        const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        if (dismissible) {
          await canvas.touchscreen.tap(point.x, point.y);
        } else {
          await canvas.mouse.click(point.x, point.y);
          assert.ok(await panel.evaluate((node) => node.contains(document.activeElement)));
          await canvas.keyboard.press('Escape');
        }
        await panel.waitFor({ state: 'hidden' });
        assert.equal(await frame.locator('dialog:modal').count(), 0);
        assert.ok(await trigger.evaluate((node) => node === document.activeElement));
      }
    } finally {
      await touch.close();
    }
  },

  'Listbox size comparisons show readable roles with independent selection': async ({
    page,
    origin,
  }) => {
    await page.goto(
      new URL(
        '/?item=listbox&tab=states&slice=sizes&family=frost&scheme=light&vp=360&scale=120&dir=rtl&surface=overlay&freeze=1',
        origin,
      ).href,
    );
    const lists = page.locator('[data-wb-slice="sizes"] [role="listbox"]');
    await lists.last().waitFor({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await lists.count(), 6);
    for (const list of await lists.all()) {
      for (const label of ['Viewer', 'Commenter', 'Editor', 'Administrator']) {
        await assertLabelFits(list.getByText(label, { exact: true }), label);
      }
      const viewer = list.getByRole('option', { name: 'Viewer', exact: true });
      const editor = list.getByRole('option', { name: 'Editor', exact: true });
      assert.equal(await viewer.getAttribute('aria-selected'), 'false');
      assert.equal(await editor.getAttribute('aria-selected'), 'true');
      await viewer.click();
      assert.equal(await viewer.getAttribute('aria-selected'), 'true');
      assert.equal(
        await editor.getAttribute('aria-selected'),
        String((await list.getAttribute('aria-multiselectable')) === 'true'),
      );
    }
    const last = lists.last();
    const region = last.locator('xpath=ancestor::*[@role="region"][1]');
    await last.getByRole('option', { name: 'Viewer', exact: true }).hover();
    await region.evaluate((node) => {
      node.scrollLeft = 0;
    });
    await page.mouse.wheel(-100, 0);
    await page.waitForFunction((node) => node.scrollLeft < 0, await region.elementHandle(), {
      timeout: 5000,
    });
  },

  'Select role comparisons show the full selected region and open their own list': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(
      new URL(
        '/?item=select&tab=states&slice=roles&family=all&scheme=both&vp=auto&scale=120&dir=rtl&surface=overlay&freeze=1&raw=1',
        origin,
      ).href,
    );
    const board = page.locator('[data-wb-slice="roles"] .wb-artboard[data-theme="frost-light"]');
    const triggers = board.getByRole('button', { name: 'Deployment region', exact: true });
    await triggers.last().waitFor({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await triggers.count(), 6);
    for (const trigger of await triggers.all()) {
      const summary = trigger
        .locator('[aria-hidden="true"]')
        .getByText('Amsterdam', { exact: true });
      assert.equal(await summary.textContent(), 'Amsterdam');
      assert.ok(
        await summary.evaluate((node) => node.clientWidth === node.scrollWidth),
        'The selected region must fit beside the trigger affordance',
      );
    }
    const trigger = triggers.last();
    await trigger.click();
    const panel = page.locator(':popover-open');
    const list = panel.getByRole('listbox');
    await list.waitFor();
    assert.equal(await list.getAttribute('id'), await trigger.getAttribute('aria-controls'));
    const selected = list.getByRole('option', { name: 'Amsterdam', exact: true });
    assert.equal(await selected.getAttribute('aria-selected'), 'true');
    assert.equal(
      await list.getAttribute('aria-activedescendant'),
      await selected.getAttribute('id'),
    );
    await list.getByRole('option', { name: 'London', exact: true }).click();
    await panel.waitFor({ state: 'hidden' });
    assert.equal(await trigger.getAttribute('title'), 'London');
    assert.equal(await triggers.first().getAttribute('title'), 'Amsterdam');
  },

  'Picker comparisons leave room for their initial text and actions': async ({
    page,
    origin,
    watchPage,
  }) => {
    const period = '14/09/2026 – 18/09/2026';
    const phone = watchPage(
      await page
        .context()
        .browser()
        .newPage({
          isMobile: true,
          hasTouch: true,
          viewport: { width: 360, height: 780 },
        }),
    );
    try {
      for (const [view, item, slice, text, vp = 'auto', width = 360] of [
        [page, 'autocomplete', 'roles', 'Release notes'],
        [page, 'combobox', 'roles', 'Search options'],
        [page, 'date-picker', 'fields', '16/09/2026'],
        [page, 'date-range-picker', 'fields', period],
        [phone, 'date-range-picker', 'fields', period],
        [page, 'date-range-picker', 'fields', period, '768', 1500],
        [phone, 'date-range-picker', 'fields', period, '1280', 360],
      ]) {
        await view.setViewportSize({ width, height: 780 });
        const params = {
          item,
          slice,
          tab: 'states',
          family: 'all',
          scheme: 'both',
          surface: 'overlay',
          vp,
          scale: '120',
          dir: 'rtl',
          raw: '1',
          freeze: '1',
        };
        if (view.url() === 'about:blank') {
          const route = new URL('/', origin);
          route.search = new URLSearchParams(params).toString();
          await view.goto(route.href);
        } else {
          await navigate(view, params);
        }
        await view
          .locator('html[data-wb-ready="1"]')
          .waitFor({ state: 'attached', timeout: 20_000 });
        const inputs = view.locator(`[data-wb-slice="${slice}"] td input:not([type="hidden"])`);
        const geometry = await inputs.evaluateAll((editors) => {
          const measure = document.createElement('canvas').getContext('2d');
          return editors.map((input) => {
            const row = input.closest('[data-wb-subject]');
            const rect = input.getBoundingClientRect();
            const buttons = Array.from(row.querySelectorAll('button'), (button) =>
              button.getBoundingClientRect(),
            );
            const value = input.value || input.placeholder;
            const style = getComputedStyle(input);
            measure.font = [
              style.fontStyle,
              style.fontWeight,
              style.fontSize,
              style.fontFamily,
            ].join(' ');
            measure.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
            const textWidth =
              measure.measureText(value).width +
              parseFloat(style.paddingLeft) +
              parseFloat(style.paddingRight);
            return {
              value,
              available: input.clientWidth,
              content: Math.max(input.scrollWidth, Math.round(textWidth)),
              overlap: buttons.some(
                (button) => Math.min(rect.right, button.right) > Math.max(rect.left, button.left),
              ),
            };
          });
        });
        assert.equal(geometry.length, 36, item);
        for (const result of geometry) {
          assert.equal(result.value, text, item);
          assert.equal(
            result.available,
            result.content,
            item + ' must show the complete initial text',
          );
          assert.equal(result.overlap, false, item + ' actions must leave the editor clear');
        }
      }
    } finally {
      await phone.close();
    }
  },

  'Selection fields fill their Playground slot on the base surface': async ({ page, origin }) => {
    for (const [item, label] of [
      ['autocomplete', 'Document title'],
      ['combobox', 'Owning team'],
      ['select', 'Deployment region'],
    ]) {
      const route = new URL('/', origin);
      route.search = new URLSearchParams({
        item,
        tab: 'playground',
        family: 'frost',
        scheme: 'light',
        surface: 'base',
        vp: '360',
        scale: '120',
        dir: 'rtl',
        bounds: '1',
      }).toString();
      await page.goto(route.href, { waitUntil: 'domcontentloaded' });
      const board = page.locator('.wb-artboard').first();
      const field =
        item === 'select'
          ? board.getByRole('button', { name: label, exact: true })
          : board.getByRole('combobox');
      await field.waitFor({ state: 'attached', timeout: 20_000 });
      if (item === 'select') {
        assert.equal(await field.getAttribute('title'), 'Amsterdam');
      }
      const subject = board.locator('[data-wb-subject]:visible');
      const box = await subject.boundingBox();
      assert.ok(box && box.width > 240, label + ' must span the phone field slot');
      await page
        .getByText(Math.round(box.width) + ' × ' + Math.round(box.height) + ' px', {
          exact: true,
        })
        .waitFor();
      await field.click();
      await page.keyboard.press('ArrowDown');
      await board.getByRole('listbox').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await field.evaluate((node) => node === document.activeElement), true);
    }
  },

  'TagsInput keeps committed topics readable and removable in the base Playground': async ({
    page,
    origin,
  }) => {
    await page.goto(
      new URL(
        '/?item=tags-input&tab=playground&family=frost&scheme=light&surface=base&vp=360&scale=120&dir=rtl',
        origin,
      ).href,
      { waitUntil: 'domcontentloaded' },
    );
    const editor = page.locator('.wb-artboard .tags-editor-proto[data-wb-subject]');
    const draft = editor.getByRole('textbox', { name: 'Topics' });
    const remove = (name) => editor.getByRole('button', { name: 'Remove ' + name, exact: true });
    await draft.waitFor({ state: 'attached', timeout: 20_000 });
    for (const name of ['Design', 'Research']) {
      await assertLabelFits(tagLabelByText(editor, name), name);
      assert.ok(await remove(name).isVisible());
    }
    assert.ok((await editor.boundingBox()).width > 240, 'Topics must span the phone field slot');
    await draft.fill('Maps');
    await editor.getByRole('button', { name: 'Add tags' }).click();
    await remove('Maps').waitFor();
    await remove('Design').click();
    await remove('Design').waitFor({ state: 'detached' });
    assert.ok(await remove('Research').isVisible());
    assert.ok(await remove('Maps').isVisible());
    await assertFocused(draft);

    await page.keyboard.press('Backspace');
    await assertFocused(remove('Maps'));
    assert.ok(await remove('Maps').isVisible());
    await page.keyboard.press('ArrowRight');
    await assertFocused(remove('Research'));
    await page.keyboard.press('Escape');
    await assertFocused(draft);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await remove('Maps').waitFor({ state: 'detached' });
    await remove('Research').and(page.locator(':focus')).waitFor();
    await page.keyboard.press('Delete');
    await remove('Research').waitFor({ state: 'detached' });
    await assertFocused(draft);
  },

  'TagsInput keeps each size and variant readable on the narrow overlay': async ({
    page,
    origin,
  }) => {
    await page.goto(
      new URL(
        '/?item=tags-input&tab=states&slice=roles&family=pixel&scheme=light&surface=overlay&vp=360&scale=120&dir=rtl&freeze=1',
        origin,
      ).href,
      { waitUntil: 'domcontentloaded' },
    );
    const slice = page.locator('section[data-wb-slice="roles"]');
    for (const variant of ['default', 'ghost']) {
      for (const size of ['s', 'm', 'l']) {
        const field = slice.locator(
          `.tags-editor-proto[data-variant="${variant}"][data-size="${size}"]`,
        );
        await field.waitFor({ timeout: 20_000 });
        for (const name of ['Design', 'Research']) {
          await assertLabelFits(tagLabelByText(field, name), name);
        }
      }
    }
  },

  'TagsInput keeps Research whole beside its removal target on a phone': async ({
    page,
    origin,
    watchPage,
  }) => {
    const touch = await page
      .context()
      .browser()
      .newContext({ isMobile: true, hasTouch: true, viewport: { width: 360, height: 780 } });
    try {
      const mobile = watchPage(await touch.newPage());
      await mobile.goto(
        new URL(
          '/?item=tags-input&tab=states&slice=roles&family=all&scheme=both&surface=overlay&vp=auto&scale=120&dir=rtl&freeze=1&raw=1',
          origin,
        ).href,
      );
      const board = mobile.locator(
        '[data-wb-slice="roles"] .wb-artboard[data-theme="frost-light"]',
      );
      const field = board.locator('.tags-editor-proto[data-size="l"][data-variant="default"]');
      const remove = field.getByRole('button', { name: 'Remove Research', exact: true });
      await remove.waitFor({ timeout: 20_000 });
      await mobile.evaluate(() => document.fonts.ready);
      await assertLabelFits(tagLabelByText(field, 'Research'), 'Research');
      await remove.tap();
      await remove.waitFor({ state: 'detached' });
      assert.ok(await field.getByRole('button', { name: 'Remove Design' }).isVisible());
    } finally {
      await touch.close();
    }
  },

  'TagsInput renders its mixed-script tags in the offline workbench': async ({ page, origin }) => {
    const route = new URL(
      '/?item=tags-input&tab=states&block=overflow&family=soft&scheme=light&dir=rtl',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const board = page.locator('section[data-wb-block="overflow"] .wb-artboard').first();
    const words = ['العمارة', 'עברית', '東京'];
    await tagLabelByText(board, words[2]).waitFor({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    for (const word of words) {
      const missing = await tagLabelByText(board, word).evaluate((label) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const style = getComputedStyle(label);
        context.font = style.fontWeight + ' 36px ' + style.fontFamily;
        function draw(character) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillText(character, 8, 50);
          return canvas.toDataURL();
        }
        const missingGlyph = draw('\u0378');
        return [...new Set(label.textContent)].filter(
          (character) => draw(character) === missingGlyph,
        );
      });
      assert.deepEqual(missing, [], 'Every character in ' + word + ' has a glyph');
    }
  },

  'TagsInput preserves wrapped selection and availability with the packaged Tag': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(
      new URL(
        '/?item=tags-input&tab=states&block=overflow&family=frost&scheme=light&surface=overlay&scale=120&dir=rtl',
        origin,
      ).href,
      { waitUntil: 'domcontentloaded' },
    );
    const board = page.locator('[data-wb-block="overflow"] .wb-artboard').first();
    const address = 'digital-collections-and-research-coordination@example.org';
    const removeName = { name: 'Remove ' + address, exact: true };
    const fields = board.locator('[data-unica-tag-layout="field"]').filter({
      has: page.getByRole('button', removeName),
    });
    const label = (field) => tagLabelByText(field, address);
    const editable = fields.first();
    const locked = fields.last();
    await label(editable).waitFor({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await fields.count(), 2);
    assert.ok(await locked.getByRole('textbox').isDisabled());
    assert.ok(await locked.getByRole('button', removeName).isDisabled());
    for (const field of [editable, locked]) {
      const metrics = await label(field).evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const labelPart = element.closest('[data-unica-tag-part="label"]');
        const remove = labelPart.parentElement
          .querySelector('[data-unica-tag-part="remove"]')
          .getBoundingClientRect();
        return {
          lines: range.getClientRects().length,
          selectable: getComputedStyle(labelPart).userSelect === 'text',
          disjoint: text.right <= remove.left + 1 || remove.right <= text.left + 1,
        };
      });
      assert.ok(metrics.lines > 1, 'The whole long value wraps onto multiple lines');
      assert.ok(metrics.selectable && metrics.disjoint);
    }
    await label(editable).dblclick();
    const selected = await page.evaluate(() => getSelection().toString());
    assert.ok(selected && address.includes(selected));
    assert.ok(await editable.getByRole('button', removeName).isVisible());

    await navigate(page, {
      item: 'tags-input',
      tab: 'states',
      block: 'availability',
      family: 'frost',
      scheme: 'light',
    });
    const readOnly = page.getByRole('textbox', { name: 'Allowed domains', exact: true });
    await readOnly.waitFor();
    assert.equal(await readOnly.getAttribute('readonly'), '');
    assert.equal(
      await readOnly.inputValue(),
      'research.example.org\ndigital-collections.example.org\narchive.example.org',
    );
    assert.equal(
      await page.getByRole('button', { name: 'Remove research.example.org', exact: true }).count(),
      0,
    );
  },

  'TagsInput keeps the draft text beside Add when the matrix scales down': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    const route = new URL(
      '/?item=tags-input&tab=states&block=drafts&vp=1440&dir=rtl&scale=120&surface=overlay',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const board = page.locator('section[data-wb-block="drafts"] .wb-artboard').first();
    const field = board
      .locator('.tags-editor-proto[data-size="l"][data-variant="default"]')
      .first();
    const input = field.getByRole('textbox');
    await input.waitFor({ timeout: 20_000 });
    await input.fill('One\nTwo\nThree\nSummer collection acquisitions — ' + 'W'.repeat(250));
    await input.blur();
    const textEdge = await input.evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        element.getBoundingClientRect().left +
        (element.clientLeft + Number.parseFloat(style.paddingLeft)) * element.currentCSSZoom
      );
    });
    const add = await field.getByRole('button', { name: 'Add tags' }).boundingBox();
    assert.ok(
      add && textEdge >= add.x + add.width - 1,
      'The RTL editing area ends before the Add button',
    );
  },

  'Select shows the remaining choices in a scaled narrow field': async ({ page, origin }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    const route = new URL(
      '/?item=select&tab=states&block=summary&vp=1440&dir=rtl&scale=120',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const field = page.getByRole('button', { name: 'Filter regions', exact: true }).first();
    await field.waitFor({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    assert.match(await field.getAttribute('title'), /Frankfurt.*London.*Stockholm/);
    assert.equal(
      await field.getByText('Amsterdam', { exact: true }).filter({ visible: true }).count(),
      1,
    );
    assert.equal(await field.getByText('+4', { exact: true }).filter({ visible: true }).count(), 1);
  },

  'Select retry restores the shared catalog and keeps the saved choices': async ({
    page,
    origin,
  }) => {
    const route = new URL(
      '/?item=select&tab=states&block=loading&family=frost&scheme=both',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const frame = page.locator('section[data-wb-block="loading"]');
    const boards = frame.locator('.wb-artboard');
    const fields = boards.getByRole('button', { name: 'Available regions', exact: true });
    await fields.last().waitFor({ timeout: 20_000 });
    assert.equal(await fields.count(), 2);
    await fields.first().click();
    const retry = boards.getByRole('button', { name: 'Try again' });
    await retry.waitFor();
    assert.equal(await fields.first().getAttribute('title'), 'London');
    await retry.press('Enter');
    await retry.waitFor({ state: 'hidden' });
    assert.equal(await frame.getByRole('combobox').inputValue(), 'ready');
    assert.equal(await fields.count(), 2);
    const list = boards.first().locator('[role="listbox"]:focus');
    const selected = list.getByRole('option', { name: 'London', exact: true, selected: true });
    const selectedId = await selected.getAttribute('id');
    assert.ok(selectedId);
    assert.equal(await list.getAttribute('aria-activedescendant'), selectedId);
    await list.press('ArrowDown');
    assert.notEqual(await list.getAttribute('aria-activedescendant'), selectedId);
    assert.equal(await selected.count(), 1, 'Browsing another row keeps London selected');
    await list.press('Escape');
    await fields.last().click();
    await boards
      .last()
      .getByRole('option', { name: 'London', selected: true, exact: true })
      .waitFor();
    assert.equal(await retry.count(), 0, 'Retry recovers the catalog in both themes');
  },

  'Date pickers select the touched day at the edge of an in-flow calendar on a phone': async ({
    page,
    origin,
    watchPage,
  }) => {
    const touch = await page
      .context()
      .browser()
      .newContext({
        hasTouch: true,
        isMobile: true,
        viewport: { width: 360, height: 780 },
      });
    try {
      const mobile = watchPage(await touch.newPage());
      const view = {
        tab: 'states',
        family: 'frost',
        scheme: 'light',
        dir: 'rtl',
        scale: '120',
      };
      for (const [item, block, expected] of [
        ['date-picker', 'panels', '07/09/2026'],
        ['date-picker', 'anatomy', '07/09/2026'],
        ['date-range-picker', 'panels', '07/09/2026 – 13/09/2026'],
      ]) {
        const params = { ...view, item, block };
        if (mobile.url() === 'about:blank') {
          const route = new URL('/', origin);
          route.search = new URLSearchParams(params).toString();
          await mobile.goto(route.href, { waitUntil: 'domcontentloaded' });
        } else {
          await navigate(mobile, params);
        }
        const field = mobile
          .locator(`[data-wb-block="${block}"] .wb-artboard .date-picker-proto`)
          .first();
        const seventh = field.locator('button[data-date="2026-09-07"]');
        const eighth = field.locator('button[data-date="2026-09-08"]');
        await seventh.waitFor({ timeout: 20_000 });
        await mobile.evaluate(() => document.fonts.ready);
        await seventh.scrollIntoViewIfNeeded();
        const day = await seventh.boundingBox();
        const neighbor = await eighth.boundingBox();
        assert.ok(day && neighbor);
        await mobile.touchscreen.tap(day.x + 1.5, day.y + day.height / 2);
        const editor = field.getByRole('textbox');
        if (item === 'date-range-picker') {
          assert.equal(await editor.inputValue(), '');
          await field.locator('button[data-date="2026-09-13"]').tap();
        }
        await seventh.waitFor({ state: 'detached' });
        assert.equal(await editor.inputValue(), expected, item + '/' + block);
        assert.ok(day.width >= 44 && day.height >= 44);
        assert.ok(
          neighbor.x + neighbor.width <= day.x + 0.01,
          'The adjacent day has its own touch target',
        );
      }
    } finally {
      await touch.close();
    }
  },

  'Table keeps document names readable on the second reference page at mobile width': async ({
    page,
    origin,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(
      new URL(
        '/?item=table&tab=compositions&block=reference&family=pixel&scheme=light&surface=overlay&scale=120&dir=rtl&raw=1',
        origin,
      ).href,
      { waitUntil: 'domcontentloaded' },
    );
    await checkReferenceNames(page);

    await mount('recovery-references', { theme: 'soft-light', textScale: 120, direction: 'rtl' });
    const host = page.getByRole('main');
    await host.evaluate((node) => {
      node.style.inlineSize = '250px';
    });
    await checkReferenceNames(page);
    await host.evaluate((node) => node.style.removeProperty('inline-size'));
    const table = page.getByRole('table', { name: 'Recovery references' });
    const horizontalOverflow = () =>
      table.evaluate((node) => node.parentElement.scrollWidth - node.parentElement.clientWidth);
    assert.equal(await horizontalOverflow(), 0, 'The revised date column fits the mobile document');

    await page.setViewportSize({ width: 840, height: 780 });
    await host.evaluate((node) => {
      node.style.display = 'flex';
    });
    await page.getByRole('button', { name: 'Previous page', exact: true }).press('Enter');
    assert.equal(await horizontalOverflow(), 0, 'The reference table fits its flex row');
  },

  'SegmentedControl keeps the submitted frequency when a native reset is canceled': async ({
    page,
    origin,
  }) => {
    await page.goto(
      new URL('/?item=segmented-control&tab=states&block=field&family=soft&scheme=light', origin)
        .href,
      { waitUntil: 'domcontentloaded' },
    );
    const form = page.locator('[data-wb-block="field"] .wb-artboard form');
    const weekly = form.getByRole('radio', { name: 'Weekly', exact: true });
    await weekly.waitFor({ timeout: 20_000 });
    await weekly.press('Space');
    await form.locator('button[type="submit"]').press('Enter');
    const receipt = form.getByRole('status').filter({ hasText: /weekly/i });
    await receipt.waitFor();
    await page.evaluate(() =>
      document.addEventListener('reset', (event) => event.preventDefault(), { once: true }),
    );
    const reset = form.locator('button[type="reset"]');
    await reset.press('Enter');
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(await weekly.isChecked(), true);
    assert.equal(await receipt.count(), 1, 'A canceled reset preserves the submitted frequency');

    await reset.press('Enter');
    await receipt.waitFor({ state: 'hidden' });
    assert.equal(await weekly.isChecked(), false);

    await form.evaluate(async (node) => {
      node.reset();
      node.requestSubmit();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const daily = form.getByRole('radio', { name: 'Daily', exact: true });
    assert.ok(await daily.evaluate((input) => input === document.activeElement));
    const group = form.getByRole('radiogroup', { description: /Choose a delivery frequency/ });
    assert.equal(
      await group.count(),
      1,
      'The later validation message describes the focused group',
    );
  },

  'FileInput submits dropped bytes and follows the actual form owner on reset': async ({
    page,
    mount,
  }) => {
    await mount('native');
    await page.goto(
      new URL('/?item=file-input&tab=playground&family=soft&scheme=light', page.url()).href,
      { waitUntil: 'domcontentloaded' },
    );
    const board = page.locator('.wb-artboard').first();
    const picker = board.getByRole('button', { name: 'Choose file Attach evidence' });
    const input = board.locator('input[type="file"]');
    await picker.waitFor({ timeout: 20_000 });
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), picker.press('Enter')]);
    await chooser.setFiles({
      name: 'first.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('First'),
    });
    await board.getByRole('button', { name: 'Remove first.txt' }).waitFor();
    await input.evaluate((node) => {
      const owner = document.createElement('form');
      owner.id = 'external-attachment-owner';
      document.body.appendChild(owner);
      node.setAttribute('form', owner.id);
    });
    async function drop(names) {
      await board.locator('.file-input-proto').evaluate((target, names) => {
        const dataTransfer = new DataTransfer();
        for (const name of names) {
          dataTransfer.items.add(new File([name], name, { type: 'text/plain' }));
        }
        target.dispatchEvent(
          new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }),
        );
      }, names);
    }
    const read = () =>
      input.evaluate(async (node) => {
        const entry = new FormData(node.form).get('attachment');
        return { name: entry.name, text: await entry.text() };
      });
    await drop(['ثاني.txt']);
    await board.getByRole('button', { name: 'Remove ثاني.txt' }).waitFor();
    assert.deepEqual(await read(), { name: 'ثاني.txt', text: 'ثاني.txt' });
    await drop(['three.txt', 'four.txt']);
    await board.getByRole('status').filter({ hasText: 'Drop one file at a time' }).waitFor();
    assert.deepEqual(await read(), { name: 'ثاني.txt', text: 'ثاني.txt' });
    await input.evaluate((node) => {
      node.closest('form').reset();
      node.form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      node.form.reset();
    });
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.deepEqual(await read(), { name: 'ثاني.txt', text: 'ثاني.txt' });
    assert.equal(await board.getByRole('button', { name: 'Remove ثاني.txt' }).count(), 1);
    await input.evaluate((node) => {
      node.form.reset();
      node.form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      node.form.reset();
    });
    await board.getByRole('button', { name: 'Remove ثاني.txt' }).waitFor({ state: 'detached' });
    assert.deepEqual(await read(), { name: '', text: '' });
    assert.equal(
      await board.getByRole('status').filter({ hasText: 'Drop one file at a time' }).count(),
      0,
    );
  },

  'Bounds keeps measurements inside a scaled artboard filled by its subjects': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1365, height: 950 });
    await page.goto(new URL('/?item=app-shell&tab=compositions&block=topologies', origin).href);
    const ready = page.locator('html[data-wb-ready="1"]');
    await ready.waitFor({ state: 'attached', timeout: 20_000 });
    for (const [tab, block, count, overrides] of [
      ['compositions', 'topologies', 1, {}],
      ['states', 'responsive', 3, {}],
      ['states', 'layout', 5, {}],
      ['states', 'navigation', 4, {}],
      ['states', 'properties', 6, {}],
      [
        'states',
        'properties',
        6,
        { vp: '360', scale: '120', dir: 'rtl', surface: 'overlay', raw: '1' },
      ],
    ]) {
      await navigate(page, {
        item: 'app-shell',
        tab,
        block,
        vp: '1280',
        family: 'all',
        scheme: 'both',
        surface: 'base',
        bounds: '1',
        ...overrides,
      });
      await ready.waitFor({ state: 'attached' });
      const boards = page.locator('.wb-story-frame .wb-artboard');
      await page.waitForFunction(
        (expected) =>
          document.querySelectorAll('.wb-story-frame [data-wb-bounds-label]').length === expected,
        count * 6,
        { timeout: 30000 },
      );
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await boards.count(), 6);
      for (const board of await boards.all()) {
        const result = await board.evaluate(async (artboard, layoutStrips) => {
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          const box = artboard.getBoundingClientRect();
          const nodes = [...artboard.querySelectorAll('[data-wb-bounds-label]')];
          const labels = nodes.map((node) => node.getBoundingClientRect());
          return {
            count: labels.length,
            nearOwnOutline: nodes.every((node, index) => {
              const outline = node.parentElement.getBoundingClientRect();
              const label = labels[index];
              const gap = Math.max(
                label.left - outline.right,
                outline.left - label.right,
                label.top - outline.bottom,
                outline.top - label.bottom,
              );
              const alongX = label.left < outline.right && label.right > outline.left;
              const alongY = label.top < outline.bottom && label.bottom > outline.top;
              if (layoutStrips && index >= 2) {
                const center = label.top + label.height / 2;
                return gap <= 4 && center >= outline.top && center <= outline.bottom;
              }
              return gap <= label.height && (alongX || alongY);
            }),
            inside: labels.every(
              (label) =>
                label.left >= box.left - 1 &&
                label.right <= box.right + 1 &&
                label.top >= box.top - 1 &&
                label.bottom <= box.bottom + 1,
            ),
            separate: labels.every((a, index) =>
              labels
                .slice(index + 1)
                .every(
                  (b) =>
                    a.bottom <= b.top + 1 ||
                    b.bottom <= a.top + 1 ||
                    a.right <= b.left + 1 ||
                    b.right <= a.left + 1,
                ),
            ),
          };
        }, block === 'layout');
        assert.deepEqual(
          result,
          { count, nearOwnOutline: true, inside: true, separate: true },
          block,
        );
        if (block === 'properties' && !overrides.vp) {
          const heading = board.getByText('Document properties', { exact: true });
          assert.ok(
            await boundsLeavesTextVisible(heading),
            'A dimension label covers the inspector heading',
          );
        }
      }
    }
  },

  'Bounds keeps menu shortcut dimensions beside their keys': async ({ page, origin }) => {
    await page.setViewportSize({ width: 1540, height: 950 });
    await page.goto(new URL('/?item=kbd&tab=states&block=overlay', origin).href);
    await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 20_000 });
    for (const [family, width] of [
      ['all', 1365],
      ['all', 1440],
      ['all', 1540],
      ['frost', 2400],
    ]) {
      await page.setViewportSize({ width, height: 950 });
      await navigate(page, {
        item: 'kbd',
        tab: 'states',
        block: 'overlay',
        family,
        scheme: family === 'all' ? 'both' : 'light',
        vp: '1280',
        bounds: '1',
      });
      const menu = page.getByRole('group', { name: 'Document commands' }).first();
      const positions = await menu.evaluate(async (group) => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const board = group.closest('.wb-artboard');
        const outlines = [...board.querySelectorAll('.wb-bounds-outline')];
        const captions = [...group.querySelectorAll('bdi')].map((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return range.getBoundingClientRect();
        });
        return [...group.querySelectorAll('kbd')].map((key) => {
          const rect = key.getBoundingClientRect();
          const outline = outlines.find((element) => {
            const box = element.getBoundingClientRect();
            return ['left', 'right', 'top', 'bottom'].every(
              (edge) => Math.abs(box[edge] - rect[edge]) < 1,
            );
          });
          const label = outline?.querySelector('[data-wb-bounds-label]')?.getBoundingClientRect();
          return Boolean(
            label &&
            Math.max(
              label.left - rect.right,
              rect.left - label.right,
              label.top - rect.bottom,
              rect.top - label.bottom,
            ) <= 5 &&
            captions.every(
              (text) =>
                text.right <= label.left ||
                text.left >= label.right ||
                text.bottom <= label.top ||
                text.top >= label.bottom,
            ),
          );
        });
      });
      assert.deepEqual(positions, [true, true, true], family + ' at ' + width);
    }
  },

  'Bounds leaves dense badge content visible when labels have room outside': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto(
      `${origin}/?item=badge&tab=states&block=surfaces&family=all&scheme=both&surface=base&vp=1280&bounds=1`,
      { waitUntil: 'commit' },
    );
    const board = page.locator('.wb-story-frame .wb-artboard').first();
    await board.locator('[data-wb-bounds-label]').last().waitFor({ timeout: 20_000 });
    const measurements = await board.evaluate(async (root) => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const subjects = [...root.querySelectorAll('[data-wb-subject]')].map((node) =>
        node.getBoundingClientRect(),
      );
      return [...root.querySelectorAll('[data-wb-bounds-label]')].map((node) => {
        const label = node.getBoundingClientRect();
        return subjects.every(
          (subject) =>
            label.right <= subject.left + 1 ||
            label.left >= subject.right - 1 ||
            label.bottom <= subject.top + 1 ||
            label.top >= subject.bottom - 1,
        );
      });
    });
    assert.equal(measurements.length, 36);
    assert.ok(measurements.every(Boolean), 'A dimension label covers a badge');
  },

  'Bounds preserves the date format hint when a label can stay above its field': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1920, height: 950 });
    await page.goto(
      `${origin}/?item=date-picker&tab=states&block=states&family=soft&scheme=dark&vp=1280&bounds=1`,
      { waitUntil: 'commit' },
    );
    const board = page.locator('.wb-story-frame .wb-artboard');
    await board.locator('[data-wb-bounds-label]').last().waitFor({ timeout: 20_000 });
    const hint = board.getByText('DD/MM/YYYY · you can also paste an ISO date', { exact: true });
    assert.ok(await boundsLeavesTextVisible(hint), 'A dimension label covers the date format hint');
  },

  'Bounds follows an inline link when its web font replaces the fallback': async ({
    page,
    mount,
  }) => {
    await mount('native');
    const url = new URL('/?item=link&tab=usage&family=frost&scheme=light', page.url());
    await page.goto(url.href, { waitUntil: 'commit' });
    await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 20_000 });

    const font = '**/inter-latin-wght-italic.woff2';
    let releaseFont;
    const fontGate = new Promise((resolve) => {
      releaseFont = resolve;
    });
    await page.route(font, async (route) => {
      await fontGate;
      await route.continue();
    });

    const board = page.locator('[data-wb-block="glyphs"] .wb-artboard');
    const link = board.getByRole('link', { name: 'Writing for Web Accessibility' });
    const outline = board.locator('.wb-bounds-outline').first();
    const label = outline.locator('[data-wb-bounds-label]');
    let fallbackWidth;
    try {
      const requested = page.waitForRequest(font, { timeout: 20_000 });
      await navigate(page, {
        item: 'link',
        tab: 'states',
        block: 'glyphs',
        family: 'frost',
        scheme: 'light',
        vp: '360',
        dir: 'rtl',
        scale: '120',
        bounds: '1',
      });
      await requested;
      await label.waitFor({ timeout: 20_000 });
      fallbackWidth = await link.evaluate((node) => node.offsetWidth);
    } finally {
      releaseFont();
    }

    await page.evaluate(() => document.fonts.ready);
    const size = await link.evaluate((node) => [node.offsetWidth, node.offsetHeight]);
    assert.notEqual(size[0], fallbackWidth);
    await label.filter({ hasText: size.join(' × ') + ' px' }).waitFor({ timeout: 4_000 });
    const outlineSize = await outline.evaluate((node) => [
      Math.round(parseFloat(node.style.width)),
      Math.round(parseFloat(node.style.height)),
    ]);
    assert.deepEqual(outlineSize, size);
  },

  'Link section addresses survive a new tab and track native history': async ({ page, mount }) => {
    await mount('workbench-v3');
    await navigate(page, {
      ...Object.fromEntries(new URL(page.url()).searchParams),
      item: 'link',
      tab: 'states',
      block: 'live',
      solo: 'frost-light',
    });
    const path = page.getByRole('navigation', { name: 'On this example' });
    const details = path.getByRole('link', { name: 'Details' });
    const original = page.url();
    const [opened] = await Promise.all([
      page.context().waitForEvent('page'),
      details.click({ modifiers: ['Control'] }),
    ]);
    try {
      const target = opened.getByRole('region', { name: 'Details', exact: true });
      const navigation = opened.getByRole('navigation', { name: 'On this example' });
      const current = navigation.locator('[aria-current="location"]');
      await target.waitFor();
      assert.equal(await target.evaluate((element) => element.matches(':focus')), true);
      assert.equal(await current.textContent(), 'Details');
      assert.equal(page.url(), original);
      await navigation.getByRole('link', { name: 'Summary' }).press('Enter');
      await current.filter({ hasText: 'Summary' }).waitFor();
      await opened.goBack();
      await current.filter({ hasText: 'Details' }).waitFor();
      await opened.reload({ waitUntil: 'domcontentloaded' });
      await target.waitFor();
      assert.equal(await target.evaluate((element) => element.matches(':focus')), true);
      assert.equal(await current.textContent(), 'Details');
    } finally {
      await opened.close();
    }
  },

  'Tag removal and restoration keep keyboard focus in the activated artboard': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await mount('workbench-v3');
    await navigate(page, { item: 'tag', tab: 'playground', family: 'frost', scheme: 'both' });
    const boards = page.locator('.wb-artboard');
    const remove = boards.nth(1).getByRole('button', { name: 'Remove Documentation' });
    const restore = boards.nth(1).getByRole('button', { name: 'Restore tag' });
    await remove.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    assert.equal(await restore.evaluate((button) => button.matches(':focus')), true);
    assert.equal(await boards.nth(1).locator('[data-wb-subject]').count(), 0);
    await page.keyboard.press('Space');
    assert.equal(await remove.evaluate((button) => button.matches(':focus')), true);
    assert.equal(await boards.nth(1).locator('[data-unica-tag-size][data-wb-subject]').count(), 1);
    assert.equal(
      await boards.nth(0).getByRole('button', { name: 'Remove Documentation' }).count(),
      1,
    );
    const label = page.getByRole('textbox', { name: 'label', exact: true });
    await label.fill('   ');
    await boards.nth(1).getByRole('button', { name: 'Remove Label' }).waitFor();
    assert.equal(await label.evaluate((input) => input.matches(':focus')), true);
  },

  'Settling two TagGroup removals retains focus in the group that owned it': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount('workbench-v3');
    await navigate(page, {
      item: 'tag',
      tab: 'states',
      block: 'removal',
      family: 'frost',
      scheme: 'both',
    });
    const frame = page.locator('[data-wb-block="removal"]');
    const groups = frame.getByRole('toolbar', { name: 'Applied labels' });
    await frame.getByRole('checkbox', { name: 'Wait for confirmation' }).check();
    for (const group of [groups.nth(0), groups.nth(1)]) {
      await group.getByRole('button', { name: 'Remove Platform team' }).press('Delete');
    }
    // Activation through an assistive command can leave DOM focus in the collection.
    await frame
      .getByRole('button', { name: 'Confirm removal' })
      .evaluate((button) => button.click());
    const following = groups.nth(1).getByRole('button', { name: 'Remove Needs review' });
    assert.equal(await following.evaluate((button) => button.matches(':focus')), true);
    assert.equal(await groups.getByRole('button', { name: 'Remove Platform team' }).count(), 0);
    await frame.getByRole('checkbox', { name: 'Wait for confirmation' }).uncheck();
    await groups.nth(1).getByRole('button', { name: 'Remove This month' }).press('Delete');
    await following.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    const empty = frame
      .locator('.wb-artboard')
      .nth(1)
      .getByRole('button', { name: 'Reapply labels' });
    assert.equal(await empty.evaluate((button) => button.matches(':focus')), true);
    await page.keyboard.press('Enter');
    const first = groups.nth(1).getByRole('button', { name: 'Remove This month' });
    assert.equal(await first.evaluate((button) => button.matches(':focus')), true);
  },

  'Folio filter names follow current dates and Reset ignores a held removal key': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    await page.goto(
      new URL('/?item=03-document-collection&family=soft&scheme=light&vp=1440', origin).href,
      { waitUntil: 'domcontentloaded' },
    );
    const scene = page.locator('[data-wb-scene]');
    const group = scene.getByRole('toolbar', { name: 'Applied document filters', exact: true });
    const remove = (name) => group.getByRole('button', { name, exact: true });
    const oldWindow = remove('Remove modified date filter: 14 – 17 Sept 2026');
    const newWindow = remove('Remove modified date filter: 15 – 21 Sept 2026');
    const oldBaseline = remove('Remove verification date filter: Verified since 11 Sept 2026');
    const newBaseline = remove('Remove verification date filter: Verified since 14 Sept 2026');
    const scope = remove('Remove scope: prod filter');
    const reset = scene.getByRole('link', { name: 'Reset', exact: true });

    await oldWindow.waitFor({ timeout: 20_000 });
    await scene
      .getByRole('textbox', { name: 'Last modified', exact: true })
      .fill('15/09/2026 – 21/09/2026');
    await newWindow.waitFor();
    assert.equal(await oldWindow.count(), 0);
    const verification = scene.getByRole('textbox', { name: 'Verified on or after', exact: true });
    await verification.fill('11/09/2026');
    await oldBaseline.waitFor();
    await verification.fill('14/09/2026');
    await newBaseline.waitFor();
    assert.equal(await oldBaseline.count(), 0);

    await newBaseline.click();
    await newWindow.click();
    assert.equal(await group.getByRole('button').count(), 1);
    await scope.focus();
    await page.keyboard.down('Enter');
    await assertFocused(reset);
    await group.getByText('No filters applied', { exact: true }).waitFor();
    assert.equal(await group.getByRole('button').count(), 0);
    await page.keyboard.down('Enter');
    assert.equal(await group.getByRole('button').count(), 0);
    await page.keyboard.up('Enter');
    assert.equal(await group.getByRole('button').count(), 0);
    await page.keyboard.press('Enter');
    await scope.waitFor();
    assert.equal(await group.getByRole('button').count(), 1);

    await scope.click();
    await group.getByText('No filters applied', { exact: true }).waitFor();
    await reset.click();
    await scope.waitFor();
    assert.equal(await group.getByRole('button').count(), 1);
  },

  'Invite recipients retain keyboard navigation and stay inside the active form': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 900, height: 950 });
    await page.goto(
      new URL(
        '/?item=07-invite-access-modal&family=frost&scheme=dark&vp=360&dir=rtl&scale=120',
        origin,
      ).href,
      { waitUntil: 'domcontentloaded' },
    );
    const invites = page.frameLocator('iframe[title="Folio invitations"]');
    const dialog = invites.getByRole('dialog', { name: 'Invite members to Platform Eng' });
    const draft = dialog.getByRole('textbox', { name: 'Invite by work email', exact: true });
    const reviewer = dialog.getByRole('button', {
      name: 'Remove reviewer@example.com',
      exact: true,
    });
    const platform = dialog.getByRole('button', {
      name: 'Remove platform@example.com',
      exact: true,
    });
    await reviewer.waitFor({ timeout: 20_000 });
    await draft.press('Backspace');
    await assertFocused(reviewer);
    assert.ok(
      await dialog.getByRole('button', { name: 'Send 2 invites', exact: true }).isVisible(),
    );
    await page.keyboard.press('Tab');
    await assertFocused(dialog.getByRole('textbox', { name: 'External contractor', exact: true }));
    await draft.press('Backspace');
    await page.keyboard.press('Enter');
    await reviewer.waitFor({ state: 'detached' });
    await invites.locator('button[aria-label="Remove platform@example.com"]:focus').waitFor();
    assert.ok(
      await dialog.getByRole('button', { name: 'Send 1 invites', exact: true }).isVisible(),
    );
    await page.keyboard.press('Backspace');
    await platform.waitFor({ state: 'detached' });
    await assertFocused(draft);
    assert.ok(await dialog.isVisible());
  },

  'Toast exports retain independent identities after an earlier notification is dismissed': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('workbench-v3');
    await navigate(page, {
      item: 'toast',
      tab: 'compositions',
      block: 'modal',
      family: 'frost',
      scheme: 'light',
      surface: 'overlay',
      vp: '360',
      scale: '120',
      dir: 'rtl',
    });
    const open = page.getByRole('button', { name: 'Open export options' });
    await open.press('Enter');
    const dialog = page.locator('dialog:modal');
    const queue = dialog.locator('[popover]:popover-open');
    const name = dialog.getByRole('textbox', { name: 'File name' });
    const prepare = dialog.getByRole('button', { name: 'Prepare export' });
    async function holdEnter(target) {
      await target.focus();
      await page.keyboard.down('Enter');
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await page.keyboard.down('Enter');
      await page.keyboard.up('Enter');
    }
    await name.fill('First report');
    await holdEnter(name);
    await dialog
      .getByRole('status')
      .filter({ hasText: 'First report.txt' })
      .waitFor({ state: 'attached' });
    await name.fill('Second report');
    await holdEnter(prepare);
    await queue.getByRole('button', { name: /^Expand 3 notifications/ }).press('Enter');
    const cards = queue.locator('.toast-card');
    assert.equal(await cards.count(), 3);
    await holdEnter(
      cards.filter({ hasText: 'First report.txt' }).getByRole('button', { name: /^Dismiss:/ }),
    );
    await name.fill('Third report');
    await prepare.press('Enter');
    assert.equal(await cards.count(), 3);
    await cards
      .filter({ hasText: 'Third report.txt' })
      .getByRole('button', { name: /^Dismiss:/ })
      .press('Enter');
    assert.equal(await cards.count(), 2);
    await cards.filter({ hasText: 'Second report.txt' }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await open.evaluate((button) => button.matches(':focus')), true);
    await open.press('Enter');
    const expand = queue.getByRole('button', { name: /^Expand 2 notifications/ });
    if (await expand.count()) {
      await expand.press('Enter');
    }
    await queue.locator('.toast-card').filter({ hasText: 'Second report.txt' }).waitFor();
    assert.equal(
      await queue.locator('.toast-card').filter({ hasText: 'Third report.txt' }).count(),
      0,
    );
    assert.equal(await dialog.getByRole('status').textContent(), '');
    await page.keyboard.press('Escape');
    const reset = page.getByRole('button', { name: 'Reset', exact: true });
    await reset.focus();
    await page.locator('.toast-dismiss-all').evaluate((button) => button.click());
    assert.equal(await reset.evaluate((button) => button.matches(':focus')), true);
  },

  'Dismissing a toast preserves focus owned by another message or artboard': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('workbench-v3');
    await navigate(page, {
      item: 'toast',
      tab: 'states',
      block: 'reading',
      family: 'frost',
      scheme: 'both',
    });
    const boards = page.locator('[data-wb-block="reading"] .wb-artboard');
    const first = boards.first();
    const close = first
      .locator('.toast-card')
      .first()
      .getByRole('button', { name: /^Dismiss:/ });
    const undo = first.getByRole('button', { name: 'Undo', exact: true });
    const next = boards.nth(1).getByRole('button', { name: 'Undo', exact: true });
    await undo.focus();
    await close.evaluate((button) => button.click());
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(await undo.evaluate((button) => button.matches(':focus')), true);
    await close.evaluate(
      (button, destination) => {
        button.focus();
        button.click();
        destination.focus();
      },
      await next.elementHandle(),
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(await next.evaluate((button) => button.matches(':focus')), true);
  },

  'Bounds follows the accordion when its header opens inside a composition': async ({
    page,
    mount,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mount('workbench-v3');
    await navigate(page, {
      item: 'accordion',
      tab: 'compositions',
      block: 'actions',
      family: 'frost',
      scheme: 'light',
      surface: 'overlay',
      vp: '360',
      scale: '120',
      dir: 'rtl',
      bounds: '1',
      freeze: '1',
    });
    const board = page.locator('[data-wb-block="actions"] .wb-artboard');
    const roots = board.locator('[data-wb-subject]');
    await roots.first().waitFor();
    assert.equal(await roots.count(), 3);
    const before = await roots.first().evaluate((el) => [el.offsetWidth, el.offsetHeight]);
    await page
      .getByText(before.join(' × ') + ' px', { exact: true })
      .first()
      .waitFor();
    await board.getByRole('button', { name: 'Preview link', exact: true }).press('Enter');
    const url = board.getByText('https://preview.example.com/releases/2.4', { exact: true });
    await url.waitFor();
    const gapBelowUrl = await url.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return (
        element.nextElementSibling.getBoundingClientRect().top -
        range.getBoundingClientRect().bottom
      );
    });
    assert.ok(gapBelowUrl >= 0, 'The complete URL fits above the expiration note');
    await page.waitForFunction(([width, height]) => {
      const accordion = document.querySelector('[data-wb-block="actions"] [data-wb-subject]');
      if (!accordion || accordion.offsetWidth !== width || accordion.offsetHeight <= height) {
        return false;
      }
      const dimensions = `${width} × ${accordion.offsetHeight} px`;
      return [...document.querySelectorAll('[data-wb-bounds-label]')].some(
        (label) => label.textContent === dimensions,
      );
    }, before);
  },

  'Shipped disclosure compositions retain independent actions, drafts and the named diff': async ({
    page,
    mount,
  }) => {
    await mount('workbench-v3', { reducedMotion: 'reduce' });
    await navigate(page, {
      item: 'accordion',
      tab: 'compositions',
      block: 'actions',
      family: 'frost',
      scheme: 'light',
      surface: 'overlay',
      vp: '360',
      scale: '120',
      dir: 'rtl',
    });
    const actions = page.locator('[data-wb-block="actions"] .wb-artboard');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const preview = actions.getByRole('button', { name: 'Preview link', exact: true });
    await actions.getByRole('button', { name: 'Copy link', exact: true }).press('Enter');
    await actions.getByRole('button', { name: 'Copied', exact: true }).waitFor();
    assert.equal(await preview.getAttribute('aria-expanded'), 'false');
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      'https://preview.example.com/releases/2.4',
    );
    const file = actions.getByRole('button', { name: 'pricing.ts', exact: true });
    const changes = actions.getByRole('group', { name: 'Changes to pricing.ts' });
    await changes.waitFor();
    assert.equal(
      await changes.evaluate(
        (node) => node.tagName === 'PRE' && getComputedStyle(node).direction === 'ltr',
      ),
      true,
    );
    const reviewed = actions.getByRole('checkbox', { name: 'Reviewed pricing.ts', exact: true });
    await reviewed.press('Space');
    await changes.waitFor({ state: 'hidden' });
    assert.equal(await file.getAttribute('aria-expanded'), 'false');
    await file.press('Enter');
    assert.match(await changes.textContent(), /round\(net \+ tax\)/);
    assert.equal(await reviewed.isChecked(), true);
    const favorite = actions.getByRole('button', { name: 'Favorite Open incidents', exact: true });
    await favorite.press('Space');
    assert.equal(await favorite.getAttribute('aria-pressed'), 'true');
    assert.equal(
      await actions
        .getByRole('button', { name: 'Open incidents', exact: true })
        .getAttribute('aria-expanded'),
      'false',
    );

    await navigate(page, {
      item: 'collapsible',
      tab: 'compositions',
      block: 'custom',
      family: 'soft',
      scheme: 'dark',
    });
    const delivery = page.locator('[data-wb-block="custom"] .wb-artboard');
    const trigger = delivery.getByRole('button', { name: 'Delivery details', exact: true });
    const draft = delivery.getByRole('textbox', { name: 'Reply-to address', exact: true });
    await draft.fill('next@example.com');
    await delivery.getByRole('button', { name: 'Close details', exact: true }).press('Enter');
    await assertFocused(trigger);
    await trigger.press('Space');
    assert.equal(await draft.inputValue(), 'next@example.com');
  },

  'Overlay disclosures stay under the pointer when their content opens': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mount('workbench-v3');
    for (const [route, name] of [
      [{ item: 'accordion', tab: 'playground' }, 'Fee'],
      [{ item: 'avatar', tab: 'compositions', block: 'usage' }, 'View all 7'],
    ]) {
      await navigate(page, {
        ...route,
        surface: 'overlay',
        family: 'frost',
        scheme: 'light',
        vp: '360',
        scale: '120',
        dir: 'rtl',
        raw: '1',
        freeze: '1',
      });
      const board = page.locator('.wb-artboard').first();
      const trigger = board.getByRole('button', { name, exact: true });
      await trigger.scrollIntoViewIfNeeded();
      const panelId = await trigger.getAttribute('aria-controls');
      assert.ok(panelId);
      const disclosure = board.locator(`button[aria-controls="${panelId}"]`);
      const bounds = await trigger.boundingBox();
      assert.ok(bounds);
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height * 0.85;
      await page.mouse.click(x, y);
      assert.equal(await disclosure.getAttribute('aria-expanded'), 'true');
      await page.mouse.click(x, y);
      assert.equal(await disclosure.getAttribute('aria-expanded'), 'false');
    }
  },

  'An AppShell save failure clears the shared control and preserves each workspace draft': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount('workbench-v3');
    await navigate(page, { item: 'app-shell', tab: 'states', block: 'save' });

    const frame = page.locator('[data-wb-block="save"]');
    const toolbar = frame.getByRole('group', { name: 'Save, discard and retry controls' });
    const fail = toolbar.getByRole('checkbox', { name: 'Simulate a save failure' });
    const artboards = frame.locator('.wb-artboard');
    const first = artboards.first();
    const fields = artboards.getByRole('textbox', { name: 'Workspace name' });
    await fields.first().waitFor();
    assert.equal(await fields.count(), 6);
    const initial = await fields.first().inputValue();
    const edited = 'Editorial workspace';
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await fields.first().fill(edited);
    await fail.check();
    await first.getByRole('button', { name: 'Save changes' }).click();
    assert.equal(await fail.isChecked(), false);
    const second = artboards.nth(1);
    await second.getByRole('button', { name: 'Save changes' }).click();
    await page.clock.runFor(700);
    await second.getByText('All changes saved', { exact: true }).waitFor();
    const retry = first.getByRole('button', { name: 'Retry save' });
    await retry.waitFor();
    assert.equal(await fail.isChecked(), false);
    assert.equal(await fields.first().inputValue(), edited);
    assert.equal(await artboards.getByText('Unsaved changes', { exact: true }).count(), 4);

    await retry.click();
    await page.clock.runFor(700);
    await first.getByText('All changes saved', { exact: true }).waitFor();
    assert.deepEqual(await fields.evaluateAll((inputs) => inputs.map((input) => input.value)), [
      edited,
      ...Array(5).fill(initial),
    ]);
    await toolbar.getByRole('button', { name: 'Reset' }).click();
    assert.equal(await fields.first().inputValue(), initial);
    assert.equal(await artboards.getByText('Unsaved changes', { exact: true }).count(), 6);

    await navigate(page, {
      item: 'app-shell',
      tab: 'states',
      block: 'save',
      family: 'soft',
      scheme: 'light',
      vp: '1280',
    });
    const canvas = frame.locator('.wb-artboard .app-shell-main');
    await canvas.waitFor();
    const scrolled = await canvas.evaluate((element) => {
      const bar = element.querySelector('.app-shell-sticky-bar');
      const before = bar.getBoundingClientRect().bottom;
      element.scrollTop = element.scrollHeight;
      return { distance: element.scrollTop, shift: bar.getBoundingClientRect().bottom - before };
    });
    assert.ok(scrolled.distance > 0, 'The desktop canvas needs content to scroll');
    assert.ok(Math.abs(scrolled.shift) <= 1, 'Save actions should stay visible while scrolling');
  },

  'AppShell save completion preserves typing and focus outside the saving artboard': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount('workbench-v3');
    await navigate(page, { item: 'app-shell', tab: 'states', block: 'save', freeze: '1' });
    const frame = page.locator('[data-wb-block="save"]');
    const boards = frame.locator('.wb-artboard');
    const fields = boards.getByRole('textbox', { name: 'Workspace name' });
    const first = boards.first();
    const second = boards.nth(1);
    await fields.first().waitFor();
    const initial = await fields.first().inputValue();
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));

    await first.getByRole('button', { name: 'Save changes' }).click();
    await fields.nth(1).focus();
    await page.keyboard.press('End');
    await page.keyboard.insertText(' X');
    await page.clock.runFor(750);
    await first.getByText('All changes saved').waitFor();
    assert.ok(await fields.nth(1).evaluate((field) => field.matches(':focus')));
    await page.keyboard.insertText('Y');
    assert.equal(await fields.nth(1).inputValue(), initial + ' XY');
    assert.equal(await fields.first().inputValue(), initial);

    await second.getByRole('button', { name: 'Save changes' }).click();
    const control = frame.getByRole('checkbox', { name: 'Simulate a save failure' });
    await control.focus();
    await page.clock.runFor(750);
    await second.getByText('All changes saved').waitFor();
    assert.ok(await control.evaluate((element) => element.matches(':focus')));

    const third = boards.nth(2);
    await third.getByRole('button', { name: 'Save changes' }).click();
    await page.clock.runFor(750);
    await third.getByText('All changes saved').waitFor();
    assert.ok(await fields.nth(2).evaluate((field) => field.matches(':focus')));
  },

  'AppShell validates the edited workspace alias independently in each artboard': async ({
    page,
    mount,
  }) => {
    await mount('workbench-v3');
    await navigate(page, { item: 'app-shell', tab: 'states', block: 'properties', freeze: '1' });

    const boards = page.locator('[data-wb-block="properties"] .wb-artboard');
    const fields = boards.getByRole('textbox', { name: 'Workspace alias' });
    const first = fields.first();
    await first.waitFor();
    assert.equal(await fields.count(), 6);
    assert.equal(await first.inputValue(), 'Design team!');
    assert.equal(await first.getAttribute('aria-invalid'), 'true');
    for (const value of ['design-team', 'עיצוב-2', 'design team!']) {
      await first.fill(value);
      const invalid = value.includes('!');
      assert.equal(await first.getAttribute('aria-invalid'), invalid ? 'true' : null);
      assert.equal(
        await boards.first().getByText('Invalid', { exact: true }).count(),
        invalid ? 1 : 0,
      );
      assert.equal(
        await first.evaluate(
          (field) =>
            field.ownerDocument.getElementById(field.getAttribute('aria-describedby'))?.textContent,
        ),
        'An alias can contain letters, digits and hyphens.',
      );
      assert.equal(await fields.nth(1).inputValue(), 'Design team!');
      assert.equal(await fields.nth(1).getAttribute('aria-invalid'), 'true');
    }
  },

  'Narrow overlay studies keep readable text on the floating surface': async ({ page, mount }) => {
    await page.setViewportSize({ width: 412, height: 950 });
    await mount('workbench-v3');

    for (const [item, tab, block, selector] of [
      ['app-shell', 'states', 'layout', '.shell-study-layout h3'],
      ['blockquote', 'states', 'overflow', 'blockquote p'],
      ['container', 'compositions', 'document', 'h3'],
    ]) {
      await navigate(page, {
        item,
        block,
        tab,
        family: 'pixel',
        scheme: 'light',
        surface: 'overlay',
        vp: '360',
        scale: '120',
        dir: 'rtl',
        raw: '1',
      });
      const frame = page.locator(`[data-wb-block="${block}"] .wb-artboard`);
      const reading = frame.locator(selector).first();
      await reading.waitFor({ state: 'attached' });
      const { stageWidth, textWidth, contained, painted } = await reading.evaluate((element) => {
        const stage = element.closest('[data-stage-content]').getBoundingClientRect();
        const text = element.getBoundingClientRect();
        const panel = element.closest('.unica-overlay-surface');
        return {
          painted: panel && getComputedStyle(panel).backgroundColor !== 'rgba(0, 0, 0, 0)',
          stageWidth: stage.width,
          textWidth: text.width,
          contained: text.left >= stage.left - 1 && text.right <= stage.right + 1,
        };
      });
      assert.ok(painted, `${item} text has no floating surface over the underlay`);
      assert.ok(textWidth >= stageWidth / 2, `${item} text collapsed to ${textWidth}px`);
      assert.ok(contained, `${item} text extends past its overlay stage`);
    }
  },

  'Workbench v3 StoryFrame controls, actions, and reset synchronize across all 6 themes without header jump':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mount('workbench-v3');
      await navigate(page, { item: 'progress', tab: 'states', block: 'motion' });

      const headerRow = page.locator('.wb-story-header-row').first();
      await headerRow.waitFor();
      const beforeHeight = (await headerRow.boundingBox()).height;

      const activeToggle = page.getByRole('checkbox', { name: 'Active' });
      await activeToggle.click();
      const afterHeight = (await headerRow.boundingBox()).height;
      assert.equal(afterHeight, beforeHeight, 'Toggling Active must not change header height');
      assert.equal(await page.getByText('Transfer paused').count(), 6);

      await activeToggle.click();
      await page.getByRole('button', { name: 'Reach 100%' }).click();
      assert.equal(await page.getByText('All bytes transferred').count(), 6);

      await page.getByRole('button', { name: 'Replay' }).click();
      assert.equal(await page.getByText('Transferring archive').count(), 6);

      // Mutate both frame control and action state right before Reset so Reset proves both restore.
      await activeToggle.click();
      await page.getByRole('button', { name: 'Reach 100%' }).click();
      assert.equal(await activeToggle.isChecked(), false);
      assert.equal(await page.getByText('All bytes transferred').count(), 6);

      await page.getByRole('button', { name: 'Reset' }).click();
      assert.equal(await activeToggle.isChecked(), true);
      assert.equal(await page.getByText('Transferring archive').count(), 6);

      // Button toggles and overflow keep zero ad-hoc harness controls inside artboards.
      await navigate(page, { item: 'button', tab: 'states', block: 'toggles' });
      await page.locator('.wb-story-frame[data-wb-block="toggles"]').waitFor();
      assert.equal(await page.locator('.wb-artboard select').count(), 0);
      await page.getByLabel('Tone').selectOption('danger');
      assert.equal(await page.locator('.wb-artboard').getByText('primary / danger / s').count(), 6);
    },

  'Workbench v3 solo expand/collapse, Escape after checkbox focus, light canvas, and Usage readiness work in Chromium':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mount('workbench-v3');
      await navigate(page, { item: 'button', tab: 'states', scheme: 'light' });

      const canvas = page.locator('.wb-canvas[data-canvas-scheme="light"]');
      await canvas.waitFor();
      const lightBg = await canvas.evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(lightBg, 'rgb(231, 231, 228)');

      // Expand a single artboard inside a case, toggle a StoryFrame checkbox, then Escape collapses solo cleanly.
      const lightFrame = page.locator('.wb-story-frame[data-wb-block="light"]');
      await lightFrame.getByRole('button', { name: 'Expand Frost · Light' }).click();
      await page.waitForFunction(() => window.location.search.includes('solo=frost-light'));
      assert.equal(await page.locator('.wb-artboard').count(), 1);
      assert.equal(
        await page
          .getByRole('group', { name: 'Scheme' })
          .getByRole('link', { name: 'Light' })
          .getAttribute('aria-current'),
        null,
      );

      const pendingCheckbox = page.getByRole('checkbox', { name: 'Pending' });
      await pendingCheckbox.click();
      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () =>
          !window.location.search.includes('solo=') &&
          window.location.search.includes('scheme=light'),
      );
      assert.ok((await page.locator('.wb-story-frame').count()) > 1);

      // Compositions code footer matches the light canvas scheme, and Button form uses real Unica Input.
      await navigate(page, { item: 'button', tab: 'compositions', scheme: 'light' });
      const footer = page.locator('.wb-story-footer').first();
      await footer.waitFor();
      const footerBg = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(footerBg, 'rgb(245, 245, 242)');
      assert.ok(
        (await page.locator('[data-wb-block="form"] .unica-input').count()) >= 3,
        'Button form composition must use real @docouno/unica Input',
      );

      // Compositions code footer returns to the dark surface when dark themes are visible.
      await navigate(page, { item: 'button', tab: 'compositions', scheme: 'both' });
      await page.locator('.wb-canvas[data-canvas-scheme="dark"]').waitFor();
      const darkFooterBg = await page
        .locator('.wb-story-footer')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(darkFooterBg, 'rgb(23, 23, 23)');

      // Button Playground renders only the button subject (no stray Workbench Submit/Reset wrapper buttons).
      await navigate(page, { item: 'button', tab: 'playground', scheme: 'light' });
      await page.locator('[data-wb-tab="playground"]').waitFor();
      await page.locator('.wb-artboard .unica-button').first().waitFor();
      assert.equal(await page.locator('.wb-inspector-form-actions').count(), 0);

      // Usage stays dark under scheme=light, resolves async Markdown to data-wb-ready="1", and omits sentinel "auto".
      await navigate(page, { item: 'button', tab: 'usage', scheme: 'light' });
      await page.locator('[data-wb-tab="usage"]').waitFor();
      await page.locator('#wb-usage-reference').waitFor();
      await page.waitForSelector('html[data-wb-ready="1"]');
      assert.equal(await page.locator('.wb-canvas').getAttribute('data-canvas-scheme'), 'dark');
      const propsTable = page.getByRole('table', { name: 'Public props' });
      const variantRow =
        (await propsTable.getByRole('row', { name: /^variant\b/ }).textContent()) ?? '';
      assert.match(variantRow, /"primary" \| "secondary" \| "ghost"/);
      assert.match(variantRow, /undefined/);
      assert.doesNotMatch(variantRow, /"auto"/);
      const widthRow =
        (await propsTable.getByRole('row', { name: /^width\b/ }).textContent()) ?? '';
      assert.match(widthRow, /"auto" \| "full"/);
    },
};

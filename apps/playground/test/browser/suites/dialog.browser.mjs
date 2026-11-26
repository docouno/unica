import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys, submitForm } from '../helpers.mjs';

const button = (scope, name) => scope.getByRole('button', { name, exact: true });
const editor = (page) => page.locator('#project-editor:modal');
const guard = (page) => page.locator('#discard-dialog:modal');
const draft = (scope) => scope.getByRole('textbox', { name: 'Project name', exact: true });
const popup = (scope) => scope.locator('[popover="auto"]:popover-open');
const body = (scope) => scope.locator('.unica-dialog-body').first();
const trigger = (page) => page.locator('#editor-trigger');

async function clickCommand(page, id) {
  await page.locator(`#${id}`).evaluate((node) => node.click());
}

async function requests(page, value) {
  await page.waitForFunction(
    (expected) => document.querySelector('#editor-requests')?.textContent === expected,
    value,
  );
}

async function openEditor(page, source = trigger(page)) {
  await source.click();
  await editor(page).waitFor();
  return editor(page);
}

async function waitForAttribute(page, selector, name, value) {
  await page.waitForFunction(
    ([selector, name, value]) => document.querySelector(selector)?.getAttribute(name) === value,
    [selector, name, value],
  );
}

async function assertScrollLock(page, value) {
  await page.waitForFunction(
    (expected) => document.documentElement.style.overflowY === expected,
    value,
  );
}

export default {
  'Modal public compound parts honor naming, invokers and native form participation': async ({
    page,
    mount,
  }) => {
    await mount('dialog', { theme: 'frost-dark' });
    await button(page, 'Veto editor').click();
    await button(page, 'Unavailable editor').evaluate((node) => node.click());
    assert.equal(await editor(page).count(), 0);
    assert.equal(await page.locator('#editor-requests').textContent(), '');
    await waitForAttribute(page, '#editor-trigger', 'aria-controls', 'project-editor');
    assert.equal(await trigger(page).getAttribute('aria-haspopup'), 'dialog');
    const carrier = await page.locator('#project-editor').elementHandle();
    assert.ok(carrier);

    const modal = await openEditor(page);
    await modal.getByRole('heading', { name: 'Edit project' }).waitFor();
    await page.getByRole('dialog', { name: 'Edit project', exact: true }).waitFor();
    assert.equal(await trigger(page).getAttribute('aria-expanded'), 'true');
    assert.equal(await modal.getAttribute('aria-describedby'), 'edit-summary');
    await clickCommand(page, 'rename-summary');
    await waitForAttribute(page, '#project-editor', 'aria-describedby', 'new-summary');
    await clickCommand(page, 'remove-summary');
    await waitForAttribute(page, '#project-editor', 'aria-describedby', null);
    const field = draft(modal);
    await assertFocused(field);
    const form = modal.getByRole('form', { name: 'Project form' });
    const save = button(modal, 'Save editor');
    assert.equal(await field.evaluate((node) => node.form.id), 'project-form');
    assert.equal(await save.evaluate((node) => node.form.id), 'project-form');
    assert.equal(await save.evaluate((node) => node.closest('form')), null);

    await field.fill('');
    await save.click();
    await assertFocused(field);
    assert.equal(await page.locator('#editor-submits').textContent(), '0');
    await field.fill('Updated project');
    await button(form, 'Access').click();
    await popup(modal).getByRole('option', { name: 'Editor', exact: true }).click();
    assert.deepEqual(await submitForm(form, save), [
      ['project', 'Updated project'],
      ['access', 'editor'],
      ['intent', 'save'],
    ]);
    await button(modal, 'Reset editor').click();
    assert.equal(await field.inputValue(), 'Original project');
    assert.deepEqual(await form.evaluate((node) => [...new FormData(node)]), [
      ['project', 'Original project'],
      ['access', 'reader'],
    ]);
    await button(modal, 'Cancel editing').click();
    await modal.waitFor({ state: 'detached' });
    await requests(page, 'open,request');
    assert.equal(await page.locator('#editor-submits').textContent(), '1');
    await assertFocused(page.locator('#logical-editor-return'));
    assert.equal(await trigger(page).getAttribute('aria-expanded'), 'false');
    assert.equal(
      await carrier.evaluate((node) => node.isConnected && node.childElementCount === 0),
      true,
    );
  },

  'Modal relinquishes Escape one native Select or Popover layer at a time': async ({
    page,
    mount,
  }) => {
    await mount('dialog');
    const modal = await openEditor(page);
    const picker = button(modal, 'Access');
    await picker.click();
    await popup(modal).getByRole('listbox').waitFor();
    await pressKeys(page, 'Escape');
    await popup(modal).waitFor({ state: 'detached' });
    await assertFocused(picker);
    await requests(page, 'open');

    const review = button(modal, 'Review settings');
    await review.click();
    const outer = modal.locator('#review-settings:popover-open');
    await outer.waitFor();
    await button(outer, 'Mark reviewed').click();
    assert.equal(await page.locator('#editor-actions').textContent(), '1');
    const advanced = button(outer, 'Advanced review');
    await advanced.click();
    const inner = outer.locator('#advanced-review:popover-open');
    await inner.waitFor();
    await pressKeys(page, 'Escape');
    await inner.waitFor({ state: 'detached' });
    await outer.waitFor();
    await assertFocused(advanced);
    await pressKeys(page, 'Escape');
    await outer.waitFor({ state: 'detached' });
    await modal.waitFor();
    await assertFocused(review);
    await requests(page, 'open');
    await draft(modal).evaluate((node) => {
      node.focus();
      node.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }),
      );
    });
    await modal.waitFor();
    await requests(page, 'open');
    await pressKeys(page, 'Escape');
    await modal.waitFor({ state: 'detached' });
    await requests(page, 'open,request');
  },

  'Modal keeps draft and scroll while a public guard owns focus and the Toast host': async ({
    page,
    mount,
  }) => {
    await mount('dialog', { theme: 'pixel-dark' });
    const notice = button(page, 'Scoped action 1');
    await notice.waitFor();
    assert.equal(
      await notice.evaluate((node) => node.parentElement.parentElement.id),
      'editor-portal',
    );
    await page.evaluate(() => {
      document.documentElement.style.overflowY = 'scroll';
    });
    const modal = await openEditor(page);
    await assertScrollLock(page, 'hidden');
    const field = draft(modal);
    await assertFocused(field);
    assert.equal(
      await notice.evaluate((node) => node.parentElement.parentElement.id),
      'project-editor',
    );
    await page.locator('[data-enqueue]').evaluate((node) => node.click());
    await button(modal, 'Scoped action 2').waitFor();
    await assertFocused(field);
    await field.fill('Preserved draft');
    await body(modal).evaluate((node) => {
      node.scrollTop = 95;
    });
    await field.evaluate((node) => node.setSelectionRange(2, 8, 'backward'));
    const selection = () =>
      field.evaluate((node) => [node.selectionStart, node.selectionEnd, node.selectionDirection]);
    const selected = [2, 8, 'backward'];
    assert.deepEqual(await selection(), selected, 'Before the guard opens');
    await pressKeys(page, 'Escape');
    const confirmation = guard(page);
    await confirmation.getByRole('heading', { name: 'Discard edits?' }).waitFor();
    await page.getByRole('alertdialog', { name: 'Discard edits?' }).waitFor();
    await requests(page, 'open,request');
    const keep = button(confirmation, 'Keep editing');
    const discard = button(confirmation, 'Discard edits');
    await assertFocused(keep);
    assert.deepEqual(await selection(), selected, 'While the guard is open');
    await button(modal, 'Save editor').evaluate((node) => node.focus());
    await assertFocused(keep);
    await page.mouse.wheel(0, 230);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    await discard.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(button(confirmation, 'Scoped action 1'));
    await button(confirmation, 'Scoped action 2').click();
    assert.equal(await page.locator('[data-queue="scoped"]').getAttribute('data-actions'), '1');
    assert.deepEqual(await selection(), selected, 'After interaction within the guard');
    await keep.click();
    await confirmation.waitFor({ state: 'detached' });
    await modal.waitFor();
    await assertScrollLock(page, 'hidden');
    assert.equal(
      await notice.evaluate((node) => node.parentElement.parentElement.id),
      'project-editor',
    );
    await assertFocused(field);
    assert.equal(await field.inputValue(), 'Preserved draft');
    assert.deepEqual(await selection(), selected, 'After returning to the editor');
    assert.equal(await body(modal).evaluate((node) => node.scrollTop), 95);

    await pressKeys(page, 'Escape');
    await confirmation.waitFor();
    await discard.click();
    await modal.waitFor({ state: 'detached' });
    await confirmation.waitFor({ state: 'detached' });
    await requests(page, 'open,request,request');
    await assertScrollLock(page, 'scroll');
    await assertFocused(page.locator('#logical-editor-return'));
    assert.equal(
      await notice.evaluate((node) => node.parentElement.parentElement.id),
      'editor-portal',
    );
    await openEditor(page);
    assert.equal(await draft(modal).inputValue(), 'Original project');
  },

  'Modal returns explicitly, preserves intentional focus and falls back to the actual invoker':
    async ({ page, mount }) => {
      await mount('dialog');
      const modal = await openEditor(page);
      await pressKeys(page, 'Escape');
      await modal.waitFor({ state: 'detached' });
      await assertFocused(page.locator('#logical-editor-return'));

      await openEditor(page);
      await trigger(page).evaluate((node) => {
        node.addEventListener(
          'focus',
          () => document.querySelector('#editor-outside-focus').focus(),
          { once: true },
        );
      });
      await pressKeys(page, 'Escape');
      await modal.waitFor({ state: 'detached' });
      await assertFocused(page.locator('#editor-outside-focus'));

      await openEditor(page);
      await page.locator('#logical-editor-return').evaluate((node) => {
        node.addEventListener(
          'focus',
          () => document.querySelector('#editor-outside-focus').focus(),
          { once: true },
        );
      });
      await pressKeys(page, 'Escape');
      await modal.waitFor({ state: 'detached' });
      await assertFocused(page.locator('#editor-outside-focus'));

      const alternate = page.locator('#alternative-trigger');
      await openEditor(page, alternate);
      await clickCommand(page, 'remove-next');
      await pressKeys(page, 'Escape');
      await modal.waitFor({ state: 'detached' });
      await assertFocused(alternate);
    },

  'Modal admits a command from an open Popover and returns to its live trigger': async ({
    page,
    mount,
  }) => {
    await mount('dialog');
    const launch = button(page, 'Project actions');
    await launch.click();
    const actions = page.locator('#project-actions:popover-open');
    await actions.waitFor();
    await button(actions, 'Open archive confirmation').click();
    const archive = page.locator('#archive-dialog:modal');
    await archive.waitFor();
    await actions.waitFor({ state: 'detached' });
    await page.locator('[data-toast-viewport]').waitFor({ state: 'detached' });
    await assertFocused(archive.getByRole('heading', { name: 'Archive project?' }));
    await pressKeys(page, 'Escape');
    await archive.waitFor({ state: 'detached' });
    await assertFocused(launch);
    assert.equal(await actions.count(), 0);
    await button(page, 'Scoped action 1').waitFor();
  },

  'Modal distinguishes a prevented native cancel from physical close and latches unchanged control':
    async ({ page, mount }) => {
      await mount('dialog');
      const modal = await openEditor(page);
      await draft(modal).fill('Unsaved close');
      await modal.evaluate((node) => node.requestClose());
      const confirmation = guard(page);
      await confirmation.waitFor();
      await requests(page, 'open,request');
      await pressKeys(page, 'Escape');
      await confirmation.waitFor({ state: 'detached' });
      await clickCommand(page, 'refuse-loss');
      await button(modal, 'Native close').click();
      await modal.waitFor({ state: 'detached' });
      await requests(page, 'open,request,lost');
      assert.equal(await confirmation.count(), 0);
      await assertFocused(page.locator('#logical-editor-return'));
      await clickCommand(page, 'rename-summary');
      assert.equal(await modal.count(), 0);
      await requests(page, 'open,request,lost');
      await assertScrollLock(page, '');

      await clickCommand(page, 'close-editor');
      await clickCommand(page, 'open-editor');
      await modal.waitFor();
      await requests(page, 'open,request,lost');
      await pressKeys(page, 'Escape');
      await confirmation.waitFor();
      await modal.evaluate((node) => node.close());
      await modal.waitFor({ state: 'detached' });
      await confirmation.waitFor({ state: 'detached' });
      await requests(page, 'open,request,lost,request,lost');
    },

  'Modal keeps a deliberate focus handoff during external close': async ({ page, mount }) => {
    await mount('dialog');
    const modal = await openEditor(page);
    await trigger(page).evaluate((node) => {
      node.addEventListener(
        'focus',
        () => document.querySelector('#editor-outside-focus').focus(),
        { once: true },
      );
    });
    await modal.evaluate((node) => node.close());
    await requests(page, 'open,lost');
    await assertFocused(page.locator('#editor-outside-focus'));
  },

  'Modal restores focus without a closing beforetoggle event': async ({ page, mount }) => {
    await page.addInitScript(() => {
      document.addEventListener(
        'beforetoggle',
        (event) => {
          if (event.target.localName === 'dialog' && event.newState === 'closed') {
            event.stopImmediatePropagation();
          }
        },
        true,
      );
    });
    await mount('dialog');
    const modal = await openEditor(page);
    await modal.evaluate((node) => node.close());
    await requests(page, 'open,lost');
    await assertFocused(page.locator('#logical-editor-return'));
  },

  'Modal restores focus on authoritative native close and keeps a same-task reopen': async ({
    page,
    mount,
  }) => {
    await mount('dialog');
    const modal = await openEditor(page);
    const next = page.locator('#logical-editor-return');
    await clickCommand(page, 'close-editor-authoritatively');
    await modal.waitFor({ state: 'detached' });
    await assertFocused(next);
    await requests(page, 'open');

    await openEditor(page);
    await next.evaluate((node) => {
      node.addEventListener('focus', () => node.setAttribute('data-returned', ''));
    });
    await clickCommand(page, 'reopen-editor-authoritatively');
    await assertFocused(draft(modal));
    assert.equal(await next.getAttribute('data-returned'), null);
    await requests(page, 'open,open');
  },

  'Modal drops the invoker of a refused controlled opening': async ({ page, mount }) => {
    await mount('dialog');
    await clickCommand(page, 'refuse-open');
    await trigger(page).click();
    await requests(page, 'open');
    assert.equal(await editor(page).count(), 0);
    await clickCommand(page, 'remove-next');
    const previous = page.locator('#editor-outside-focus');
    await previous.focus();
    await clickCommand(page, 'open-editor');
    await editor(page).waitFor();
    await pressKeys(page, 'Escape');
    await editor(page).waitFor({ state: 'detached' });
    await assertFocused(previous);
  },

  'Modal retains the closing invoker through synchronous native close without a return ref':
    async ({ page, mount }) => {
      await mount('dialog');
      await clickCommand(page, 'remove-next');
      const previous = page.locator('#editor-outside-focus');
      const invoker = trigger(page);
      await previous.focus();
      await invoker.evaluate((node) => node.click());
      await editor(page).waitFor();
      await clickCommand(page, 'close-editor-authoritatively');
      await editor(page).waitFor({ state: 'detached' });
      await assertFocused(invoker);
      await requests(page, 'open');
    },

  'Modal falls back to its title when initial focus is unavailable': async ({ page, mount }) => {
    await mount('dialog');
    for (const mode of ['collapsed', 'unboxed', 'hidden']) {
      await clickCommand(page, `choose-${mode}`);
      const modal = await openEditor(page);
      await assertFocused(modal.getByRole('heading', { name: 'Edit project' }));
      await pressKeys(page, 'Escape');
      await modal.waitFor({ state: 'detached' });
    }
  },

  'Modal switches managed hosts and reports an unexpectedly removed host once': async ({
    page,
    mount,
  }) => {
    await mount('dialog');
    const modal = await openEditor(page);
    assert.equal(await modal.evaluate((node) => node.parentElement.id), 'editor-portal');
    await clickCommand(page, 'move-editor-host');
    await page.locator('#replacement-portal > #project-editor:modal').waitFor();
    await requests(page, 'open');
    await draft(modal).fill('Lost host draft');
    await page.locator('#replacement-portal').evaluate((node) => node.remove());
    await modal.waitFor({ state: 'detached' });
    await requests(page, 'open,lost');
    assert.equal(await guard(page).count(), 0);
    await assertScrollLock(page, '');
    await clickCommand(page, 'unmount-editor');
    await trigger(page).waitFor({ state: 'detached' });
  },

  'Modal backdrop accepts only an opted-in primary press and release outside the panel': async ({
    page,
    mount,
  }) => {
    await mount('dialog');
    const background = await getBox(button(page, 'Outside action'));
    const outside = {
      x: background.x + background.width / 2,
      y: background.y + background.height / 2,
    };
    const modal = await openEditor(page);
    const box = await getBox(modal.getByRole('heading', { name: 'Edit project' }));
    const inside = { x: box.x + 5, y: box.y + 5 };
    await page.mouse.click(outside.x, outside.y);
    await modal.waitFor();
    await requests(page, 'open');
    await clickCommand(page, 'allow-backdrop');
    await page.mouse.click(outside.x, outside.y, { button: 'right' });
    for (const [from, to] of [
      [inside, outside],
      [outside, inside],
    ]) {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y);
      await page.mouse.up();
    }
    await modal.waitFor();
    await requests(page, 'open');
    await page.mouse.click(outside.x, outside.y);
    await modal.waitFor({ state: 'detached' });
    await requests(page, 'open,request');
    assert.equal(await page.locator('#outside-clicks').textContent(), '0');
    await page.mouse.click(outside.x, outside.y);
    assert.equal(await page.locator('#outside-clicks').textContent(), '1');
  },

  'Drawer and nested default-open Modal admit parent first and keep scroll locked': async ({
    page,
    mount,
  }) => {
    await mount('dialog');
    const launch = button(page, 'Mount open stack');
    await launch.click();
    const drawer = page.locator('#stack-drawer:modal');
    const child = drawer.locator('#stack-modal:modal');
    await child.waitFor();
    assert.equal(await page.locator('#initial-stack-changes').textContent(), '');
    await assertFocused(child.getByRole('heading', { name: 'Nested modal' }));
    await assertScrollLock(page, 'hidden');
    await pressKeys(page, 'Escape');
    await child.waitFor({ state: 'detached' });
    await drawer.waitFor();
    await assertScrollLock(page, 'hidden');
    assert.equal(await page.locator('#initial-stack-changes').textContent(), 'modal:false');
    await pressKeys(page, 'Escape');
    await drawer.waitFor({ state: 'detached' });
    await assertScrollLock(page, '');
    assert.equal(
      await page.locator('#initial-stack-changes').textContent(),
      'modal:false,drawer:false',
    );
    await assertFocused(launch);
  },

  'Modal touch entry focuses the static heading or fallback before an editable control': async ({
    page,
    origin,
    watchPage,
  }) => {
    const context = await page
      .context()
      .browser()
      .newContext({
        hasTouch: true,
        viewport: { width: 390, height: 680 },
      });
    try {
      const touch = watchPage(await context.newPage());
      touch.setDefaultTimeout(5000);
      touch.setDefaultNavigationTimeout(10000);
      const url = new URL('/test/browser/index.html', origin);
      url.search = new URLSearchParams({ fixture: 'dialog', theme: 'soft-dark' });
      await touch.goto(url.href, { waitUntil: 'commit' });
      await touch.locator('[data-browser-ready]').waitFor({ state: 'attached', timeout: 20000 });
      await touch.evaluate(() => {
        document.body.dataset.modalFocusLog = '';
        document.addEventListener('focusin', (event) => {
          if (event.target.closest('#project-editor')) {
            document.body.dataset.modalFocusLog += `${event.target.localName},`;
          }
        });
      });
      await trigger(touch).tap();
      const modal = editor(touch);
      await modal.waitFor();
      await assertFocused(modal.getByRole('heading', { name: 'Edit project' }));
      assert.equal(await touch.locator('body').getAttribute('data-modal-focus-log'), 'h2,');
      await button(modal, 'Cancel editing').tap();
      await modal.waitFor({ state: 'detached' });
      await clickCommand(touch, 'remove-title');
      await trigger(touch).tap();
      await touch.getByRole('dialog', { name: 'Editor without heading' }).waitFor();
      await assertFocused(modal.locator('.unica-dialog-surface'));
      const focusLog = await touch.locator('body').getAttribute('data-modal-focus-log');
      assert.ok(focusLog.includes('div,'));
      assert.ok(!focusLog.includes('input,'));
    } finally {
      await context.close();
    }
  },
};

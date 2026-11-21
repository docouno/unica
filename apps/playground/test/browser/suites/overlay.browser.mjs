import assert from 'node:assert/strict';
import { assertFocused, assertHitTarget, getBox } from '../helpers.mjs';

async function command(page, ...commands) {
  await page.locator('#overlay-fixture').evaluate((fixture, actions) => {
    for (const detail of actions) {
      fixture.dispatchEvent(new CustomEvent('fixture-command', { detail }));
    }
  }, commands);
}

async function statistic(page, key, value) {
  await page.waitForFunction(
    ([key, value]) => (document.querySelector('#stats').dataset[key] ?? '0') === String(value),
    [key, value],
  );
}

async function visibleLayer(page, id, selector = ':popover-open') {
  await page.locator(`#${id}${selector}`).waitFor({ state: 'visible' });
}

async function closedLayer(page, id, selector = ':popover-open') {
  await page.locator(`#${id}${selector}`).waitFor({ state: 'detached' });
}

async function layerOrder(page) {
  return page.evaluate(() =>
    document
      .elementsFromPoint(335, 250)
      .map(({ id }) => id)
      .filter((id) => ['p1', 'p2', 'manual'].includes(id)),
  );
}

async function lock(page) {
  return page.evaluate(() => {
    const { style } = document.documentElement;
    return [style.overflowX, style.overflowY, style.getPropertyPriority('overflow-y')];
  });
}

async function invokerTargetId(page, selector) {
  return page.locator(selector).evaluate((el) => el.popoverTargetElement?.id ?? null);
}

export default {
  'a controlled auto trigger toggles once, respects click preventDefault, and updates callbacks':
    async ({ page, mount }) => {
      await mount('overlay');
      const trigger = page.locator('#trigger2');
      await page.locator('#trigger1').click();
      await visibleLayer(page, 'p1');
      assert.equal(
        await page.locator('#stats').getAttribute('data-trigger1-default-prevented'),
        'false',
      );
      await trigger.click();
      await visibleLayer(page, 'p2');
      assert.equal(await invokerTargetId(page, '#trigger2'), 'p2');
      await statistic(page, 'p2Changes', 1);

      await command(page, 'animate');
      await trigger.click();
      await statistic(page, 'p2Changes', 2);
      assert.equal(await invokerTargetId(page, '#trigger2'), null);
      assert.equal(await page.locator('#p2:popover-open').getAttribute('inert'), '');
      await command(page, 'finish-b', 'replace-trigger');
      await closedLayer(page, 'p2');
      assert.equal(await invokerTargetId(page, '#trigger2'), null);
      const replacement = page.locator('#replacement');
      await replacement.focus();
      await page.keyboard.press('Space');
      await visibleLayer(page, 'p2');
      assert.equal(await invokerTargetId(page, '#replacement'), 'p2');
      await statistic(page, 'p2Changes', 3);

      // handle.update swaps callbacks without re-registering an open overlay.
      await command(page, 'update-b-callback');
      await replacement.click();
      await closedLayer(page, 'p2');
      await statistic(page, 'updatedCallback', 1);

      // A user click handler calling preventDefault cancels trigger toggling.
      await command(page, 'cancel-trigger1-click');
      await page.locator('#trigger1').click();
      await visibleLayer(page, 'p1');
    },

  'non-button, Shadow DOM, and nested auto triggers toggle cleanly without hijacking or reopening':
    async ({ page, mount }) => {
      await mount('overlay');
      const divTrigger = page.locator('#div-trigger');
      await divTrigger.click();
      await visibleLayer(page, 'div-popover');
      await divTrigger.click();
      await closedLayer(page, 'div-popover');
      await statistic(page, 'divPopoverChanges', 2);

      // Delayed synthetic click (mobile touch delay) after native light-dismiss must not reopen.
      await divTrigger.click();
      await visibleLayer(page, 'div-popover');
      await page.evaluate(async () => {
        const trigger = document.querySelector('#div-trigger');
        const popover = document.querySelector('#div-popover');
        trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        popover.hidePopover();
        trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 60));
        trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      await closedLayer(page, 'div-popover');
      await statistic(page, 'divPopoverChanges', 4);

      // Aborted drag-off click followed by a fresh click immediately reopens via pointerdown reset.
      await divTrigger.click();
      await visibleLayer(page, 'div-popover');
      await page.evaluate(() => {
        const trigger = document.querySelector('#div-trigger');
        const popover = document.querySelector('#div-popover');
        trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        popover.hidePopover();
        trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      });
      await closedLayer(page, 'div-popover');
      await divTrigger.click();
      await visibleLayer(page, 'div-popover');
      await divTrigger.click();
      await closedLayer(page, 'div-popover');

      // Nested inner trigger registered after outer trigger must win via composedPath order.
      await page.locator('#inner-nested-trigger').click();
      await visibleLayer(page, 'inner-nested-popover');
      await closedLayer(page, 'outer-nested-popover');
      await statistic(page, 'innerNestedPopoverChanges', 1);
      await statistic(page, 'outerNestedPopoverChanges', 0);
      await page.locator('#inner-nested-trigger').click();
      await closedLayer(page, 'inner-nested-popover');

      const shadowButton = page.locator('#shadow-trigger-host').locator('#shadow-button');
      await shadowButton.click();
      await visibleLayer(page, 'shadow-popover');
      assert.equal(
        await shadowButton.evaluate((el) => el.popoverTargetElement?.id ?? null),
        'shadow-popover',
      );
      await shadowButton.click();
      await closedLayer(page, 'shadow-popover');
      await statistic(page, 'shadowPopoverChanges', 2);
    },

  'native dismissal latches stale controlled state and respects outside focus': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await page.locator('#trigger1').click();
    await page.locator('#trigger2').click();
    await command(page, 'ignore-dismiss');
    await page.locator('#modal-trigger').focus();
    await page.keyboard.press('Escape');
    await closedLayer(page, 'p2');
    await assertFocused(page.locator('#trigger2'));
    await statistic(page, 'p2Changes', 2);
    await statistic(page, 'reason', 'native');
    await command(page, 'open-b');
    await closedLayer(page, 'p2');

    await page.locator('#trigger2').press('Enter');
    await visibleLayer(page, 'p2');
    await page.locator('#outside').click();
    await closedLayer(page, 'p2');
    await closedLayer(page, 'p1');
    await assertFocused(page.locator('#outside'));
    await statistic(page, 'p2Changes', 4);
  },

  'an immediate explicit reopen follows the pending native dismissal report': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'open-a', 'open-b', 'dismiss-then-reopen');
    await statistic(page, 'p2Changes', 2);
    await statistic(page, 'reason', 'trigger');
    await visibleLayer(page, 'p2');
    assert.equal(await invokerTargetId(page, '#trigger2'), 'p2');
  },

  'a newer controlled close supersedes a reopen deferred behind native dismissal': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'open-a', 'open-b', 'dismiss-then-controlled-close');
    await statistic(page, 'p2Changes', 1);
    await statistic(page, 'reason', 'native');
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await closedLayer(page, 'p2');
  },

  'interrupting beginExit with setOpen(true) or native dismiss preserves state and focus': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    // Auto popover: beginExit -> reopen restores invoker and clears inert.
    await command(page, 'open-a', 'open-b', 'begin-exit-b');
    assert.equal(await page.locator('#p2:popover-open').getAttribute('inert'), '');
    await command(page, 'reopen-b');
    assert.equal(await page.locator('#p2:popover-open').getAttribute('inert'), null);
    assert.equal(await invokerTargetId(page, '#trigger2'), 'p2');

    // Auto popover: beginExit while focused -> native dismiss returns focus and does not latch dismissed.
    await page.locator('#modal-trigger').focus();
    await command(page, 'begin-exit-b', 'hide-b-natively');
    await closedLayer(page, 'p2');
    await assertFocused(page.locator('#trigger2'));
    await command(page, 'reopen-b');
    await visibleLayer(page, 'p2');

    // Modal: beginExit -> reopen clears inert, restores modal projection, and Escape works again.
    await command(page, 'open-dialog', 'disable-guard', 'begin-exit-dialog');
    await statistic(page, 'toastHost', 'modal-host');
    assert.equal(await page.locator('#dialog:modal').getAttribute('inert'), '');
    await command(page, 'reopen-dialog');
    assert.equal(await page.locator('#dialog:modal').getAttribute('inert'), null);
    await statistic(page, 'toastHost', 'dialog');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'dialog', ':modal');
  },

  'DOM clobbering on forms and Document never loops or throws in overlay coordination': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    const box = await page.evaluate(() => {
      const rect = document.querySelector('#clobbered-trigger').getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    await page.mouse.click(box.x, box.y);
    await page.waitForFunction(() =>
      Element.prototype.matches.call(document.querySelector('#clobbered-form'), ':popover-open'),
    );
    // Positioning and disposing a <form popover> with name="style"/"removeEventListener" must work.
    await command(page, 'position-clobbered');
    await page.waitForFunction(
      () =>
        Element.prototype.getAttribute.call(
          document.querySelector('#clobbered-form'),
          'data-surface',
        ) === 'overlay',
    );
    await page.evaluate(() => {
      HTMLElement.prototype.focus.call(document.querySelector('#clobbered-action'));
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () =>
        !Element.prototype.matches.call(document.querySelector('#clobbered-form'), ':popover-open'),
    );
    assert.equal(
      await page.evaluate(
        () =>
          Object.getOwnPropertyDescriptor(Document.prototype, 'activeElement').get.call(
            document,
          ) === document.querySelector('#clobbered-trigger'),
      ),
      true,
    );
    await command(page, 'dispose-clobbered');

    // Document-level DOM clobbering (<form name="defaultView">, <img name="body">, etc.).
    await command(page, 'clobber-document');
    await command(page, 'open-dialog', 'disable-guard');
    await visibleLayer(page, 'dialog', ':modal');
    await statistic(page, 'toastHost', 'dialog');
    assert.equal(
      await page.evaluate(() => {
        const html = Object.getOwnPropertyDescriptor(
          Document.prototype,
          'documentElement',
        ).get.call(document);
        return Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style')
          .get.call(html)
          .getPropertyValue('overflow');
      }),
      'hidden',
    );
    await page.keyboard.press('Escape');
    await closedLayer(page, 'dialog', ':modal');
    await statistic(page, 'toastHost', 'modal-host');
    assert.equal(
      await page.evaluate(() => {
        const html = Object.getOwnPropertyDescriptor(
          Document.prototype,
          'documentElement',
        ).get.call(document);
        const s = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style').get.call(html);
        return `${s.overflowX}:${s.overflowY}`;
      }),
      'clip:auto',
    );

    // Proves documentBodyOf in resolveToastPortalHost when modal lives outside <body>.
    await command(page, 'check-body-toast-outside-body');
    await statistic(page, 'rootDialogToastHost', 'root-dialog');

    // Proves documentBodyOf in both ownedFocus and returnFocus on popover="manual" after blur to <body>.
    await page.evaluate(() => {
      HTMLElement.prototype.focus.call(document.querySelector('#outside'));
    });
    await command(page, 'open-manual');
    await visibleLayer(page, 'manual');
    await page.evaluate(() => {
      const inside = document.querySelector('#inside-manual');
      HTMLElement.prototype.focus.call(inside);
      HTMLElement.prototype.blur.call(inside);
    });
    await page.keyboard.press('Escape');
    await closedLayer(page, 'manual');
    assert.equal(
      await page.evaluate(
        () =>
          Object.getOwnPropertyDescriptor(Document.prototype, 'activeElement').get.call(
            document,
          ) === document.querySelector('#outside'),
      ),
      true,
    );
  },

  'Escape respects inner preventDefault and routes manual, passive, and foreign layers': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'open-a');
    await page.locator('#inside-a').focus();
    await command(page, 'open-manual', 'open-passive', 'consume-inner-escape');
    await page.locator('#inside-manual').focus();
    await page.keyboard.press('Escape');
    await statistic(page, 'innerEscapeConsumed', 1);
    await visibleLayer(page, 'manual');

    await mount('overlay');
    await command(page, 'open-dialog', 'disable-guard', 'consume-inner-escape');
    await page.locator('#draft').focus();
    await page.keyboard.press('Escape');
    await statistic(page, 'innerEscapeConsumed', 1);
    await visibleLayer(page, 'dialog', ':modal');

    await mount('overlay');
    await command(page, 'open-a');
    await page.locator('#inside-a').focus();
    await command(page, 'open-manual', 'open-passive');
    await page.locator('#inside-manual').focus();
    await page.keyboard.press('Escape');
    await closedLayer(page, 'manual');
    await visibleLayer(page, 'p1');
    await visibleLayer(page, 'passive');
    await statistic(page, 'escapes', 1);
    await page.keyboard.press('Escape');
    await closedLayer(page, 'p1');
    await statistic(page, 'escapes', 2);

    await command(page, 'open-manual', 'foreign-modal');
    await assertFocused(page.locator('#foreign-action'));
    await page.keyboard.press('Escape');
    await closedLayer(page, 'foreign', ':modal');
    await visibleLayer(page, 'manual');
    await statistic(page, 'manualChanges', 1);

    // Updating passive to undefined restores Escape dismissal (after manual above it closes).
    await command(page, 'make-passive-active');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'manual');
    await visibleLayer(page, 'passive');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'passive');

    // Portaled manual overlay triggered inside a foreign auto popover dismisses before the foreign popover.
    await mount('overlay');
    await command(page, 'open-foreign-auto-combo');
    await visibleLayer(page, 'foreign-auto');
    await visibleLayer(page, 'foreign-combo-panel');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'foreign-combo-panel');
    await visibleLayer(page, 'foreign-auto');

    // Portaled manual and auto overlays triggered inside an active Unica modal dismiss before the modal.
    await mount('overlay');
    await command(page, 'disable-guard', 'open-dialog', 'open-dialog-portaled-manual');
    await visibleLayer(page, 'dialog', ':modal');
    await visibleLayer(page, 'dialog-portaled-manual');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'dialog-portaled-manual');
    await visibleLayer(page, 'dialog', ':modal');
    await command(page, 'open-dialog-portaled-auto');
    await visibleLayer(page, 'dialog-portaled-auto');
    // An exiting modal barrier absorbs Escape instead of leaking it to child popovers.
    await command(page, 'begin-exit-dialog');
    await page.keyboard.press('Escape');
    await visibleLayer(page, 'dialog-portaled-auto');
    await visibleLayer(page, 'dialog', ':modal');
    await command(page, 'reopen-dialog');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'dialog-portaled-auto');
    await visibleLayer(page, 'dialog', ':modal');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'dialog', ':modal');

    // Open <dialog popover="auto"> is not treated as a hidden ancestor, and native popover dismiss reconciles nested manual layers.
    await mount('overlay');
    await command(page, 'open-dialog-popover-child');
    await visibleLayer(page, 'foreign-dialog-popover');
    await visibleLayer(page, 'dialog-popover-child');
    await page.locator('#dialog-popover-child-action').focus();
    await page.keyboard.press('Escape');
    await closedLayer(page, 'dialog-popover-child');
    await assertFocused(page.locator('#dialog-popover-trigger'));

    await command(page, 'open-a', 'open-manual-in-p1');
    await visibleLayer(page, 'manual-in-p1');
    const dismissedAtMicrotask = await page.evaluate(async () => {
      document
        .querySelector('#overlay-fixture')
        .dispatchEvent(new CustomEvent('fixture-command', { detail: 'hide-p1-natively' }));
      await Promise.resolve();
      await Promise.resolve();
      return !document.querySelector('#manual-in-p1').matches(':popover-open');
    });
    assert.equal(dismissedAtMicrotask, true);
  },

  'nested auto popovers inside guarded and unguarded modals dismiss one layer per Escape': async ({
    page,
    mount,
  }) => {
    // Guarded modal with nested auto popover.
    await mount('overlay');
    await command(page, 'open-dialog', 'open-guarded', 'ignore-dismiss');
    await page.locator('#draft').evaluate((input) => {
      input.value = 'unsaved';
    });
    await page.locator('#nested-action').focus();
    await page.keyboard.press('Escape');
    await closedLayer(page, 'guarded');
    await visibleLayer(page, 'dialog', ':modal');
    await statistic(page, 'guard', 0);
    await statistic(page, 'guardedChanges', 1);
    await statistic(page, 'escapes', 1);
    await assertFocused(page.locator('#nested-trigger'));
    assert.equal(await page.locator('#draft').inputValue(), 'unsaved');
    await command(page, 'open-guarded');
    await closedLayer(page, 'guarded');

    await page.keyboard.press('Escape');
    await visibleLayer(page, 'confirm', ':modal');
    await statistic(page, 'guard', 1);
    await statistic(page, 'escapes', 2);
    await page.keyboard.press('Escape');
    await visibleLayer(page, 'confirm', ':modal');
    await statistic(page, 'confirmRequests', 1);
    await page.locator('#dismiss-confirm').click();
    await visibleLayer(page, 'dialog', ':modal');
    await command(page, 'native-cancel');
    await statistic(page, 'guard', 2);
    await statistic(page, 'reason', 'cancel');
    await visibleLayer(page, 'dialog', ':modal');

    // Unguarded modal with two programmatically opened nested auto popovers.
    await mount('overlay');
    await command(page, 'disable-guard', 'open-dialog', 'open-guarded', 'open-guarded-inner');
    await visibleLayer(page, 'guarded-inner');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'guarded-inner');
    await visibleLayer(page, 'guarded');
    await visibleLayer(page, 'dialog', ':modal');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'guarded');
    await visibleLayer(page, 'dialog', ':modal');
    await page.keyboard.press('Escape');
    await closedLayer(page, 'dialog', ':modal');
  },

  'closing a modal immediately dismisses nested popovers instead of leaving hidden ghosts': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'nested-positioned', 'open-guarded');
    await visibleLayer(page, 'nested-positioned');
    await visibleLayer(page, 'guarded');
    await command(page, 'close-dialog');
    await closedLayer(page, 'dialog', ':modal');
    await closedLayer(page, 'nested-positioned');
    await closedLayer(page, 'guarded');
    await statistic(page, 'nestedPositionedChanges', 1);
    await statistic(page, 'guardedChanges', 1);
    await statistic(page, 'reason', 'lost');

    // Reopening the dialog must not resurrect previously hidden nested popovers.
    await command(page, 'open-dialog');
    await visibleLayer(page, 'dialog', ':modal');
    await closedLayer(page, 'nested-positioned');
    await closedLayer(page, 'guarded');
  },

  'Escape in a foreign manual popover lets it close itself without dismissing underlying layers':
    async ({ page, mount }) => {
      await mount('overlay');
      await command(page, 'open-a', 'foreign-manual');
      await page.locator('#foreign-manual-action').focus();
      await page.keyboard.press('Escape');
      await statistic(page, 'escapes', 1);
      await statistic(page, 'foreignManualClosed', 1);
      assert.equal(
        await page.locator('#stats').getAttribute('data-foreign-manual-default-prevented'),
        'false',
      );
      await closedLayer(page, 'foreign-manual');
      await visibleLayer(page, 'p1');
      await statistic(page, 'p1Changes', 0);

      await mount('overlay');
      await command(page, 'open-dialog', 'foreign-manual-in-dialog');
      await page.locator('#foreign-manual-action').focus();
      await page.keyboard.press('Escape');
      await statistic(page, 'escapes', 1);
      await statistic(page, 'foreignManualClosed', 1);
      await closedLayer(page, 'foreign-manual');
      await visibleLayer(page, 'dialog', ':modal');
      await statistic(page, 'guard', 0);
    },

  'focus return survives contextmenu, falls back past disabled triggers, and honors opt-out':
    async ({ page, mount }) => {
      await mount('overlay');
      await page.locator('#outside').focus();
      await command(page, 'open-a', 'open-b');
      await page.locator('#modal-trigger').focus();
      // Right-click outside dispatches pointerdown + contextmenu without pointerup.
      await page.locator('#outside').evaluate((el) => {
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 2 }));
        el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2 }));
      });
      await command(page, 'finish-b');
      await closedLayer(page, 'p2');
      await assertFocused(page.locator('#trigger2'));

      // Disabled trigger falls back to previousFocus.
      await page.locator('#inside-a').focus();
      await command(page, 'open-b', 'disable-trigger2');
      await page.locator('#modal-trigger').focus();
      await command(page, 'finish-b');
      await closedLayer(page, 'p2');
      await assertFocused(page.locator('#inside-a'));

      // Explicit opt-out skips focus restoration.
      await command(page, 'open-b');
      await page.locator('#modal-trigger').focus();
      await command(page, 'finish-b-no-focus');
      await closedLayer(page, 'p2');
      assert.equal(
        await page.evaluate(() => document.activeElement === document.querySelector('#inside-a')),
        false,
      );
    },

  'stacked dialogs keep scroll lock and toast projection until the last modal closes': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'open-dialog');
    await visibleLayer(page, 'dialog', ':modal');
    await statistic(page, 'toastHost', 'dialog');
    assert.deepEqual(await lock(page), ['hidden', 'hidden', 'important']);

    await command(page, 'open-confirm');
    await visibleLayer(page, 'confirm', ':modal');
    await statistic(page, 'toastHost', 'confirm');

    // Closing the lower modal keeps scroll lock and upper modal projection active.
    await command(page, 'close-dialog');
    await closedLayer(page, 'dialog', ':modal');
    await visibleLayer(page, 'confirm', ':modal');
    await statistic(page, 'toastHost', 'confirm');
    assert.deepEqual(await lock(page), ['hidden', 'hidden', 'important']);

    await page.locator('#dismiss-confirm').click();
    await closedLayer(page, 'confirm', ':modal');
    await statistic(page, 'toastHost', 'modal-host');
    assert.deepEqual(await lock(page), ['clip', 'auto', 'important']);
  },

  'removing, moving, natively closing, or disposing a modal releases projection and lock': async ({
    page,
    mount,
  }) => {
    for (const mutation of [
      'move-dialog',
      'remove-dialog-host',
      'native-close',
      'dispose-dialog',
    ]) {
      await mount('overlay');
      await command(page, 'open-dialog');
      await statistic(page, 'toastHost', 'dialog');
      await command(page, mutation);
      await closedLayer(page, 'dialog', ':modal');
      await statistic(page, 'toastHost', 'modal-host');
      await statistic(page, 'projection', 2);
      assert.deepEqual(await lock(page), ['clip', 'auto', 'important']);
    }
  },

  'removing an auto trigger dismisses its popover': async ({ page, mount }) => {
    await mount('overlay');
    await command(page, 'open-a', 'open-b');
    await visibleLayer(page, 'p2');
    await command(page, 'remove-trigger');
    await closedLayer(page, 'p2');
    await statistic(page, 'p2Changes', 1);
    await statistic(page, 'reason', 'lost');
  },

  'aborted admission notifies lost while synchronous dispose rolls back silently': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'abort-admission');
    await closedLayer(page, 'dialog', ':modal');
    await statistic(page, 'guard', 1);
    await statistic(page, 'reason', 'lost');
    await statistic(page, 'projection', 0);
    assert.deepEqual(await lock(page), ['clip', 'auto', 'important']);

    await mount('overlay');
    await command(page, 'dispose-on-admission');
    await closedLayer(page, 'dialog', ':modal');
    await statistic(page, 'guard', 0);
    await statistic(page, 'projection', 0);
    assert.deepEqual(await lock(page), ['clip', 'auto', 'important']);
  },

  'reentrant native show records the newly admitted layer above the layer that focused it': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await page.locator('#inside-a').evaluate((node) => node.setAttribute('autofocus', ''));
    await command(page, 'reenter-show');
    assert.deepEqual(await layerOrder(page), ['manual', 'p1']);
    await page.keyboard.press('Escape');
    await closedLayer(page, 'manual');
    await visibleLayer(page, 'p1');
  },

  'border-box observation detects silent removal and ignores an ordinary resize': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await page.locator('#p2').evaluate((panel) => {
      panel.replaceChildren();
      Object.assign(panel.style, { width: '0', height: '0', padding: '20px' });
      const nativeObserve = ResizeObserver.prototype.observe;
      ResizeObserver.prototype.observe = function (target, options) {
        if (target === panel) {
          panel.dataset.observedBox = options.box;
        }
        nativeObserve.call(this, target, options);
      };
    });
    await command(page, 'open-a', 'open-b');
    await visibleLayer(page, 'p2');
    assert.equal(await page.locator('#p2').getAttribute('data-observed-box'), 'border-box');
    await page.locator('#p2').evaluate(async (panel) => {
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      await nextFrame();
      panel.style.padding = '26px';
      await nextFrame();
      await nextFrame();
    });
    await statistic(page, 'p2Changes', 0);
    await command(page, 'move-panel');
    await closedLayer(page, 'p2');
    await statistic(page, 'p2Changes', 1);
    await statistic(page, 'reason', 'lost');
  },

  'background wheel is locked while dialog scrolls, and shorthand overflow + scroll position behave':
    async ({ page, mount }) => {
      await mount('overlay');
      await page.evaluate(() => window.scrollTo(0, 420));
      await command(page, 'open-dialog');
      await page.mouse.move(5, 300);
      await page.mouse.wheel(0, 320);
      const dialog = await getBox(page.locator('#dialog'));
      await page.mouse.move(dialog.x + dialog.width / 2, dialog.y + dialog.height / 2);
      await page.mouse.wheel(0, 450);
      await page.waitForFunction(() => document.querySelector('#dialog').scrollTop > 0);
      assert.equal(await page.evaluate(() => window.scrollY), 420);
      await command(page, 'close-dialog');
      assert.equal(await page.evaluate(() => window.scrollY), 420);
      assert.equal(
        await page.evaluate(() =>
          document.documentElement.style.getPropertyValue('padding-inline-end'),
        ),
        '',
      );
      await page.mouse.move(5, 300);
      await page.mouse.wheel(0, 300);
      await page.waitForFunction(() => window.scrollY > 420);

      // Shorthand overflow restoration and preserving intentional scroll changes during modal.
      await command(page, 'set-shorthand-overflow', 'open-dialog');
      await page.evaluate(() => window.scrollTo({ top: 100, behavior: 'instant' }));
      await command(page, 'close-dialog');
      assert.equal(await page.evaluate(() => window.scrollY), 100);
      assert.deepEqual(await lock(page), ['scroll', 'scroll', 'important']);
    },

  'positioned top-layer panels escape clipping, size in one pass, and align in LTR and RTL':
    async ({ page, mount }) => {
      for (const direction of ['ltr', 'rtl']) {
        await mount('overlay', { direction });
        await command(page, 'open-positioned');
        const floating = page.locator('#positioned');
        await page.waitForFunction(
          () =>
            document.querySelector('#positioned').style.getPropertyValue('--anchor-width') ===
            '80px',
        );
        const anchor = await getBox(page.locator('#anchor'));
        const box = await getBox(floating);
        const aligned =
          direction === 'ltr' ? box.x - anchor.x : box.x + box.width - anchor.x - anchor.width;
        assert.ok(Math.abs(aligned) <= 1, `logical alignment in ${direction}`);
        assert.equal(await floating.getAttribute('data-surface'), 'overlay');
        assert.equal(await floating.getAttribute('data-side'), 'bottom');
        assert.equal(await floating.getAttribute('data-align'), 'start');
        assert.ok(
          await floating.evaluate(
            (el) => parseFloat(el.style.getPropertyValue('--overlay-available-width')) > 0,
          ),
        );
        assert.ok(box.y >= anchor.y + anchor.height + 5);
        const action = page.locator('#positioned-action');
        const actionBox = await getBox(action);
        const clip = await getBox(page.locator('#clip'));
        assert.ok(actionBox.y + actionBox.height > clip.y + clip.height);
        const point = {
          x: actionBox.x + actionBox.width / 2,
          y: actionBox.y + actionBox.height - 2,
        };
        await assertHitTarget(action, point);
        await page.mouse.click(point.x, point.y);
        await statistic(page, 'positionedClicks', 1);

        const opposite = direction === 'ltr' ? 'rtl' : 'ltr';
        const assertAlignment = async (dir) => {
          const left = dir === 'ltr' ? anchor.x : anchor.x + anchor.width - box.width;
          await page.waitForFunction(
            (expected) =>
              Math.abs(
                document.querySelector('#positioned').getBoundingClientRect().left - expected,
              ) <= 1,
            left,
          );
          assert.deepEqual(await getBox(page.locator('#anchor')), anchor);
        };
        for (const dir of [opposite, direction]) {
          await page.locator('html').evaluate((html, dir) => {
            html.dir = dir;
          }, dir);
          await assertAlignment(dir);
        }

        // Constrained top placement with padding sizes and positions cleanly without clipping.
        await command(page, 'close-positioned', 'open-positioned-top-padded');
        await page.waitForFunction(
          () => document.querySelector('#positioned').getAttribute('data-side') === 'top',
        );
        const constrained = await getBox(floating);
        assert.ok(constrained.y >= 15, `top padding respected (${constrained.y})`);
        assert.ok(
          Math.abs(constrained.y + constrained.height - (anchor.y - 8)) <= 2,
          'constrained top panel sits directly above anchor',
        );

        await command(page, 'close-positioned', 'open-positioned');
        const originalClip = await page.locator('#clip').evaluate((clip, dir) => {
          const style = clip.style.cssText;
          clip.style.cssText += `top:562px;left:${dir === 'ltr' ? 710 : 4}px;width:120px`;
          clip.querySelector('#anchor').style.width = '64px';
          return style;
        }, direction);
        await page.waitForFunction(
          () =>
            document.querySelector('#positioned').style.getPropertyValue('--anchor-width') ===
            '64px',
        );
        const flipped = await getBox(floating);
        assert.ok(flipped.y + flipped.height < (await getBox(page.locator('#anchor'))).y);
        assert.equal(await floating.getAttribute('data-side'), 'top');
        assert.ok(flipped.x >= 0 && flipped.x + flipped.width <= 800);
        assert.ok(
          await floating.evaluate(
            (element) =>
              parseFloat(element.style.getPropertyValue('--overlay-available-height')) > 0,
          ),
        );

        await page.locator('#clip').evaluate((clip, style) => {
          clip.style.cssText = style;
        }, originalClip);
        await command(page, 'replace-anchor');
        await page.waitForFunction(
          () =>
            document.querySelector('#positioned').style.getPropertyValue('--anchor-width') ===
            '100px',
        );
        const newAnchor = await getBox(page.locator('#anchor2'));
        const moved = await getBox(floating);
        assert.equal(await floating.getAttribute('data-side'), 'end');
        const gap =
          direction === 'ltr'
            ? moved.x - newAnchor.x - newAnchor.width
            : newAnchor.x - moved.x - moved.width;
        assert.ok(Math.abs(gap - 8) <= 1, `logical inline end in ${direction}`);
        await command(page, 'close-positioned');
        await closedLayer(page, 'positioned');
        assert.equal(await floating.getAttribute('data-surface'), null);
        assert.equal(await floating.getAttribute('data-side'), null);
        assert.equal(await floating.getAttribute('data-align'), null);
        assert.equal(
          await floating.evaluate((element) => element.style.getPropertyValue('--anchor-width')),
          '',
        );
        assert.equal(
          await floating.evaluate((element) =>
            element.style.getPropertyValue('--overlay-available-width'),
          ),
          '',
        );
      }
    },

  'an in-place anchored panel stays interactive inside a native modal': async ({ page, mount }) => {
    await mount('overlay');
    await command(page, 'nested-positioned');
    const action = page.locator('#nested-positioned-action');
    const box = await getBox(action);
    const clip = await getBox(page.locator('#nested-clip'));
    assert.ok(box.y + box.height > clip.y + clip.height);
    await assertHitTarget(action, { x: box.x + box.width / 2, y: box.y + box.height - 2 });
    await action.click();
    await assertFocused(action);
  },
};

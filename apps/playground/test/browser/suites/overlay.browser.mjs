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

export default {
  'a controlled auto trigger toggles once and marks its physical exit': async ({ page, mount }) => {
    await mount('overlay');
    const trigger = page.locator('#trigger2');
    await page.locator('#trigger1').click();
    await trigger.click();
    await visibleLayer(page, 'p2');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await trigger.getAttribute('popovertarget'), 'p2');
    await statistic(page, 'p2Changes', 1);

    await command(page, 'animate');
    await trigger.click();
    await statistic(page, 'p2Changes', 2);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(await trigger.getAttribute('popovertarget'), null);
    assert.equal(await page.locator('#p2:popover-open').getAttribute('inert'), '');
    await command(page, 'finish-b', 'replace-trigger');
    await closedLayer(page, 'p2');
    assert.equal(await trigger.getAttribute('aria-expanded'), null);
    const replacement = page.locator('#replacement');
    await replacement.focus();
    await page.keyboard.press('Space');
    await visibleLayer(page, 'p2');
    assert.equal(await replacement.getAttribute('popovertarget'), 'p2');
    await statistic(page, 'p2Changes', 3);
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

  'Escape routes manual, passive, and foreign layers without stopping propagation': async ({
    page,
    mount,
  }) => {
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
  },

  'an auto panel inside a guarded modal consumes its own first trusted Escape': async ({
    page,
    mount,
  }) => {
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
  },

  'Escape in a foreign manual popover leaves the underlying native owners open': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'open-a', 'foreign-manual');
    await page.locator('#foreign-manual-action').focus();
    await page.keyboard.press('Escape');
    await statistic(page, 'escapes', 1);
    await visibleLayer(page, 'foreign-manual');
    await visibleLayer(page, 'p1');
    await statistic(page, 'p1Changes', 0);

    await mount('overlay');
    await command(page, 'open-dialog', 'foreign-manual-in-dialog');
    await page.locator('#foreign-manual-action').focus();
    await page.keyboard.press('Escape');
    await statistic(page, 'escapes', 1);
    await visibleLayer(page, 'foreign-manual');
    await visibleLayer(page, 'dialog', ':modal');
    await statistic(page, 'guard', 0);
  },

  'modal lease preserves auto and interleaved manual order through stacked dialogs': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'open-a', 'open-manual', 'open-b');
    assert.deepEqual(await layerOrder(page), ['p2', 'manual', 'p1']);
    await page.locator('#dialog').evaluate((dialog) => {
      dialog.addEventListener(
        'beforetoggle',
        () => {
          const order = document.elementsFromPoint(335, 250).map(({ id }) => id);
          dialog.dataset.leaseOrder = order
            .filter((id) => ['p1', 'p2', 'manual'].includes(id))
            .join(',');
        },
        { once: true },
      );
    });
    await page.locator('#modal-trigger').click();
    await visibleLayer(page, 'dialog', ':modal');
    assert.equal(await page.locator('#dialog').getAttribute('data-lease-order'), 'p2,manual,p1');
    assert.equal(await page.locator('#p1:popover-open').getAttribute('popover'), 'manual');
    assert.equal(await page.locator('#p2:popover-open').getAttribute('popover'), 'manual');
    await statistic(page, 'toastHost', 'dialog');
    await page.keyboard.press('Escape');
    await statistic(page, 'toastHost', 'confirm');
    await page.locator('#dismiss-confirm').click();
    await statistic(page, 'toastHost', 'dialog');
    assert.deepEqual(await lock(page), ['hidden', 'hidden', 'important']);
    await page.locator('#close-modal').click();
    await statistic(page, 'toastHost', 'modal-host');
    assert.deepEqual(await layerOrder(page), ['p2', 'manual', 'p1']);
    assert.equal(await page.locator('#p1').getAttribute('popover'), 'auto');
    assert.equal(await page.locator('#p2').getAttribute('popover'), 'auto');
    await assertFocused(page.locator('#modal-trigger'));
    await statistic(page, 'p1Changes', 0);
    await statistic(page, 'p2Changes', 0);
    await page.keyboard.press('Escape');
    await closedLayer(page, 'p2');
    await assertFocused(page.locator('#trigger2'));
    await visibleLayer(page, 'p1');
  },

  'removing or moving a modal releases projection, lease, and lock without the next input': async ({
    page,
    mount,
  }) => {
    for (const mutation of ['move-dialog', 'remove-dialog-host', 'native-close']) {
      await mount('overlay');
      await command(page, 'open-a', 'open-b', 'open-dialog');
      await statistic(page, 'toastHost', 'dialog');
      await command(page, mutation);
      await closedLayer(page, 'dialog', ':modal');
      await statistic(page, 'toastHost', 'modal-host');
      await statistic(page, 'projection', 2);
      assert.deepEqual(await lock(page), ['clip', 'auto', 'important']);
      assert.equal(await page.locator('#p2:popover-open').getAttribute('popover'), 'auto');
      await statistic(page, 'p2Changes', 0);
    }
  },

  'closing a lower dialog defers chain restoration and a lost trigger stays closed': async ({
    page,
    mount,
  }) => {
    await mount('overlay');
    await command(page, 'open-a', 'open-b', 'open-dialog', 'open-confirm', 'close-dialog');
    await visibleLayer(page, 'confirm', ':modal');
    await statistic(page, 'toastHost', 'confirm');
    assert.equal(await page.locator('#p2').getAttribute('popover'), 'manual');
    assert.deepEqual(await lock(page), ['hidden', 'hidden', 'important']);
    await command(page, 'remove-trigger');
    await closedLayer(page, 'p2');
    await statistic(page, 'p2Changes', 1);
    await page.locator('#dismiss-confirm').click();
    await statistic(page, 'toastHost', 'modal-host');
    assert.deepEqual(await lock(page), ['clip', 'auto', 'important']);
    assert.equal(await page.locator('#p1:popover-open').getAttribute('popover'), 'auto');
    await statistic(page, 'p2Changes', 1);
  },

  'aborted and synchronously disposed admissions roll back all leased layers': async ({
    page,
    mount,
  }) => {
    for (const abort of ['abort-admission', 'dispose-on-admission']) {
      await mount('overlay');
      await command(page, 'open-a', 'open-manual', 'open-b', abort);
      await closedLayer(page, 'dialog', ':modal');
      assert.deepEqual(await layerOrder(page), ['p2', 'manual', 'p1']);
      assert.equal(await page.locator('#p2').getAttribute('popover'), 'auto');
      await statistic(page, 'p2Changes', 0);
      await statistic(page, 'projection', 0);
      assert.deepEqual(await lock(page), ['clip', 'auto', 'important']);
    }
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

  'background wheel is locked while the active dialog scrolls': async ({ page, mount }) => {
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
    await page.mouse.move(5, 300);
    await page.mouse.wheel(0, 300);
    await page.waitForFunction(() => window.scrollY > 420);
  },

  'positioned top-layer panels escape clipping and align to their anchors in LTR and RTL': async ({
    page,
    mount,
  }) => {
    for (const direction of ['ltr', 'rtl']) {
      await mount('overlay', { direction });
      await command(page, 'open-positioned');
      const floating = page.locator('#positioned');
      await page.waitForFunction(
        () =>
          document.querySelector('#positioned').style.getPropertyValue('--anchor-width') === '80px',
      );
      const anchor = await getBox(page.locator('#anchor'));
      const box = await getBox(floating);
      const aligned =
        direction === 'ltr' ? box.x - anchor.x : box.x + box.width - anchor.x - anchor.width;
      assert.ok(Math.abs(aligned) <= 1, `logical alignment in ${direction}`);
      assert.equal(await floating.getAttribute('data-surface'), 'overlay');
      assert.ok(box.y >= anchor.y + anchor.height + 5);
      const action = page.locator('#positioned-action');
      const actionBox = await getBox(action);
      const clip = await getBox(page.locator('#clip'));
      assert.ok(actionBox.y + actionBox.height > clip.y + clip.height);
      const point = { x: actionBox.x + actionBox.width / 2, y: actionBox.y + actionBox.height - 2 };
      await assertHitTarget(action, point);
      await page.mouse.click(point.x, point.y);
      await statistic(page, 'positionedClicks', 1);

      const alignTo = async (dir) => {
        const left = dir === 'ltr' ? anchor.x : anchor.x + anchor.width - box.width;
        await page.locator('html').evaluate((html, dir) => {
          html.dir = dir;
        }, dir);
        await page.waitForFunction(
          (expected) =>
            Math.abs(
              document.querySelector('#positioned').getBoundingClientRect().left - expected,
            ) <= 1,
          left,
        );
        assert.deepEqual(await getBox(page.locator('#anchor')), anchor);
      };
      await alignTo(direction === 'ltr' ? 'rtl' : 'ltr');
      await alignTo(direction);

      await page.locator('#clip').evaluate((clip, dir) => {
        const scope = clip.appendChild(document.createElement('div'));
        scope.dir = dir === 'ltr' ? 'rtl' : 'ltr';
        scope.style.cssText = 'position:absolute;inset:0';
        scope.moveBefore(clip.querySelector('#anchor'), null);
      }, direction);
      const oppositeEdge = direction === 'ltr' ? anchor.x + anchor.width - box.width : anchor.x;
      await page.waitForFunction(
        (expected) =>
          Math.abs(document.querySelector('#positioned').getBoundingClientRect().left - expected) <=
          1,
        oppositeEdge,
      );
      assert.deepEqual(await getBox(page.locator('#anchor')), anchor);
      await page
        .locator('#clip')
        .evaluate((clip) => clip.appendChild(clip.querySelector('#anchor')));
      await alignTo(direction);

      const originalClip = await page.locator('#clip').evaluate((clip, dir) => {
        const style = clip.style.cssText;
        clip.style.cssText += `top:562px;left:${dir === 'ltr' ? 710 : 4}px;width:120px`;
        clip.querySelector('#anchor').style.width = '64px';
        return style;
      }, direction);
      await page.waitForFunction(
        () =>
          document.querySelector('#positioned').style.getPropertyValue('--anchor-width') === '64px',
      );
      const flipped = await getBox(floating);
      assert.ok(flipped.y + flipped.height < (await getBox(page.locator('#anchor'))).y);
      assert.ok(flipped.x >= 0 && flipped.x + flipped.width <= 800);
      assert.ok(
        await floating.evaluate(
          (element) => parseFloat(element.style.getPropertyValue('--overlay-available-height')) > 0,
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
      const gap =
        direction === 'ltr'
          ? moved.x - newAnchor.x - newAnchor.width
          : newAnchor.x - moved.x - moved.width;
      assert.ok(Math.abs(gap - 8) <= 1, `logical inline end in ${direction}`);
      await command(page, 'close-positioned');
      await closedLayer(page, 'positioned');
      assert.equal(await floating.getAttribute('data-surface'), null);
      assert.equal(
        await floating.evaluate((element) => element.style.getPropertyValue('--anchor-width')),
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

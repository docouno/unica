import assert from 'node:assert/strict';
import { assertFocused, assertHitTarget, getBox } from '../helpers.mjs';

const readingArea = '.unica-hover-card-reading-area';

function shown(page, id) {
  return page.locator(`#${id}:popover-open`);
}

function placed(page, id) {
  return page.locator(`#${id}:popover-open[data-side]`);
}

function notices(page) {
  return page.locator('#preview-notices').textContent().then(JSON.parse);
}

function point(box) {
  return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
}

function settleLayout(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

export default {
  'Hover previews share warm mouse intent by family and provider while pen can open a cold hint':
    async ({ page, mount }) => {
      await mount('hover-preview');
      const first = page.locator('#first-source');
      await first.hover();
      assert.equal(await shown(page, 'first-preview').count(), 0);
      await shown(page, 'first-preview').waitFor();

      await page.locator('#second-source').hover();
      await shown(page, 'second-preview').waitFor({ timeout: 350 });
      assert.equal(await shown(page, 'first-preview').count(), 0);
      assert.ok(
        (await notices(page)).some((notice) => notice.startsWith('first:false:replacement')),
      );

      const session = await page.context().newCDPSession(page);
      const separate = point(await getBox(page.locator('#separate-source')));
      try {
        await session.send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          pointerType: 'pen',
          ...separate,
        });
        assert.equal(await shown(page, 'separate-preview').count(), 0);
        await shown(page, 'separate-preview').waitFor();
      } finally {
        await session.detach();
      }

      await page.locator('#preview-source').hover();
      assert.equal(await shown(page, 'team-preview').count(), 0);
      await shown(page, 'team-preview').waitFor();
      assert.equal(
        await page.locator(':is(.unica-tooltip, .unica-hover-card):popover-open').count(),
        1,
      );
    },

  'Hover previews cancel pending intent on keyboard entry and respect a later committed open':
    async ({ page, mount }) => {
      await mount('hover-preview');
      await page.locator('#second-source').hover();
      await page.keyboard.press('Tab');
      await assertFocused(page.locator('#first-source'));
      await shown(page, 'first-preview').waitFor({ timeout: 350 });
      await page.waitForTimeout(650);
      assert.equal(await shown(page, 'second-preview').count(), 0);
      assert.ok(!(await notices(page)).some((notice) => notice.startsWith('second:true:hover')));

      await page.locator('#owned-source').hover();
      await page.waitForFunction(() =>
        document.querySelector('#preview-notices').textContent.includes('owned:true:hover'),
      );
      assert.equal(await shown(page, 'owned-preview').count(), 0);
      await page.keyboard.press('Tab');
      await shown(page, 'second-preview').waitFor();
      await page.locator('#commit-open').dispatchEvent('click');
      await shown(page, 'owned-preview').waitFor();
      assert.equal(await shown(page, 'second-preview').count(), 0);
      assert.deepEqual(
        (await notices(page))
          .filter((notice) => notice.startsWith('owned:true:'))
          .map((notice) => notice.split(':').slice(0, 3)),
        [['owned', 'true', 'hover']],
      );
    },

  'A pending Tooltip cancels when its source becomes unavailable without a pointer event': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview');
    await page.addStyleTag({
      content: '@media (prefers-reduced-motion: reduce) { #first-source { visibility: hidden; } }',
    });
    const first = page.locator('#first-source');
    await first.hover();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settleLayout(page);
    assert.equal(await first.evaluate((element) => getComputedStyle(element).visibility), 'hidden');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(650);
    assert.equal(await shown(page, 'first-preview').count(), 0);
    assert.deepEqual(await notices(page), []);

    await page.mouse.move(0, 0);
    await first.hover();
    await shown(page, 'first-preview').waitFor();
    assert.deepEqual(await notices(page), ['first:true:hover:first-source']);
  },

  'Tooltip closes after focus leaves before the first position is measured': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview');
    await page.evaluate(() => {
      document.getElementById('first-source').focus();
      document.getElementById('outside').focus();
    });
    await assertFocused(page.locator('#outside'));
    await page.waitForFunction(() =>
      document.querySelector('#preview-notices').textContent.includes('first:false:leave'),
    );
    assert.equal(await shown(page, 'first-preview').count(), 0);

    await page.evaluate(() => document.getElementById('redirected-source').focus());
    await assertFocused(page.locator('#outside'));
    await page.waitForFunction(() =>
      document.querySelector('#preview-notices').textContent.includes('redirected:false:leave'),
    );
    assert.equal(await shown(page, 'redirected-preview').count(), 0);
    assert.deepEqual(
      (await notices(page)).map((notice) => notice.split(':').slice(0, 3)),
      [
        ['first', 'true', 'focus'],
        ['first', 'false', 'leave'],
        ['redirected', 'true', 'focus'],
        ['redirected', 'false', 'leave'],
      ],
    );
  },

  'Hover previews leave the parent auto popover open on the first Escape': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview');
    await page.locator('#flat-invoker').click();
    await shown(page, 'flat-auto').waitFor();
    await page.keyboard.press('Tab');
    await shown(page, 'flat-preview').waitFor();
    await page.keyboard.press('Escape');
    await shown(page, 'flat-preview').waitFor({ state: 'detached' });
    await assertFocused(page.locator('#flat-source'));
    assert.equal(await shown(page, 'flat-auto').count(), 1);
    await page.keyboard.press('Escape');
    await shown(page, 'flat-auto').waitFor({ state: 'detached' });
    assert.deepEqual(
      (await notices(page)).filter((notice) => notice === 'flat:false:escape'),
      ['flat:false:escape'],
    );
  },

  'Hover previews honor prevented Escape and repeat a refused close inside a dialog and auto popover':
    async ({ page, mount }) => {
      await mount('hover-preview');
      await page.locator('#open-dialog').click();
      const dialog = page.locator('dialog:modal');
      await dialog.getByRole('button', { name: 'Open popover' }).click();
      await shown(page, 'preview-auto').waitFor();
      await page.keyboard.press('Tab');
      await shown(page, 'dialog-preview').waitFor();
      await assertFocused(page.locator('#dialog-source'));

      await page.keyboard.press('Shift+Escape');
      assert.equal(await shown(page, 'dialog-preview').count(), 1);
      assert.equal((await notices(page)).filter((notice) => notice.includes(':escape')).length, 0);
      await page.keyboard.press('Escape');
      assert.equal(await shown(page, 'dialog-preview').count(), 1);
      assert.equal(await shown(page, 'preview-auto').count(), 1);
      assert.equal(await dialog.count(), 1);
      await page.keyboard.press('Escape');
      await shown(page, 'dialog-preview').waitFor({ state: 'detached' });
      assert.equal(await shown(page, 'preview-auto').count(), 1);
      assert.equal(await dialog.count(), 1);
      await page.keyboard.press('Escape');
      await shown(page, 'preview-auto').waitFor({ state: 'detached' });
      assert.equal(await dialog.count(), 1);
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      assert.deepEqual(
        (await notices(page)).filter((notice) => notice.includes(':escape')),
        ['dialog:false:escape', 'dialog:false:escape'],
      );
    },

  'Hover previews preserve a diagonal pointer gap, native scrollbar drag and the outside action':
    async ({ page, mount }) => {
      await mount('hover-preview', {
        theme: 'frost-dark',
        direction: 'rtl',
        textScale: 120,
        surface: 'overlay',
      });
      const trigger = page.locator('#preview-source');
      await trigger.hover();
      const card = placed(page, 'team-preview');
      await card.waitFor();
      const body = card.locator(readingArea);
      const anchor = await getBox(trigger);
      const before = await getBox(card);
      const scroll = await getBox(body);
      assert.ok(
        Math.abs(before.y - anchor.y - anchor.height - 8) < 0.75,
        'Expected an 8px pointer gap',
      );
      const x = point(anchor).x;
      await page.mouse.move(x - 3, before.y - 4, { steps: 4 });
      await page.waitForTimeout(200);
      assert.equal(
        await card.count(),
        1,
        'The actual pointer gap sustains the open card past close delay',
      );
      await page.mouse.move(x - 9, before.y + 13, { steps: 5 });

      for (const edge of [
        scroll.x - before.x,
        scroll.y - before.y,
        before.x + before.width - (scroll.x + scroll.width),
        before.y + before.height - (scroll.y + scroll.height),
      ]) {
        assert.ok(Math.abs(edge - 5) < 0.75, `Expected 4px inside the 1px border, got ${edge}px`);
      }
      const scrollDimensions = await body.evaluate((element) => ({
        gutter: element.offsetWidth - element.clientWidth,
        horizontal: element.scrollWidth - element.clientWidth,
        vertical: element.scrollHeight - element.clientHeight,
      }));
      assert.equal(scrollDimensions.horizontal, 0);
      assert.ok(scrollDimensions.gutter > 0 && scrollDimensions.vertical > 100);
      await page.mouse.move(scroll.x + scrollDimensions.gutter / 2, scroll.y + 13);
      await page.mouse.down();
      await page.mouse.move(scroll.x + scrollDimensions.gutter / 2, scroll.y + 47, { steps: 7 });
      await page.mouse.up();
      assert.ok(
        await body.evaluate((element) => element.scrollTop > 0),
        'Native RTL scrollbar thumb dragged',
      );
      await page.mouse.move(point(scroll).x, point(scroll).y);
      await page.mouse.wheel(0, 1200);
      await page.waitForFunction((selector) => {
        const scroller = document.querySelector(`#team-preview ${selector}`);
        return scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 1;
      }, readingArea);
      await page.setViewportSize({ width: 770, height: 600 });
      assert.ok(
        await body.evaluate((element) => element.scrollTop > 0),
        'Repositioning keeps the scroll offset',
      );

      const outside = page.locator('#outside');
      await assertHitTarget(outside, point(await getBox(outside)));
      await outside.click();
      await card.waitFor({ state: 'detached' });
      assert.equal(await page.locator('#outside-clicks').textContent(), '1');
      assert.ok((await notices(page)).includes('preview:false:outside-press:outside'));
      await assertFocused(outside);
    },

  'Hover previews keep a drag-out selection for copy and let Tab resume the document order':
    async ({ page, mount }) => {
      await mount('hover-preview');
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.locator('#preview-source').hover();
      const card = placed(page, 'team-preview');
      await card.waitFor();
      const line = await page.locator('#preview-copy').evaluate((element) => {
        const range = document.createRange();
        range.setStart(element.firstChild, 0);
        range.setEnd(element.firstChild, 20);
        const { x, y, width, height } = range.getBoundingClientRect();
        return { x, y, width, height };
      });
      const shell = await getBox(card);
      const y = line.y + line.height / 2;
      await page.mouse.move(line.x + 1, y);
      await page.mouse.down();
      await page.mouse.move(line.x + line.width - 4, y, { steps: 10 });
      await page.mouse.move(shell.x + shell.width + 9, y, { steps: 7 });
      await page.mouse.up();
      await page.waitForTimeout(220);
      const selection = await page.evaluate(() => getSelection().toString());
      assert.match(selection, /Read and copy these/);
      assert.equal(await card.count(), 1);
      await page.keyboard.press('Control+c');
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), selection);
      await page.keyboard.press('Tab');
      await card.waitFor({ state: 'detached' });
      await assertFocused(page.locator('#outside'));
      assert.ok((await notices(page)).some((notice) => notice.startsWith('preview:false:tab')));
    },

  'Hover previews leave a link’s initial touch, middle click and modified navigation intact':
    async ({ page, mount }) => {
      await mount('hover-preview');
      const source = page.locator('#preview-source');
      const session = await page.context().newCDPSession(page);
      try {
        await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [point(await getBox(source))],
        });
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForURL(/#destination$/);
        await page.waitForTimeout(650);
        assert.ok(!(await notices(page)).some((notice) => notice.startsWith('preview:true:')));
        assert.equal(await page.locator('#link-click').textContent(), 'click:false:false');
        await session.send('Emulation.setTouchEmulationEnabled', { enabled: false });
      } finally {
        await session.detach();
      }

      await page.evaluate(() =>
        history.replaceState(null, '', location.pathname + location.search),
      );
      await page.mouse.move(2, 2);
      for (const [options, expected] of [
        [{ modifiers: ['Control'] }, 'click:true:false'],
        [{ button: 'middle' }, 'aux:1:false'],
      ]) {
        await source.hover();
        await placed(page, 'team-preview').waitFor();
        const [tab] = await Promise.all([
          page.context().waitForEvent('page'),
          source.click(options),
        ]);
        await tab.waitForURL(/#destination$/);
        assert.equal(new URL(page.url()).hash, '');
        await tab.close();
        assert.equal(await page.locator('#link-click').textContent(), expected);
        await shown(page, 'team-preview').waitFor({ state: 'detached' });
        await page.mouse.move(2, 2);
      }
    },

  'Hover previews close a visible source when it becomes natively unavailable': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview');
    await page.locator('#first-source').hover();
    await shown(page, 'first-preview').waitFor();
    await page.locator('#disable-source').dispatchEvent('click');
    await shown(page, 'first-preview').waitFor({ state: 'detached' });
    assert.ok((await notices(page)).includes('first:false:unavailable'));
  },

  'Hover previews stay read-only inside an editor and do not replace native form behavior': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview-dom', {
      theme: 'frost-dark',
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await page.keyboard.press('Tab');
    await assertFocused(page.locator('#preview-editor'));
    await page.keyboard.press('Tab');
    await assertFocused(page.locator('#editor-tooltip-source'));
    await placed(page, 'editor-tooltip').waitFor();
    await assertFocused(page.locator('#editor-tooltip-source'));
    await page.keyboard.press('Tab');
    await placed(page, 'editor-card').waitFor();
    await assertFocused(page.locator('#editor-link'));

    for (const panel of ['editor-tooltip', 'editor-card']) {
      const style = await page.locator(`#${panel}`).evaluate((element) => {
        const css = getComputedStyle(element);
        return {
          editable: element.isContentEditable,
          autofocus: element.hasAttribute('autofocus'),
          border: css.borderTopWidth,
          shadow: css.boxShadow,
          filter: css.backdropFilter,
          animation: css.animationName,
          transitions: css.transitionDuration,
        };
      });
      assert.deepEqual(style, {
        editable: false,
        autofocus: false,
        border: '1px',
        shadow: 'none',
        filter: 'none',
        animation: 'none',
        transitions: '0s',
      });
    }
    await page.keyboard.press('Tab');
    await assertFocused(page.locator('#after-editor'));
    await shown(page, 'editor-card').waitFor({ state: 'detached' });

    await page.keyboard.press('Tab');
    const check = page.locator('#preview-check');
    await assertFocused(check);
    await shown(page, 'checkbox-preview').waitFor();
    await page.keyboard.press('Space');
    assert.equal(await check.isChecked(), true);
    await shown(page, 'checkbox-preview').waitFor({ state: 'detached' });
    await page.keyboard.press('Tab');
    await assertFocused(page.locator('#preview-submit'));
    await shown(page, 'submit-preview').waitFor();
    await page.keyboard.press('Enter');
    await shown(page, 'submit-preview').waitFor({ state: 'detached' });
    assert.deepEqual(JSON.parse(await page.locator('#fixture-submissions').textContent()), [
      [
        ['notice', 'yes'],
        ['intent', 'save'],
      ],
    ]);
    await page.locator('#preview-reset').click();
    assert.equal(await check.isChecked(), false);
    assert.equal(await page.locator('#fixture-edits').textContent(), '1');
  },

  'Hover previews honor native fieldset legend, ARIA-disabled and inert availability': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview-dom');
    for (const id of ['fieldset', 'aria', 'native', 'inert']) {
      const source = page.locator(`#${id}-source`);
      const { x, y } = point(await getBox(source));
      await page.mouse.move(x, y);
      await page.waitForTimeout(100);
      assert.equal(await shown(page, `${id}-preview`).count(), 0, `${id} stays closed on hover`);
    }
    await page.locator('#legend-source').hover();
    await shown(page, 'legend-preview').waitFor();
    await page.locator('#enable-native').dispatchEvent('click');
    await page.locator('#native-source').hover();
    await shown(page, 'native-preview').waitFor();
  },

  'Hover previews do not return focus or revive an old controlled open after native show is lost':
    async ({ page, mount }) => {
      await mount('hover-preview-dom');
      await page.locator('#toggle-card').dispatchEvent('click');
      const card = placed(page, 'loss-preview');
      await card.waitFor();
      await page.evaluate(() => {
        const link = document.querySelector('#loss-source');
        link.dataset.focusReports = '0';
        link.addEventListener('focusin', () => {
          link.dataset.focusReports = String(Number(link.dataset.focusReports) + 1);
        });
      });
      const body = card.locator(readingArea);
      await body.evaluate((element) => element.focus());
      assert.equal(await body.evaluate((element) => element === document.activeElement), true);
      await card.evaluate((element) => element.hidePopover());
      await card.waitFor({ state: 'detached' });
      await page.waitForFunction(
        () => document.querySelector('#fixture-dismissals').textContent === '["native"]',
      );
      assert.equal(await page.locator('#loss-source').getAttribute('data-focus-reports'), '0');

      const other = page.locator('#rerender-card');
      await other.focus();
      await other.dispatchEvent('click');
      assert.equal(await shown(page, 'loss-preview').count(), 0);
      const toggleContent = page.locator('#toggle-card-content');
      await toggleContent.dispatchEvent('click');
      await page.locator('#loss-preview').waitFor({ state: 'detached' });
      await toggleContent.dispatchEvent('click');
      await page.locator('#loss-preview').waitFor({ state: 'attached' });
      await settleLayout(page);
      assert.equal(await shown(page, 'loss-preview').count(), 0);
      await assertFocused(other);

      const toggleCard = page.locator('#toggle-card');
      await toggleCard.dispatchEvent('click');
      assert.equal(await toggleCard.getAttribute('aria-pressed'), 'false');
      await toggleCard.dispatchEvent('click');
      await card.waitFor();
      await assertFocused(other);

      // A false/true commit in the same task is a new command even when native
      // beforetoggle queued an older report for the previous physical show.
      await page.locator('#recommit-card').dispatchEvent('click');
      await card.waitFor();
      await assertFocused(other);

      await toggleContent.dispatchEvent('click');
      await page.locator('#loss-preview').waitFor({ state: 'detached' });
      await assertFocused(other);
      assert.equal(await page.locator('#loss-source').getAttribute('data-focus-reports'), '0');
      assert.equal(await page.locator('#fixture-dismissals').textContent(), '["native"]');
    },

  'A visible HoverCard closes when its link loses href and requires a fresh open to reappear':
    async ({ page, mount }) => {
      await mount('hover-preview-dom');
      const toggle = page.locator('#toggle-card');
      const link = page.locator('#loss-source');
      const card = placed(page, 'loss-preview');
      await toggle.dispatchEvent('click');
      await card.waitFor();

      await link.evaluate((element) => element.removeAttribute('href'));
      await card.waitFor({ state: 'detached' });
      await page.waitForFunction(
        () => document.querySelector('#fixture-dismissals').textContent === '["unavailable"]',
      );
      assert.equal(await toggle.getAttribute('aria-pressed'), 'true');

      await link.evaluate((element) => element.setAttribute('href', '#edit-target'));
      await page.locator('#rerender-card').dispatchEvent('click');
      await settleLayout(page);
      assert.equal(await card.count(), 0);

      await toggle.dispatchEvent('click');
      await toggle.dispatchEvent('click');
      await card.waitFor();
      assert.equal(await page.locator('#fixture-dismissals').textContent(), '["unavailable"]');
    },

  'External Tooltip tracks availability in the new anchor shadow root after a retained rebind':
    async ({ page, mount }) => {
      await mount('hover-preview-dom');
      const host = page.locator('#external-shadow-host');
      await host.evaluate((element) => {
        const root = element.attachShadow({ mode: 'open' });
        const button = document.createElement('button');
        button.textContent = 'External shadow anchor';
        root.append(button);
      });
      const panel = placed(page, 'external-preview');
      await page.locator('#external-first').dispatchEvent('click');
      await panel.waitFor();
      const firstX = (await getBox(panel)).x;
      await page.locator('#select-shadow-anchor').dispatchEvent('click');
      await page.waitForFunction((left) => {
        const preview = document.querySelector('#external-preview:popover-open[data-side]');
        return preview?.getBoundingClientRect().left > left + 32;
      }, firstX);

      await host.getByRole('button').evaluate((element) => {
        element.disabled = true;
      });
      await panel.waitFor({ state: 'detached' });
      await page.waitForFunction(
        () => document.querySelector('#external-dismissals').textContent === '["unavailable"]',
      );
      await host.getByRole('button').evaluate((element) => {
        element.disabled = false;
      });
      await settleLayout(page);
      assert.equal(await panel.count(), 0);
      await page.locator('#external-first').dispatchEvent('click');
      await panel.waitFor();
    },

  'A visible Tooltip closes when author CSS or a foreign native modal makes the anchor inert':
    async ({ page, mount }) => {
      await mount('hover-preview-dom');
      await page.addStyleTag({ content: '[data-inactive] { interactivity: inert; }' });
      const initial = page.locator('#external-first');
      const second = page.locator('#external-second');
      const panel = placed(page, 'external-preview');
      const notices = page.locator('#external-dismissals');
      await initial.dispatchEvent('click');
      await panel.waitFor();

      await initial.evaluate((anchor) => anchor.setAttribute('data-inactive', ''));
      await panel.waitFor({ state: 'detached' });
      await page.waitForFunction(
        () => document.querySelector('#external-dismissals').textContent === '["unavailable"]',
      );
      await initial.evaluate((anchor) => anchor.removeAttribute('data-inactive'));
      await settleLayout(page);
      assert.equal(await panel.count(), 0);

      await second.dispatchEvent('click');
      await panel.waitFor();
      const dialog = page.locator('#availability-modal');
      await dialog.evaluate((element) => element.showModal());
      await panel.waitFor({ state: 'detached' });
      await dialog.evaluate((element) => element.close());
      await settleLayout(page);
      assert.equal(await panel.count(), 0);
      assert.equal(await notices.textContent(), '["unavailable","unavailable"]');
    },

  'A visible Tooltip closes when sibling selectors or viewport changes hide its anchor': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview-dom');
    await page.addStyleTag({
      content:
        'body:has(#availability-gate[data-inactive]) #external-first { visibility: hidden; }' +
        '@media (max-width: 780px) { #external-second { visibility: hidden; } }',
    });
    const panel = placed(page, 'external-preview');
    const notices = page.locator('#external-dismissals');
    await page.locator('#external-first').dispatchEvent('click');
    await panel.waitFor();
    const gate = page.locator('#availability-gate');
    await gate.evaluate((element) => element.setAttribute('data-inactive', ''));
    await panel.waitFor({ state: 'detached' });
    await gate.evaluate((element) => element.removeAttribute('data-inactive'));
    await settleLayout(page);
    assert.equal(await panel.count(), 0);
    assert.equal(await notices.textContent(), '["unavailable"]');

    await page.locator('#external-second').dispatchEvent('click');
    await panel.waitFor();
    await page.setViewportSize({ width: 760, height: 600 });
    await panel.waitFor({ state: 'detached' });
    await page.setViewportSize({ width: 800, height: 600 });
    await settleLayout(page);
    assert.equal(await panel.count(), 0);
    assert.equal(await notices.textContent(), '["unavailable","unavailable"]');
  },

  'A newly opened foreign dialog dismisses an existing Tooltip in a tracked parent modal': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview-dom');
    const parent = page.locator('#availability-parent:modal');
    await page.locator('#open-availability-parent').dispatchEvent('click');
    await parent.waitFor();
    const panel = placed(page, 'modal-availability-preview');
    await panel.waitFor();
    const dialog = page.locator('#availability-modal');
    await dialog.evaluate((element) => element.showModal());
    await panel.waitFor({ state: 'detached' });
    await assertFocused(dialog.getByRole('button'));
    assert.equal(
      await page.locator('#modal-availability-dismissals').textContent(),
      '["unavailable"]',
    );
    await dialog.evaluate((element) => element.close());
    await settleLayout(page);
    assert.equal(await parent.count(), 1);
    assert.equal(await panel.count(), 0);
  },

  'A visible Tooltip closes when native checked state or a media preference changes availability':
    async ({ page, mount }) => {
      await mount('hover-preview-dom');
      await page.addStyleTag({
        content: [
          '#external-first:has(~ label :checked) { visibility: hidden; }',
          '@media (prefers-reduced-motion: reduce) { #external-second { interactivity: inert; } }',
        ].join('\n'),
      });
      const panel = placed(page, 'external-preview');
      const notices = page.locator('#external-dismissals');
      const checkbox = page.locator('#external-availability-check');
      await page.locator('#external-first').dispatchEvent('click');
      await panel.waitFor();
      await checkbox.focus();
      await page.keyboard.press('Space');
      assert.equal(await checkbox.isChecked(), true);
      await panel.waitFor({ state: 'detached' });
      assert.equal(await notices.textContent(), '["unavailable"]');

      await page.keyboard.press('Space');
      await settleLayout(page);
      assert.equal(await panel.count(), 0);
      await page.locator('#external-second').dispatchEvent('click');
      await panel.waitFor();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await panel.waitFor({ state: 'detached' });
      assert.equal(await notices.textContent(), '["unavailable","unavailable"]');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await settleLayout(page);
      assert.equal(await panel.count(), 0);
    },

  'External Tooltip rebinds a live carrier and treats a new anchor after native loss as a new command':
    async ({ page, mount }) => {
      await mount('hover-preview-dom');
      const panel = placed(page, 'external-preview');
      await page.locator('#external-first').dispatchEvent('click');
      await panel.waitFor();
      const firstX = (await getBox(panel)).x;
      await panel.evaluate((element) => {
        element.dataset.nativeCloses = '0';
        element.addEventListener('beforetoggle', (event) => {
          if (event.newState === 'closed') {
            element.dataset.nativeCloses = String(Number(element.dataset.nativeCloses) + 1);
          }
        });
      });

      await page.locator('#external-second').dispatchEvent('click');
      await page.waitForFunction((left) => {
        const preview = document.querySelector('#external-preview:popover-open[data-side]');
        return preview?.getBoundingClientRect().left > left + 32;
      }, firstX);
      assert.equal(await panel.getAttribute('data-native-closes'), '0');

      await page.locator('#replace-external').dispatchEvent('click');
      await page.waitForFunction((left) => {
        const preview = document.querySelector('#external-preview:popover-open[data-side]');
        return Math.abs(preview?.getBoundingClientRect().left - left) < 1;
      }, firstX);
      assert.equal(await panel.getAttribute('data-native-closes'), '1');

      await page.locator('#replace-external-during-close').dispatchEvent('click');
      await page.waitForFunction((left) => {
        const preview = document.querySelector('#external-preview:popover-open[data-side]');
        return preview?.getBoundingClientRect().left > left + 32;
      }, firstX);
      assert.equal(await panel.getAttribute('data-native-closes'), '2');

      await page.locator('#replace-external-in-capture').dispatchEvent('click');
      await page.waitForFunction((left) => {
        const preview = document.querySelector('#external-preview:popover-open[data-side]');
        return Math.abs(preview?.getBoundingClientRect().left - left) < 1;
      }, firstX);
      assert.equal(await panel.getAttribute('data-native-closes'), '3');

      await page.locator('#recommit-external-in-capture').dispatchEvent('click');
      await panel.waitFor();
      assert.equal(await panel.getAttribute('data-native-closes'), '4');
      assert.equal(await page.locator('#external-dismissals').textContent(), '[]');
    },

  'External Tooltip admits the most recent anchor while an older position is pending': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview-dom');
    await page.locator('#replace-pending-external').dispatchEvent('click');
    await placed(page, 'external-preview').waitFor();
    await settleLayout(page);
    assert.equal(await shown(page, 'external-competitor').count(), 0);
    assert.equal(await page.locator('#external-dismissals').textContent(), '[]');
  },

  'Input during external retarget does not cancel an authoritative visible preview': async ({
    page,
    mount,
  }) => {
    await mount('hover-preview-dom');
    await page.locator('#external-first').dispatchEvent('click');
    const panel = placed(page, 'external-preview');
    await panel.waitFor();
    const firstX = (await getBox(panel)).x;

    for (const action of ['tab', 'press', 'escape']) {
      await page.locator(`#external-retarget-${action}`).dispatchEvent('click');
      await page.waitForFunction(
        ({ left, returning }) => {
          const preview = document.querySelector('#external-preview:popover-open[data-side]');
          const x = preview?.getBoundingClientRect().left;
          return returning ? Math.abs(x - left) < 1 : x > left + 32;
        },
        { left: firstX, returning: action === 'press' },
      );
    }
    assert.equal(await page.locator('#external-dismissals').textContent(), '["escape"]');
  },

  'Hover previews keep a replaced controlled Tooltip closed when its blank label returns': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 600 });
    await mount('hover-preview-dom', { direction: 'rtl', textScale: 120 });
    await page
      .locator('#controlled-clip')
      .evaluate((clip) => clip.scrollIntoView({ block: 'center' }));
    const toggleA = page.locator('#toggle-controlled-a');
    const toggleLabel = page.locator('#toggle-controlled-label');
    await toggleA.dispatchEvent('click');
    await placed(page, 'controlled-a').waitFor();
    await page.locator('#open-controlled-b').dispatchEvent('click');
    await placed(page, 'controlled-b').waitFor();
    assert.equal(await shown(page, 'controlled-a').count(), 0);

    await toggleLabel.dispatchEvent('click');
    await page.locator('#controlled-a').waitFor({ state: 'detached' });
    await toggleLabel.dispatchEvent('click');
    await page.locator('#controlled-a').waitFor({ state: 'attached' });
    await settleLayout(page);
    assert.equal(await shown(page, 'controlled-a').count(), 0);
    assert.equal(await placed(page, 'controlled-b').count(), 1);

    await toggleA.dispatchEvent('click');
    assert.equal(await toggleA.getAttribute('aria-pressed'), 'false');
    await toggleA.dispatchEvent('click');
    await placed(page, 'controlled-a').waitFor();
    assert.equal(await shown(page, 'controlled-b').count(), 0);
  },

  'Hover previews preserve the visible owner when a clipped external source tries to open': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 600 });
    await mount('hover-preview-dom', { direction: 'rtl', textScale: 120 });
    const clipRegion = page.locator('#controlled-clip');
    await clipRegion.evaluate((clip) => clip.scrollIntoView({ block: 'center' }));
    await page.locator('#toggle-controlled-a').dispatchEvent('click');
    const a = placed(page, 'controlled-a');
    await a.waitFor();
    const clip = await getBox(clipRegion);
    const anchor = await getBox(page.locator('#controlled-c-source'));
    assert.ok(
      anchor.y >= clip.y + clip.height,
      'The viewport contains an anchor clipped by its own ancestor',
    );
    assert.ok(anchor.y + anchor.height <= 600);

    await a.evaluate((element) => {
      element.dataset.nativeCloses = '0';
      element.addEventListener('beforetoggle', (event) => {
        if (event.newState === 'closed') {
          element.dataset.nativeCloses = String(Number(element.dataset.nativeCloses) + 1);
        }
      });
    });
    await page.locator('#open-controlled-c').dispatchEvent('click');
    await page.waitForFunction(
      () => document.querySelector('#clipped-dismissals').textContent === '["unavailable"]',
    );
    assert.equal(await shown(page, 'controlled-c').count(), 0);
    assert.equal(await a.count(), 1);
    assert.equal(await a.getAttribute('data-native-closes'), '0');
  },
};

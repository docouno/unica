import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

const frame = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }),
  );
const announce = (page) =>
  page.evaluate(() => {
    window.toastAnnouncements = [];
    new MutationObserver((records) => {
      for (const record of records) {
        const node = record.target;
        if (
          node.matches?.('.unica-toast-viewport > :is([role="status"], [role="alert"])') &&
          [...record.addedNodes].some((added) => added.textContent)
        ) {
          window.toastAnnouncements.push({
            text: [...record.addedNodes].map((added) => added.textContent).join(''),
            role: node.getAttribute('role'),
            host:
              node.parentElement?.parentElement?.id || node.parentElement?.parentElement?.localName,
          });
        }
      }
    }).observe(document, { subtree: true, childList: true });
  });
const announcements = (page) => page.evaluate(() => window.toastAnnouncements);
const global = (page) => page.getByRole('region', { name: 'Notifications', exact: true });

export default {
  'Toast stays interactive in the top modal while a scoped neighbor waits': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1100, height: 760 });
    await mount('toast');
    await announce(page);
    await page.evaluate(() => {
      document.getElementById('neighbor-wrapper').showPopover();
      window.toastFixture.sibling.show({ title: 'Neighbor ready', persistent: true });
    });
    const neighbor = page.getByRole('region', { name: 'Neighbor notifications' });
    await neighbor.getByRole('group', { name: 'Neighbor ready', exact: true }).waitFor();
    await page.waitForFunction(() => window.toastAnnouncements.length === 1);
    await page.getByRole('button', { name: 'Open editor' }).click();
    await neighbor.waitFor({ state: 'detached' });
    const modal = page.getByRole('dialog', { name: 'Export editor' });
    const field = modal.getByRole('textbox', { name: 'File name' });
    await field.fill('Working draft');
    await modal.getByRole('button', { name: 'Finish jobs' }).evaluate((button) => button.click());
    await assertFocused(field);
    await global(page).getByRole('button', { name: 'Retry global' }).waitFor();
    const local = modal.getByRole('region', { name: 'Local notifications' });
    assert.equal(await local.evaluate((node) => node.parentElement.id), 'local-host');
    assert.equal(await local.evaluate((node) => getComputedStyle(node).direction), 'rtl');
    assert.equal(
      await global(page).evaluate((node) => node.parentElement.matches('dialog:modal')),
      true,
    );
    const retryGlobal = global(page).getByRole('button', { name: 'Retry global' });
    const retryLocal = local.getByRole('button', { name: 'Retry local' });
    for (
      let index = 0;
      index < 12 && !(await retryLocal.evaluate((node) => node.matches(':focus')));
      index += 1
    ) {
      await page.keyboard.press('Tab');
    }
    await assertFocused(retryLocal);
    await page.keyboard.press('Enter');
    await retryGlobal.click();
    await retryLocal.click();
    await modal.getByRole('button', { name: 'Run inline action' }).click();
    assert.equal(
      await page.locator('[data-activities]').textContent(),
      'local global local inline',
    );
    assert.equal(await field.inputValue(), 'Working draft');
    await page.waitForFunction(() => window.toastAnnouncements.length === 3);
    await page.keyboard.press('Escape');
    await modal.waitFor({ state: 'hidden' });
    await neighbor.getByRole('group', { name: 'Neighbor ready', exact: true }).waitFor();
    await global(page).getByRole('button', { name: 'Retry global' }).click();
    assert.equal(
      await page.locator('[data-activities]').textContent(),
      'local global local inline global',
    );
    await frame(page);
    assert.equal((await announcements(page)).length, 3);
  },

  'Toast casts pending delivery from an already mounted host into the current host once': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await announce(page);
    await page.evaluate(() =>
      window.toastFixture.global.show(
        { title: 'Already known', persistent: true },
        { announce: false },
      ),
    );
    const body = page.locator('body > [data-global]:popover-open');
    await body.waitFor();
    const oldChannel = await body.getByRole('status').elementHandle();
    const start = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time: start });
    await page.clock.pauseAt(new Date(start.valueOf() + 1000));
    await page.evaluate(() => {
      const queue = window.toastFixture.global;
      const quiet = queue.show({ title: 'Stale result', persistent: true });
      queue.update(quiet, { title: 'Quiet replacement' }, { announce: false });
      window.toastMovingId = queue.show({ title: 'Old result', status: 'danger' });
    });
    // One frame starts delivery in the mounted body channel. The second frame writes.
    await page.clock.runFor(16);
    assert.equal(await oldChannel.textContent(), '');
    await page.evaluate(() => {
      const fixture = window.toastFixture;
      fixture.open();
      fixture.global.update(window.toastMovingId, { title: 'New result' });
    });
    const modal = page.locator('dialog#export-editor > [data-global]:popover-open');
    await modal.waitFor();
    await page.clock.runFor(80);
    assert.equal(await oldChannel.textContent(), '');
    assert.deepEqual(await announcements(page), [
      { text: 'Danger. New result', role: 'status', host: 'export-editor' },
    ]);

    await page.evaluate(() => window.toastFixture.close());
    await body.waitFor();
    const canceledChannel = await body.getByRole('status').elementHandle();
    await page.evaluate(() => {
      window.toastMovingId = window.toastFixture.global.show({
        title: 'Dismissed in transit',
        persistent: true,
      });
    });
    await page.clock.runFor(16);
    await page.evaluate(() => {
      const fixture = window.toastFixture;
      fixture.open();
      fixture.global.dismiss(window.toastMovingId);
    });
    await modal.waitFor();
    await page.clock.runFor(80);
    assert.equal(await canceledChannel.textContent(), '');
    assert.equal((await announcements(page)).length, 1);

    await page.evaluate(() => {
      const queue = window.toastFixture.global;
      queue.show({ title: 'Same message', persistent: true });
      queue.show({ title: 'Same message', persistent: true });
      queue.show({ title: 'Urgent', urgency: 'assertive', status: 'warning' });
    });
    await page.clock.runFor(180);
    assert.equal(
      (await announcements(page)).filter(
        ({ text, role }) => text === 'Same message' && role === 'status',
      ).length,
      2,
    );
    assert.ok(
      (await announcements(page)).some(
        ({ text, role }) => text === 'Warning. Urgent' && role === 'alert',
      ),
    );
    await page.evaluate(() => window.toastFixture.close());
    await body.waitFor();
    await page.clock.runFor(80);
    assert.equal((await announcements(page)).length, 4);
  },

  'Toast pauses a hidden carrier and defers its live mutation until the carrier is visible':
    async ({ page, mount }) => {
      await mount('toast');
      await announce(page);
      const start = new Date('2026-01-01T00:00:00Z');
      await page.clock.install({ time: start });
      await page.clock.pauseAt(new Date(start.valueOf() + 1000));
      await page.evaluate(() => {
        window.trackedToast = window.toastFixture.global.show(
          { title: 'Known result' },
          { announce: false },
        );
      });
      await global(page).getByRole('group', { name: 'Known result' }).waitFor();
      await page.clock.runFor(2000);
      await page
        .getByRole('button', { name: 'Hide viewport' })
        .evaluate((button) => button.click());
      await global(page).waitFor({ state: 'hidden' });
      assert.equal(await page.locator('[data-global]:popover-open').count(), 1);
      await page.evaluate(() =>
        window.toastFixture.global.update(window.trackedToast, { title: 'Updated report' }),
      );
      await page.clock.runFor(8000);
      assert.deepEqual(await announcements(page), []);
      await page
        .getByRole('button', { name: 'Show viewport' })
        .evaluate((button) => button.click());
      const report = global(page).getByRole('group', { name: 'Updated report' });
      await report.waitFor();
      await page.clock.runFor(3999);
      assert.equal(await report.count(), 1);
      assert.deepEqual(await announcements(page), [
        { text: 'Updated report', role: 'status', host: 'body' },
      ]);
      await page.clock.runFor(1);
      await report.waitFor({ state: 'detached' });
    },

  'Toast resumes a queued announcement when its own channel becomes visible': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await announce(page);
    await page.addStyleTag({
      content: '[data-global][data-test-hide-channel] > [role="status"] { visibility: hidden; }',
    });
    await page.evaluate(() =>
      window.toastFixture.global.show(
        { title: 'Known result', persistent: true },
        { announce: false },
      ),
    );
    const outlet = page.locator('[data-global]:popover-open');
    await outlet.waitFor();
    await outlet.evaluate((node) => {
      node.setAttribute('data-test-hide-channel', '');
      window.toastFixture.global.show({ title: 'Available after the reveal', persistent: true });
    });
    await frame(page);
    assert.deepEqual(await announcements(page), []);
    assert.equal(await outlet.getByRole('status').count(), 0);
    await outlet.evaluate((node) => node.removeAttribute('data-test-hide-channel'));
    await page.waitForFunction(() => window.toastAnnouncements.length === 1);
    assert.deepEqual(await announcements(page), [
      { text: 'Available after the reveal', role: 'status', host: 'body' },
    ]);
  },

  'Toast resumes an inert channel and reuses a scoped host revealed by its data attribute': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await announce(page);
    await page.addStyleTag({
      content: '#neighbor-host[data-test-concealed] { visibility: hidden; }',
    });
    await page.evaluate(() => {
      const fixture = window.toastFixture;
      fixture.global.show({ title: 'Known globally', persistent: true }, { announce: false });
      const local = document.getElementById('neighbor-host');
      local.setAttribute('data-test-concealed', '');
      document.getElementById('neighbor-wrapper').showPopover();
      fixture.sibling.show({ title: 'Hidden scope result', persistent: true });
    });
    const body = page.locator('[data-global]:popover-open');
    await body.waitFor();
    await body.evaluate((node) => {
      node.querySelector('[role="status"]').inert = true;
      window.toastFixture.global.show({ title: 'Inert channel result', persistent: true });
    });
    await frame(page);
    assert.equal((await announcements(page)).length, 0);
    assert.equal(await page.getByRole('region', { name: 'Neighbor notifications' }).count(), 0);
    await body.evaluate((node) => {
      node.querySelector('[role="status"]').inert = false;
    });
    await page.waitForFunction(() => window.toastAnnouncements.length === 1);
    await page.evaluate(() =>
      document.getElementById('neighbor-host').removeAttribute('data-test-concealed'),
    );
    await page.getByRole('region', { name: 'Neighbor notifications' }).waitFor();
    await page.waitForFunction(() => window.toastAnnouncements.length === 2);
    assert.deepEqual(
      (await announcements(page)).map(({ text }) => text),
      ['Inert channel result', 'Hidden scope result'],
    );
  },

  'Toast responds when a sibling selector reveals its waiting host or live channel': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await announce(page);
    await page.addStyleTag({
      content: `
      #toggle-neighbor[aria-expanded="false"] + #neighbor-host { visibility: hidden; }
      body:has(#origin-a[aria-expanded="false"]) > [data-global] > [role="status"] { visibility: hidden; }
    `,
    });
    await page.evaluate(() => {
      const outer = document.getElementById('neighbor-wrapper');
      const toggle = document.createElement('button');
      toggle.id = 'toggle-neighbor';
      toggle.setAttribute('aria-expanded', 'false');
      outer.prepend(toggle);
      outer.showPopover();
      document.getElementById('origin-a').setAttribute('aria-expanded', 'false');
      window.toastFixture.sibling.show({ title: 'Deferred local result', persistent: true });
      window.toastFixture.global.show({ title: 'Deferred live text', persistent: true });
    });
    await page.locator('[data-global]:popover-open').waitFor();
    await frame(page);
    assert.equal(await page.getByRole('region', { name: 'Neighbor notifications' }).count(), 0);
    assert.deepEqual(await announcements(page), []);
    await page.evaluate(() =>
      document.getElementById('toggle-neighbor').setAttribute('aria-expanded', 'true'),
    );
    await page.getByRole('region', { name: 'Neighbor notifications' }).waitFor();
    await page.waitForFunction(() => window.toastAnnouncements.length === 1);
    await page.evaluate(() =>
      document.getElementById('origin-a').setAttribute('aria-expanded', 'true'),
    );
    await page.waitForFunction(() => window.toastAnnouncements.length === 2);
    assert.deepEqual(
      (await announcements(page)).map(({ text }) => text),
      ['Deferred local result', 'Deferred live text'],
    );
  },

  'Toast follows focus-only visibility changes to its waiting host': async ({ page, mount }) => {
    await mount('toast');
    await announce(page);
    await page.addStyleTag({
      content: 'body:not(:has(#origin-a:focus)) #neighbor-host { visibility: hidden; }',
    });
    const originA = page.locator('#origin-a');
    const originB = page.locator('#origin-b');
    await originB.focus();
    await page.evaluate(() => {
      document.getElementById('neighbor-wrapper').showPopover();
      window.toastFixture.sibling.show({ title: 'Waiting for available pane', persistent: true });
    });
    const carrier = page.getByRole('region', { name: 'Neighbor notifications' });
    await frame(page);
    assert.equal(await carrier.count(), 0);
    assert.deepEqual(await announcements(page), []);

    await originA.focus();
    await carrier.waitFor();
    await page.waitForFunction(() => window.toastAnnouncements.length === 1);
    await assertFocused(originA);

    await originB.focus();
    await page.locator('#neighbor-host > .unica-toast-viewport').waitFor({ state: 'detached' });
    await originA.focus();
    await carrier.waitFor();
    await frame(page);
    assert.deepEqual(
      (await announcements(page)).map(({ text }) => text),
      ['Waiting for available pane'],
    );
    await assertFocused(originA);
  },

  'Toast pauses reading while its carrier has zero opacity': async ({ page, mount }) => {
    await mount('toast');
    const start = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time: start });
    await page.clock.pauseAt(new Date(start.valueOf() + 1000));
    await page.evaluate(() =>
      window.toastFixture.global.show({ title: 'Temporarily transparent' }, { announce: false }),
    );
    const body = page.locator('[data-global]:popover-open');
    await body.waitFor();
    await page.clock.runFor(2000);
    await body.evaluate((node) => {
      node.style.opacity = '0';
    });
    await page.clock.runFor(8000);
    assert.equal(await body.count(), 1);
    await body.evaluate((node) => {
      node.style.opacity = '1';
    });
    await page.clock.runFor(3999);
    assert.equal(await body.count(), 1);
    await page.clock.runFor(1);
    await body.waitFor({ state: 'detached' });
  },

  'Toast keeps the first viewport reserved through React Activity visibility': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await announce(page);
    await page.evaluate(() =>
      window.toastFixture.global.show(
        { title: 'Existing result', persistent: true },
        { announce: false },
      ),
    );
    const first = page.locator('[data-global]:popover-open');
    const standby = page.locator('[data-alternative]:popover-open');
    await first.waitFor();
    await page.getByRole('button', { name: 'Suspend first viewport' }).click();
    await first.waitFor({ state: 'detached' });
    await page.evaluate(() =>
      window.toastFixture.global.show({ title: 'While suspended', persistent: true }),
    );
    await frame(page);
    assert.equal(await standby.count(), 0);
    assert.deepEqual(await announcements(page), []);
    await page.getByRole('button', { name: 'Reveal first viewport' }).click();
    await first.getByRole('group', { name: 'While suspended' }).waitFor();
    await page.waitForFunction(() => window.toastAnnouncements.length === 1);
    assert.equal(await standby.count(), 0);
    await page.getByRole('button', { name: 'Switch viewport' }).click();
    await standby.getByRole('group', { name: 'While suspended' }).waitFor();
    await frame(page);
    assert.equal((await announcements(page)).length, 1);
  },

  'Toast keeps closed ShadowRoot focus and returns to the outside origin after pointer dismissal':
    async ({ page, mount }) => {
      await mount('toast');
      const start = new Date('2026-01-01T00:00:00Z');
      await page.clock.install({ time: start });
      await page.clock.pauseAt(new Date(start.valueOf() + 1000));
      await page.locator('#origin-a').focus();
      await page.evaluate(() =>
        window.toastFixture.closedShadow.show(
          { title: 'Private shadow result' },
          { announce: false },
        ),
      );
      const closedCarrier = () =>
        page.evaluate(
          () =>
            !!window.toastFixture.closedScope.querySelector('[data-closed-shadow]:popover-open'),
        );
      assert.equal(await closedCarrier(), true);
      await page.clock.runFor(2000);
      const shadowFocus = await page.evaluate(() => {
        const scope = window.toastFixture.closedScope;
        const close = scope.querySelector('.unica-toast-dismiss');
        close.focus();
        return {
          retargeted: document.activeElement.id === 'toast-closed-host',
          local: scope.getRootNode().activeElement === close,
        };
      });
      assert.deepEqual(shadowFocus, { retargeted: true, local: true });
      await page.clock.runFor(8000);
      assert.equal(await closedCarrier(), true);
      await page.evaluate(() =>
        window.toastFixture.closedScope.getRootNode().querySelector('#closed-field').focus(),
      );
      await page.clock.runFor(3999);
      assert.equal(await closedCarrier(), true);
      await page.clock.runFor(1);
      assert.equal(await closedCarrier(), false);

      await page.locator('#origin-a').focus();
      await page.evaluate(() =>
        window.toastFixture.closedShadow.show(
          { title: 'Dismiss in the private root', persistent: true },
          { announce: false },
        ),
      );
      const point = await page.evaluate(() => {
        const close = window.toastFixture.closedScope.querySelector('.unica-toast-dismiss');
        close.focus();
        const rect = close.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
      await page.mouse.click(point.x, point.y);
      assert.equal(await closedCarrier(), false);
      await assertFocused(page.locator('#origin-a'));
    },

  'Toast readmits the native carrier after moving a connected shadow branch in one turn': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await page.evaluate(() => {
      window.toastFixture.shadow.show({
        title: 'Shadow result',
        action: {
          label: 'Accept shadow result',
          onClick: () => {
            window.shadowResultAccepted = true;
          },
        },
      });
    });
    const root = page.locator('#toast-shadow-host [data-shadow]:popover-open');
    await root.waitFor();
    const oldCarrier = await root.elementHandle();
    const change = await page.evaluate(() => {
      const host = document.getElementById('toast-shadow-host');
      const carrier = host.shadowRoot.querySelector('[data-shadow]');
      let toggles = 0;
      carrier.addEventListener('beforetoggle', () => {
        toggles += 1;
      });
      host.remove();
      document.body.append(host);
      return { connected: carrier.isConnected, open: carrier.matches(':popover-open'), toggles };
    });
    assert.deepEqual(change, { connected: true, open: false, toggles: 0 });
    await root.getByRole('button', { name: 'Accept shadow result' }).click();
    assert.equal(await oldCarrier.evaluate((node) => node.isConnected), false);
    assert.equal(await page.evaluate(() => window.shadowResultAccepted), true);
  },

  'Toast keeps the compact front while a pointer stays over it after focus leaves': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await page.evaluate(() => {
      const queue = window.toastFixture.global;
      queue.show({ title: 'Previous', status: 'warning' });
      queue.show({
        title: 'Archived',
        action: {
          label: 'Undo archive',
          onClick: () => {
            window.restoredArchive = true;
          },
        },
      });
    });
    const undo = global(page).getByRole('button', { name: 'Undo archive' });
    await undo.hover();
    await undo.focus();
    await page.locator('#origin-b').focus();
    await page.evaluate(() =>
      window.toastFixture.global.show({
        title: 'New arrival',
        action: { label: 'Inspect arrival', onClick() {} },
      }),
    );
    await global(page).getByRole('button', { name: 'Expand 3 notifications' }).waitFor();
    assert.equal(await global(page).getByRole('button', { name: 'Inspect arrival' }).count(), 0);
    await undo.click();
    assert.equal(await page.evaluate(() => window.restoredArchive), true);
    await page.locator('#origin-b').focus();
    await page.mouse.move(790, 590);
    await global(page).getByRole('button', { name: 'Inspect arrival' }).waitFor();
  },

  'Toast pointer dismissal skips a covered next control and restores the visible previous control':
    async ({ page, mount }) => {
      await mount('toast', { reducedMotion: 'reduce' });
      await page.evaluate(() => {
        const queue = window.toastFixture.global;
        for (const title of ['Covered next', 'Current', 'Visible previous']) {
          queue.show({ title, persistent: true }, { announce: false });
        }
      });
      const viewport = global(page);
      await viewport.getByRole('button', { name: 'Expand 3 notifications' }).press('Enter');
      const covered = viewport.getByRole('group', { name: 'Covered next' });
      await covered.evaluate((node) => {
        node.style.clipPath = 'inset(50%)';
      });
      await viewport.getByRole('button', { name: 'Dismiss: Current' }).click();
      await assertFocused(viewport.getByRole('button', { name: 'Dismiss: Visible previous' }));
    },

  'Toast waits for the same native branch to recover and reopens a clickable carrier': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await announce(page);
    const neighbor = page.getByRole('region', { name: 'Neighbor notifications' });
    await page.evaluate(() => {
      document.getElementById('neighbor-wrapper').showPopover();
      window.toastFixture.sibling.show({ title: 'Queue ready', persistent: true });
    });
    await neighbor.getByRole('group', { name: 'Queue ready', exact: true }).waitFor();
    await page.waitForFunction(() => window.toastAnnouncements.length === 1);
    await page.evaluate(() => {
      const wrapper = document.getElementById('neighbor-wrapper');
      wrapper.hidePopover();
      window.toastFixture.sibling.show({ title: 'Wait while hidden', persistent: true });
    });
    await neighbor.waitFor({ state: 'detached' });
    await frame(page);
    assert.equal((await announcements(page)).length, 1);
    await page.evaluate(() => document.getElementById('neighbor-wrapper').showPopover());
    await neighbor.getByRole('button', { name: 'Expand 2 notifications' }).click();
    await neighbor.getByRole('group', { name: 'Notification list' }).waitFor();
    await page.waitForFunction(() => window.toastAnnouncements.length === 2);
    await page.evaluate(() => {
      const wrapper = document.getElementById('neighbor-wrapper');
      window.removedToastHost = wrapper.firstElementChild;
      window.removedToastHost.remove();
      window.toastFixture.sibling.show({ title: 'Wait while detached', persistent: true });
    });
    await neighbor.waitFor({ state: 'detached' });
    await page.evaluate(() =>
      document.getElementById('neighbor-wrapper').append(window.removedToastHost),
    );
    await frame(page);
    assert.deepEqual(
      await page.evaluate(() => {
        const wrapper = document.getElementById('neighbor-wrapper');
        const host = document.getElementById('neighbor-host');
        const carrier = host?.querySelector('.unica-toast-viewport');
        return {
          wrapper: wrapper.matches(':popover-open'),
          host: host === window.removedToastHost,
          carrier: carrier?.matches(':popover-open') ?? false,
          rows: [...(carrier?.querySelectorAll('.unica-toast-title') ?? [])].map(
            (item) => item.textContent,
          ),
        };
      }),
      {
        wrapper: true,
        host: true,
        carrier: true,
        rows: ['Queue ready', 'Wait while hidden', 'Wait while detached'],
      },
    );
    await neighbor.getByRole('button', { name: 'Dismiss: Wait while detached' }).click();
    assert.equal(await neighbor.evaluate((node) => node.matches(':popover-open')), true);
  },

  'Toast restores the last external focus and updates translated dock names in place': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await page.locator('#origin-a').focus();
    await page.evaluate(() =>
      window.toastFixture.global.show({ title: 'First result', persistent: true }),
    );
    const first = global(page).getByRole('button', { name: 'Dismiss: First result' });
    await first.focus();
    await page.locator('#origin-b').focus();
    await first.focus();
    await page.evaluate(() => {
      window.toastFocusPath = [];
      document.addEventListener('focusin', ({ target }) => window.toastFocusPath.push(target.id));
    });
    await page.keyboard.press('Enter');
    await assertFocused(page.locator('#origin-b'));
    assert.deepEqual(await page.evaluate(() => window.toastFocusPath), ['origin-b']);

    await page.evaluate(() => {
      const queue = window.toastFixture.global;
      queue.show({ title: 'One', persistent: true });
      queue.show({ title: 'Two', persistent: true });
    });
    const toggle = global(page).getByRole('button', { name: 'Expand 2 notifications' });
    const element = await toggle.elementHandle();
    await toggle.press('Enter');
    assert.equal(
      await element.evaluate(
        (node) => node.matches(':focus') && node.getAttribute('aria-expanded') === 'true',
      ),
      true,
    );
    await page.evaluate(() =>
      window.toastFixture.global.show({ title: 'Three', persistent: true }),
    );
    await assertFocused(global(page).getByRole('button', { name: 'Collapse 3 notifications' }));
    await page.getByRole('button', { name: 'Translate' }).evaluate((button) => button.click());
    const translated = page.getByRole('group', { name: 'Result controls' });
    assert.equal(
      await translated.getByRole('button', { name: 'Clear all 3 results' }).textContent(),
      'Clear',
    );
    assert.equal(
      await element.evaluate((node) => node.getAttribute('aria-label')),
      'Close 3 results',
    );
    await page.getByRole('button', { name: 'Switch viewport' }).click();
    await page.locator('[data-alternative]:popover-open').waitFor();
    await page.getByRole('button', { name: 'Open 3 results' }).waitFor();
  },

  'Toast charges six seconds of reading time across real hover, focus and a portal change': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    const note = global(page).getByText('Saved report', { exact: true });
    await page.evaluate(() =>
      window.toastFixture.global.show({ title: 'Saved report', status: 'success' }),
    );
    await note.waitFor();
    await page.clock.runFor(1900);
    await note.hover();
    await page.clock.runFor(8000);
    await note.waitFor();
    const dismiss = global(page).getByRole('button', { name: 'Dismiss: Saved report' });
    await dismiss.focus();
    await page.mouse.move(790, 590);
    await page.clock.runFor(8000);
    await note.waitFor();
    await page.evaluate(() => window.toastFixture.open());
    await page.getByRole('dialog', { name: 'Export editor' }).getByRole('textbox').focus();
    await page.clock.runFor(3800);
    await note.waitFor();
    await page.clock.runFor(500);
    await note.waitFor({ state: 'detached' });
  },
  'Toast distinguishes covered text from covered padding at the sticky edge': async ({
    page,
    mount,
  }) => {
    await mount('toast');
    await page.evaluate(() => {
      window.toastPaint = window.requestAnimationFrame.bind(window);
    });
    const start = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time: start });
    await page.clock.pauseAt(new Date(start.valueOf() + 1000));
    const paint = () =>
      page.evaluate(
        () =>
          new Promise((resolve) => {
            window.toastPaint(() => window.toastPaint(resolve));
          }),
      );
    for (const cover of ['text', 'padding']) {
      await page.evaluate(() => window.toastFixture.global.dismissAll());
      await global(page).waitFor({ state: 'detached' });
      await page.evaluate(() => {
        const queue = window.toastFixture.global;
        for (let index = 0; index < 9; index += 1) {
          queue.show(
            {
              title: `Previous result ${index}`,
              description: 'A previous task completed in this workspace.',
              persistent: true,
            },
            { announce: false },
          );
        }
        queue.show(
          {
            title: 'Reading confirmation',
            description:
              'The archived files remain available from the workspace. Open the activity page for any additional details.',
            status: 'success',
          },
          { announce: false },
        );
      });
      await global(page).getByRole('button', { name: 'Expand 10 notifications' }).press('Enter');
      await page.locator('#origin-a').focus();
      const list = global(page).getByRole('group', { name: 'Notification list' });
      const card = list.getByRole('group', { name: 'Reading confirmation', exact: true });
      await list.waitFor();
      await paint();
      await page.clock.runFor(2000);
      const sample = () =>
        list.evaluate((node) => {
          const target = node.querySelector('.unica-toast-list-item');
          const card = target.querySelector('.unica-toast');
          function lastLine(selector) {
            const range = document.createRange();
            range.selectNodeContents(card.querySelector(selector).firstChild);
            return [...range.getClientRects()].at(-1);
          }
          function sees(rect) {
            const x = (rect.left + rect.right) / 2;
            const y = (rect.top + rect.bottom) / 2;
            return target.contains(document.elementFromPoint(x, y));
          }
          const bounds = card.getBoundingClientRect();
          return {
            title: sees(lastLine('.unica-toast-title bdi')),
            text: sees(lastLine('.unica-toast-description bdi')),
            padding: sees({
              left: bounds.left + 30,
              right: bounds.right - 30,
              top: bounds.bottom - 3,
              bottom: bounds.bottom - 1,
            }),
          };
        });
      assert.deepEqual(await sample(), { title: true, text: true, padding: true });
      await list.evaluate((node, covered) => {
        const [current, next] = node.querySelectorAll('.unica-toast-list-item');
        const detail = current.querySelector('.unica-toast-description bdi').firstChild;
        const range = document.createRange();
        range.selectNodeContents(detail);
        const lastLine = [...range.getClientRects()].at(-1);
        const boundary =
          covered === 'text' ? (lastLine.top + lastLine.bottom) / 2 - 2 : lastLine.bottom + 2;
        node.scrollTop = Math.ceil(next.getBoundingClientRect().top - boundary);
      }, cover);
      await paint();
      assert.deepEqual(await sample(), { title: true, text: cover === 'padding', padding: false });
      if (cover === 'text') {
        await page.clock.runFor(7000);
        assert.equal(await card.count(), 1);
        await list.evaluate((node) => {
          node.scrollTop = 0;
        });
        await paint();
        await page.clock.runFor(3999);
        assert.equal(await card.count(), 1);
        await page.clock.runFor(1);
      } else {
        await page.clock.runFor(4000);
      }
      await card.waitFor({ state: 'detached' });
    }
  },

  'Toast hydrates inline content before an explicit host becomes available': async ({
    page,
    mount,
    renderFixture,
  }) => {
    await mount('toast-hydration');
    const wrapper = page.locator('[data-toast-hydration]');
    await wrapper.evaluate(
      (node, html) => {
        node.innerHTML = html;
      },
      await renderFixture('toast-ssr'),
    );
    await announce(page);
    assert.equal(await wrapper.getByRole('group', { name: 'Server rendered note' }).count(), 1);
    assert.equal(await wrapper.locator('[popover]').count(), 0);
    await wrapper.evaluate((node) => node.dispatchEvent(new Event('hydrate-toast')));
    await frame(page);
    assert.equal(await wrapper.locator('[popover]').count(), 0);
    await wrapper.getByRole('button', { name: 'Mount notifications' }).click();
    await global(page).getByRole('button', { name: 'Dismiss: Hydrated result' }).waitFor();
    await page.waitForFunction(() => window.toastAnnouncements.length === 1);
    assert.deepEqual(await announcements(page), [
      { text: 'Hydrated result', role: 'status', host: 'hydrated-host' },
    ]);
    assert.equal(await wrapper.getByRole('group', { name: 'Server rendered note' }).count(), 1);
  },

  'Toast workbench compares six quiet queues and announces shared commands once': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1560, height: 900 });
    await mount('workbench-v3');
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.search = '?item=toast&tab=states&block=reading&family=all&scheme=both';
      history.pushState(null, '', url);
      dispatchEvent(new PopStateEvent('popstate'));
    });
    const block = page.locator('[data-wb-block="reading"]');
    const artboards = block.locator('iframe');
    await artboards.first().waitFor({ state: 'attached' });
    assert.equal(await artboards.count(), 6);
    for (const board of await artboards.all()) {
      const inside = board.contentFrame();
      const list = inside.getByRole('group', { name: 'Notification list' });
      await list.waitFor();
      assert.equal(await list.locator('.unica-toast').count(), 10);
      await list.evaluate((node) => {
        const document = node.ownerDocument;
        const view = document.defaultView;
        view.observedToastMessages = [];
        new view.MutationObserver((records) => {
          for (const record of records) {
            if (record.target.matches?.('.unica-toast-viewport > [role="status"]')) {
              for (const addition of record.addedNodes) {
                if (addition.textContent) {
                  view.observedToastMessages.push(addition.textContent);
                }
              }
            }
          }
        }).observe(document, { subtree: true, childList: true });
      });
    }
    assert.equal(
      await artboards.evaluateAll((frames) =>
        frames.every((iframe) => {
          return (
            iframe.contentDocument.querySelector('.unica-toast-viewport > [role="status"]')
              .textContent === ''
          );
        }),
      ),
      true,
    );
    await block.getByRole('button', { name: 'Add notification' }).click();
    for (const board of await artboards.all()) {
      await board
        .contentFrame()
        .getByRole('group', { name: 'Backup 1 complete', exact: true })
        .waitFor();
    }
    const events = () =>
      artboards.evaluateAll((frames) =>
        frames.flatMap((iframe) => iframe.contentWindow.observedToastMessages),
      );
    await page.waitForFunction(() => {
      return [...document.querySelectorAll('[data-wb-block="reading"] iframe')].some(
        (iframe) => iframe.contentWindow.observedToastMessages?.length,
      );
    });
    await frame(page);
    assert.deepEqual(await events(), ['Success. Backup 1 complete']);
    await artboards
      .first()
      .contentFrame()
      .getByRole('button', { name: 'Retry', exact: true })
      .click();
    await artboards
      .first()
      .contentFrame()
      .getByRole('group', { name: 'Draft backup complete' })
      .waitFor();
    await page.waitForFunction(() =>
      document
        .querySelector('[data-wb-block="reading"] iframe')
        .contentWindow.observedToastMessages.some((name) => name.includes('Draft backup complete')),
    );
    assert.equal((await events()).length, 2);
  },
  'Toast moves to the free edge when the visible viewport shrinks around an editor': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 560 });
    await mount('toast');
    await page.getByRole('button', { name: 'Open editor' }).click();
    const dialog = page.getByRole('dialog', { name: 'Export editor' });
    const field = dialog.getByRole('textbox');
    await field.focus();
    await dialog.evaluate((node) => {
      Object.assign(node.style, { position: 'fixed', inset: '120px 0 auto', margin: '0 auto' });
      const viewport = node.ownerDocument.defaultView.visualViewport;
      Object.defineProperties(viewport, {
        height: { value: 270, configurable: true },
        offsetTop: { value: 100, configurable: true },
      });
      viewport.dispatchEvent(new Event('resize'));
    });
    await page.evaluate(() => {
      window.toastFixture.global.show({
        title: 'Export needs attention',
        description: 'The original file remains available.',
        status: 'warning',
        action: {
          label: 'Review export',
          onClick: () => {
            window.reviewedExport = true;
          },
        },
      });
    });
    const notification = global(page);
    await notification.waitFor();
    await page.locator('[data-global][data-unica-toast-edge="bottom"]').waitFor();
    await assertFocused(field);
    const bounds = await notification.boundingBox();
    const input = await field.boundingBox();
    assert.ok(bounds && input && bounds.y >= input.y + input.height);
    assert.ok(bounds.y + bounds.height <= 370 - 24 + 1);
    await notification.getByRole('button', { name: 'Review export' }).click();
    assert.equal(await page.evaluate(() => window.reviewedExport), true);
  },

  'Toast preserves a reading anchor across new rows and earlier height changes': async ({
    page,
    mount,
  }) => {
    await mount('toast', { theme: 'pixel-light', direction: 'rtl', textScale: 120 });
    await page.evaluate(() => {
      const queue = window.toastFixture.global;
      window.toastReadingIds = [];
      for (let index = 0; index < 12; index += 1) {
        window.toastReadingIds.push(
          queue.show({ title: 'Activity ' + index, persistent: true }, { announce: false }),
        );
      }
    });
    const viewport = global(page);
    await viewport.getByRole('button', { name: 'Expand 12 notifications' }).press('Enter');
    const list = viewport.getByRole('group', { name: 'Notification list' });
    await list.evaluate((node) => {
      node.scrollTop = Math.round(node.scrollHeight * 0.37);
    });
    await frame(page);
    const anchor = await list.evaluate((node) => {
      const top = node.getBoundingClientRect().top;
      const edge = top + Number.parseFloat(getComputedStyle(node).paddingBlockStart);
      const rows = [...node.querySelectorAll('.unica-toast-list-item')];
      const row = rows.find(
        (row) => row.previousElementSibling.getBoundingClientRect().top + row.offsetHeight > edge,
      );
      return {
        id: row.dataset.unicaToastItem,
        offset: row.previousElementSibling.getBoundingClientRect().top - top,
      };
    });
    const offset = () =>
      list.evaluate((node, id) => {
        const row = node.querySelector(`[data-unica-toast-item="${id}"]`);
        return (
          row.previousElementSibling.getBoundingClientRect().top - node.getBoundingClientRect().top
        );
      }, anchor.id);
    await page.evaluate(() =>
      window.toastFixture.global.show({ title: 'Newest activity', persistent: true }),
    );
    await viewport.getByRole('group', { name: 'Newest activity' }).waitFor();
    await frame(page);
    assert.ok(Math.abs((await offset()) - anchor.offset) <= 1);
    await page.evaluate(() =>
      window.toastFixture.global.update(window.toastReadingIds.at(-1), {
        description:
          'Many earlier changes were recorded in the same archive. The manifest lists every file. Review the archive contents to verify the result before proceeding.',
      }),
    );
    await frame(page);
    assert.ok(Math.abs((await offset()) - anchor.offset) <= 1);
  },
};

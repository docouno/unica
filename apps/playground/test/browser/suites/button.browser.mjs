import assert from 'node:assert/strict';
import { assertBox, assertFocused, assertHitTarget, getBox, pressKeys } from '../helpers.mjs';

const button = (scope, name) => scope.getByRole('button', { name, exact: true });
const link = (scope, name) => scope.getByRole('link', { name, exact: true });

async function activate(locator) {
  await locator.evaluate((element) => element.click());
}

async function json(page, testId) {
  return JSON.parse(await page.getByTestId(testId).textContent());
}

async function actionLog(page) {
  const actions = await json(page, 'native-activity');
  return actions.filter(
    (entry) =>
      !(Array.isArray(entry) && entry[0] === 'key capture' && ['Escape', 'Tab'].includes(entry[1])),
  );
}

async function centerClick(page, locator, mouseButton = 'left') {
  await locator.scrollIntoViewIfNeeded();
  const { x, y, width, height } = await getBox(locator);
  const point = { x: x + width / 2, y: y + height / 2 };
  await page.mouse.click(point.x, point.y, { button: mouseButton });
  return point;
}

export default {
  'Button preserves native submit, cancel, validation and reset through external form association':
    async ({ page, mount }) => {
      await mount('button');
      const form = page.locator('#button-form');
      const input = page.getByRole('textbox', { name: 'Search query' });
      const ordinary = button(page, 'Ordinary command');
      const save = button(page, 'Save query');
      const local = button(page, 'Local toggle');

      assert.equal(await ordinary.getAttribute('type'), 'button');
      assert.equal(await ordinary.getAttribute('aria-pressed'), null);
      assert.equal(await save.evaluate((element) => element.form?.id), 'button-form');
      assert.deepEqual(
        await save.evaluate((element) => [
          new URL(element.formAction).hash,
          element.formMethod,
          element.formEnctype,
        ]),
        ['#save-query', 'post', 'multipart/form-data'],
      );

      await ordinary.click();
      await input.fill('');
      await save.click();
      await assertFocused(input);
      assert.deepEqual(await json(page, 'native-activity'), ['command', 'submit click']);

      await input.fill('Edited');
      await save.click();
      assert.deepEqual(await json(page, 'native-activity'), [
        'command',
        'submit click',
        'submit click',
        [
          'submit',
          'Save query',
          [
            ['query', 'Edited'],
            ['intent', 'save'],
          ],
        ],
      ]);
      assert.deepEqual(await form.evaluate((element) => [...new FormData(element)]), [
        ['query', 'Edited'],
      ]);

      await local.click();
      assert.equal(await local.getAttribute('aria-pressed'), 'true');
      await button(page, 'Clear native activity').click();
      await button(page, 'Cancel reset').click();
      assert.equal(await input.inputValue(), 'Edited');
      await button(page, 'Restore query').click();
      assert.equal(await input.inputValue(), 'Initial');
      assert.equal(await local.getAttribute('aria-pressed'), 'true');
      assert.deepEqual(await json(page, 'native-activity'), []);
    },

  'Button respects controlled, batched, disabled and cancelled toggle proposals': async ({
    page,
    mount,
  }) => {
    await mount('button');
    const local = button(page, 'Local toggle');
    const controlled = button(page, 'Controlled toggle');
    const cancelled = button(page, 'Cancel toggle');

    assert.equal(await local.getAttribute('aria-pressed'), 'false');
    assert.equal(await controlled.getAttribute('aria-pressed'), 'false');
    await button(page, 'Run toggle batch').click();
    const proposals = [
      'local click',
      ['local', true],
      'local click',
      ['local', false],
      ['controlled', true],
      ['controlled', true],
    ];
    assert.deepEqual(await json(page, 'native-activity'), proposals);
    assert.equal(await local.getAttribute('aria-pressed'), 'false');
    assert.equal(await controlled.getAttribute('aria-pressed'), 'false');

    await cancelled.click();
    assert.equal(await cancelled.getAttribute('aria-pressed'), 'false');
    await activate(button(page, 'Disabled action'));
    await activate(button(page, 'Fieldset action'));
    assert.deepEqual(await json(page, 'native-activity'), proposals);
  },

  'Button pending actions preserve focus and reject click, keyboard, reset and implicit submit':
    async ({ page, mount }) => {
      await mount('button');
      const more = button(page, 'More options');
      const pending = button(page, 'Toggle pending actions');
      const stop = button(page, 'After menu triggers');
      const input = page.getByRole('textbox', { name: 'Search query' });
      const popup = page.locator('#native-button-popover');
      const invoker = button(page, 'Native popover invoker');
      const save = button(page, 'Save query');
      const clear = button(page, 'Clear native activity');

      await more.focus();
      await pressKeys(page, 'ArrowDown');
      await page.getByRole('menu', { name: 'Options' }).waitFor();
      assert.equal(await more.getAttribute('aria-expanded'), 'true');
      assert.equal(await more.getAttribute('aria-pressed'), null);
      await pressKeys(page, 'Escape');
      await invoker.click();
      await popup.waitFor({ state: 'visible' });
      await pressKeys(page, 'Escape');
      await popup.waitFor({ state: 'hidden' });

      await more.focus();
      await activate(clear);
      await activate(pending);
      assert.equal(await more.getAttribute('aria-busy'), 'true');
      assert.equal(await more.getAttribute('aria-disabled'), 'true');
      assert.equal(await more.getAttribute('disabled'), null);
      await assertFocused(more);

      await pressKeys(page, 'ArrowDown', 'ArrowUp', 'Enter', 'Space', 'Escape');
      await centerClick(page, more);
      await centerClick(page, more, 'middle');
      await page.getByRole('menu', { name: 'Options' }).waitFor({ state: 'hidden' });
      assert.deepEqual(await actionLog(page), ['ancestor escape']);

      await pressKeys(page, 'Tab');
      await assertFocused(invoker);
      await pressKeys(page, 'Enter', 'Space');
      assert.equal(await popup.evaluate((element) => element.matches(':popover-open')), false);
      await pressKeys(page, 'Tab');
      await assertFocused(stop);

      await input.fill('Draft');
      await input.press('Enter');
      await activate(save);
      await activate(button(page, 'Restore query'));
      await activate(button(page, 'Local toggle'));
      assert.equal(await input.inputValue(), 'Draft');
      assert.deepEqual(await actionLog(page), ['ancestor escape']);

      await activate(pending);
      await assertFocused(input);
      await input.press('Enter');
      await more.focus();
      await pressKeys(page, 'ArrowUp');
      await page.getByRole('menu', { name: 'Options' }).waitFor();
      assert.deepEqual(await actionLog(page), [
        'ancestor escape',
        'submit click',
        [
          'submit',
          'Save query',
          [
            ['query', 'Draft'],
            ['intent', 'save'],
          ],
        ],
        'focus',
        ['key capture', 'ArrowUp'],
        'menu keys',
      ]);
    },

  'Button pending respects the native fieldset lock including its first legend exemption': async ({
    page,
    mount,
  }) => {
    await mount('button');
    const legend = button(page, 'Legend action');
    const body = button(page, 'Fieldset action');
    const disabled = button(page, 'Disabled action');
    const lock = button(page, 'Toggle fieldset lock');

    await activate(button(page, 'Toggle pending actions'));
    assert.equal(await legend.getAttribute('aria-busy'), 'true');
    assert.equal(await legend.evaluate((element) => element.matches(':disabled')), false);
    assert.equal(await body.getAttribute('aria-busy'), null);
    assert.equal(await body.evaluate((element) => element.matches(':disabled')), true);
    assert.equal(await disabled.getAttribute('aria-busy'), null);
    assert.equal(await disabled.evaluate((element) => element.matches(':disabled')), true);

    await activate(lock);
    await body.and(page.locator('[aria-busy="true"]')).waitFor();
    await body.focus();
    await assertFocused(body);
    assert.equal(await body.evaluate((element) => element.matches(':disabled')), false);
    await activate(lock);
    await body.and(page.locator(':not([aria-busy="true"])')).waitFor();
    assert.equal(await body.evaluate((element) => element.matches(':disabled')), true);
    assert.equal(await disabled.getAttribute('aria-busy'), null);
  },

  'Button checks effective fieldset disablement before descendant pointer and click handlers':
    async ({ page, mount }) => {
      await mount('button');
      const activity = () => json(page, 'native-activity');
      const clear = button(page, 'Clear native activity');
      const stages = [
        'pointer down capture',
        'pointer down',
        'mouse down capture',
        'mouse down',
        'click capture',
        'click',
      ];

      const legend = button(page, 'Legend action');
      const control = button(page, 'Fieldset action');
      const label = page.getByTestId('fieldset-label');
      assert.equal(await legend.evaluate((element) => element.matches(':disabled')), false);
      assert.deepEqual(
        await control.evaluate((element) => [element.disabled, element.matches(':disabled')]),
        [false, true],
      );

      await centerClick(page, page.getByTestId('legend-label'));
      assert.deepEqual(
        await activity(),
        stages.map((stage) => ['legend', stage]),
      );
      await activate(clear);

      await assertHitTarget(label, await centerClick(page, label));
      await activate(label);
      assert.deepEqual(await activity(), []);

      await activate(button(page, 'Toggle fieldset lock'));
      await centerClick(page, label);
      assert.deepEqual(
        await activity(),
        stages.map((stage) => ['fieldset', stage]),
      );
      await activate(clear);

      await label.evaluate((element) => {
        element.closest('fieldset').disabled = true;
        element.click();
      });
      assert.deepEqual(await activity(), []);
    },

  'Button context menu handlers run only while the native action is available': async ({
    page,
    mount,
  }) => {
    await mount('button');
    const clear = button(page, 'Clear native activity');
    const assertContext = async (id, available) => {
      await activate(clear);
      await centerClick(page, page.getByTestId(id + '-label'), 'right');
      const context = (await json(page, 'native-activity')).filter(
        (entry) => Array.isArray(entry) && entry[1].startsWith('context menu'),
      );
      assert.deepEqual(
        context,
        available
          ? [
              [id, 'context menu capture'],
              [id, 'context menu'],
            ]
          : [],
      );
    };

    await assertContext('legend', true);
    await assertContext('fieldset', false);
    await assertContext('disabled', false);

    const togglePending = button(page, 'Toggle pending actions');
    await activate(togglePending);
    assert.equal(await button(page, 'Legend action').getAttribute('aria-busy'), 'true');
    await assertContext('legend', false);
    await activate(togglePending);
    await assertContext('legend', true);
  },

  'Button asChild keeps native navigation and ordered router activation with live refs': async ({
    page,
    mount,
  }) => {
    await mount('button');
    const native = link(page, 'Native destination');
    const route = link(page, 'Router destination');
    const before = button(page, 'Before route');
    const check = button(page, 'Check route refs');
    const assertRefs = async (live, cleared) => {
      await activate(check);
      const report = await json(page, 'router-refs');
      assert.equal(report.live, live);
      assert.equal(report.cleared, cleared);
      assert.equal(report.attached - report.cleaned, live ? 1 : 0);
    };

    await native.focus();
    await pressKeys(page, 'Space');
    assert.equal(new URL(page.url()).hash, '');
    await pressKeys(page, 'Enter');
    assert.equal(new URL(page.url()).hash, '#native-destination');
    const [tab] = await Promise.all([
      page.context().waitForEvent('page'),
      link(page, 'Native tab destination').click({ modifiers: ['Control'] }),
    ]);
    await tab.waitForURL((url) => url.hash === '#native-tab', { waitUntil: 'commit' });
    await tab.close();

    await before.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(route);
    assert.equal(await route.evaluate((element) => element.localName), 'a');
    assert.equal(await route.locator('a,button').count(), 0);
    assert.equal(await route.getAttribute('href'), '#route');
    assert.equal(await route.getAttribute('aria-pressed'), null);
    assert.equal(await route.getAttribute('aria-busy'), null);
    assert.equal(await route.getAttribute('aria-disabled'), null);
    assert.deepEqual((await route.getAttribute('aria-describedby')).split(/\s+/).sort(), [
      'child-route-note',
      'outer-route-note',
    ]);
    await assertRefs(true, false);

    await pressKeys(page, 'Space');
    assert.equal(new URL(page.url()).hash, '#native-destination');
    await pressKeys(page, 'Enter');
    assert.equal(new URL(page.url()).hash, '#route');
    const first = await json(page, 'route-activity');
    assert.ok(first.includes('child capture') && first.includes('outer capture'));
    assert.deepEqual(first.slice(-3), ['child', 'outer', 'navigation']);

    await activate(button(page, 'Toggle child cancellation'));
    await activate(button(page, 'Clear route activity'));
    await pressKeys(page, 'Enter');
    const cancelled = await json(page, 'route-activity');
    assert.equal(cancelled.at(-1), 'child');
    assert.ok(!cancelled.includes('outer') && !cancelled.includes('navigation'));

    await activate(button(page, 'Toggle route mount'));
    await route.waitFor({ state: 'detached' });
    await assertRefs(false, true);
  },

  'Button asChild removes the reachable URL during pending and keeps only owned focus': async ({
    page,
    mount,
  }) => {
    await mount('button');
    const route = link(page, 'Router destination');
    const report = link(page, 'Open report');
    const ready = button(page, 'Make route ready');
    const pending = button(page, 'Make route pending');
    const after = button(page, 'After route');
    const before = button(page, 'Before route');
    const check = button(page, 'Check route refs');

    await route.focus();
    assert.equal(await button(page, 'Read report details').count(), 1);
    assert.equal(await report.getAttribute('href'), '#report');
    const rest = await getBox(route);
    await activate(pending);
    assert.equal(await route.getAttribute('href'), null);
    assert.equal(await route.getAttribute('aria-busy'), 'true');
    assert.equal(await route.getAttribute('aria-disabled'), 'true');
    assert.equal(await report.getAttribute('href'), null);
    await assertFocused(route);
    await assertBox(route, { width: rest.width, height: rest.height });
    await activate(check);
    assert.equal((await json(page, 'router-refs')).live, true);
    await pressKeys(page, 'Enter', 'Space');
    await centerClick(page, route);
    await centerClick(page, route, 'middle');
    assert.deepEqual(await json(page, 'route-activity'), []);
    assert.equal(new URL(page.url()).hash, '');

    await activate(ready);
    await assertFocused(route);
    assert.equal(await route.getAttribute('href'), '#route');
    await activate(pending);
    await pressKeys(page, 'Tab');
    await assertFocused(after);
    await activate(ready);
    await assertFocused(after);

    await activate(button(page, 'Disable route'));
    assert.equal(await route.getAttribute('href'), null);
    assert.equal(await route.getAttribute('tabindex'), '-1');
    await before.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(after);
  },

  'Button SSR holds native invokers before hydration and restores only pending Tab stops': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('button-ssr');
    await mount('button-hydration');
    const root = page.getByTestId('server-button-root');
    const events = await root.evaluateHandle((element, markup) => {
      element.innerHTML = markup;
      const form = element.querySelector('form');
      const submits = [];
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submits.push([...new FormData(form, event.submitter)]);
      });
      return { submits, nodes: [...element.querySelectorAll('button')], form };
    }, html);
    const save = button(root, 'Server first submit');
    const second = button(root, 'Server second submit');
    const reset = button(root, 'Server reset');
    const invoker = button(root, 'Server popover invoker');
    const popup = root.locator('#server-button-popover');
    const dialogInvoker = button(root, 'Server dialog invoker');
    const dialog = root.locator('#server-button-dialog');
    const legend = button(root, 'Server legend action');
    const body = button(root, 'Server fieldset action');
    const disabled = button(root, 'Server disabled action');
    const input = root.getByRole('textbox', { name: 'Server query' });

    for (const native of [save, reset, invoker, dialogInvoker, legend]) {
      assert.equal(await native.evaluate((element) => element.disabled), true);
    }
    for (const stillVisible of [save, legend]) {
      assert.equal(await stillVisible.locator('.unica-button-spinner svg').isVisible(), true);
    }
    for (const inaccessible of [body, disabled]) {
      assert.equal(await inaccessible.locator('.unica-button-spinner svg').isVisible(), false);
    }
    const pendingLink = link(root, 'Server pending link');
    assert.equal(await pendingLink.getAttribute('href'), null);
    assert.equal(await pendingLink.getAttribute('tabindex'), '0');
    assert.equal(await link(root, 'Server disabled link').getAttribute('tabindex'), '-1');
    await input.fill('Server edit');
    await input.press('Enter');
    await pressKeys(page, 'Tab');
    await assertFocused(second);
    for (const native of [save, reset, invoker, dialogInvoker]) {
      await activate(native);
    }
    assert.deepEqual(await events.evaluate(({ submits }) => submits), []);
    assert.equal(await popup.evaluate((element) => element.matches(':popover-open')), false);
    assert.equal(await dialog.evaluate((element) => element.open), false);
    assert.equal(await input.inputValue(), 'Server edit');

    await activate(button(page, 'Hydrate server buttons'));
    await root.locator('[data-hydrated]').waitFor();
    assert.equal(
      await events.evaluate(
        ({ nodes, form }) => form.isConnected && nodes.every((node) => node.isConnected),
      ),
      true,
    );
    for (const native of [save, reset, invoker, dialogInvoker, legend]) {
      assert.equal(await native.evaluate((element) => element.matches(':disabled')), false);
      assert.equal(await native.getAttribute('aria-busy'), 'true');
    }
    for (const native of [body, disabled]) {
      assert.equal(await native.evaluate((element) => element.matches(':disabled')), true);
      assert.equal(await native.getAttribute('aria-busy'), null);
    }

    await input.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(save);
    await pressKeys(page, 'Space', 'Enter', 'Tab');
    await assertFocused(second);
    await input.press('Enter');
    assert.deepEqual(await events.evaluate(({ submits }) => submits), []);

    await input.focus();
    await activate(button(root, 'Complete server actions'));
    await assertFocused(input);
    await pressKeys(page, 'Enter');
    assert.deepEqual(await events.evaluate(({ submits }) => submits), [
      [
        ['query', 'Server edit'],
        ['outcome', 'first'],
      ],
    ]);
    await reset.click();
    assert.equal(await input.inputValue(), 'Server initial');
    await invoker.click();
    await popup.waitFor({ state: 'visible' });
    await pressKeys(page, 'Escape');
    await dialogInvoker.click();
    assert.equal(await dialog.evaluate((element) => element.matches(':modal')), true);
    await events.dispose();
  },
};

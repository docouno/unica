import assert from 'node:assert/strict';
import { assertFocused, resetForm } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const entries = (form) => form.evaluate((node) => [...new FormData(node)]);
const log = async (page) => JSON.parse((await page.getByTestId('log').textContent()) || '[]');
const initial = [
  ['local', 'a'],
  ['controlled', 'a'],
  ['multi', 'b'],
  ['multi', 'a'],
  ['checked', 'yes'],
];

export default {
  'Form proposals stay blocked through native modal autofocus and exit': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    const open = button(page, 'Open shadow modal');
    await open.click();
    assert.equal(await open.getAttribute('data-modal-blur'), 'true');
    assert.deepEqual(await log(page), []);
    assert.deepEqual(await entries(page.locator('#first')), initial);
    await button(page, 'Change local to B').click();
    assert.equal(await page.getByTestId('local-value').textContent(), 'c');
  },

  'form reads inside reentrant and controlled callbacks use current authority': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    const form = page.locator('#first');
    const controlled = page.locator('select[name=controlled]');
    const local = page.locator('select[name=local]');
    await button(page, 'Change local to B').click();
    assert.deepEqual(
      (await log(page)).map(({ phase, value, entries }) => [phase, value, entries[0]]),
      [
        ['local', 'b', ['local', 'b']],
        ['local', 'c', ['local', 'c']],
      ],
    );
    assert.equal(await page.getByTestId('local-value').textContent(), 'c');
    assert.equal(await local.inputValue(), 'c');

    await button(page, 'Propose controlled B').click();
    await controlled.selectOption('b');
    assert.equal(await controlled.inputValue(), 'a');
    assert.deepEqual(
      (await log(page)).slice(-2).map(({ phase, value, entries }) => [phase, value, entries[1]]),
      [
        ['controlled', 'b', ['controlled', 'a']],
        ['controlled', 'b', ['controlled', 'a']],
      ],
    );

    await button(page, 'Accept controlled as C').click();
    await controlled.selectOption('b');
    const accepted = (await log(page)).slice(-2);
    assert.deepEqual(
      accepted.map(({ phase, value, entries }) => [phase, value, entries[1]]),
      [
        ['controlled', 'b', ['controlled', 'a']],
        ['committed', 'c', ['controlled', 'c']],
      ],
    );
    assert.deepEqual(await entries(form), [
      ['local', 'c'],
      ['controlled', 'c'],
      ...initial.slice(2),
    ]);
    await button(page, 'Toggle controlled read only').click();
    await button(page, 'Propose controlled B').click();
    await controlled.selectOption('b');
    assert.equal((await log(page)).length, 6);
    assert.equal(await controlled.inputValue(), 'c');
  },
  'native radio changes repair the whole group and survive disabled or removed peers': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    const form = page.locator('#radios');
    const radioB = page.getByRole('radio', { name: 'Radio B', exact: true });
    const a = [
      ['radio', 'a'],
      ['other-radio', 'other'],
    ];
    const b = [
      ['radio', 'b'],
      ['other-radio', 'other'],
    ];
    await radioB.click();
    assert.deepEqual(await log(page), [
      { phase: 'radio', value: 'b', entries: a, checked: [true, false] },
    ]);
    assert.deepEqual(await entries(form), a);
    await button(page, 'Accept radio B').click();
    await radioB.click();
    assert.deepEqual((await log(page)).slice(-2), [
      { phase: 'radio', value: 'b', entries: a, checked: [true, false] },
      { phase: 'radio committed', value: 'b', entries: b, checked: [false, true] },
    ]);
    assert.deepEqual(await entries(form), b);
    await resetForm(form);
    assert.deepEqual(await entries(form), b);
    await button(page, 'Use local radio').click();
    await radioB.click();
    assert.deepEqual((await log(page)).at(-1), {
      phase: 'local radio',
      value: 'b',
      entries: b,
      checked: [false, true],
    });
    assert.deepEqual(await entries(form), b);
    await resetForm(form);
    assert.deepEqual(await entries(form), a);

    // Re-selecting the same pre-reset radio (and switching back to Radio A) must still fire onChange.
    const logLenAfterReset = (await log(page)).length;
    await radioB.click();
    assert.equal((await log(page)).length, logLenAfterReset + 1);
    assert.deepEqual((await log(page)).at(-1), {
      phase: 'local radio',
      value: 'b',
      entries: b,
      checked: [false, true],
    });
    await page.getByRole('radio', { name: 'Radio A', exact: true }).click();
    assert.equal((await log(page)).length, logLenAfterReset + 2);
    assert.deepEqual((await log(page)).at(-1), {
      phase: 'local radio',
      value: 'a',
      entries: a,
      checked: [true, false],
    });

    // Disabling or unmounting Radio A must leave Radio B operational and resettable.
    await button(page, 'Toggle disable radio A').click();
    await radioB.click();
    assert.deepEqual(await entries(form), b);
    await button(page, 'Toggle mount radio A').click();
    await resetForm(form);
    assert.deepEqual(await entries(form), [['other-radio', 'other']]);
    assert.equal(await radioB.isChecked(), false);
  },

  'mixed disabled+inert radio group rejects propose until unblocked and fieldset disabled preserves first legend':
    async ({ page, mount }) => {
      await mount('form-authority');
      const form = page.locator('#radios');
      await button(page, 'Use local radio').click();

      // Radio A disabled + Radio B inert -> whole group is blocked, propose('b') is ignored.
      await button(page, 'Toggle disable radio A').click();
      await button(page, 'Toggle inert radio B').click();
      await button(page, 'Propose radio B').click();
      assert.equal(
        (await entries(form)).find(([k]) => k === 'radio')?.[1],
        undefined,
        'disabled Radio A does not submit and inert Radio B was not checked',
      );
      assert.equal(
        await page.getByRole('radio', { name: 'Radio B', exact: true }).isChecked(),
        false,
      );

      // Unblocking Radio B (removing inert) lets propose('b') succeed even while Radio A stays disabled.
      await button(page, 'Toggle inert radio B').click();
      await button(page, 'Propose radio B').click();
      assert.equal(
        await page.getByRole('radio', { name: 'Radio B', exact: true }).isChecked(),
        true,
      );

      // Native <fieldset disabled> keeps its first <legend> control active and blocks body controls.
      await button(page, 'Propose legend input').click();
      await button(page, 'Propose fieldset body input').click();
      assert.equal(await page.getByTestId('legend-val').textContent(), 'legend-next');
      assert.equal(await page.getByTestId('fieldset-body-val').textContent(), 'body-init');
    },
  'native resets preserve controlled values, restore mount defaults, and leave DOM clean': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    const form = page.locator('#first');
    await button(page, 'Change local to B').click();
    await button(page, 'Change multi').click();
    await page.getByRole('checkbox', { name: 'Authority checkbox' }).uncheck();
    await button(page, 'Change defaults').click();
    await button(page, 'Set controlled C').click();
    const changed = [
      ['local', 'c'],
      ['controlled', 'c'],
      ['multi', 'c'],
    ];
    assert.deepEqual(await entries(form), changed);

    // Adjacent sibling selector / nextElementSibling must never be broken by injected observers.
    assert.equal(
      await page
        .getByRole('checkbox', { name: 'Authority checkbox' })
        .evaluate((node) => node.nextElementSibling?.getAttribute('data-testid')),
      'adjacent-indicator',
    );

    const cancelled = await form.evaluate(async (node) => {
      const synthetic = new Event('reset', { bubbles: false, cancelable: true });
      node.dispatchEvent(synthetic);
      node.dispatchEvent(synthetic);
      await Promise.resolve();
      const afterSynthetic = [...new FormData(node)];
      let elementsDuringReset = [];
      node.addEventListener(
        'reset',
        (event) => {
          elementsDuringReset = [...node.elements].map((el) => el.localName);
          event.preventDefault();
        },
        { once: true },
      );
      node.reset();
      await Promise.resolve();
      return { afterSynthetic, afterCancelled: [...new FormData(node)], elementsDuringReset };
    });
    assert.deepEqual(cancelled.afterSynthetic, changed);
    assert.deepEqual(cancelled.afterCancelled, changed);
    // Zero phantom marker/witness elements injected into form.elements during reset.
    assert.deepEqual(cancelled.elementsDuringReset, [
      'button',
      'select',
      'select',
      'select',
      'input',
    ]);

    // Cancelled user click on <button type="reset"> preserves state without leaving phantom nodes.
    await form.evaluate((node) => {
      node.addEventListener('reset', (event) => event.preventDefault(), { once: true });
    });
    await button(page, 'Reset first').click();
    assert.deepEqual(await entries(form), changed);

    const reset = [['local', 'a'], ['controlled', 'c'], ...initial.slice(2)];
    assert.deepEqual(
      await form.evaluate(async (node) => {
        node.addEventListener(
          'reset',
          (event) => {
            window.savedReset = event;
          },
          { once: true },
        );
        node.reset();
        const synchronous = [...new FormData(node)];
        await Promise.resolve();
        return [synchronous, [...new FormData(node)]];
      }),
      [reset, reset],
    );
    assert.equal(await page.getByTestId('local-value').textContent(), 'a');

    await button(page, 'Change local to B').click();
    const beforeReplay = [['local', 'c'], ...reset.slice(1)];
    assert.deepEqual(
      await form.evaluate(async (node) => {
        node.dispatchEvent(window.savedReset);
        await Promise.resolve();
        return [...new FormData(node)];
      }),
      beforeReplay,
    );
    await button(page, 'Reset first').click();
    assert.deepEqual(await entries(form), reset);
    await resetForm(form);
    assert.deepEqual(await entries(form), reset);

    // Re-toggling uncontrolled checkbox to its pre-reset unchecked state must still fire React onChange.
    assert.equal(await page.getByTestId('checked-value').textContent(), 'true');
    await page.getByRole('checkbox', { name: 'Authority checkbox' }).uncheck();
    assert.equal(await page.getByTestId('checked-value').textContent(), 'false');
    assert.deepEqual(await entries(form), reset.slice(0, -1));

    assert.deepEqual(
      (await log(page)).map(({ value }) => value),
      ['b', 'c', 'b', 'c'],
    );
  },
  'reset ownership follows reassociation, replacement, remount, and unmount': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    const first = page.locator('#first');
    const second = page.locator('#second');
    await first.evaluate((node) => {
      window.oldForm = node;
    });
    await button(page, 'Change local to B').click();
    await button(page, 'Replace first form').click();
    assert.equal(await first.evaluate((node) => node === window.oldForm), false);
    await page.evaluate(() => window.oldForm.reset());
    assert.deepEqual((await entries(first))[0], ['local', 'c']);
    await resetForm(first);
    assert.deepEqual(await entries(first), initial);

    await button(page, 'Change local to B').click();
    await button(page, 'Associate second').click();
    assert.deepEqual(await entries(first), []);
    await resetForm(first);
    assert.deepEqual((await entries(second))[0], ['local', 'c']);
    await button(page, 'Toggle association').click();
    await resetForm(second);
    assert.deepEqual(await entries(second), initial.slice(1));
    await button(page, 'Toggle association').click();
    assert.deepEqual((await entries(second))[0], ['local', 'c']);

    // Native association can change and immediately reset, before React runs.
    const local = page.locator('select[name=local]');
    assert.deepEqual(
      await local.evaluate(async (node) => {
        node.setAttribute('form', 'first');
        node.form.reset();
        await Promise.resolve();
        return [...new FormData(node.form)];
      }),
      [['local', 'a']],
    );
    await button(page, 'Change local to B').click();
    await local.evaluate((node) => node.setAttribute('form', 'second'));
    await resetForm(second);
    assert.deepEqual(await entries(second), initial);

    // Unmount and remount carrier, then verify reset resubscribes cleanly.
    await button(page, 'Toggle local mount').click();
    await resetForm(second);
    assert.deepEqual(await entries(second), initial.slice(1));
    await button(page, 'Toggle local mount').click();
    await button(page, 'Change local to B').click();
    assert.equal(await page.getByTestId('local-value').textContent(), 'c');
    await resetForm(second);
    assert.equal(await page.getByTestId('local-value').textContent(), 'a');
    assert.deepEqual(await entries(second), initial);
  },
  'a native reset completes after synchronous edits from reset listeners': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    const form = page.locator('#first');
    const edit = await button(page, 'Change local to B').elementHandle();
    const result = await form.evaluate(async (node, edit) => {
      node.dispatchEvent(new Event('reset'));
      node.addEventListener('reset', () => edit.click(), { once: true });
      node.reset();
      const synchronous = [...new FormData(node)];
      await Promise.resolve();
      return [synchronous, [...new FormData(node)]];
    }, edit);
    await edit.dispose();
    assert.deepEqual(result, [initial, initial]);
    assert.deepEqual(
      (await log(page)).map(({ value }) => value),
      ['b', 'c'],
    );
    assert.equal(await page.getByTestId('local-value').textContent(), 'a');
  },
  'a native reset follows a new owner even when a listener stops propagation or immediate propagation':
    async ({ page, mount }) => {
      for (const mode of ['capture-stop', 'bubble-stop', 'immediate-stop']) {
        await mount('form-authority');
        await button(page, 'Change local to B').click();
        const result = await page.locator('#second').evaluate(async (form, mode) => {
          const local = document.querySelector('select[name=local]');
          const target = mode === 'immediate-stop' ? form : form.parentElement;
          target.addEventListener(
            'reset',
            (event) => {
              local.setAttribute('form', 'second');
              if (mode === 'immediate-stop') {
                event.stopImmediatePropagation();
              } else {
                event.stopPropagation();
              }
            },
            { capture: mode === 'capture-stop', once: true },
          );
          form.reset();
          await Promise.resolve();
          return [...new FormData(form)];
        }, mode);
        assert.deepEqual(result, [['local', 'a']]);
        assert.equal(await page.getByTestId('local-value').textContent(), 'a');
      }

      // User click on <button type="reset"> with stopPropagation exercises the macrotask fallback.
      await mount('form-authority');
      await button(page, 'Change local to B').click();
      await page.locator('#first').evaluate((form) => {
        form.addEventListener('reset', (event) => event.stopPropagation(), { once: true });
      });
      await button(page, 'Reset first').click();
      await page.waitForFunction(
        () => document.querySelector('[data-testid="local-value"]')?.textContent === 'a',
      );
      assert.deepEqual(await entries(page.locator('#first')), initial);
    },
  'controlled live text input and textarea preserve caret position, reject cleanly, and fire onReset':
    async ({ page, mount }) => {
      await mount('form-authority');
      const input = page.getByRole('textbox', { name: 'Live controlled input' });
      const localInput = page.getByRole('textbox', { name: 'Local text input' });
      const area = page.getByRole('textbox', { name: 'Local textarea' });

      // Insert in the middle of a controlled input: caret must stay right after the typed character.
      await input.focus();
      await input.evaluate((node) => node.setSelectionRange(2, 2));
      await page.keyboard.type('XY');
      assert.equal(await input.inputValue(), 'heXYllo');
      assert.equal(await input.evaluate((node) => node.selectionStart), 4);
      assert.equal(await page.getByTestId('live-text-value').textContent(), 'heXYllo');

      // Rejecting controlled edits must receive the rejected candidate and restore DOM after commit.
      await button(page, 'Toggle accept live text').click();
      await input.focus();
      await assertFocused(input);
      await input.evaluate((node) => node.setSelectionRange(node.value.length, node.value.length));
      await page.keyboard.type('Z');
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="live-text-proposals"]')
            ?.textContent?.endsWith(',heXYlloZ') === true,
      );
      assert.equal(await input.inputValue(), 'heXYllo');
      assert.equal(await page.getByTestId('live-text-value').textContent(), 'heXYllo');

      // Uncontrolled input and textarea reset back to mount defaults and remain reactive to re-entering pre-reset values.
      await localInput.fill('draft text');
      await area.fill('draft notes');
      assert.equal(await page.getByTestId('local-text-value').textContent(), 'draft text');
      assert.equal(await page.getByTestId('local-area-value').textContent(), 'draft notes');
      await button(page, 'Reset live text').click();
      await page.waitForFunction(
        () => document.querySelector('[data-testid="live-reset-count"]')?.textContent === '3',
      );
      assert.equal(await input.inputValue(), 'heXYllo');
      assert.equal(await localInput.inputValue(), 'initial text');
      assert.equal(await page.getByTestId('local-text-value').textContent(), 'initial text');
      assert.equal(await area.inputValue(), 'initial notes');
      assert.equal(await page.getByTestId('local-area-value').textContent(), 'initial notes');

      await localInput.fill('draft text');
      await area.fill('draft notes');
      assert.equal(await page.getByTestId('local-text-value').textContent(), 'draft text');
      assert.equal(await page.getByTestId('local-area-value').textContent(), 'draft notes');
    },
  'Shadow DOM mounted forms support native reset and validation focus delegation': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    const host = page.locator('#shadow-reset-host');
    await host.locator('button', { hasText: 'Shadow choose B' }).click();
    assert.equal(await host.getByTestId('shadow-value').textContent(), 'b');
    await host.locator('button', { hasText: 'Shadow reset' }).click();
    await page.waitForFunction(
      () =>
        document
          .querySelector('#shadow-reset-host')
          ?.shadowRoot?.querySelector('[data-testid="shadow-value"]')?.textContent === 'a',
    );
    assert.equal(await host.getByTestId('shadow-value').textContent(), 'a');

    // Required validation inside Shadow DOM delegates focus to the shadow trigger.
    await host.locator('button', { hasText: 'Shadow clear' }).click();
    const valid = await host.evaluate((node) =>
      node.shadowRoot.querySelector('form').reportValidity(),
    );
    assert.equal(valid, false);
    assert.equal(
      await host.evaluate(
        (node) => node.shadowRoot.activeElement?.textContent === 'Shadow choose B',
      ),
      true,
    );
  },
  'native reset is immune to HTMLFormElement DOM clobbering in Chromium': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    await button(page, 'Change local to B').click();
    const form = page.locator('#first');
    const result = await form.evaluate(async (node) => {
      for (const name of [
        'nodeType',
        'parentNode',
        'parentElement',
        'append',
        'ownerDocument',
        'addEventListener',
        'removeEventListener',
        'elements',
      ]) {
        const clobber = document.createElement('input');
        clobber.name = name;
        Element.prototype.append.call(node, clobber);
      }
      HTMLFormElement.prototype.reset.call(node);
      await Promise.resolve();
      return new FormData(node).get('local');
    });
    assert.equal(result, 'a');
    assert.equal(await page.getByTestId('local-value').textContent(), 'a');
  },
  'native reset leaves ordinary forms outside the runtime alone': async ({ page, mount }) => {
    await mount('form-authority');
    const result = await page.evaluate(() => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.name = 'ordinary';
      input.defaultValue = 'mount';
      input.value = 'edited';
      form.append(input);
      document.body.append(form);
      let during;
      form.addEventListener('reset', () => {
        during = [...form.elements].map((element) => element.localName);
      });
      form.reset();
      return { during, after: [...new FormData(form)] };
    });
    assert.deepEqual(result, { during: ['input'], after: [['ordinary', 'mount']] });
  },
  'Node SSR carriers serialize before hydration and keep their nodes and authority': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('form-ssr');
    assert.equal(
      html.includes('style='),
      false,
      'Hidden SSR carriers must not rely on inline styles',
    );
    await mount('form-hydration');
    const root = page.getByTestId('ssr-root');
    const before = await root.evaluate((node, markup) => {
      node.innerHTML = markup;
      const form = node.querySelector('form');
      window.serverNodes = [...form.querySelectorAll('input,select,option,button')];
      return {
        id: form.id,
        trigger: form.querySelector('button').id,
        hydrated: form.hasAttribute('data-hydrated'),
        entries: [...new FormData(form)],
        selected: [...form.querySelectorAll('select')].map((select) =>
          [...select.selectedOptions].map((option) => option.value),
        ),
        checked: form.querySelector('input').checked,
      };
    }, html);
    const expected = [
      ['single', 'a'],
      ['multi', 'b'],
      ['multi', 'a'],
      ['checked', 'yes'],
      ['hydratedText', 'hello'],
    ];
    assert.deepEqual(before.entries, expected);
    assert.deepEqual(before.selected, [['a'], ['b', 'a'], ['']]);
    assert.equal(before.checked, true);
    assert.equal(before.hydrated, false);
    assert.equal(before.trigger, before.id + '-trigger');

    await button(page, 'Hydrate form').click();
    const form = page.getByTestId('hydrated-form');
    await page.locator('[data-hydrated]').waitFor();
    assert.deepEqual(await entries(form), expected);
    assert.equal(
      await form.evaluate((node) => {
        const current = [...node.querySelectorAll('input,select,option,button')];
        return (
          current.length === window.serverNodes.length &&
          current.every((element, index) => element === window.serverNodes[index])
        );
      }),
      true,
    );
    assert.equal(await form.getAttribute('id'), before.id);
    assert.equal(await form.getAttribute('data-changes'), '0');
    assert.equal(await page.getByTestId('hydration-errors').textContent(), '');

    // Programmatic update on SSR-hydrated controlled FormInput followed by reverting to initial SSR value
    // must still fire React onChange (dirty value flag & _valueTracker synced on hydration).
    const hydratedText = page.getByRole('textbox', { name: 'Hydrated controlled text' });
    await button(page, 'Set hydrated text world').click();
    assert.equal(await hydratedText.inputValue(), 'world');
    assert.equal(await page.getByTestId('hydrated-text-value').textContent(), 'world');
    await hydratedText.fill('hello');
    assert.equal(await page.getByTestId('hydrated-text-value').textContent(), 'hello');
    assert.equal(await hydratedText.inputValue(), 'hello');

    await button(page, 'Commit C').click();
    await button(page, 'Propose multi C').click();
    await button(page, 'Propose single B').click();
    await page.getByRole('checkbox', { name: 'Hydration check' }).uncheck();
    assert.deepEqual(await entries(form), [
      ['single', 'c'],
      ['multi', 'c'],
      ['empty', 'b'],
      ['hydratedText', 'hello'],
    ]);
    const settled = [['single', 'c'], ...expected.slice(1)];
    assert.deepEqual(
      await form.evaluate(async (node) => {
        node.reset();
        const synchronous = [...new FormData(node)];
        await Promise.resolve();
        return [synchronous, [...new FormData(node)]];
      }),
      [settled, settled],
    );
    assert.equal(await form.getAttribute('data-changes'), '3');
  },
};

import assert from 'node:assert/strict';
import { resetForm } from '../helpers.mjs';

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
  'native radio changes repair the whole group before a controlled callback': async ({
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
  },
  'native resets preserve controlled values and restore only mount defaults': async ({
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

    const cancelled = await form.evaluate(async (node) => {
      const synthetic = new Event('reset', { bubbles: false, cancelable: true });
      node.dispatchEvent(synthetic);
      node.dispatchEvent(synthetic);
      await Promise.resolve();
      const afterSynthetic = [...new FormData(node)];
      node.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      node.reset();
      return { afterSynthetic, afterCancelled: [...new FormData(node)] };
    });
    assert.deepEqual(cancelled, { afterSynthetic: changed, afterCancelled: changed });

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
    assert.deepEqual(
      (await log(page)).map(({ value }) => value),
      ['b', 'c', 'b', 'c'],
    );
  },
  'reset ownership follows reassociation, replacement, and unmount': async ({ page, mount }) => {
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

    // Native association can change and immediately reset, before React or an observer runs.
    const local = page.locator('select[name=local]');
    assert.deepEqual(
      await local.evaluate((node) => {
        node.setAttribute('form', 'first');
        node.form.reset();
        return [...new FormData(node.form)];
      }),
      [['local', 'a']],
    );
    await button(page, 'Change local to B').click();
    // Restore the DOM attribute imperatively as React still owns the second-form prop.
    await local.evaluate((node) => node.setAttribute('form', 'second'));
    await resetForm(second);
    assert.deepEqual(await entries(second), initial);
    await button(page, 'Toggle local mount').click();
    await resetForm(second);
    assert.deepEqual(await entries(second), initial.slice(1));
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
  'a native reset uses the owner that a reset listener assigns before the default action': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    await button(page, 'Change local to B').click();
    const second = page.locator('#second');
    assert.deepEqual(await entries(second), []);
    const result = await second.evaluate((form) => {
      const carrier = document.querySelector('select[name=local]');
      form.addEventListener('reset', () => carrier.setAttribute('form', 'second'), { once: true });
      form.reset();
      return { owned: carrier.form === form, entries: [...new FormData(form)] };
    });
    assert.deepEqual(result, { owned: true, entries: [['local', 'a']] });
    assert.equal(await page.getByTestId('local-value').textContent(), 'a');
  },
  'a native reset follows its new owner when a listener stops propagation': async ({
    page,
    mount,
  }) => {
    for (const capture of [true, false]) {
      await mount('form-authority');
      await button(page, 'Change local to B').click();
      const result = await page.locator('#second').evaluate((form, capture) => {
        const local = document.querySelector('select[name=local]');
        form.parentElement.addEventListener(
          'reset',
          (event) => {
            local.setAttribute('form', 'second');
            event.stopPropagation();
          },
          { capture, once: true },
        );
        form.reset();
        return [...new FormData(form)];
      }, capture);
      assert.deepEqual(result, [['local', 'a']]);
    }
  },
  'moving a mounted carrier subtree into Shadow DOM preserves synchronous native reset': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    await button(page, 'Change local to B').click();
    await button(page, 'Change multi').click();
    const result = await page.locator('#root').evaluate((root) => {
      const form = root.querySelector('#first');
      const carrier = root.querySelector('select[name=local]');
      const parent = document.createElement('div');
      document.body.append(parent);
      const shadow = parent.attachShadow({ mode: 'open' });
      shadow.append(root);
      form.reset();
      return { owner: carrier.form === form, entries: [...new FormData(form)] };
    });
    assert.deepEqual(result, { owner: true, entries: initial });
    assert.equal(await page.getByTestId('local-value').textContent(), 'a');
  },
  'a delayed native reset confirmation preserves edits made after its default action': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    const buttonB = button(page, 'Change local to B');
    await buttonB.click();
    await button(page, 'Change multi').click();
    const form = page.locator('#first');
    const edit = await buttonB.elementHandle();
    const result = await form.evaluate((node, edit) => {
      let delayed;
      node.addEventListener(
        'reset',
        () => {
          const witness = node.querySelector('unica-reset-witness');
          delayed = witness.confirmReset;
          witness.confirmReset = undefined;
        },
        { once: true },
      );
      node.reset();
      edit.click();
      node.addEventListener(
        'reset',
        (event) => {
          delayed();
          event.preventDefault();
        },
        { once: true },
      );
      node.reset();
      return [...new FormData(node)];
    }, edit);
    await edit.dispose();
    assert.deepEqual(result, [['local', 'c'], ...initial.slice(1)]);
    assert.equal(await page.getByTestId('local-value').textContent(), 'c');
  },
  'a delayed reset cannot restore a control acquired after the native action': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    await button(page, 'Change local to B').click();
    const result = await page.locator('#second').evaluate((form) => {
      const local = document.querySelector('select[name=local]');
      document.querySelector('select[name=controlled]').setAttribute('form', 'second');
      let delayed;
      form.addEventListener(
        'reset',
        () => {
          const witness = form.querySelector('unica-reset-witness');
          delayed = witness.confirmReset;
          witness.confirmReset = undefined;
        },
        { once: true },
      );
      form.reset();
      local.setAttribute('form', 'second');
      delayed();
      return [...new FormData(form)];
    });
    assert.deepEqual(result, [
      ['local', 'c'],
      ['controlled', 'a'],
    ]);
  },
  'a commit under a different form protects the value from an older reset after reassociation':
    async ({ page, mount }) => {
      await mount('form-authority');
      await button(page, 'Change local to B').click();
      const result = await page.locator('#first').evaluate((form) => {
        const local = document.querySelector('select[name=local]');
        let delayed;
        form.addEventListener(
          'reset',
          () => {
            const witness = form.querySelector('unica-reset-witness');
            delayed = witness.confirmReset;
            witness.confirmReset = undefined;
          },
          { once: true },
        );
        form.reset();
        local.setAttribute('form', 'second');
        local.value = 'd';
        local.dispatchEvent(new Event('change', { bubbles: true }));
        const edited = new FormData(local.form).get('local');
        local.setAttribute('form', 'first');
        delayed();
        return [edited, new FormData(form).get('local')];
      });
      assert.deepEqual(result, ['d', 'd']);
    },
  'native reset works after a mounted form subtree is attached to a detached fragment': async ({
    page,
    mount,
  }) => {
    await mount('form-authority');
    await button(page, 'Use local radio').click();
    await page.getByRole('radio', { name: 'Radio B', exact: true }).click();
    const result = await page.locator('#root').evaluate((root) => {
      const form = root.querySelector('#radios');
      const before = new FormData(form).get('radio');
      root.remove();
      document.createDocumentFragment().append(root);
      form.reset();
      return [before, new FormData(form).get('radio')];
    });
    assert.deepEqual(result, ['b', 'a']);
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

    await button(page, 'Commit C').click();
    await button(page, 'Propose multi C').click();
    await button(page, 'Propose single B').click();
    await page.getByRole('checkbox', { name: 'Hydration check' }).uncheck();
    assert.deepEqual(await entries(form), [
      ['single', 'c'],
      ['multi', 'c'],
      ['empty', 'b'],
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

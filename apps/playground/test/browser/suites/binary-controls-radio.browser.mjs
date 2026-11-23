import assert from 'node:assert/strict';
import { assertFocused, pressKeys, resetForm } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const radio = (page, name) => page.getByRole('radio', { name, exact: true });
const form = (page, name) => page.getByRole('form', { name, exact: true });
const entries = (formNode) => formNode.evaluate((element) => [...new FormData(element)]);
const validity = (formNode) => formNode.evaluate((element) => element.checkValidity());
const log = async (page, id) => JSON.parse((await page.getByTestId(id).textContent()) || '[]');

const waitForFocus = (page, option) =>
  option.and(page.locator(':focus')).waitFor({ state: 'attached' });

async function waitForChanges(page, id, count) {
  await page.waitForFunction(
    ({ id, count }) =>
      JSON.parse(document.querySelector(`[data-testid="${id}"]`)?.textContent ?? '[]').length ===
      count,
    { id, count },
  );
}

export default {
  'RadioGroup keeps a disabled selection and supports both Tab directions without a change':
    async ({ page, mount }) => {
      await mount('binary-controls-radio');
      const owner = form(page, 'Disabled selected radio form');
      const before = button(page, 'Before radio group');
      const after = button(page, 'After radio group');
      const original = radio(page, 'Original selection');
      const replacement = radio(page, 'Available replacement');
      const changes = page.getByTestId('entry-changes');

      await before.focus();
      await pressKeys(page, 'Tab');
      await assertFocused(original);
      assert.equal(await validity(owner), true);
      assert.deepEqual(await entries(owner), [['selected', 'a']]);
      await button(page, 'Disable original selection').click();
      assert.equal(await original.isChecked(), true);
      assert.equal(await original.isDisabled(), true);
      assert.equal(await validity(owner), false);
      assert.deepEqual(await entries(owner), []);

      await before.focus();
      await pressKeys(page, 'Tab');
      await assertFocused(replacement);
      await pressKeys(page, 'Tab');
      await assertFocused(after);
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(replacement);
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(before);
      assert.equal(await original.isChecked(), true);
      assert.equal(await replacement.isChecked(), false);
      assert.equal(await changes.textContent(), '0');

      await pressKeys(page, 'Tab', 'Space');
      await assertFocused(replacement);
      assert.equal(await original.isChecked(), false);
      assert.equal(await replacement.isChecked(), true);
      assert.equal(await validity(owner), true);
      assert.deepEqual(await entries(owner), [['selected', '']]);
      assert.equal(await changes.textContent(), '1');
      await pressKeys(page, 'Space', 'Enter');
      assert.equal(await changes.textContent(), '1');
      assert.deepEqual(await entries(owner), [['selected', '']]);
    },

  'RadioGroup horizontal arrows preserve native ordering in LTR and RTL': async ({
    page,
    mount,
  }) => {
    for (const direction of ['ltr', 'rtl']) {
      await mount('binary-controls-radio', { direction });
      const native = form(page, 'Native radio direction');
      const unica = form(page, 'Unica radio direction');
      for (const key of ['ArrowRight', 'ArrowLeft']) {
        await radio(page, 'Native middle').press(key);
        const nativeActive = await native.locator('input:checked').inputValue();
        await radio(page, 'Unica middle').press(key);
        const expected = radio(page, `Unica ${nativeActive}`);
        await waitForFocus(page, expected);
        assert.deepEqual(await entries(unica), await entries(native), `${direction} ${key}`);
        const unicaChecked = unica.locator('input:checked');
        assert.equal(await unicaChecked.inputValue(), nativeActive);
        await assertFocused(unicaChecked);
        await resetForm(native);
        await resetForm(unica);
        assert.deepEqual(await entries(unica), [['choice', 'middle']]);
      }
    }
  },

  'RadioGroup restores all peers on controlled refusal and keeps focus movement independent':
    async ({ page, mount }) => {
      await mount('binary-controls-radio');
      const owner = form(page, 'Controlled radio group form');
      const a = radio(page, 'Controlled Radio A');
      const c = radio(page, 'Controlled Radio C');
      const d = radio(page, 'Controlled Radio D');
      const original = {
        candidate: 'c',
        checked: [true, false, false, false],
        entries: [['controlled', 'a']],
      };

      await a.evaluate((input) => {
        function veto(event) {
          if (event.key === 'ArrowDown' && event.target === input) {
            event.preventDefault();
            input.ownerDocument.removeEventListener('keydown', veto);
          }
        }
        input.ownerDocument.addEventListener('keydown', veto);
      });
      await a.press('ArrowDown');
      await assertFocused(a);
      assert.deepEqual(await log(page, 'radio-group-log'), []);
      assert.deepEqual(await entries(owner), [['controlled', 'a']]);

      await a.press('ArrowDown');
      await waitForChanges(page, 'radio-group-log', 2);
      await assertFocused(c);
      assert.equal(await a.isChecked(), true);
      assert.equal(await c.isChecked(), false);
      assert.deepEqual(await log(page, 'radio-group-log'), [
        { phase: 'proposed', ...original },
        { phase: 'after owner', ...original },
      ]);

      await button(page, 'Accept radio proposal').click();
      await a.press('ArrowDown');
      await waitForChanges(page, 'radio-group-log', 4);
      assert.equal(await c.isChecked(), true);
      await assertFocused(c);
      assert.deepEqual((await log(page, 'radio-group-log')).slice(2), [
        { phase: 'proposed', ...original },
        {
          phase: 'after owner',
          candidate: 'c',
          checked: [false, false, true, false],
          entries: [['controlled', 'c']],
        },
      ]);

      await c.press('End');
      await waitForFocus(page, d);
      assert.deepEqual(await entries(owner), [['controlled', 'd']]);
      await pressKeys(page, 'ArrowDown');
      await waitForFocus(page, a);
      assert.deepEqual(await entries(owner), [['controlled', 'a']]);
      await pressKeys(page, 'ArrowUp');
      await waitForFocus(page, d);
      await pressKeys(page, 'Home');
      await waitForFocus(page, a);
      await pressKeys(page, 'Control+ArrowDown');
      await assertFocused(a);
      const count = (await log(page, 'radio-group-log')).length;
      await button(page, 'Lock controlled radio group').click();
      await d.press('Space');
      await pressKeys(page, 'Home', 'End', 'ArrowUp', 'Shift+ArrowRight', 'Shift+ArrowDown');
      await assertFocused(d);
      assert.deepEqual(await entries(owner), [['controlled', 'a']]);
      assert.equal((await log(page, 'radio-group-log')).length, count);
    },

  'A radio moved outside its group cannot clear a same-name selection in another form': async ({
    page,
    mount,
  }) => {
    await mount('binary-controls-radio');
    const source = form(page, 'Source radio owner');
    const destination = form(page, 'Destination radio owner');
    const moved = radio(page, 'Source A');
    const retained = radio(page, 'Destination B');
    assert.deepEqual(await entries(source), [['collision', 'a']]);
    assert.deepEqual(await entries(destination), [['collision', 'b']]);
    await moved.evaluate((node) => node.setAttribute('form', 'radio-destination'));
    await page.waitForFunction(() => {
      const sourceInput = document.querySelector('#radio-source input');
      const destinationInput = document.querySelector('#radio-destination input');
      return sourceInput?.matches(':disabled') && destinationInput?.checked;
    });
    assert.equal(await retained.isChecked(), true);
    assert.equal(await destination.evaluate((node) => node.checkValidity()), true);
    assert.deepEqual(await entries(destination), [['collision', 'b']]);
    assert.deepEqual(await entries(source), []);
    await moved.evaluate((node) => node.removeAttribute('form'));
    assert.deepEqual(await entries(source), [['collision', 'a']]);
    assert.deepEqual(await entries(destination), [['collision', 'b']]);

    const standalone = form(page, 'Standalone destination');
    await moved.evaluate((node) => node.setAttribute('form', 'radio-standalone'));
    await page.waitForFunction(() => document.querySelector('#radio-source input')?.name === '');
    assert.deepEqual(await entries(standalone), [['collision', 'standalone']]);
    assert.deepEqual(await entries(source), []);

    const optional = form(page, 'Optional destination');
    const required = radio(page, 'Required option');
    assert.equal(await optional.evaluate((node) => node.checkValidity()), true);
    await required.evaluate((node) => node.setAttribute('form', 'radio-optional'));
    await page.waitForFunction(() => {
      const input = document.querySelector('form[aria-label="Unanswered required group"] input');
      return input?.disabled && input.name === '';
    });
    assert.equal(await optional.evaluate((node) => node.checkValidity()), true);
    assert.equal(
      await radio(page, 'Optional option').evaluate((node) => node.validity.valueMissing),
      false,
    );
  },

  'Standalone native Radio peers repair whole-group refusal, acceptance and reset within an owner':
    async ({ page, mount }) => {
      await mount('binary-controls-radio');
      const primary = form(page, 'Standalone radios');
      const other = form(page, 'Other standalone owner');
      const local = form(page, 'Uncontrolled peers');
      const a = radio(page, 'Standalone A');
      const b = radio(page, 'Standalone B');
      const localA = radio(page, 'Local peer A');
      const localB = radio(page, 'Local peer B');
      const logId = 'standalone-radio-log';

      await b.press('Space');
      await waitForChanges(page, logId, 1);
      assert.equal(await a.isChecked(), true);
      assert.equal(await b.isChecked(), false);
      assert.deepEqual(await entries(other), [['peer', 'owned elsewhere']]);
      assert.deepEqual(await log(page, logId), [
        { phase: 'proposed', candidate: 'b', checked: [true, false], entries: [['peer', 'a']] },
      ]);

      await button(page, 'Accept standalone proposal').click();
      await b.press('Space');
      await waitForChanges(page, logId, 2);
      assert.deepEqual(await entries(primary), [['peer', 'b']]);
      await resetForm(primary);
      assert.equal(await b.isChecked(), true);
      assert.equal((await log(page, logId)).length, 2);
      await a.press('Space');
      await waitForChanges(page, logId, 3);
      assert.deepEqual(await entries(primary), [['peer', 'a']]);
      assert.equal((await log(page, logId)).length, 3);

      await localB.press('Space');
      await localB.and(page.locator(':checked')).waitFor({ state: 'attached' });
      assert.deepEqual(await entries(local), [['peer', 'b']]);
      assert.equal(await localA.isChecked(), false);
      await button(page, 'Reset local peers').click();
      assert.deepEqual(await entries(local), [['peer', 'a']]);
      await localB.press('Space');
      await localB.and(page.locator(':checked')).waitFor({ state: 'attached' });
      await localA.press('Space');
      await localA.and(page.locator(':checked')).waitFor({ state: 'attached' });
      assert.deepEqual(await entries(local), [['peer', 'a']]);
      assert.deepEqual(await entries(other), [['peer', 'owned elsewhere']]);

      await radio(page, 'Local alternative').press('Space');
      assert.deepEqual(await log(page, 'pinned-radio-log'), {
        phase: 'delegated',
        candidate: 'b',
        checked: [true, false],
        entries: [['pinned', 'a']],
      });
    },

  'RadioGroup generated names isolate omitted and empty name groups and submit empty option keys':
    async ({ page, mount }) => {
      await mount('binary-controls-radio');
      const owner = form(page, 'Generated radio names');
      const omitted = radio(page, 'Omitted B');
      const empty = radio(page, 'Empty A');
      const omittedName = await omitted.getAttribute('name');
      const emptyName = await empty.getAttribute('name');

      assert.ok(omittedName);
      assert.ok(emptyName);
      assert.notEqual(omittedName, emptyName);
      assert.deepEqual(await entries(owner), []);
      await omitted.press('Space');
      await empty.press('Space');
      assert.equal(await radio(page, 'Omitted A').isChecked(), false);
      assert.equal(await omitted.isChecked(), true);
      assert.equal(await empty.isChecked(), true);
      assert.deepEqual(await entries(owner), [
        [omittedName, 'b'],
        [emptyName, ''],
      ]);
      await pressKeys(page, 'ArrowDown');
      assert.deepEqual(await entries(owner), [
        [omittedName, 'b'],
        [emptyName, 'b'],
      ]);
    },

  'Standalone Radio respects native peer selection after regrouping and unrelated React renders':
    async ({ page, mount }) => {
      await mount('binary-controls-radio');
      const owner = form(page, 'Reassociated standalone radios');
      const first = radio(page, 'Reassociated first');
      const second = radio(page, 'Reassociated second');

      assert.deepEqual(await entries(owner), [
        ['primary', 'first'],
        ['secondary', 'second'],
      ]);
      await button(page, 'Merge standalone peers').click();
      const joined = await entries(owner);
      assert.equal(joined.length, 1);
      assert.equal(joined[0][0], 'primary');
      assert.ok(['first', 'second'].includes(joined[0][1]));
      await first.press('Space');
      assert.deepEqual(await entries(owner), [['primary', 'first']]);
      await second.press('Space');
      assert.deepEqual(await entries(owner), [['primary', 'second']]);

      await radio(page, 'Plain native peer').press('Space');
      assert.deepEqual(await entries(owner), [['primary', 'native']]);
      await button(page, 'Rerender peer form 0').click();
      assert.deepEqual(await entries(owner), [['primary', 'native']]);
      await second.press('Space');
      assert.deepEqual(await entries(owner), [['primary', 'second']]);

      await first.press('Space');
      const changes = page.getByTestId('reassociated-first-changes');
      const beforeReset = Number(await changes.textContent());
      await resetForm(owner);
      assert.deepEqual(await entries(owner), [['primary', 'second']]);
      assert.equal(Number(await changes.textContent()), beforeReset);
      await first.press('Space');
      assert.deepEqual(await entries(owner), [['primary', 'first']]);
      assert.equal(Number(await changes.textContent()), beforeReset + 1);
    },
};

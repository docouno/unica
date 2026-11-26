import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

const fixture = (page) => page.getByTestId('fixture');
const editor = (page) => page.getByRole('spinbutton', { name: 'Quantity', exact: true });
const shell = (input) =>
  input.locator(
    'xpath=ancestor::span[contains(@class, "unica-number-input ") or @class="unica-number-input"]',
  );
const increase = (page) => shell(editor(page)).getByRole('button', { name: 'Increase value' });
const decrease = (page) => shell(editor(page)).getByRole('button', { name: 'Decrease value' });
const configure = (page, settings) =>
  fixture(page).evaluate(
    (node, detail) => node.dispatchEvent(new CustomEvent('number-settings', { detail })),
    settings,
  );
const clearLog = (page) =>
  fixture(page).evaluate((node) => node.dispatchEvent(new Event('clear-events')));
const log = async (page) => JSON.parse((await fixture(page).getAttribute('data-events')) ?? '[]');

async function snapshot(input, reset = false) {
  return input.evaluate((node, reset) => {
    if (reset) {
      node.form.reset();
    }
    const { badInput, valueMissing, rangeOverflow, rangeUnderflow, stepMismatch } = node.validity;
    return {
      value: node.value,
      numeric: node.value === '' ? null : node.valueAsNumber,
      entry: new FormData(node.form).get(node.name),
      badInput,
      valueMissing,
      rangeOverflow,
      rangeUnderflow,
      stepMismatch,
    };
  }, reset);
}

async function expectValue(input, result) {
  const actual = await snapshot(input);
  assert.equal(actual.value, result);
  assert.equal(actual.entry, result);
}

async function beginPress(page, action) {
  const box = await action.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
}

async function expectProposal(page, next, expectedValue) {
  const entries = await log(page);
  assert.deepEqual(
    entries.map(([kind]) => kind),
    ['dom.input', 'react.input', 'react.change', 'value', 'dom.change'],
  );
  for (const [, value, badInput, payload] of entries) {
    assert.equal(Number(value), expectedValue);
    assert.equal(badInput, false);
    assert.equal(value, payload);
  }
  assert.equal(entries[3][4], next);
}

export default {
  'NumberInput keeps invalid drafts on blur and Enter, then steps to the reachable edge': async ({
    page,
    mount,
  }) => {
    await mount('number-input');
    const input = editor(page);
    await configure(page, { defaultValue: 10, min: 0, max: 50, step: 5 });
    await input.fill('125');
    await input.press('Tab');
    const overflow = await snapshot(input);
    assert.equal(overflow.entry, '125');
    assert.equal(overflow.rangeOverflow, true);
    assert.equal(await increase(page).isDisabled(), true);
    assert.equal(await decrease(page).isEnabled(), true);
    await input.press('Enter');
    await expectValue(input, '125');
    assert.equal(await page.locator('#local').getAttribute('data-submitted'), null);

    await clearLog(page);
    await input.press('ArrowDown');
    await expectProposal(page, 50, 50);
    await expectValue(input, '50');
    await input.press('Enter');
    assert.equal(await page.locator('#local').getAttribute('data-submitted'), '50');

    await configure(page, { min: 0, max: 12, step: 5 });
    await input.fill('12');
    assert.equal((await snapshot(input)).stepMismatch, true);
    assert.equal(await increase(page).isDisabled(), true);
    await decrease(page).click();
    await expectValue(input, '10');

    await configure(page, { min: 0, max: 50 });
    await input.fill('-5');
    assert.equal((await snapshot(input)).rangeUnderflow, true);
    assert.equal(await decrease(page).isDisabled(), true);
    await increase(page).click();
    await expectValue(input, '0');
  },

  'NumberInput distinguishes empty, zero and badInput even when React skips onChange': async ({
    page,
    mount,
  }) => {
    await mount('number-input');
    for (const [version, response, accepted] of [
      [1, undefined, ''],
      [2, 'accept', ''],
      [3, 'refuse', '12'],
    ]) {
      await configure(page, {
        version,
        defaultValue: 12,
        ...(response && { value: 12, response }),
        required: true,
      });
      const input = editor(page);
      await clearLog(page);
      await input.press('ControlOrMeta+a');
      await input.press('-');
      const bad = await snapshot(input);
      assert.equal(bad.entry, '');
      assert.equal(bad.badInput, true);
      assert.equal(await decrease(page).isDisabled(), true);
      assert.equal(await increase(page).isDisabled(), true);
      await input.press('ArrowUp');
      assert.equal((await snapshot(input)).badInput, true);
      assert.equal(
        (await log(page)).some(([kind]) => kind === 'value'),
        false,
      );
      await input.press('Backspace');
      const empty = await snapshot(input);
      assert.equal(empty.value, accepted);
      assert.equal(empty.entry, accepted);
      assert.equal(empty.badInput, false);
      assert.equal(empty.valueMissing, accepted === '');
      const keyEvents = (await log(page)).filter(([kind]) => kind !== 'dom.change');
      assert.deepEqual(
        keyEvents.map(([kind]) => kind),
        ['dom.input', 'react.input', 'react.change', 'dom.input', 'react.input', 'value'],
      );
      assert.deepEqual(keyEvents.at(-1), ['value', '', false, '', '']);
    }
    await configure(page, { version: 4, defaultValue: '', min: 0 });
    const input = editor(page);
    await expectValue(input, '');
    await decrease(page).click();
    await expectValue(input, '0');
    assert.equal(await decrease(page).isDisabled(), true);
    assert.equal((await snapshot(input, true)).entry, '');
  },

  'NumberInput decimal steps match native validation, baselines and exact payloads': async ({
    page,
    mount,
  }) => {
    await mount('number-input');
    const input = editor(page);
    await configure(page, { version: 1, min: 0, defaultValue: 0.2, step: 0.1 });
    await input.press('ArrowUp');
    await expectValue(input, '0.3');
    assert.equal((await snapshot(input)).stepMismatch, false);
    await input.press('ArrowDown');
    await expectValue(input, '0.2');

    await configure(page, { version: 2, min: 0, defaultValue: 2e-11, step: 1e-11 });
    await input.press('ArrowUp');
    assert.equal((await snapshot(input)).numeric, 3e-11);
    assert.equal((await snapshot(input)).stepMismatch, false);
    await input.press('ArrowDown');
    assert.equal((await snapshot(input)).numeric, 2e-11);

    await configure(page, { version: 3, defaultValue: 2, step: 5 });
    await input.fill('5');
    assert.equal((await snapshot(input)).stepMismatch, true);
    await input.press('ArrowUp');
    await expectValue(input, '7');
    assert.equal((await snapshot(input)).stepMismatch, false);
    assert.equal((await snapshot(input, true)).entry, '2');

    await configure(page, { version: 4, value: 2, step: 5, response: 'accept' });
    await input.fill('5');
    await expectValue(input, '5');
    assert.equal(await input.getAttribute('value'), '5');
    assert.equal((await snapshot(input)).stepMismatch, false);
    await input.press('ArrowUp');
    assert.equal((await snapshot(input, true)).entry, '10');

    await configure(page, { version: 5, min: 0, value: 9007199254740992, response: 'refuse' });
    await clearLog(page);
    await input.fill('9007199254740993');
    await input.press('Tab');
    await expectValue(input, '9007199254740993');
    assert.equal((await snapshot(input)).numeric, 9007199254740992);
    assert.equal(
      (await log(page)).some(([kind]) => kind === 'value'),
      false,
    );
    assert.equal(await increase(page).isDisabled(), true);
    await decrease(page).click();
    await expectValue(input, '9007199254740992');
    assert.equal((await log(page)).find(([kind]) => kind === 'value')[4], 9007199254740991);

    await configure(page, { version: 6, value: 0, step: 'any', response: 'accept' });
    await input.fill('1e-999');
    await expectValue(input, '1e-999');
    assert.equal((await snapshot(input)).numeric, 0);
    assert.equal((await snapshot(input, true)).entry, '0');
    await input.fill('0.25');
    await increase(page).click();
    await expectValue(input, '1.25');
  },

  'NumberInput controlled refusal, acceptance and transformation govern the next step': async ({
    page,
    mount,
  }) => {
    await mount('number-input');
    const input = editor(page);
    const increment = increase(page);
    for (const [version, response, accepted] of [
      [1, 'refuse', '10'],
      [2, 'accept', '11'],
      [3, 'transform', '42'],
    ]) {
      await configure(page, { version, value: 10, min: 0, response });
      await clearLog(page);
      await increment.click();
      await expectProposal(page, 11, 11);
      await expectValue(input, accepted);
      assert.equal((await snapshot(input, true)).entry, accepted);
    }
    await configure(page, { version: 4, value: 10, response: 'refuse' });
    await input.fill('15');
    await expectValue(input, '10');
    await configure(page, { version: 4, value: 15, response: 'refuse' });
    await expectValue(input, '15');
    await input.press('ControlOrMeta+a');
    await input.press('-');
    assert.equal((await snapshot(input)).badInput, true);
    await configure(page, { version: 4, value: 42, response: 'refuse' });
    await expectValue(input, '42');
  },

  'NumberInput retains the uncontrolled mount default after its owner releases the value': async ({
    page,
    mount,
  }) => {
    await mount('number-input');
    const input = editor(page);
    await configure(page, { version: 1, value: 10, defaultValue: 3, response: 'accept' });
    await input.press('Tab');
    await configure(page, { version: 1, value: 3, defaultValue: 3 });
    await configure(page, { version: 1, defaultValue: 3 });
    await configure(page, { version: 1, defaultValue: 3, loading: true });
    await input.fill('23');
    assert.equal(await input.getAttribute('value'), '3');
    assert.equal((await snapshot(input, true)).entry, '3');
  },

  'NumberInput uses the current form owner, reset baseline and disabled fieldset semantics':
    async ({ page, mount }) => {
      await mount('number-input');
      const input = editor(page);
      await configure(page, { defaultValue: 10, form: 'other', loading: true, danger: true });
      await input.fill('23');
      await page.locator('#local').evaluate((form) => form.reset());
      await expectValue(input, '23');
      await input.evaluate((node) => {
        node.form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
        node.form.reset();
      });
      await expectValue(input, '23');
      await input.evaluate((node) =>
        node.form.dispatchEvent(new Event('reset', { bubbles: true })),
      );
      await expectValue(input, '23');
      await configure(page, {
        defaultValue: 99,
        form: 'other',
        fieldset: true,
        loading: true,
        danger: true,
      });
      assert.equal((await snapshot(input)).entry, null);
      assert.equal(await input.getAttribute('aria-busy'), null);
      assert.equal(await input.getAttribute('aria-invalid'), null);
      assert.equal(await shell(input).locator('.unica-number-input-feedback').count(), 0);
      assert.equal(await increase(page).isDisabled(), true);
      const legend = page.getByRole('spinbutton', { name: 'Legend value' });
      assert.equal(await legend.isEnabled(), true);
      await legend.press('ArrowUp');
      assert.equal(await legend.inputValue(), '4');

      await configure(page, { defaultValue: 99, form: 'other' });
      await input.focus();
      await clearLog(page);
      const immediate = await input.evaluate((node) => {
        node.form.reset();
        const reset = node.value;
        node.select();
        node.ownerDocument.execCommand('insertText', false, '23');
        return reset;
      });
      assert.equal(immediate, '10');
      await expectValue(input, '23');
      assert.deepEqual(
        (await log(page)).filter(([kind]) => kind === 'value').map((entry) => entry[4]),
        [23],
      );

      await configure(page, {
        defaultValue: 99,
        form: 'other',
        readOnly: true,
        loading: true,
        danger: true,
      });
      assert.equal(await input.getAttribute('aria-busy'), 'true');
      assert.equal(await input.getAttribute('aria-invalid'), 'true');
      assert.equal(await increase(page).isDisabled(), true);
      await input.press('ArrowUp');
      await expectValue(input, '23');
      assert.equal((await snapshot(input, true)).entry, '10');

      await configure(page, { defaultValue: 99, form: 'other' });
      await input.fill('23');
      const moveDuringReset = await input.evaluate((node) => {
        const host = node.closest('[data-testid="fixture"]');
        const updateOwner = (form) =>
          host.dispatchEvent(new CustomEvent('number-settings', { detail: { form } }));
        node.form.addEventListener('reset', () => updateOwner(undefined), { once: true });
        node.form.reset();
        const during = [node.form.id, node.value];
        updateOwner('other');
        return [during, [node.form.id, node.value]];
      });
      assert.deepEqual(moveDuringReset, [
        ['local', '23'],
        ['other', '23'],
      ]);
      await expectValue(input, '23');
      assert.equal((await snapshot(input, true)).entry, '10');

      for (const [action, draft, expectedProposals] of [
        ['move', '023', []],
        ['move', '010', [10]],
        ['move', '10', [10]],
        ['help', '023', [23]],
        ['help', '010', []],
        ['same-id', '023', [23]],
      ]) {
        await input.fill('23');
        await clearLog(page);
        await input.evaluate(
          (node, { action, draft }) => {
            const form = node.form;
            form.addEventListener(
              'reset',
              () => {
                if (action === 'move') {
                  form.id = 'temporary-owner';
                } else if (action === 'same-id') {
                  form.setAttribute('id', 'other');
                } else {
                  node.ownerDocument.querySelector('#quantity-help').append(' Updated.');
                }
              },
              { once: true },
            );
            form.reset();
            if (action === 'move') {
              form.id = 'other';
            }
            node.select();
            node.ownerDocument.execCommand('insertText', false, draft);
          },
          { action, draft },
        );
        await expectValue(input, draft);
        assert.deepEqual(
          (await log(page)).filter(([kind]) => kind === 'value').map((entry) => entry[4]),
          expectedProposals,
        );
      }
      assert.equal((await snapshot(input, true)).entry, '10');

      await configure(page, { defaultValue: 99, inert: true });
      await input.evaluate((node) =>
        node.parentElement.parentElement.parentElement.querySelector('button:last-child').click(),
      );
      await expectValue(input, '10');
      await configure(page, { defaultValue: 99, loading: true });
      assert.equal(await increase(page).isEnabled(), true);
      await increase(page).click();
      await expectValue(input, '11');
    },

  'NumberInput suppresses IME preedit and delivers either composition completion order once':
    async ({ page, mount }) => {
      await mount('number-input');
      await configure(page, { version: 1, value: '', response: 'accept', min: 0 });
      const input = editor(page);
      const cdp = await page.context().newCDPSession(page);
      await input.focus();
      await cdp.send('Input.imeSetComposition', { text: '2', selectionStart: 1, selectionEnd: 1 });
      await expectValue(input, '2');
      await cdp.send('Input.imeSetComposition', { text: '25', selectionStart: 2, selectionEnd: 2 });
      await expectValue(input, '25');
      assert.equal(
        (await log(page)).some(([kind]) => kind === 'value'),
        false,
      );
      await cdp.send('Input.insertText', { text: '25' });
      await input.evaluate(
        (node) => new Promise((resolve) => node.ownerDocument.defaultView.setTimeout(resolve, 30)),
      );
      await expectValue(input, '25');
      assert.deepEqual(
        (await log(page)).filter(([kind]) => kind === 'value'),
        [['value', '25', false, '25', 25]],
      );

      await configure(page, { version: 2, value: '', response: 'accept' });
      await clearLog(page);
      await input.focus();
      await input.evaluate((node) => {
        const compose = (type) => node.dispatchEvent(new CompositionEvent(type, { bubbles: true }));
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        const enter = (value, isComposing) => {
          setValue.call(node, value);
          node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing }));
        };
        compose('compositionstart');
        enter('3', true);
        compose('compositionend');
        enter('37', false);
      });
      await input.evaluate(
        (node) => new Promise((resolve) => node.ownerDocument.defaultView.setTimeout(resolve, 30)),
      );
      await expectValue(input, '37');
      assert.deepEqual(
        (await log(page)).filter(([kind]) => kind === 'value').map((entry) => entry[4]),
        [37],
      );

      await configure(page, { version: 3, value: '', response: 'accept' });
      await clearLog(page);
      await input.focus();
      await cdp.send('Input.imeSetComposition', { text: '8', selectionStart: 1, selectionEnd: 1 });
      assert.equal((await snapshot(input, true)).entry, '');
      await cdp.send('Input.imeSetComposition', { text: '', selectionStart: 0, selectionEnd: 0 });
      await expectValue(input, '');
      assert.equal(
        (await log(page)).some(([kind]) => kind === 'value'),
        false,
      );
      await input.press('4');
      await expectValue(input, '4');
      assert.deepEqual(
        (await log(page)).filter(([kind]) => kind === 'value').map((entry) => entry[4]),
        [4],
      );

      await configure(page, { version: 4, value: 10, response: 'accept' });
      await input.press('End');
      await cdp.send('Input.imeSetComposition', { text: '8', selectionStart: 1, selectionEnd: 1 });
      await expectValue(input, '108');
      await configure(page, { version: 4, value: 42, response: 'accept' });
      await expectValue(input, '108');
      assert.equal((await snapshot(input, true)).entry, '42');
    },

  'NumberInput keeps one Tab stop, honors cancellation and lets a wheel scroll the focused editor':
    async ({ page, mount }) => {
      await mount('number-input', { direction: 'rtl', surface: 'overlay', theme: 'frost-dark' });
      const input = editor(page);
      await page.locator('#previous').focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await assertFocused(input);
      assert.equal(
        await shell(input).evaluate((node) => getComputedStyle(node).outlineWidth),
        '2px',
      );
      await page.keyboard.press('Tab');
      await assertFocused(page.locator('#after'));
      await input.click();
      assert.equal(
        await shell(input).evaluate((node) => getComputedStyle(node).outlineStyle),
        'none',
      );
      await input.press('ArrowLeft');
      assert.equal(
        await shell(input).evaluate((node) => getComputedStyle(node).outlineStyle),
        'none',
      );

      const scroll = page.getByTestId('scroll');
      await scroll.evaluate((node) => node.addEventListener('wheel', () => {}, { passive: false }));
      await input.hover();
      await page.mouse.wheel(0, 87);
      await page.waitForFunction(
        () => document.querySelector('[data-testid="scroll"]').scrollTop > 0,
      );
      await assertFocused(input);
      await expectValue(input, '10');
      await page.locator('#previous').focus();
      await scroll.evaluate((node) => {
        node.scrollTop = 0;
      });
      await input.hover();
      await page.mouse.wheel(0, 81);
      await page.waitForFunction(
        () => document.querySelector('[data-testid="scroll"]').scrollTop > 0,
      );
      await assertFocused(page.locator('#previous'));
      await expectValue(input, '10');

      await configure(page, { preventArrow: true, loading: true });
      await input.press('ArrowUp');
      await expectValue(input, '10');
      await input.press('ArrowDown');
      await expectValue(input, '9');
      assert.equal(await input.getAttribute('dir'), 'ltr');
      const [minus, plus] = await Promise.all([
        decrease(page).boundingBox(),
        increase(page).boundingBox(),
      ]);
      assert.ok(minus.x > plus.x);
    },

  'NumberInput keeps geometry, focus and separate feedback in forced colors and reduced motion':
    async ({ page, mount }) => {
      await mount('number-input', {
        direction: 'rtl',
        surface: 'overlay',
        theme: 'pixel-dark',
        textScale: 120,
        forcedColors: 'active',
        reducedMotion: 'reduce',
      });
      await configure(page, { min: 10, max: 12, loading: true, danger: true, required: true });
      const input = editor(page);
      await page.getByRole('spinbutton', { name: 'Legend value' }).focus();
      await page.keyboard.press('Tab');
      await assertFocused(input);
      const details = await shell(input).evaluate((node) => {
        const feedback = node.querySelector('.unica-number-input-feedback');
        const unavailable = node.querySelector('button:disabled');
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const amount = node.querySelector('.unica-number-input-value').getBoundingClientRect();
        return {
          height: rect.height,
          amountOffset: amount.left + amount.width / 2 - (rect.left + rect.width / 2),
          radius: style.borderStartStartRadius,
          outline: [style.outlineWidth, style.outlineOffset],
          feedback: feedback.children.length,
          animations: feedback
            .getAnimations({ subtree: true })
            .filter((animation) => animation.effect.getComputedTiming().duration > 0).length,
          unavailable: unavailable.disabled,
        };
      });
      assert.deepEqual(details, {
        height: 40,
        amountOffset: details.amountOffset,
        radius: '0px',
        outline: ['2px', '2px'],
        feedback: 2,
        animations: 0,
        unavailable: true,
      });
      assert.ok(Math.abs(details.amountOffset) < 0.5);
      assert.equal(await input.getAttribute('aria-busy'), 'true');
      assert.equal(await input.getAttribute('aria-invalid'), 'true');
      await input.press('ArrowUp');
      await expectValue(input, '11');
      await configure(page, { min: 10, max: 12, loading: true, danger: true, variant: 'ghost' });
      const edges = await shell(input).evaluate((node) => ({
        outline: getComputedStyle(node).borderTopColor,
        baseline: getComputedStyle(node, '::after').borderBottomColor,
      }));
      assert.equal(edges.outline, 'rgba(0, 0, 0, 0)');
      assert.notEqual(edges.baseline, 'rgba(0, 0, 0, 0)');
    },

  'NumberInput press cadence and canceled contacts do not leak a release click': async ({
    page,
    mount,
  }) => {
    await mount('number-input');
    const input = editor(page);
    const plus = increase(page);
    const time = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time });
    await page.clock.pauseAt(new Date(time.getTime() + 1000));

    await beginPress(page, plus);
    await page.clock.runFor(449);
    await expectValue(input, '10');
    await page.clock.runFor(1);
    await expectValue(input, '11');
    await page.mouse.move(1, 1);
    await page.clock.runFor(100);
    await expectValue(input, '12');
    await page.mouse.up();
    await expectValue(input, '12');
    await assertFocused(input);

    await clearLog(page);
    await beginPress(page, plus);
    assert.equal((await snapshot(input, true)).entry, '10');
    await page.mouse.up();
    await expectValue(input, '10');
    assert.deepEqual(await log(page), []);
    await plus.click();
    await expectValue(input, '11');

    await beginPress(page, plus);
    await configure(page, { step: 5 });
    await page.clock.runFor(700);
    await page.mouse.up();
    await expectValue(input, '11');
    await plus.evaluate((node) => node.click());
    await expectValue(input, '15');

    await configure(page, { version: 2, value: 10, response: 'refuse' });
    await clearLog(page);
    await beginPress(page, plus);
    await page.clock.runFor(650);
    await page.mouse.up();
    await expectValue(input, '10');
    assert.deepEqual(
      (await log(page)).filter(([kind]) => kind === 'value').map((entry) => entry[4]),
      [11, 11, 11],
    );

    await configure(page, { version: 3, defaultValue: 10, max: 11 });
    await clearLog(page);
    await beginPress(page, plus);
    await page.clock.runFor(850);
    await page.mouse.up();
    await expectValue(input, '11');
    assert.equal(await plus.isDisabled(), true);
    assert.equal((await log(page)).filter(([kind]) => kind === 'value').length, 1);

    await configure(page, { version: 4, max: 11 });
    await beginPress(page, plus);
    await page.clock.runFor(450);
    await expectValue(input, '11');
    await input.press('ArrowDown');
    await page.clock.runFor(100);
    await expectValue(input, '10');
    await page.mouse.up();

    await configure(page, { version: 5 });
    await beginPress(page, plus);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.up({ button: 'left' });
    await expectValue(input, '11');
    await page.clock.runFor(650);
    await expectValue(input, '11');
    await page.mouse.up({ button: 'middle' });

    await beginPress(page, plus);
    await input.evaluate((node) => {
      node.ownerDocument.addEventListener('pointerup', () => node.form.reset(), { once: true });
    });
    await page.mouse.up();
    await expectValue(input, '10');
    await plus.click();
    await expectValue(input, '11');
  },

  'NumberInput keeps touch and assistive activation separate from mouse focus and consumer updates':
    async ({ page, mount, origin, watchPage }) => {
      await mount('number-input');
      const input = editor(page);
      await page.locator('#previous').focus();
      await increase(page).evaluate((node) => node.click());
      await assertFocused(page.locator('#previous'));
      await expectValue(input, '11');
      await increase(page).click();
      await assertFocused(input);
      await page.locator('#previous').focus();
      await increase(page).evaluate((node) => node.click());
      await assertFocused(page.locator('#previous'));
      await expectValue(input, '13');

      await configure(page, { defaultValue: 10, response: 'focus' });
      await increase(page).click();
      await assertFocused(page.locator('#after'));
      await configure(page, { defaultValue: 10, response: 'disable' });
      await increase(page).click();
      assert.equal(await input.isDisabled(), true);
      assert.equal(await input.evaluate((node) => node !== document.activeElement), true);

      const context = await page.context().browser().newContext({ hasTouch: true, isMobile: true });
      try {
        const touch = watchPage(await context.newPage());
        await touch.goto(
          new URL('/test/browser/index.html?fixture=number-input&theme=soft-dark', origin).href,
        );
        const plus = increase(touch);
        await plus.waitFor();
        await plus.tap();
        await expectValue(editor(touch), '11');
        assert.equal(await editor(touch).evaluate((node) => node !== document.activeElement), true);
      } finally {
        await context.close();
      }
    },

  'NumberInput serves an accessible native editor before hydration and keeps authority after it':
    async ({ page, mount, renderFixture }) => {
      await mount('number-input-hydration');
      const host = page.getByTestId('hydrate-number-input');
      const local = host.getByRole('spinbutton', { name: 'Initial count' });
      const owner = host.getByRole('spinbutton', { name: 'Owner count' });
      const generated = host.getByRole('spinbutton', { name: 'Generated id' });
      await host.evaluate(
        (node, html) => {
          node.innerHTML = html;
        },
        await renderFixture('number-input-ssr'),
      );
      assert.equal(await local.getAttribute('type'), 'number');
      assert.equal(await local.getAttribute('step'), '0.5');
      assert.equal(await local.getAttribute('min'), '0');
      assert.equal(await local.getAttribute('max'), '9');
      assert.equal(await local.getAttribute('id'), 'ssr-local');
      assert.equal(await local.getAttribute('aria-invalid'), 'true');
      assert.deepEqual(
        await local.evaluate((input) => ({
          required: input.required,
          size: input.closest('.unica-number-input').dataset.unicaNumberInputSize,
          descriptions: input
            .getAttribute('aria-describedby')
            .split(' ')
            .map((id) => input.ownerDocument.getElementById(id).textContent),
        })),
        {
          required: true,
          size: 's',
          descriptions: [
            'Capacity budget.',
            'Use half steps.',
            'Check the requested count.',
            '9 max',
          ],
        },
      );
      assert.equal(await owner.getAttribute('aria-invalid'), null);
      assert.equal(
        await owner.evaluate((input) => input.disabled || input.readOnly || input.required),
        false,
      );
      await host.locator('.unica-form-field-feedback-glyph').waitFor();
      await host.locator('.unica-number-input-status').waitFor({ state: 'hidden' });
      await expectValue(local, '1.5');
      await expectValue(owner, '2');
      const id = await generated.getAttribute('id');
      assert.ok(id);
      await local.fill('2.5');
      await owner.fill('7');
      await host.evaluate((node) => node.dispatchEvent(new Event('hydrate-number-input')));
      await expectValue(local, '2.5');
      await expectValue(owner, '2');
      assert.equal(await generated.getAttribute('id'), id);
      await host
        .locator('[data-unica-form-field-glyph-owner="editor"] .unica-number-input-status')
        .waitFor();
      await host.locator('.unica-form-field-feedback-glyph').waitFor({ state: 'hidden' });
      await local.press('ArrowUp');
      await expectValue(local, '3');
      assert.equal((await snapshot(local, true)).entry, '1.5');
      await expectValue(owner, '2');
    },
};

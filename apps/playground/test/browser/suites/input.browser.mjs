import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys, resetForm, submitForm } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const input = (page, name) => page.getByLabel(name, { exact: true });
const clear = (page, id) => page.locator(`button[aria-controls="${id}"]`);
const entries = (form) => form.evaluate((node) => [...new FormData(node)]);
const observations = async (page) =>
  JSON.parse(await page.getByTestId('observations').textContent());
const frame = (locator) => locator.locator('..');

async function expectValue(page, field, value) {
  await page.waitForFunction(({ id, value }) => document.getElementById(id)?.value === value, {
    id: await field.getAttribute('id'),
    value,
  });
}

function colors(node) {
  const field = node.firstElementChild;
  const native = field.querySelector('input');
  const glyph = field.querySelector('svg');
  return {
    text: getComputedStyle(native).color,
    glyph: glyph && getComputedStyle(glyph).color,
    background: getComputedStyle(field).backgroundColor,
    edge: getComputedStyle(field, '::after').borderBottomColor,
    outline: getComputedStyle(field).outlineColor,
    outlineWidth: getComputedStyle(field).outlineWidth,
    outlineStyle: getComputedStyle(field).outlineStyle,
    outlineOffset: getComputedStyle(field).outlineOffset,
    radius: getComputedStyle(field).borderTopLeftRadius,
  };
}

export default {
  'Input keeps native edits and Clear in one event path under local and controlled authority':
    async ({ page, mount }) => {
      await mount('input');
      const controlled = input(page, 'Controlled field');
      const uncontrolled = input(page, 'Uncontrolled field');
      const form = page.getByTestId('values-form');
      const observed = await controlled.evaluateHandle((node) => {
        const values = [];
        node.addEventListener('input', () => values.push(node.value));
        return values;
      });
      await controlled.fill('candidate');
      await expectValue(page, controlled, 'hello');
      assert.deepEqual(await observations(page), [['controlled', 'candidate', 'candidate']]);
      await clear(page, 'owned').click();
      await expectValue(page, controlled, 'hello');
      await assertFocused(controlled);
      await page.keyboard.press('Tab');
      await assertFocused(clear(page, 'owned'));
      await page.keyboard.press('Space');
      await expectValue(page, controlled, 'hello');
      await assertFocused(controlled);
      assert.deepEqual(await observed.jsonValue(), ['candidate', '', '']);
      assert.deepEqual((await observations(page)).slice(1), [
        ['controlled', '', ''],
        'controlled clear',
        ['controlled', '', ''],
        'controlled clear',
      ]);

      await input(page, 'Owner behavior').selectOption('transform');
      await controlled.fill('accepted');
      assert.equal(await controlled.inputValue(), 'ACCEPTED');
      assert.deepEqual(await entries(form), [
        ['controlled', 'ACCEPTED'],
        ['uncontrolled', 'abc'],
      ]);
      await input(page, 'Owner behavior').selectOption('accept');
      await controlled.evaluate((node) => {
        node.focus();
        node.setSelectionRange(2, 2);
      });
      await page.keyboard.insertText('d');
      assert.equal(await controlled.inputValue(), 'ACdCEPTED');
      assert.equal(await controlled.evaluate((node) => node.selectionStart), 3);
      await pressKeys(page, 'Control+z');
      assert.equal(await controlled.inputValue(), 'ACCEPTED');
      await pressKeys(page, 'Control+Shift+z');
      assert.equal(await controlled.inputValue(), 'ACdCEPTED');

      await uncontrolled.fill('edited');
      assert.deepEqual((await observations(page)).at(-1), ['uncontrolled', 'edited', 'edited']);
      await button(page, 'Change mount default prop').click();
      const beforeReset = await observations(page);
      await button(page, 'Reset values').click();
      assert.equal(await uncontrolled.inputValue(), 'abc');
      assert.equal(await controlled.inputValue(), 'ACdCEPTED');
      assert.deepEqual(await observations(page), beforeReset);
      await uncontrolled.fill('edited');
      assert.deepEqual((await observations(page)).at(-1), ['uncontrolled', 'edited', 'edited']);
      await page.keyboard.press('Tab');
      await assertFocused(clear(page, 'local'));
      await page.keyboard.press('Enter');
      await assertFocused(uncontrolled);
      assert.deepEqual((await observations(page)).slice(-2), [
        ['uncontrolled', '', ''],
        'uncontrolled clear',
      ]);
      assert.equal(await clear(page, 'local').isVisible(), false);
    },

  'Input keeps the browser IME preedit and reconciles the latest owner after native commit':
    async ({ page, mount }) => {
      await mount('input');
      const editor = input(page, 'Controlled field');
      const form = page.getByTestId('values-form');
      const cdp = await page.context().newCDPSession(page);
      for (const [mode, finalValue] of [
        ['ime', 'he仮名llo'],
        ['reject', 'hello'],
        ['transform', 'HE仮名LLO'],
      ]) {
        await button(page, 'Restore owner').click();
        await input(page, 'Owner behavior').selectOption(mode);
        await editor.evaluate((node) => {
          node.focus();
          node.setSelectionRange(2, 2);
        });
        const start = (await observations(page)).length;
        await cdp.send('Input.imeSetComposition', {
          text: 'か',
          selectionStart: 1,
          selectionEnd: 1,
        });
        assert.equal(await editor.inputValue(), 'heかllo');
        assert.equal((await entries(form))[0][1], 'heかllo');
        await cdp.send('Input.imeSetComposition', {
          text: 'かな',
          selectionStart: 2,
          selectionEnd: 2,
        });
        assert.equal(await editor.inputValue(), 'heかなllo');
        assert.equal((await entries(form))[0][1], 'heかなllo');
        await clear(page, 'owned').click();
        await assertFocused(editor);
        assert.equal(await editor.inputValue(), 'heかなllo');
        const otherDraft = await input(page, 'Uncontrolled field').inputValue();
        await cdp.send('Input.insertText', { text: '仮名' });
        await expectValue(page, editor, finalValue);
        const actions = (await observations(page)).slice(start);
        assert.equal(actions.filter((entry) => entry === 'composition start').length, 1);
        assert.equal(actions.filter((entry) => entry === 'composition end').length, 1);
        assert.deepEqual(actions.filter(Array.isArray), [
          ['controlled', 'heかllo', 'heかllo'],
          ['controlled', 'heかなllo', 'heかなllo'],
          ['controlled', 'he仮名llo', 'he仮名llo'],
        ]);
        assert.equal((await entries(form))[0][1], finalValue);
        assert.equal(await input(page, 'Uncontrolled field').inputValue(), otherDraft);
        if (mode === 'ime') {
          assert.equal(await editor.evaluate((node) => node.selectionStart), 4);
        }
        await clear(page, 'owned').click();
        assert.equal((await observations(page)).at(-1), 'controlled clear');
      }
      await cdp.detach();
    },

  'Input uses browser association, validation, normalization, availability and reset witnesses':
    async ({ page, mount }) => {
      await mount('input');
      const outside = page.getByTestId('outside');
      const other = page.getByTestId('other');
      const required = input(page, 'Required outside field');
      const fieldset = page.getByTestId('fieldset');
      const field = input(page, 'Fieldset field');
      const readOnly = input(page, 'Read-only busy');
      const url = input(page, 'Normalized URL');
      const email = input(page, 'Normalized email');
      const first = input(page, 'First legend field');
      const second = input(page, 'Second legend field');
      const inert = page.locator('#inert');
      const namedForm = page.getByTestId('named-dom-property');
      const namedEditor = input(page, 'Named native field');
      await namedEditor.fill('edited');
      assert.deepEqual(await entries(namedForm), [['parentNode', 'edited']]);
      await resetForm(namedForm);
      assert.equal(await namedEditor.inputValue(), 'initial');
      assert.equal(await url.inputValue(), 'https://example.com/');
      assert.equal(await email.inputValue(), '');
      assert.equal(await clear(page, 'email').isVisible(), false);
      await clear(page, 'email').evaluate((node) => node.click());
      assert.equal(await email.inputValue(), '');
      assert.equal(await input(page, 'One line').inputValue(), 'newline');
      const before = await entries(outside);
      assert.deepEqual(
        before.filter(([name]) => name === 'legend'),
        [
          ['legend', 'first'],
          ['legend', 'second'],
          ['legend', 'outside'],
        ],
      );
      assert.ok(before.some(([name, value]) => name === 'empty' && value === ''));
      assert.equal(
        before.some(([name]) => !name),
        false,
      );
      assert.equal(await required.evaluate((node) => node.checkValidity()), false);
      await button(page, 'Submit outside').click();
      await assertFocused(required);
      await required.fill('present');
      assert.ok(
        (await submitForm(outside, button(page, 'Submit outside'))).some(
          ([name, value]) => name === 'required' && value === 'present',
        ),
      );
      assert.equal(await readOnly.getAttribute('aria-invalid'), 'true');
      assert.equal(await readOnly.getAttribute('aria-busy'), 'true');
      assert.equal(await clear(page, 'readonly').isVisible(), false);
      await readOnly.evaluate((node) => {
        node.focus();
        node.select();
      });
      assert.equal(await readOnly.evaluate((node) => node.selectionEnd - node.selectionStart), 6);

      await fieldset.evaluate((node) => {
        node.disabled = true;
      });
      await page.waitForFunction(
        () => !document.getElementById('inside').hasAttribute('aria-invalid'),
      );
      assert.equal(await field.getAttribute('aria-busy'), null);
      assert.equal(await field.evaluate((node) => node.willValidate), false);
      assert.equal(await clear(page, 'inside').isVisible(), false);
      assert.equal(await first.isDisabled(), false);
      assert.equal(await second.isDisabled(), true);
      assert.equal(
        (await entries(outside)).some(([name]) => name === 'inside'),
        false,
      );
      await fieldset.evaluate((node) =>
        node.prepend(node.querySelector('[data-testid="second-legend"]')),
      );
      assert.equal(await first.isDisabled(), true);
      assert.equal(await second.isDisabled(), false);
      await fieldset.evaluate((node) => {
        node.disabled = false;
      });
      await page.waitForFunction(
        () => document.getElementById('inside').getAttribute('aria-busy') === 'true',
      );
      assert.equal(await field.getAttribute('aria-invalid'), 'true');
      assert.equal(await field.inputValue(), 'inside');
      await field.fill('still editable');
      assert.equal(await field.inputValue(), 'still editable');

      await page.getByTestId('inert-parent').evaluate((node) => {
        node.inert = true;
      });
      await clear(page, 'inert').evaluate((node) => node.click());
      await clear(page, 'inert-self').evaluate((node) => node.click());
      assert.equal(await inert.inputValue(), 'retained');
      assert.deepEqual(
        (await entries(outside)).filter(([name]) => name === 'inert' || name === 'self'),
        [
          ['inert', 'retained'],
          ['self', 'retained'],
        ],
      );
      await page.getByTestId('inert-parent').evaluate((node) => {
        node.inert = false;
      });
      await clear(page, 'inert').click();
      assert.equal(await inert.inputValue(), '');

      await outside.evaluate((node) =>
        node.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true })),
      );
      assert.equal(await inert.inputValue(), '');
      await outside.evaluate((node) =>
        node.addEventListener('reset', (event) => event.preventDefault(), { once: true }),
      );
      await resetForm(outside);
      assert.equal(await inert.inputValue(), '');
      await button(page, 'Change form owner').click();
      assert.deepEqual(await entries(outside), []);
      await resetForm(outside);
      assert.equal(await inert.inputValue(), '');
      await email.fill('edited@example.com');
      await resetForm(other);
      assert.equal(await inert.inputValue(), 'retained');
      assert.equal(await field.inputValue(), 'inside');
      assert.equal(await email.inputValue(), '');
      await button(page, 'Change input type').click();
      assert.equal(await email.getAttribute('type'), 'text');
      assert.equal(await email.inputValue(), '');
      await resetForm(other);
      assert.equal(await email.inputValue(), '   ');
    },

  'Input retains a focused Clear during loading and edits in an iframe through native events':
    async ({ page, mount }) => {
      await mount('input');
      const transition = clear(page, 'busy-transition');
      const toggle = button(page, 'Toggle loading');
      await transition.focus();
      await assertFocused(transition);
      await toggle.evaluate((node) => node.click());
      assert.equal(await transition.getAttribute('aria-disabled'), 'true');
      await assertFocused(transition);
      await page.keyboard.press('Enter');
      assert.equal(await input(page, 'Busy transition').inputValue(), 'working');
      await toggle.evaluate((node) => node.click());
      assert.equal(await transition.getAttribute('aria-disabled'), null);
      await assertFocused(transition);

      const iframe = page.frameLocator('iframe[title="Input realm"]');
      await iframe.getByRole('button', { name: 'Clear value' }).click();
      const editor = iframe.getByRole('textbox', { name: 'Frame input' });
      assert.equal(await editor.inputValue(), '');
      await assertFocused(editor);
      assert.equal(await page.getByTestId('realm-events').textContent(), '11');

      await clear(page, 'clear-guard').press('Enter');
      await page.locator('#clear-guard').waitFor({ state: 'detached' });
      assert.deepEqual(JSON.parse(await page.getByTestId('clear-events').textContent()), [
        'change',
        'clear',
      ]);
    },

  'Input adopts a pre-hydration uncontrolled edit and retains the controlled prop after hydration':
    async ({ page, mount, renderFixture }) => {
      const html = await renderFixture('input-ssr');
      await mount('input-hydration');
      await page.getByTestId('input-ssr-root').evaluate((node, html) => {
        node.innerHTML = html;
      }, html);
      const local = input(page, 'Server default');
      const owned = input(page, 'Server owner');
      const form = page.getByTestId('ssr-form');
      assert.deepEqual(await entries(form), [
        ['local', 'initial'],
        ['owner', 'owned'],
      ]);
      await local.fill('draft before hydration');
      await owned.fill('uncommitted');
      await button(page, 'Hydrate inputs').click();
      await page.locator('[data-input-hydrated]').waitFor();
      assert.deepEqual(await entries(form), [
        ['local', 'draft before hydration'],
        ['owner', 'owned'],
      ]);
      assert.equal(await page.getByTestId('ssr-events').textContent(), '0');
      await button(page, 'Reset SSR input').click();
      assert.deepEqual(await entries(form), [
        ['local', 'initial'],
        ['owner', 'owned'],
      ]);
      assert.equal(await page.getByTestId('ssr-events').textContent(), '0');
      await local.fill('draft before hydration');
      assert.equal(await page.getByTestId('ssr-events').textContent(), '1');
    },

  'Input geometry and native focus survive six themes, overlays, RTL and larger text': async ({
    page,
    mount,
  }) => {
    await mount('input', { direction: 'rtl', textScale: 120 });
    for (const theme of [
      'soft-dark',
      'soft-light',
      'frost-dark',
      'frost-light',
      'pixel-dark',
      'pixel-light',
    ]) {
      for (const surface of ['base', 'overlay']) {
        const actual = await page.evaluate(
          ({ theme, surface }) => {
            document.documentElement.dataset.theme = theme;
            document.documentElement.dataset.surface = surface;
            const root = document.querySelector('[data-testid="size-m"]').firstElementChild;
            const empty = document.querySelector('[data-testid="empty-ghost"] input');
            const editor = root.querySelector('input').getBoundingClientRect();
            const action = root.querySelector('button').getBoundingClientRect();
            const style = getComputedStyle(root);
            return {
              radius: style.borderTopLeftRadius,
              background: style.backgroundColor,
              size: root.getBoundingClientRect().height,
              action: action.width,
              order: action.right <= editor.left,
              hint: empty.placeholder,
              hintShown: empty.matches(':placeholder-shown'),
              hintOpacity: getComputedStyle(empty, '::placeholder').opacity,
            };
          },
          { theme, surface },
        );
        assert.equal(actual.radius, theme.startsWith('pixel') ? '0px' : '8px');
        assert.equal(actual.background, 'rgba(0, 0, 0, 0)');
        assert.equal(actual.size, 40);
        assert.equal(actual.action, 24);
        assert.equal(actual.order, true);
        assert.equal(actual.hint, 'Enter a reference');
        assert.equal(actual.hintShown, true);
        assert.equal(actual.hintOpacity, '1');
      }
    }
    const field = page.getByTestId('size-m');
    const editor = input(page, 'Field m');
    const action = clear(page, 'size-m');
    const normal = await field.evaluate(colors);
    await editor.click();
    await pressKeys(page, 'ArrowLeft', 'a');
    assert.equal((await field.evaluate(colors)).outlineStyle, 'none');
    await button(page, 'Before inputs').focus();
    await pressKeys(page, 'Tab', 'Tab', 'Tab');
    await assertFocused(editor);
    assert.equal((await field.evaluate(colors)).outlineWidth, '2px');
    assert.equal((await field.evaluate(colors)).outlineOffset, '2px');
    assert.equal((await field.evaluate(colors)).edge, normal.edge);
    await page.keyboard.press('Tab');
    await assertFocused(action);
    assert.equal((await field.evaluate(colors)).outlineStyle, 'none');
    assert.equal(await action.evaluate((node) => getComputedStyle(node).outlineWidth), '2px');
  },

  'Input Clear keeps local hit targets, including coarse pointers and native search chrome':
    async ({ page, mount }) => {
      await mount('input', { forcedColors: 'active', reducedMotion: 'reduce' });
      const busy = page.getByTestId('load-and-status');
      assert.equal(await busy.locator('svg[aria-hidden="true"]').count(), 3);
      const spinner = busy.locator('svg').last();
      assert.equal(await spinner.evaluate((node) => getComputedStyle(node).animationName), 'none');
      for (const [size, height, target] of [
        ['s', 30, 24],
        ['m', 40, 24],
        ['l', 48, 28],
      ]) {
        const field = page.getByTestId(`size-${size}`);
        const editor = input(page, `Field ${size}`);
        const action = clear(page, `size-${size}`);
        const shell = await getBox(field);
        assert.equal(shell.height, height);
        assert.equal((await getBox(action)).width, target);
        await editor.click();
        assert.equal((await field.evaluate(colors)).outlineWidth, '2px');
        assert.equal(
          (await field.evaluate(colors)).outline,
          await page.evaluate(() => {
            const span = document.createElement('span');
            span.style.color = 'Highlight';
            document.body.append(span);
            const color = getComputedStyle(span).color;
            span.remove();
            return color;
          }),
        );
        const initialBox = await getBox(editor);
        await editor.fill('');
        assert.equal(await action.isVisible(), false);
        assert.deepEqual(await getBox(editor), initialBox);
        await editor.fill('Folio');
      }
      for (const name of ['No Clear search', 'Busy search']) {
        const editor = input(page, name);
        const shell = await getBox(frame(editor));
        const targetY = shell.y + shell.height / 2;
        const box = await getBox(editor);
        await page.mouse.click(box.x + box.width - 5, targetY);
        assert.equal(await editor.inputValue(), 'Text');
      }
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
      const action = clear(page, 'size-l');
      const editor = input(page, 'Field l');
      const box = await getBox(action);
      assert.equal(box.width, 44);
      assert.equal(box.height, 44);
      await page.mouse.click(box.x + 1, box.y + box.height / 2);
      assert.equal(await editor.inputValue(), '');
      await assertFocused(editor);
      await cdp.detach();
    },
};

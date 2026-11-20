import assert from 'node:assert/strict';
import { assertFocused, pressKeys, submitForm } from '../helpers.mjs';

const entries = (form) => form.evaluate((node) => [...new FormData(node)]);
const button = (page, name) => page.getByRole('button', { name, exact: true });

async function choose(page, name, option) {
  await button(page, name + ' choices').click();
  await button(page, name + ' choose ' + option).click();
}

const suite = {
  'closed carriers preserve selection order, option node identity, CSP hiding, and native submitters':
    async ({ page, mount }) => {
      await mount('form-carriers');
      const form = page.locator('#values');
      const single = form.locator('select[name=single]');
      const multi = form.locator('select[name=multi]');
      await single.evaluate((node) => {
        window.singleCarrier = node;
        window.singleOptA = [...node.options].find((opt) => opt.value === 'a');
        window.singleOptB = [...node.options].find((opt) => opt.value === 'b');
      });
      await multi.evaluate((node) => {
        window.multiCarrier = node;
      });
      // Visually hidden carriers use CSS class (CSP-safe, zero inline style) and stay out of Tab order.
      assert.deepEqual(
        await single.evaluate((node) => ({
          hasStyleAttr: node.hasAttribute('style'),
          hasClass: node.classList.contains('unica-visually-hidden'),
          ariaHidden: node.getAttribute('aria-hidden'),
          tabIndex: node.tabIndex,
        })),
        { hasStyleAttr: false, hasClass: true, ariaHidden: 'true', tabIndex: -1 },
      );

      const native = [
        ['text', 'initial'],
        ['check', 'yes'],
      ];
      assert.deepEqual(await entries(form), native);
      await choose(page, 'single', 'empty string');
      assert.deepEqual(await entries(form), [['single', ''], ...native]);
      await choose(page, 'single', 'b');
      // Single select updates selectedIndex in place without rebuilding existing <option> nodes.
      assert.equal(
        await single.evaluate(
          (node) =>
            [...node.options].includes(window.singleOptA) &&
            [...node.options].includes(window.singleOptB),
        ),
        true,
      );
      await button(page, 'Multiple choices').click();
      await button(page, 'Choose B then A').click();
      await button(page, 'Filter multiple').click();
      await button(page, 'single toggle filter').click();
      assert.equal(await single.evaluate((node) => node === window.singleCarrier), true);
      assert.equal(await multi.evaluate((node) => node === window.multiCarrier), true);
      assert.deepEqual(await submitForm(form, button(page, 'Save values')), [
        ['single', 'b'],
        ['multi', 'b'],
        ['multi', 'a'],
        ...native,
        ['action', 'save'],
      ]);

      await button(page, 'Clear multiple').click();
      await page.getByRole('textbox', { name: 'Text', exact: true }).fill('edited');
      await page.getByRole('checkbox', { name: 'Check', exact: true }).uncheck();
      assert.deepEqual(await entries(form), [
        ['single', 'b'],
        ['text', 'edited'],
      ]);
    },
  'availability follows native disabled inheritance, ignores disabled proposals, and keeps accepted unavailable options':
    async ({ page, mount }) => {
      await mount('form-carriers');
      const form = page.locator('#values');
      const external = page.locator('#external');
      const single = form.locator('select[name=single]');
      await choose(page, 'single', 'b');
      await button(page, 'single toggle availability').click();
      assert.deepEqual(await form.evaluate((node) => new FormData(node).getAll('single')), ['b']);
      await button(page, 'single choices').click();
      assert.equal(await button(page, 'single choose b').isDisabled(), true);
      await button(page, 'single choose a').click();
      assert.deepEqual(await form.evaluate((node) => new FormData(node).getAll('single')), ['a']);
      await button(page, 'Toggle read only').click();
      await choose(page, 'single', 'empty string');
      await button(page, 'single choices').click();
      await button(page, 'single choose empty string').focus();
      await pressKeys(page, 'Enter');
      assert.deepEqual(await form.evaluate((node) => new FormData(node).getAll('single')), ['a']);
      await button(page, 'Toggle read only').click();
      await button(page, 'Toggle own disabled').click();
      assert.equal(
        await single.evaluate((node) => node.matches(':disabled') && !node.willValidate),
        true,
      );
      assert.equal(await form.evaluate((node) => new FormData(node).has('single')), false);
      // Programmatic propose() while control matches :disabled must be ignored.
      await button(page, 'single force propose b').click();
      await button(page, 'Toggle own disabled').click();
      assert.deepEqual(await form.evaluate((node) => new FormData(node).getAll('single')), ['a']);

      assert.deepEqual(await entries(external), [['first', 'a']]);
      assert.equal(await button(page, 'second choices').isDisabled(), true);
      assert.equal(await button(page, 'plain choices').isDisabled(), true);
      await choose(page, 'first', 'b');
      assert.deepEqual(await submitForm(external, button(page, 'Send external')), [
        ['action', 'send'],
        ['first', 'b'],
      ]);
      await button(page, 'Toggle fieldset').click();
      await choose(page, 'second', 'b');
      await choose(page, 'plain', 'b');
      assert.deepEqual(await entries(external), [
        ['first', 'b'],
        ['second', 'b'],
        ['plain', 'b'],
      ]);
      await button(page, 'Toggle fieldset').click();
      assert.deepEqual(await entries(external), [['first', 'b']]);
    },
  'multiple required carriers validate and focus their visible owner': async ({ page, mount }) => {
    await mount('form-carriers');
    const form = page.locator('#required-multiple');
    const carrier = form.locator('select');
    const trigger = button(page, 'Required multiple choices');
    assert.equal(await carrier.evaluate((node) => node.matches(':invalid')), true);
    assert.equal(await form.evaluate((node) => node.reportValidity()), false);
    await assertFocused(trigger);
    await trigger.click();
    assert.equal(await form.evaluate((node) => node.checkValidity()), true);
    assert.deepEqual(await submitForm(form, button(page, 'Submit required multiple')), [
      ['multiple', 'b'],
      ['multiple', 'a'],
    ]);
  },
  'a hidden native input retains its constraints, skips Tab order, and delegates reporting focus':
    async ({ page, mount }) => {
      await mount('form-carriers');
      const form = page.locator('#required-input');
      const carrier = form.locator('input');
      const trigger = button(page, 'Fill input code');
      assert.equal(await carrier.evaluate((node) => node.hasAttribute('style')), false);
      assert.equal(
        await carrier.evaluate((node) => node.classList.contains('unica-visually-hidden')),
        true,
      );
      await trigger.focus();
      await pressKeys(page, 'Tab', 'Tab');
      await assertFocused(button(page, 'Submit required input'));
      assert.equal(await carrier.evaluate((node) => node.validity.valueMissing), true);
      await button(page, 'Fill invalid input code').click();
      assert.equal(await carrier.evaluate((node) => node.validity.patternMismatch), true);
      assert.equal(await form.evaluate((node) => node.reportValidity()), false);
      await assertFocused(trigger);
      await trigger.click();
      assert.deepEqual(await submitForm(form, button(page, 'Submit required input')), [
        ['code', '123'],
      ]);
    },
};

const validationOrders = [
  ['Two composite fields', 'required A choices', 'required B choices'],
  ['Composite first', 'required A choices', 'Native required'],
  ['Native first', 'Native required', 'required A choices'],
];

for (const [layout, first, second] of validationOrders) {
  suite['validation respects native reporting order with ' + layout.toLowerCase()] = async ({
    page,
    mount,
  }) => {
    await mount('form-carriers');
    const selector = button(page, layout);
    await selector.click();
    const form = page.locator('#validation');
    const field = (name) =>
      page.getByRole(name === 'Native required' ? 'textbox' : 'button', { name, exact: true });
    const firstField = field(first);
    const secondField = field(second);
    const submit = button(page, 'Submit required');
    const invalid = form.locator('select[name="required A"]');
    assert.equal(await invalid.evaluate((node) => node.matches(':invalid')), true);

    await form.evaluate((node) => {
      window.validationTrace = [];
      node.addEventListener('focusin', (event) => {
        if (!event.target.matches('select,[type=submit]')) {
          window.validationTrace.push(
            event.target.getAttribute('aria-label') ?? event.target.textContent,
          );
        }
      });
      window.submitCount = 0;
      node.addEventListener('submit', () => window.submitCount++);
    });

    await assertFocused(selector);
    assert.equal(await form.evaluate((node) => node.checkValidity()), false);
    await assertFocused(selector);
    assert.equal(await form.evaluate((node) => node.reportValidity()), false);
    await assertFocused(firstField);

    await selector.focus();
    await form.evaluate((node) => node.requestSubmit());
    await assertFocused(firstField);
    await selector.focus();
    await submit.click();
    await assertFocused(firstField);
    assert.deepEqual(await page.evaluate(() => window.validationTrace), [first, first, first]);
    assert.equal(await page.evaluate(() => window.submitCount), 0);

    if (first === 'Native required') {
      await firstField.fill('typed');
    } else {
      await choose(page, 'required A', 'empty string');
    }
    await submit.click();
    await assertFocused(secondField);
    assert.equal(await page.evaluate(() => window.submitCount), 0);

    if (second === 'Native required') {
      await secondField.fill('typed');
    } else {
      await choose(page, second === 'required A choices' ? 'required A' : 'required B', 'b');
    }
    const expected =
      first === 'Native required'
        ? [
            ['native', 'typed'],
            ['required A', 'b'],
          ]
        : [
            ['required A', ''],
            second === 'Native required' ? ['native', 'typed'] : ['required B', 'b'],
          ];
    assert.deepEqual(await submitForm(form, submit), expected);
  };
}

export default suite;

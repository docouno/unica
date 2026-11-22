import assert from 'node:assert/strict';
import { assertFocused, pressKeys, resetForm } from '../helpers.mjs';

const dots =
  '.choice-card-control > [aria-hidden="true"] > span, .choice-card-custom-indicator > [aria-hidden="true"] > span';

async function assertAnswer(form, value, changes) {
  const [first, second] = value === 'a' ? ['visible', 'hidden'] : ['hidden', 'visible'];
  const indicators = form.locator(dots);
  assert.equal(await indicators.count(), 2);
  await indicators.first().waitFor({ state: first });
  await indicators.last().waitFor({ state: second });
  assert.deepEqual(
    await form.evaluate((element) => ({
      checked: Array.from(
        element.querySelectorAll('input[type="radio"]:checked'),
        (input) => input.value,
      ),
      entries: [...new FormData(element)],
    })),
    { checked: [value], entries: [['policy', value]] },
  );
  assert.equal(await form.getByTestId('changes').textContent(), String(changes));
}

function cardTargets(form) {
  return form.locator('.choice-card-hit');
}

export default {
  'ChoiceCard radio dots follow pointer, arrows and reset in both placements': async ({
    page,
    mount,
  }) => {
    await mount('choice-card');
    for (const placement of ['start', 'none']) {
      const form = page.getByRole('form', { name: `Native ${placement}` });
      const otherForm = page.getByRole('form', {
        name: `Native ${placement === 'start' ? 'none' : 'start'}`,
      });
      await assertAnswer(form, 'a', 0);
      await cardTargets(form).last().click();
      await assertAnswer(form, 'b', 1);
      await assertFocused(form.getByRole('radio', { name: 'Second answer' }));
      await assertAnswer(otherForm, 'a', placement === 'start' ? 0 : 4);

      await pressKeys(page, 'ArrowLeft');
      await assertAnswer(form, 'a', 2);
      const first = form.getByRole('radio', { name: 'First answer' });
      await assertFocused(first);
      assert.equal(
        await first.evaluate(
          (input) => getComputedStyle(input.closest('.choice-card-proto')).outlineWidth,
        ),
        '2px',
      );
      await pressKeys(page, 'ArrowRight');
      await assertAnswer(form, 'b', 3);

      await form.getByRole('button', { name: 'Reset answer' }).click();
      await assertAnswer(form, 'a', 3);
      await cardTargets(form).last().click();
      await assertAnswer(form, 'b', 4);
      await resetForm(form);
      await assertAnswer(form, 'a', 4);

      if (placement === 'none') {
        const details = form.getByRole('button', { name: 'Show details' });
        await details.click();
        await assertFocused(details);
        await form.getByText('Details opened').waitFor();
        await assertAnswer(form, 'a', 4);
      }
    }
  },
  'ChoiceCard radio dots follow controlled refusal, acceptance and later reset': async ({
    page,
    mount,
  }) => {
    await mount('choice-card', {
      theme: 'pixel-light',
      surface: 'overlay',
      forcedColors: 'active',
    });
    for (const placement of ['start', 'none']) {
      const form = page.getByRole('form', { name: `Controlled ${placement}` });
      await assertAnswer(form, 'a', 0);
      await cardTargets(form).last().click();
      await assertAnswer(form, 'a', 1);
      await form.getByRole('button', { name: 'Accept changes' }).click();
      await cardTargets(form).last().click();
      await assertAnswer(form, 'b', 2);
      await form.getByRole('button', { name: 'Reset answer' }).click();
      await assertAnswer(form, 'b', 2);
      await cardTargets(form).first().click();
      await assertAnswer(form, 'a', 3);
      await resetForm(form);
      await assertAnswer(form, 'a', 3);
    }
  },
  'ChoiceCard Switch pending appearance follows fieldset availability': async ({ page, mount }) => {
    await mount('choice-card');
    const form = page.getByRole('form', { name: 'Pending integration' });
    const input = form.getByRole('switch', { name: 'Sync updates' });
    const decorative = form.locator('.choice-card-control > [aria-hidden="true"]');
    const toggle = form.getByRole('button', { name: 'Toggle integration availability' });
    const entries = () => form.evaluate((element) => [...new FormData(element)]);
    assert.equal(await input.getAttribute('aria-busy'), 'true');
    assert.deepEqual(await entries(), [['sync', 'on']]);
    await decorative.locator('svg').waitFor({ state: 'visible' });
    await toggle.click();
    await decorative.locator('svg').waitFor({ state: 'hidden' });
    assert.equal(await input.getAttribute('aria-busy'), null);
    assert.equal(await input.isChecked(), true);
    assert.deepEqual(await entries(), []);
    await toggle.click();
    await decorative.locator('svg').waitFor({ state: 'visible' });
    assert.equal(await input.getAttribute('aria-busy'), 'true');
    assert.deepEqual(await entries(), [['sync', 'on']]);
  },
};

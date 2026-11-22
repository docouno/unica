import assert from 'node:assert/strict';
import { assertFocused, pressKeys } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const entries = (form) => form.evaluate((node) => [...new FormData(node)]);
const requests = async (page) => JSON.parse(await page.getByTestId('async-requests').textContent());

async function waitForRequests(page, expected) {
  await page.waitForFunction(
    (serialized) =>
      document.querySelector('[data-testid="async-requests"]')?.textContent === serialized,
    JSON.stringify(expected),
  );
}

async function finish(page, name, message) {
  await button(page, name).evaluate((node) => node.click());
  await page.getByRole('status').getByText(message, { exact: true }).waitFor();
}

export default {
  'Switch keeps its native input and committed form entry throughout async denial, retry and success':
    async ({ page, mount }) => {
      await mount('binary-controls-switch');
      const form = page.getByRole('form', { name: 'Async switches' });
      const control = page.getByRole('switch', { name: 'Delivery reminders' });
      const enabled = [['reminders', 'enabled']];
      const status = page.getByRole('status');
      const label = page.getByText('Delivery reminders', { exact: true });

      assert.deepEqual(await entries(form), []);
      await control.evaluate((node) => {
        node.dataset.focusWitness = 'original';
        function veto(event) {
          if (event.key === 'Enter' && event.target === node) {
            event.preventDefault();
            node.ownerDocument.removeEventListener('keydown', veto);
          }
        }
        node.ownerDocument.addEventListener('keydown', veto);
      });
      await control.focus();
      await page.keyboard.press('Enter');
      assert.deepEqual(await requests(page), []);
      assert.equal(await page.getByTestId('async-submits').textContent(), '0');
      await button(page, 'Cancel next native key').evaluate((node) => node.click());
      await page.keyboard.press('Enter');
      assert.deepEqual(await requests(page), []);
      await button(page, 'Stop key propagation').evaluate((node) => node.click());
      await page.keyboard.down('Enter');
      await page.keyboard.down('Enter');
      await page.keyboard.up('Enter');
      await waitForRequests(page, [true]);
      assert.equal(await page.getByTestId('async-submits').textContent(), '0');
      assert.equal(await control.getAttribute('aria-busy'), 'true');
      assert.equal(await control.getAttribute('aria-disabled'), 'true');
      assert.equal(await control.evaluate((node) => node.disabled), false);
      assert.equal(await control.isChecked(), false);
      assert.deepEqual(await entries(form), []);
      assert.equal(await page.getByTestId('async-glyph').isVisible(), false);
      await assertFocused(control);

      await pressKeys(page, 'Space', 'Enter', 'ArrowLeft', 'ArrowRight');
      await label.click({ force: true });
      assert.deepEqual(await requests(page), [true]);
      await assertFocused(control);
      await finish(page, 'Resolve failure', 'Setting could not be saved. Try again.');
      assert.equal(await control.getAttribute('aria-busy'), null);
      assert.equal(await control.isChecked(), false);
      assert.deepEqual(await entries(form), []);
      await assertFocused(control);

      await pressKeys(page, 'Space');
      assert.equal(await status.textContent(), '');
      assert.deepEqual(await requests(page), [true, true]);
      await finish(page, 'Resolve success', 'Setting saved');
      assert.equal(await control.isChecked(), true);
      assert.deepEqual(await entries(form), enabled);
      assert.equal(await control.getAttribute('data-focus-witness'), 'original');
      await assertFocused(control);

      await pressKeys(page, 'Enter');
      await waitForRequests(page, [true, true, false]);
      assert.deepEqual(await entries(form), enabled);
      assert.equal(await control.isChecked(), true);
      await button(page, 'Toggle read only').evaluate((node) => node.click());
      assert.equal(await control.getAttribute('aria-readonly'), 'true');
      assert.equal(await control.getAttribute('aria-busy'), 'true');
      assert.deepEqual(await entries(form), enabled);
      await assertFocused(control);
      await button(page, 'Toggle switch fieldset').evaluate((node) => node.click());
      assert.equal(await control.evaluate((node) => node.matches(':disabled')), true);
      assert.equal(await control.getAttribute('aria-busy'), null);
      assert.equal(await control.getAttribute('aria-disabled'), null);
      assert.deepEqual(await entries(form), []);
      assert.equal(
        await control.evaluate((node) => {
          const glyph = node.nextElementSibling?.querySelector('svg');
          return (
            !!glyph &&
            getComputedStyle(glyph).visibility !== 'hidden' &&
            glyph.getClientRects().length > 0
          );
        }),
        false,
      );
      await button(page, 'Toggle switch fieldset').click();
      assert.deepEqual(await entries(form), enabled);
      assert.equal(await control.getAttribute('aria-busy'), 'true');
      assert.equal(await control.getAttribute('aria-disabled'), 'true');
      await finish(page, 'Resolve success', 'Setting saved');
      assert.deepEqual(await entries(form), []);
      await control.focus();
      await pressKeys(page, 'Space', 'Enter', 'ArrowLeft', 'ArrowRight');
      await label.click();
      assert.deepEqual(await requests(page), [true, true, false]);
      assert.equal(await page.getByTestId('async-submits').textContent(), '0');
    },
};

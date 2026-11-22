import assert from 'node:assert/strict';
import { assertFocused, resetForm } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const checkbox = (page, name) => page.getByRole('checkbox', { name, exact: true });
const form = (page, name) => page.getByRole('form', { name, exact: true });
const entries = (formNode) => formNode.evaluate((element) => [...new FormData(element)]);
const validity = (formNode) => formNode.evaluate((element) => element.checkValidity());
const submission = (formNode) => formNode.evaluate((element) => element.requestSubmit());
const log = async (page, id) => JSON.parse((await page.getByTestId(id).textContent()) || '[]');

async function waitForChanges(page, id, count) {
  await page.waitForFunction(
    ({ id, count }) =>
      JSON.parse(document.querySelector(`[data-testid="${id}"]`)?.textContent ?? '[]').length ===
      count,
    { id, count },
  );
}

async function assertMixed(locator, checked) {
  assert.deepEqual(await locator.evaluate((node) => [node.checked, node.indeterminate]), [
    checked,
    true,
  ]);
}

export default {
  'Canceled native clicks skip both callbacks and repair from a synchronous controlled commit':
    async ({ page, mount }) => {
      await page.addInitScript(() => {
        window.addEventListener(
          'input',
          (event) => {
            if (event.target instanceof HTMLInputElement && event.target.name === 'quiet') {
              event.stopImmediatePropagation();
            }
          },
          true,
        );
      });
      await mount('binary-controls-forms');
      const owner = form(page, 'Canceled activation form');
      const local = checkbox(page, 'Cancel at document');
      const committed = checkbox(page, 'Accept props during a canceled click');
      const changes = page.getByTestId('canceled-activation');
      await local.evaluate((input) => {
        function veto(event) {
          if (event.target === input) {
            event.preventDefault();
            input.ownerDocument.removeEventListener('click', veto);
          }
        }
        input.ownerDocument.addEventListener('click', veto);
      });
      await local.click();
      assert.equal(await changes.textContent(), '0');
      assert.deepEqual(await entries(owner), []);
      await committed.click();
      await page.waitForFunction(
        () =>
          document.querySelector(
            'form[aria-label="Canceled activation form"] input[name="controlled"]',
          )?.checked,
      );
      assert.equal(await changes.textContent(), '0');
      assert.deepEqual(await entries(owner), [['controlled', 'on']]);
      await local.click();
      assert.equal(await changes.textContent(), '2');
      assert.deepEqual(await entries(owner), [
        ['local', 'on'],
        ['controlled', 'on'],
      ]);

      await local.click();
      const beforeRetry = Number(await changes.textContent());
      assert.equal(await local.isChecked(), false);
      assert.equal(
        await local.evaluate((input) => {
          function veto(event) {
            if (event.target === input) {
              event.preventDefault();
              input.ownerDocument.removeEventListener('click', veto);
            }
          }
          input.ownerDocument.addEventListener('click', veto);
          input.click();
          input.click();
          return input.checked;
        }),
        true,
      );
      assert.equal(Number(await changes.textContent()), beforeRetry + 2);
      const delegated = await log(page, 'delegated-activation');
      await checkbox(page, 'Refuse the controlled proposal').click();
      assert.deepEqual(await log(page, 'delegated-activation'), {
        count: delegated.count + 1,
        name: 'refused',
        entries: [
          ['local', 'on'],
          ['controlled', 'on'],
        ],
      });

      const stopped = checkbox(page, 'Stop the input event');
      await stopped.evaluate((input) => {
        input.ownerDocument.addEventListener(
          'input',
          (event) => {
            if (event.target === input) {
              event.stopPropagation();
            }
          },
          { capture: true, once: true },
        );
      });
      await stopped.click();
      assert.equal(await stopped.isChecked(), true);
      assert.equal(Number(await changes.textContent()), beforeRetry + 4);
      assert.deepEqual(await entries(owner), [
        ['local', 'on'],
        ['controlled', 'on'],
        ['stopped', 'on'],
      ]);
      await stopped.click();
      assert.equal(await stopped.isChecked(), false);
      assert.equal(Number(await changes.textContent()), beforeRetry + 6);

      await button(page, 'Reset controlled commit').click();
      assert.equal(await committed.isChecked(), false);
      await committed.evaluate((input) => {
        input.click();
        input.click();
      });
      await waitForChanges(page, 'activation-proposals', 1);
      assert.equal(await committed.isChecked(), true);
      assert.deepEqual(await log(page, 'activation-proposals'), [false]);

      const quiet = checkbox(page, 'Silence native confirmation');
      await quiet.evaluate((input) => {
        input.click();
        input.click();
      });
      await waitForChanges(page, 'activation-proposals', 3);
      assert.deepEqual(await log(page, 'activation-proposals'), [false, true, false]);
      assert.equal(await quiet.isChecked(), false);
    },

  'Checkbox repairs mixed refusal before listeners and preserves the last accepted reset baseline':
    async ({ page, mount }) => {
      await mount('binary-controls-forms');
      const owner = form(page, 'Mixed checkboxes');
      const controlled = checkbox(page, 'Controlled mixed');
      const local = checkbox(page, 'Local mixed');
      const localOn = [['local', '']];
      const bothOn = [
        ['controlled', 'on'],
        ['local', ''],
      ];

      await assertMixed(controlled, false);
      await assertMixed(local, true);
      assert.deepEqual(await entries(owner), localOn);
      await controlled.press('Space');
      await waitForChanges(page, 'mixed-log', 2);
      await assertMixed(controlled, false);
      assert.deepEqual(await log(page, 'mixed-log'), [
        { phase: 'proposed', candidate: true, valid: false, entries: localOn },
        { phase: 'raw', candidate: false, valid: false, entries: localOn },
      ]);

      await button(page, 'Accept mixed proposal').click();
      await controlled.press('Space');
      await waitForChanges(page, 'mixed-log', 5);
      await assertMixed(controlled, true);
      assert.deepEqual((await log(page, 'mixed-log')).slice(2), [
        { phase: 'proposed', candidate: true, valid: false, entries: localOn },
        { phase: 'committed', candidate: true, valid: true, entries: bothOn },
        { phase: 'raw', candidate: true, valid: true, entries: bothOn },
      ]);
      await local.press('Space');
      await button(page, 'Change mixed default').click();
      await assertMixed(local, false);
      assert.deepEqual((await log(page, 'mixed-log')).at(-1), {
        phase: 'local',
        candidate: false,
        valid: true,
        entries: [['controlled', 'on']],
      });
      const count = (await log(page, 'mixed-log')).length;

      await owner.evaluate(async (node) => {
        node.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
        await Promise.resolve();
        node.addEventListener('reset', (event) => event.preventDefault(), { once: true });
        node.reset();
        await Promise.resolve();
      });
      assert.deepEqual(await entries(owner), [['controlled', 'on']]);
      await assertMixed(local, false);

      await button(page, 'Reset mixed choices').click();
      await assertMixed(local, true);
      await assertMixed(controlled, true);
      assert.deepEqual(await entries(owner), bothOn);
      assert.equal((await log(page, 'mixed-log')).length, count);

      await local.press('Space');
      await assertMixed(local, false);
      assert.equal((await log(page, 'mixed-log')).length, count + 1);
    },

  'CheckboxGroup validates minimum before callbacks and serializes successful options in DOM order':
    async ({ page, mount }) => {
      await mount('binary-controls-forms');
      const owner = form(page, 'Minimum checkbox form');
      const alpha = checkbox(page, 'Alpha');
      const beta = checkbox(page, 'Beta');
      const submits = page.getByTestId('submits');
      assert.equal(await validity(owner), false);
      await button(page, 'Submit minimum form').focus();
      assert.equal(await validity(owner), false);
      await assertFocused(button(page, 'Submit minimum form'));
      await submission(owner);
      await assertFocused(alpha);
      assert.equal(await submits.textContent(), '0');

      await button(page, 'Clear captured custom validity').click();
      assert.deepEqual(await log(page, 'captured-validity'), [
        'Server error',
        'Select a source',
        false,
      ]);
      assert.equal(await submits.textContent(), '0');
      await alpha.evaluate((node) => {
        node.closest('label').hidden = true;
      });
      await page.waitForFunction(
        () =>
          document.querySelector('form[aria-label="Minimum checkbox form"] input[value="b"]')
            ?.validationMessage === 'Select a source',
      );
      await submission(owner);
      await assertFocused(beta);
      await owner.evaluate((node) => {
        node.querySelector('input[value="a"]').closest('label').hidden = false;
      });
      await page.waitForFunction(
        () =>
          document.querySelector('form[aria-label="Minimum checkbox form"] input[value="a"]')
            ?.validationMessage === 'Select a source',
      );

      await beta.press('Space');
      await waitForChanges(page, 'minimum-log', 1);
      await alpha.press('Space');
      await waitForChanges(page, 'minimum-log', 2);
      assert.deepEqual(await log(page, 'minimum-log'), [
        { phase: 'group', candidate: ['b'], entries: [['option', 'b']], valid: true, submits: 1 },
        {
          phase: 'group',
          candidate: ['b', 'a'],
          entries: [
            ['option', 'a'],
            ['option', 'b'],
          ],
          valid: true,
          submits: 2,
        },
      ]);

      await alpha.press('Space');
      await button(page, 'Toggle participating beta').click();
      assert.equal(await page.getByTestId('immediate-valid').textContent(), 'false');
      assert.equal(await beta.isChecked(), true);
      assert.deepEqual(await entries(owner), []);
      const countAfterDisable = await submits.textContent();
      await submission(owner);
      await assertFocused(alpha);
      assert.equal(await submits.textContent(), countAfterDisable);
      await button(page, 'Toggle participating beta').click();
      assert.equal(await page.getByTestId('immediate-valid').textContent(), 'true');

      await beta.press('Space');
      assert.deepEqual((await log(page, 'minimum-log')).at(-1), {
        phase: 'group',
        candidate: [],
        entries: [],
        valid: false,
        submits: 3,
      });
      assert.equal(await alpha.evaluate((node) => node.validationMessage), 'Select a source');
      await button(page, 'Toggle beta custom error').click();
      assert.equal(await beta.evaluate((node) => node.validationMessage), 'Application error');
      await alpha.press('Space');
      assert.equal(await alpha.evaluate((node) => node.validationMessage), '');
      assert.equal(await beta.evaluate((node) => node.validationMessage), 'Application error');

      await button(page, 'Toggle beta custom error').click();
      assert.equal(await validity(owner), true);
      await button(page, 'Toggle outer fieldset').click();
      assert.deepEqual((await log(page, 'outer-fieldset-commit')).entries, []);
      assert.deepEqual(await entries(owner), []);
      await page.waitForFunction(() => {
        const fieldset = document.querySelector('[data-testid="outer-fieldset"]');
        return fieldset?.form?.checkValidity() === false;
      });
      assert.equal(await beta.evaluate((node) => node.validationMessage), 'Select a source');
      const countWithoutAlpha = await submits.textContent();
      await submission(owner);
      await assertFocused(beta);
      assert.equal(await submits.textContent(), countWithoutAlpha);
      await button(page, 'Toggle outer fieldset').click();
      await page.waitForFunction(() => {
        const fieldset = document.querySelector('[data-testid="outer-fieldset"]');
        return fieldset?.form?.checkValidity() === true;
      });
      assert.deepEqual(await entries(owner), [['option', 'a']]);
      assert.deepEqual((await log(page, 'outer-fieldset-commit')).entries, [['option', 'a']]);
      assert.equal(await beta.evaluate((node) => node.validationMessage), '');

      await alpha.press('Space');
      assert.equal(await alpha.evaluate((node) => node.validationMessage), 'Select a source');
      await alpha.evaluate((node) => node.setAttribute('form', 'external-b'));
      await page.waitForFunction(() => {
        const fieldset = document.querySelector('[data-testid="outer-fieldset"]');
        return fieldset?.querySelector('input')?.matches(':disabled') === true;
      });
      assert.equal(await validity(form(page, 'External B')), true);
      assert.equal(await beta.evaluate((node) => node.validationMessage), 'Select a source');
      await alpha.evaluate((node) => node.removeAttribute('form'));
      await page.waitForFunction(() => {
        const fieldset = document.querySelector('[data-testid="outer-fieldset"]');
        return fieldset?.querySelector('input')?.validationMessage === 'Select a source';
      });
      assert.equal(await alpha.isDisabled(), false);
      assert.equal(await beta.evaluate((node) => node.validationMessage), '');

      await alpha.evaluate((node) => node.setCustomValidity('Application replaced group error'));
      await beta.press('Space');
      assert.equal(
        await alpha.evaluate((node) => node.validationMessage),
        'Application replaced group error',
      );
    },

  'CheckboxGroup controlled refusal and synchronous acceptance update validity with form data':
    async ({ page, mount }) => {
      await mount('binary-controls-forms');
      const owner = form(page, 'Controlled minimum form');
      const option = checkbox(page, 'Controlled option');
      const value = ['accepted'];
      const rejected = { candidate: value, entries: [], valid: false };

      await option.press('Space');
      await waitForChanges(page, 'controlled-minimum-log', 2);
      assert.equal(await option.isChecked(), false);
      assert.deepEqual(await log(page, 'controlled-minimum-log'), [
        { phase: 'proposed', ...rejected },
        { phase: 'after owner', ...rejected },
      ]);

      await button(page, 'Accept minimum proposal').click();
      await option.press('Space');
      await waitForChanges(page, 'controlled-minimum-log', 4);
      assert.equal(await option.isChecked(), true);
      assert.deepEqual((await log(page, 'controlled-minimum-log')).slice(2), [
        { phase: 'proposed', ...rejected },
        { phase: 'after owner', candidate: value, entries: [['minimum', 'accepted']], valid: true },
      ]);
      await resetForm(owner);
      assert.equal(await option.isChecked(), true);
      assert.equal(await validity(owner), true);
      assert.equal((await log(page, 'controlled-minimum-log')).length, 4);
    },

  'Binary groups isolate owners, allow independent layout children and preserve the first legend':
    async ({ page, mount }) => {
      await mount('binary-controls-forms');
      const a = form(page, 'External A');
      const b = form(page, 'External B');
      const portalOwner = form(page, 'Portal owner');
      const portal = checkbox(page, 'Portal member');
      const independent = [['independent', 'on']];
      const chosenA = [['setting', 'a'], ...independent];
      const chosenB = [['setting', 'b'], ...independent];

      assert.deepEqual(await entries(a), chosenA);
      assert.deepEqual(await entries(b), independent);
      assert.deepEqual(await entries(portalOwner), [['portal', 'local']]);
      assert.equal(await portal.isDisabled(), true);
      await button(page, 'Move portal to group').click();
      assert.equal(await portal.isDisabled(), false);
      assert.deepEqual(await entries(portalOwner), [
        ['portal', 'local'],
        ['portal', 'portal'],
      ]);

      await checkbox(page, 'Independent A').press('Space');
      await checkbox(page, 'Independent B').press('Space');
      await page.getByRole('switch', { name: 'Setting A' }).press('Space');
      await page.getByRole('switch', { name: 'Setting B' }).press('Space');
      assert.deepEqual(await entries(a), [['setting', 'b']]);
      assert.deepEqual(await entries(b), []);

      await resetForm(b);
      assert.deepEqual(await entries(a), [['setting', 'b']]);
      assert.deepEqual(await entries(b), independent);
      await button(page, 'Move group owner').click();
      assert.deepEqual(await entries(a), []);
      assert.deepEqual(await entries(b), chosenB);

      await resetForm(a);
      assert.deepEqual(await entries(a), independent);
      assert.deepEqual(await entries(b), chosenB);
      await resetForm(b);
      assert.deepEqual(await entries(a), independent);
      assert.deepEqual(await entries(b), chosenA);
      assert.equal(await checkbox(page, 'Legend selection').isDisabled(), false);
      assert.equal(await checkbox(page, 'Disabled body selection').isDisabled(), true);
      assert.deepEqual(await entries(form(page, 'Legend form')), [['inside', 'on']]);
    },
};

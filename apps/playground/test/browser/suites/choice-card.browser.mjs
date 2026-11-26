import assert from 'node:assert/strict';
import { assertFocused, pressKeys, resetForm } from '../helpers.mjs';

const dots = '.unica-radio-dot';
const entries = (form) => form.evaluate((element) => [...new FormData(element)]);
const readLog = async (scope, key) => JSON.parse(await scope.getByTestId(key).textContent());
const formByName = (page, name) => page.getByRole('form', { name, exact: true });

async function assertAvailableLink(page, name) {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = await session.send('Accessibility.getFullAXTree');
    const links = nodes.filter((node) => node.role?.value === 'link' && node.name?.value === name);
    assert.ok(links.length > 0);
    for (const link of links) {
      assert.equal(
        link.properties?.some(
          (property) => property.name === 'disabled' && property.value?.value === true,
        ),
        false,
      );
    }
  } finally {
    await session.detach();
  }
}

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
  return form.locator('.unica-choice-card-hit');
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
          (input) => getComputedStyle(input.closest('.unica-choice-card')).outlineWidth,
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
  'ChoiceCard Switch pending retains the accepted value and follows fieldset availability': async ({
    page,
    mount,
  }) => {
    await mount('choice-card');
    const form = formByName(page, 'Pending integration');
    const input = form.getByRole('switch', { name: 'Sync updates' });
    const spinner = form.locator('.unica-switch-thumb-icon svg');
    const toggle = form.getByRole('button', { name: 'Toggle integration availability' });
    await input.press('Enter');
    await spinner.waitFor({ state: 'visible' });
    await assertFocused(input);
    await input.press('Space');
    await input.press('Enter');
    assert.deepEqual(await readLog(form, 'pending-log'), { proposals: [false], submissions: 0 });
    assert.equal(await input.getAttribute('aria-busy'), 'true');
    assert.deepEqual(await entries(form), [['sync', 'on']]);

    await toggle.click();
    await spinner.waitFor({ state: 'hidden' });
    assert.equal(await input.getAttribute('aria-busy'), null);
    assert.equal(await input.isChecked(), true);
    assert.deepEqual(await entries(form), []);
    await toggle.click();
    await spinner.waitFor({ state: 'visible' });
    await form.getByRole('button', { name: 'Reject update' }).click();
    await spinner.waitFor({ state: 'hidden' });
    assert.deepEqual(await entries(form), [['sync', 'on']]);
    await input.press('Space');
    await spinner.waitFor({ state: 'visible' });
    await form.getByRole('button', { name: 'Confirm update' }).click();
    await spinner.waitFor({ state: 'hidden' });
    assert.deepEqual(await entries(form), []);
    await input.press('Enter');
    await spinner.waitFor({ state: 'visible' });
    assert.deepEqual(await readLog(form, 'pending-log'), {
      proposals: [false, false, true],
      submissions: 0,
    });
    await form.getByRole('button', { name: 'Confirm update' }).click();
    await spinner.waitFor({ state: 'hidden' });
    assert.deepEqual(await entries(form), [['sync', 'on']]);
  },

  'ChoiceCard radio skips the unavailable primary but preserves secondary Tab order': async ({
    page,
    mount,
  }) => {
    await mount('choice-card');
    for (const name of ['Card radio entry', 'Mixed radio entry']) {
      const form = formByName(page, name);
      const before = form.getByRole('button', { name: 'Before choices' });
      const after = form.getByRole('button', { name: 'After choices' });
      const terms = form.getByRole('link', { name: 'Terms A' });
      const available = form.getByRole('radio', { name: 'Available policy', exact: true });
      const unavailable = form.getByRole('radio', { name: 'Unavailable policy' });
      await before.focus();
      for (const target of [terms, available, after]) {
        await pressKeys(page, 'Tab');
        await assertFocused(target);
      }
      for (const target of [available, terms, before]) {
        await pressKeys(page, 'Shift+Tab');
        await assertFocused(target);
      }
      assert.equal(await unavailable.isChecked(), true);
      assert.deepEqual(await entries(form), []);
      await terms.press('Enter');
      assert.deepEqual(await readLog(form, 'entry-log'), { terms: 1, changes: 0 });
      await available.press('End');
      await form
        .getByTestId('entry-log')
        .filter({ hasText: '"changes":1' })
        .waitFor({ state: 'attached' });
      assert.deepEqual(await entries(form), [['radio-entry', 'b']]);
      assert.deepEqual(await readLog(form, 'entry-log'), { terms: 1, changes: 1 });
    }
  },

  'ChoiceCard keeps disclosure links available when a radio group is disabled': async ({
    page,
    mount,
  }) => {
    await mount('choice-card');
    for (const name of ['Card radio entry', 'Mixed radio entry']) {
      const form = formByName(page, name);
      const terms = form.getByRole('link', { name: 'Terms A' });
      const group = form.getByRole('radiogroup', { name: 'Entry policies' });
      const available = group.getByRole('radio', { name: 'Available policy', exact: true });
      const toggle = form.getByRole('button', { name: 'Toggle radio availability' });
      await toggle.click();
      assert.equal(await group.getAttribute('aria-disabled'), null);
      assert.equal(await available.isDisabled(), true);
      await assertAvailableLink(page, 'Terms A');
      await terms.press('Enter');
      await terms.click();
      assert.deepEqual(await readLog(form, 'entry-log'), { terms: 2, changes: 0 });
      assert.deepEqual(await entries(form), []);
      await toggle.click();
      assert.equal(await available.isEnabled(), true);
    }
  },

  'ChoiceCard checkbox distinguishes form validation, selection and independent actions': async ({
    page,
    mount,
  }) => {
    await mount('choice-card');
    for (const prefix of ['Card', 'Compact']) {
      const form = formByName(page, prefix + ' checkbox form');
      const group = page.getByRole('group', { name: prefix + ' included formats' });
      const input = group.getByRole('checkbox', { name: 'PDF', exact: true });
      const terms = group.getByRole('link', { name: 'Read terms' });
      const submit = form.getByRole('button', { name: 'Submit options' });
      const log = () => readLog(form, 'checkbox-log');

      await submit.click();
      await assertFocused(input);
      assert.deepEqual(await log(), { choices: [], terms: 0, changes: 0, submissions: 0 });
      await cardTargets(group)
        .first()
        .click({ position: { x: 58, y: 5 } });
      await terms.click();
      await submit.click();
      assert.deepEqual(await entries(form), [['include', 'pdf']]);
      assert.deepEqual(await log(), { choices: [true], terms: 1, changes: 1, submissions: 1 });

      const inert = form.getByRole('button', { name: 'Cycle inert' });
      for (const position of ['card', 'parent']) {
        await inert.click();
        const card = group.locator('input[value="pdf"]');
        const link = group.locator('a[href="#terms"]');
        for (const target of [card, link]) {
          assert.equal(
            await target.evaluate((element) => {
              element.focus();
              return element.ownerDocument.activeElement === element;
            }),
            false,
            position,
          );
          const box = await target.boundingBox();
          assert.ok(box, position);
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        }
        assert.deepEqual(await log(), { choices: [true], terms: 1, changes: 1, submissions: 1 });
        assert.deepEqual(await entries(form), [['include', 'pdf']]);
      }
      await inert.click();
      await input.waitFor();

      await form.getByRole('button', { name: 'Toggle group' }).click();
      assert.equal(await group.getAttribute('aria-disabled'), null);
      assert.equal(await input.isDisabled(), true);
      assert.equal(await terms.isEnabled(), true);
      await assertAvailableLink(page, 'Read terms');
      await terms.press('Enter');
      assert.deepEqual(await entries(form), []);
      assert.deepEqual(await log(), { choices: [true], terms: 2, changes: 1, submissions: 1 });
      assert.equal(await group.getByRole('button', { name: 'Configure' }).isDisabled(), true);

      const toggleTerms = form.getByRole('button', { name: 'Toggle terms' });
      await toggleTerms.click();
      await group.and(page.locator('[aria-disabled="true"]')).waitFor();
      await toggleTerms.click();
      await terms.waitFor();
      assert.equal(await group.getAttribute('aria-disabled'), null);
      await form.getByRole('button', { name: 'Toggle group' }).click();
      assert.equal(await input.isEnabled(), true);
      assert.deepEqual(await entries(form), [['include', 'pdf']]);
      await resetForm(form);
      assert.deepEqual(await entries(form), []);
      assert.deepEqual(await log(), { choices: [true], terms: 2, changes: 1, submissions: 1 });
    }
  },

  'ChoiceCard Switch shares controlled proposals and commitment with a compact Switch': async ({
    page,
    mount,
  }) => {
    await mount('choice-card');
    const form = formByName(page, 'Mixed notifications');
    const compact = form.getByRole('switch', { name: 'Email' });
    const card = form.getByRole('switch', { name: 'Digest' });
    await cardTargets(form).click();
    assert.equal(await card.isChecked(), false);
    assert.equal(await compact.isChecked(), true);
    assert.deepEqual(await entries(form), [['notify', 'mail']]);
    assert.deepEqual(await readLog(form, 'proposals'), [['mail', 'digest']]);
    await form.getByRole('button', { name: 'Accept notification changes' }).click();
    await cardTargets(form).click();
    assert.equal(await card.isChecked(), true);
    assert.equal(await compact.isChecked(), true);
    assert.deepEqual(await entries(form), [
      ['notify', 'mail'],
      ['notify', 'digest'],
    ]);
    await compact.press('Space');
    assert.equal(await card.isChecked(), true);
    assert.equal(await compact.isChecked(), false);
    assert.deepEqual(await entries(form), [['notify', 'digest']]);
    assert.deepEqual(await readLog(form, 'proposals'), [
      ['mail', 'digest'],
      ['mail', 'digest'],
      ['digest'],
    ]);
    const toggle = form.getByRole('button', { name: 'Toggle notifications availability' });
    await toggle.click();
    assert.equal(await card.isDisabled(), true);
    const group = page.locator('[role="group"][aria-label="Notifications"]');
    const terms = form.getByRole('link', { name: 'Notification schedule' });
    assert.equal(await terms.isEnabled(), true);
    assert.deepEqual(await entries(form), []);

    await group.evaluate((node) => {
      node.parentElement.inert = true;
    });
    assert.equal(await group.getAttribute('aria-disabled'), null);
    await group.evaluate((node) => {
      node.parentElement.inert = false;
    });
    await group.and(page.locator(':not([aria-disabled])')).waitFor();
    await assertAvailableLink(page, 'Notification schedule');

    await page.addStyleTag({
      content: '@media (max-width: 800px) { a[href="#schedule"] { display: none; } }',
    });
    await terms.waitFor({ state: 'hidden' });
    await toggle.click();
    await toggle.click();
    assert.equal(await group.getAttribute('aria-disabled'), null);
    await page.setViewportSize({ width: 950, height: 600 });
    await terms.waitFor();
    await assertAvailableLink(page, 'Notification schedule');
  },

  'ChoiceCard keeps an independent link available after a modal closes': async ({
    page,
    mount,
  }) => {
    await mount('choice-card');
    await page.getByRole('button', { name: 'Open unrelated modal' }).click();
    const modal = page.getByRole('dialog', { name: 'Unrelated modal' });
    await modal.getByRole('button', { name: 'Mount background choices' }).click();
    await modal.getByRole('button', { name: 'Close unrelated modal' }).click();

    const group = page.getByRole('group', { name: 'Background options' });
    const terms = group.getByRole('link', { name: 'Read preview conditions' });
    await terms.waitFor();
    assert.equal(await group.getAttribute('aria-disabled'), null);
    assert.equal(
      await group.getByRole('checkbox', { name: 'Include the preview' }).isDisabled(),
      true,
    );
    await assertAvailableLink(page, 'Read preview conditions');
    await terms.press('Enter');
    await page.getByText('Preview conditions opened').waitFor();
  },

  'ChoiceCard leaves nested secondary gaps clickable and keeps short horizontal options together':
    async ({ page, mount }) => {
      await mount('choice-card');
      const form = formByName(page, 'Card checkbox form');
      const group = page.getByRole('group', { name: 'Card included formats' });
      const terms = group.getByRole('link', { name: 'Read terms' });
      await terms.scrollIntoViewIfNeeded();
      const link = await terms.boundingBox();
      const configure = await group.getByRole('button', { name: 'Configure' }).boundingBox();
      assert.ok(link && configure);
      assert.ok(link.height >= 24);
      const gap = configure.x - (link.x + link.width);
      assert.ok(gap >= 24);
      await page.mouse.click(link.x + link.width + gap / 2, link.y + link.height / 2);
      assert.deepEqual(await entries(form), [['include', 'pdf']]);
      assert.deepEqual(await readLog(form, 'checkbox-log'), {
        choices: [true],
        terms: 0,
        changes: 1,
        submissions: 0,
      });

      const cards = page
        .getByRole('group', { name: 'Short choices' })
        .locator('.unica-choice-card');
      const [first, second] = await cards.evaluateAll((nodes) =>
        nodes.map((card) => ({ left: card.offsetLeft, top: card.offsetTop })),
      );
      assert.equal(first.top, second.top);
      assert.ok(first.left < second.left);
    },
  'ChoiceCard preserves material, marker and focus in the browser color and motion modes': async ({
    page,
    mount,
  }) => {
    const selected = () =>
      formByName(page, 'Native start').getByRole('radio', { name: 'First answer' });
    const appearance = (input) =>
      input.evaluate((element) => {
        const card = element.closest('.unica-choice-card');
        const marker = card.querySelector('.unica-radio-indicator');
        const plate = getComputedStyle(card);
        const mark = getComputedStyle(marker);
        return {
          background: plate.backgroundColor,
          radius: plate.borderTopLeftRadius,
          border: plate.borderTopStyle,
          outline: plate.outlineWidth,
          outlineOffset: plate.outlineOffset,
          markerRadius: mark.borderTopLeftRadius,
          markerOutline: mark.outlineStyle,
          motion: plate.transitionDuration,
        };
      });

    await mount('choice-card', { theme: 'frost-light' });
    const base = await appearance(selected());
    await mount('choice-card', { theme: 'frost-light', surface: 'overlay' });
    const overlay = await appearance(selected());
    assert.notEqual(overlay.background, base.background);

    await mount('choice-card', {
      theme: 'pixel-light',
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    const form = formByName(page, 'Native start');
    await form.getByRole('button', { name: 'Reset answer' }).focus();
    await pressKeys(page, 'Tab');
    await assertFocused(selected());
    const focused = await appearance(selected());
    assert.equal(focused.radius, '0px');
    assert.equal(focused.markerRadius, '50%');
    assert.equal(focused.markerOutline, 'none');
    assert.equal(focused.outline, '2px');
    assert.equal(focused.outlineOffset, '2px');
    assert.equal(focused.motion, '0s');
    const unavailable = formByName(page, 'Card radio entry').getByRole('radio', {
      name: 'Unavailable policy',
    });
    assert.equal((await appearance(unavailable)).border, 'dashed');

    const setting = formByName(page, 'Pending integration');
    await setting.getByRole('switch', { name: 'Sync updates' }).press('Enter');
    const spinner = setting.locator('.unica-switch-thumb-icon svg');
    await spinner.waitFor();
    assert.equal(
      await spinner.evaluate((element) => getComputedStyle(element).animationName),
      'none',
    );
  },

  'ChoiceCard Playground isolates the subject and its state across themes': async ({
    page,
    origin,
  }) => {
    const examples = [
      ['checkbox-card', 'checkbox', 'Archive completed exports'],
      ['switch-card', 'switch', 'Release summaries'],
      ['radio-card', 'radio', 'Daily backup'],
    ];
    for (const [item, role, name] of examples) {
      await page.goto(`${origin}/?item=${item}&tab=playground&family=soft&scheme=both`);
      await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 15000 });
      const artboards = page.locator('.wb-artboard');
      const subject = artboards.getByRole(role, { name, exact: true });
      await subject.first().waitFor();
      assert.equal(await subject.count(), 2);
      assert.equal(await artboards.locator('form, .wb-inspector-form-actions').count(), 0);
      assert.equal(await page.getByText('Submit an example to inspect its values.').count(), 0);

      await subject.first().press('Space');
      assert.equal(await subject.first().isChecked(), true);
      assert.equal(await subject.last().isChecked(), false);
      if (role === 'radio') {
        const weekly = artboards.getByRole('radio', { name: 'Weekly backup' });
        assert.equal(await weekly.first().isChecked(), false);
        assert.equal(await weekly.last().isChecked(), true);
      }
    }
  },

  'ChoiceCard validation uses frame actions and preserves comparison focus': async ({
    page,
    origin,
  }) => {
    const examples = [
      ['checkbox', 'PDF documents', 'Select at least one export format.'],
      ['radio', 'Extended · 365 days', 'Choose a policy to continue.'],
    ];
    for (const [kind, answer, message] of examples) {
      await page.goto(
        `${origin}/?item=${kind}-card&tab=states&block=validation&family=soft&scheme=both`,
      );
      await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 15000 });
      const frame = page.locator('[data-wb-block="validation"]');
      const toolbar = frame.locator('.wb-story-toolbar');
      const check = toolbar.getByRole('button', { name: 'Check selection' });
      const reset = toolbar.getByRole('button', { name: 'Reset', exact: true });
      const artboards = frame.locator('.wb-artboard');
      const choices = artboards.getByRole(kind, { name: answer });
      const errors = artboards.getByText(message, { exact: true });
      const confirmations = artboards.getByText(`Confirmed: ${answer}.`, { exact: true });

      await choices.first().waitFor();
      assert.equal(await choices.count(), 2);
      assert.equal(await artboards.locator('form button').count(), 0);
      await check.press('Enter');
      assert.equal(await errors.count(), 2);
      assert.equal(await confirmations.count(), 0);
      await assertFocused(check);

      await choices.first().press('Space');
      await check.click();
      assert.equal(await errors.count(), 1);
      assert.equal(await confirmations.count(), 1);
      assert.equal(await choices.last().isChecked(), false);

      await reset.click();
      assert.equal(await choices.first().isChecked(), false);
      assert.equal(await errors.count(), 0);
      assert.equal(await confirmations.count(), 0);
      await assertFocused(reset);
    }

    await page.goto(
      `${origin}/?item=radio-card&tab=states&block=validation&family=soft&scheme=dark`,
    );
    await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 15000 });
    const study = page.locator('[data-wb-block="validation"]');
    await study.getByRole('button', { name: 'Check selection' }).press('Enter');
    assert.equal(await study.getByText('Choose a policy to continue.', { exact: true }).count(), 1);
    await assertFocused(study.getByRole('radio', { name: 'Standard · 90 days' }));
  },
};

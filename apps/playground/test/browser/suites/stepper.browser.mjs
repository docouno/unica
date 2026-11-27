import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys, resetForm, submitForm } from '../helpers.mjs';

const map = (page) => page.getByRole('group', { name: 'Import stages' });
const row = (page, key) => map(page).locator(`li#${key}`);
const action = (page, key) => row(page, key).getByRole('button');
const disclosure = (page) => map(page).getByRole('button', { name: /All steps|عرض المراحل/ });
const summary = (page) => map(page).locator('.unica-stepper-summary-copy');
const fullList = (page) => map(page).locator('ol');
const after = (page) => page.getByRole('button', { name: 'After', exact: true });
const before = (page) => page.getByRole('textbox', { name: 'Before', exact: true });
const requests = (page) => page.getByTestId('requests').textContent();
const current = (page) => map(page).locator('[aria-current="step"]:visible');

async function change(page, options) {
  await page.evaluate((patch) => window.stepperProbe.update(patch), options);
}

async function waitForFocus(locator) {
  await locator.and(locator.page().locator(':focus')).waitFor();
  await assertFocused(locator);
}

async function resizeContainer(page, width) {
  await page.getByTestId('map-container').evaluate((node, size) => {
    node.style.inlineSize = `${size}px`;
  }, width);
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
}

async function holdEnter(page) {
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
}

export default {
  'Stepper uses native action order, deduplicates held Enter and leaves a refused action focused':
    async ({ page, mount }) => {
      await mount('stepper');
      await change(page, { localized: false });
      assert.equal(await current(page).getAttribute('id'), 'B');
      assert.equal(await row(page, 'B').getByRole('button').count(), 0);
      assert.equal(await row(page, 'D').getByRole('button').count(), 0);
      await before(page).focus();
      await pressKeys(page, 'Tab', 'ArrowRight');
      await assertFocused(action(page, 'A'));
      await holdEnter(page);
      assert.equal(await requests(page), 'A');
      assert.equal(await current(page).getAttribute('id'), 'B');
      await assertFocused(action(page, 'A'));
      await pressKeys(page, 'Enter', 'Tab');
      await assertFocused(action(page, 'C'));
      await pressKeys(page, 'Space', 'Tab');
      await assertFocused(after(page));
      assert.equal(await requests(page), 'A,A,C');

      await change(page, { accept: 'yes' });
      await action(page, 'A').press('Enter');
      await assertFocused(row(page, 'A'));
      assert.equal(await current(page).getAttribute('id'), 'A');
      assert.equal(
        await row(page, 'A')
          .locator('.unica-stepper-marker')
          .evaluate((node) => getComputedStyle(node).outlineWidth),
        '2px',
      );
      await pressKeys(page, 'Tab');
      await assertFocused(action(page, 'C'));
      assert.equal(await requests(page), 'A,A,C,A');
      assert.equal(await page.getByTestId('submissions').textContent(), '0');
    },

  'Stepper recovers a delayed commit only while it owns focus, including an app redirect': async ({
    page,
    mount,
  }) => {
    await mount('stepper');
    await action(page, 'A').press('Enter');
    await assertFocused(action(page, 'A'));
    await change(page, { value: 'A' });
    await assertFocused(row(page, 'A'));

    await change(page, { value: 'B' });
    await action(page, 'A').press('Enter');
    await after(page).evaluate((node) => {
      node.addEventListener('pointerdown', (event) => event.preventDefault(), { once: true });
    });
    await after(page).click();
    await assertFocused(action(page, 'A'));
    await change(page, { value: 'A' });
    await assertFocused(row(page, 'A'));

    await change(page, { value: 'B' });
    await action(page, 'A').press('Enter');
    await after(page).focus();
    await change(page, { value: 'A' });
    await assertFocused(after(page));

    await change(page, { value: 'B', accept: 'redirect' });
    await action(page, 'C').press('Space');
    await assertFocused(after(page));
    assert.equal(await current(page).getAttribute('id'), 'C');

    await change(page, { value: 'B', accept: 'yes' });
    await action(page, 'A').click();
    assert.equal(await current(page).getAttribute('id'), 'A');
    assert.equal(await row(page, 'A').evaluate((node) => node.matches(':focus-visible')), false);

    const next = page.getByRole('button', { name: 'External next' });
    await next.press('Enter');
    await assertFocused(next);
    assert.equal(await current(page).getAttribute('id'), 'D');
    assert.equal(await requests(page), 'A,A,A,C,A');
  },

  'Stepper respects an explicit blur before a deferred commit or a simultaneous resize': async ({
    page,
    mount,
  }) => {
    await mount('stepper');
    const bodyOwnsFocus = () => page.evaluate(() => document.activeElement === document.body);
    await action(page, 'A').press('Enter');
    await page.evaluate(() => {
      document.activeElement.blur();
      window.stepperProbe.update({ value: 'A' });
    });
    assert.equal(await current(page).getAttribute('id'), 'A');
    assert.equal(await bodyOwnsFocus(), true);

    await change(page, { value: 'B' });
    await action(page, 'A').focus();
    await page.evaluate(() => {
      document.activeElement.blur();
      window.stepperProbe.update({ width: 330 });
    });
    assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'false');
    assert.equal(await bodyOwnsFocus(), true);

    await resizeContainer(page, 650);
    await action(page, 'A').focus();
    await page.getByTestId('map-container').evaluate((container) => {
      document.activeElement.blur();
      container.style.inlineSize = '330px';
    });
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
    assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'false');
    assert.equal(await fullList(page).isVisible(), false);
    assert.equal(await bodyOwnsFocus(), true);
  },

  'Stepper keeps an interactive list open through reflow and recovers from a disappearing disclosure':
    async ({ page, mount }) => {
      await mount('stepper');
      await action(page, 'A').focus();
      await resizeContainer(page, 330);
      await page.waitForFunction(
        () =>
          document.querySelector('.unica-stepper-disclosure')?.getAttribute('aria-expanded') ===
          'true',
      );
      await assertFocused(action(page, 'A'));
      assert.equal(await current(page).count(), 1);
      assert.equal(await current(page).getAttribute('id'), 'B');
      await resizeContainer(page, 650);
      await disclosure(page).waitFor({ state: 'hidden' });
      await assertFocused(action(page, 'A'));

      await resizeContainer(page, 330);
      await disclosure(page).focus();
      await holdEnter(page);
      assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'false');
      assert.equal(await fullList(page).isVisible(), false);
      await pressKeys(page, 'Enter');
      assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'true');
      assert.equal(await fullList(page).isVisible(), true);
      await resizeContainer(page, 650);
      await waitForFocus(row(page, 'B'));
      assert.equal(await requests(page), '');
    },

  'Stepper focuses a passive summary on reflow and uses the next available fallback when it expands':
    async ({ page, mount }) => {
      await mount('stepper');
      await change(page, { accept: 'yes' });
      await action(page, 'A').press('Enter');
      await assertFocused(row(page, 'A'));
      await change(page, { allowReturn: false, width: 330 });
      await waitForFocus(summary(page));
      assert.equal(await disclosure(page).count(), 0);
      assert.equal(await fullList(page).isVisible(), false);
      assert.equal(await current(page).count(), 1);
      assert.equal(
        await summary(page).evaluate((node) => getComputedStyle(node).outlineWidth),
        '2px',
      );

      await change(page, { width: 650, value: null });
      await waitForFocus(fullList(page));
      await pressKeys(page, 'Tab');
      await assertFocused(after(page));

      await change(page, { width: 330, allowReturn: true, value: null });
      assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'false');
      await disclosure(page).focus();
      await resizeContainer(page, 650);
      await waitForFocus(action(page, 'A'));
      const other = page.getByRole('group', { name: 'Another process' }).getByRole('button');
      await other.focus();
      await resizeContainer(page, 330);
      await assertFocused(other);
      assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'false');
    },

  'Stepper unfolds again when a list fallback owns focus after a responsive round trip': async ({
    page,
    mount,
  }) => {
    await mount('stepper');
    await change(page, { width: 330, value: null, order: ['B', 'D'] });
    await disclosure(page).focus();
    await resizeContainer(page, 650);
    await waitForFocus(fullList(page));

    await resizeContainer(page, 330);
    await waitForFocus(fullList(page));
    assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'true');
    assert.equal(await map(page).getByRole('list').count(), 1);
    await disclosure(page).press('Enter');
    assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'false');
    assert.equal(await map(page).getByRole('list').count(), 0);
    assert.match(await summary(page).ariaSnapshot(), /من 2 اكتمل 0/);
  },

  'Stepper preserves a moved row, recovers removed actions, and never restores an abandoned request':
    async ({ page, mount }) => {
      await mount('stepper');
      await action(page, 'A').press('Enter');
      const original = await row(page, 'A').elementHandle();
      await change(page, { order: ['B', 'C', 'A', 'D'] });
      assert.equal(
        await row(page, 'A').evaluate((node, previous) => node === previous, original),
        true,
      );
      await waitForFocus(action(page, 'A'));
      await change(page, { order: ['B', 'C', 'D'] });
      await waitForFocus(row(page, 'B'));

      await after(page).focus();
      await change(page, { order: ['A', 'B', 'C', 'D'], value: 'A' });
      await assertFocused(after(page));
      await action(page, 'C').focus();
      await change(page, { allowReturn: false });
      await waitForFocus(row(page, 'C'));
      await resizeContainer(page, 330);
      await waitForFocus(summary(page));
      await before(page).focus();
      await resizeContainer(page, 650);
      await assertFocused(before(page));
    },

  'Stepper uses one readable projection and localizes names, position, markers and corrections':
    async ({ page, mount }) => {
      await mount('stepper', { textScale: 120, direction: 'rtl' });
      await change(page, { width: 330, direction: 'rtl', oppositeCopy: true });
      assert.equal(await current(page).count(), 1);
      assert.match(await summary(page).ariaSnapshot(), /المجموع 4 · الحالية 2/);
      assert.match(await summary(page).ariaSnapshot(), /راجع Commit/);
      assert.equal(
        await summary(page).getByText('Verify', { exact: true }).getAttribute('lang'),
        'en',
      );
      assert.equal(
        await summary(page).getByText('Verify', { exact: true }).getAttribute('dir'),
        'ltr',
      );
      assert.equal(await map(page).getByRole('list').count(), 0);
      await disclosure(page).press('Space');
      assert.equal(await map(page).getByRole('list').count(), 1);
      assert.equal(await current(page).getAttribute('id'), 'B');
      assert.equal(await row(page, 'B').locator('.unica-stepper-marker').textContent(), '٢');
      const readableTitle = row(page, 'B').locator(
        '.unica-visually-hidden bdi[lang="en"][dir="ltr"]',
      );
      assert.equal(await readableTitle.textContent(), 'Verify');
      const readableCorrection = row(page, 'C').locator(
        '.unica-stepper-issue .unica-visually-hidden bdi[lang="en"][dir="ltr"]',
      );
      assert.equal(await readableCorrection.textContent(), 'Choose a destination.');
      assert.ok(await action(page, 'A').getAttribute('aria-labelledby'));
      assert.match(await action(page, 'A').ariaSnapshot(), /Source · 1 · مكتمل/);
      assert.equal(await action(page, 'C').getAttribute('type'), 'button');
      assert.equal(
        await action(page, 'C').evaluate(
          (node) => document.getElementById(node.getAttribute('aria-describedby'))?.textContent,
        ),
        'تنبيه · Choose a destination.',
      );
      assert.equal((await map(page).ariaSnapshot()).match(/Verify · 2/g)?.length, 1);

      await change(page, { order: ['A', 'C'], value: null, firstStatus: 'danger' });
      assert.match(await action(page, 'A').ariaSnapshot(), /Source · 1"/);
      assert.match(
        await action(page, 'A').evaluate(
          (node) => document.getElementById(node.getAttribute('aria-describedby'))?.textContent,
        ),
        /تتطلب مراجعة/,
      );
      await disclosure(page).press('Enter');
      assert.match(await summary(page).ariaSnapshot(), /من 2 اكتمل 0/);
      assert.equal(await current(page).count(), 0);
      await change(page, { order: ['A'], firstStatus: 'neutral' });
      assert.match(await summary(page).ariaSnapshot(), /اكتملت المراحل/);
      assert.equal(await fullList(page).locator('.unica-stepper-connector').count(), 0);
      await change(page, { order: [] });
      assert.equal(await map(page).count(), 0);
    },

  'Stepper isolates a bidirectional name when composing the compact correction': async ({
    page,
    mount,
  }) => {
    await mount('stepper');
    await change(page, {
      width: 330,
      localized: false,
      firstStatus: 'danger',
      firstLabel: 'ܐ 123 ܒ!',
    });
    const text = summary(page).locator('.unica-stepper-summary-issue bdi > bdi').first();
    assert.equal(await text.textContent(), 'ܐ 123 ܒ!');
    assert.equal(await text.evaluate((node) => getComputedStyle(node).direction), 'rtl');
    assert.match(await summary(page).ariaSnapshot(), /Check ܐ 123 ܒ!/);
  },

  'Stepper buttons honor disabled fieldset, the first legend and native form submission and reset':
    async ({ page, mount }) => {
      await mount('stepper');
      await change(page, { controlled: false, localized: false, width: 330 });
      const form = page.getByTestId('stepper-form');
      await disclosure(page).press('Enter');
      await action(page, 'A').press('Space');
      await assertFocused(row(page, 'A'));
      await before(page).fill('Edited');
      assert.equal(await page.getByTestId('submissions').textContent(), '0');
      assert.deepEqual(await submitForm(form, page.getByRole('button', { name: 'Save' })), [
        ['title', 'Edited'],
      ]);
      await resetForm(form);
      assert.equal(await before(page).inputValue(), 'Original');
      assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'true');
      assert.equal(await current(page).getAttribute('id'), 'A');

      await disclosure(page).focus();
      await change(page, { disabled: true });
      await waitForFocus(row(page, 'A'));
      assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'true');
      const correction = action(page, 'C');
      assert.ok(await correction.isDisabled());
      assert.ok(await disclosure(page).isDisabled());
      const states = () =>
        correction.evaluate((node) => [
          getComputedStyle(node).cursor,
          getComputedStyle(node.querySelector('.unica-stepper-title-text')).textDecorationLine,
          getComputedStyle(node.querySelector('.unica-stepper-marker')).backgroundColor,
        ]);
      const resting = await states();
      assert.notEqual(resting[0], 'pointer');
      assert.equal(resting[1], 'none');
      await correction.hover();
      await page.mouse.down();
      assert.deepEqual(await states(), resting);
      await page.mouse.up();
      assert.equal(await requests(page), 'A');
      assert.equal(await current(page).getAttribute('id'), 'A');
      await change(page, { legend: true, layout: 'vertical' });
      assert.equal(await action(page, 'A').isEnabled(), true);
      assert.equal(
        await action(page, 'A').evaluate((node) => getComputedStyle(node).cursor),
        'pointer',
      );
      await action(page, 'A').press('Enter');
      assert.equal(await requests(page), 'A,A');

      await change(page, { legend: false, layout: 'responsive', width: 650, disabled: false });
      await action(page, 'A').press('Enter');
      await assertFocused(row(page, 'A'));
      await change(page, { disabled: true });
      await resizeContainer(page, 330);
      await waitForFocus(summary(page));
      assert.equal(await disclosure(page).getAttribute('aria-expanded'), 'false');
      assert.ok(await disclosure(page).isDisabled());
    },

  'Stepper switches layout at 36em of its own text size, including a text-scale-only change':
    async ({ page, mount }) => {
      await mount('stepper');
      const threshold = async () =>
        map(page).evaluate((el) => parseFloat(getComputedStyle(el).fontSize) * 36);
      for (const scale of ['100', '120']) {
        await page.evaluate((value) => {
          document.documentElement.dataset.textScale = value;
        }, scale);
        const boundary = await threshold();
        await resizeContainer(page, boundary - 1);
        assert.equal(await disclosure(page).isVisible(), true, scale);
        await resizeContainer(page, boundary + 0.02);
        assert.equal(await disclosure(page).isVisible(), false, scale);
        assert.equal(await fullList(page).isVisible(), true, scale);
      }
      await page.evaluate(() => {
        document.documentElement.dataset.textScale = '100';
      });
      await resizeContainer(page, (await threshold()) + 4);
      await action(page, 'A').focus();
      await page.evaluate(() => {
        document.documentElement.dataset.textScale = '120';
      });
      await page.waitForFunction(
        () =>
          document.querySelector('.unica-stepper-disclosure')?.getAttribute('aria-expanded') ===
          'true',
      );
      await assertFocused(action(page, 'A'));
    },

  'Stepper hydrates its list and adopts focus already placed on the server markup': async ({
    page,
    mount,
    renderFixture,
  }) => {
    await mount('stepper-hydration');
    const host = page.getByTestId('stepper-hydration-root');
    await host.evaluate(
      (node, html) => {
        node.innerHTML = html;
      },
      await renderFixture('stepper'),
    );
    const serverRow = await row(page, 'B').elementHandle();
    assert.equal(await row(page, 'B').locator('.unica-stepper-marker').textContent(), '٢');
    assert.equal(await current(page).getAttribute('id'), 'B');
    assert.equal(
      await map(page).locator('.unica-stepper-disclosure').getAttribute('aria-controls'),
      await fullList(page).getAttribute('id'),
    );
    await before(page).focus();
    await pressKeys(page, 'Tab');
    await assertFocused(action(page, 'A'));
    await page.getByRole('button', { name: 'Hydrate Stepper' }).evaluate((node) => node.click());
    await page.waitForFunction(() => window.stepperProbe !== undefined);
    assert.equal(await page.getByTestId('stepper-hydration-errors').textContent(), '');
    assert.equal(
      await row(page, 'B').evaluate((node, original) => node === original, serverRow),
      true,
    );
    await assertFocused(action(page, 'A'));
    await change(page, { accept: 'yes' });
    await pressKeys(page, 'Enter');
    await assertFocused(row(page, 'A'));
    assert.equal(await current(page).getAttribute('id'), 'A');
    assert.equal(await requests(page), 'A');

    await change(page, { value: 'B', accept: 'no' });
    await after(page).focus();
    await resizeContainer(page, 300);
    await disclosure(page).press('Enter');
    await action(page, 'A').press('Enter');
    assert.equal(await requests(page), 'A,A');
    assert.equal(await current(page).getAttribute('id'), 'B');
    assert.equal(await row(page, 'B').locator('.unica-stepper-marker').textContent(), '٢');
  },

  'Stepper centers and mirrors connector endpoints across forced layouts, sizes and wrapped copy':
    async ({ page, mount }) => {
      await mount('stepper', { textScale: 120 });
      const near = (actual, expected, message) =>
        assert.ok(
          Math.abs(actual - expected) < 0.7,
          `${message}: ${actual} compared to ${expected}`,
        );
      const marker = (key) => row(page, key).locator('.unica-stepper-marker');
      for (const direction of ['ltr', 'rtl']) {
        for (const [size, diameter] of [
          ['s', 24],
          ['m', 32],
          ['l', 40],
        ]) {
          for (const layout of ['horizontal', 'vertical']) {
            await page.setViewportSize({ width: layout === 'vertical' ? 360 : 800, height: 600 });
            await change(page, {
              direction,
              size,
              layout,
              longText: true,
              oppositeCopy: true,
              localized: false,
            });
            const a = await getBox(marker('A'));
            const b = await getBox(marker('B'));
            const rail = await getBox(row(page, 'A').locator('.unica-stepper-connector'));
            assert.equal(a.width, diameter);
            assert.equal(b.height, diameter);
            const aRow = await getBox(row(page, 'A'));
            const bRow = await getBox(row(page, 'B'));
            if (layout === 'horizontal') {
              near(aRow.width, bRow.width, 'Equal horizontal columns');
              near(rail.y + rail.height / 2, a.y + diameter / 2, 'Horizontal rail center');
              if (direction === 'rtl') {
                near(rail.x + rail.width, a.x - 8, 'RTL outgoing end');
                near(rail.x, b.x + diameter + 8, 'RTL incoming end');
              } else {
                near(rail.x, a.x + diameter + 8, 'LTR outgoing end');
                near(rail.x + rail.width, b.x - 8, 'LTR incoming end');
              }
            } else {
              near(rail.x + rail.width / 2, a.x + diameter / 2, 'Vertical rail center');
              near(a.x, b.x, 'Marker alignment');
              near(rail.y, a.y + diameter + 8, 'Vertical outgoing end');
              near(rail.y + rail.height, b.y - 8, 'Vertical incoming end');
              const c = await getBox(marker('C'));
              const wrapped = await getBox(row(page, 'B').locator('.unica-stepper-connector'));
              near(wrapped.y + wrapped.height, c.y - 8, 'Rail after wrapped title');
            }
            const author = row(page, 'B').locator('.unica-stepper-title-text');
            assert.equal(await author.getAttribute('dir'), direction === 'ltr' ? 'rtl' : 'ltr');
          }
        }
      }
      await change(page, { layout: 'responsive', direction: 'rtl', width: 360 });
      assert.equal(await fullList(page).isVisible(), false);
      assert.equal(await map(page).evaluate((node) => node.scrollWidth <= node.clientWidth), true);
    },
};

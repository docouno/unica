import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

const hint = '[role="tooltip"]:popover-open';
const formData = (page, id = 'main-form') =>
  page.locator(`#${id}`).evaluate((form) => [...new FormData(form)]);
const command = (page, id) => page.locator(`#${id}`).evaluate((button) => button.click());
const log = async (page) => JSON.parse(await page.getByTestId('chip-log').textContent());
const single = (page) => page.getByRole('radiogroup', { name: 'Single', exact: true });
const multi = (page) => page.getByRole('group', { name: 'Multi', exact: true });
const radio = (page, name) => single(page).getByRole('radio', { name, exact: true });
const check = (page, name) => multi(page).getByRole('checkbox', { name, exact: true });

async function openWorkbenchView(page, query) {
  await page.evaluate((next) => {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(next)) {
      url.searchParams.set(key, value);
    }
    history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, query);
}

export default {
  'Chip reports committed form data inside controlled callbacks and suppresses canceled activation':
    async ({ page, mount }) => {
      await mount('chip');
      await page.locator('#main-form').evaluate((form) => {
        form.addEventListener(
          'click',
          () => {
            form.dataset.capture = JSON.stringify([...new FormData(form)]);
          },
          true,
        );
        form.addEventListener('click', (event) => {
          if (form.dataset.cancel) {
            event.preventDefault();
          }
        });
      });
      await radio(page, 'Beta').click();
      const untouched = [
        ['multi', 'b'],
        ['favorite', 'on'],
      ];
      assert.deepEqual(await formData(page), untouched);
      assert.deepEqual(await log(page), [
        `single:b:${JSON.stringify(untouched)}:${JSON.stringify(untouched)}`,
      ]);
      const canceled = async (yes) =>
        page.locator('#main-form').evaluate((form, value) => {
          if (value) {
            form.dataset.cancel = 'yes';
          } else {
            delete form.dataset.cancel;
          }
        }, yes);
      await canceled(true);
      await radio(page, 'Alpha').click();
      await page.getByRole('checkbox', { name: 'Locked value' }).click();
      await page
        .locator('label')
        .filter({ hasText: 'Blank value' })
        .evaluate((label) => label.click());
      assert.equal((await log(page)).length, 1);
      assert.deepEqual(await formData(page), untouched);
      await canceled(false);
      await page.getByRole('checkbox', { name: 'Locked value' }).click();
      assert.match((await log(page))[1], /^locked:true:/);
      assert.equal((await log(page))[2], 'change:false');
      const captured = JSON.parse(await page.locator('#main-form').getAttribute('data-capture'));
      assert.ok(captured.some(([key, value]) => key === 'locked' && value === ''));
      assert.deepEqual(await formData(page), untouched);
      await command(page, 'accept');
      await radio(page, 'Alpha').click();
      const accepted = [['facet', 'a'], ...untouched];
      assert.deepEqual(await formData(page), accepted);
      assert.equal(
        (await log(page))[3],
        `single:a:${JSON.stringify(untouched)}:${JSON.stringify(accepted)}`,
      );
      await radio(page, 'Alpha').click();
      assert.equal((await log(page)).length, 4);
      await page.getByRole('checkbox', { name: 'Blank value' }).press('Space');
      assert.equal((await formData(page)).at(-1)[1], '');
    },

  'Chip native reset works with canceled events and a following activation in the same turn':
    async ({ page, mount }) => {
      await mount('chip');
      const favorite = page.getByRole('checkbox', { name: 'Favorite', exact: true });
      await favorite.click();
      await check(page, 'Delta').click();
      await check(page, 'Alpha').click();
      assert.deepEqual(await formData(page), [
        ['multi', 'a'],
        ['multi', 'b'],
        ['multi', 'd'],
      ]);
      assert.match((await log(page)).at(-1), /^multi:b,d,a:/);
      assert.equal(
        await page.locator('#main-form').evaluate((form) => {
          form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
          form.reset();
          form.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
          return JSON.stringify([...new FormData(form)]);
        }),
        JSON.stringify([
          ['multi', 'a'],
          ['multi', 'b'],
          ['multi', 'd'],
        ]),
      );
      assert.equal(await favorite.isChecked(), false);
      const result = await page.locator('#main-form').evaluate((form) => {
        form.reset();
        const entries = [...new FormData(form)];
        form.querySelector('[name="favorite"]').click();
        form.querySelector('[name="multi"][value="a"]').click();
        return { entries, after: [...new FormData(form)] };
      });
      assert.deepEqual(result.entries, [
        ['multi', 'b'],
        ['favorite', 'on'],
      ]);
      assert.deepEqual(result.after, [
        ['multi', 'a'],
        ['multi', 'b'],
      ]);
      assert.deepEqual(
        (await log(page)).slice(-3).map((entry) => entry.split(':').slice(0, 2).join(':')),
        ['favorite:false', 'change:false', 'multi:b,a'],
      );
    },

  'ChipGroup keeps unnamed and empty groups bound to the current external form': async ({
    page,
    mount,
  }) => {
    await mount('chip');
    const externalRadio = page.getByRole('radiogroup', { name: 'External radio' });
    const externalMulti = page.getByRole('group', { name: 'External multiple' });
    const b = externalRadio.getByRole('radio', { name: 'Beta' });
    const selectB = async () => {
      await b.click();
      await externalMulti.getByRole('checkbox', { name: 'Beta' }).click();
      await externalMulti.getByRole('checkbox', { name: 'Alpha' }).click();
    };
    await selectB();
    assert.equal(await externalRadio.getByRole('radio', { name: 'Alpha' }).isChecked(), false);
    assert.deepEqual(await formData(page, 'external-form'), [
      ['export', 'b'],
      ['legend', 'on'],
      ['body', 'a'],
    ]);
    await command(page, 'empty');
    await page.locator('#external-form').evaluate((form) => {
      form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      form.reset();
      form.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
    });
    await command(page, 'empty');
    assert.equal(await b.isChecked(), true);
    assert.equal(await externalMulti.getByRole('checkbox', { name: 'Beta' }).isChecked(), true);

    await command(page, 'empty');
    await command(page, 'owner');
    await page.locator('#external-form').evaluate((form) => form.reset());
    await command(page, 'empty');
    assert.equal(await b.isChecked(), true);
    assert.deepEqual(await formData(page, 'other-form'), [['export', 'b']]);

    const before = await log(page);
    await command(page, 'empty');
    await page.locator('#other-form').evaluate((form) => form.reset());
    await command(page, 'empty');
    assert.equal(await b.isChecked(), false);
    assert.equal(await externalRadio.getByRole('radio', { name: 'Alpha' }).isChecked(), true);
    assert.deepEqual(await formData(page, 'other-form'), [['export', 'a']]);
    assert.deepEqual(await log(page), before);

    await page.locator('#ancestor').evaluate((fieldset) => {
      fieldset.disabled = true;
    });
    assert.deepEqual(await formData(page, 'external-form'), [['legend', 'on']]);
    assert.equal(await page.getByRole('checkbox', { name: 'In first legend' }).isEnabled(), true);
    assert.equal(
      await page.getByRole('group', { name: 'Body group' }).getByRole('checkbox').isEnabled(),
      false,
    );
    const focusedInert = await page.locator('#ancestor').evaluate((fieldset) => {
      fieldset.disabled = false;
      fieldset.inert = true;
      const input = fieldset.querySelector('[name="body"]');
      input.click();
      input.focus();
      return document.activeElement === input;
    });
    assert.deepEqual(await formData(page, 'external-form'), [
      ['legend', 'on'],
      ['body', 'a'],
    ]);
    assert.equal(focusedInert, false);
  },

  'ChipGroup required checkbox set is synchronously valid after native reset and delegates invalid focus':
    async ({ page, mount }) => {
      await mount('chip');
      const form = page.locator('#required-form');
      const submit = page.getByRole('button', { name: 'Submit required set' });
      const choice = page.getByRole('checkbox', { name: 'Empty key' });
      await choice.click();
      assert.equal(await form.evaluate((node) => node.checkValidity()), false);
      await submit.focus();
      assert.equal(await form.evaluate((node) => node.checkValidity()), false);
      await assertFocused(submit);
      await submit.press('Enter');
      await assertFocused(choice);
      const resetSubmit = (enableFieldset = false) =>
        form.evaluate((node, enable) => {
          let submitted = 0;
          const handle = (event) => {
            submitted++;
            event.preventDefault();
          };
          node.addEventListener('submit', handle);
          if (enable) {
            node.querySelector('#required-ancestor').disabled = false;
          }
          node.reset();
          const valid = node.checkValidity();
          node.requestSubmit();
          node.removeEventListener('submit', handle);
          return { entries: [...new FormData(node)], valid, submitted };
        }, enableFieldset);
      assert.deepEqual(await resetSubmit(), {
        entries: [['export', '']],
        valid: true,
        submitted: 1,
      });
      await command(page, 'required-default');
      await choice.click();
      assert.deepEqual(await resetSubmit(), { entries: [], valid: false, submitted: 0 });
      assert.equal(await page.getByRole('checkbox', { name: 'Unavailable' }).isChecked(), true);
      await page.locator('#required-ancestor').evaluate(async (fieldset) => {
        fieldset.disabled = true;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      assert.deepEqual(await resetSubmit(true), { entries: [], valid: false, submitted: 0 });
    },

  'ChipGroup roves radios in reading order and keeps a single Tab entry with disabled or unanswered values':
    async ({ page, mount }) => {
      for (const direction of ['ltr', 'rtl']) {
        await mount('chip', { direction });
        const before = page.getByRole('button', { name: 'Before radio group' });
        const after = page.getByRole('button', { name: 'After radio group' });
        await before.focus();
        await page.keyboard.press('Tab');
        await assertFocused(radio(page, 'Alpha'));
        assert.equal(await radio(page, 'Alpha').isChecked(), false);
        await page.keyboard.press('Tab');
        await assertFocused(after);
        await page.keyboard.press('Shift+Tab');
        await assertFocused(radio(page, 'Alpha'));
        await page.evaluate(() => {
          window.addEventListener('keydown', function observeControlHome(event) {
            if (event.key === 'Home' && event.ctrlKey) {
              document.body.dataset.ctrlHomePrevented = String(event.defaultPrevented);
              window.removeEventListener('keydown', observeControlHome);
            }
          });
        });
        await page.keyboard.press('Control+Home');
        assert.equal(await page.locator('body').getAttribute('data-ctrl-home-prevented'), 'false');
        assert.equal((await log(page)).length, 0);
        for (const count of [1, 2]) {
          await page.keyboard.press('Home');
          await page.waitForFunction(
            (expected) =>
              JSON.parse(document.querySelector('[data-testid="chip-log"]').textContent).length ===
              expected,
            count,
          );
        }
        await command(page, 'pick-beta');
        await command(page, 'disable-beta');
        await after.focus();
        await page.keyboard.press('Shift+Tab');
        await assertFocused(radio(page, 'Alpha'));
        assert.equal(await radio(page, 'Beta').isChecked(), true);
        assert.equal(
          (await formData(page)).some(([field]) => field === 'facet'),
          false,
        );
        assert.equal(
          await page.locator('#main-form').evaluate((form) => form.checkValidity()),
          false,
        );
        await page
          .locator('#main-form')
          .evaluate((form) =>
            form.addEventListener('keydown', (event) => event.preventDefault(), { once: true }),
          );
        await page.keyboard.press('End');
        await assertFocused(radio(page, 'Alpha'));
        await command(page, 'accept');
        for (const [key, expected] of [
          ['ArrowLeft', direction === 'ltr' ? 'Delta' : 'Charlie'],
          ['ArrowRight', direction === 'ltr' ? 'Charlie' : 'Delta'],
          ['ArrowDown', 'Charlie'],
          ['ArrowUp', 'Delta'],
          ['End', 'Delta'],
        ]) {
          await command(page, 'pick-alpha');
          await radio(page, 'Alpha').focus();
          const count = (await log(page)).length;
          await page.keyboard.press(key);
          await page.waitForFunction(
            (name) => document.activeElement?.labels?.[0]?.textContent === name,
            expected,
          );
          await assertFocused(radio(page, expected));
          assert.equal(await radio(page, expected).isChecked(), true);
          assert.equal((await log(page)).length, count + 1);
        }
        await check(page, 'Charlie').focus();
        await page.keyboard.press('ArrowDown');
        await assertFocused(check(page, 'Charlie'));
        assert.equal(await check(page, 'Charlie').isChecked(), false);
        await page.keyboard.down('Space');
        assert.equal(await check(page, 'Charlie').isChecked(), false);
        assert.equal(
          await check(page, 'Charlie').evaluate((input) => {
            const face = input.closest('.unica-chip').querySelector('.unica-chip-face');
            return getComputedStyle(face).getPropertyValue('--_chip-state-mix').trim();
          }),
          '14%',
        );
        await page.keyboard.up('Space');
        assert.equal(await check(page, 'Charlie').isChecked(), true);
      }
    },

  'ChipGroup preserves focused keys through reorder and recovers from removal or disable': async ({
    page,
    mount,
  }) => {
    for (const role of ['radio', 'checkbox']) {
      await mount('chip');
      const locate = role === 'radio' ? radio : check;
      await command(page, 'pick-beta');
      await locate(page, 'Beta').focus();
      await command(page, 'move-beta');
      await assertFocused(locate(page, 'Beta'));
      await command(page, 'reverse');
      await assertFocused(locate(page, 'Beta'));
      await command(page, 'disable-beta');
      await assertFocused(locate(page, 'Alpha'));
      assert.equal(await locate(page, 'Beta').isChecked(), true);
      assert.deepEqual(await log(page), []);
      await command(page, 'reset-catalog');
      await locate(page, 'Beta').focus();
      await command(page, 'disable-move-beta');
      await assertFocused(locate(page, 'Charlie'));
      assert.equal(await locate(page, 'Beta').isChecked(), true);
      assert.deepEqual(await log(page), []);
      await command(page, 'reset-catalog');
      await locate(page, 'Beta').focus();
      await command(page, 'drop-beta');
      await assertFocused(locate(page, 'Charlie'));
      await command(page, 'drop-all');
      await assertFocused(role === 'radio' ? single(page) : multi(page));
    }
    await mount('chip');
    await radio(page, 'Beta').focus();
    await page.locator('#after').focus();
    await command(page, 'drop-beta');
    await assertFocused(page.locator('#after'));
  },

  'Chip rich label Tooltip updates, fits, and dismisses before its parent overlay': async ({
    page,
    mount,
  }) => {
    await mount('chip');
    const open = page.getByRole('button', { name: 'Open full label example' });
    await open.focus();
    await open.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Full label example' });
    const control = dialog.getByRole('checkbox');
    await assertFocused(control);
    await page.locator(hint).waitFor();
    assert.equal(
      (await page.locator(hint).textContent()).trim(),
      'Platform architecture, web applications',
    );
    const snapshot = await control.ariaSnapshot();
    assert.match(snapshot, /checkbox "Platform architecture, web applications"/);
    assert.equal(await control.getAttribute('aria-describedby'), null);
    await command(page, 'rename');
    await page.waitForFunction(
      (selector) =>
        document.querySelector(selector)?.textContent?.trim() ===
        'Platform architecture, data infrastructure',
      hint,
    );
    await dialog.locator('#hint-width').evaluate((node) => {
      node.style.inlineSize = '28rem';
    });
    await page.locator(hint).waitFor({ state: 'detached' });
    await dialog.locator('#hint-width').evaluate((node) => {
      node.style.inlineSize = '9rem';
    });
    await page.locator(hint).waitFor();
    await assertFocused(control);
    await page.keyboard.press('Escape');
    await page.locator(hint).waitFor({ state: 'detached' });
    assert.equal(await dialog.isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), false);
  },

  'Chip geometry stays stable in six themes, and forced colors and coarse targets remain usable':
    async ({ page, mount }) => {
      await mount('chip');
      const geometry = await page.evaluate(() => {
        const cases = [];
        for (const theme of [
          'soft-dark',
          'soft-light',
          'frost-dark',
          'frost-light',
          'pixel-dark',
          'pixel-light',
        ]) {
          for (const surface of ['base', 'overlay']) {
            Object.assign(document.documentElement.dataset, { theme, surface });
            for (const [size, height] of [
              ['s', 20],
              ['m', 24],
              ['l', 28],
            ]) {
              const row = document.querySelector(`[data-testid="geometry-${size}"]`);
              const chips = [...row.querySelectorAll('.unica-chip')];
              const bounds = () => chips.map((chip) => chip.getBoundingClientRect().toJSON());
              const before = bounds();
              const faces = chips.slice(0, 2).map((chip) => {
                const input = chip.querySelector('input');
                input.click();
                const face = chip.querySelector('.unica-chip-face');
                return [
                  input.checked,
                  face.offsetHeight,
                  getComputedStyle(face.querySelector('.unica-chip-check')).display,
                ];
              });
              cases.push({ theme, surface, size, height, before, after: bounds(), faces });
              for (const chip of chips.slice(0, 2)) {
                chip.querySelector('input').click();
              }
            }
          }
        }
        return cases;
      });
      for (const { theme, surface, size, height, before, after, faces } of geometry) {
        const context = `${theme}/${surface} size ${size}`;
        assert.deepEqual(
          faces,
          [
            [true, height, 'block'],
            [true, height, 'block'],
          ],
          context,
        );
        assert.deepEqual(after, before, context);
      }

      await mount('chip', {
        theme: 'pixel-dark',
        forcedColors: 'active',
        reducedMotion: 'reduce',
        direction: 'rtl',
        textScale: 120,
        surface: 'overlay',
      });
      const chip = page.getByTestId('geometry-s').getByTestId('plain');
      await page.keyboard.press('Tab');
      await chip.getByRole('checkbox').focus();
      await page.keyboard.press('Space');
      assert.equal(await chip.getByRole('checkbox').isChecked(), true);
      const paint = await chip.locator('.unica-chip-face').evaluate((face) => {
        const style = getComputedStyle(face);
        return [
          style.outlineStyle,
          style.outlineWidth,
          style.transitionDuration,
          style.borderRadius,
        ];
      });
      assert.deepEqual(paint, ['solid', '2px', '0s', '0px']);

      await page.setViewportSize({ width: 360, height: 800 });
      const cdp = await page.context().newCDPSession(page);
      try {
        await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
        await page.waitForFunction(() => matchMedia('(pointer: coarse)').matches);
        const row = page.getByTestId('geometry-s');
        await row.evaluate((node) => {
          node.style.inlineSize = '100px';
        });
        const boxes = await Promise.all((await row.locator('input').all()).map(getBox));
        assert.equal(boxes.length, 4);
        assert.ok(
          boxes.every(({ width, height }) => width >= 44 && height >= 44),
          JSON.stringify(boxes),
        );
        assert.ok(boxes[1].y >= boxes[0].y + boxes[0].height + 8);
      } finally {
        await cdp.detach();
      }
    },
  'Chip Workbench keeps Playground selections independent across presets without form buttons':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1500, height: 960 });
      await mount('chip-workbench', { theme: 'frost-dark' });
      const preview = page.getByRole('region', { name: 'Preview', exact: true });
      const formActions = preview.getByRole('button', { name: /^(Submit|Reset)$/ });
      const query = { tab: 'playground', family: 'all', scheme: 'both' };

      await openWorkbenchView(page, { ...query, item: 'chip' });
      await preview.getByRole('checkbox', { name: 'Collections', exact: true }).first().waitFor();
      assert.equal(await formActions.count(), 0);

      await openWorkbenchView(page, { ...query, item: 'chip-group' });
      const groups = preview.getByRole('radiogroup', { name: 'Document format' });
      const notes = groups.first().getByRole('radio', { name: 'Notes', exact: true });
      const guides = groups.nth(1).getByRole('radio', { name: 'Guides', exact: true });
      await notes.click();
      await guides.click();
      assert.equal(await notes.isChecked(), true);
      assert.equal(await guides.isChecked(), true);
      assert.equal(await formActions.count(), 0);
    },

  'Chip Workbench Usage links to the live Folio facet and Fit submits native selections': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1500, height: 960 });
    await mount('chip-workbench', { theme: 'frost-dark' });
    const route = (query) => openWorkbenchView(page, query);
    await route({ item: 'chip-group', tab: 'usage', family: 'frost', scheme: 'dark', vp: '1280' });
    const link = page
      .getByRole('navigation', { name: 'Consuming scenes' })
      .getByRole('link', { name: /Document Collection/ });
    await link.click();
    const scene = page.locator('[data-wb-scene]');
    const facet = scene.getByRole('radiogroup', { name: 'Runbook filter' });
    const all = facet.getByRole('radio', { name: /^All/ });
    const verified = facet.getByRole('radio', { name: /^Verified/ });
    await scene.getByRole('switch', { name: 'Verified only' }).click();
    await scene.getByText(/Showing .* of 10 runbooks/).waitFor();
    assert.equal(await all.isChecked(), true);
    const next = scene
      .getByRole('navigation', { name: 'Runbook pages' })
      .getByRole('button', { name: 'Next page' });
    await next.click();
    await scene.getByText('Restore a Database Snapshot', { exact: true }).waitFor();
    await verified.click();
    await scene.getByText(/Showing .* of 6 runbooks/).waitFor();
    assert.equal(await verified.isChecked(), true);
    assert.equal(await scene.getByText('Restore a Database Snapshot', { exact: true }).count(), 0);
    await all.click();
    await scene.getByText(/Showing .* of 10 runbooks/).waitFor();
    await next.click();
    await scene.getByText('Restore a Database Snapshot', { exact: true }).waitFor();

    await route({ item: 'chip-group', tab: 'compositions', block: 'fit' });
    const fit = page.getByRole('form', { name: 'M filter controls' });
    await fit.getByText('12 results', { exact: true }).waitFor();
    await fit.getByRole('checkbox', { name: 'Favorites', exact: true }).click();
    await fit.getByRole('button', { name: 'Apply' }).click();
    await fit.getByText('25 results', { exact: true }).waitFor();
    await fit
      .getByRole('group', { name: 'Sizes' })
      .getByRole('checkbox', { name: 'S', exact: true })
      .click();
    await fit.getByRole('button', { name: 'Apply' }).click();
    await fit.getByText('41 results', { exact: true }).waitFor();

    await route({
      item: 'chip',
      tab: 'states',
      block: 'overflow',
      vp: '360',
      dir: 'rtl',
      scale: '120',
    });
    const overflow = page.getByRole('form', { name: 'Long filter options' });
    const entries = () => overflow.evaluate((form) => [...new FormData(form)]);
    assert.deepEqual(await entries(), [['topic', 'web']]);
    await overflow.getByText('Choose with full option names').click();
    assert.deepEqual(await entries(), [['topic', 'web']]);
    const name = 'Platform architecture · Data infrastructure';
    await overflow.locator('details').getByRole('checkbox', { name }).click();
    assert.equal(
      await overflow
        .getByRole('group', { name: 'Long option names' })
        .getByRole('checkbox', { name })
        .isChecked(),
      true,
    );
    assert.deepEqual(await entries(), [
      ['topic', 'web'],
      ['topic', 'data'],
    ]);
  },
};

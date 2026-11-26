import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

const center = (box) => box.x + box.width / 2;
const actions = async (row, name) => getBox(row.getByRole('button', { name }));

async function cancelKeyboardReset(form, reset) {
  await form.evaluate((owner) => {
    owner.ownerDocument.addEventListener(
      'reset',
      (event) => {
        if (event.target === owner && event.isTrusted) {
          event.preventDefault();
        }
      },
      { once: true },
    );
  });
  await reset.press('Enter');
  await form.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

function open(page, params) {
  return page.evaluate(
    (params) => {
      const url = new URL(window.location.href);
      url.search = new URLSearchParams({ fixture: 'input-workbench', ...params }).toString();
      history.pushState(null, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    { family: 'soft', scheme: 'dark', ...params },
  );
}

export default {
  'Autocomplete submits the current text and respects the native reset decision': async ({
    page,
    mount,
  }) => {
    await mount('input-consumers');
    const form = page.getByTestId('picker-form');
    const input = form.getByRole('combobox', { name: 'Entry title' });
    const reset = form.getByRole('button', { name: 'Reset picker form' });
    await input.fill('Unlisted title');
    await cancelKeyboardReset(form, reset);
    assert.equal(await input.inputValue(), 'Unlisted title');
    assert.equal(
      await form.evaluate((owner) => new FormData(owner).get('title')),
      'Unlisted title',
    );

    await input.fill('Another edit');
    assert.equal(await input.getAttribute('aria-expanded'), 'true');
    assert.equal(
      await form.evaluate((owner) => {
        owner.reset();
        return new FormData(owner).get('title');
      }),
      'Draft title',
    );
    await form.locator('input[name="title"][aria-expanded="false"]').waitFor();
    assert.equal(await input.inputValue(), 'Draft title');

    await page.goto(
      new URL('/?item=autocomplete&tab=playground&family=soft&scheme=light', page.url()).href,
    );
    const title = page.getByRole('combobox', { name: 'Document title', exact: true });
    await title.waitFor({ timeout: 30_000 });
    await title.fill('Incident');
    const suggestions = page.getByRole('listbox', { name: 'Suggestions', exact: true });
    await suggestions.getByRole('option', { name: 'Incident follow-up' }).waitFor();
    const posted = await title.evaluate(async (editor) => {
      const owner = editor.form;
      owner.reset();
      owner.ownerDocument.addEventListener('reset', (event) => event.preventDefault(), {
        once: true,
      });
      owner.reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
      return new FormData(owner).get('title');
    });
    assert.equal(posted, 'Release notes');
    assert.equal(await title.getAttribute('aria-expanded'), 'false');
    await title.press('ArrowDown');
    assert.equal(await title.getAttribute('aria-controls'), await suggestions.getAttribute('id'));
    assert.deepEqual(await suggestions.getByRole('option').allTextContents(), ['Release notes']);
    await title.press('Enter');
    assert.equal(await title.inputValue(), 'Release notes');
  },
  'Input consumers retain picker slot order in both directions and Clear updates every form axis once':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 360, height: 760 });
      await mount('input-consumers');
      const catalog = page.getByTestId('catalog-picker');
      const free = page.getByTestId('free-picker');
      const date = page.getByTestId('date-picker');
      const dateEditor = date.getByLabel('Review date');
      for (const direction of ['ltr', 'rtl']) {
        await page.evaluate((direction) => {
          document.documentElement.dir = direction;
        }, direction);
        const logicalCenters = async (locator, names) => {
          const starts = [];
          for (const target of locator) {
            starts.push(center(await getBox(target)));
          }
          for (const [row, name] of names) {
            starts.push(center(await actions(row, name)));
          }
          return starts.map((x) => (direction === 'ltr' ? x : -x));
        };
        for (const [picker, name, clearName, disclosure] of [
          [catalog, 'Catalog entry', 'Clear selection and search text', 'Show options'],
          [free, 'Entry title', 'Clear text', 'Show suggestions'],
        ]) {
          const input = picker.getByRole('combobox', { name });
          // The built-in field glyph is the last glyph inside the editor frame.
          const status = input.locator('..').locator('svg').last();
          const pending = picker.locator('.suggestion-spinner-proto');
          const centers = await logicalCenters(
            [input, pending, status],
            [
              [picker, clearName],
              [picker, disclosure],
            ],
          );
          assert.deepEqual(
            centers,
            centers.toSorted((a, b) => a - b),
          );
          assert.equal((await actions(picker, clearName)).width, 24);
        }

        const status = dateEditor.locator('..').locator('svg').first();
        const centers = await logicalCenters(
          [dateEditor],
          [
            [date, 'Clear date'],
            [date, 'Select date'],
          ],
        );
        const statusCenter = center(await getBox(status)) * (direction === 'ltr' ? 1 : -1);
        assert.deepEqual(
          [...centers, statusCenter],
          [...centers, statusCenter].toSorted((a, b) => a - b),
        );
        assert.equal(await dateEditor.evaluate((node) => getComputedStyle(node).direction), 'ltr');
      }

      const clearCatalog = catalog.getByRole('button', { name: 'Clear selection and search text' });
      await clearCatalog.click();
      await assertFocused(catalog.getByRole('combobox', { name: 'Catalog entry' }));
      assert.equal(await catalog.getByRole('combobox').inputValue(), '');
      assert.equal(await catalog.getByRole('combobox').getAttribute('aria-expanded'), 'false');
      assert.equal(await clearCatalog.count(), 0);

      await free.getByRole('button', { name: 'Clear text' }).click();
      await assertFocused(free.getByRole('combobox', { name: 'Entry title' }));
      assert.deepEqual(
        await page.getByTestId('picker-form').evaluate((form) => [...new FormData(form)]),
        [['title', '']],
      );
      assert.deepEqual(JSON.parse(await page.getByTestId('picker-updates').textContent()), [
        ['query', ''],
        ['selection', null],
        ['title', ''],
      ]);

      const dateTrigger = date.getByRole('button', { name: 'Select date' });
      await dateTrigger.press('Enter');
      const panel = date.locator('.date-picker-panel-proto:popover-open');
      await panel.waitFor();
      assert.equal(
        await date.getByRole('button', { name: 'Close calendar' }).getAttribute('aria-expanded'),
        'true',
      );
      await panel.locator('.calendar-day-proto:focus').waitFor();
      await panel.locator('[data-date="2026-09-17"]').focus();
      const tooltip = panel.locator('.calendar-date-feedback:popover-open');
      await tooltip.waitFor();
      await page.keyboard.press('Escape');
      await tooltip.waitFor({ state: 'detached' });
      assert.equal(await panel.count(), 1);
      await page.keyboard.press('Escape');
      await panel.waitFor({ state: 'detached' });
      assert.equal(await dateTrigger.getAttribute('aria-expanded'), 'false');
      await assertFocused(dateTrigger);

      const range = page.getByTestId('range-picker');
      const rangeTrigger = range.getByRole('button', { name: 'View date range' });
      assert.equal(await range.getByRole('button', { name: 'Clear date range' }).count(), 0);
      await rangeTrigger.press('Enter');
      const rangePanel = range.locator('.date-picker-panel-proto:popover-open');
      await rangePanel.locator('.calendar-day-proto:focus').waitFor();
      await page.keyboard.press('Escape');
      await rangePanel.waitFor({ state: 'detached' });
      await assertFocused(rangeTrigger);

      const simple = page.getByTestId('search-select');
      await simple.getByRole('button', { name: 'Show options' }).click();
      const list = simple.getByRole('listbox', { name: 'Matching options' });
      await list.waitFor();
      const editor = simple.getByRole('combobox', { name: 'Search choice' });
      assert.equal(await editor.inputValue(), 'Research notes');
      assert.equal(await list.getAttribute('id'), await editor.getAttribute('aria-controls'));

      const numbers = page.getByTestId('number-fields');
      const geometry = await numbers.locator('.number-input-proto').evaluateAll((fields) =>
        fields.map((field) => ({
          size: field.dataset.size,
          height: field.getBoundingClientRect().height,
          action: field.querySelector('button').getBoundingClientRect().width,
        })),
      );
      assert.deepEqual(geometry, [
        { size: 's', height: 30, action: 28 },
        { size: 'l', height: 48, action: 44 },
      ]);
      const compact = numbers.getByRole('spinbutton', { name: 'Compact count' });
      const touch = numbers.getByRole('spinbutton', { name: 'Touch count' });
      assert.equal(await compact.getAttribute('aria-describedby'), null);
      assert.equal(
        await touch.evaluate(
          (control) =>
            document.getElementById(control.getAttribute('aria-describedby'))?.textContent,
        ),
        'Use whole numbers.',
      );
      const disabledDate = page.getByTestId('disabled-date');
      assert.equal(await disabledDate.getByText('Date entry is unavailable.').isVisible(), true);
      const disabledEditor = disabledDate.getByRole('textbox', { name: 'Disabled date' });
      assert.equal(await disabledEditor.getAttribute('aria-invalid'), null);
      assert.equal(
        await disabledEditor.evaluate(
          (control) =>
            document.getElementById(control.getAttribute('aria-describedby'))?.textContent,
        ),
        'Date entry is unavailable.',
      );
    },
  'Input Workbench presents native forms, time editing and native context menu boundaries': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await mount('input-workbench');
    for (const block of ['native-form', 'external-form']) {
      await open(page, { item: 'input', tab: 'compositions', block });
      const artboard = page.locator('.wb-artboard').first();
      const field = artboard.getByRole('textbox', { name: 'Workspace name' });
      await field.fill('Updated workspace');
      const ownsInput = await field.evaluate((node) => {
        const explicit = node.hasAttribute('form');
        return { explicit, associated: Boolean(node.form), nested: node.form?.contains(node) };
      });
      const external = block === 'external-form';
      assert.deepEqual(ownsInput, { explicit: external, associated: true, nested: !external });
      await artboard.getByRole('button', { name: 'Submit', exact: true }).click();
      assert.equal(await artboard.locator('output').textContent(), 'Submitted: Updated workspace');
      await artboard.getByRole('button', { name: 'Reset', exact: true }).click();
      await artboard.getByRole('button', { name: 'Submit', exact: true }).click();
      assert.equal(await artboard.locator('output').textContent(), 'Submitted: Folio');
    }

    await open(page, { item: 'input', tab: 'playground' });
    await page.locator('select:has(option[value="controlled"])').selectOption('controlled');
    const editor = page.getByRole('textbox', { name: 'Workspace name', exact: true });
    const value = page.locator('.wb-control-label:text-is("value") + input');
    await editor.fill('Typed draft');
    await value.fill('Another owner value');
    assert.equal(await editor.inputValue(), 'Another owner value');
    await value.fill('Folio');
    assert.equal(await editor.inputValue(), 'Folio');
    assert.deepEqual(await editor.evaluate((node) => [...new FormData(node.form)]), [
      ['workspace', 'Folio'],
    ]);

    await editor.fill('Latest committed name');
    await editor.evaluate((node) => node.form.reset());
    assert.equal(await editor.inputValue(), 'Latest committed name');
    assert.deepEqual(await editor.evaluate((node) => [...new FormData(node.form)]), [
      ['workspace', 'Latest committed name'],
    ]);

    await open(page, { item: 'form-field', tab: 'states', block: 'overflow' });
    const group = page.getByRole('group', { name: 'Review window' });
    const start = group.getByLabel('Start', { exact: true });
    const end = group.getByLabel('End', { exact: true });
    assert.equal(await start.getAttribute('type'), 'time');
    assert.equal(await end.getAttribute('type'), 'time');
    assert.equal(await group.getAttribute('aria-invalid'), null);
    assert.equal(await start.getAttribute('aria-invalid'), null);
    assert.equal(await end.getAttribute('aria-invalid'), 'true');
    const groupDescription = () =>
      group.evaluate(
        (node) =>
          node
            .getAttribute('aria-describedby')
            ?.split(' ')
            .map((id) => node.ownerDocument.getElementById(id)?.textContent.trim()) ?? [],
      );
    const [instructions] = await groupDescription();
    assert.match(instructions, /^Use local time\./u);
    await start.fill('07:45');
    assert.equal(await start.inputValue(), '07:45');
    assert.equal(await end.inputValue(), '08:30');
    assert.equal(await end.getAttribute('aria-invalid'), null);
    const overlap = page.getByRole('checkbox', { name: 'Show overlapping review' });
    await overlap.check();
    assert.equal(await group.getAttribute('aria-invalid'), 'true');
    assert.deepEqual(await groupDescription(), [
      instructions,
      'This window overlaps another review.',
    ]);
    assert.equal(await end.getAttribute('aria-describedby'), null);
    await overlap.uncheck();
    await start.fill('11:45');
    assert.equal(await end.getAttribute('aria-invalid'), 'true');
    assert.equal(
      await end.evaluate(
        (node) => document.getElementById(node.getAttribute('aria-describedby')).textContent,
      ),
      'Choose an end time later than 11:45.',
    );
    await end.fill('');
    assert.equal(await end.getAttribute('aria-invalid'), null);

    await open(page, { item: 'context-menu', tab: 'compositions', block: 'native' });
    const note = page.getByLabel('Revision note');
    const region = page.locator('[data-native-context-region]');
    const menu = page.getByRole('menu');
    await note.click({ button: 'right' });
    assert.equal(await menu.count(), 0);
    const regionBox = await getBox(region);
    await page.mouse.click(regionBox.x + 2, regionBox.y + regionBox.height / 2, {
      button: 'right',
    });
    assert.equal(await menu.count(), 0);
    await note.focus();
    await page.keyboard.press('Shift+F10');
    assert.equal(await menu.count(), 0);
    const card = page.getByRole('group', { name: 'Release notes', exact: true });
    await card.click({ button: 'right', position: { x: 4, y: 4 } });
    await menu.waitFor();
  },
  'FormField preserves canceled resets and validates the restored delivery preferences': async ({
    page,
    mount,
  }) => {
    await mount('input-workbench');
    await open(page, { item: 'form-field', tab: 'states', block: 'live' });
    const form = page.locator('[data-wb-block="live"] form').filter({
      has: page.getByRole('button', { name: 'Save preferences' }),
    });
    const email = form.getByRole('textbox');
    const digest = form.getByRole('checkbox', { name: 'Email digest' });
    const saved = form.getByText('Preferences saved for this preview.', { exact: true });
    const reset = form.getByRole('button', { name: 'Reset', exact: true });
    await email.fill('release@example.org');
    await digest.check();
    await form.getByRole('button', { name: 'Save preferences' }).press('Enter');
    await saved.waitFor();

    await cancelKeyboardReset(form, reset);
    assert.equal(await email.inputValue(), 'release@example.org');
    assert.equal(await digest.isChecked(), true);
    assert.equal(await saved.isVisible(), true);

    await reset.press('Enter');
    await saved.waitFor({ state: 'hidden' });
    assert.equal(await email.inputValue(), '');
    assert.equal(await digest.isChecked(), false);

    for (const afterMicrotask of [false, true]) {
      await email.fill('updated@example.org');
      await digest.check();
      await form.getByRole('button', { name: 'Save preferences' }).press('Enter');
      await saved.waitFor();
      const payload = await form.evaluate(async (owner, afterMicrotask) => {
        let entries;
        owner.addEventListener(
          'submit',
          () => {
            entries = [...new FormData(owner)];
          },
          { once: true },
        );
        owner.reset();
        if (afterMicrotask) {
          await Promise.resolve();
        }
        owner.requestSubmit();
        await new Promise((resolve) => setTimeout(resolve, 0));
        return entries;
      }, afterMicrotask);
      assert.deepEqual(payload, [['email', '']]);
      assert.equal(await email.getAttribute('aria-invalid'), 'true');
      assert.equal(await form.getByText('Enter your delivery email.').isVisible(), true);
      assert.equal(await form.getByText('Select at least one delivery method.').isVisible(), true);
      assert.equal(await saved.isVisible(), false);
      await assertFocused(email);
    }
  },
  'RangeSlider keeps its latest applied price after canceled and resubmitted resets': async ({
    page,
    mount,
  }) => {
    await mount('input-workbench');
    await open(page, { item: 'range-slider', tab: 'compositions', block: 'form' });
    const board = page.locator('[data-wb-block="form"] .wb-artboard');
    const form = board.locator('form');
    const maximum = board.getByRole('slider', { name: 'Maximum price', exact: true });
    const reset = form.getByRole('button', { name: 'Reset', exact: true });
    const edit = board.getByRole('button', { name: 'Edit price range' });
    await maximum.press('End');
    await form.getByRole('button', { name: 'Apply price filter' }).press('Enter');
    await edit.waitFor();
    await cancelKeyboardReset(form, reset);
    assert.deepEqual(await form.evaluate((el) => Object.fromEntries(new FormData(el))), {
      from: '25',
      to: '100',
    });
    assert.equal(await board.getByRole('status').innerText(), 'Applied price range: $25 — $100.');
    await edit.press('Enter');
    await assertFocused(board.getByRole('slider', { name: 'Minimum price', exact: true }));

    await reset.press('Enter');
    await edit.waitFor({ state: 'hidden' });
    assert.equal(await maximum.inputValue(), '75');
    assert.equal(await board.getByRole('status').innerText(), '');

    await maximum.press('End');
    await form.getByRole('button', { name: 'Apply price filter' }).press('Enter');
    await edit.waitFor();
    await form.evaluate(async (owner) => {
      owner.reset();
      await Promise.resolve();
      owner.requestSubmit(owner.querySelector('button[type="submit"]'));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(await board.getByRole('status').innerText(), 'Applied price range: $25 — $75.');
  },
  'FormField address guidelines preserve edits across themes and open independently': async ({
    page,
    mount,
  }) => {
    await mount('input-workbench');
    await open(page, {
      item: 'form-field',
      tab: 'states',
      family: 'all',
      scheme: 'both',
      theme: 'soft-dark',
    });
    const study = page.locator('[data-wb-block="overflow"]');
    await study.scrollIntoViewIfNeeded();
    const board = study.locator('.wb-artboard[data-theme="frost-light"]');
    const label = { name: /A longer descriptive label/ };
    const address = board.getByRole('textbox', label);
    const other = study.locator('.wb-artboard[data-theme="soft-dark"]').getByRole('textbox', label);
    const help = board.getByRole('button', { name: /Where can I find/ });
    const link = board.getByRole('link', { name: 'Address guidelines' });
    const initial = await address.inputValue();
    await address.fill('edited-address');
    await other.fill('another-address');
    await help.press('Enter');

    const href = new URL(await link.getAttribute('href'), page.url());
    assert.equal(href.searchParams.get('block'), 'overflow');
    assert.equal(href.searchParams.get('solo'), 'frost-light');
    const separate = await page.context().newPage();
    await separate.goto(href.href);
    await separate.locator(href.hash + ':focus').waitFor();
    assert.equal(await separate.getByRole('textbox', label).inputValue(), initial);
    await separate.close();

    await link.press('Enter');
    await page.waitForURL(
      (url) => url.hash === href.hash && url.searchParams.get('block') === 'overflow',
    );
    assert.equal(await address.inputValue(), 'edited-address');
    assert.equal(await other.inputValue(), 'another-address');
    assert.equal(await help.getAttribute('aria-expanded'), 'true');
    assert.equal(await study.locator('.wb-artboard').count(), 6);
    await page.locator(href.hash + ':focus').waitFor();
    await page.waitForFunction(
      (hash) =>
        new Promise((resolve) => {
          const observer = new IntersectionObserver(
            ([{ boundingClientRect, intersectionRect }]) => {
              observer.disconnect();
              // Fractional artboard scaling may clip a subpixel at the scrollport edge.
              resolve(
                intersectionRect.height >= boundingClientRect.height - 1 &&
                  intersectionRect.width >= boundingClientRect.width - 1,
              );
            },
          );
          requestAnimationFrame(() => observer.observe(document.querySelector(hash)));
        }),
      href.hash,
    );
    await page.reload();
    await page.locator(href.hash + ':focus').waitFor();
  },
  'Input Workbench uses the available overlay width for narrow RTL overflow examples': async ({
    page,
    mount,
  }) => {
    await mount('input-workbench');
    await open(page, {
      item: 'input',
      tab: 'states',
      block: 'overflow',
      family: 'frost',
      surface: 'overlay',
      vp: '360',
      scale: '120',
      dir: 'rtl',
      raw: '1',
    });
    const grid = page.locator('.input-study-grid');
    const available = await grid.evaluate((node) => {
      const parent = node.parentElement;
      const style = getComputedStyle(parent);
      return {
        grid: node.offsetWidth,
        stage:
          parent.clientWidth -
          parseFloat(style.paddingInlineStart) -
          parseFloat(style.paddingInlineEnd),
      };
    });
    assert.equal(available.grid, available.stage);
    for (const name of ['Long affixes', 'Reference URL · LTR value']) {
      const field = grid.getByLabel(name, { exact: true }).locator('..');
      const shell = await getBox(field);
      const clear = await actions(field, 'Clear value');
      assert.ok(clear.x >= shell.x && clear.x + clear.width <= shell.x + shell.width);
    }
  },
  'NumberInput Workbench fits the field and restores step availability on native reset': async ({
    page,
    mount,
  }) => {
    await mount('input-workbench');
    for (const surface of ['base', 'overlay']) {
      await open(page, {
        item: 'number-input',
        tab: 'playground',
        surface,
        vp: '360',
        scale: '120',
        dir: 'rtl',
      });
      const art = page.locator('.wb-artboard').first();
      const field = art.getByRole('spinbutton', { name: 'Seat quota' });
      await field.waitFor();
      const numberField = art.locator('.number-field-proto').filter({
        has: page.getByRole('spinbutton', { name: 'Seat quota' }),
      });
      assert.ok(await numberField.evaluate((node) => node.clientWidth > 140));
      const increase = art.getByRole('button', { name: 'Increase value' });
      await field.fill('100');
      assert.equal(await increase.isDisabled(), true);
      await field.evaluate((input) => {
        input.form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
        input.form.reset();
      });
      assert.equal(await field.inputValue(), '100');
      assert.equal(await increase.isDisabled(), true);
      await field.evaluate((input) => input.form.reset());
      await art.locator('[data-action="increment"]:enabled').waitFor();
      assert.equal(await field.inputValue(), '25');
      await field.press('ArrowUp');
      assert.deepEqual(await field.evaluate((input) => [...new FormData(input.form)]), [
        ['quota', '26'],
      ]);
    }
  },
};

import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

const center = (box) => box.x + box.width / 2;
const actions = async (row, name) => getBox(row.getByRole('button', { name }));

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
      await simple.getByRole('button', { name: 'Show choices' }).click();
      assert.equal(await simple.getByRole('listbox', { name: 'Matching choices' }).count(), 1);
      assert.equal(await simple.getByLabel('Search choice').inputValue(), 'Research notes');

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
      assert.equal(await numbers.locator('.ff-support').count(), 1);
      assert.equal(await numbers.locator('.ff-feedback-slot').count(), 0);
      const disabledFeedback = page.getByTestId('disabled-date').locator('.ff-feedback');
      assert.equal(await disabledFeedback.getAttribute('data-status'), 'neutral');
      assert.equal(await disabledFeedback.textContent(), 'Date entry is unavailable.');
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

    await open(page, { item: 'form-field', tab: 'states', block: 'overflow' });
    const group = page.getByRole('group', { name: 'Review window' });
    const start = group.getByLabel('Start', { exact: true });
    const end = group.getByLabel('End', { exact: true });
    assert.equal(await start.getAttribute('type'), 'time');
    assert.equal(await end.getAttribute('type'), 'time');
    assert.equal(await group.getAttribute('aria-invalid'), null);
    assert.equal(await start.getAttribute('aria-invalid'), null);
    assert.equal(await end.getAttribute('aria-invalid'), 'true');
    await start.fill('07:45');
    assert.equal(await start.inputValue(), '07:45');
    assert.equal(await end.inputValue(), '08:30');

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
    const card = page.locator('.context-study-live-target');
    await card.click({ button: 'right', position: { x: 4, y: 4 } });
    await menu.waitFor();
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
    const available = await grid.evaluate((node) => ({
      grid: node.offsetWidth,
      stage: node.parentElement.clientWidth,
    }));
    assert.equal(available.grid, available.stage);
    for (const name of ['Long affixes', 'Reference URL · LTR value']) {
      const field = grid.getByLabel(name, { exact: true }).locator('..');
      const shell = await getBox(field);
      const clear = await actions(field, 'Clear value');
      assert.ok(clear.x >= shell.x && clear.x + clear.width <= shell.x + shell.width);
    }
  },
};

import assert from 'node:assert/strict';
import { assertFocused, pressKeys } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const tab = (page, name) => page.getByRole('tab', { name, exact: true });
const searchField = (page) => page.getByRole('combobox', { name: 'Search documents' });
const activate = (page, name) => button(page, name).evaluate((node) => node.click());

async function expectTab(page, key) {
  await assertFocused(tab(page, key));
  const stops = page.getByRole('tablist').locator('[tabindex="0"]');
  assert.equal(await stops.count(), 1);
  assert.equal(await stops.textContent(), key);
}

async function expectActive(input, label) {
  await assertFocused(input);
  assert.deepEqual(
    await input.evaluate((node) => {
      const id = node.getAttribute('aria-activedescendant');
      if (id === null) {
        return null;
      }
      const list = node.ownerDocument.getElementById(node.getAttribute('aria-controls'));
      const active = node.ownerDocument.getElementById(id);
      return {
        label: active?.textContent,
        inList: list?.contains(active) ?? false,
        navigable: active?.getAttribute('aria-disabled') !== 'true',
      };
    }),
    label === null ? null : { label, inList: true, navigable: true },
  );
}

const suite = {
  'roving focus follows local direction and keeps selection independent': async ({
    page,
    mount,
  }) => {
    await mount('collections');
    await button(page, 'Disable B').click();
    await button(page, 'Before tabs').focus();
    await pressKeys(page, 'Tab');
    await expectTab(page, 'A');
    await pressKeys(page, 'ArrowRight');
    await expectTab(page, 'C');
    await pressKeys(page, 'ArrowRight', 'ArrowUp');
    await expectTab(page, 'C');
    await pressKeys(page, 'Home', 'End');
    await expectTab(page, 'C');
    assert.equal(await tab(page, 'A').getAttribute('aria-selected'), 'true');
    await pressKeys(page, 'Tab');
    await assertFocused(page.getByRole('textbox', { name: 'After tabs' }));
    await pressKeys(page, 'Shift+Tab');
    await expectTab(page, 'A');
    await activate(page, 'Toggle local RTL');
    assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
    await pressKeys(page, 'ArrowLeft');
    await expectTab(page, 'C');
    await pressKeys(page, 'ArrowRight');
    await expectTab(page, 'A');
  },
  'roving axes, wrap, empty and reordered collections keep physical focus in sync': async ({
    page,
    mount,
  }) => {
    await mount('collections');
    await tab(page, 'A').focus();
    await activate(page, 'Vertical tabs');
    await pressKeys(page, 'ArrowRight');
    await expectTab(page, 'A');
    await pressKeys(page, 'ArrowUp');
    await expectTab(page, 'A');
    await activate(page, 'Toggle wrap');
    await pressKeys(page, 'ArrowUp');
    await expectTab(page, 'C');
    await activate(page, 'Both axes');
    await pressKeys(page, 'ArrowRight', 'ArrowDown');
    await expectTab(page, 'B');
    await activate(page, 'Reorder tabs');
    await expectTab(page, 'B');
    await pressKeys(page, 'ArrowRight');
    await expectTab(page, 'A');
    await activate(page, 'Remove all');
    assert.equal(await page.getByRole('tablist').locator('[tabindex="0"]').count(), 0);
  },
  'positional recovery chooses the previous row when the last row disappears': async ({
    page,
    mount,
  }) => {
    await mount('collections');
    await activate(page, 'Position recovery');
    await tab(page, 'C').focus();
    await activate(page, 'Remove C');
    await expectTab(page, 'B');
    assert.equal(await page.getByTestId('selected-tab').textContent(), 'A');
  },
  'menu typeahead includes readable unavailable commands and skips separators': async ({
    page,
    mount,
  }) => {
    await mount('collections');
    const menuItem = (name) => page.getByRole('menuitem', { name, exact: true });
    await menuItem('Beta').focus();
    await pressKeys(page, 'b');
    await assertFocused(menuItem('Bravo'));
    await pressKeys(page, 'B');
    await assertFocused(menuItem('Blue'));
    await pressKeys(page, 'End', 'B', 'r');
    await assertFocused(menuItem('Bravo'));
    await pressKeys(page, 'z');
    await assertFocused(menuItem('Bravo'));
    await pressKeys(page, 'End');
    await assertFocused(menuItem('Disabled command'));
    assert.equal(await menuItem('Disabled command').getAttribute('aria-disabled'), 'true');
    await pressKeys(page, 'Enter');
    assert.equal(await page.getByTestId('menu-action').textContent(), '');
    await pressKeys(page, 'ArrowUp', 'ArrowDown');
    await assertFocused(menuItem('Disabled command'));
    await pressKeys(page, 'Home', 'd');
    await assertFocused(menuItem('Disabled command'));
    await pressKeys(page, 'Home', 'b');
    await assertFocused(menuItem('Bravo'));
    await pressKeys(page, 'Tab');
    await assertFocused(button(page, 'After menu'));
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(menuItem('Beta'));
    await pressKeys(page, 'r');
    await assertFocused(menuItem('Beta'));
  },
  'virtual focus moves independently of the accepted form value': async ({ page, mount }) => {
    await mount('collections');
    const input = searchField(page);
    const form = page.locator('#virtual-form');
    const entries = () => form.evaluate((node) => [...new FormData(node)]);
    await input.focus();
    await expectActive(input, 'Alpha document');
    await pressKeys(page, 'ArrowDown');
    await expectActive(input, 'Beta document');
    await page.getByRole('option', { name: 'Alpha document' }).hover();
    await expectActive(input, 'Alpha document');
    await page.mouse.move(0, 0);
    await pressKeys(page, 'ArrowDown');
    assert.deepEqual(await entries(), [['document', 'a']]);
    await pressKeys(page, 'Enter');
    assert.deepEqual(await entries(), [['document', 'b']]);
    await pressKeys(page, 'ArrowDown');
    await expectActive(input, 'Document 0');
    await activate(page, 'Remove active result');
    await expectActive(input, null);
    assert.deepEqual(await entries(), [['document', 'b']]);
    await pressKeys(page, 'ArrowDown');
    await expectActive(input, 'Beta document');
    await input.fill('no matching item');
    await expectActive(input, null);
    await assertFocused(input);
    await pressKeys(page, 'Escape');
    assert.equal(await input.getAttribute('aria-controls'), null);
    assert.equal(await input.getAttribute('aria-expanded'), 'false');
    await expectActive(input, null);
  },
  'empty virtual focus preserves text editing, submit, and list-local scrolling': async ({
    page,
    mount,
  }) => {
    await mount('collections');
    const input = searchField(page);
    await activate(page, 'Clear accepted document');
    await input.fill('Document');
    await expectActive(input, null);
    await pressKeys(page, 'Home');
    assert.equal(await input.evaluate((node) => node.selectionStart), 0);
    await pressKeys(page, 'Enter');
    assert.equal(await page.getByTestId('submitted-count').textContent(), '1');
    await expectActive(input, null);
    assert.deepEqual(
      await page.locator('#virtual-form').evaluate((node) => [...new FormData(node)]),
      [],
    );
    const y = await page.evaluate(() => window.scrollY);
    await pressKeys(page, 'ArrowUp');
    await expectActive(input, 'Document 11');
    const viewport = page.getByRole('listbox', { name: 'Document results' });
    assert.ok(
      await viewport.evaluate((node) => {
        const viewport = node.getBoundingClientRect();
        const option = node.lastElementChild.getBoundingClientRect();
        return node.scrollTop > 0 && option.top >= viewport.top && option.bottom <= viewport.bottom;
      }),
    );
    assert.equal(await page.evaluate(() => window.scrollY), y);
    await activate(page, 'Clear active document');
    await pressKeys(page, 'ArrowDown');
    await expectActive(input, 'Alpha document');
    await pressKeys(page, 'ArrowDown');
    await expectActive(input, 'Beta document');
    await activate(page, 'Toggle document list');
    await expectActive(input, null);
    await activate(page, 'Toggle document list');
    await expectActive(input, null);
  },
};

for (const [recovery, expected] of [
  ['manual selection', 'A'],
  ['position', 'C'],
]) {
  for (const mutation of ['Remove B', 'Disable B']) {
    suite['roving ' + recovery + ' recovery after ' + mutation.toLowerCase()] = async ({
      page,
      mount,
    }) => {
      await mount('collections');
      if (recovery === 'position') {
        await activate(page, 'Position recovery');
      }
      await tab(page, 'A').focus();
      await pressKeys(page, 'ArrowRight');
      await expectTab(page, 'B');
      await activate(page, mutation);
      await expectTab(page, expected);
      assert.equal(await page.getByTestId('selected-tab').textContent(), 'A');
    };

    suite['roving ' + recovery + ' preserves outside focus after ' + mutation.toLowerCase()] =
      async ({ page, mount }) => {
        await mount('collections');
        if (recovery === 'position') {
          await activate(page, 'Position recovery');
        }
        await tab(page, 'B').focus();
        const outside = page.getByRole('textbox', { name: 'After tabs' });
        await outside.fill('outside');
        await outside.evaluate((node) => node.setSelectionRange(2, 2));
        await activate(page, mutation);
        await assertFocused(outside);
        assert.equal(await outside.evaluate((node) => node.selectionStart), 2);
        assert.equal(await tab(page, 'A').getAttribute('tabindex'), '0');
      };
  }
}

export default suite;

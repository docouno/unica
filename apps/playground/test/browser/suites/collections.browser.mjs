import assert from 'node:assert/strict';
import { assertFocused, pressKeys } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const tab = (page, name) => page.getByRole('tab', { name, exact: true });
const searchField = (page) => page.getByRole('combobox', { name: 'Search documents' });
const activate = (page, name) => button(page, name).evaluate((node) => node.click());

async function expectTab(page, key) {
  await assertFocused(tab(page, key));
  const stops = page.getByRole('tablist', { name: 'Tabs', exact: true }).locator('[tabindex="0"]');
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
  'roving focus follows local direction, distinguishes onNavigate, keeps refs stable, and checks Home/End':
    async ({ page, mount }) => {
      await mount('collections');
      await button(page, 'Disable B').click();
      await button(page, 'Before tabs').focus();
      await pressKeys(page, 'Tab');
      await expectTab(page, 'A');
      assert.equal(await page.getByTestId('roving-navigates').textContent(), '');
      await pressKeys(page, 'ArrowRight');
      await expectTab(page, 'C');
      assert.equal(await page.getByTestId('roving-navigates').textContent(), 'C');
      await pressKeys(page, 'ArrowRight', 'ArrowUp');
      await expectTab(page, 'C');
      // Home moves back to A, End returns to C (verify each step explicitly).
      await pressKeys(page, 'Home');
      await expectTab(page, 'A');
      await pressKeys(page, 'End');
      await expectTab(page, 'C');
      assert.equal(await tab(page, 'A').getAttribute('aria-selected'), 'true');

      // Nested interactive control inside tablist keeps its own arrow keys.
      const nested = page.getByRole('textbox', { name: 'Nested in tablist' });
      await nested.fill('abc');
      await nested.evaluate((node) => node.setSelectionRange(3, 3));
      await pressKeys(page, 'ArrowLeft');
      await assertFocused(nested);
      assert.equal(await nested.evaluate((node) => node.selectionStart), 2);

      await tab(page, 'C').focus();
      await pressKeys(page, 'Tab');
      await assertFocused(nested);
      await pressKeys(page, 'Tab');
      await assertFocused(page.getByRole('textbox', { name: 'After tabs' }));
      await pressKeys(page, 'Shift+Tab', 'Shift+Tab');
      await expectTab(page, 'A');
      await activate(page, 'Toggle local RTL');
      assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
      await pressKeys(page, 'ArrowLeft');
      await expectTab(page, 'C');
      await pressKeys(page, 'Home');
      await expectTab(page, 'A');
      await pressKeys(page, 'End');
      await expectTab(page, 'C');
      await pressKeys(page, 'ArrowRight');
      await expectTab(page, 'A');

      // Unrelated rerenders must keep merged item refs and handlers stable (zero detach/reattach churn).
      await activate(page, 'Rerender tabs');
      await activate(page, 'Rerender tabs');
      assert.equal(await page.getByTestId('roving-ref-changes').textContent(), '0');
      assert.equal(await page.getByTestId('roving-handler-changes').textContent(), '0');

      // Blurring to empty background (relatedTarget === null) resets tabStop to entryKey.
      await pressKeys(page, 'ArrowLeft');
      await expectTab(page, 'C');
      await tab(page, 'C').evaluate((node) => node.blur());
      await page.waitForFunction(() => {
        const list = document.querySelector('[role="tablist"][aria-label="Tabs"]');
        return list?.querySelector('[tabindex="0"]')?.textContent === 'A';
      });
      assert.equal(await tab(page, 'A').getAttribute('tabindex'), '0');
      assert.equal(await tab(page, 'C').getAttribute('tabindex'), '-1');

      // Newly appended item with autoFocus keeps focusedKey and tabIndex="0" (useInsertionEffect).
      await button(page, 'Add autoFocus tab D').click();
      await expectTab(page, 'D');
    },
  'roving axes, wrap, empty, aria-disabled, and reordered collections stay in sync': async ({
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

    // Clicking a non-navigable aria-disabled item clears stale focusedKey to entryKey.
    await activate(page, 'Aria disable B');
    await tab(page, 'C').focus();
    await tab(page, 'B').focus();
    assert.equal(await tab(page, 'A').getAttribute('tabindex'), '0');

    await activate(page, 'Remove all');
    assert.equal(
      await page
        .getByRole('tablist', { name: 'Tabs', exact: true })
        .locator('[tabindex="0"]')
        .count(),
      0,
    );
  },
  'intentional blur to background followed by synchronous item removal does not steal focus back':
    async ({ page, mount }) => {
      await mount('collections');
      await activate(page, 'Enable remove B on blur');
      await tab(page, 'B').focus();
      await tab(page, 'B').evaluate((node) => node.blur());
      assert.equal(await tab(page, 'B').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
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
    assert.equal(await page.getByTestId('roving-navigates').textContent(), '');
  },
  'roving uses live focus in a batch and keeps focus on a replaced node with the same key': async ({
    page,
    mount,
  }) => {
    await mount('collections');
    const first = tab(page, 'A');
    await first.focus();
    await first.evaluate((node) => {
      const document = node.ownerDocument;
      for (let count = 0; count < 2; count++) {
        document.activeElement.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    });
    await expectTab(page, 'C');
    await tab(page, 'B').focus();
    await activate(page, 'Replace B node');
    await expectTab(page, 'B');
    assert.equal(await tab(page, 'B').evaluate((node) => node.localName), 'a');
    assert.equal(await page.getByTestId('selected-tab').textContent(), 'A');
  },
  'menu container entry focuses first/last item and typeahead supports multi-word spaces and disabled commands':
    async ({ page, mount }) => {
      await mount('collections');
      const menu = page.getByRole('menu', { name: 'Commands' });
      const menuItem = (name) => page.getByRole('menuitem', { name, exact: true });

      // Focusing the menu container (pointer-open menu) then ArrowDown lands on first item, not second.
      await menu.focus();
      await pressKeys(page, 'ArrowDown');
      await assertFocused(menuItem('Beta'));
      await menu.focus();
      await pressKeys(page, 'ArrowUp');
      await assertFocused(menuItem('Disabled command'));

      await menuItem('Beta').focus();
      await pressKeys(page, 'b');
      await assertFocused(menuItem('Bravo'));
      await pressKeys(page, 'B');
      await assertFocused(menuItem('Blue'));
      await pressKeys(page, 'End', 'B', 'r');
      await assertFocused(menuItem('Bravo'));
      await pressKeys(page, 'z');
      await assertFocused(menuItem('Bravo'));

      // Multi-word typeahead with Space matches 'New File' instead of triggering activation on 'New Document'.
      await pressKeys(page, 'Home', 'n', 'e', 'w', ' ', 'f');
      await assertFocused(menuItem('New File'));
      assert.equal(await page.getByTestId('menu-action').textContent(), '');

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
  'virtual focus tracks markKeyboardNavigation, rapid batches, disable, close, and keeps FormData independent':
    async ({ page, mount }) => {
      await mount('collections');
      const input = searchField(page);
      const form = page.locator('#virtual-form');
      const entries = () => form.evaluate((node) => [...new FormData(node)]);

      // Pointer click sets focus-origin=pointer; ArrowDown via useActiveDescendant promotes to keyboard.
      await input.click();
      assert.equal(await input.getAttribute('data-focus-origin'), 'pointer');
      await expectActive(input, 'Alpha document');
      await pressKeys(page, 'ArrowDown');
      assert.equal(await input.getAttribute('data-focus-origin'), 'keyboard');
      await expectActive(input, 'Beta document');

      // Synchronous batch of two ArrowDown events advances twice (skipping unavailable 'c').
      await input.evaluate((node) => {
        for (let count = 0; count < 2; count++) {
          node.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
          );
        }
      });
      await expectActive(input, 'Document 1');

      await page.getByRole('option', { name: 'Alpha document' }).hover();
      await expectActive(input, 'Alpha document');
      await page.mouse.move(0, 0);
      await pressKeys(page, 'ArrowDown');
      assert.deepEqual(await entries(), [['document', 'a']]);
      await pressKeys(page, 'Enter');
      assert.deepEqual(await entries(), [['document', 'b']]);
      await pressKeys(page, 'ArrowDown');
      await expectActive(input, 'Document 0');

      // Disabling active result without removing it clears aria-activedescendant and activeKey immediately.
      await activate(page, 'Disable active result');
      await expectActive(input, null);
      assert.equal(await page.getByTestId('virtual-active-key').textContent(), '');

      // Closing list without clearing state still clears aria-activedescendant and ignores keydown.
      await pressKeys(page, 'ArrowDown');
      await expectActive(input, 'Beta document');
      await activate(page, 'Toggle document list raw');
      await expectActive(input, null);
      await pressKeys(page, 'ArrowDown');
      await expectActive(input, null);
      await activate(page, 'Toggle document list raw');

      await activate(page, 'Remove active result');
      await expectActive(input, null);
      assert.deepEqual(await entries(), [['document', 'b']]);
      await pressKeys(page, 'ArrowDown');
      await expectActive(input, 'Alpha document');
      await input.fill('no matching item');
      await expectActive(input, null);
      await assertFocused(input);
      await pressKeys(page, 'Escape');
      assert.equal(await input.getAttribute('aria-controls'), null);
      assert.equal(await input.getAttribute('aria-expanded'), 'false');
      await expectActive(input, null);
    },
  'empty virtual focus preserves Home/End, Shift+selection, submit, typeahead listbox, and list-local scrolling':
    async ({ page, mount }) => {
      await mount('collections');
      const input = searchField(page);
      await activate(page, 'Clear accepted document');
      await input.fill('Document');
      await expectActive(input, null);
      // Home, End, and Shift+ArrowLeft stay native in the input without fixture key filtering.
      await pressKeys(page, 'Home');
      assert.equal(await input.evaluate((node) => node.selectionStart), 0);
      await pressKeys(page, 'End');
      assert.equal(await input.evaluate((node) => node.selectionStart), 8);
      await pressKeys(page, 'Shift+ArrowLeft');
      assert.deepEqual(
        await input.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [7, 8],
      );

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
          const box = node.getBoundingClientRect();
          const option = node.lastElementChild.getBoundingClientRect();
          return node.scrollTop > 0 && option.top >= box.top && option.bottom <= box.bottom;
        }),
      );
      assert.equal(await page.evaluate(() => window.scrollY), y);

      // Direct useActiveDescendant with typeahead: true and homeEnd: true.
      const listbox = page.getByRole('listbox', { name: 'Typeahead listbox' });
      await listbox.focus();
      await pressKeys(page, 'b');
      assert.equal(await page.getByTestId('typeahead-active').textContent(), 'b');
      await pressKeys(page, 'b');
      assert.equal(await page.getByTestId('typeahead-active').textContent(), 'c');
      await pressKeys(page, 'Home');
      assert.equal(await page.getByTestId('typeahead-active').textContent(), 'a');
      await pressKeys(page, 'End');
      assert.equal(await page.getByTestId('typeahead-active').textContent(), 'c');
      await activate(page, 'Toggle typeahead listbox');
      assert.equal(await page.getByTestId('typeahead-active').textContent(), '');
    },
  'Shadow DOM roving recovers focus internally and preserves external focus during live removal':
    async ({ page, mount }) => {
      await mount('collections');
      const host = page.locator('#shadow-roving-host');
      const outside = page.getByRole('textbox', { name: 'Outside shadow input' });

      // 1. Positive Shadow DOM focus recovery: removing focused S1 moves focus to S2 inside shadowRoot.
      await host.getByRole('tab', { name: 'S1', exact: true }).focus();
      await host
        .getByRole('button', { name: 'Remove S1', exact: true })
        .evaluate((node) => node.click());
      assert.equal(
        await host.evaluate((node) => node.shadowRoot?.activeElement?.textContent),
        'S2',
      );

      // 2. Negative guard (canRecoverFocus): if external focus takes over during S1 unmount while
      // focused.current is still live, shadow roving sees docActive !== body and must not steal focus.
      await host.getByRole('button', { name: 'Restore shadow items', exact: true }).click();
      await host.getByRole('tab', { name: 'S1', exact: true }).focus();
      await host
        .getByRole('button', { name: 'Remove S1 and focus outside', exact: true })
        .evaluate((node) => node.click());
      await assertFocused(outside);
      assert.equal(await host.evaluate((node) => node.shadowRoot?.activeElement), null);
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

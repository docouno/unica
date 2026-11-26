import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

const events = (page) => page.getByTestId('events').textContent().then(JSON.parse);
const occurrences = async (page, event) =>
  (await events(page)).filter((value) => value === event).length;
const countLayers = (page) => page.locator('[popover]:popover-open').count();
const emitContext = (target, init) =>
  target.evaluate(
    (node, options) =>
      node.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          composed: true,
          ...options,
        }),
      ),
    init,
  );

export default {
  'Menu actions use actual hosts, live names, navigation, and local selection state': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const ssr = await renderFixture('menu');
    assert.match(ssr, /popover="auto"/);
    assert.match(ssr, /aria-haspopup="menu"/);
    await mount('menu-hydration');
    await page.getByTestId('hydrate-menu').evaluate((host, html) => {
      host.innerHTML = html;
      host.dispatchEvent(new Event('hydrate-menu'));
    }, ssr);

    const trigger = page.getByRole('button', { name: 'Record actions' });
    await trigger.press('ArrowUp');
    const menu = page.getByRole('menu', { name: 'Record actions' });
    await menu.waitFor();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await trigger.getAttribute('aria-controls'), await menu.getAttribute('id'));
    await menu.getByRole('group', { name: 'View' }).waitFor();
    await assertFocused(menu.getByRole('menuitem', { name: 'Review deletion' }));
    await page.keyboard.press('Home');
    await assertFocused(menu.getByRole('menuitem', { name: 'Duplicate' }));
    await page.keyboard.press('ArrowDown');
    const disabled = menu.getByRole('menuitem', { name: 'Delete' });
    await assertFocused(disabled);
    assert.equal(await disabled.getAttribute('aria-disabled'), 'true');
    await page.keyboard.press('Enter');
    assert.equal(await menu.isVisible(), true);

    await page.keyboard.press('p');
    const preview = menu.getByRole('menuitemcheckbox', { name: 'Preview' });
    await assertFocused(preview);
    await page.keyboard.press('Space');
    assert.equal(await preview.getAttribute('aria-checked'), 'false');
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });
    await assertFocused(trigger);
    await trigger.press('Enter');
    await preview.waitFor();
    assert.equal(await preview.getAttribute('aria-checked'), 'false');
    await menu.getByRole('menuitemradio', { name: 'Name' }).click();
    await menu.waitFor({ state: 'hidden' });
    await trigger.press('ArrowDown');
    assert.equal(
      await menu.getByRole('menuitemradio', { name: 'Name' }).getAttribute('aria-checked'),
      'true',
    );
    await menu.getByRole('menuitem', { name: 'Cancel activation' }).click();
    assert.equal(await menu.isVisible(), true);
    await page.getByTestId('rename-trigger').evaluate((button) => button.click());
    await page.getByRole('menu', { name: 'Record tools' }).waitFor();
    await page.keyboard.press('Home');
    await page.getByTestId('remove-item').evaluate((button) => button.click());
    await assertFocused(page.getByRole('menuitem', { name: 'Delete' }));
    assert.equal(await occurrences(page, 'submit'), 0);
    assert.equal(await occurrences(page, 'reset'), 0);
    await page.getByRole('menuitem', { name: 'Delete' }).dblclick({ force: true });
    assert.equal(await occurrences(page, 'disabled-capture'), 0);
    assert.equal(await occurrences(page, 'disabled-double-click'), 0);
  },

  'Menu controlled proposals and native dismissal preserve their authority': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    const trigger = page.getByRole('button', { name: 'Controlled actions' });
    const menu = page.getByRole('menu', { name: 'Controlled actions' });
    await trigger.click();
    assert.equal(await occurrences(page, 'controlled:true'), 1);
    assert.equal(await menu.isVisible(), false);
    await page.getByRole('button', { name: 'Set controlled true' }).click();
    await menu.waitFor();
    await menu.getByRole('menuitem', { name: 'Run command' }).click();
    assert.equal(await occurrences(page, 'controlled-command'), 1);
    assert.equal(await occurrences(page, 'controlled:false'), 1);
    assert.equal(await menu.isVisible(), true);
    const emptyKey = menu.getByRole('menuitemradio', { name: 'Empty key' });
    await emptyKey.click();
    assert.equal(await emptyKey.getAttribute('aria-checked'), 'false');
    assert.equal(await occurrences(page, 'radio:""'), 1);
    assert.equal(await occurrences(page, 'controlled:false'), 2);
    await trigger.click();
    assert.equal(await occurrences(page, 'controlled:false'), 3);
    assert.equal(await menu.isVisible(), true);
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });
    assert.equal(await occurrences(page, 'controlled:false'), 4);
    await page.getByRole('button', { name: 'Accept radio choice' }).click();
    assert.equal(
      await menu.isVisible(),
      false,
      'The old true prop does not re-open a dismissed menu',
    );
    await trigger.click();
    await emptyKey.click();
    assert.equal(await emptyKey.getAttribute('aria-checked'), 'true');
    await emptyKey.click();
    assert.equal(await occurrences(page, 'radio:""'), 2);
  },

  'Menu Tab resumes from the caller and a command can transfer focus to a modal': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    const trigger = page.getByRole('button', { name: 'Record actions' });
    const menu = page.getByRole('menu', { name: 'Record actions' });
    for (const [key, name] of [
      ['Tab', 'After menu'],
      ['Shift+Tab', 'Before menu'],
    ]) {
      await trigger.press('ArrowDown');
      await menu.waitFor();
      await page.keyboard.press(key);
      await menu.waitFor({ state: 'hidden' });
      await assertFocused(page.getByRole('textbox', { name }));
    }
    await trigger.press('ArrowDown');
    await menu.getByRole('menuitem', { name: 'Review deletion' }).click();
    await menu.waitFor({ state: 'hidden' });
    await assertFocused(page.getByRole('button', { name: 'Confirm' }));
    assert.equal(await occurrences(page, 'main:false'), 3);
  },

  'Menu Escape unwinds inline and cascading levels before the dialog': async ({ page, mount }) => {
    for (const direction of ['ltr', 'rtl']) {
      await page.setViewportSize({ width: 655, height: 580 });
      await mount('menu', { direction });
      await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
      const trigger = page.getByRole('button', { name: 'Dialog actions' });
      const root = page.getByRole('menu', { name: 'Dialog actions' });
      await trigger.press('ArrowDown');
      const branch = root.getByRole('menuitem', { name: 'Export' });
      await branch.press(direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft');
      const first = page.getByRole('menu', { name: 'Export', exact: true });
      await first.waitFor();
      assert.equal(await countLayers(page), 2);
      const advanced = first.getByRole('menuitem', { name: 'Advanced formats' });
      await advanced.press(direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft');
      const inline = page.getByRole('menu', { name: 'Advanced formats' });
      await inline.waitFor();
      assert.equal(await countLayers(page), 2);
      await assertFocused(inline.getByRole('menuitemcheckbox', { name: 'Include notes' }));
      await page.keyboard.press('Space');
      await page.keyboard.press('Escape');
      await assertFocused(advanced);
      await page.keyboard.press('Escape');
      await assertFocused(branch);
      await page.keyboard.press('Escape');
      await assertFocused(trigger);
      assert.equal(await countLayers(page), 0);
      assert.equal(await page.getByRole('dialog', { name: 'Review records' }).isVisible(), true);
      await page.keyboard.press('Escape');
      await page.getByRole('dialog', { name: 'Review records' }).waitFor({ state: 'hidden' });
    }
  },

  'ContextMenu targets the invoked row and preserves native regions and link actions': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    const alpha = page.getByTestId('Alpha');
    const beta = page.getByTestId('Beta');
    const button = beta.getByRole('button', { name: 'Actions for Beta' });
    const root = beta.getByRole('menu', { name: 'Actions for Beta' });
    await beta.getByRole('textbox', { name: 'Note Beta' }).click({ button: 'right' });
    assert.equal(await root.isVisible(), false);
    assert.equal(await occurrences(page, 'policy:Beta:true'), 1);
    await beta.getByText('Beta', { exact: true }).click({ button: 'right' });
    await root.waitFor();
    assert.equal(await beta.getAttribute('data-unica-context-menu-anchor'), 'point');
    assert.equal(await occurrences(page, 'run:Beta'), 0);
    assert.equal(await alpha.getByRole('checkbox').isChecked(), true);
    const link = root.getByRole('menuitem', { name: 'View Beta' });
    await link.click({ button: 'right' });
    assert.equal(await occurrences(page, 'policy:Beta:true'), 1);

    await button.click();
    await root.waitFor();
    assert.equal(await beta.getAttribute('data-unica-context-menu-anchor'), 'element');
    assert.equal(await occurrences(page, 'context:Beta:true'), 1);
    assert.equal(await occurrences(page, 'context:Beta:false'), 0);
    await button.click();
    await root.waitFor({ state: 'hidden' });
    assert.equal(await occurrences(page, 'context:Beta:false'), 1);

    const source = beta.getByText('Beta', { exact: true });
    await source.press('Shift+F10');
    await root.waitFor();
    await assertFocused(root.getByRole('menuitem', { name: 'Rename Beta' }));
    await page.keyboard.press('Escape');
    await assertFocused(source);

    await source.click({ button: 'right' });
    await root.waitFor();
    await alpha.getByText('Alpha', { exact: true }).click({ button: 'right' });
    const alphaMenu = alpha.getByRole('menu', { name: 'Actions for Alpha' });
    await alphaMenu.waitFor();
    assert.equal(await root.isVisible(), false);
    await alphaMenu.getByRole('menuitem', { name: 'Rename Alpha' }).click();
    await alphaMenu.waitFor({ state: 'hidden' });
    assert.equal(await occurrences(page, 'run:Alpha'), 1);
    assert.equal(await occurrences(page, 'run:Beta'), 0);
  },

  'ContextMenu rejects a nested gesture and drops a declined controlled point': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    const inner = page.getByText('Inner title', { exact: true });
    const outer = page.getByText('Outer title', { exact: true });
    const root = page.getByRole('menu', { name: 'Outer actions' });
    await outer.press('ContextMenu');
    assert.equal(await occurrences(page, 'outer-policy:keyboard'), 1);
    assert.equal(await occurrences(page, 'outer-policy:pointer'), 0);
    assert.equal(await root.isVisible(), false);
    await inner.click({ button: 'right' });
    assert.equal(await occurrences(page, 'inner-policy'), 1);
    assert.equal(await occurrences(page, 'outer-policy:pointer'), 0);
    await outer.focus();
    const accepted = await outer.evaluate((node) => {
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: 400,
        clientY: 125,
      });
      return node.dispatchEvent(event);
    });
    assert.equal(accepted, false);
    await assertFocused(outer);
    assert.equal(await root.isVisible(), false);
    assert.equal(await occurrences(page, 'outer-invoke:pointer:'), 1);
    assert.equal(await occurrences(page, 'outer-open:true'), 1);
    await page.getByRole('button', { name: 'Open context programmatically' }).click();
    await root.waitFor();
    assert.equal(
      await page
        .getByRole('region', { name: 'Outer object' })
        .getAttribute('data-unica-context-menu-anchor'),
      'element',
    );
    assert.equal(await occurrences(page, 'outer-invoke:button:'), 0);
  },

  'ContextMenu preserves outer native regions and the exact selected text': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    const row = page.getByTestId('Alpha');
    const source = row.getByText('Alpha', { exact: true });
    const button = row.getByRole('button', { name: 'Actions for Alpha' });
    const menu = row.getByRole('menu', { name: 'Actions for Alpha' });
    await source.evaluate((node) =>
      node.closest('table').setAttribute('data-native-context-region', ''),
    );
    await source.click({ button: 'right' });
    await source.press('Shift+F10');
    assert.equal(await occurrences(page, 'policy:Alpha:true'), 2);
    assert.equal(await countLayers(page), 0);

    const selected = await source.evaluate((node) => {
      node.closest('table').removeAttribute('data-native-context-region');
      const text = document.createTextNode('  ');
      node.style.whiteSpace = 'pre';
      node.append(text);
      const range = document.createRange();
      range.selectNodeContents(text);
      const selection = document.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });
    assert.equal(selected, '  ');
    await page.keyboard.press('Shift+F10');
    assert.equal(await occurrences(page, 'policy:Alpha:true'), 3);
    assert.equal(await countLayers(page), 0);
    await button.click();
    await menu.waitFor();
    assert.equal(await occurrences(page, 'invoke:Alpha:button:  '), 1);

    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });
    const multiline = await source.evaluate((node) => {
      const before = document.createTextNode('Before ');
      const after = document.createTextNode('  After ');
      node.append(before, document.createElement('br'), after);
      const range = document.createRange();
      range.setStart(before, 0);
      range.setEnd(after, after.length);
      const selection = document.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });
    assert.equal(multiline, 'Before \n  After ');
    await button.click();
    await menu.waitFor();
    assert.equal(await occurrences(page, `invoke:Alpha:button:${multiline}`), 1);
  },

  'ContextMenu uses the same focus return and one release guard for both contextmenu orders':
    async ({ page, mount }) => {
      await mount('menu');
      const source = page.getByText('Alpha', { exact: true });
      const root = page.getByRole('menu', { name: 'Actions for Alpha' });
      for (const afterRelease of [true, false]) {
        await source.scrollIntoViewIfNeeded();
        const point = await source.boundingBox();
        assert.ok(point);
        await source.evaluate((node) => {
          const suppressNative = (event) => {
            if (event.isTrusted) {
              event.preventDefault();
              event.stopImmediatePropagation();
            }
          };
          node.addEventListener('contextmenu', suppressNative, { capture: true, once: true });
        });
        await page.mouse.move(point.x + 3, point.y + 3);
        await page.mouse.down({ button: 'right' });
        if (afterRelease) {
          await page.mouse.up({ button: 'right' });
        }
        // Synthetic delivery varies the ordering while a real secondary contact is held.
        await emitContext(source, {
          button: 2,
          clientX: point.x + 3,
          clientY: point.y + 3,
          bubbles: true,
          cancelable: true,
          composed: true,
        });
        await root.waitFor();
        if (!afterRelease) {
          await page.mouse.up({ button: 'right' });
        }
        assert.equal(await occurrences(page, 'run:Alpha'), 0);
        assert.equal(await root.isVisible(), true);
        await page.keyboard.press('Escape');
        await root.waitFor({ state: 'hidden' });
        await assertFocused(source);
      }
      await source.click({ button: 'right' });
      await root.waitFor();
      await page.evaluate(() => window.scrollBy(0, 80));
      await root.waitFor({ state: 'hidden' });
    },

  'Menu preserves a controlled replacement and reports a native close from its callback once':
    async ({ page, mount }) => {
      await mount('menu');
      const trigger = page.getByRole('button', { name: 'Controlled actions' });
      const menu = page.getByRole('menu', { name: 'Controlled actions' });
      await page.getByRole('button', { name: 'Set controlled true' }).click();
      await menu.waitFor();
      await page
        .getByRole('button', { name: 'Replace native opening' })
        .evaluate((button) => button.click());
      await menu.waitFor();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      assert.equal(await occurrences(page, 'controlled:false'), 0);
      await page
        .getByRole('button', { name: 'Open dialog on close request' })
        .evaluate((button) => button.click());
      await menu.getByRole('menuitem', { name: 'Run command' }).click();
      await menu.waitFor({ state: 'hidden' });
      await assertFocused(page.getByRole('button', { name: 'Confirm' }));
      assert.equal(await occurrences(page, 'controlled:false'), 1);
    },

  'Menu repositions both cascading levels and closes an inline branch whose trigger becomes hidden':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1300, height: 650 });
      await mount('menu');
      const trigger = page.getByRole('button', { name: 'Record actions' });
      const root = page.getByRole('menu', { name: 'Record actions' });
      const branch = root.getByRole('menuitem', { name: 'Export' });
      await trigger.evaluate((button) =>
        Object.assign(button.style, { position: 'fixed', top: '80px', left: '100px' }),
      );
      await trigger.press('ArrowDown');
      await branch.press('ArrowRight');
      const outer = page.getByRole('menu', { name: 'Export', exact: true });
      const nested = outer.getByRole('menuitem', { name: 'Advanced formats' });
      await nested.press('ArrowRight');
      const inner = page.getByRole('menu', { name: 'Advanced formats' });
      const leaf = inner.getByRole('menuitemcheckbox', { name: 'Include notes' });
      await leaf.waitFor();
      assert.equal(await countLayers(page), 3);
      const rootScroll = root.locator('.unica-menu-scroll').first();
      assert.equal(await rootScroll.evaluate((node) => node.offsetHeight - node.clientHeight), 0);
      await trigger.evaluate((button) => {
        button.style.left = '1195px';
      });
      await page.locator('.unica-menu:popover-open[data-side="start"]').last().waitFor();
      await leaf.waitFor();
      assert.equal(await countLayers(page), 3);
      await assertFocused(leaf);

      await page.keyboard.press('Tab');
      await page.setViewportSize({ width: 360, height: 650 });
      await trigger.evaluate((button) => {
        button.style.left = '100px';
      });
      await trigger.press('ArrowDown');
      await branch.press('ArrowRight');
      await outer.waitFor();
      assert.equal(await countLayers(page), 1);
      await page
        .getByRole('button', { name: 'Hide export trigger' })
        .evaluate((button) => button.click());
      await root.waitFor();
      assert.equal(await outer.isVisible(), false);
    },

  'ContextMenu separates the keyboard pair, shifted secondary click, and native touch context':
    async ({ page, mount }) => {
      await mount('menu');
      const source = page.getByText('Alpha', { exact: true });
      const root = page.getByRole('menu', { name: 'Actions for Alpha' });
      const dispatch = (target, init) =>
        target.evaluate(
          (node, detail) =>
            node.dispatchEvent(
              new PointerEvent('contextmenu', {
                bubbles: true,
                composed: true,
                cancelable: true,
                ...detail,
              }),
            ),
          init,
        );
      await source.focus();
      const pairDefaults = await source.evaluate((node) => [
        node.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'F10',
            shiftKey: true,
            bubbles: true,
            composed: true,
            cancelable: true,
          }),
        ),
        node.dispatchEvent(
          new PointerEvent('contextmenu', {
            button: 0,
            shiftKey: true,
            pointerId: -1,
            pointerType: '',
            bubbles: true,
            composed: true,
            cancelable: true,
          }),
        ),
      ]);
      assert.deepEqual(pairDefaults, [false, false]);
      await root.waitFor();
      assert.equal(
        await dispatch(source, { button: 2, shiftKey: true, pointerId: 1, pointerType: 'mouse' }),
        true,
      );
      assert.equal(await occurrences(page, 'invoke:Alpha:keyboard:'), 1);
      assert.equal(await occurrences(page, 'invoke:Alpha:pointer:'), 0);
      await page.keyboard.press('Escape');
      const outer = page.getByText('Outer title', { exact: true });
      assert.equal(await dispatch(outer, { button: 0, pointerId: 77, pointerType: 'touch' }), true);
      assert.equal(await occurrences(page, 'outer-policy:pointer'), 0);

      await source.evaluate((node) => {
        node.removeAttribute('tabindex');
        node.setAttribute('contenteditable', 'false');
      });
      await source.click({ button: 'right' });
      await root.waitFor();
      await page.keyboard.press('Escape');
      await assertFocused(page.getByRole('button', { name: 'Actions for Alpha' }));
    },

  'ContextMenu tries each inline side at the viewport edge before clamping': async ({
    page,
    mount,
  }) => {
    for (const direction of ['ltr', 'rtl']) {
      await mount('menu', { direction });
      await emitContext(page.getByText('Alpha', { exact: true }), {
        clientX: direction === 'ltr' ? 760 : 40,
        clientY: 120,
        button: 2,
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      const menu = page.getByRole('menu', { name: 'Actions for Alpha' });
      await menu.waitFor();
      assert.equal(
        await menu.getAttribute('data-align'),
        'end',
        JSON.stringify(await menu.boundingBox()),
      );
      const box = await menu.boundingBox();
      assert.ok(box);
      assert.ok(
        Math.abs(
          (direction === 'ltr' ? box.x + box.width : box.x) - (direction === 'ltr' ? 756 : 44),
        ) < 1,
      );
    }
  },

  'ContextMenu touch admission honors the hold duration and movement tolerance': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    const source = page.getByText('Alpha', { exact: true });
    const point = await source.boundingBox();
    assert.ok(point);
    const dispatch = (type, id, dx = 0, primary = true) =>
      source.evaluate(
        (node, init) => {
          const { type, id, x, y, primary } = init;
          return node.dispatchEvent(
            new PointerEvent(type, {
              pointerType: 'touch',
              pointerId: id,
              isPrimary: primary,
              button: 0,
              clientX: x,
              clientY: y,
              bubbles: true,
              cancelable: true,
              composed: true,
            }),
          );
        },
        { type, id, x: point.x + dx, y: point.y, primary },
      );
    const root = page.getByRole('menu', { name: 'Actions for Alpha' });
    await page.getByText('Inner title', { exact: true }).evaluate((node) => {
      node.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          composed: true,
          pointerType: 'touch',
          pointerId: 10,
          isPrimary: true,
        }),
      );
    });
    await page.clock.runFor(500);
    assert.equal(await occurrences(page, 'outer-invoke:touch:'), 0);
    assert.equal(await occurrences(page, 'outer-policy:touch'), 0);

    await dispatch('pointerdown', 11);
    await page.clock.runFor(499);
    await dispatch('pointerup', 11);
    await page.clock.runFor(1);
    assert.equal(await occurrences(page, 'invoke:Alpha:touch:'), 0);

    await dispatch('pointerdown', 12);
    await dispatch('pointermove', 12, 11);
    assert.equal(await dispatch('contextmenu', 12, 11), true);
    await page.clock.runFor(500);
    assert.equal(await occurrences(page, 'invoke:Alpha:touch:'), 0);

    await dispatch('pointerdown', 15);
    await source.evaluate((node) => {
      node.style.visibility = 'hidden';
    });
    await page.clock.runFor(500);
    assert.equal(await occurrences(page, 'invoke:Alpha:touch:'), 0);
    await source.evaluate((node) => {
      node.style.visibility = '';
    });

    await dispatch('pointerdown', 13);
    await dispatch('pointermove', 13, 10);
    await page.clock.runFor(499);
    assert.equal(await occurrences(page, 'invoke:Alpha:touch:'), 0);
    await page.clock.runFor(1);
    assert.equal(await occurrences(page, 'invoke:Alpha:touch:'), 1);
    await page.clock.runFor(32);
    await root.waitFor();
    await dispatch('pointerdown', 14, 0, false);
    assert.equal(await dispatch('contextmenu', 14, 0, false), true);
    assert.equal(await dispatch('contextmenu', 13), false);
    assert.equal(await dispatch('pointerup', 13), false);
    await page.clock.resume();
    await root.getByRole('menuitem', { name: 'Rename Alpha' }).click();
    await root.waitFor({ state: 'hidden' });
    assert.equal(await occurrences(page, 'run:Alpha'), 1);
  },

  'Menu recovers focus after author visibility changes to a row or inline branch group': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await mount('menu');
    const trigger = page.getByRole('button', { name: 'Record actions' });
    const menu = page.getByRole('menu', { name: 'Record actions' });
    const duplicate = page.getByTestId('duplicate-command').first();
    const next = menu.getByRole('menuitem', { name: 'Delete' });
    for (const property of ['inert', 'hidden']) {
      await trigger.press('ArrowDown');
      await assertFocused(duplicate);
      await duplicate.evaluate((node, property) => {
        if (property === 'inert') {
          node.inert = true;
        } else {
          node.style.visibility = 'hidden';
        }
      }, property);
      await assertFocused(next);
      await page.keyboard.press('Escape');
      await duplicate.evaluate((node) => {
        node.inert = false;
        node.style.visibility = '';
      });
    }
    // A row's authored display must not cancel the level's structural isolation.
    await duplicate.evaluate((node) => {
      node.style.display = 'flex';
    });
    await page
      .getByTestId('export-branch')
      .first()
      .evaluate((node) => {
        node.style.display = 'flex';
      });
    const exportRow = menu.getByRole('menuitem', { name: 'Export' });
    const inline = page.getByRole('menu', { name: 'Export', exact: true });
    for (const [target, method] of [
      ['export-group', 'hidden'],
      ['export-group', 'display'],
      ['export-branch', 'display'],
    ]) {
      await trigger.press('ArrowDown');
      await exportRow.press('ArrowRight');
      await inline.waitFor();
      assert.equal(await duplicate.isVisible(), false);
      assert.equal(await inline.getByRole('menuitem', { name: 'Duplicate' }).count(), 0);
      assert.equal(await inline.getByRole('menuitem', { name: 'Export', exact: true }).count(), 0);
      const origin = page.getByTestId(target).first();
      await origin.evaluate((node, method) => {
        if (method === 'hidden') {
          node.hidden = true;
        } else {
          node.style.display = 'none';
        }
      }, method);
      await menu.waitFor();
      assert.equal(await inline.isVisible(), false);
      await assertFocused(duplicate);
      await origin.evaluate((node) => {
        node.hidden = false;
        node.style.display = '';
      });
    }
    await menu.evaluate((node) => {
      node.hidden = true;
    });
    await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await assertFocused(trigger);
  },

  'Menu closes author-hidden carriers and avoids opening them as other levels': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await mount('menu');
    const trigger = page.getByRole('button', { name: 'Record actions' });
    const menu = page.getByRole('menu', { name: 'Record actions' });
    await trigger.press('ArrowDown');
    await menu.waitFor();
    const panelId = await menu.getAttribute('id');
    const panel = page.locator(`[id="${panelId}"]`);
    await menu.getByRole('menuitem', { name: 'Export' }).press('ArrowRight');
    await page.getByRole('menu', { name: 'Export', exact: true }).waitFor();
    await panel.locator('[data-unica-menu-inline]').evaluate((host) => {
      host.style.display = 'none';
    });
    await menu.waitFor();
    assert.equal(await countLayers(page), 1);
    await assertFocused(menu.getByRole('menuitem', { name: 'Export' }));
    await page.keyboard.press('ArrowRight');
    assert.equal(await countLayers(page), 1);
    assert.equal(await menu.isVisible(), true);

    await panel.evaluate((node) => {
      node.style.display = 'none';
    });
    await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await assertFocused(trigger);
    await trigger.press('ArrowDown');
    assert.equal(await countLayers(page), 0);
  },

  'Menu resumes hover intent when the pointer returns after a canceled delay': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1100, height: 720 });
    await mount('menu');
    await page.getByRole('button', { name: 'Record actions' }).click();
    const row = page.getByRole('menuitem', { name: 'Export' });
    await row.waitFor();
    const box = await row.boundingBox();
    assert.ok(box);
    const target = [box.x + box.width / 2, box.y + box.height / 2];
    const child = page.getByRole('menu', { name: 'Export', exact: true });
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await page.mouse.move(...target);
    await page.clock.runFor(40);
    await page.mouse.move(5, 5);
    await page.clock.runFor(250);
    assert.equal(await child.isVisible(), false);
    await page.mouse.move(...target);
    await page.clock.runFor(220);
    await page.clock.resume();
    await child.waitFor();
    assert.equal(await countLayers(page), 2);
  },

  'Menu keeps a 2px gap between adjacent rows when a submenu is expanded': async ({
    page,
    mount,
  }) => {
    const assertGap = async (before, after) => {
      const first = await before.boundingBox();
      const second = await after.boundingBox();
      assert.ok(first && second);
      assert.equal(second.y - first.y - first.height, 2);
    };

    await page.setViewportSize({ width: 1200, height: 850 });
    await mount('menu', { theme: 'pixel-dark' });
    const trigger = page.getByRole('button', { name: 'Record actions' });
    await trigger.press('ArrowDown');
    const menu = page.getByRole('menu', { name: 'Record actions' });
    await menu.waitFor();
    const date = menu.getByRole('menuitemradio', { name: 'Date' });
    const name = menu.getByRole('menuitemradio', { name: 'Name' });
    const branch = menu.getByRole('menuitem', { name: 'Export' });
    const cancel = menu.getByRole('menuitem', { name: 'Cancel activation' });
    await assertGap(date, name);
    await assertGap(name, branch);
    await assertGap(branch, cancel);
    await page.keyboard.press('Escape');

    await page.setViewportSize({ width: 360, height: 650 });
    await trigger.press('ArrowDown');
    await branch.press('ArrowRight');
    const inline = page.getByRole('menu', { name: 'Export', exact: true });
    await assertGap(
      inline.getByRole('menuitem', { name: 'PDF' }),
      inline.getByRole('menuitem', { name: 'Advanced formats' }),
    );
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await page.setViewportSize({ width: 1200, height: 850 });
    await page.getByText('Alpha', { exact: true }).click({ button: 'right' });
    const context = page.getByRole('menu', { name: 'Actions for Alpha' });
    const previous = context.getByRole('menuitem', { name: 'View Alpha' });
    const contextBranch = context.getByRole('menuitem', { name: 'Export Alpha' });
    await contextBranch.click();
    await page.getByRole('menu', { name: 'Export Alpha' }).waitFor();
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await previous.hover();
    await assertGap(previous, contextBranch);
    const highlights = await previous.evaluate((node) => {
      const expanded = node.closest('[role="menu"]').querySelector('[aria-expanded="true"]');
      return [
        node.matches(':hover'),
        expanded && getComputedStyle(expanded).backgroundColor,
        getComputedStyle(node).backgroundColor,
      ];
    });
    assert.equal(highlights[0], true);
    assert.equal(highlights[1], highlights[2]);
    assert.notEqual(highlights[2], 'rgba(0, 0, 0, 0)');
  },

  'Menu keeps closed carriers hidden when styled and dismisses inert levels': async ({
    page,
    mount,
  }) => {
    for (const width of [360, 1100]) {
      await page.setViewportSize({ width, height: 700 });
      await mount('menu');
      const trigger = page.getByRole('button', { name: 'Record actions' });
      const menu = page.getByRole('menu', { name: 'Record actions' });
      const panel = page.locator(`[id="${await trigger.getAttribute('aria-controls')}"]`);
      const child = panel.locator('[data-unica-menu-carrier]').first();
      await panel.evaluate((node) => {
        node.style.display = 'flex';
      });
      assert.equal(await panel.isVisible(), false);

      await trigger.press('ArrowDown');
      await menu.waitFor();
      await child.evaluate((node) => {
        node.style.display = 'flex';
        node.inert = true;
      });
      assert.equal(await child.isVisible(), false);
      const branch = menu.getByRole('menuitem', { name: 'Export' });
      await branch.press('ArrowRight');
      assert.equal(await branch.getAttribute('aria-expanded'), 'false');
      assert.equal(await countLayers(page), 1);
      await assertFocused(branch);

      await child.evaluate((node) => {
        node.inert = false;
        node.style.display = '';
      });
      await branch.press('ArrowRight');
      const nested = page.getByRole('menu', { name: 'Export', exact: true });
      await nested.waitFor();
      await assertFocused(nested.getByRole('menuitem', { name: 'PDF' }));
      await child.evaluate((node) => {
        node.inert = true;
      });
      await nested.waitFor({ state: 'hidden' });
      await assertFocused(branch);
      assert.equal(await countLayers(page), 1);

      await panel.evaluate((node) => {
        node.inert = true;
      });
      await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
      await assertFocused(trigger);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      await trigger.press('ArrowDown');
      assert.equal(await countLayers(page), 0);
    }
  },

  'Menu dismisses when a separate content wrapper becomes unavailable': async ({ page, mount }) => {
    await mount('menu');
    const trigger = page.getByRole('button', { name: 'Record actions' });
    const menu = page.getByRole('menu', { name: 'Record actions' });
    const wrapper = page.getByTestId('record-menu-content');
    await page.addStyleTag({ content: '[data-suppress-record-panel] { visibility: hidden; }' });
    for (const [index, attribute] of ['inert', 'display', 'visibility', 'open', 'data'].entries()) {
      await trigger.press('ArrowDown');
      await menu.waitFor();
      await wrapper.evaluate((node, attribute) => {
        if (attribute === 'inert') {
          node.inert = true;
        } else if (attribute === 'open') {
          node.open = false;
        } else if (attribute === 'data') {
          node.setAttribute('data-suppress-record-panel', '');
        } else {
          node.style[attribute] = attribute === 'display' ? 'none' : 'hidden';
        }
      }, attribute);
      await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
      await assertFocused(trigger);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert.equal(await occurrences(page, 'main:false'), index + 1);
      await wrapper.evaluate((node) => {
        node.inert = false;
        node.open = true;
        node.removeAttribute('data-suppress-record-panel');
        node.style.cssText = '';
      });
    }
  },

  'Menu restores lost focus after React removes the panel and respects an outside target': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    const trigger = page.getByRole('button', { name: 'Record actions' });
    const menu = page.getByRole('menu', { name: 'Record actions' });
    const toggle = page.getByRole('button', { name: 'Toggle record panel' });
    const outside = page.getByRole('textbox', { name: 'After menu' });

    await trigger.press('ArrowDown');
    await menu.waitFor();
    await assertFocused(menu.getByRole('menuitem', { name: 'Duplicate' }));
    await toggle.evaluate((button) => button.click());
    await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
    await assertFocused(trigger);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(await occurrences(page, 'main:false'), 1);

    await toggle.evaluate((button) => button.click());
    await trigger.press('ArrowDown');
    await menu.waitFor();
    await outside.focus();
    await toggle.evaluate((button) => button.click());
    await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
    await assertFocused(outside);
    assert.equal(await occurrences(page, 'main:false'), 2);
  },

  'Menu sees delayed carrier visibility changes with either menu or outside focus': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    const trigger = page.getByRole('button', { name: 'Record actions' });
    const menu = page.getByRole('menu', { name: 'Record actions' });
    const wrapper = page.getByTestId('record-menu-content');
    const style = await page.addStyleTag({
      content: '[data-record-delay] { transition: visibility 100ms linear; }',
    });
    await wrapper.evaluate((node) => node.setAttribute('data-record-delay', ''));
    await trigger.press('ArrowDown');
    await menu.waitFor();
    await wrapper.evaluate((node) => {
      node.style.visibility = 'hidden';
    });
    await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
    await assertFocused(trigger);
    assert.equal(await occurrences(page, 'main:false'), 1);

    await wrapper.evaluate((node) => {
      node.removeAttribute('data-record-delay');
      node.style.visibility = '';
    });
    await trigger.press('ArrowDown');
    await menu.waitFor();
    const outside = page.getByRole('textbox', { name: 'After menu' });
    await outside.evaluate((node) => node.focus({ preventScroll: true }));
    await assertFocused(outside);
    assert.equal(await countLayers(page), 1);
    await style.evaluate((node) => {
      node.sheet.insertRule('[data-testid="record-menu-content"] { visibility: hidden; }');
    });
    await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
    await assertFocused(outside);
    assert.equal(await occurrences(page, 'main:false'), 2);
  },

  'Menu recovers its level and row focus after CSS rules change in place': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const [scenario, next] of [
      ['focused-row', 'Delete'],
      ['inline-panel', 'Export'],
      ['inline-source', 'Duplicate'],
      ['inline-wrapper', 'Export'],
    ]) {
      await mount('menu');
      const style = await page.addStyleTag({ content: '/* Menu visibility probe */' });
      const trigger = page.getByRole('button', { name: 'Record actions' });
      const menu = page.getByRole('menu', { name: 'Record actions' });
      const source = page.getByTestId('record-menu-content').getByTestId('export-branch');
      const duplicate = menu.getByRole('menuitem', { name: 'Duplicate' });
      const carrier = page.locator('[data-unica-menu-inline]');
      const focused = page.locator(':focus');
      await trigger.press('ArrowDown');
      await duplicate.and(focused).waitFor();

      let target = duplicate;
      if (scenario !== 'focused-row') {
        await source.press('ArrowRight');
        await page.getByRole('menuitem', { name: 'PDF' }).and(focused).waitFor();
        target = scenario === 'inline-panel' ? carrier : source;
      }
      const id = await target.getAttribute('id');
      assert.ok(id);
      const rule =
        scenario === 'inline-wrapper'
          ? '[data-testid="record-menu-content"] [data-testid="export-panel-wrapper"] { display: none; }'
          : `[id="${id}"] { visibility: hidden; }`;
      await style.evaluate((node, rule) => node.sheet.insertRule(rule), rule);
      await menu.getByRole('menuitem', { name: next, exact: true }).and(focused).waitFor();
      assert.equal(await countLayers(page), 1, scenario);
      assert.equal(await source.getAttribute('aria-expanded'), 'false', scenario);
    }
  },

  'Menu finalizes a controlled pane loss once and respects an explicit closed commit': async ({
    page,
    mount,
  }) => {
    const trigger = page.getByRole('button', { name: 'Controlled actions' });
    const menu = page.getByRole('menu', { name: 'Controlled actions' });
    const wrapper = page.getByTestId('controlled-menu-content');
    const open = async () => {
      await mount('menu');
      await trigger.focus();
      await page
        .getByRole('button', { name: 'Set controlled true' })
        .evaluate((node) => node.click());
      await menu.waitFor();
    };
    for (const method of ['hide', 'remove']) {
      await open();
      await wrapper.evaluate((node, method) => {
        if (method === 'remove') {
          node.remove();
        } else {
          node.hidden = true;
        }
      }, method);
      await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
      await assertFocused(trigger);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert.equal(await occurrences(page, 'controlled:false'), 1);
    }

    await open();
    await page
      .getByRole('button', { name: 'Remove closed controlled panel' })
      .evaluate((node) => node.click());
    await page.locator('[popover]:popover-open').waitFor({ state: 'detached' });
    await assertFocused(trigger);
    assert.equal(await occurrences(page, 'controlled:false'), 0);

    await open();
    await menu.getByRole('menuitem', { name: 'Review and remove panel' }).click();
    const dialog = page.getByRole('dialog', { name: 'Confirm deletion' });
    await assertFocused(dialog.getByRole('button', { name: 'Confirm' }));
    assert.equal(await countLayers(page), 0);
    assert.equal(await occurrences(page, 'controlled:false'), 1);
  },

  'Menu takes its fallback name from alt and title on the actual button': async ({
    page,
    mount,
  }) => {
    await mount('menu');
    for (const name of ['Icon actions', 'Image actions']) {
      const button = page.getByRole('button', { name, exact: true });
      await button.press('ArrowDown');
      const menu = page.getByRole('menu', { name, exact: true });
      await menu.waitFor();
      assert.equal(await menu.getAttribute('aria-labelledby'), await button.getAttribute('id'));
      await page.keyboard.press('Escape');
      await menu.waitFor({ state: 'hidden' });
    }
  },

  'ContextMenu uses an actually focused media caller and falls back after an unusable summary':
    async ({ page, mount }) => {
      await mount('menu');
      const row = page.getByTestId('Alpha');
      await row.evaluate((node) => {
        const video = document.createElement('video');
        video.setAttribute('data-test-policy', '');
        video.setAttribute('data-testid', 'media-caller');
        video.controls = true;
        video.width = 90;
        video.height = 32;
        const details = document.createElement('details');
        details.open = true;
        const first = document.createElement('summary');
        first.textContent = 'Details';
        const second = document.createElement('summary');
        second.textContent = 'Secondary summary';
        details.append(first, second);
        const diagram = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        diagram.setAttribute('data-testid', 'diagram-caller');
        diagram.setAttribute('tabindex', '0');
        diagram.setAttribute('width', '22');
        diagram.setAttribute('height', '22');
        node.firstElementChild.append(video, details, diagram);
      });
      const media = row.getByTestId('media-caller');
      await media.focus();
      await assertFocused(media);
      const menu = row.getByRole('menu', { name: 'Actions for Alpha' });
      await media.press('Shift+F10');
      await menu.waitFor();
      assert.equal(await menu.getAttribute('data-side'), 'bottom');
      const panel = await menu.boundingBox();
      const caller = await media.boundingBox();
      assert.ok(panel && caller && Math.abs(panel.y - caller.y - caller.height - 6) < 1);
      await page.keyboard.press('Escape');
      await assertFocused(media);
      await row.getByText('Secondary summary', { exact: true }).click({ button: 'right' });
      await menu.waitFor();
      await page.keyboard.press('Escape');
      await assertFocused(row.getByRole('button', { name: 'Actions for Alpha' }));

      const diagram = row.getByTestId('diagram-caller');
      await diagram.focus();
      await assertFocused(diagram);
      await diagram.press('Shift+F10');
      await menu.waitFor();
      const diagramBox = await diagram.boundingBox();
      const svgPanel = await menu.boundingBox();
      const side = await menu.getAttribute('data-side');
      assert.ok(diagramBox && svgPanel);
      const gap =
        side === 'bottom'
          ? svgPanel.y - (diagramBox.y + diagramBox.height)
          : diagramBox.y - (svgPanel.y + svgPanel.height);
      assert.ok(Math.abs(gap - 6) < 1, `SVG anchor uses a 6px gap, got ${gap}`);
      await page.keyboard.press('Escape');
      await assertFocused(diagram);
    },

  'Menu materials keep a usable native panel across presets and narrow RTL': async ({
    page,
    mount,
  }) => {
    for (const [index, theme] of [
      'soft-dark',
      'soft-light',
      'frost-dark',
      'frost-light',
      'pixel-dark',
      'pixel-light',
    ].entries()) {
      const width = [360, 768, 1280, 1440, 768, 360][index];
      await page.setViewportSize({ width, height: 610 });
      await mount('menu', {
        theme,
        surface: index % 2 ? 'base' : 'overlay',
        direction: index % 2 ? 'ltr' : 'rtl',
        textScale: 120,
        forcedColors: index === 5 ? 'active' : 'none',
        reducedMotion: index % 2 ? 'reduce' : 'no-preference',
      });
      const trigger = page.getByRole('button', { name: 'Record actions' });
      await trigger.press('ArrowDown');
      const menu = page.getByRole('menu', { name: 'Record actions' });
      await menu.waitFor();
      const box = await menu.boundingBox();
      assert.ok(box.x >= 15 && box.x + box.width <= width - 15, JSON.stringify(box));
      const radius = await menu.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
      assert.equal(radius, theme.startsWith('pixel') ? '0px' : '10px', theme);
      const scroller = menu.locator('.unica-menu-scroll').first();
      assert.equal(await scroller.evaluate((node) => getComputedStyle(node).overflowY), 'auto');
      await page.keyboard.press('ArrowDown');
      const item = menu.getByRole('menuitem', { name: 'Delete' });
      await assertFocused(item);
      assert.deepEqual(
        await item.evaluate((node) => {
          const style = getComputedStyle(node);
          return [style.outlineStyle, style.outlineWidth, style.outlineOffset];
        }),
        ['solid', '2px', '-2px'],
        theme,
      );
    }
  },
};

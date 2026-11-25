import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

async function openWorkbench(page, route) {
  await page.locator('.wb-shell[data-wb-item="popover"]').waitFor({ state: 'attached' });
  await page.evaluate(
    (params) => {
      const url = new URL(window.location.href);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
      history.pushState(null, '', url);
      dispatchEvent(new PopStateEvent('popstate'));
    },
    { item: 'popover', family: 'frost', scheme: 'dark', ...route },
  );
  await page.waitForFunction(({ tab, block }) => {
    const shell = document.querySelector('.wb-shell[data-wb-item="popover"]');
    const boards = shell?.querySelectorAll('.wb-artboard');
    return (
      shell?.getAttribute('data-wb-tab') === tab &&
      (!block || shell.getAttribute('data-wb-block') === block) &&
      boards?.length === 1 &&
      boards[0].getAttribute('data-theme') === 'frost-dark'
    );
  }, route);
}

const nativePanel = 'div[popover="auto"][role="dialog"]:popover-open';

export default {
  'Popover Matrix keeps its uncontrolled and controlled opening combinations closed': async ({
    page,
    mount,
  }) => {
    const warnings = [];
    page.on('console', (entry) => {
      if (entry.type() === 'warning' && entry.text().includes('Popover requires')) {
        warnings.push(entry.text());
      }
    });
    await page.setViewportSize({ width: 1440, height: 760 });
    await mount('popover-workbench');
    await openWorkbench(page, { tab: 'states', mode: 'pairwise' });
    const matrix = page.getByRole('region', { name: 'Component matrix' });
    await matrix.locator('[data-wb-subject]').first().waitFor();
    assert.equal(await matrix.getAttribute('data-wb-matrix-mode'), 'pairwise');
    assert.equal(await matrix.locator('.wb-artboard').count(), 1);
    assert.equal(await matrix.locator(nativePanel).count(), 0);
    assert.equal(await matrix.getByRole('button', { name: 'Page settings' }).count(), 0);
    const previews = matrix.locator('button[data-wb-subject]');
    const composed = previews.and(matrix.locator('[data-unica-button-variant="secondary"]'));
    const native = previews.and(matrix.locator('button:not([data-unica-button-variant])'));
    assert.equal(await composed.first().getAttribute('inert'), '');
    assert.equal(await native.first().getAttribute('inert'), '');

    const more = matrix.getByRole('button', { name: /Show more rows/ }).first();
    await more.focus();
    const visible = await matrix.locator('[data-wb-result-row]').count();
    await more.press('Enter');
    await page.waitForFunction(
      (previous) => document.querySelectorAll('[data-wb-result-row]').length > previous,
      visible,
    );
    assert.equal(await matrix.locator(nativePanel).count(), 0);

    const all = page.getByRole('group', { name: 'Family' }).getByRole('link', { name: 'All' });
    const both = page.getByRole('group', { name: 'Scheme' }).getByRole('link', { name: 'Both' });
    await all.click();
    await both.click();
    await page.waitForFunction(
      () => document.querySelectorAll('.wb-matrix .wb-artboard').length === 6,
    );
    assert.equal(await matrix.locator(nativePanel).count(), 0);
    await assertFocused(both);
    for (const [slice, rows] of [
      ['sizes', 3],
      ['placement', 12],
    ]) {
      await openWorkbench(page, { tab: 'states', mode: 'overview', slice });
      const group = page.locator(`[data-wb-slice="${slice}"]`);
      const samples = group.locator('button[data-wb-subject]');
      await samples.first().waitFor();
      assert.equal(await samples.count(), rows);
      const linked = await samples.evaluateAll((buttons) =>
        buttons.every((button) => {
          const content = button.ownerDocument.getElementById(button.getAttribute('aria-controls'));
          return button.inert && content?.matches('[role="dialog"][popover]:not(:popover-open)');
        }),
      );
      assert.equal(linked, true);
    }
    assert.deepEqual(warnings, []);
  },

  'Popover Playground opens a real inline subject with Bounds and native FormData': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await mount('popover-workbench');
    await openWorkbench(page, { tab: 'playground', bounds: '1' });
    const trigger = page.getByRole('button', { name: 'Page settings' });
    const dialog = page.getByRole('dialog', { name: 'Page settings' });
    const field = dialog.getByRole('textbox', { name: 'Display name' });
    await trigger.waitFor();
    assert.equal(await page.getByRole('button', { name: 'Submit', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Reset', exact: true }).count(), 0);
    await page.locator('[data-wb-bounds-label]').first().waitFor();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await trigger.click();
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute('popover'), 'auto');
    assert.equal(await dialog.getAttribute('id'), await trigger.getAttribute('aria-controls'));
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    await assertFocused(field);
    const inputOutline = () =>
      field.evaluate((node) => {
        const { outlineStyle, outlineWidth } = getComputedStyle(node.closest('.unica-input'));
        return [outlineStyle, outlineWidth];
      });
    assert.equal((await inputOutline())[0], 'none');
    await page.keyboard.press('Shift+Tab');
    await assertFocused(dialog.getByRole('button', { name: 'Close popover' }));
    await page.keyboard.press('Tab');
    await assertFocused(field);
    assert.deepEqual(await inputOutline(), ['solid', '2px']);
    await page.locator('[data-wb-native-layer] [data-wb-bounds-label]').first().waitFor();

    await field.fill('Discarded draft');
    await dialog.getByRole('button', { name: 'Reset name' }).click();
    assert.equal(await field.inputValue(), 'Release notes');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    await field.fill('Release checklist');
    await field.press('Enter');
    await assertFocused(field);
    await field.fill('Another draft');
    await page.evaluate(() => {
      document.addEventListener('reset', (event) => event.preventDefault(), { once: true });
    });
    const resetName = dialog.getByRole('button', { name: 'Reset name' });
    await resetName.press('Enter');
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(await field.inputValue(), 'Another draft');
    await resetName.click();
    await page.waitForFunction(
      (node) => node.value === 'Release checklist',
      await field.elementHandle(),
    );
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await assertFocused(trigger);
    await page.getByRole('tab', { name: 'FormData' }).click();
    assert.match(
      await page.getByRole('tabpanel', { name: 'FormData' }).innerText(),
      /Release checklist/u,
    );

    await page.getByRole('tab', { name: 'Controls' }).click();
    await page.getByRole('checkbox', { name: 'defaultOpen' }).check();
    await dialog.waitFor();
    await assertFocused(dialog);
    assert.equal(await field.inputValue(), 'Release checklist');
    await dialog.getByRole('button', { name: 'Close popover' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByRole('combobox', { name: 'open', exact: true }).selectOption('false');
    await trigger.click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator(nativePanel).count(), 0);
    await page.getByRole('tab', { name: 'Events' }).click();
    const events = page.getByRole('tabpanel', { name: 'Events' });
    assert.equal(await events.getByText('reset', { exact: true }).count(), 3);
    assert.deepEqual(await events.getByRole('listitem').last().locator('code').allTextContents(), [
      'onOpenChange',
      'true',
    ]);
  },

  'Popover placements contain edge collisions and continue Tab inside the scaled RTL example':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1390, height: 900 });
      await mount('popover-workbench');
      await openWorkbench(page, {
        tab: 'states',
        block: 'placements',
        vp: '1440',
        dir: 'rtl',
        scale: '120',
      });
      await page.getByRole('group', { name: 'Family' }).getByRole('link', { name: 'All' }).click();
      await page.getByRole('group', { name: 'Scheme' }).getByRole('link', { name: 'Both' }).click();
      const study = page.locator('[data-wb-block="placements"]');
      await study.getByRole('combobox', { name: 'Side' }).selectOption('top');
      await study.getByRole('combobox', { name: 'Anchor' }).selectOption('top-start');
      const frame = study.locator('.wb-artboard[data-theme="soft-dark"] iframe');
      const owner = frame.contentFrame();
      const trigger = owner.getByRole('button', { name: 'Page settings' });
      const panel = owner.getByRole('dialog', { name: 'Page settings' });
      const field = panel.getByRole('textbox', { name: 'Display name' });
      const note = owner.getByRole('textbox', { name: 'Page note' });
      assert.ok(await frame.evaluate((n) => n.getBoundingClientRect().width < n.offsetWidth * 0.9));
      await frame.scrollIntoViewIfNeeded();
      await trigger.press('Enter');
      await field.waitFor();
      const placement = await panel.evaluate((n) => {
        const box = n.getBoundingClientRect(),
          view = n.ownerDocument.documentElement;
        return {
          side: n.dataset.side,
          inside:
            box.left >= 0 &&
            box.top >= 0 &&
            box.right <= view.clientWidth &&
            box.bottom <= view.clientHeight,
        };
      });
      assert.deepEqual(placement, { side: 'bottom', inside: true });
      await field.fill('Publication notes');
      await field.press('Tab');
      await panel.waitFor({ state: 'hidden' });
      await assertFocused(note);
      await trigger.press('Enter');
      assert.equal(await field.inputValue(), 'Publication notes');
      await field.press('Escape');
      await assertFocused(trigger);
    },

  'Popover Cases validate, preserve a failed draft, retry, and discard cancelled edits': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 850 });
    await mount('popover-workbench');
    await openWorkbench(page, { tab: 'states', block: 'form' });
    const sample = page.locator('[data-wb-block="form"]');
    const trigger = sample.getByRole('button', { name: 'Edit link' });
    const dialog = sample.getByRole('dialog', { name: 'Edit link' });
    const text = dialog.getByRole('textbox', { name: 'Text' });
    const url = dialog.getByRole('textbox', { name: 'Web address' });
    const save = dialog.getByRole('button', { name: 'Save link' });
    const failNext = sample.getByRole('checkbox', { name: 'Fail the next save' });
    await failNext.check();
    await trigger.click();
    await text.fill('Read the checklist');
    await url.fill('bad link');
    await save.click();
    await assertFocused(url);
    assert.equal(await failNext.isChecked(), true);
    assert.equal(await url.getAttribute('aria-invalid'), 'true');
    assert.equal(await dialog.isVisible(), true);

    await url.fill('https://example.com/checklist');
    await save.click();
    await dialog.getByRole('button', { name: 'Saving…' }).waitFor();
    assert.equal(await url.getAttribute('readonly'), '');
    assert.equal(await failNext.isChecked(), false);
    await dialog.getByRole('alert').waitFor();
    assert.equal(await text.inputValue(), 'Read the checklist');
    await dialog.getByRole('button', { name: 'Try again' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await assertFocused(trigger);
    assert.equal(await sample.getByRole('status').innerText(), 'Link saved.');

    await trigger.click();
    assert.equal(await text.inputValue(), 'Read the checklist');
    assert.equal(await url.inputValue(), 'https://example.com/checklist');
    await text.fill('Discard this edit');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await trigger.click();
    assert.equal(await text.inputValue(), 'Read the checklist');
  },

  'Popover Cases keeps focus in the activity panel after retry replaces the alert': async ({
    page,
    mount,
  }) => {
    await mount('popover-workbench');
    await openWorkbench(page, { tab: 'states', block: 'content' });
    const sample = page.locator('[data-wb-block="content"]');
    const control = sample.getByRole('combobox', { name: 'Activity state' });
    await control.selectOption('error');
    await sample.getByRole('button', { name: 'Recent activity' }).click();
    const panel = sample.getByRole('dialog', { name: 'Recent activity' });
    const retry = panel.getByRole('button', { name: 'Try again' });
    await assertFocused(retry);
    await page.keyboard.press('Enter');
    await panel.getByText('Review completed').waitFor();
    assert.equal(await panel.getByRole('alert').count(), 0);
    await assertFocused(panel);
    assert.equal(await control.inputValue(), 'ready');
  },
};

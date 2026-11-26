import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys, resetForm } from '../helpers.mjs';

const button = (scope, name) => scope.getByRole('button', { name, exact: true });
const remove = (scope, label) => button(scope, 'Remove ' + label);
const primary = (page) => page.getByRole('toolbar', { name: 'Assigned labels', exact: true });
const other = (page) => page.getByRole('toolbar', { name: 'Other labels', exact: true });
const owner = (page, id) => page.getByTestId(id).evaluate((action) => action.click());
const tabs = (scope) =>
  scope.locator('button').evaluateAll((buttons) => buttons.map((action) => action.tabIndex));
const status = (scope) => scope.getByRole('status').textContent();
const visibleHint = '[role="tooltip"]:popover-open';
const labelPart = '[data-unica-tag-part="label"]';

export default {
  'Tag uses native activation and form behavior, including the first fieldset legend': async ({
    page,
    mount,
  }) => {
    await mount('tag');
    const form = page.getByRole('form', { name: 'Document' });
    const release = remove(form, 'Release');
    const legend = remove(form, 'Legend');
    const unavailable = remove(form, 'Fieldset');
    const blocked = form.getByRole('toolbar', { name: 'Fieldset labels' });
    const requests = page.getByTestId('standalone-requests');
    assert.equal(await release.getAttribute('type'), 'button');
    assert.equal(await legend.isEnabled(), true);
    assert.equal(await unavailable.isDisabled(), true);
    assert.equal(await unavailable.getAttribute('aria-busy'), null);
    assert.deepEqual(await tabs(blocked), [-1, -1]);
    assert.equal(await button(blocked, '+1 more value').isDisabled(), true);

    await form.getByTestId('standalone').locator(labelPart).click();
    assert.equal(await requests.textContent(), '0');
    await release.click();
    await pressKeys(page, 'Enter', 'Space', 'Delete', 'Backspace');
    assert.equal(await requests.textContent(), '3');
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    assert.equal(await requests.textContent(), '4');
    await owner(page, 'toggle-loading');
    await assertFocused(release);
    assert.equal(await release.getAttribute('aria-busy'), 'true');
    assert.equal(await legend.getAttribute('aria-busy'), 'true');
    assert.equal(await release.evaluate((action) => action.matches(':disabled')), false);
    await pressKeys(page, 'Enter', 'Space');
    await release.evaluate((action) => action.click());
    assert.equal(await requests.textContent(), '4');
    await owner(page, 'toggle-loading');
    await legend.click();
    assert.equal(await requests.textContent(), '5');

    await owner(page, 'toggle-fieldset');
    assert.equal(await unavailable.evaluate((action) => action.matches(':disabled')), false);
    assert.equal(await unavailable.getAttribute('aria-busy'), 'true');
    assert.deepEqual(await tabs(blocked), [0, -1]);
    const disclosure = button(blocked, '+1 more value');
    await disclosure.click();
    assert.equal(await button(blocked, 'Show less').getAttribute('aria-expanded'), 'true');
    const title = form.getByRole('textbox', { name: 'Title' });
    await title.fill('Edited');
    assert.deepEqual(await form.evaluate((element) => Array.from(new FormData(element))), [
      ['title', 'Edited'],
    ]);
    assert.equal(await page.getByTestId('submits').textContent(), '0');
    assert.equal(await page.getByTestId('resets').textContent(), '0');
    await resetForm(form);
    assert.equal(await title.inputValue(), 'Draft');
    assert.equal(await button(blocked, 'Show less').getAttribute('aria-expanded'), 'true');
    assert.equal(await remove(blocked, 'Yankee').count(), 1);
    await button(blocked, 'Show less').focus();
    await owner(page, 'toggle-fieldset');
    assert.deepEqual(await tabs(blocked), [-1, -1, -1]);
    await assertFocused(blocked);
  },

  'TagGroup uses one remembered RTL tab stop and honors canceled or repeated action keys': async ({
    page,
    mount,
  }) => {
    await mount('tag', { direction: 'rtl' });
    const group = primary(page);
    const bravo = remove(group, 'Bravo');
    const charlie = remove(group, 'Charlie');
    const more = button(group, '+1 autres libellés');
    assert.deepEqual(await tabs(group), [0, -1, -1, -1]);
    await button(page, 'Before tags').focus();
    await pressKeys(page, 'Tab', 'ArrowLeft', 'ArrowDown');
    await assertFocused(charlie);
    await pressKeys(page, 'Tab');
    await assertFocused(button(page, 'Add labels'));
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(charlie);
    assert.deepEqual(await tabs(group), [-1, 0, -1, -1]);
    await owner(page, 'cancel-key');
    await pressKeys(page, 'ArrowLeft', 'Delete', 'Enter', 'Shift+Backspace');
    await assertFocused(charlie);
    assert.equal(await page.getByTestId('requests').textContent(), '');
    await owner(page, 'cancel-key');
    await pressKeys(page, 'Home', 'ArrowRight');
    await assertFocused(bravo);
    await pressKeys(page, 'End', 'ArrowLeft');
    await assertFocused(more);
    assert.equal(await more.textContent(), '+1 autres');
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    assert.equal(await page.getByTestId('expansion-requests').textContent(), 'true');
    assert.equal(await more.getAttribute('aria-expanded'), 'false');
    assert.equal(await remove(group, 'Echo').count(), 0);
    const disclosureNode = await more.elementHandle();
    await owner(page, 'accept-expansion');
    const less = button(group, 'Réduire les libellés');
    await assertFocused(less);
    assert.equal(await less.textContent(), 'Réduire');
    assert.ok(await disclosureNode.evaluate((node) => node === document.activeElement));
    await remove(group, 'Echo').focus();
    await owner(page, 'accept-expansion');
    await assertFocused(more);
    assert.ok(await disclosureNode.evaluate((node) => node === document.activeElement));
    assert.equal(await status(group), '');
    await owner(page, 'disable-collection');
    assert.deepEqual(await tabs(group), [-1, -1, -1, 0]);
    assert.equal(await more.isEnabled(), true);
    await owner(page, 'remove-hidden');
    await assertFocused(button(page, 'Add labels'));
    assert.deepEqual(await tabs(group), [-1, -1, -1]);
  },

  'TagGroup waits for acceptance, announces one batch, and recovers by the previous ID order':
    async ({ page, mount }) => {
      await mount('tag');
      const group = primary(page);
      const charlie = remove(group, 'Charlie');
      const delta = remove(group, 'Delta');
      await charlie.focus();
      await page.keyboard.down('Delete');
      await page.keyboard.down('Delete');
      await page.keyboard.up('Delete');
      await assertFocused(charlie);
      assert.equal(await charlie.getAttribute('aria-busy'), 'true');
      assert.equal(await status(group), '');
      assert.equal(await page.getByTestId('requests').textContent(), 'charlie');
      await owner(page, 'reject');
      await assertFocused(charlie);
      assert.equal(await charlie.getAttribute('aria-busy'), null);
      assert.equal(await status(group), '');
      await pressKeys(page, 'Backspace');
      await owner(page, 'accept');
      await assertFocused(delta);
      assert.equal(await charlie.count(), 0);
      assert.deepEqual(await tabs(group), [-1, 0, -1]);
      const live = await group.getByRole('status').elementHandle();
      assert.equal(await status(group), 'Supprimé: Charlie');
      const announcements = await live.evaluateHandle((element) => {
        const updates = [];
        const observer = new MutationObserver(() => updates.push(element.textContent));
        observer.observe(element, { characterData: true, childList: true, subtree: true });
        return updates;
      });
      await owner(page, 'reapply');
      await charlie.focus();
      await pressKeys(page, 'Delete');
      await owner(page, 'accept');
      assert.equal(await announcements.evaluate((updates) => updates.filter(Boolean).length), 1);
      await owner(page, 'reapply');
      await charlie.focus();
      await owner(page, 'new-batch');
      await assertFocused(delta);
      assert.equal(await charlie.count(), 0);
      assert.equal(await status(group), 'Supprimé: Bravo / Charlie');
      assert.ok(await live.evaluate((node) => node.isConnected));
    },

  'TagGroup prefers a newly visible tag and puts focus back on a prior tag before disclosure':
    async ({ page, mount }) => {
      await mount('tag');
      const group = primary(page);
      const delta = remove(group, 'Delta');
      await delta.focus();
      await pressKeys(page, 'Delete');
      await owner(page, 'accept');
      await assertFocused(remove(group, 'Echo'));
      await owner(page, 'locked-tail');
      await delta.focus();
      await pressKeys(page, 'Delete');
      await owner(page, 'accept');
      await assertFocused(remove(group, 'Charlie'));
      assert.equal(await button(group, '+1 autres libellés').isEnabled(), true);
      await owner(page, 'reapply');
      await owner(page, 'accept-expansion');
      await remove(group, 'Echo').focus();
      await pressKeys(page, 'Delete');
      await owner(page, 'accept');
      await assertFocused(delta);
      await owner(page, 'reapply');
      await button(group, 'Réduire les libellés').focus();
      await owner(page, 'remove-hidden');
      await assertFocused(delta);
      assert.equal(await status(group), 'Supprimé: Echo');
    },

  'TagGroup ignores deferred removals after focus leaves for another toolbar or a shadow tree':
    async ({ page, mount }) => {
      await mount('tag');
      const first = primary(page);
      const second = other(page);
      await remove(first, 'Charlie').focus();
      await pressKeys(page, 'Delete');
      await remove(second, 'X-ray').focus();
      await pressKeys(page, 'Delete');
      await page.evaluate(() => {
        document.querySelector('[data-testid="accept"]').click();
        document.querySelector('[data-testid="accept-secondary"]').click();
      });
      await assertFocused(remove(second, 'Yankee'));
      assert.equal(await status(first), 'Supprimé: Charlie');
      await owner(page, 'reapply');
      const charlie = remove(first, 'Charlie');
      await charlie.focus();
      await pressKeys(page, 'Delete', 'Tab');
      await assertFocused(button(page, 'Add labels'));
      await owner(page, 'accept');
      await assertFocused(button(page, 'Add labels'));
      await owner(page, 'reapply');
      await charlie.focus();
      await pressKeys(page, 'Delete');
      const shadow = page.getByRole('button', { name: 'Shadow action' });
      await shadow.focus();
      await owner(page, 'accept');
      assert.ok(
        await shadow.evaluate((element) => element.getRootNode().activeElement === element),
      );
      await owner(page, 'reapply');
      await charlie.focus();
      await pressKeys(page, 'Delete');
      await charlie.evaluate((element) => element.blur());
      await owner(page, 'accept');
      assert.ok(await page.evaluate(() => document.activeElement === document.body));
    },

  'TagGroup honors external focus and its redirection, with a named root fallback': async ({
    page,
    mount,
  }) => {
    for (const target of ['button', 'root', 'redirected']) {
      await mount('tag');
      const group = primary(page);
      await owner(page, 'single');
      if (target === 'root') {
        await owner(page, 'inert-target');
      } else if (target === 'redirected') {
        await owner(page, 'redirect-target');
      }
      await remove(group, 'Bravo').focus();
      await pressKeys(page, 'Delete');
      await owner(page, 'accept');
      const expected = {
        button: button(page, 'Add labels'),
        root: group,
        redirected: page.getByRole('textbox', { name: 'Find labels' }),
      };
      await assertFocused(expected[target]);
      assert.equal(await group.getByText('Aucun libellé').count(), 1);
      assert.deepEqual(await tabs(group), []);
      assert.equal(await group.getAttribute('tabindex'), '-1');
      assert.equal(await status(group), 'Supprimé: Bravo');
    }
  },

  'Tag exposes the full clipped rich label inside a Popover and Escape closes each layer in order':
    async ({ page, mount }) => {
      await mount('tag', { theme: 'frost-light', direction: 'rtl', textScale: 120 });
      const trigger = button(page, 'Open release notes');
      await trigger.click();
      const panel = page.getByRole('dialog', { name: 'Release notes' });
      const tag = panel.getByTestId('rich-tag');
      const label = tag.locator(labelPart);
      const extent = panel.getByTestId('label-width');
      const carrier = page.locator('[role="tooltip"]');
      const hint = page.locator(visibleHint);
      const width = (value) =>
        extent.evaluate((element, size) => {
          element.style.inlineSize = size;
        }, value);
      const clipped = () => label.evaluate((element) => element.scrollWidth > element.clientWidth);
      await width('370px');
      assert.equal(await clipped(), false);
      await label.hover();
      await hint.waitFor({ state: 'hidden' });
      await width('124px');
      await page.mouse.move(0, 0);
      assert.equal(await clipped(), true);
      await label.hover();
      await hint.waitFor();
      assert.equal(await hint.textContent(), 'Quarterly release notes גירסה 2');
      const bounds = await getBox(hint);
      assert.ok(bounds.x >= 0 && bounds.y >= 0);
      await owner(page, 'new-title');
      const action = remove(panel, 'Maintenance reference גירסה 3');
      assert.equal(await action.count(), 1);
      assert.equal(await action.getAttribute('aria-describedby'), null);
      assert.equal(await hint.textContent(), 'Maintenance reference גירסה 3');
      await width('370px');
      await carrier.waitFor({ state: 'detached' });
      await page.mouse.move(0, 0);
      await width('124px');
      await carrier.waitFor({ state: 'attached' });
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      assert.equal(await hint.count(), 0);
      await owner(page, 'load-rich-tag');
      assert.equal(await action.getAttribute('aria-disabled'), 'true');
      assert.equal(await action.evaluate((element) => element.matches(':disabled')), false);
      await button(panel, 'Before release tag').focus();
      await pressKeys(page, 'Tab');
      await assertFocused(action);
      await hint.waitFor();
      assert.equal(await hint.textContent(), 'Maintenance reference גירסה 3');
      await pressKeys(page, 'Escape');
      await hint.waitFor({ state: 'hidden' });
      assert.ok(await panel.evaluate((element) => element.matches(':popover-open')));
      await pressKeys(page, 'Escape');
      await panel.waitFor({ state: 'hidden' });
      await assertFocused(trigger);
    },

  'Tag and TagGroup keep server-rendered native actions through hydration': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('tag-ssr');
    await mount('tag-hydration');
    const root = page.getByTestId('ssr-root');
    await root.evaluate((node, source) => {
      node.innerHTML = source;
    }, html);
    const tag = root.getByTestId('server-tag');
    const action = remove(root, 'Version גירסה 2');
    const disclosure = button(root, '+1 more value');
    const oldAction = await action.elementHandle();
    const oldDisclosure = await disclosure.elementHandle();
    assert.equal(await tag.locator('bdi').getAttribute('dir'), 'rtl');
    assert.equal(await action.getAttribute('type'), 'button');
    assert.equal(await disclosure.getAttribute('aria-expanded'), 'false');
    await button(page, 'Hydrate tags').click();
    await disclosure.click();
    const less = button(root, 'Show less');
    assert.equal(await less.getAttribute('aria-expanded'), 'true');
    assert.ok(await oldDisclosure.evaluate((node) => node === document.activeElement));
    await action.click();
    assert.equal(await root.getByTestId('server-removed').textContent(), 'true');
    assert.ok(await oldAction.evaluate((node) => node === document.activeElement));
  },
};

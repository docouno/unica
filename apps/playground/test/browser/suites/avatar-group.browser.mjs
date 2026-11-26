import assert from 'node:assert/strict';
import { assertFocused, getBox, submitForm } from '../helpers.mjs';

const openSelector = '.unica-tooltip:popover-open';
const hintSelector = openSelector + '[data-side]';

function command(page, name) {
  // Use the harness without transferring focus from the member under test.
  return page.getByRole('button', { name, exact: true }).evaluate((button) => button.click());
}

async function showFirstName(page) {
  await page.getByRole('button', { name: 'Before reviewers' }).focus();
  await page.keyboard.press('Tab');
  const first = page.getByRole('img', { name: 'Alex Rivera' });
  await assertFocused(first);
  await page.locator(hintSelector).waitFor();
  assert.equal(await page.locator(hintSelector).textContent(), 'Alex Rivera');
  return first;
}

export default {
  'AvatarGroup respects native name hint closure during a same-turn rerender': async ({
    page,
    mount,
  }) => {
    await mount('avatar-group');
    const alex = await showFirstName(page);
    await command(page, 'Close active name hint and rerender');
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(await page.locator(openSelector).count(), 0);
    await assertFocused(alex);
  },

  'AvatarGroup names appear once and only visible named members add Tab stops': async ({
    page,
    mount,
  }) => {
    let hiddenRequests = 0;
    await page.route('**/avatar-test/hidden-member.svg', (route) => {
      hiddenRequests += 1;
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg />' });
    });
    await mount('avatar-group', { direction: 'rtl', reducedMotion: 'reduce' });
    const list = page.getByRole('list', { name: 'Reviewers' });
    const snapshot = await list.ariaSnapshot();
    assert.match(snapshot, /list "Reviewers"/);
    assert.equal(snapshot.match(/Alex Rivera/g)?.length, 1);
    assert.equal(snapshot.match(/Sam Chen/g)?.length, 1);
    assert.match(snapshot, /1 más/);
    assert.doesNotMatch(snapshot, /Jo Martin|\+1/);
    assert.equal(hiddenRequests, 0);
    assert.equal(await list.locator('img').count(), 1);

    const before = await getBox(list);
    const first = await showFirstName(page);
    const hint = page.locator(hintSelector);
    const outline = await list.evaluate((node) => getComputedStyle(node).outlineWidth);
    assert.equal(outline, '2px');
    assert.equal(await first.getAttribute('aria-describedby'), null);
    assert.equal(await hint.getAttribute('aria-hidden'), 'true');
    assert.deepEqual(await getBox(list), before);
    for (const key of ['Enter', 'Space']) {
      await page.keyboard.press(key);
      await assertFocused(first);
      assert.equal(await hint.textContent(), 'Alex Rivera');
    }
    await page.keyboard.press('Escape');
    assert.equal(await hint.count(), 0);
    await assertFocused(first);
    await page.keyboard.press('Tab');
    await assertFocused(page.getByRole('img', { name: 'Sam Chen' }));
    await hint.filter({ hasText: 'Sam Chen' }).waitFor();
    assert.equal(await hint.textContent(), 'Sam Chen');
    await page.keyboard.press('Shift+Tab');
    await assertFocused(first);
    await hint.filter({ hasText: 'Alex Rivera' }).waitFor();
    assert.equal(await hint.textContent(), 'Alex Rivera');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const submit = page.getByRole('button', { name: 'Submit review' });
    await assertFocused(submit);
    assert.deepEqual(await submitForm(page.locator('form'), submit), []);

    await command(page, 'Toggle names');
    await page.getByRole('button', { name: 'Before reviewers' }).focus();
    await page.keyboard.press('Tab');
    await assertFocused(submit);
    assert.equal(await list.getByRole('img', { name: 'Alex Rivera' }).count(), 1);
    assert.equal(await list.locator('[tabindex]').count(), 0);
  },

  'AvatarGroup retains a moved member and drops hints for removed or inaccessible anchors': async ({
    page,
    mount,
  }) => {
    await page.route('**/avatar-test/hidden-member.svg', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"/>',
      }),
    );
    await mount('avatar-group');
    const hint = page.locator(hintSelector);
    const open = page.locator(openSelector);
    const alex = await showFirstName(page);
    const original = await alex.elementHandle();
    await command(page, 'Reverse reviewers');
    await assertFocused(alex);
    assert.equal(await alex.evaluate((node, old) => node === old, original), true);
    assert.equal(await hint.textContent(), 'Alex Rivera');
    await command(page, 'Show one');
    await open.waitFor({ state: 'detached' });
    assert.equal(await alex.count(), 0);
    const sam = page.getByRole('img', { name: 'Sam Chen' });
    assert.equal(await sam.evaluate((node) => node === document.activeElement), false);

    for (const toggle of ['Toggle inert', 'Toggle hidden', 'Toggle names']) {
      await page.getByRole('button', { name: 'Before reviewers' }).focus();
      await page.keyboard.press('Tab');
      await assertFocused(sam);
      await hint.waitFor();
      await command(page, toggle);
      await open.waitFor({ state: 'detached' });
      await command(page, toggle);
    }

    await page.getByRole('button', { name: 'Before reviewers' }).focus();
    await page.keyboard.press('Tab');
    await hint.waitFor();
    await command(page, 'Clear reviewers');
    await open.waitFor({ state: 'detached' });
    assert.equal(await page.getByTestId('reviewers').count(), 0);
  },

  'AvatarGroup name hints stay in the active modal and dismiss before the modal': async ({
    page,
    mount,
  }) => {
    await mount('avatar-group', { theme: 'frost-light' });
    await page.getByRole('button', { name: 'Open contributors' }).click();
    const dialog = page.getByRole('dialog', { name: 'Contributors' });
    await page.keyboard.press('Tab');
    const anchor = dialog.getByRole('img', { name: 'Alex Rivera' });
    await assertFocused(anchor);
    const hint = dialog.locator(hintSelector);
    await hint.waitFor();
    assert.equal(await hint.textContent(), 'Alex Rivera');
    await page.keyboard.press('Escape');
    await hint.waitFor({ state: 'detached' });
    await assertFocused(anchor);
    assert.equal(await dialog.isVisible(), true);
  },

  'AvatarGroup does not revive a moved hint after Escape on base or modal surfaces': async ({
    page,
    mount,
  }) => {
    for (const modal of [false, true]) {
      await mount('avatar-group');
      const hint = page.locator(hintSelector);
      const alex = modal
        ? page.getByRole('dialog').getByRole('img', { name: 'Alex Rivera' })
        : await showFirstName(page);
      if (modal) {
        await page.getByRole('button', { name: 'Open contributors' }).click();
        await page.keyboard.press('Tab');
      }
      await assertFocused(alex);
      await hint.waitFor();
      assert.equal(await hint.textContent(), 'Alex Rivera');
      await command(
        page,
        modal ? 'Reverse and dismiss contributors' : 'Reverse and dismiss reviewers',
      );
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
          }),
      );
      assert.equal(await page.locator(openSelector).count(), 0);
      await assertFocused(alex);
      if (modal) {
        assert.equal(await page.getByRole('dialog').isVisible(), true);
      }
    }
  },
};

import assert from 'node:assert/strict';
import { assertFocused, pressKeys } from '../helpers.mjs';

const openHint = '[role="tooltip"]:popover-open';
const folder = 'Operations documentation archive and reference materials';
const leaf = 'Platform release verification logs and review checklist';
const common = 'Shared components for publication';

async function assertHint(page, label) {
  await page.waitForFunction(
    ({ selector, expected }) => {
      const panels = document.querySelectorAll(selector);
      return panels.length === 1 && panels[0].textContent.trim() === expected;
    },
    { selector: openHint, expected: label },
  );
}

async function assertTreeChildren(page) {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = await session.send('Accessibility.getFullAXTree');
    const byId = new Map(nodes.map((node) => [node.nodeId, node]));
    const descendants = (node) =>
      (node.childIds ?? []).flatMap((id) => {
        const child = byId.get(id);
        return !child ? [] : child.ignored ? descendants(child) : [child];
      });
    const items = nodes.filter((node) => !node.ignored && node.role?.value === 'treeitem');
    const parent = items.find((node) => node.name?.value === folder);
    assert.ok(parent);
    const group = descendants(parent).find((node) => node.role.value === 'group');
    assert.ok(group);
    assert.deepEqual(
      descendants(group).map((node) => node.name.value),
      ['Notes', leaf],
    );
    assert.deepEqual(items.map((node) => node.name.value).sort(), [folder, 'Notes', leaf].sort());
  } finally {
    await session.detach();
  }
}

export default {
  'A clipped tree row owns its children and only the current row opens a hint': async ({
    page,
    mount,
  }) => {
    await mount('collection-hints');
    const branch = page.getByRole('treeitem', { name: folder, exact: true });
    const short = page.getByRole('treeitem', { name: 'Notes', exact: true });
    const long = page.getByRole('treeitem', { name: leaf, exact: true });
    await assertTreeChildren(page);

    await branch.hover();
    await assertHint(page, folder);
    await short.hover();
    await page.locator(openHint).waitFor({ state: 'detached' });
    await long.hover();
    await assertHint(page, leaf);
    await page.mouse.move(720, 16);
    await page.locator(openHint).waitFor({ state: 'detached' });

    await page.keyboard.press('Tab');
    await assertFocused(branch);
    await assertHint(page, folder);
    await page.keyboard.press('ArrowRight');
    await assertFocused(short);
    await page.locator(openHint).waitFor({ state: 'detached' });
    await page.keyboard.press('ArrowDown');
    await assertFocused(long);
    await assertHint(page, leaf);
    const groupId = await branch.getAttribute('aria-owns');
    await pressKeys(page, 'ArrowLeft', 'ArrowLeft');
    await assertFocused(branch);
    assert.equal(await branch.getAttribute('aria-expanded'), 'false');
    assert.equal(await short.count(), 0);
    await page.keyboard.press('ArrowRight');
    await assertFocused(branch);
    assert.equal(await branch.getAttribute('aria-owns'), groupId);
    await assertTreeChildren(page);
  },

  'Chip arrow selection commits once and leaves the focused full label visible': async ({
    page,
    mount,
  }) => {
    await mount('collection-hints');
    const alpha = page.getByRole('radio', { name: `${common}, alpha` });
    const beta = page.getByRole('radio', { name: `${common}, beta` });
    const changes = page.getByTestId('changes');
    const form = page.locator('form');
    const entries = () => form.evaluate((element) => Array.from(new FormData(element)));
    assert.deepEqual(await entries(), [['collection', 'alpha']]);

    await pressKeys(page, 'Tab', 'Tab');
    await assertFocused(alpha);
    await assertHint(page, `${common}, alpha`);
    await page.keyboard.press('ArrowRight');
    await assertHint(page, `${common}, beta`);
    await assertFocused(beta);
    assert.deepEqual(await entries(), [['collection', 'beta']]);
    assert.equal(await changes.textContent(), 'beta');

    await page.keyboard.press('End');
    await assertHint(page, `${common}, beta`);
    assert.equal(await changes.textContent(), 'beta');
    await page.keyboard.press('Home');
    await assertHint(page, `${common}, alpha`);
    await assertFocused(alpha);
    assert.deepEqual(await entries(), [['collection', 'alpha']]);
    assert.equal(await changes.textContent(), 'beta,alpha');
    await page.keyboard.press('Space');
    await page.locator(openHint).waitFor({ state: 'detached' });

    const review = page.getByRole('checkbox', { name: 'Request a publication review' });
    await review.hover();
    await assertHint(page, 'Request a publication review');
    await page.locator(openHint).click();
    assert.equal(await review.isChecked(), false);
    await review.click();
    await page.locator(openHint).waitFor({ state: 'detached' });
    assert.deepEqual(await entries(), [
      ['collection', 'alpha'],
      ['review', 'yes'],
    ]);
  },

  'A clipped Tag opens from its remove button and keeps the original Tab route': async ({
    page,
    mount,
  }) => {
    await mount('collection-hints');
    const remove = page.getByRole('button', {
      name: 'Remove Release verification workflow',
      exact: true,
    });
    await pressKeys(page, 'Tab', 'Tab', 'Tab', 'Tab');
    await assertFocused(remove);
    await assertHint(page, 'Release verification workflow');
    await page.keyboard.press('Tab');
    await assertFocused(page.getByRole('button', { name: 'After tag' }));
    await page.locator(openHint).waitFor({ state: 'detached' });
    await page.locator('[data-unica-tag-part="label"]').hover();
    await assertHint(page, 'Release verification workflow');
    await page.locator(openHint).click();
    assert.equal(await page.getByTestId('removals').textContent(), '0');
    await remove.click();
    assert.equal(await page.getByTestId('removals').textContent(), '1');
  },

  'Tabs measure truncation after resize and pinned documents still show their titles': async ({
    page,
    mount,
  }) => {
    await mount('collection-hints');
    const ordinary = page.getByRole('tab', { name: 'Notes', exact: true });
    const clipped = page.getByRole('tab', { name: 'Release planning overview' });
    const iconOnly = page.getByRole('tab', { name: 'Search' });
    await clipped.hover();
    await assertHint(page, 'Release planning overview');
    await ordinary.hover();
    await page.locator(openHint).waitFor({ state: 'detached' });
    await iconOnly.hover();
    await assertHint(page, 'Search');
    await clipped.hover();
    await assertHint(page, 'Release planning overview');
    await page.getByTestId('tabs-width').evaluate((element) => {
      element.style.inlineSize = '680px';
    });
    await page.locator(openHint).waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Extend planning title' }).click();
    const updated = 'Release planning overview and quarterly maintenance schedule';
    await page.getByRole('tab', { name: updated }).hover();
    await assertHint(page, updated);
    await page.getByRole('button', { name: 'Guide, Pinned' }).hover();
    await assertHint(page, 'Guide');
    await page.getByRole('button', { name: 'Index', exact: true }).hover();
    await page.locator(openHint).waitFor({ state: 'detached' });
  },
};

import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

export default {
  'Table relations starts in an isolated Drawer and returns to the same launch button': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(
      new URL('/?item=table&tab=states&block=drawer&family=frost&scheme=dark&vp=1280', origin).href,
    );
    const frame = page.getByTitle('Document relations example').contentFrame();
    const drawer = frame.getByRole('dialog', { name: 'Document relations' });
    const close = drawer.getByRole('button', { name: 'Close document relations' });
    const table = drawer.getByRole('table', { name: 'Linked documents' });
    const trigger = frame.getByRole('button', { name: 'Show relations' });

    await drawer.waitFor({ timeout: 20_000 });
    await table.getByRole('rowheader', { name: 'Redis failover procedure' }).waitFor();
    assert.ok(await drawer.evaluate((node) => node.matches(':modal')));
    assert.equal(await page.locator('dialog:modal').count(), 0);
    await close.press('Enter');
    await drawer.waitFor({ state: 'hidden' });
    await assertFocused(trigger);
    const launch = await trigger.elementHandle();
    await trigger.press('Enter');
    await table.waitFor();
    assert.ok(await drawer.evaluate((node) => node.matches(':modal')));
    await close.press('Escape');
    await drawer.waitFor({ state: 'hidden' });
    await assertFocused(trigger);
    assert.ok(await trigger.evaluate((node, original) => node === original, launch));
    await launch.dispose();
  },

  'Review access uses the public modal for Select Escape, native reset and saving': async ({
    page,
    origin,
  }) => {
    await page.goto(
      new URL('/?item=select&tab=states&block=modal&family=frost&scheme=light', origin).href,
    );
    const launch = page.getByRole('button', { name: 'Edit review access' });
    await launch.waitFor({ timeout: 20_000 });
    await launch.press('Enter');
    const modal = page.getByRole('dialog', { name: 'Review access' });
    assert.ok(await modal.evaluate((node) => node.matches(':modal')));
    const select = modal.getByRole('button', { name: 'Reviewer role' });
    const popup = modal.getByRole('listbox');
    const form = modal.locator('form');
    const role = () => form.evaluate((node) => new FormData(node).get('role'));
    const choose = async (name) => {
      await select.click();
      await popup.getByRole('option', { name }).click();
      await popup.waitFor({ state: 'hidden' });
    };

    await select.press('Enter');
    await popup.waitFor();
    await page.keyboard.press('Escape');
    await popup.waitFor({ state: 'hidden' });
    assert.ok(await modal.evaluate((node) => node.matches(':modal')));
    await assertFocused(select);
    await choose('Editor');
    assert.equal(await role(), 'editor');
    await modal.getByRole('button', { name: 'Reset' }).click();
    assert.equal(await role(), 'viewer');
    await choose('Commenter');
    await modal.getByRole('button', { name: 'Save access' }).click();
    await modal.waitFor({ state: 'hidden' });
    await page.getByText('Saved access: Commenter', { exact: true }).waitFor();
    await assertFocused(launch);
  },

  'Open documents confirms dirty closing and focuses the surviving document on discard': async ({
    page,
    origin,
  }) => {
    await page.goto(
      new URL('/?item=app-shell&tab=states&block=documents&family=soft&scheme=dark', origin).href,
    );
    const documents = page.getByRole('navigation', { name: 'Open documents' }).first();
    const dirty = documents.getByRole('button', {
      name: /^Interviews and participant consent.*Unsaved changes$/,
    });
    const confirm = page.getByRole('alertdialog', { name: 'Close without saving?' });
    const keep = confirm.getByRole('button', { name: 'Keep editing' });
    await dirty.waitFor({ timeout: 20_000 });
    await dirty.press('Delete');
    await confirm.waitFor();
    assert.ok(await confirm.evaluate((node) => node.matches(':modal')));
    await assertFocused(keep);
    await keep.press('Enter');
    await confirm.waitFor({ state: 'hidden' });
    await assertFocused(dirty);

    await dirty.press('Delete');
    await confirm.getByRole('button', { name: 'Discard and close' }).press('Enter');
    await confirm.waitFor({ state: 'hidden' });
    await dirty.waitFor({ state: 'detached' });
    const next = documents.getByRole('button', { name: 'Interview synthesis', exact: true });
    await next.and(page.locator(':focus')).waitFor();
    assert.equal(await next.getAttribute('aria-current'), 'page');
  },
};

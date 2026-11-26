import assert from 'node:assert/strict';
import { assertFocused, submitForm } from '../helpers.mjs';

export default {
  'Modal isolates native modality, focus and form references to the carrier document': async ({
    page,
    mount,
  }) => {
    await mount('dialog-realm');
    const frame = page.frameLocator('iframe[title="Dialog document"]');
    const launch = frame.getByRole('button', { name: 'Open local dialog' });
    await launch.click();
    const modal = frame.locator('#local-dialog:modal');
    const heading = modal.getByRole('heading', { name: 'Local dialog' });
    await heading.waitFor();
    assert.equal(await launch.getAttribute('aria-controls'), 'local-dialog');
    await assertFocused(heading);
    await frame.locator('#frame-background').evaluate((node) => node.focus());
    await assertFocused(heading);
    assert.equal(
      await modal.evaluate((node) => node.ownerDocument.documentElement.style.overflowY),
      'hidden',
    );
    assert.equal(await page.locator('html').evaluate((node) => node.style.overflowY), '');
    await page.getByRole('button', { name: 'Outside action' }).click();
    assert.equal(await page.locator('#outside-count').textContent(), '1');
    await page
      .frameLocator('iframe[title="Neighbor document"]')
      .getByRole('button', { name: 'Neighbor action' })
      .click();
    assert.equal(
      await modal
        .getByRole('textbox', { name: 'Cross-document field' })
        .evaluate((node) => node.form),
      null,
    );
    assert.deepEqual(
      await page.locator('#foreign-form').evaluate((node) => [...new FormData(node)]),
      [['outer', 'outside']],
    );
    assert.deepEqual(
      await submitForm(
        modal.getByRole('form', { name: 'Local form' }),
        modal.getByRole('button', { name: 'Commit local form' }),
      ),
      [
        ['inner', 'inside'],
        ['intent', 'commit'],
      ],
    );
    await modal.getByRole('button', { name: 'Close local dialog' }).click();
    await modal.waitFor({ state: 'detached' });
    await assertFocused(launch);
    assert.equal(
      await launch.evaluate((node) => node.ownerDocument.documentElement.style.overflowY),
      '',
    );

    const foreign = page.getByRole('button', { name: 'Open cross-document dialog' });
    await foreign.click();
    const otherModal = frame.locator('#foreign-dialog:modal');
    await otherModal.waitFor();
    assert.equal(await foreign.getAttribute('aria-controls'), null);
    await assertFocused(otherModal.getByRole('heading', { name: 'Cross-document dialog' }));
    await otherModal.getByRole('button', { name: 'Close cross-document dialog' }).click();
    await otherModal.waitFor({ state: 'detached' });
  },
};

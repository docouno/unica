import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { assertFocused } from '../helpers.mjs';

export default {
  'Stepper setup requires a separate activation for each workflow action': async ({
    page,
    mount,
  }) => {
    await mount('native');
    await page.goto(
      new URL(
        '/?item=stepper&tab=compositions&block=journey&family=soft&scheme=light&vp=360',
        page.url(),
      ).href,
    );
    const board = page.locator('[data-wb-block="journey"] .wb-artboard[data-theme="soft-light"]');
    const proceed = board.getByRole('button', { name: 'Continue', exact: true });
    const assign = board.getByRole('button', { name: 'Assign me' });
    await proceed.waitFor({ timeout: 20_000 });
    await proceed.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await assertFocused(assign);
    assert.equal(await proceed.isDisabled(), true);

    await board.getByRole('button', { name: 'All steps' }).press('Enter');
    await board.getByRole('button', { name: /Workspace details/ }).press('Enter');
    await proceed.press('Enter');
    await assertFocused(assign);
    assert.equal(await proceed.isDisabled(), true);

    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await assertFocused(proceed);
    assert.equal(await board.getByText('You are the workspace owner.', { exact: true }).count(), 1);

    await page.keyboard.press('Enter');
    await assertFocused(board.getByRole('heading', { name: 'Review setup' }));
    await board.getByRole('button', { name: 'Create workspace' }).press('Space');
    await assertFocused(board.getByRole('heading', { name: 'Workspace created' }));
  },

  'Stepper compact disclosure stays under the pointer on both surfaces': async ({
    page,
    mount,
  }) => {
    await mount('native');
    await page.setViewportSize({ width: 1470, height: 900 });
    const url = new URL('/?item=stepper&vp=360&dir=rtl&scale=120&raw=1&surface=base', page.url());
    await page.goto(url.href);
    const button = page
      .locator('.wb-artboard[data-theme="frost-light"]')
      .getByRole('button', { name: 'All steps' });
    await button.waitFor({ timeout: 20_000 });
    for (const surface of ['base', 'overlay']) {
      url.searchParams.set('surface', surface);
      await page.evaluate((address) => {
        history.pushState(null, '', address);
        dispatchEvent(new PopStateEvent('popstate'));
      }, url.href);
      await button.evaluate((node) =>
        node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }),
      );
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const rect = await button.boundingBox();
      assert.ok(rect);
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height * 0.85;
      await page.mouse.click(x, y);
      assert.equal(await button.getAttribute('aria-expanded'), 'true', surface);
      await page.mouse.click(x, y);
      assert.equal(await button.getAttribute('aria-expanded'), 'false', surface);
    }
  },

  'Stepper keeps Folio import passive through dry run, commit, Back and revalidation': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1500, height: 960 });
    await page.goto(
      new URL('/?item=10-workspace-admin&family=soft&scheme=dark&vp=1440&raw=1', origin).href,
    );
    const map = page.getByRole('group', { name: 'Batch import stages' });
    await map.waitFor({ timeout: 20_000 });
    const current = map.locator('[aria-current="step"]:visible');
    const proceed = page.getByRole('button', { name: 'Continue to commit', exact: true });
    const dryRun = page.getByRole('button', { name: 'Run dry-run check' });
    assert.equal(await proceed.isDisabled(), true);
    assert.equal(await map.getByRole('button').count(), 0);
    await map.getByText('Frontmatter rules mapped', { exact: true }).waitFor();
    await dryRun.press('Enter');
    await assertFocused(dryRun);
    assert.match(await current.textContent(), /Upload & verify/);
    await proceed.press('Enter');
    await assertFocused(page.getByText(/validated archives? (?:are|is) ready to import/));
    assert.match(await current.textContent(), /Commit to space/);
    await page.getByRole('button', { name: 'Back', exact: true }).press('Enter');
    await assertFocused(page.getByRole('heading', { name: /Archive bundles & validation queue/ }));
    assert.match(await current.textContent(), /Upload & verify/);
    await page.locator('input[type="file"][name="archives"]').setInputFiles({
      name: 'release-notes.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Release notes'),
    });
    await page.getByText('release-notes.md', { exact: true }).waitFor();
    assert.equal(await proceed.isDisabled(), true);
    await dryRun.press('Enter');
    assert.equal(await proceed.isEnabled(), true);
    await page.getByRole('button', { name: /Remove .*folio-adr-schema-v3\.yaml/u }).press('Enter');
    await map.getByText('Default frontmatter rules', { exact: true }).waitFor();
  },

  'Stepper exposes a live return trial and the shipped Usage document': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1300, height: 900 });
    const url = new URL(
      '/?item=stepper&tab=states&block=interaction&family=frost&scheme=dark&raw=1',
      origin,
    );
    await page.goto(url.href);
    const board = page.locator('[data-wb-block="interaction"] .wb-artboard');
    const plan = board.getByRole('button', { name: 'Step 1: Plan, completed' });
    await plan.waitFor({ timeout: 20_000 });
    const current = board.locator('li[aria-current="step"]');
    assert.match(await current.textContent(), /Details/);
    assert.equal(await current.getByRole('button').count(), 0);
    await plan.press('Enter');
    assert.match(await current.textContent(), /Plan/);
    await assertFocused(current);
    url.searchParams.set('tab', 'usage');
    url.searchParams.delete('block');
    url.searchParams.delete('raw');
    await page.goto(url.href);
    await page.getByRole('heading', { name: 'Controlled process' }).waitFor();
    await page.getByRole('heading', { name: 'Local position' }).waitFor();
    assert.ok(await page.getByText('markerNumber(index)', { exact: true }).isVisible());
  },
};

import assert from 'node:assert/strict';

async function showExample(page, name) {
  await page
    .getByRole('navigation', { name: 'Composition examples' })
    .getByRole('button', { name })
    .click();
  await page.getByTestId(name).waitFor({ timeout: 20000 });
}

async function mountExample(page, mount, name) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await mount('binary-consumers', { reducedMotion: 'reduce' });
  await showExample(page, name);
}

export default {
  'List keeps English punctuation with its row description in an RTL owner': async ({
    page,
    mount,
  }) => {
    await mount('binary-consumers', { direction: 'rtl' });
    await showExample(page, 'List actions');
    const copy = page.getByText('Check whether exports can reach cold storage.', { exact: true });
    const positions = await copy.evaluate((element) => {
      const text = element.firstChild;
      const range = element.ownerDocument.createRange();
      const end = text.textContent.length;
      range.setStart(text, end - 2);
      range.setEnd(text, end - 1);
      const letter = range.getBoundingClientRect();
      range.setStart(text, end - 1);
      range.setEnd(text, end);
      const period = range.getBoundingClientRect();
      return {
        letterEnd: letter.right,
        periodStart: period.left,
        direction: getComputedStyle(element.closest('li')).direction,
      };
    });
    assert.equal(positions.direction, 'rtl');
    assert.ok(
      positions.periodStart >= positions.letterEnd - 1,
      'Period follows the final English letter',
    );
  },

  'Folio trust and pager sync remain independently interactive': async ({ page, mount }) => {
    await mountExample(page, mount, 'Folio sign-in');
    const consentName = 'Keep this device trusted for 30 days';
    const consent = page.getByRole('checkbox', { name: consentName });
    assert.equal(await consent.isChecked(), true);
    await page.getByText(consentName, { exact: true }).click();
    assert.equal(await consent.isChecked(), false);

    await showExample(page, 'Folio reader');
    const pagerSync = page.getByRole('switch', { name: 'Pager sync' });
    assert.equal(await pagerSync.isChecked(), true);
    await pagerSync.press('Space');
    assert.equal(await pagerSync.isChecked(), false);
  },

  'Folio verification filter commits its candidate and returns to the first page': async ({
    page,
    mount,
  }) => {
    await mountExample(page, mount, 'Folio collection');
    const pages = page.getByRole('navigation', { name: 'Runbook pages' });
    const previous = pages.getByRole('button', { name: 'Previous page' });
    const verified = page.getByRole('switch', { name: 'Verified only' });
    assert.equal(await verified.isChecked(), true);
    await pages.getByRole('button', { name: 'Next page' }).click();
    assert.equal(await previous.isEnabled(), true);
    await page.getByText('Verified only', { exact: true }).click();
    assert.equal(await verified.isChecked(), false);
    assert.equal(await previous.isDisabled(), true);
    await page.getByText('Showing 1–4 of 10 runbooks', { exact: true }).waitFor();

    const directory = page.getByRole('table', { name: 'Runbook directory' });
    const all = directory.getByRole('checkbox', { name: 'Select all runbooks on this page' });
    await all.press('Space');
    assert.equal(await all.isChecked(), true);
    const row = directory.getByRole('checkbox', { name: 'Select Zero-Downtime PG Failover' });
    assert.equal(await row.isChecked(), true);
    await row.press('Space');
    assert.equal(await row.isChecked(), false);
    assert.equal(await all.evaluate((input) => input.indeterminate), true);
  },

  'Folio editor keeps the pinned revision on Cancel and commits it on Apply': async ({
    page,
    mount,
  }) => {
    await mountExample(page, mount, 'Folio editor');
    const editor = page.getByRole('dialog', { name: 'Edit document reference' });
    const reopen = page.getByRole('button', { name: 'Edit document reference' });
    const pinName = 'Pin to verified revision (v14)';
    const pin = editor.getByRole('checkbox', { name: pinName });
    const pinLabel = editor.getByText(pinName, { exact: true });
    await reopen.click();
    await editor.waitFor();
    assert.equal(await pin.isChecked(), true);
    await pinLabel.click();
    assert.equal(await pin.isChecked(), false);
    await editor.getByRole('button', { name: 'Cancel' }).click();
    await editor.waitFor({ state: 'hidden' });
    await reopen.click();
    assert.equal(await pin.isChecked(), true);
    await pinLabel.click();
    await editor.getByRole('button', { name: 'Apply' }).click();
    await editor.waitFor({ state: 'hidden' });
    await reopen.click();
    assert.equal(await pin.isChecked(), false);
  },

  'Folio preference flags participate in Save and Discard without closing their disclosures':
    async ({ page, mount }) => {
      await mountExample(page, mount, 'Folio preferences');
      const flags = [
        'Collapse unchanged blocks',
        'Stale runbook reminders',
        'Signed commit verification',
        'External share watermarking',
      ].map((name) => page.getByRole('checkbox', { name }));
      const signed = page.getByRole('button', { name: 'Signed commit verification' });
      const watermark = page.getByRole('button', { name: 'External share watermarking' });
      const checkedFlags = () => Promise.all(flags.map((flag) => flag.isChecked()));
      await signed.click();
      await watermark.click();
      assert.deepEqual(await checkedFlags(), [true, true, true, false]);

      for (const flag of flags) {
        await flag.press('Space');
      }
      assert.deepEqual(await checkedFlags(), [false, false, false, true]);
      assert.equal(await signed.getAttribute('aria-expanded'), 'true');
      assert.equal(await watermark.getAttribute('aria-expanded'), 'true');

      const discard = page.getByRole('button', { name: 'Discard', exact: true });
      await discard.click();
      assert.deepEqual(await checkedFlags(), [true, true, true, true]);
      for (const flag of flags) {
        await flag.press('Space');
      }
      await page.getByRole('button', { name: 'Save preferences' }).click();
      await page.getByText('All preference changes saved', { exact: true }).waitFor();
      await flags[3].press('Space');
      await discard.click();
      assert.deepEqual(await checkedFlags(), [false, false, false, false]);
    },

  'TableScroll dismisses a row menu and keeps focus when its anchor scrolls out under zoom':
    async ({ page, mount }) => {
      await mountExample(page, mount, 'Build queue');
      await page.getByTestId('Build queue').evaluate((host) => {
        host.style.zoom = '0.5';
      });
      const region = page.getByRole('region', { name: 'Build queue' });
      const trigger = region.getByRole('button', { name: 'Reporting API actions' });
      await trigger.press('Enter');
      await page.getByRole('menuitem', { name: 'Pin build' }).waitFor();
      await region.evaluate((viewport) => viewport.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(() => {
        const anchor = document.querySelector('button[aria-label="Reporting API actions"]');
        return (
          anchor.getBoundingClientRect().top >=
          anchor.closest('[role="region"]').getBoundingClientRect().bottom
        );
      });
      await page.getByRole('menu').waitFor({ state: 'hidden', timeout: 3000 });
      assert.equal(
        await region.evaluate((viewport) => viewport.ownerDocument.activeElement === viewport),
        true,
      );
    },

  'Build queue selection excludes locked rows and leaves row actions independent': async ({
    page,
    mount,
  }) => {
    await mountExample(page, mount, 'Build queue');
    const all = page.getByRole('checkbox', { name: 'Select all available builds' });
    const selected = page.getByRole('checkbox', { name: 'Select Search API' });
    const locked = page.getByRole('checkbox', { name: 'Select Reporting API' });
    await page.getByText('2 of 7 builds selected', { exact: true }).waitFor();
    assert.equal(await all.evaluate((input) => input.indeterminate), true);
    await selected.click();
    await page.getByText('3 of 7 builds selected', { exact: true }).waitFor();
    assert.equal(await page.getByRole('menu').count(), 0);
    await page.getByRole('rowheader', { name: /Search API/ }).click();
    assert.equal(await selected.isChecked(), true);
    assert.equal(await page.getByRole('menu').count(), 0);
    await all.click();
    await page.getByText('7 of 7 builds selected', { exact: true }).waitFor();
    assert.equal(await locked.isDisabled(), true);
    assert.equal(await locked.isChecked(), false);
    await all.click();
    await page.getByText('0 of 7 builds selected', { exact: true }).waitFor();
  },

  'Context menu offers document actions for selected text only when enabled': async ({
    page,
    mount,
    origin,
  }) => {
    await mountExample(page, mount, 'Context menu');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
    await page.evaluate(() => navigator.clipboard.writeText('Previous clipboard'));
    const paragraph = page.getByText('Select part of this sentence and right-click it.', {
      exact: true,
    });
    const optionName = 'Use document actions for selected text';
    const option = page.getByRole('checkbox', { name: optionName });
    const menu = page.getByRole('menu');
    async function rightClickSelection() {
      const point = await paragraph.evaluate((element) => {
        const range = document.createRange();
        range.setStart(element.firstChild, 0);
        range.setEnd(element.firstChild, 'Select part'.length);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        const bounds = range.getBoundingClientRect();
        return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      });
      await page.mouse.click(point.x, point.y, { button: 'right' });
    }
    await rightClickSelection();
    assert.equal(await menu.count(), 0);
    await page.getByText(optionName, { exact: true }).click();
    assert.equal(await option.isChecked(), true);
    await rightClickSelection();
    await menu.getByRole('menuitem', { name: 'Copy selected text' }).click();
    await page.getByRole('status').filter({ hasText: 'Copied: Select part' }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Select part');
  },

  'FormField keeps option names and described group feedback while List keeps its trailing Switch':
    async ({ page, mount }) => {
      await mountExample(page, mount, 'Form field groups');
      const group = page.getByRole('group', { name: 'Send updates', exact: true }).first();
      const email = group.getByRole('checkbox', { name: 'Email digest' });
      const descriptions = await group.evaluate((element) =>
        element
          .getAttribute('aria-describedby')
          .split(' ')
          .map((id) => document.getElementById(id)?.textContent),
      );
      assert.deepEqual(descriptions, [
        'Choose at least one way to receive updates.',
        'Select a delivery method.',
      ]);
      const labelId = await group.getAttribute('aria-labelledby');
      await page.locator(`[id=${JSON.stringify(labelId)}]`).click();
      assert.equal(await email.isChecked(), false);
      await email.press('Space');
      assert.equal(await email.isChecked(), true);
      assert.equal(
        await group.getByRole('checkbox', { name: 'In-app notifications' }).isChecked(),
        false,
      );

      const form = email.locator('xpath=ancestor::form');
      assert.equal(await group.getAttribute('aria-invalid'), null);
      assert.equal(await form.evaluate((owner) => owner.checkValidity()), false);
      for (const other of (
        await page.getByRole('group', { name: 'Send updates', exact: true }).all()
      ).slice(1)) {
        await other.getByRole('checkbox', { name: 'Email digest' }).press('Space');
      }
      assert.equal(await form.evaluate((owner) => owner.checkValidity()), true);
      await form.evaluate((owner) => owner.reset());
      await group.and(page.locator('[aria-invalid="true"]')).waitFor();
      assert.equal(await email.isChecked(), false);
      assert.equal(await form.evaluate((owner) => owner.checkValidity()), false);

      await showExample(page, 'List actions');
      const notify = page.getByRole('switch', { name: 'Notify the operations team about exports' });
      assert.equal(await notify.isChecked(), true);
      await notify.press('Space');
      assert.equal(await notify.isChecked(), false);
    },
};

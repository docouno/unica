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
  }) => {
    await mountExample(page, mount, 'Context menu');
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
    await page.getByText('Selected text: Select part', { exact: true }).waitFor();
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

      await showExample(page, 'List actions');
      const notify = page.getByRole('switch', { name: 'Notify the operations team about exports' });
      assert.equal(await notify.isChecked(), true);
      await notify.press('Space');
      assert.equal(await notify.isChecked(), false);
    },
};

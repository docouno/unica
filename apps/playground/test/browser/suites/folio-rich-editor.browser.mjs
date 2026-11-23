import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

const initialPath = '/runbooks/zero-downtime-pg-failover';
const updatedPath = '/runbooks/traffic-draining';
const referenceText = 'Zero-Downtime PG Failover';

async function mountEditor(page, mount) {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await mount('folio-rich-editor', { theme: 'frost-light' });
  const prose = page.locator('.folio-prose');
  return {
    prose,
    toolbar: page.getByRole('button', { name: 'Edit document reference' }),
    link: prose.getByRole('link', { name: referenceText }),
    panel: page.getByRole('dialog', { name: 'Edit document reference' }),
  };
}

export default {
  'Folio edits one native Popover from both sources and applies, cancels, or unlinks': async ({
    page,
    mount,
  }) => {
    const { toolbar, link, panel, prose } = await mountEditor(page, mount);
    const field = panel.getByRole('textbox', { name: 'Document path' });
    const pin = panel.getByRole('checkbox', { name: 'Pin to verified revision (v14)' });
    const apply = panel.getByRole('button', { name: 'Apply' });
    const initialURL = page.url();
    const panelId = await toolbar.getAttribute('aria-controls');
    assert.ok(panelId);
    assert.equal(await link.getAttribute('aria-controls'), panelId);
    assert.equal(await toolbar.getAttribute('aria-expanded'), 'false');
    await panel.waitFor({ state: 'hidden' });

    await toolbar.click();
    await panel.waitFor({ state: 'visible' });
    assert.equal(await panel.getAttribute('id'), panelId);
    assert.equal(await panel.evaluate((element) => element.matches(':popover-open')), true);
    assert.equal(await link.getAttribute('aria-expanded'), 'true');
    await assertFocused(field);
    assert.equal(await field.inputValue(), initialPath);
    assert.equal(await pin.isChecked(), true);

    await field.fill('   ');
    await apply.click();
    assert.equal(await panel.evaluate((element) => element.matches(':popover-open')), true);
    assert.equal(await link.getAttribute('href'), initialPath);
    await assertFocused(field);

    await field.fill(` ${updatedPath} `);
    await pin.uncheck();
    await apply.click();
    await panel.waitFor({ state: 'hidden' });
    await assertFocused(toolbar);
    assert.equal(await link.getAttribute('href'), updatedPath);

    await link.press('Enter');
    await panel.waitFor({ state: 'visible' });
    await assertFocused(field);
    assert.equal(page.url(), initialURL);
    assert.equal(await field.inputValue(), updatedPath);
    assert.equal(await pin.isChecked(), false);
    await field.fill('/runbooks/discard-this');
    await pin.check();
    await panel.getByRole('button', { name: 'Cancel' }).click();
    await panel.waitFor({ state: 'hidden' });
    await assertFocused(link);

    await toolbar.click();
    await panel.waitFor({ state: 'visible' });
    await link.click();
    await panel.waitFor({ state: 'hidden' });
    assert.equal(page.url(), initialURL);
    assert.equal(await link.getAttribute('aria-expanded'), 'false');

    await link.click();
    await panel.waitFor({ state: 'visible' });
    assert.equal(page.url(), initialURL);
    assert.equal(await field.inputValue(), updatedPath);
    assert.equal(await pin.isChecked(), false);
    await panel.getByRole('button', { name: 'Unlink' }).click();
    await panel.waitFor({ state: 'hidden' });
    assert.equal(await link.count(), 0);
    assert.ok(
      await prose.getByText(new RegExp(`and inherit quorum from ${referenceText}`)).isVisible(),
    );
    const addReference = page.getByRole('button', { name: 'Add document reference' });
    await addReference.and(page.locator(':focus')).waitFor();
  },

  'Folio preserves modified link navigation and renders a plain reference in Preview': async ({
    page,
    mount,
  }) => {
    const { toolbar, link, panel, prose } = await mountEditor(page, mount);
    const context = page.context();
    const initialURL = page.url();
    await context.route(`**${initialPath}`, (route) => route.fulfill({ body: referenceText }));
    for (const options of [{ modifiers: ['Control'] }, { button: 'middle' }]) {
      const [tab] = await Promise.all([context.waitForEvent('page'), link.click(options)]);
      await tab.waitForURL((url) => url.pathname === initialPath);
      assert.equal(page.url(), initialURL);
      assert.equal(await toolbar.getAttribute('aria-expanded'), 'false');
      await panel.waitFor({ state: 'hidden' });
      await tab.close();
    }

    await toolbar.click();
    await panel.waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await panel.waitFor({ state: 'hidden' });
    assert.equal(await toolbar.count(), 0);
    assert.equal(await link.count(), 0);
    assert.ok(
      await prose.getByText(new RegExp(`and inherit quorum from ${referenceText}`)).isVisible(),
    );

    await page.getByRole('button', { name: 'Exit preview', exact: true }).click();
    assert.equal(await link.getAttribute('href'), initialPath);
    assert.equal(await toolbar.getAttribute('aria-expanded'), 'false');
  },
};

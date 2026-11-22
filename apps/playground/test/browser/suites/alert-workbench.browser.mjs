import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { assertFocused } from '../helpers.mjs';
import { observeAlerts, pausedClock } from './alert.browser.mjs';

const live = '.unica-alert > .unica-visually-hidden[aria-atomic="true"]';
const files = (name) => fileURLToPath(new URL('../../../../../' + name, import.meta.url));

async function waitForDeliveryWindow(page) {
  await page.evaluate(() => new Promise((resolve) => window.setTimeout(resolve, 150)));
}

async function openWorkbench(page, route) {
  const url = new URL('/', page.url());
  url.search = new URLSearchParams({
    item: 'alert',
    family: 'frost',
    scheme: 'dark',
    ...route,
  }).toString();
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 15000 });
}

export default {
  'Alert Workbench publishes only the selected All/Both sample and resets it on inspector changes':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await mount('native');
      await page.addInitScript(observeAlerts, live);
      await openWorkbench(page, { tab: 'playground', family: 'all', scheme: 'both', bounds: '1' });
      const previews = page.locator('[data-wb-subject]');
      await previews.first().waitFor();
      assert.equal(await previews.count(), 6);
      assert.equal(
        await previews.first().evaluate((node) => node.matches('div.unica-alert')),
        true,
      );
      await page.locator('[data-wb-bounds-label]').first().waitFor();
      await page.getByRole('combobox', { name: /^role\b/iu }).selectOption('alert');
      const code = await page.getByRole('region', { name: 'JSX' }).locator('pre').innerText();
      assert.match(code, /<Alert\s+role=(?:"alert"|\{"alert"\})/u);
      assert.match(code, /close=\{<AlertClose aria-label=.+ onClose=\{handleClose\} \/>\}/u);
      const publish = page.getByRole('button', { name: 'Show feedback', exact: true });
      assert.equal(await publish.count(), 6);
      await waitForDeliveryWindow(page);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), []);
      await publish.first().press('Enter');
      await page.waitForFunction(() => window.alertEntries.length === 1);
      assert.equal(await page.locator(live).count(), 1);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), [
        { role: 'alert', message: 'Review requested You can leave feedback before publishing.' },
      ]);
      await page.getByRole('combobox', { name: /^status\b/iu }).selectOption('warning');
      await waitForDeliveryWindow(page);
      assert.equal(await page.locator(live).count(), 0);
      assert.equal(await page.evaluate(() => window.alertEntries.length), 1);
    },

  'Alert Workbench renders a quiet Pairwise matrix and links to the consuming Folio scenes':
    async ({ page, mount }) => {
      await mount('native');
      await page.addInitScript(observeAlerts, live);
      await openWorkbench(page, { tab: 'matrix', mode: 'pairwise', family: 'all', scheme: 'both' });
      const matrix = page.getByRole('region', { name: 'Component matrix' });
      await matrix.locator('[data-wb-subject]').first().waitFor({ state: 'attached' });
      assert.equal(await matrix.getAttribute('data-wb-matrix-mode'), 'pairwise');
      await waitForDeliveryWindow(page);
      assert.equal(await page.locator(live).count(), 0);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), []);

      await openWorkbench(page, { tab: 'usage', block: 'context' });
      const usages = page.getByRole('navigation', { name: 'Consuming scenes' });
      await usages.getByRole('link', { name: /Document Reader/u }).click();
      const editorial = page.getByText('Pre-flight quorum verification required');
      await editorial.waitFor();
      assert.equal(await editorial.locator('xpath=../..').locator(live).count(), 0);
      await page.goBack();
      await usages.getByRole('link', { name: /Batch Import/u }).waitFor();
    },

  'Alert Workbench releases only completed recovery outcomes and keeps pending controls stable':
    async ({ page, mount }) => {
      await mount('native');
      await page.addInitScript(observeAlerts, live);
      await openWorkbench(page, { tab: 'cases', block: 'recovery' });
      const sample = page.locator('[data-wb-block="recovery"]');
      const retry = sample.getByRole('button', { name: 'Try again' });
      const details = sample.getByRole('button', { name: 'Show details' });
      await retry.waitFor();
      await pausedClock(page);
      await retry.press('Enter');
      assert.equal(await retry.getAttribute('aria-busy'), 'true');
      await assertFocused(retry);
      await details.press('Enter');
      await assertFocused(sample.getByRole('button', { name: 'Hide details' }));
      assert.equal(
        await sample
          .getByText('The server did not respond. No changes were discarded.')
          .isVisible(),
        true,
      );
      await page.clock.runFor(150);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), []);
      await sample.getByRole('button', { name: 'Simulate failure' }).press('Enter');
      await page.clock.runFor(150);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), [
        {
          role: 'alert',
          message:
            'We couldn’t save your changes Attempt 1 failed. Your draft is safe on this device.',
        },
      ]);
      await retry.press('Enter');
      await page.clock.runFor(150);
      assert.equal(await page.evaluate(() => window.alertEntries.length), 1);
      await sample.getByRole('button', { name: 'Simulate success' }).press('Enter');
      await page.clock.runFor(150);
      assert.deepEqual((await page.evaluate(() => window.alertEntries)).at(-1), {
        role: 'status',
        message: 'Changes saved Your draft and the published revision are up to date.',
      });
      assert.equal(await page.evaluate(() => window.alertEntries.length), 2);
      assert.equal(
        await sample
          .getByText('Recovery complete.')
          .evaluate((node) => node === document.activeElement),
        true,
      );
    },

  'Folio import repeats a rejected file, remounts identical feedback and restores focus by source':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await mount('native');
      await openWorkbench(page, { item: '10-workspace-admin', vp: '1440' });
      const picker = page.getByRole('button', { name: /Choose file Frontmatter mapping schema/iu });
      const schema = page.locator('input[type="file"][accept=".yaml,.yml"]');
      const close = page.getByRole('button', { name: 'Dismiss file validation summary' });
      const browse = page.getByLabel('Browse files', { exact: true });
      const choose = async (filename) => {
        const pending = page.waitForEvent('filechooser');
        await picker.click();
        const chooser = await pending;
        await chooser.setFiles(files(filename));
      };

      await choose('pnpm-workspace.yaml');
      await page.getByText('pnpm-workspace.yaml', { exact: true }).waitFor();
      const schemaSize = await page.locator('.file-input-detail-proto').textContent();
      await page.evaluate(observeAlerts, live);
      await choose('docs/README.md');
      await page.waitForFunction(() => window.alertEntries.length === 1);
      assert.equal(await schema.inputValue(), '');
      assert.equal(await schema.evaluate((node) => node.files.length), 0);
      assert.equal(await page.locator('.file-input-detail-proto').textContent(), schemaSize);
      await assertFocused(picker);
      await close.press('Enter');
      await close.waitFor({ state: 'detached' });
      await assertFocused(picker);
      await choose('docs/README.md');
      await page.waitForFunction(() => window.alertEntries.length === 2);
      await choose('apps/playground/package.json');
      await page.waitForFunction(() => window.alertEntries.length === 3);
      assert.deepEqual(
        (await page.evaluate(() => window.alertEntries)).map(({ message }) => message),
        Array(3).fill('Check the selected files Choose a YAML mapping schema.'),
      );
      await page.getByText('pnpm-workspace.yaml', { exact: true }).waitFor();
      await assertFocused(picker);

      const drop = (name) =>
        page.locator('.dropzone-surface-proto').evaluate((target, filename) => {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(new File(['Sample file content'], filename));
          target.dispatchEvent(
            new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }),
          );
        }, name);
      const former = await close.elementHandle();
      await close.focus();
      await drop('archive.pdf');
      await page.waitForFunction(() => window.alertEntries.length === 4);
      await assertFocused(close);
      assert.equal(await former.evaluate((button) => button.isConnected), false);
      await former.dispose();
      await drop('archive.pdf');
      await page.waitForFunction(() => window.alertEntries.length === 5);
      await assertFocused(close);
      await drop('readme.md');
      await close.waitFor({ state: 'detached' });
      await assertFocused(browse);
      await page.getByText('readme.md', { exact: true }).waitFor();

      await picker.focus();
      await drop('second.pdf');
      await page.waitForFunction(() => window.alertEntries.length === 6);
      await assertFocused(picker);
      await drop('next.md');
      await close.waitFor({ state: 'detached' });
      await assertFocused(picker);
      assert.equal(await page.evaluate(() => window.alertEntries.length), 6);
    },
};

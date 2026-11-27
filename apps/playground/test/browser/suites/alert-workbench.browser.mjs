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
  'Alert guidance opens the selected message in a new tab and survives dismissal': async ({
    page,
    mount,
  }) => {
    await mount('workbench-v3');
    const route = new URL(page.url());
    for (const [key, value] of Object.entries({
      item: 'alert',
      tab: 'states',
      block: 'context-overlay',
      solo: 'frost-dark',
      vp: '360',
    })) {
      route.searchParams.set(key, value);
    }
    await page.evaluate((href) => {
      history.pushState(null, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route.href);
    const frame = page.locator('[data-wb-block="context-overlay"]');
    const type = frame.getByRole('combobox', { name: 'Message type' });
    await type.selectOption('success');
    const link = frame.getByRole('link', { name: 'Read guidance' });
    const id = await link.evaluate((node) => node.hash.slice(1));
    const [guide] = await Promise.all([
      page.context().waitForEvent('page'),
      link.click({ modifiers: ['Control'] }),
    ]);
    try {
      const target = guide.locator(`[id="${id}"]`);
      await target.waitFor();
      await assertFocused(target);
      assert.match(await target.innerText(), /Use the revision history/);
      assert.equal(await type.inputValue(), 'success');
      await guide.getByRole('button', { name: 'Dismiss success notice' }).press('Space');
      assert.equal(await target.isVisible(), true);
      await assertFocused(guide.getByRole('button', { name: 'Restore success notice' }));
      await guide.reload({ waitUntil: 'domcontentloaded' });
      await target.waitFor();
      await assertFocused(target);
    } finally {
      await guide.close();
    }
  },

  'Alert Workbench publishes only the selected All/Both sample and resets it on inspector changes':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await mount('native');
      await page.addInitScript(observeAlerts, live);
      await openWorkbench(page, { tab: 'playground', family: 'all', scheme: 'both', bounds: '1' });
      const first = page.locator('.wb-artboard').first();
      const previews = page.locator('[data-wb-subject]');
      await previews.first().waitFor();
      assert.equal(await previews.count(), 6);
      assert.equal(
        await previews.first().evaluate((node) => node.matches('div.unica-alert')),
        true,
      );
      await page.locator('[data-wb-bounds-label]').first().waitFor();
      const jsx = page.getByRole('region', { name: 'JSX' }).locator('pre:not([data-wb-pending])');
      const initialCode = await jsx.innerText();
      await page.getByRole('combobox', { name: /^role\b/iu }).selectOption('alert');
      const selectedCode = await jsx.innerText();
      assert.notEqual(selectedCode, initialCode);
      assert.match(selectedCode, /["']alert["']/u);
      assert.match(selectedCode, /<AlertClose\b/u);
      const publish = page.getByRole('button', { name: 'Show feedback', exact: true });
      assert.equal(await publish.count(), 6);
      await waitForDeliveryWindow(page);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), []);
      await publish.first().press('Enter');
      await page.waitForFunction(() => window.alertEntries.length === 1);
      await assertFocused(publish.first());
      assert.equal(await page.locator(live).count(), 1);
      assert.equal(await first.locator(live).count(), 1);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), [
        { role: 'alert', message: 'Draft review Add notes before you publish.' },
      ]);
      await page.getByRole('combobox', { name: /^status\b/iu }).selectOption('warning');
      await waitForDeliveryWindow(page);
      assert.equal(await page.locator(live).count(), 0);
      assert.equal(await page.evaluate(() => window.alertEntries.length), 1);

      const close = first.getByRole('button', { name: 'Dismiss review notice' });
      await close.press('Enter');
      const restore = first.getByRole('button', { name: 'Restore alert' });
      await assertFocused(restore);
      assert.equal(await page.locator('[data-wb-subject]').count(), 5);
      await restore.press('Enter');
      await assertFocused(close);
      assert.equal(await page.locator('[data-wb-subject]').count(), 6);
      await waitForDeliveryWindow(page);
      assert.equal(await page.evaluate(() => window.alertEntries.length), 1);
    },

  'Alert Workbench renders a quiet Pairwise matrix and links to the consuming Folio scenes':
    async ({ page, mount }) => {
      await mount('native');
      await page.addInitScript(observeAlerts, live);
      await openWorkbench(page, { tab: 'states', mode: 'pairwise', family: 'all', scheme: 'both' });
      const matrix = page.getByRole('region', { name: 'Component matrix' });
      await matrix.locator('[data-wb-subject]').first().waitFor({ state: 'attached' });
      assert.equal(await matrix.getAttribute('data-wb-matrix-mode'), 'pairwise');
      await waitForDeliveryWindow(page);
      assert.equal(await page.locator(live).count(), 0);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), []);

      await openWorkbench(page, { tab: 'usage' });
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
      await openWorkbench(page, {
        tab: 'states',
        block: 'recovery',
        family: 'all',
        scheme: 'both',
      });
      const frame = page.locator('[data-wb-block="recovery"]');
      const boards = frame.locator('.wb-artboard');
      const first = boards.nth(0);
      const second = boards.nth(1);
      const retry = first.getByRole('button', { name: 'Try again', exact: true });
      const secondRetry = second.getByRole('button', { name: 'Try again', exact: true });
      const details = first.getByRole('button', { name: 'Show details', exact: true });
      const fail = frame.getByRole('button', { name: 'Simulate failure', exact: true });
      const succeed = frame.getByRole('button', { name: 'Simulate success', exact: true });
      await retry.waitFor();
      assert.equal(await boards.count(), 6);
      await pausedClock(page);
      await succeed.press('Enter');
      await page.clock.runFor(150);
      await assertFocused(succeed);
      assert.equal(await boards.getByText('Changes saved', { exact: true }).count(), 0);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), []);

      await retry.press('Enter');
      assert.equal(await retry.getAttribute('aria-busy'), 'true');
      await assertFocused(retry);
      await details.press('Enter');
      await assertFocused(first.getByRole('button', { name: 'Hide details' }));
      assert.ok(
        await first.getByText('The server did not respond. No changes were discarded.').isVisible(),
      );
      await secondRetry.press('Enter');
      assert.equal(await secondRetry.getAttribute('aria-busy'), 'true');
      await page.clock.runFor(150);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), []);

      await fail.press('Enter');
      await page.clock.runFor(150);
      await assertFocused(fail);
      const message =
        'We couldn’t save your changes Attempt 1 failed. Your draft is safe on this device.';
      const failure = { role: 'alert', message };
      assert.deepEqual(await page.evaluate(() => window.alertEntries), [failure, failure]);
      assert.equal(await boards.locator(live).count(), 2);
      assert.equal(await first.locator(live).textContent(), message);
      assert.equal(await second.locator(live).textContent(), message);
      await fail.press('Enter');
      await page.clock.runFor(150);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), [failure, failure]);

      await retry.press('Enter');
      await page.clock.runFor(150);
      assert.equal(await page.evaluate(() => window.alertEntries.length), 2);
      await succeed.press('Enter');
      await page.clock.runFor(150);
      await assertFocused(succeed);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), [
        failure,
        failure,
        {
          role: 'status',
          message: 'Changes saved Your draft and the published revision are up to date.',
        },
      ]);
      assert.ok(await first.getByText('Changes saved', { exact: true }).isVisible());
      assert.equal(await boards.getByRole('button', { name: 'Try again', exact: true }).count(), 5);
    },

  'Folio import repeats a rejected file, remounts identical feedback and restores focus by source':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await mount('native');
      await openWorkbench(page, { item: '10-workspace-admin', vp: '1440' });
      const picker = page.getByRole('button', { name: /Choose file Frontmatter mapping schema/iu });
      const schema = page.locator('input[type="file"][name="schema"]');
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
      const selectedSchema = () =>
        schema.evaluate(async (node) => {
          const file = node.files[0];
          return file && { name: file.name, size: file.size, text: await file.text() };
        });
      const original = await selectedSchema();
      assert.equal(original.name, 'pnpm-workspace.yaml');
      assert.ok(original.size > 0);
      assert.match(original.text, /packages:/);
      await page.evaluate(observeAlerts, live);
      await choose('docs/README.md');
      await page.waitForFunction(() => window.alertEntries.length === 1);
      assert.deepEqual(await selectedSchema(), original);
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
        page.locator('input[type=file][name=archives]').evaluate((target, filename) => {
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

      const archives = page.locator('input[type=file][name=archives]');
      await archives.evaluate((target) => {
        for (const bytes of ['first', 'different bytes']) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(new File([bytes], 'same-name.md'));
          target.dispatchEvent(
            new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }),
          );
        }
      });
      const rows = page.getByRole('list', { name: 'Staged archives' });
      await rows.getByText('same-name.md', { exact: true }).waitFor();
      assert.deepEqual(
        await archives.evaluate(async (node) => {
          return Promise.all(
            Array.from(node.files)
              .filter(({ name }) => name === 'same-name.md')
              .map((file) => file.text()),
          );
        }),
        ['first'],
      );
      await page
        .getByText('A staged archive already uses that filename.', { exact: true })
        .waitFor();
      await drop('not-an-archive.pdf');
      await page.getByText(/up to 52[.]4 MB each/, { exact: false }).waitFor();
    },
};

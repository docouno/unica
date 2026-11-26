import assert from 'node:assert/strict';
import { getBox } from '../helpers.mjs';

const base = '**/avatar-test/';
const ready = '[data-unica-avatar-image-ready]';

function respond(route, { color = 'red', size = 40, broken = false, cache = 'no-store' } = {}) {
  return route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    headers: { 'cache-control': cache },
    body: broken
      ? 'not an image'
      : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${color}"/></svg>`,
  });
}

async function delayed(page, name, options) {
  const arrived = Promise.withResolvers();
  const release = Promise.withResolvers();
  const answered = Promise.withResolvers();
  await page.route(base + name, async (route) => {
    arrived.resolve();
    await release.promise;
    await respond(route, options);
    answered.resolve();
  });
  return {
    arrived: arrived.promise,
    release: async () => {
      release.resolve();
      await answered.promise;
    },
  };
}

function button(page, name) {
  return page.getByRole('button', { name, exact: true });
}

async function assertCandidate(portrait, filename) {
  await portrait.locator(ready).waitFor();
  const actual = await portrait
    .locator('img')
    .evaluate((node) => new URL(node.currentSrc).pathname);
  assert.equal(actual, '/avatar-test/' + filename);
}

async function assertFallback(portrait, text) {
  assert.equal(await portrait.locator(ready).count(), 0);
  assert.equal(await portrait.locator('img').isVisible(), false);
  assert.equal(await portrait.getByText(text, { exact: true }).isVisible(), true);
}

const scenarios = {};
for (const broken of [false, true]) {
  scenarios[`Avatar ignores a late ${broken ? 'error' : 'success'} from the previous portrait`] =
    async ({ page, mount }) => {
      const previous = await delayed(page, 'pending.svg', { broken });
      const current = await delayed(page, 'sam.svg', { color: 'green' });
      await mount('avatar-image');
      const avatar = page.getByTestId('portrait');
      const frame = await avatar.elementHandle();
      const box = await getBox(avatar);

      await button(page, 'Pending Alex').click();
      await previous.arrived;
      await assertFallback(avatar, 'AR');
      const staleImage = await avatar.locator('img').evaluateHandle((image) => {
        const result = { image, event: null };
        const recordNativeEvent = (event) => {
          if (event.isTrusted) {
            result.event = event.type;
          }
        };
        image.addEventListener('load', recordNativeEvent, { once: true });
        image.addEventListener('error', recordNativeEvent, { once: true });
        return result;
      });

      await button(page, 'Sam with candidates').click();
      await current.arrived;
      await assertFallback(avatar, 'SC');
      assert.equal(await avatar.getAttribute('aria-label'), 'Sam Chen');
      assert.equal(await avatar.locator('img').getAttribute('src'), null);
      await current.release();
      await assertCandidate(avatar, 'sam.svg');
      await previous.release();
      await page.waitForFunction(({ event }) => event !== null, staleImage);
      assert.equal(await staleImage.evaluate(({ event }) => event), broken ? 'error' : 'load');
      await assertCandidate(avatar, 'sam.svg');
      assert.equal(await avatar.getByText('SC').isVisible(), false);
      assert.deepEqual(await getBox(avatar), box);
      assert.equal(await avatar.evaluate((node, original) => node === original, frame), true);
    };
}

export default {
  ...scenarios,
  'Avatar replaces a ready versioned portrait with the new initials while its replacement loads':
    async ({ page, mount }) => {
      await page.route(base + 'alex-v1.svg', (route) =>
        respond(route, { cache: 'public, max-age=3600' }),
      );
      const next = await delayed(page, 'sam-v2.svg', { color: 'green' });
      await mount('avatar-image');
      const avatar = page.getByTestId('portrait');
      await button(page, 'Ready Alex').click();
      await assertCandidate(avatar, 'alex-v1.svg');
      const firstImage = await avatar.locator('img').elementHandle();
      await button(page, 'New version').click();
      await next.arrived;
      await assertFallback(avatar, 'SC');
      assert.equal(await firstImage.evaluate((image) => image.isConnected), false);
      await next.release();
      await assertCandidate(avatar, 'sam-v2.svg');
      const nextImage = await avatar.locator('img').elementHandle();
      await button(page, 'Change crop').click();
      assert.equal(
        await nextImage.evaluate((image) => getComputedStyle(image).objectPosition),
        '30% 20%',
      );
      await assertCandidate(avatar, 'sam-v2.svg');
      await button(page, 'Remove source').click();
      assert.equal(await avatar.locator('img').count(), 0);
      assert.equal(await avatar.getByText('SC', { exact: true }).isVisible(), true);
    },

  'Avatar lets the browser select a new width candidate without remounting the same image': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 420, height: 500 });
    await page.route(base + 'small.svg', (route) =>
      respond(route, { cache: 'public, max-age=3600' }),
    );
    const large = await delayed(page, 'large.svg', { size: 80, color: 'green' });
    await mount('avatar-image');
    const avatar = page.getByTestId('portrait');
    await button(page, 'Responsive').click();
    await assertCandidate(avatar, 'small.svg');
    const image = await avatar.locator('img').elementHandle();
    await page.setViewportSize({ width: 800, height: 500 });
    await large.arrived;
    assert.equal(await avatar.locator('img').evaluate((node, old) => node === old, image), true);
    await large.release();
    await page.waitForFunction((node) => node.currentSrc.endsWith('/large.svg'), image);
    await assertCandidate(avatar, 'large.svg');
    await button(page, 'Explicit sizes').click();
    assert.equal(await avatar.locator('img').evaluate((node, old) => node === old, image), false);
    await assertCandidate(avatar, 'large.svg');
  },

  'Avatar handles a decode error and retries the same URL while its frame is hidden': async ({
    page,
    mount,
  }) => {
    let attempts = 0;
    await page.route(base + 'retry.svg', (route) => respond(route, { broken: ++attempts === 1 }));
    await page.route(base + 'invalid.svg', (route) => respond(route, { broken: true }));
    await mount('avatar-image');
    const avatar = page.getByTestId('portrait');
    await button(page, 'Broken without name').click();
    await page.waitForFunction(
      () => document.querySelector('[data-testid=portrait] img')?.complete,
    );
    assert.equal(await avatar.locator('svg').isVisible(), true);
    assert.equal(await avatar.locator('img').isVisible(), false);
    await button(page, 'Broken portrait').click();
    await page.waitForFunction(
      () => document.querySelector('[data-testid=portrait] img')?.complete,
    );
    await assertFallback(avatar, 'JM');
    await button(page, 'Toggle frame visibility').click();
    await button(page, 'Retry').click();
    await avatar.locator(ready).waitFor({ state: 'attached' });
    assert.equal(await avatar.isVisible(), false);
    await button(page, 'Toggle frame visibility').click();
    await assertCandidate(avatar, 'retry.svg');
    assert.equal(attempts, 2);
    assert.equal(await avatar.locator('img').isVisible(), true);
  },

  'Avatar reveals a portrait completed before hydration and retains the existing lists': async ({
    page,
    mount,
    renderFixture,
  }) => {
    await page.route(base + 'hydrate.svg', (route) => respond(route));
    await mount('avatar-hydration', { theme: 'frost-dark' });
    const html = await renderFixture('avatar-ssr');
    const host = page.getByTestId('ssr-root');
    await host.evaluate((node, markup) => {
      node.innerHTML = markup;
    }, html);
    const avatar = page.getByTestId('server-portrait');
    const image = await avatar.locator('img').elementHandle();
    await page.waitForFunction((node) => node.complete && node.naturalWidth === 40, image);
    await assertFallback(avatar, 'AR');
    const contributors = host.getByRole('list', { name: 'Contributors' });
    const list = await contributors.elementHandle();
    await button(page, 'Hydrate identities').click();
    await assertCandidate(avatar, 'hydrate.svg');
    assert.equal(await contributors.evaluate((node, original) => node === original, list), true);
    assert.equal(
      await avatar.locator('img').evaluate((node, original) => node === original, image),
      true,
    );
    assert.equal(await page.getByTestId('hydration-errors').textContent(), '');
  },
};

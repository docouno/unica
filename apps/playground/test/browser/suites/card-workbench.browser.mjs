import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

function navigate(page, params) {
  return page.evaluate((route) => {
    const url = new URL(window.location.href);
    for (const key of [
      'item',
      'tab',
      'block',
      'mode',
      'slice',
      'family',
      'scheme',
      'bounds',
      'vp',
    ]) {
      url.searchParams.delete(key);
    }
    for (const [key, value] of Object.entries(route)) {
      url.searchParams.set(key, value);
    }
    history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, params);
}

async function assertDirectional(link, direction) {
  const icon = link.locator('svg');
  assert.equal(await icon.count(), 1);
  assert.equal(await icon.getAttribute('aria-hidden'), 'true');
  assert.equal(await icon.getAttribute('tabindex'), null);
  const geometry = await icon.evaluate((node) => {
    for (let current = node; current && !current.matches('a'); current = current.parentElement) {
      const { transform, scale } = getComputedStyle(current);
      if (transform !== 'none' || scale !== 'none') {
        return [transform, scale];
      }
    }
    return ['none', 'none'];
  });
  if (direction === 'rtl') {
    assert.ok(
      geometry[0].startsWith('matrix(-1,') || geometry[1].startsWith('-1'),
      geometry.join(' '),
    );
  } else {
    assert.deepEqual(geometry, ['none', 'none']);
  }
}

async function folioScenes(page, mount) {
  await mount('card-folio');
  await page.setViewportSize({ width: 1500, height: 900 });
  return async (item) => {
    await navigate(page, { item, family: 'frost', scheme: 'dark', vp: '1280' });
    const scene = page.locator('[data-wb-scene]');
    await scene.locator('[data-unica-card-variant]').first().waitFor();
    return scene;
  };
}

export default {
  'Card Workbench exercises host constraints, media precedence, Pairwise and Usage': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('card-workbench');
    await navigate(page, { item: 'card', tab: 'playground' });
    await page.waitForFunction(
      () => document.querySelectorAll('[data-wb-subject][data-unica-card-variant]').length === 6,
    );
    const control = (label) =>
      page
        .locator('.wb-control-field')
        .filter({ has: page.getByText(label, { exact: true }) })
        .locator('input, select');
    await control('host').selectOption('a');
    await page.waitForFunction(
      () => document.querySelectorAll('a[data-wb-subject][aria-labelledby]').length === 6,
    );
    const labels = await page
      .locator('a[data-wb-subject]')
      .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('aria-labelledby')));
    assert.equal(new Set(labels).size, 6);
    assert.equal(await control('action').isDisabled(), true);
    await page.getByText('A whole-card anchor can contain only passive content.').first().waitFor();
    assert.equal(await page.locator('a[data-wb-subject] button').count(), 0);
    await control('media').selectOption('section');
    await control('style.aspectRatio').selectOption('3 / 2');
    await control('aspectRatio').selectOption('4 / 3');
    const frame = page.locator('[data-wb-subject] [data-unica-card-fit]').first();
    assert.equal(await frame.evaluate((node) => node.style.aspectRatio), '4 / 3');
    await page
      .getByText('The aspectRatio prop overrides style.aspectRatio on the frame.')
      .first()
      .waitFor();

    await navigate(page, {
      item: 'card',
      tab: 'states',
      slice: 'orientation',
      family: 'pixel',
      scheme: 'light',
      vp: '768',
      bounds: '1',
    });
    await page.locator('[data-wb-slice="orientation"]').first().waitFor();
    await page
      .locator('[data-wb-subject][data-unica-card-orientation="horizontal"]')
      .first()
      .waitFor();
    await navigate(page, {
      item: 'card',
      tab: 'states',
      mode: 'pairwise',
      family: 'pixel',
      scheme: 'light',
      vp: '768',
    });
    const result = page.locator('.wb-matrix-status').getByText(/compatible pairs/);
    await result.waitFor();
    const audit = (await result.textContent()).match(/(\d+) \/ (\d+) compatible pairs/);
    assert.ok(audit && Number(audit[1]) > 0);
    assert.equal(audit[1], audit[2]);
    await navigate(page, { item: 'card', tab: 'compositions', family: 'soft', scheme: 'light' });
    const usage = page.locator('[data-wb-block="sections"]');
    await usage.locator('article[data-unica-card-variant]').waitFor();
    await usage.getByRole('heading', { name: 'Field guide', exact: true }).waitFor();
  },

  'Card navigation cue precedes the first touch in both directions and coarse actions retain their target size':
    async ({ page, mount }) => {
      await mount('card-workbench');
      await page.setViewportSize({ width: 920, height: 780 });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      const hoverStart = () =>
        page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches);
      assert.equal(await hoverStart(), true);
      await navigate(page, {
        item: 'card',
        tab: 'states',
        block: 'navigation',
        family: 'soft',
        scheme: 'dark',
        vp: '360',
      });
      const block = page.locator(
        '.wb-story-frame[data-wb-block="navigation"], .wb-raw-canvas[data-wb-block="navigation"]',
      );
      const link = block.getByRole('link', { name: 'Getting started', exact: true });
      await link.getByText('Read the guide', { exact: true }).waitFor();
      await assertDirectional(link, 'ltr');
      await page.getByRole('button', { name: 'RTL', exact: true }).click();
      await assertDirectional(link, 'rtl');
      const action = block.getByRole('button', {
        name: 'Save A more thoughtful handoff',
        exact: true,
      });
      const { width, height } = await getBox(action);
      assert.ok(width >= 44 && height >= 44, `${width}×${height}`);

      await link.scrollIntoViewIfNeeded();
      const rest = await link.evaluate((node) => getComputedStyle(node).backgroundColor);
      const target = await getBox(link);
      const points = [{ x: target.x + target.width / 2, y: target.y + target.height / 2 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await block.getByText('Getting started', { exact: true }).last().waitFor();
      await page.waitForFunction(
        (color) =>
          getComputedStyle(document.querySelector('a[data-unica-card-variant]')).backgroundColor ===
          color,
        rest,
      );
      assert.equal(
        await link.evaluate(
          (node) => getComputedStyle(node.querySelector('h3')).textDecorationLine,
        ),
        'none',
      );
    },

  'Card forwards native pointer, keyboard and touch invocation to ContextMenu': async ({
    page,
    mount,
  }) => {
    await mount('card-workbench');
    await page.setViewportSize({ width: 920, height: 780 });
    await navigate(page, {
      item: 'context-menu',
      tab: 'states',
      block: 'touch',
      family: 'soft',
      scheme: 'dark',
    });
    const block = page.locator(
      '.wb-story-frame[data-wb-block="touch"], .wb-raw-canvas[data-wb-block="touch"]',
    );
    const tile = block.locator('[data-touch-hold][data-unica-card-variant]');
    const trigger = tile.getByRole('button', { name: 'Actions for Invoice draft' });
    const menu = block.getByRole('menu', { name: 'Invoice draft actions' });

    await tile.focus();
    await tile.press('Shift+F10');
    await menu.waitFor();
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });
    await assertFocused(tile);

    await trigger.click();
    await menu.waitFor();
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });
    await assertFocused(trigger);

    await tile.click({ button: 'right', position: { x: 12, y: 12 } });
    await menu.waitFor();
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });

    await tile.scrollIntoViewIfNeeded();
    const box = await getBox(tile);
    const touchPoints = [{ x: box.x + 12, y: box.y + 12 }];
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await tile.evaluate((node) => {
      let openings = 0;
      new MutationObserver(() => {
        if (node.hasAttribute('data-context-open')) {
          node.dataset.testOpenings = String(++openings);
        }
      }).observe(node, { attributes: true, attributeFilter: ['data-context-open'] });
    });

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await page.waitForTimeout(550);
    assert.equal(await menu.isVisible(), false);
    assert.equal(await tile.getAttribute('data-test-openings'), null);
    assert.equal(await block.getByText('Rename · Invoice draft', { exact: true }).count(), 0);

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
    await menu.waitFor();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await menu.isVisible(), true);
    assert.equal(await tile.getAttribute('data-test-openings'), '1');
    await menu.getByRole('menuitem', { name: 'Rename' }).click();
    await block.getByText('Rename · Invoice draft', { exact: true }).waitFor();
  },
  'Folio preserves Card interactions in sign-in, overview, collection and invitations': async ({
    page,
    mount,
  }) => {
    const scene = await folioScenes(page, mount);

    const signIn = await scene('01-sign-in');
    await signIn.getByRole('link', { name: /Request workspace access/ }).click();
    await signIn.getByRole('heading', { name: 'Join your workspace' }).waitFor();

    const overview = await scene('02-workspace-overview');
    const activity = overview.getByRole('list', { name: 'Recent activity' });
    const count = await activity.getByRole('listitem').count();
    await overview.getByRole('radio', { name: 'Edited' }).check();
    assert.ok((await activity.getByRole('listitem').count()) < count);

    const collection = await scene('03-document-collection');
    await collection.getByRole('radio', { name: 'Cards' }).check();
    const card = collection.locator('.folio-runbook-menu-card[data-unica-card-variant]').first();
    const actions = card.getByRole('button', { name: /Actions for/ });
    await actions.click();
    await collection.getByRole('menu').waitFor();
    await page.keyboard.press('Escape');
    await collection.getByRole('menu').waitFor({ state: 'hidden' });
    await assertFocused(actions);

    const invites = await scene('07-invite-access-modal');
    await invites.getByRole('button', { name: /Send \d+ invites/ }).click();
    await invites
      .locator('.toast-title')
      .filter({ hasText: /invitations prepared/ })
      .waitFor();
  },

  'Folio preserves Card interactions in extensions, preferences and import': async ({
    page,
    mount,
  }) => {
    const scene = await folioScenes(page, mount);
    const extensions = await scene('08-extensions-empty');
    await extensions
      .locator('.folio-connector-featured[data-unica-card-variant]')
      .first()
      .getByRole('button', { name: 'Configure' })
      .click();
    await extensions.getByText('GitHub Enterprise configuration selected.').waitFor();

    const preferences = await scene('09-user-preferences');
    const dark = preferences
      .locator('.folio-preferences-card[data-unica-card-variant]')
      .getByRole('radio', { name: 'Dark' });
    await dark.check();
    assert.equal(await dark.isChecked(), true);

    const admin = await scene('10-workspace-admin');
    await admin.getByRole('button', { name: 'Run dry-run check' }).click();
    await admin
      .getByText(/Dry-run check complete: \d+ staged archives passed validation/)
      .waitFor();
  },
};

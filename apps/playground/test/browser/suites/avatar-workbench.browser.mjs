import assert from 'node:assert/strict';

async function open(page, route) {
  await page.evaluate(
    (params) => {
      document.documentElement.removeAttribute('data-wb-ready');
      const url = new URL(window.location.href);
      url.search = new URLSearchParams(params).toString();
      history.pushState(null, '', url);
      dispatchEvent(new PopStateEvent('popstate'));
    },
    { family: 'frost', scheme: 'dark', ...route },
  );
  await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 15000 });
}

export default {
  'Avatar and AvatarGroup resolve public JSX, documentation and the existing Workbench routes':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mount('workbench-v3');
      for (const [item, name] of [
        ['avatar', 'Avatar'],
        ['avatar-group', 'AvatarGroup'],
      ]) {
        await open(page, { item, tab: 'usage' });
        await page.locator('#wb-usage-reference').waitFor({ timeout: 15000 });
        const code = await page.locator('#wb-usage-quick-start pre').textContent();
        assert.match(code, new RegExp(`import \\{ ${name} \\} from ['"]@docouno/unica['"]`));
        assert.match(code, new RegExp(`<${name} `));
        assert.match(
          await page.locator('.wb-usage-provenance').textContent(),
          /docs\/components\/avatar\.md/,
        );
      }

      await open(page, { item: 'avatar', tab: 'states', slice: 'sizes', bounds: '1' });
      await page.locator('.wb-artboard [data-wb-subject].unica-avatar').first().waitFor();
      await page.locator('[data-wb-bounds-label]').first().waitFor();

      await open(page, {
        item: 'avatar-group',
        tab: 'states',
        mode: 'pairwise',
        family: 'pixel',
        scheme: 'light',
        vp: '1280',
        scale: '120',
        bounds: '1',
        freeze: '1',
      });
      const viewport = page
        .locator('.wb-artboard')
        .getByRole('region', { name: 'Scrollable avatars' })
        .filter({ has: page.locator('ul[data-unica-avatar-size="s"]:has(> li:nth-child(7))') });
      const fits = await viewport.evaluate((node) => {
        const list = node.querySelector('ul');
        const last = list.lastElementChild;
        const clip = node.getBoundingClientRect();
        const clipped = last.getBoundingClientRect().right > clip.right;
        const subjectFits = list.getBoundingClientRect().right <= clip.right;
        node.scrollLeft = node.scrollWidth;
        return {
          scrollable:
            getComputedStyle(node).overflowX === 'auto' && node.scrollWidth > node.clientWidth,
          clipped,
          subjectFits,
          reachesEnd: last.getBoundingClientRect().right <= clip.right,
        };
      });
      assert.deepEqual(fits, {
        scrollable: true,
        clipped: true,
        subjectFits: true,
        reachesEnd: true,
      });

      await open(page, { item: 'avatar', tab: 'compositions', block: 'usage' });
      const disclosure = page
        .locator('.wb-artboard')
        .getByRole('button', { name: 'View all 7' })
        .first();
      await disclosure.press('Enter');
      await page
        .locator('.wb-artboard')
        .getByRole('list', { name: 'All contributors' })
        .first()
        .waitFor();
      assert.match(
        await page.locator('[data-wb-block="usage"] pre').first().textContent(),
        /from ['"]@docouno\/unica['"]/,
      );

      await open(page, { item: 'avatar', tab: 'compositions', block: 'actions' });
      const profile = page.locator('.wb-artboard').getByRole('button', { name: 'Account' }).first();
      await profile.press('Space');
      await page
        .locator('.wb-artboard')
        .getByRole('region', { name: 'Account details' })
        .first()
        .waitFor();
    },
};

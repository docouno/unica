import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

async function navigate(page, route) {
  await page.evaluate((params) => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    history.pushState(null, '', url);
    dispatchEvent(new PopStateEvent('popstate'));
  }, route);
}

async function assertArtboards(page, through) {
  await page.waitForFunction(
    (count) => document.querySelectorAll('[data-portal-probe]').length === count,
    through * 6,
  );
  const actual = await page.locator('.wb-artboard').evaluateAll((boards) =>
    boards.map((board) => {
      const styles = (node) => {
        const style = getComputedStyle(node);
        return [style.direction, style.fontSize, style.color];
      };
      const inline = [...board.querySelectorAll('[data-inline-probe]')];
      const portaled = [...board.querySelectorAll(':scope > [data-portal-probe]')];
      return {
        theme: board.dataset.theme,
        scale: board.dataset.textScale,
        direction: styles(board)[0],
        inline: inline.map(styles),
        portaled: portaled.map(styles),
      };
    }),
  );
  assert.deepEqual(
    actual.map(({ theme }) => theme),
    ['soft-dark', 'soft-light', 'frost-dark', 'frost-light', 'pixel-dark', 'pixel-light'],
  );
  for (const { inline, portaled } of actual) {
    assert.equal(inline.length, through);
    assert.deepEqual(portaled, inline);
  }
  assert.equal(
    await page
      .locator('[data-portal-probe]')
      .evaluateAll(
        (probes) => probes.filter((probe) => probe.parentElement.matches('.wb-artboard')).length,
      ),
    through * 6,
  );
  return actual;
}

export default {
  'Workbench scenes and multiple inspector previews use the physical artboard host': async ({
    page,
    mount,
  }) => {
    await mount('overlay-workbench');
    await navigate(page, { item: 'portal-probe', tab: 'states' });
    const normal = await assertArtboards(page, 2);
    await page.getByRole('button', { name: '120% Text' }).click();
    await page.getByRole('button', { name: 'RTL', exact: true }).click();
    const stressed = await assertArtboards(page, 2);
    for (const [index, board] of stressed.entries()) {
      assert.equal(board.scale, '120');
      assert.equal(board.direction, 'rtl');
      assert.ok(parseFloat(board.portaled[0][1]) > parseFloat(normal[index].portaled[0][1]));
    }
    await navigate(page, { item: 'overlay-probe' });
    await assertArtboards(page, 1);
    await page.getByRole('button', { name: 'Expand Soft · Dark' }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-portal-probe]').length === 1);
    assert.equal(
      await page
        .locator('[data-portal-probe]')
        .evaluate((node) => node.parentElement.dataset.theme),
      'soft-dark',
    );
    await page.getByRole('button', { name: 'Collapse Soft · Dark' }).click();
    await assertArtboards(page, 1);
  },

  'Toast actions follow their artboard modal while a neighboring queue retains its messages':
    async ({ page, mount }) => {
      await mount('overlay-workbench');
      await navigate(page, { item: 'overlay-probe' });
      const left = page.locator('.wb-artboard[data-theme="soft-dark"]');
      const right = page.locator('.wb-artboard[data-theme="pixel-light"]');
      await right.locator('[data-message-id="1"]').waitFor();
      await left.getByRole('button', { name: 'Open editor' }).click();
      const editor = left.getByRole('dialog', { name: 'Editor' });
      const localAction = editor.getByRole('button', { name: 'Scoped action 1' });
      await localAction.waitFor();
      assert.equal(
        await localAction.evaluate((node) => node.closest('.wb-artboard').dataset.theme),
        'soft-dark',
      );
      await assertFocused(editor.getByRole('button', { name: 'Close Editor' }));
      await page.keyboard.press('Tab');
      if (
        await editor
          .getByRole('button', { name: 'Global action 1' })
          .evaluate((button) => button === document.activeElement)
      ) {
        await page.keyboard.press('Tab');
      }
      await assertFocused(localAction);
      await localAction.click();
      assert.equal(await left.locator('[data-queue="scoped"]').getAttribute('data-actions'), '1');
      await editor.getByRole('button', { name: 'Global action 1' }).click();
      assert.equal(await page.locator('[data-queue="global"]').getAttribute('data-actions'), '1');

      await right.locator('[data-enqueue]').evaluate((button) => button.click());
      assert.equal(
        await right.locator('[data-queue="scoped"]').getAttribute('data-announcements'),
        '2',
      );
      assert.equal(await right.locator('[data-message-id]').count(), 0);
      assert.equal(await editor.getByRole('button', { name: 'Scoped action 2' }).count(), 0);

      await left.locator('[data-confirm-trigger]').evaluate((button) => button.click());
      const confirm = left.getByRole('dialog', { name: 'Confirmation' });
      await confirm.getByRole('button', { name: 'Scoped action 1' }).click();
      assert.equal(await left.locator('[data-queue="scoped"]').getAttribute('data-actions'), '2');
      await confirm.getByRole('button', { name: 'Close Confirmation' }).click();
      await localAction.waitFor();
      await editor.getByRole('button', { name: 'Close Editor' }).click();

      await right.getByRole('button', { name: 'Scoped action 2' }).waitFor();
      assert.deepEqual(
        await right
          .locator('[data-message-id]')
          .evaluateAll((actions) => actions.map((action) => action.dataset.messageId)),
        ['1', '2'],
      );
      assert.equal(
        await right.locator('[data-queue="scoped"]').getAttribute('data-announcements'),
        '2',
      );
      assert.equal(
        await left.locator('[data-queue="scoped"]').getAttribute('data-announcements'),
        '1',
      );
      assert.equal(await page.locator('[data-toast-viewport] > button:focus').count(), 0);
      await right.getByRole('button', { name: 'Scoped action 2' }).click();
      assert.equal(await right.locator('[data-queue="scoped"]').getAttribute('data-actions'), '1');
    },

  'unmounting artboards clears their runtime owners and body scroll lock': async ({
    page,
    mount,
  }) => {
    await mount('overlay-workbench');
    await navigate(page, { item: 'overlay-probe' });
    await page.locator('.wb-artboard[data-theme="soft-dark"] [data-dialog-trigger]').click();
    await page.locator('dialog:modal').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    await navigate(page, { item: 'portal-probe', family: 'pixel', scheme: 'light' });
    await page.locator('dialog:modal').waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '');
    assert.equal(
      await page
        .getByRole('button', { name: 'Global action 1' })
        .evaluate((button) => button.parentElement.parentElement === document.body),
      true,
    );
  },

  'Bounds and owned FormData inspection work for inline and Portal-rendered subjects and forms':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await mount('overlay-workbench');
      // Ordinary inline subject is measured once (not duplicated by the artboard portaled observer).
      await navigate(page, {
        item: 'portal-probe',
        family: 'soft',
        scheme: 'dark',
        bounds: '1',
      });
      await page.locator('.wb-inspector-preview > .wb-bounds-layer').waitFor();
      assert.equal(await page.locator('.wb-bounds-layer').count(), 1);

      await navigate(page, {
        item: 'portal-dialog-probe',
        family: 'soft',
        scheme: 'dark',
        bounds: '1',
      });
      await page.locator('[data-open-portaled-dialog]').click();
      await page.locator('dialog:modal').waitFor();
      await page.locator('.wb-artboard > .wb-bounds-layer[data-wb-native-layer]').waitFor();
      assert.equal(await page.locator('.wb-bounds-layer').count(), 1);
      const label = await page
        .locator('.wb-artboard > .wb-bounds-layer [data-wb-bounds-label]')
        .textContent();
      assert.match(label ?? '', /240 × 120 px/);
      await page.locator('dialog input[name="owner"]').fill('edited');
      await page.getByRole('button', { name: 'Save' }).click();
      await page.keyboard.press('Escape');
      await page.locator('dialog:modal').waitFor({ state: 'detached' });
      await page.getByRole('tab', { name: 'FormData' }).click();
      assert.match((await page.getByRole('tabpanel').textContent()) ?? '', /owner.*edited/s);
      // Workbench's own Reset + Submit buttons target the portaled owned form inside the artboard.
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
      assert.match((await page.getByRole('tabpanel').textContent()) ?? '', /owner.*unica/s);
    },
};

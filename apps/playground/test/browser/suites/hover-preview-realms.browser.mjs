import assert from 'node:assert/strict';

function command(page, type, id = '') {
  return page
    .locator('#hover-preview-realms')
    .evaluate(
      (element, detail) => element.dispatchEvent(new CustomEvent('test-command', { detail })),
      { type, id },
    );
}

function shown(target, id) {
  return target.locator(`#${id}-preview:popover-open`);
}

async function reports(page) {
  return JSON.parse(
    (await page.locator('#hover-preview-realms').getAttribute('data-notices')) ?? '[]',
  );
}

export default {
  'Hover previews in distinct module graphs share a document winner and default warmup by family':
    async ({ page, mount }) => {
      await mount('hover-preview-realms');
      assert.equal(
        await page.locator('#hover-preview-realms').getAttribute('data-distinct'),
        'true',
      );
      await page.locator('#a-source').hover();
      await shown(page, 'a').waitFor();
      await page.locator('#b-source').hover();
      await shown(page, 'b').waitFor({ timeout: 350 });
      assert.equal(await shown(page, 'a').count(), 0);
      assert.ok((await reports(page)).includes('a:false:replacement'));

      await page.locator('#b-card-source').hover();
      assert.equal(await shown(page, 'b-card').count(), 0);
      await shown(page, 'b-card').waitFor();
      assert.equal(
        await page.locator(':is(.unica-tooltip, .unica-hover-card):popover-open').count(),
        1,
      );
    },

  'Hover previews cancel a cold pointer proposal from another root and bundle on keyboard focus':
    async ({ page, mount }) => {
      await mount('hover-preview-realms');
      await page.locator('#b-source').hover();
      assert.equal(await shown(page, 'b').count(), 0);
      await page.keyboard.press('Tab');
      await shown(page, 'a').waitFor({ timeout: 350 });
      await page.waitForTimeout(650);
      assert.equal(await shown(page, 'a').count(), 1);
      assert.equal(await shown(page, 'b').count(), 0);
      assert.ok(!(await reports(page)).includes('b:true:hover'));
    },

  'Hover previews release document state in both teardown orders and leave iframe documents independent':
    async ({ page, mount }) => {
      for (const [first, second] of [
        ['a', 'b'],
        ['b', 'a'],
      ]) {
        await mount('hover-preview-realms');
        const frameA = page.frameLocator('#frame-a-root');
        const frameB = page.frameLocator('#frame-b-root');
        await shown(frameA, 'frame-a').waitFor();
        await shown(frameB, 'frame-b').waitFor();
        await page.locator(`#${first}-source`).hover();
        await shown(page, first).waitFor();
        await page.locator(`#${second}-source`).hover();
        await shown(page, second).waitFor({ timeout: 350 });
        await command(page, 'unmount', first);
        await command(page, 'unmount', second);
        await command(page, 'keys');
        assert.equal(await page.locator('#hover-preview-realms').getAttribute('data-keys'), '0');
        assert.equal(await shown(frameA, 'frame-a').count(), 1);
        assert.equal(await shown(frameB, 'frame-b').count(), 1);

        // Move off the removed source before remounting, so the next hover is an actual enter.
        await page.mouse.move(2, 2);
        await command(page, 'mount', second);
        await page.locator(`#${second}-source`).hover();
        assert.equal(await shown(page, second).count(), 0);
        await shown(page, second).waitFor();
        await frameA.locator('#frame-a-source').press('Escape');
        await shown(frameA, 'frame-a').waitFor({ state: 'detached' });
        assert.equal(await shown(frameB, 'frame-b').count(), 1);
      }
    },
};

import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox } from '../helpers.mjs';

async function openWorkbench(page, route) {
  const url = new URL('/', page.url());
  url.search = new URLSearchParams({ family: 'frost', scheme: 'dark', ...route }).toString();
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 10000 });
}

const decoration = '[aria-hidden="true"][contenteditable="false"]';

export default {
  'Skeleton Workbench renders the public controls, JSX, bounds and pairwise examples': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await mount('native');
    await openWorkbench(page, { item: 'skeleton', tab: 'playground', bounds: '1', vp: '768' });
    await page.getByRole('heading', { name: 'Skeleton', exact: true }).waitFor();
    const subject = page.locator('[data-wb-subject]');
    const code = page.getByRole('region', { name: 'JSX' }).locator('pre');
    const width = page.getByRole('textbox', { name: /^width\b/iu });
    const height = page.getByRole('textbox', { name: /^height\b/iu });
    await page.getByRole('combobox', { name: /^shape\b/iu }).selectOption('circle');
    await width.fill('32');
    await height.fill('24');
    await assertBox(subject, { width: 32, height: 24 });
    assert.equal(await subject.evaluate((node) => node.tagName), 'SPAN');
    assert.match(
      await code.innerText(),
      /shape=(?:"circle"|\{['"]circle['"]\})\s+width=\{32\}\s+height=\{24\}/u,
    );
    await page.locator('[data-wb-bounds-label]').first().waitFor();
    await width.fill('60%');
    assert.equal(await subject.evaluate((node) => node.style.inlineSize), '60%');
    assert.match(await code.innerText(), /width=(?:"60%"|\{['"]60%['"]\})/u);
    await page.getByRole('checkbox', { name: /^hidden\b/iu }).check();
    await subject.waitFor({ state: 'hidden' });
    assert.equal(await subject.count(), 1);

    await openWorkbench(page, {
      item: 'skeleton-text',
      tab: 'playground',
      surface: 'overlay',
      vp: '360',
      scale: '120',
      dir: 'rtl',
    });
    await page.getByRole('combobox', { name: /^size\b/iu }).selectOption('heading-s');
    await page.getByRole('spinbutton', { name: /^lines\b/iu }).fill('1');
    await width.fill('  48  ');
    assert.equal(await subject.evaluate((node) => node.tagName), 'DIV');
    assert.equal(await subject.locator(':scope > span').count(), 1);
    await assertBox(subject, { width: 48 });
    assert.match(
      await code.innerText(),
      /size=(?:"heading-s"|\{['"]heading-s['"]\})\s+lines=\{1\}\s+width=\{48\}/u,
    );
    await width.fill('');
    assert.equal(await subject.evaluate((node) => node.style.inlineSize), '');
    assert.doesNotMatch(await code.innerText(), /width=/u);

    await openWorkbench(page, {
      item: 'skeleton-text',
      tab: 'states',
      mode: 'pairwise',
      vp: '1280',
    });
    const matrix = page.getByRole('region', { name: 'Component matrix' });
    await matrix.locator('[data-wb-subject]').first().waitFor({ state: 'attached' });
    assert.equal(await matrix.getAttribute('data-wb-matrix-mode'), 'pairwise');
  },

  'Skeleton Workbench restricts image-only busy state and preserves media layout and focus on reveal':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await mount('native');
      await openWorkbench(page, { item: 'skeleton', tab: 'states', block: 'media' });
      const mediaCase = page.locator('[data-wb-block="media"]');
      const status = mediaCase.getByRole('status');
      const figures = mediaCase.locator('figure');
      const dynamic = figures.filter({ has: page.getByRole('status') });
      const ready = figures.filter({ hasText: 'Ready reference' });
      const slot = dynamic.locator('.skeleton-demo-media');
      const frame = dynamic.locator('.skeleton-demo-report');
      const oldShape = slot.locator(decoration);
      await page.waitForFunction(() => {
        const node = document.querySelector('.skeleton-demo-media-fill');
        return node && parseFloat(getComputedStyle(node, '::after').width) > 0;
      });
      await oldShape.evaluate(async (node) => {
        const animation = node.getAnimations({ subtree: true })[0];
        if (!animation) {
          throw new Error('Expected live sweep animation in the image slot');
        }
        animation.pause();
        await animation.ready;
        const { width, height } = node.getBoundingClientRect();
        let start = 0;
        let end = 2000;
        for (let step = 0; step < 16; step++) {
          const time = (start + end) / 2;
          animation.currentTime = time;
          const style = getComputedStyle(node, '::after');
          const matrix = new DOMMatrix(style.transform);
          const center = matrix.m41 + (matrix.m21 * height + parseFloat(style.width)) / 2;
          if (center < width / 2) {
            start = time;
          } else {
            end = time;
          }
        }
      });
      const screenshot = await oldShape.screenshot();
      const sweep = await page.evaluate(
        async (bytes) => {
          const bitmap = await createImageBitmap(
            new Blob([Uint8Array.from(bytes)], { type: 'image/png' }),
          );
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const context = canvas.getContext('2d');
          context.drawImage(bitmap, 0, 0);
          const { data } = context.getImageData(0, Math.floor(bitmap.height / 2), bitmap.width, 1);
          const row = Array.from(
            { length: bitmap.width },
            (_, x) => data[x * 4] + data[x * 4 + 1] + data[x * 4 + 2],
          );
          const base = Math.min(...row);
          const peak = Math.max(...row) - base;
          const coverage = row.filter((value) => value >= base + peak / 2).length / row.length;
          return { peak, coverage };
        },
        [...screenshot],
      );
      assert.ok(sweep.peak > 15 && sweep.coverage >= 0.45, JSON.stringify(sweep));
      const slotBox = await getBox(slot);
      const frameBefore = await getBox(frame);
      assert.equal(await status.count(), 1);
      assert.equal(await status.innerText(), 'Waiting for content');
      assert.equal(await status.evaluate((node) => node.closest('[aria-busy="true"]')), null);
      assert.equal(await frame.getAttribute('aria-busy'), 'true');
      assert.equal(await dynamic.getByRole('heading', { name: 'Field notes' }).count(), 0);
      assert.equal(await ready.getByRole('heading', { name: 'Field notes' }).count(), 1);
      assert.equal(await ready.getByRole('status').count(), 0);

      await mediaCase.getByLabel('Image only').check();
      assert.equal(await status.innerText(), 'Waiting for image');
      assert.equal(await dynamic.locator('[aria-busy="true"]').count(), 1);
      assert.equal(await slot.getAttribute('aria-busy'), 'true');
      for (const name of ['Field notes', 'Design studio']) {
        assert.equal(
          await dynamic
            .getByText(name, { exact: true })
            .evaluate((node) => node.closest('[aria-busy="true"]')),
          null,
        );
      }
      await assertBox(slot, slotBox, { tolerance: 0.1 });
      await assertBox(frame, frameBefore, { tolerance: 0.1 });

      await mediaCase.getByRole('button', { name: 'Reveal content' }).click();
      await oldShape.waitFor({ state: 'detached' });
      assert.equal(await slot.getByRole('img').count(), 1);
      assert.equal(await dynamic.locator('[aria-busy="true"]').count(), 0);
      assert.equal(await status.innerText(), 'Content arrived');
      assert.equal(await status.evaluate((node) => node.closest('[aria-busy="true"]')), null);
      await assertFocused(mediaCase.getByRole('button', { name: 'Show placeholders' }));
      await assertBox(slot, slotBox, { tolerance: 0.1 });
      await assertBox(frame, frameBefore, { tolerance: 0.1 });

      await openWorkbench(page, { item: 'skeleton', tab: 'compositions', block: 'typography' });
      const usage = page.locator('[data-wb-block="typography"]');
      const code = await usage.locator('pre').innerText();
      assert.match(code, /<article\s+aria-busy=\{loading\}[\s\S]+<\/article>\s+<p role="status">/u);
      assert.doesNotMatch(code, /<Text\b/u);
      assert.match(code, /--text-size-body-m-lh/u);
      const waiting = usage.locator('article');
      const message = usage.getByRole('status');
      const space = await getBox(waiting);
      assert.equal(await waiting.getAttribute('aria-busy'), 'true');
      assert.equal(await waiting.locator(decoration).count(), 1);
      assert.equal(await message.innerText(), 'Loading the summary…');
      assert.equal(await message.evaluate((node) => node.closest('[aria-busy="true"]')), null);
      await usage.getByRole('button', { name: 'Reveal summary' }).click();
      assert.equal(await waiting.getAttribute('aria-busy'), 'false');
      assert.equal(await waiting.locator(decoration).count(), 0);
      assert.equal(await message.innerText(), 'Summary loaded.');
      await assertBox(waiting, space, { tolerance: 0.1 });
      await assertFocused(usage.getByRole('button', { name: 'Show placeholder' }));
    },

  'Skeleton Workbench demonstrates fast, partial, refresh, empty and retry states': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await mount('native');
    await openWorkbench(page, { item: 'skeleton', tab: 'states', block: 'lifecycle' });
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    const lifecycle = page.locator('[data-wb-block="lifecycle"]');
    const region = lifecycle.getByRole('region', { name: 'Recent documents' });
    const status = lifecycle.locator('[role="status"]');
    const selector = lifecycle.getByLabel('Preview state');
    const state = () => region.getAttribute('data-load-state');
    const countPlaceholders = () => region.locator(decoration).count();
    const fast = lifecycle.getByRole('button', { name: 'Fast response' });
    await fast.focus();
    await fast.press('Enter');
    assert.equal(await state(), 'delay');
    assert.equal(await countPlaceholders(), 0);
    await page.clock.runFor(120);
    assert.equal(await state(), 'ready');
    assert.equal(await countPlaceholders(), 0);
    await assertFocused(fast);

    const content = region.getByText('Design principles');
    const original = await content.elementHandle();
    const refresh = lifecycle.getByRole('button', { name: 'Refresh' });
    await refresh.focus();
    await refresh.press('Enter');
    assert.equal(await state(), 'refresh');
    assert.equal(await countPlaceholders(), 0);
    assert.equal(await content.evaluate((node, previous) => node === previous, original), true);
    assert.equal(await status.evaluate((node) => node.closest('[aria-busy="true"]')), null);
    await page.clock.runFor(1120);
    assert.equal(await state(), 'ready');
    assert.equal(await content.evaluate((node, previous) => node === previous, original), true);
    await original.dispose();
    await assertFocused(refresh);

    await selector.selectOption('empty');
    assert.equal(await state(), 'empty');
    assert.equal(await countPlaceholders(), 0);
    await selector.selectOption('error');
    assert.equal(await state(), 'error');
    assert.equal(await countPlaceholders(), 0);
    const retry = lifecycle.getByRole('button', { name: 'Try again' });
    await retry.press('Enter');
    await page.clock.runFor(220);
    assert.equal(await state(), 'initial');
    assert.equal(await countPlaceholders(), 9);
    await page.clock.runFor(930);
    assert.equal(await state(), 'partial');
    assert.equal(await countPlaceholders(), 6);
    assert.equal(await region.getByText('Design principles').count(), 1);
    await page.clock.runFor(1150);
    assert.equal(await state(), 'ready');
    assert.equal(await region.getAttribute('aria-busy'), 'false');
    assert.equal(await countPlaceholders(), 0);
    await assertFocused(refresh);
  },

  'Skeleton Workbench keeps pinned and frozen previews flat with live replay elsewhere': async ({
    page,
    mount,
  }) => {
    await mount('native');
    const route = { item: 'skeleton', tab: 'states', block: 'motion', dir: 'rtl' };
    await openWorkbench(page, route);
    const motion = page.locator('[data-wb-block="motion"]');
    const tiles = motion.locator('figure');
    const live = tiles.nth(0).locator(decoration).first();
    const pinned = tiles.nth(1).locator(decoration).first();
    const readSweep = (node) => {
      const style = getComputedStyle(node, '::after');
      const position = new DOMMatrix(style.transform).m41;
      return {
        name: style.animationName,
        duration: style.animationDuration,
        outside:
          parseFloat(style.width) === 0 || Math.abs(position) >= node.getBoundingClientRect().width,
      };
    };
    assert.equal((await live.evaluate(readSweep)).duration, '2.2s');
    assert.deepEqual(await pinned.evaluate(readSweep), {
      name: 'none',
      duration: '0s',
      outside: true,
    });
    await openWorkbench(page, { ...route, freeze: '1' });
    assert.equal((await live.evaluate(readSweep)).duration, '0s');
    assert.equal((await live.evaluate(readSweep)).outside, true);
  },

  'Skeleton Workbench replays the Card loading case without changing its height': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await mount('native');
    const waitForSweep = () =>
      page.waitForFunction(() => {
        const node = document.querySelector('.card-example-skeleton-title');
        return node && parseFloat(getComputedStyle(node, '::after').width) > 0;
      });
    for (const vp of ['360', '1280']) {
      await openWorkbench(page, {
        item: 'card',
        tab: 'states',
        block: 'availability',
        scale: '120',
        dir: 'rtl',
        vp,
      });
      const example = page.locator('[data-wb-block="availability"]');
      const card = example.locator('.card-example-loading');
      const loaded = example.getByRole('checkbox', { name: 'Show loaded content', exact: true });
      const placeholder = card.locator('.card-example-skeleton-title');
      const loadingHeight = (await getBox(card)).height;
      await waitForSweep();
      await card.evaluate(async (node) => {
        for (const animation of node.getAnimations({ subtree: true })) {
          animation.finish();
          await animation.finished;
        }
      });
      await loaded.check();
      assert.equal(await card.getAttribute('aria-busy'), 'false');
      assert.equal(await placeholder.count(), 0);
      await assertBox(card, { height: loadingHeight });
      await loaded.uncheck();
      assert.equal(await card.getAttribute('aria-busy'), 'true');
      await placeholder.waitFor();
      await waitForSweep();
      await assertBox(card, { height: loadingHeight });
    }
  },
};

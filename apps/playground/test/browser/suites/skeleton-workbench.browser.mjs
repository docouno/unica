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
  'Skeleton Workbench resolves public dimensions against the slot and preserves the hidden subject':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await mount('native');
      await openWorkbench(page, { item: 'skeleton', tab: 'playground', bounds: '1', vp: '768' });
      await page.getByRole('heading', { name: 'Skeleton', exact: true }).waitFor();
      const subject = page.locator('[data-wb-subject]');
      const code = page.getByRole('region', { name: 'JSX' }).locator('pre');
      const width = page.getByRole('textbox', { name: /^width\b/iu });
      const height = page.getByRole('textbox', { name: /^height\b/iu });
      const shape = page.getByRole('combobox', { name: /^shape\b/iu });
      await shape.selectOption('circle');
      await width.fill('32');
      await height.fill('24');
      await assertBox(subject, { width: 32, height: 24 });
      assert.equal(await subject.evaluate((node) => node.tagName), 'SPAN');
      const pixelCode = await code.innerText();
      assert.match(
        pixelCode,
        /shape=(?:"circle"|\{['"]circle['"]\})\s+width=\{32\}\s+height=\{24\}/u,
      );
      assert.doesNotMatch(pixelCode, /<div\b/u);
      await page.locator('[data-wb-bounds-label]').first().waitFor();
      await width.fill('60%');
      assert.equal(await subject.evaluate((node) => node.style.inlineSize), '60%');
      assert.match(await code.innerText(), /width=(?:"60%"|\{['"]60%['"]\})/u);
      await shape.selectOption('rect');
      await height.fill('60%');
      const slot = await subject.evaluate((node) =>
        node.parentElement.getBoundingClientRect().toJSON(),
      );
      assert.equal(slot.height, 80);
      await assertBox(subject, { height: 48, width: slot.width * 0.6 }, { tolerance: 0.02 });
      assert.match(await code.innerText(), /<div\b[^>]*blockSize:\s*80\b[^>]*>\s*<Skeleton\b/u);
      const placeholder = await subject.elementHandle();
      const hidden = page.getByRole('checkbox', { name: /^hidden\b/iu });
      await hidden.check();
      await subject.waitFor({ state: 'hidden' });
      assert.equal(
        await subject.evaluate((node, original) => node === original, placeholder),
        true,
      );
      await hidden.uncheck();
      assert.equal(
        await subject.evaluate((node, original) => node === original, placeholder),
        true,
      );
      await assertBox(subject, { height: 48 });
      await placeholder.dispose();
    },

  'SkeletonText Workbench renders public line, width and pairwise examples': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await mount('native');
    await openWorkbench(page, {
      item: 'skeleton-text',
      tab: 'playground',
      surface: 'overlay',
      vp: '360',
      scale: '120',
      dir: 'rtl',
    });
    const subject = page.locator('[data-wb-subject]');
    const code = page.getByRole('region', { name: 'JSX' }).locator('pre');
    const width = page.getByRole('textbox', { name: /^width\b/iu });
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

  'SkeletonText Workbench keeps the first size visible and the twenty-line sample reachable':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 720 });
      await mount('native');
      await openWorkbench(page, {
        item: 'skeleton-text',
        tab: 'states',
        mode: 'slice',
        slice: 'typography',
        surface: 'overlay',
        vp: '360',
        scale: '120',
        dir: 'rtl',
        freeze: '1',
      });
      const table = page.getByRole('table');
      const subjects = table.locator('[data-wb-subject]');
      const firstBar = subjects.first().locator(':scope > span > span').first();
      const bar = await getBox(firstBar);
      const start = await getBox(table);
      assert.ok(bar.width > 0 && bar.height > 0);
      assert.ok(bar.y - start.y < page.viewportSize().height / 2, 'First size below the fold');
      assert.deepEqual(
        await subjects.evaluateAll((samples) => samples.map((sample) => sample.childElementCount)),
        Array(13).fill(3),
      );

      await page.getByRole('combobox', { name: 'Slice', exact: true }).selectOption('lines');
      assert.deepEqual(
        await subjects.evaluateAll((samples) => samples.map((sample) => sample.childElementCount)),
        [1, 3, 20],
      );
      const lastBar = subjects.last().locator(':scope > span:last-child > span');
      await lastBar.scrollIntoViewIfNeeded();
      const end = await getBox(lastBar);
      assert.ok(end.y >= 0 && end.y + end.height <= page.viewportSize().height);
    },

  'Skeleton Workbench restricts image-only busy state and preserves media layout and focus on reveal':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await mount('native');
      await openWorkbench(page, { item: 'skeleton', tab: 'states', block: 'media' });
      const mediaCase = page.locator('[data-wb-block="media"]');
      const controls = mediaCase.getByRole('group', { name: /controls$/u });
      const figures = mediaCase.locator('figure');
      const dynamic = figures.first();
      const caption = dynamic.locator('figcaption');
      const ready = mediaCase.getByRole('figure', { name: 'Ready reference' });
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
      assert.equal(await mediaCase.getByRole('status').count(), 0);
      assert.equal(await caption.innerText(), 'Waiting for content');
      assert.equal(await caption.evaluate((node) => node.closest('[aria-busy="true"]')), null);
      assert.equal(await frame.getAttribute('aria-busy'), 'true');
      assert.equal(await dynamic.getByRole('heading', { name: 'Field notes' }).count(), 0);
      assert.equal(await ready.getByRole('heading', { name: 'Field notes' }).count(), 1);

      await controls.getByRole('checkbox', { name: 'Image only', exact: true }).check();
      assert.equal(await caption.innerText(), 'Waiting for image');
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

      const loaded = controls.getByRole('checkbox', { name: 'Show loaded content', exact: true });
      await loaded.press('Space');
      await oldShape.waitFor({ state: 'detached' });
      assert.equal(await slot.getByRole('img').count(), 1);
      assert.equal(await dynamic.locator('[aria-busy="true"]').count(), 0);
      assert.equal(await caption.innerText(), 'Content arrived');
      await assertFocused(loaded);
      await assertBox(slot, slotBox, { tolerance: 0.1 });
      await assertBox(frame, frameBefore, { tolerance: 0.1 });

      await openWorkbench(page, { item: 'skeleton', tab: 'compositions', block: 'typography' });
      const usage = page.locator('[data-wb-block="typography"]');
      const code = await usage.locator('pre:not([data-wb-pending])').innerText();
      assert.match(code, /<article\b[^>]*aria-busy=[\s\S]+<\/article>\s*<Text\b[^>]*role=/u);
      assert.match(code, /--text-size-body-m-lh/u);
      const waiting = usage.locator('article');
      const message = usage.getByRole('status');
      const space = await getBox(waiting);
      assert.equal(await waiting.getAttribute('aria-busy'), 'true');
      assert.equal(await waiting.locator(decoration).count(), 2);
      assert.equal(await message.innerText(), 'Loading the summary…');
      assert.equal(await message.evaluate((node) => node.closest('[aria-busy="true"]')), null);
      const showSummary = usage
        .getByRole('group', { name: /controls$/u })
        .getByRole('checkbox', { name: 'Show loaded summary', exact: true });
      assert.equal(await showSummary.isChecked(), false);
      await showSummary.press('Space');
      assert.equal(await showSummary.isChecked(), true);
      assert.equal(await waiting.getAttribute('aria-busy'), 'false');
      assert.equal(await waiting.locator(decoration).count(), 0);
      assert.equal(await message.innerText(), 'Summary loaded.');
      await assertBox(waiting, space, { tolerance: 0.1 });
      await assertFocused(showSummary);
      await showSummary.press('Space');
      assert.equal(await waiting.getAttribute('aria-busy'), 'true');
      assert.equal(await message.innerText(), 'Loading the summary…');
      await assertFocused(showSummary);
      await assertBox(waiting, space, { tolerance: 0.1 });
    },

  'Skeleton Workbench interrupts shared loads and keeps local retries and refreshes independent':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await mount('native');
      const route = { item: 'skeleton', tab: 'states', block: 'lifecycle' };
      await openWorkbench(page, { ...route, family: 'all', scheme: 'both' });
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
      await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));

      const lifecycle = page.locator('[data-wb-block="lifecycle"]');
      const toolbar = lifecycle.getByRole('group', { name: /controls$/u });
      const selector = toolbar.getByRole('combobox', { name: 'Preview state', exact: true });
      const replay = toolbar.getByRole('button', { name: 'Replay load', exact: true });
      const fast = toolbar.getByRole('button', { name: 'Fast response', exact: true });
      const boards = lifecycle.locator('.wb-artboard');
      const regions = lifecycle.getByRole('region', { name: 'Recent documents', exact: true });
      const first = boards.first();
      const region = regions.first();
      const announcements = boards.locator('[role="status"][aria-live="polite"]');
      const refresh = first.getByRole('button', { name: 'Refresh', exact: true });
      const retry = first.getByRole('button', { name: 'Try again', exact: true });
      const assertPhases = async (shared, local = shared) => {
        assert.equal(await selector.inputValue(), shared);
        assert.deepEqual(
          await regions.evaluateAll((nodes) => nodes.map((node) => node.dataset.loadState)),
          [local, ...Array(5).fill(shared)],
        );
      };

      await replay.press('Enter');
      await assertPhases('delay');
      await page.clock.runFor(180);
      await fast.press('Enter');
      await page.clock.runFor(55);
      await assertPhases('delay');
      assert.equal(await regions.locator(decoration).count(), 0);
      await page.clock.runFor(65);
      await assertPhases('ready');
      await page.clock.runFor(1050);
      await assertPhases('ready');
      await assertFocused(fast);
      assert.equal(await announcements.count(), 0);

      const content = region.getByText('Design principles', { exact: true });
      const original = await content.elementHandle();
      await refresh.press('Enter');
      await assertPhases('ready', 'refresh');
      assert.equal(await announcements.count(), 1);
      assert.equal(await regions.locator(decoration).count(), 0);
      assert.equal(await content.evaluate((node, previous) => node === previous, original), true);
      const status = first.getByRole('status');
      assert.equal(await status.evaluate((node) => node.closest('[aria-busy="true"]')), null);
      await page.clock.runFor(1120);
      await assertPhases('ready');
      assert.equal(await content.evaluate((node, previous) => node === previous, original), true);
      await original.dispose();
      await assertFocused(refresh);

      await selector.selectOption('empty');
      await assertPhases('empty');
      assert.equal(await regions.locator(decoration).count(), 0);
      await selector.selectOption('error');
      await assertPhases('error');
      assert.equal(await regions.locator(decoration).count(), 0);
      await retry.press('Enter');
      await assertPhases('error', 'delay');
      await page.clock.runFor(220);
      await assertPhases('error', 'initial');
      assert.equal(await regions.locator(decoration).count(), 9);
      await page.clock.runFor(930);
      await assertPhases('error', 'partial');
      assert.equal(await regions.locator(decoration).count(), 6);
      assert.equal(await regions.getByText('Design principles', { exact: true }).count(), 1);
      await page.clock.runFor(1150);
      await assertPhases('error', 'ready');
      assert.equal(await region.getAttribute('aria-busy'), 'false');
      assert.equal(await regions.locator(decoration).count(), 0);
      assert.equal(await status.innerText(), '3 documents loaded.');
      assert.equal(await announcements.count(), 1);
      await assertFocused(refresh);

      await replay.press('Enter');
      await page.clock.runFor(220);
      await assertPhases('initial');
      await selector.focus();
      await selector.selectOption('empty');
      await page.clock.runFor(2210);
      await assertPhases('empty');
      await assertFocused(selector);
      assert.equal(await announcements.count(), 0);

      await replay.press('Enter');
      await page.clock.runFor(1120);
      await assertPhases('partial');
      await lifecycle
        .getByRole('button', { name: 'Expand Frost · Light', exact: true })
        .press('Enter');
      assert.equal(await boards.count(), 1);
      assert.equal(await region.getAttribute('data-load-state'), 'partial');
      await page.clock.runFor(1100);
      assert.equal(await selector.inputValue(), 'ready');
      assert.equal(await region.getAttribute('data-load-state'), 'ready');
      await refresh.press('Enter');
      assert.equal(await selector.inputValue(), 'refresh');
      await assertFocused(refresh);
      await lifecycle
        .getByRole('button', { name: 'Collapse Frost · Light', exact: true })
        .press('Enter');
      await assertPhases('refresh');
      await page.clock.runFor(1120);
      await assertPhases('ready');
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
    await live.scrollIntoViewIfNeeded();
    const waitForLiveSweep = async () => {
      const shape = await live.elementHandle();
      await page.waitForFunction(
        (node) =>
          parseFloat(getComputedStyle(node, '::after').width) > 0 &&
          node
            .getAnimations({ subtree: true })
            .some((animation) => animation.playState === 'running'),
        shape,
      );
      await shape.dispose();
    };
    await waitForLiveSweep();
    const oldShape = await live.elementHandle();
    const staticShape = await pinned.elementHandle();
    await live.evaluate(async (node) => {
      for (const animation of node.getAnimations({ subtree: true })) {
        animation.finish();
        await animation.finished;
      }
    });
    const replay = motion.getByRole('button', { name: 'Replay motion', exact: true });
    await replay.press('Enter');
    await waitForLiveSweep();
    assert.equal(await oldShape.evaluate((node) => node.isConnected), false);
    assert.equal(await pinned.evaluate((node, previous) => node === previous, staticShape), true);
    await oldShape.dispose();
    await staticShape.dispose();
    await assertFocused(replay);
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

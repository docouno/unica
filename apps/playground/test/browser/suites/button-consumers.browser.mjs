import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox, pressKeys } from '../helpers.mjs';

async function open(page, route) {
  await page.evaluate(
    (params) => {
      const url = new URL(window.location.href);
      url.search = new URLSearchParams({ fixture: 'button-consumers', ...params }).toString();
      history.pushState(null, '', url);
      dispatchEvent(new PopStateEvent('popstate'));
    },
    { family: 'soft', scheme: 'dark', ...route },
  );
  return page.locator('.wb-artboard');
}

async function openScaledTabs(page, block, dir) {
  await page.setViewportSize({ width: 1390, height: 950 });
  const url = new URL('/', page.url());
  url.search = new URLSearchParams({
    item: 'tabs',
    tab: 'states',
    block,
    dir,
    family: 'all',
    scheme: 'both',
    vp: '1440',
    scale: '120',
    surface: 'base',
    raw: '0',
    freeze: '1',
  });
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  const boards = page.locator(`[data-wb-block="${block}"] .wb-artboard[dir="${dir}"]`);
  await boards.first().waitFor({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
  return boards;
}

function receivesPointer(node) {
  const rect = node.getBoundingClientRect();
  return node.contains(
    document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
  );
}

async function platePixel(locator) {
  const screenshot = await locator.screenshot({ animations: 'disabled', scale: 'css' });
  return locator.evaluate(async (node, png) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = node.ownerDocument.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const pixels = canvas.getContext('2d');
    pixels.drawImage(image, 0, 0);
    return [...pixels.getImageData(7, 5, 1, 1).data].slice(0, 3);
  }, screenshot.toString('base64'));
}

function assertSamePaint(actual, expected) {
  assert.ok(
    actual.every((channel, index) => Math.abs(channel - expected[index]) <= 1),
    `expected ${actual} to match ${expected}`,
  );
}

export default {
  'Empty recovery uses native links for both routes and a button for Reload': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('button-consumers');
    const board = await open(page, { item: 'empty', tab: 'compositions', block: 'routes' });
    const destinations = board.getByRole('link', { name: 'Back to workspace', exact: true });
    const href = '/?item=02-workspace-overview';
    await destinations.last().waitFor();
    assert.equal(await destinations.count(), 2);
    assert.equal(await board.getByRole('button', { name: 'Back to workspace' }).count(), 0);
    assert.equal(await board.getByRole('button', { name: 'Reload page', exact: true }).count(), 1);
    for (const destination of await destinations.all()) {
      assert.equal(await destination.getAttribute('href'), href);
      const [popup] = await Promise.all([
        page.context().waitForEvent('page'),
        destination.click({ modifiers: ['Control'] }),
      ]);
      await popup.waitForURL((url) => url.pathname + url.search === href);
      await popup
        .getByRole('heading', { name: 'Platform Engineering', exact: true })
        .first()
        .waitFor({ timeout: 20_000 });
      await popup.close();
    }
    assert.match(page.url(), /item=empty/u);
    const code = await page.locator('[data-wb-block="routes"] pre > code').textContent();
    assert.equal((code.match(/<Button asChild/gu) ?? []).length, 2);
    assert.equal((code.match(/href=\{workspaceHref\}/gu) ?? []).length, 2);
    assert.ok(!code.includes(href), 'The catalog destination belongs to the live example');
    await board.getByRole('button', { name: 'Reload page' }).focus();
    await page.keyboard.press('Enter');
    await assertFocused(board.getByRole('heading', { name: 'Workspace updates', level: 1 }));
    assert.equal(await board.getByRole('heading', { name: 'Page not found', level: 1 }).count(), 1);
  },

  'FileListItem keeps compact fine-pointer actions and separates coarse targets in narrow rows':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await mount('button-consumers');
      const touch = await page.context().newCDPSession(page);
      for (const dir of ['ltr', 'rtl']) {
        const board = await open(page, {
          item: 'dropzone',
          tab: 'states',
          block: 'lifecycle',
          vp: 360,
          scale: 120,
          dir,
        });
        const list = board.getByRole('list', { name: 'Pinned file lifecycle states' });
        const retry = list.getByRole('button', { name: /Retry .*supporting-research[.]zip/ });
        const remove = list.getByRole('button', { name: /Remove .*supporting-research[.]zip/ });
        await list.evaluate((node) => {
          node.style.maxInlineSize = '340px';
        });

        for (const coarse of [false, true]) {
          await touch.send('Emulation.setTouchEmulationEnabled', {
            enabled: coarse,
            maxTouchPoints: 1,
          });
          await page.waitForFunction(
            (coarse) => matchMedia('(pointer: coarse)').matches === coarse,
            coarse,
          );
          assert.ok(await list.evaluate((node) => node.clientWidth <= 340));
          const retryBox = await getBox(retry);
          const removeBox = await getBox(remove);
          const size = coarse ? 44 : 30;
          assert.equal(retryBox.height, size);
          assert.equal(removeBox.height, size);
          assert.equal(removeBox.width, size);
          assert.ok(retryBox.width >= size);
          assert.ok(
            retryBox.y >= removeBox.y + removeBox.height,
            JSON.stringify({ retryBox, removeBox }),
          );
          assert.ok(dir === 'ltr' ? retryBox.x < removeBox.x : retryBox.x > removeBox.x);
        }
      }
      await touch.detach();
    },

  'Retry restores focus only when its own focused action disappears': async ({ page, mount }) => {
    await mount('button-consumers');
    const boards = await open(page, {
      item: 'dropzone',
      tab: 'states',
      block: 'live',
      family: 'frost',
      scheme: 'both',
    });
    const frame = page.locator('[data-wb-block="live"]');
    await frame.getByRole('button', { name: 'Add sample files' }).click();
    await frame.getByRole('button', { name: 'Fail transfer' }).click();
    const settle = () =>
      page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
    const peer = boards.nth(1).getByRole('button', { name: /Remove .*assets[.]zip/ });
    const retry = (board) => board.getByRole('button', { name: /Retry .*research-notes[.]md/ });
    await peer.focus();
    await retry(boards.first()).evaluate((button) => button.click());
    await retry(boards.first()).waitFor({ state: 'detached' });
    await settle();
    await assertFocused(peer);

    await retry(boards.nth(1)).press('Enter');
    await retry(boards.nth(1)).waitFor({ state: 'detached' });
    await settle();
    await assertFocused(
      boards.nth(1).getByRole('button', { name: /Remove .*research-notes[.]md/ }),
    );

    const pinned = await open(page, { item: 'dropzone', tab: 'states', block: 'lifecycle' });
    const sample = pinned.getByRole('button', { name: /Retry .*supporting-research[.]zip/ });
    await sample.press('Enter');
    await settle();
    await assertFocused(sample);
  },

  'Sign in submits once and the editor keeps its controlled Bold toggle': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('button-consumers');
    const auth = await open(page, { item: '01-sign-in' });
    const continueAction = auth.getByRole('button', { name: 'Continue to workspace' });
    await continueAction.evaluate((node) => {
      node.form.addEventListener('submit', (event) => {
        if (event.submitter === node) {
          node.dataset.submissions = String(Number(node.dataset.submissions ?? 0) + 1);
        }
      });
    });
    await continueAction.focus();
    await pressKeys(page, 'Enter');
    assert.equal(await continueAction.getAttribute('data-submissions'), '1');
    await auth.getByRole('status').filter({ hasText: 'Your sign-in details are ready' }).waitFor();

    const editor = await open(page, { item: '05-rich-editor' });
    const bold = editor.getByRole('button', { name: 'Bold', exact: true });
    await bold.focus();
    assert.equal(await bold.getAttribute('aria-pressed'), 'false');
    await pressKeys(page, 'Space');
    await assertFocused(bold);
    assert.equal(await bold.getAttribute('aria-pressed'), 'true');
    await pressKeys(page, 'Enter');
    assert.equal(await bold.getAttribute('aria-pressed'), 'false');
  },

  'Tabs mirrors the scroll glyph and keeps the selected edge clickable in both directions': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const glyphs = [];
    for (const dir of ['ltr', 'rtl']) {
      await mount('button-consumers');
      const board = await open(page, {
        item: 'tabs',
        tab: 'states',
        block: 'overflow',
        vp: 360,
        dir,
      });
      const tablist = board.getByRole('tablist', { name: 'Content · Workspace sections' });
      const arrow = tablist.locator('..').getByRole('button', { name: 'Scroll tabs forward' });
      const current = tablist.getByRole('tab', { selected: true });
      await current.scrollIntoViewIfNeeded();
      assert.ok(
        await current.evaluate((tab) => {
          const { left, right, top, height } = tab.getBoundingClientRect();
          const x = getComputedStyle(tab).direction === 'rtl' ? right - 4 : left + 4;
          return tab.contains(tab.ownerDocument.elementFromPoint(x, top + height / 2));
        }),
        `Selected tab must receive pointer input at its ${dir} inline start`,
      );
      const transform = await arrow.locator('svg path').first().getAttribute('transform');
      assert.equal(transform, dir === 'ltr' ? 'rotate(-90 128 128)' : 'rotate(90 128 128)');
      glyphs.push(await arrow.locator('svg path').first().getAttribute('d'));
      const reflection = await arrow.locator('svg').evaluate((svg) => {
        const { scale, transform } = getComputedStyle(svg);
        return [scale, transform];
      });
      assert.deepEqual(reflection, ['none', 'none']);
      await arrow.click();
      await page.waitForFunction(
        ({ node, dir }) => (dir === 'ltr' ? node.scrollLeft > 0 : node.scrollLeft < 0),
        { node: await tablist.elementHandle(), dir },
        { timeout: 5000 },
      );
    }
    assert.equal(glyphs[0], glyphs[1]);
  },

  'Zoomed Tabs keep the keyboard-selected label and its capped count in view': async ({
    page,
    mount,
  }) => {
    await mount('native', { reducedMotion: 'reduce' });
    for (const dir of ['ltr', 'rtl']) {
      const boards = await openScaledTabs(page, 'overflow', dir);
      const list = boards.first().getByRole('tablist', { name: 'Equal · Selected long label' });
      await list.scrollIntoViewIfNeeded();
      assert.ok(
        await list.evaluate((node) => node.getBoundingClientRect().width < node.clientWidth / 2),
      );
      await list.getByRole('tab', { name: 'Overview', exact: true }).press('Home');
      const next = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      await pressKeys(page, next, next, next);
      const review = list.getByRole('tab', { name: /104 pending reviews/u, selected: true });
      await assertFocused(review);
      for (const part of [
        review.locator('.unica-tabs-label'),
        review.getByText('99+', { exact: true }),
      ]) {
        assert.ok(
          await part.evaluate(receivesPointer),
          `The focused tab's label and count must be exposed in ${dir}`,
        );
      }
    }
  },

  'Zoomed Tabs expose the last tab at fractional scroll boundaries': async ({ page, mount }) => {
    await mount('native', { reducedMotion: 'reduce' });
    for (const dir of ['ltr', 'rtl']) {
      const boards = await openScaledTabs(page, 'anatomy', dir);
      for (const theme of ['frost-dark', 'pixel-dark']) {
        const board = boards.and(page.locator(`[data-theme="${theme}"]`));
        const list = board.getByRole('tablist', { name: 'Workspace sections' });
        const frame = list.locator('..');
        await list.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center' }));
        const width = await list.evaluate((node) => node.clientWidth);
        // Four adjacent layout widths span a screen pixel at this comparison scale.
        for (const trim of [0, 1, 2, 3]) {
          await frame.evaluate((node, width) => {
            node.style.inlineSize = width + 'px';
          }, width - trim);
          await list.getByRole('tab', { name: 'Overview', exact: true }).press('Home');
          await page.keyboard.press('End');
          await page.evaluate(
            () =>
              new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          );
          const settings = list.getByRole('tab', { name: 'Settings', selected: true });
          await assertFocused(settings);
          assert.ok(
            await settings.evaluate(receivesPointer),
            `The last ${theme} tab must be exposed at ${width - trim}px in ${dir}`,
          );
          assert.equal(await board.getByRole('button', { name: 'Scroll tabs forward' }).count(), 0);
        }
      }
    }
  },

  'Table inline picker and row menu keep their layout, focus and action ownership': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('button-consumers', { reducedMotion: 'reduce' });
    const board = await open(page, {
      item: 'table',
      tab: 'states',
      block: 'editors',
      family: 'frost',
    });
    const table = board.getByRole('table', { name: 'Route policies M', exact: true });
    const picker = table.getByRole('button', { name: 'Policy for queue', exact: true });
    const menu = table.getByRole('button', { name: 'Actions for queue', exact: true });
    await picker.waitFor();
    await page.evaluate(() => document.fonts.ready);

    for (const [density, expectedHeight] of [
      ['S', 25],
      ['M', 33],
      ['L', 41],
    ]) {
      const size = board.getByRole('table', { name: `Route policies ${density}`, exact: true });
      const fields = size.getByRole('button', { name: /^Policy for / });
      assert.deepEqual(
        await fields.evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().height),
        ),
        [expectedHeight, expectedHeight, expectedHeight],
      );
      assert.equal(
        await size.getByRole('button', { name: 'Policy for system' }).isDisabled(),
        true,
      );
      assert.equal(
        await size.getByRole('textbox', { name: 'Path for system' }).getAttribute('readonly'),
        '',
      );
    }

    for (const trigger of [picker, menu]) {
      await page.mouse.move(0, 0);
      const rest = await platePixel(trigger);
      await trigger.hover();
      const hover = await platePixel(trigger);
      assert.notDeepEqual(hover, rest);

      await page.mouse.move(0, 0);
      await trigger.focus();
      await pressKeys(page, 'Enter');
      await trigger.and(page.locator('[aria-expanded="true"]')).waitFor();
      const expanded = await platePixel(trigger);
      assert.notDeepEqual(expanded, rest);
      await trigger.hover();
      const expandedHover = await platePixel(trigger);
      if (trigger === picker) {
        assertSamePaint(expandedHover, expanded);
      } else {
        assert.notDeepEqual(expandedHover, rest);
      }
      await pressKeys(page, 'Escape');
      await trigger.and(page.locator('[aria-expanded="false"]')).waitFor();
      await assertFocused(trigger);
    }

    const before = await getBox(table);
    assert.equal(await picker.getAttribute('title'), 'Inherit');
    await picker.press('Enter');
    await table.getByRole('listbox').getByRole('option', { name: 'Allow', exact: true }).click();
    await assertFocused(picker);
    assert.equal(await picker.getAttribute('title'), 'Allow');
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    assert.equal((await getBox(table)).height, before.height);

    await menu.click();
    await table.getByRole('menuitem', { name: 'Restore defaults' }).click();
    assert.equal(await picker.getAttribute('title'), 'Inherit');
  },

  'Disclosure keeps its system contour and distinct inset focus in forced colors': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('button-consumers');
    await open(page, { item: 'collapsible', tab: 'states' });
    const available = page
      .locator('[data-wb-block="states"] .wb-artboard')
      .getByRole('button', { name: 'Delivery window', exact: true, expanded: false });
    const unavailable = page
      .locator('[data-wb-block="availability"] .wb-artboard')
      .getByRole('button', { name: 'Provider diagnostics', exact: true });
    assert.ok(await unavailable.isDisabled());
    const before = await getBox(available);
    const disabledBefore = await getBox(unavailable);
    await page.emulateMedia({ forcedColors: 'active' });
    await available.focus();

    async function paint(action, ink) {
      return action.evaluate((node, color) => {
        const probe = node.ownerDocument.createElement('span');
        probe.style.forcedColorAdjust = 'none';
        node.append(probe);
        const system = (name) => {
          probe.style.color = name;
          return getComputedStyle(probe).color;
        };
        const style = getComputedStyle(node);
        const result = {
          contour: [style.borderTopWidth, style.borderTopStyle, style.borderTopColor],
          focus: [style.outlineStyle, style.outlineWidth, style.outlineOffset, style.outlineColor],
          expected: [system(color), system('Highlight')],
        };
        probe.remove();
        return result;
      }, ink);
    }

    const enabledPaint = await paint(available, 'ButtonText');
    const disabledPaint = await paint(unavailable, 'GrayText');
    assert.deepEqual(enabledPaint.contour, ['1px', 'solid', enabledPaint.expected[0]]);
    assert.deepEqual(disabledPaint.contour, ['1px', 'solid', disabledPaint.expected[0]]);
    assert.deepEqual(enabledPaint.focus, ['solid', '2px', '-3px', enabledPaint.expected[1]]);
    assert.equal(disabledPaint.focus[0], 'none');
    await assertBox(available, { width: before.width, height: before.height });
    await assertBox(unavailable, { width: disabledBefore.width, height: disabledBefore.height });
  },
};

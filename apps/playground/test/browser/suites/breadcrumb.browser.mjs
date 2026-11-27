import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys, textContrast } from '../helpers.mjs';

const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];

function computed(locator, ...properties) {
  return locator.evaluate(
    (node, keys) => keys.map((key) => getComputedStyle(node).getPropertyValue(key)),
    properties,
  );
}

function colorIn(locator, color) {
  return locator.evaluate((node, colorValue) => {
    const probe = node.appendChild(document.createElement('span'));
    probe.style.color = colorValue;
    const paint = getComputedStyle(probe).color;
    probe.remove();
    return paint;
  }, color);
}

function openWorkbench(page, origin, params) {
  const url = new URL('/', origin);
  url.search = new URLSearchParams(params);
  return page.goto(url.href);
}

async function assertGeometry(page, target, direction) {
  const nav = page.getByRole('navigation', { name: 'Long trail' });
  await nav.waitFor();
  await page.evaluate(() => document.fonts.ready);
  const report = await nav.evaluate((root) => {
    const rect = (node) => node.getBoundingClientRect().toJSON();
    const list = root.querySelector('ol');
    const [home, ancestor, group, word, current] = list.children;
    const linkBoxes = [...list.querySelectorAll('a')].map(rect);
    const token = word.querySelector('a').firstChild;
    const range = document.createRange();
    range.selectNodeContents(token);
    const lines = [...range.getClientRects()].map((line) => line.toJSON());
    const segments = [...list.children].map((item) => {
      const label = item.lastElementChild;
      const separator = item.querySelector(':scope > [aria-hidden="true"]');
      return {
        item: rect(item),
        label: rect(label),
        separator: separator ? rect(separator) : null,
      };
    });
    return {
      list: rect(list),
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      linkBoxes,
      lines,
      segments,
      token: token.textContent,
      homeScale: getComputedStyle(home.querySelector('svg')).scale,
      caretScale: getComputedStyle(ancestor.querySelector('[aria-hidden="true"] svg')).scale,
      currentMarker: current.querySelector('a').getAttribute('aria-current'),
      groupText: group.textContent,
    };
  });
  assert.equal(report.viewport, 360);
  assert.equal(report.scrollWidth, 360);
  assert.ok(report.list.width <= 320);
  assert.ok(report.lines.length > 1);
  assert.equal(report.token, 'DatabaseReliabilityAndDisasterRecoveryRunbooks');
  assert.equal(report.currentMarker, 'page');
  assert.equal(report.groupText, 'Incident response');
  assert.equal(report.homeScale, 'none');
  assert.equal(report.caretScale, direction === 'rtl' ? '-1 1' : 'none');
  for (const line of report.lines) {
    assert.ok(line.left >= report.list.left - 1 && line.right <= report.list.right + 1);
  }
  for (const { item, label, separator } of report.segments) {
    assert.ok(item.left >= report.list.left && item.right <= report.list.right + 0.5);
    if (separator) {
      assert.equal(separator.top, label.top);
      assert.equal(separator.top, item.top);
      assert.ok(
        direction === 'rtl' ? separator.left >= label.right : separator.right <= label.left,
      );
    }
  }
  for (const [index, box] of report.linkBoxes.entries()) {
    assert.ok(box.width >= target && box.height >= target, JSON.stringify(box));
    for (const next of report.linkBoxes.slice(index + 1)) {
      assert.ok(
        next.left >= box.right || next.right <= box.left || next.top >= box.bottom,
        'Link targets must not overlap',
      );
    }
  }
  for (const link of await nav.getByRole('link').all()) {
    const hit = await link.evaluate((node) => {
      const { left, top, right, bottom } = node.getBoundingClientRect();
      const midX = (left + right) / 2;
      const midY = (top + bottom) / 2;
      return [
        [left + 1, midY],
        [right - 1, midY],
        [midX, top + 1],
        [midX, bottom - 1],
      ].every(([x, y]) => node.contains(document.elementFromPoint(x, y)));
    });
    assert.ok(hit, `Expected all four edges to hit ${await link.getAttribute('data-testid')}`);
  }
}

export default {
  'Breadcrumb ships its Usage and current-location examples in the Workbench': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await openWorkbench(page, origin, {
      item: 'breadcrumb',
      tab: 'usage',
      family: 'frost',
      scheme: 'dark',
    });
    await page
      .getByRole('heading', { name: 'Links and router composition' })
      .waitFor({ timeout: 20_000 });
    await openWorkbench(page, origin, {
      item: 'breadcrumb',
      tab: 'states',
      slice: 'current',
      family: 'frost',
      scheme: 'dark',
      bounds: '1',
      raw: '1',
      freeze: '1',
    });
    await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 15_000 });
    const currentStates = page.locator('.wb-story-frame[data-wb-slice="current"]');
    const disabled = currentStates.getByRole('link', { name: 'Guide', disabled: true }).first();
    await disabled.waitFor();
    assert.equal(await disabled.getAttribute('aria-current'), 'page');
  },

  'Breadcrumb navigates Folio and fits the narrow editor header': async ({ page, origin }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await openWorkbench(page, origin, {
      item: '04-document-reader',
      family: 'soft',
      scheme: 'dark',
      vp: '1280',
      raw: '1',
    });
    const runbooks = page
      .getByRole('navigation', { name: 'Breadcrumb', exact: true })
      .getByRole('link', { name: 'Runbooks', exact: true });
    await runbooks.click({ timeout: 15_000 });
    await page.waitForURL((url) => url.searchParams.get('item') === '03-document-collection');
    const collectionTrail = page.getByRole('navigation', { name: 'Breadcrumb', exact: true });
    assert.equal(await collectionTrail.locator('[aria-current="page"]').textContent(), 'Runbooks');

    await openWorkbench(page, origin, {
      item: '05-rich-editor',
      family: 'pixel',
      scheme: 'light',
      vp: '360',
      scale: '120',
      dir: 'rtl',
      raw: '1',
    });
    const editorTrail = page.getByRole('navigation', { name: 'Breadcrumb', exact: true });
    assert.equal(
      await editorTrail.locator('[aria-current="page"]').textContent(),
      'ADR-014 Traffic Draining',
    );
    assert.ok(
      await editorTrail.getByRole('link', { name: 'Platform Eng', exact: true }).isVisible(),
    );
  },

  'Breadcrumb keeps an ordered landmark and native link activation inside forms': async ({
    page,
    mount,
    watchPage,
  }) => {
    await mount('breadcrumb');
    const trail = page.getByRole('navigation', { name: 'Document route' });
    assert.equal(await trail.locator('ol > li').count(), 4);
    assert.equal(await trail.locator('[aria-current="page"]').textContent(), 'Guide');
    const snapshot = await trail.ariaSnapshot();
    assert.match(snapshot, /listitem:[\s\S]*link "Workspace"/u);
    assert.match(snapshot, /link "Archive" \[disabled\]/u);
    assert.doesNotMatch(snapshot, /listitem: \/|text: "\/"/u);

    const native = page.getByTestId('native');
    await page.getByTestId('start').focus();
    await pressKeys(page, 'Tab');
    await assertFocused(native);
    await pressKeys(page, 'Tab');
    await assertFocused(page.getByTestId('end'));
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(native);
    await pressKeys(page, 'Space');
    await page.waitForFunction(() => scrollY > 0);
    assert.equal(new URL(page.url()).hash, '');
    await pressKeys(page, 'Enter');
    await page.waitForURL((url) => url.hash === '#destination');
    await assertFocused(page.locator('#destination'));
    assert.equal(await page.getByTestId('submits').textContent(), '0');
    assert.deepEqual(await page.locator('form').evaluate((form) => [...new FormData(form)]), [
      ['entry', 'keep'],
    ]);
    await page.goBack();
    const context = page.context();
    for (const options of [{ modifiers: ['Control'] }, { button: 'middle' }]) {
      const [tab] = await Promise.all([context.waitForEvent('page'), native.click(options)]);
      watchPage(tab);
      await tab.waitForURL((url) => url.hash === '#destination');
      assert.equal(new URL(page.url()).hash, '');
      await tab.close();
    }

    const home = page.getByRole('link', { name: 'Home', exact: true });
    assert.equal(await home.locator('svg').count(), 1);
    assert.equal(await home.getAttribute('aria-describedby'), 'external-note');
    assert.equal(await home.getAttribute('rel'), 'next noopener noreferrer');
    const [popup] = await Promise.all([page.waitForEvent('popup'), home.click()]);
    watchPage(popup);
    await popup.waitForURL((url) => url.hash === '#destination');
    assert.equal(await popup.evaluate(() => window.opener), null);
    await popup.close();
    const download = page.getByRole('link', { name: 'Download guide' });
    assert.equal(await download.getAttribute('rel'), 'license noopener noreferrer');
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    assert.equal(file.suggestedFilename(), 'guide.html');
    assert.equal(await file.failure(), null);
  },

  'Breadcrumb preserves current meaning and suppresses disabled router activation and mounting':
    async ({ page, mount }) => {
      await mount('breadcrumb');
      const route = page.getByRole('link', { name: 'Routed guide' });
      const events = page.getByTestId('events');
      const mounts = page.getByTestId('mounts');
      const toggle = page.getByRole('button', { name: 'Toggle availability' });
      const read = page.getByRole('button', { name: 'Read refs' });
      const assertRefs = async (value) => {
        await read.click();
        assert.equal(await page.getByTestId('refs').textContent(), value);
      };
      await assertRefs('router');
      await route.click();
      assert.equal(await events.textContent(), 'pointer,child');
      assert.equal(new URL(page.url()).hash, '');
      assert.deepEqual(await computed(route, 'text-decoration-line', 'font-weight'), [
        'underline',
        '600',
      ]);

      await toggle.click();
      await assertRefs('fallback');
      assert.equal(await route.getAttribute('aria-current'), 'page');
      assert.equal(await route.getAttribute('aria-disabled'), 'true');
      assert.equal(await route.getAttribute('aria-describedby'), 'availability');
      assert.equal(await route.getAttribute('href'), null);
      assert.equal(await route.locator('span[aria-busy]').count(), 0);
      const box = await getBox(route);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      assert.equal(await events.textContent(), 'pointer,child');
      assert.equal(await mounts.textContent(), '1');
      assert.deepEqual(await computed(route, 'text-decoration-line', 'font-weight'), [
        'none',
        '600',
      ]);
      const disabled = page.getByRole('link', { name: 'Archive' });
      assert.deepEqual(await computed(route, 'color'), await computed(disabled, 'color'));
      assert.equal(
        await page
          .getByRole('link', { name: 'Ordinary unavailable link' })
          .getAttribute('aria-current'),
        null,
      );

      await page.emulateMedia({ forcedColors: 'active' });
      assert.deepEqual(await computed(route, 'color'), [await colorIn(route, 'GrayText')]);
      await toggle.click();
      await assertRefs('router');
      assert.equal(await mounts.textContent(), '2');
      assert.deepEqual(await computed(route, 'color'), [await colorIn(route, 'LinkText')]);
      await page.getByRole('button', { name: 'Toggle cancellation' }).click();
      await route.focus();
      await pressKeys(page, 'Enter');
      await page.waitForURL((url) => url.hash === '#destination');
      assert.equal(await events.textContent(), 'pointer,child,key,child,outer');
      await page.getByRole('button', { name: 'Remove route' }).click();
      await assertRefs('released');
      assert.equal(await page.getByRole('navigation', { name: 'Guide permalink' }).count(), 0);
    },

  'Breadcrumb wraps the complete trail with fine and coarse hit areas in both directions': async ({
    page,
    mount,
    watchPage,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const direction of ['ltr', 'rtl']) {
      await mount('breadcrumb-geometry', { theme: 'frost-dark', textScale: 120, direction });
      await assertGeometry(page, 24, direction);
      await page.getByTestId('geometry-home').focus();
      await pressKeys(page, 'Tab');
      const ancestor = page.getByTestId('geometry-ancestor');
      await assertFocused(ancestor);
      assert.deepEqual(await computed(ancestor, 'outline-width', 'outline-offset'), ['2px', '2px']);
      await pressKeys(page, 'Tab');
      await assertFocused(page.getByTestId('geometry-word'));
      await pressKeys(page, 'Tab');
      await assertFocused(page.getByTestId('geometry-current'));
    }

    const touch = await page
      .context()
      .browser()
      .newContext({
        viewport: { width: 360, height: 780 },
        hasTouch: true,
      });
    try {
      const mobile = watchPage(await touch.newPage());
      for (const direction of ['ltr', 'rtl']) {
        const url = new URL(page.url());
        url.searchParams.set('direction', direction);
        await mobile.goto(url.href);
        assert.equal(await mobile.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
        assert.equal(await mobile.evaluate(() => matchMedia('(hover: none)').matches), true);
        await assertGeometry(mobile, 48, direction);
        assert.deepEqual(
          await computed(mobile.getByTestId('geometry-ancestor'), 'text-decoration-line'),
          ['underline'],
        );
      }
    } finally {
      await touch.close();
    }
  },

  ...Object.fromEntries(
    themes.map((theme) => [
      `Breadcrumb preserves contrast and link feedback in ${theme}`,
      async ({ page, mount }) => {
        for (const surface of ['base', 'overlay']) {
          await mount('breadcrumb-geometry', { theme, surface });
          const ancestor = page.getByTestId('geometry-ancestor');
          const current = page.getByTestId('geometry-current');
          const staticPage = page.getByTestId('geometry-page');
          const stage = page.getByTestId('geometry-stage');
          const overlay = stage.locator('.unica-overlay-surface');
          const painted = surface === 'overlay' ? overlay : stage;
          const background = surface === 'overlay' ? '--bg-overlay' : '--bg-canvas';
          assert.equal(
            await stage.locator('[data-unica-underlay]').count(),
            surface === 'overlay' ? 1 : 0,
          );
          assert.deepEqual(await computed(painted, 'background-color'), [
            await colorIn(painted, `var(${background})`),
          ]);
          await page.evaluate(() => document.fonts.ready);
          await page.mouse.move(0, 0);
          assert.deepEqual(await computed(ancestor, 'text-decoration-line'), ['none']);
          assert.deepEqual(
            await computed(
              current,
              'text-decoration-line',
              'text-decoration-thickness',
              'font-weight',
            ),
            ['underline', '1px', '600'],
          );
          assert.deepEqual(await computed(ancestor, 'color'), [
            await colorIn(ancestor, 'var(--fg-secondary)'),
          ]);
          for (const label of [ancestor, current, staticPage]) {
            const contrast = await textContrast(label);
            assert.ok(
              contrast >= 4.5,
              `${theme} ${surface} ${await label.textContent()}: ${contrast}`,
            );
          }
          const home = page.getByTestId('geometry-home');
          await home.focus();
          await pressKeys(page, 'Tab');
          await assertFocused(ancestor);
          assert.deepEqual(await computed(ancestor, 'text-decoration-line'), ['underline']);
          assert.deepEqual(await computed(ancestor, 'outline-color'), [
            await colorIn(ancestor, 'var(--focus-ring-color)'),
          ]);
          const [duration] = await computed(ancestor, 'transition-duration');
          assert.equal(duration === '0s, 0s', theme.startsWith('pixel'));
        }
      },
    ]),
  ),

  'Breadcrumb follows reduced motion and forced colors': async ({ page, mount }) => {
    await mount('breadcrumb-geometry', { theme: 'frost-dark', reducedMotion: 'reduce' });
    const ancestor = page.getByTestId('geometry-ancestor');
    assert.deepEqual(await computed(ancestor, 'transition-duration'), ['0s']);
    await ancestor.hover();
    assert.deepEqual(await computed(ancestor, 'color', 'text-decoration-line'), [
      await colorIn(ancestor, 'var(--fg-primary)'),
      'underline',
    ]);
    await page.mouse.down();
    assert.deepEqual(await computed(ancestor, 'color'), [
      await colorIn(ancestor, 'var(--accent-soft-fg)'),
    ]);
    await page.mouse.move(0, 0);
    await page.mouse.up();

    await mount('breadcrumb-geometry', { forcedColors: 'active' });
    await page.getByTestId('geometry-home').focus();
    await pressKeys(page, 'Tab');
    const staticPage = page.getByTestId('geometry-page');
    const unavailable = page.getByTestId('geometry-disabled');
    assert.deepEqual(await computed(ancestor, 'color', 'outline-color'), [
      await colorIn(ancestor, 'LinkText'),
      await colorIn(ancestor, 'Highlight'),
    ]);
    assert.deepEqual(await computed(staticPage, 'color'), [
      await colorIn(staticPage, 'CanvasText'),
    ]);
    assert.deepEqual(await computed(unavailable, 'color'), [
      await colorIn(unavailable, 'GrayText'),
    ]);
  },
};

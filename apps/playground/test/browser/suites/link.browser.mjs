import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys } from '../helpers.mjs';

const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];
const statuses = ['neutral', 'info', 'success', 'warning', 'danger'];
const modes = ['always', 'hover', 'none'];

async function computed(locator, ...properties) {
  return locator.evaluate((node, keys) => {
    const style = getComputedStyle(node);
    return keys.map((key) => style.getPropertyValue(key));
  }, properties);
}

async function colorIn(locator, color) {
  return locator.evaluate((node, value) => {
    const probe = document.createElement('span');
    probe.style.color = value;
    node.append(probe);
    const paint = getComputedStyle(probe).color;
    probe.remove();
    return paint;
  }, color);
}

async function accessibleLink(session, rootId, testId) {
  const { nodeId } = await session.send('DOM.querySelector', {
    nodeId: rootId,
    selector: `[data-testid="${testId}"]`,
  });
  const { nodes } = await session.send('Accessibility.getPartialAXTree', { nodeId });
  const { role, name, description } = nodes[0];
  assert.equal(role.value, 'link', testId);
  return [name.value, description?.value];
}

async function navigateTabs(page, link) {
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    if (await link.evaluate((element) => element === document.activeElement)) {
      return;
    }
  }
  assert.fail(`Tab did not reach ${link}`);
}

export default {
  'Link keeps native keyboard, history, form, and modified pointer navigation': async ({
    page,
    mount,
  }) => {
    await mount('link');
    const before = page.getByTestId('before-native');
    const native = page.getByTestId('native');
    const after = page.getByTestId('after-native');
    await before.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(native);
    await pressKeys(page, 'Tab');
    await assertFocused(after);
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(native);
    await pressKeys(page, 'Space');
    await page.waitForFunction(() => window.scrollY > 0);
    assert.equal(new URL(page.url()).hash, '');
    await pressKeys(page, 'Enter');
    assert.equal(new URL(page.url()).hash, '#target');
    await assertFocused(page.locator('#target'));
    assert.equal(await page.getByTestId('submits').textContent(), '0');
    assert.deepEqual(await page.locator('form').evaluate((form) => [...new FormData(form)]), [
      ['entry', 'keep'],
    ]);
    assert.equal(await page.getByTestId('unavailable').getAttribute('href'), null);
    await page.goBack();
    assert.equal(new URL(page.url()).hash, '');
    await page.goForward();
    assert.equal(new URL(page.url()).hash, '#target');
    await page.goBack();

    const context = page.context();
    for (const options of [{ modifiers: ['Control'] }, { button: 'middle' }]) {
      const [tab] = await Promise.all([context.waitForEvent('page'), native.click(options)]);
      await tab.waitForURL((url) => url.hash === '#target');
      assert.equal(new URL(page.url()).hash, '');
      await tab.close();
    }
  },

  'Link uses a real popup for new-tab navigation and keeps same-origin downloads native': async ({
    page,
    mount,
  }) => {
    await mount('link');
    const popupTrigger = page.getByTestId('popup');
    assert.equal(await popupTrigger.getAttribute('rel'), 'noopener noreferrer');
    const [popup] = await Promise.all([page.waitForEvent('popup'), popupTrigger.click()]);
    await popup.waitForURL((url) => url.hash === '#target');
    assert.equal(await popup.evaluate(() => window.opener), null);
    await popup.close();

    const download = page.getByTestId('download');
    assert.equal(await download.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(await download.getAttribute('aria-describedby'), null);
    assert.equal(await download.locator('svg').count(), 0);
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    assert.equal(file.suggestedFilename(), 'index.html');
    assert.equal(await file.failure(), null);
    assert.equal(page.context().pages().length, 1);

    const named = page.getByTestId('named-download');
    assert.equal(await named.locator('svg').count(), 1);
    assert.equal(await named.getAttribute('aria-describedby'), null);
    await named.focus();
    const [namedFile] = await Promise.all([
      page.waitForEvent('download'),
      pressKeys(page, 'Enter'),
    ]);
    assert.equal(namedFile.suggestedFilename(), 'unica-fixture.html');
    assert.equal(await namedFile.failure(), null);
    assert.equal(page.context().pages().length, 1);

    const unavailable = page.getByTestId('disabled-download');
    assert.equal(await unavailable.getAttribute('download'), null);
    assert.equal(await unavailable.getAttribute('target'), null);
    assert.equal(await unavailable.locator('svg').count(), 0);
    await unavailable.evaluate((anchor) => anchor.click());
    await unavailable.focus();
    await pressKeys(page, 'Enter');
    assert.equal(page.context().pages().length, 1);
    assert.equal(new URL(page.url()).hash, '');
  },

  'Link preserves the browser accessible name and live author description ahead of the notice':
    async ({ page, mount }) => {
      await mount('link');
      const session = await page.context().newCDPSession(page);
      const { root } = await session.send('DOM.getDocument');
      const a11y = (testId) => accessibleLink(session, root.nodeId, testId);
      assert.deepEqual(await a11y('referenced'), [
        'Annual report',
        'Quarterly results Se abre en una pestaña nueva',
      ]);
      assert.deepEqual(await a11y('named'), [
        'Named report',
        'Author description Opens in a new tab',
      ]);
      assert.deepEqual(await a11y('titled'), ['Report', 'PDF, 4 MB Opens in a new tab']);
      assert.deepEqual(await a11y('same-title-native'), ['Report', undefined]);
      assert.deepEqual(await a11y('same-title'), ['Report', 'Opens in a new tab']);
      assert.deepEqual(await a11y('explicit-same-title'), ['Report', 'Opens in a new tab']);
      assert.deepEqual(await a11y('explicit-different-text'), [
        'Report',
        'Report Opens in a new tab',
      ]);
      assert.deepEqual(await a11y('idref-same-title'), ['Annual report', 'Opens in a new tab']);
      assert.deepEqual(await a11y('image-same-title'), ['Report', 'Report Opens in a new tab']);
      assert.deepEqual(await a11y('broken-line-title'), [
        'Report summary',
        'Reportsummary Opens in a new tab',
      ]);
      assert.deepEqual(await a11y('title-name'), ['Title-only name', 'Opens in a new tab']);
      assert.deepEqual(await a11y('missing-description'), [
        'Report',
        'Tooltip fallback Opens in a new tab',
      ]);
      assert.deepEqual(await a11y('idref-name'), [
        'Annual report',
        'Named via IDREF Opens in a new tab',
      ]);
      assert.deepEqual(await a11y('disabled-name'), ['Future report', 'Not yet published']);
      assert.deepEqual(await a11y('same-tab-external'), ['External same tab', undefined]);
      await page.getByRole('button', { name: 'Update author text' }).click();
      assert.deepEqual(await a11y('referenced'), [
        'Annual report',
        'Annual results Se abre en una pestaña nueva',
      ]);
      await page.getByRole('button', { name: 'Toggle author reference' }).click();
      assert.deepEqual(await a11y('referenced'), [
        'Annual report',
        'Portable document Se abre en una pestaña nueva',
      ]);
      await page.getByRole('button', { name: 'Toggle author reference' }).click();
      assert.deepEqual(await a11y('referenced'), [
        'Annual report',
        'Annual results Se abre en una pestaña nueva',
      ]);
      assert.deepEqual(await a11y('image-name'), [
        'External report',
        'PDF, 4 MB Opens in a new tab',
      ]);
      assert.deepEqual(await a11y('decorative-name'), [
        'Title names destination',
        'Opens in a new tab',
      ]);
      assert.deepEqual(await a11y('live-name'), ['PDF coming soon', 'Opens in a new tab']);
      await page.getByRole('button', { name: 'Reveal report label' }).click();
      await page.getByRole('link', { name: 'Ready report' }).waitFor();
      assert.deepEqual(await a11y('live-name'), [
        'Ready report',
        'PDF coming soon Opens in a new tab',
      ]);
      await session.detach();
    },

  'Link delegates router events once and swaps to an addressless fallback with both refs attached':
    async ({ page, mount }) => {
      await mount('link');
      const sample = page.getByRole('region', { name: 'Router sample' });
      const route = sample.getByTestId('route');
      const cancel = sample.getByRole('combobox', { name: 'Cancel transition' });
      const calls = sample.getByTestId('calls');
      const clear = sample.getByRole('button', { name: 'Clear activity' });
      const toggle = sample.getByRole('checkbox', { name: 'Disable route' });
      const before = sample.getByTestId('before-route');
      assert.equal(await sample.getByTestId('refs').textContent(), '1');
      assert.equal(await sample.getByTestId('matched-ref').textContent(), 'route');
      assert.equal(await route.getAttribute('aria-disabled'), null);
      assert.equal(await route.getAttribute('rel'), 'license noopener noreferrer');

      for (const [mode, order] of [
        ['child', 'capture,child,ancestor'],
        ['outer', 'capture,child,outer,ancestor'],
        ['none', 'capture,child,outer,route,ancestor'],
      ]) {
        await cancel.selectOption(mode);
        await route.click();
        assert.equal(await calls.textContent(), order);
        assert.equal(new URL(page.url()).hash, mode === 'none' ? '#route' : '');
        await clear.click();
      }
      assert.equal(await route.getAttribute('aria-current'), 'page');
      assert.equal(await route.getAttribute('rel'), 'license noopener noreferrer');
      const description = await route.getAttribute('aria-describedby');
      assert.match(description, /^route-note \S+$/);

      await toggle.check();
      assert.equal(await sample.getByTestId('refs').textContent(), '1');
      assert.equal(await route.getAttribute('aria-describedby'), 'route-note');
      assert.equal(await route.getAttribute('aria-disabled'), 'true');
      for (const name of ['href', 'target', 'rel', 'aria-current', 'to', 'active']) {
        assert.equal(await route.getAttribute(name), null, name);
      }
      await before.focus();
      await pressKeys(page, 'Tab');
      await assertFocused(clear);
      await route.focus();
      await pressKeys(page, 'Enter');
      await route.click({ force: true });
      await route.click({ force: true, button: 'middle' });
      await route.click({ force: true, modifiers: ['Control'] });
      await route.evaluate((anchor) => anchor.click());
      assert.equal(await calls.textContent(), '');
      assert.equal(page.context().pages().length, 1);
      await toggle.uncheck();
      assert.equal(await route.getAttribute('href'), '#route');
      assert.equal(await route.getAttribute('aria-describedby'), description);
      assert.equal(await sample.getByTestId('refs').textContent(), '1');
      await route.click();
      assert.equal(await calls.textContent(), 'capture,child,outer,route,ancestor');
    },

  'Link preserves inline fragments, reading direction, and glyph metrics under text stress':
    async ({ page, mount }) => {
      for (const [index, theme] of themes.entries()) {
        const direction = index % 2 === 0 ? 'rtl' : 'ltr';
        const width = [360, 768, 1280, 1440][index % 4];
        await page.setViewportSize({ width, height: 700 });
        await mount('link', { direction, textScale: 120, theme, reducedMotion: 'reduce' });
        const anchor = page.getByTestId('wrapped');
        const [display, size, line, weight, italics, tracking, transition] = await computed(
          anchor,
          'display',
          'font-size',
          'line-height',
          'font-weight',
          'font-style',
          'letter-spacing',
          'transition-duration',
        );
        assert.equal(display, 'inline');
        assert.deepEqual(
          [size, weight, italics, tracking, transition],
          ['24px', '600', 'italic', '0.15px', '0s'],
        );
        assert.ok(Math.abs(parseFloat(line) - 38.4) < 0.02);
        const start = anchor.locator('svg').first();
        const end = anchor.locator('svg').last();
        const startBox = await getBox(start);
        const endBox = await getBox(end);
        const first = await getBox(page.getByTestId('first-word'));
        const last = await page.getByTestId('last-word').evaluate((word) => {
          const walker = document.createTreeWalker(word, NodeFilter.SHOW_TEXT);
          let text;
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            text = node;
          }
          const range = document.createRange();
          range.setStart(text, text.length - 1);
          range.setEnd(text, text.length);
          const { x, y } = range.getBoundingClientRect();
          return { x, y };
        });
        assert.equal(startBox.width, 24);
        assert.equal(endBox.width, 24);
        assert.ok(
          Math.abs(startBox.y - first.y) < 12,
          `${theme} ${width} ${direction}: leading glyph wraps`,
        );
        assert.ok(
          Math.abs(endBox.y - last.y) < 12,
          `${theme} ${width} ${direction}: external glyph wraps`,
        );
        assert.ok(
          direction === 'ltr'
            ? startBox.x < first.x && endBox.x > last.x
            : startBox.x > first.x && endBox.x < last.x,
        );
        assert.equal(await end.evaluate((svg) => getComputedStyle(svg).scale), 'none');
        assert.equal(
          await end.evaluate((svg) => getComputedStyle(svg).fill),
          (await computed(anchor, 'color'))[0],
        );
        assert.ok(await anchor.evaluate((node) => node.getClientRects().length > 1));
        for (const id of [
          'long-url',
          'spaced-url',
          'plain-url',
          'relative-url',
          'mail-address',
          'ordinary-wrap',
          'whitespace-node',
          'empty-fragment',
          'hidden-node',
          'numeric-label',
        ]) {
          const boxes = await page.getByTestId(id).evaluate((paragraph) => {
            const link = paragraph.querySelector('a');
            const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
            let text;
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
              if (
                node.textContent.trim() &&
                !node.parentElement.closest('[hidden], [aria-hidden="true"]')
              ) {
                text = node;
              }
            }
            const tail = document.createRange();
            const end = text.textContent.trimEnd().length;
            tail.setStart(text, end - 1);
            tail.setEnd(text, end);
            const mark = paragraph.querySelector('svg').getBoundingClientRect();
            return {
              y: tail.getBoundingClientRect().top,
              markY: mark.top,
              overflow: paragraph.scrollWidth > paragraph.clientWidth,
            };
          });
          assert.equal(boxes.overflow, false, id);
          assert.ok(
            Math.abs(boxes.y - boxes.markY) < 16,
            `${id} ${direction}: external mark is orphaned`,
          );
        }
        const ordinary = page.getByTestId('whole-word');
        const word = ordinary.locator('a > span').first();
        assert.equal(await word.evaluate((node) => node.getClientRects().length), 1);
        assert.ok(
          Math.abs((await getBox(word)).y - (await getBox(ordinary.locator('svg'))).y) < 12,
          `${theme} ${direction}: whole word and glyph should move together`,
        );
        const long = page.getByTestId('whitespace-node');
        await long.evaluate((node) => {
          node.style.inlineSize = '800px';
        });
        await long.locator('a:not([data-unica-link-wrap-terminal])').waitFor();
        await long.evaluate((node) => {
          node.style.inlineSize = '157px';
        });
        await long.locator('a[data-unica-link-wrap-terminal]').waitFor();
        assert.deepEqual(await computed(anchor, 'word-break'), ['normal']);
        assert.notEqual((await computed(page.getByTestId('caption'), 'font-size'))[0], size);
        assert.equal(
          (await getBox(page.getByTestId('no-glyph'))).width,
          (await getBox(page.getByTestId('plain'))).width,
        );
        assert.equal(await page.getByTestId('pinned-glyph').locator('svg').count(), 1);
      }
      const fixed = page.getByTestId('fixed-line');
      const glyphButton = page.getByRole('button', { name: 'Toggle trailing glyph' });
      const widthAndHeight = await fixed.evaluate((node) => [node.clientWidth, node.clientHeight]);
      await glyphButton.click();
      await fixed.locator('a[data-unica-link-wrap-terminal] > span > svg').waitFor();
      assert.deepEqual(
        await fixed.evaluate((node) => [node.clientWidth, node.clientHeight]),
        widthAndHeight,
      );
      await fixed.evaluate((node) => {
        node.style.letterSpacing = '-2px';
      });
      await fixed.locator('a:not([data-unica-link-wrap-terminal]) > span > svg').waitFor();
      await fixed.evaluate((node) => {
        node.style.letterSpacing = '0px';
      });
      await fixed.locator('a[data-unica-link-wrap-terminal] > span > svg').waitFor();
      await fixed.evaluate((node) => {
        node.style.removeProperty('letter-spacing');
      });
      const context = page.getByTestId('fixed-line-context');
      await context.evaluate((node) => {
        node.style.letterSpacing = '-2px';
      });
      await fixed.locator('a:not([data-unica-link-wrap-terminal]) > span > svg').waitFor();
      await context.evaluate((node) => {
        node.style.letterSpacing = '0px';
      });
      await fixed.locator('a[data-unica-link-wrap-terminal] > span > svg').waitFor();
      assert.deepEqual(
        await fixed.evaluate((node) => [node.clientWidth, node.clientHeight]),
        widthAndHeight,
      );
      await glyphButton.click();
      await fixed.locator('a:not([data-unica-link-wrap-terminal])').waitFor();
    },

  ...Object.fromEntries(
    themes.map((theme) => [
      `Link uses real Alert status and underline states in ${theme}`,
      async ({ page, mount }) => {
        await mount('link-surfaces', { theme });
        for (const status of statuses) {
          for (const mode of modes) {
            await page.mouse.move(0, 0);
            const link = page.getByTestId(`${status}-${mode}`);
            const parentColor = await link.evaluate(
              (node) => getComputedStyle(node.parentElement).color,
            );
            const contextInk = await colorIn(link, 'var(--action-context-ink)');
            const activeInk = await colorIn(
              link,
              'color-mix(in srgb, var(--action-context-ink) var(--btn-context-ink-strength), var(--fg-primary))',
            );
            const context = `${theme} / ${status} / ${mode}`;
            const before = await getBox(link);
            assert.deepEqual(
              await computed(link, 'color', 'text-decoration-line', 'text-decoration-thickness'),
              [parentColor, mode === 'always' ? 'underline' : 'none', '1px'],
              context,
            );
            await link.hover();
            assert.deepEqual(
              await computed(link, 'color', 'text-decoration-line'),
              [mode === 'none' ? activeInk : parentColor, mode === 'none' ? 'none' : 'underline'],
              context,
            );
            await page.mouse.down();
            assert.deepEqual(
              await computed(link, 'color', 'text-decoration-line'),
              [activeInk, mode === 'none' ? 'none' : 'underline'],
              context,
            );
            assert.deepEqual(await computed(link, 'text-decoration-thickness'), ['1px'], context);
            await page.mouse.up();
            await page.mouse.move(0, 0);
            await page.keyboard.press('Tab');
            await link.focus();
            assert.deepEqual(
              await computed(link, 'outline-color', 'outline-width', 'outline-offset'),
              [contextInk, '2px', '3px'],
              context,
            );
            assert.equal(
              (await computed(link, 'text-decoration-line'))[0],
              mode === 'none' ? 'none' : 'underline',
              context,
            );
            assert.equal((await getBox(link)).width, before.width, context);
            await link.evaluate((node) => node.blur());
          }
        }
      },
    ]),
  ),

  'Link owns its keyboard focus ring inside the Folio AppShell': async ({ page, mount }) => {
    await mount('link-folio', { theme: 'frost-dark' });
    const browse = page.getByRole('link', { name: 'Browse all documents →' });
    await navigateTabs(page, browse);
    assert.deepEqual(await computed(browse, 'outline-width', 'outline-offset'), ['2px', '3px']);
  },

  'Link keeps surface boundaries, the native AppShell fallback, and forced colors': async ({
    page,
    mount,
  }) => {
    for (const surface of ['base', 'overlay']) {
      const theme = surface === 'base' ? 'soft-dark' : 'pixel-light';
      await mount('link-surfaces', {
        theme,
        surface,
        forcedColors: surface === 'overlay' ? 'active' : 'none',
        reducedMotion: 'reduce',
      });
      const ordinary = page.getByTestId('surface-link');
      const current = page.getByTestId('surface-current');
      const disabled = page.getByTestId('surface-disabled');
      assert.deepEqual(
        await computed(ordinary, 'text-decoration-line', 'text-decoration-thickness'),
        ['underline', '1px'],
      );
      assert.deepEqual(
        await computed(current, 'text-decoration-line', 'text-decoration-thickness'),
        ['underline', '2px'],
      );
      assert.equal((await computed(disabled, 'cursor'))[0], 'not-allowed');
      const start = page.getByTestId('before-shell');
      await start.focus();
      await pressKeys(page, 'Tab');
      const raw = page.getByTestId('plain-shell');
      await assertFocused(raw);
      assert.deepEqual(await computed(raw, 'outline-offset'), ['2px']);
      for (const [id, contextual] of [
        ['outer-context', true],
        ['card-context', false],
        ['new-overlay-context', false],
        ['restored-context', true],
      ]) {
        await pressKeys(page, 'Tab');
        const link = page.getByTestId(id);
        await assertFocused(link);
        const expected =
          surface === 'overlay'
            ? await colorIn(link, 'Highlight')
            : await colorIn(
                link,
                contextual ? 'var(--action-context-ink)' : 'var(--focus-ring-color)',
              );
        assert.deepEqual(await computed(link, 'outline-color', 'outline-width', 'outline-offset'), [
          expected,
          '2px',
          '3px',
        ]);
      }
      if (surface === 'overlay') {
        assert.deepEqual(await computed(ordinary, 'color'), [await colorIn(ordinary, 'LinkText')]);
        assert.deepEqual(await computed(disabled, 'color'), [await colorIn(disabled, 'GrayText')]);
      }
    }
  },
};

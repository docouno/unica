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
  'Link preserves queued ID changes and skips unrelated title reads': async ({ page, mount }) => {
    await mount('link');
    const fallback = page.getByTestId('mode-link').locator('[hidden] > span');
    assert.equal(await fallback.textContent(), 'Fallback');
    await page.getByRole('button', { name: 'Add title watcher' }).click();
    await fallback.filter({ hasText: 'Fallback' }).waitFor({ state: 'detached' });
    assert.equal(await fallback.textContent(), '');
    const reads = await page.getByTestId('title-list').evaluate(async (list) => {
      const anchors = new Set(list.querySelectorAll('a[title]'));
      const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText');
      const clock = list.appendChild(document.createTextNode('one'));
      await new Promise(requestAnimationFrame);
      let count = 0;
      Object.defineProperty(HTMLElement.prototype, 'innerText', {
        ...descriptor,
        get() {
          if (anchors.has(this)) {
            count++;
          }
          return descriptor.get.call(this);
        },
      });
      try {
        clock.data = 'two';
        await new Promise(requestAnimationFrame);
        const unrelated = count;
        list.querySelector('a').setAttribute('class', 'updated');
        await new Promise(requestAnimationFrame);
        return { links: anchors.size, unrelated, local: count - unrelated };
      } finally {
        Object.defineProperty(HTMLElement.prototype, 'innerText', descriptor);
        clock.remove();
      }
    });
    assert.deepEqual(reads, { links: 80, unrelated: 0, local: 1 });
  },
  'Link updates titled descriptions when custom CSS attributes control label visibility': async ({
    page,
    mount,
  }) => {
    await mount('link');
    const session = await page.context().newCDPSession(page);
    const { root } = await session.send('DOM.getDocument');
    const check = async (visible, ids = ['watched-inline-name', 'watched-idref-name']) => {
      for (const id of ids) {
        assert.deepEqual(
          await accessibleLink(session, root.nodeId, id),
          visible ? ['Report', 'Details Opens in a new tab'] : ['Details', 'Opens in a new tab'],
          id,
        );
      }
    };
    await check(true);
    await page.getByRole('button', { name: 'Toggle report names' }).click();
    await check(false);
    await check(false, ['context-name']);
    const group = page.getByTestId('watched-names');
    await group.evaluate((node) => node.setAttribute('data-state', 'open'));
    await check(true);
    await group.evaluate((node) => node.setAttribute('data-state', 'closed'));
    await check(false);
    await page.getByRole('button', { name: 'Toggle report names' }).click();
    await check(true);
    await check(true, ['context-name']);
    await session.detach();
  },
  'Link follows its new line container when a sibling narrows the grid': async ({
    page,
    mount,
  }) => {
    await mount('link');
    const anchor = page.getByTestId('dynamic-line');
    await anchor.evaluate(async (el) => {
      el.style.display = 'inline';
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    await page.getByTestId('dynamic-sidebar').evaluate((el) => {
      el.style.width = '643px';
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="dynamic-line"]');
      const last = Array.from(el.querySelector('.unica-link-terminal-text').getClientRects()).at(
        -1,
      );
      const glyph = el.querySelector('svg').getBoundingClientRect();
      return el.parentElement.clientWidth === 157 && glyph.top + glyph.height / 2 <= last.bottom;
    });
  },
  'Link keeps the trailing glyph on the last line after a typography-only React commit': async ({
    page,
    mount,
  }) => {
    await mount('link');
    const link = page.getByTestId('tracking-link');
    const geometry = () =>
      link.evaluate(async (anchor) => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
        const last = Array.from(
          anchor.querySelector('.unica-link-terminal-text').getClientRects(),
        ).at(-1);
        const glyph = anchor.querySelector('svg').getBoundingClientRect();
        return {
          width: anchor.parentElement.clientWidth,
          wrap: anchor.hasAttribute('data-unica-link-wrap-terminal'),
          onLastLine: glyph.top + glyph.height / 2 <= last.bottom && glyph.bottom >= last.top,
        };
      });
    const toggle = page.getByRole('button', { name: 'Toggle link tracking' });
    assert.deepEqual(await geometry(), { width: 120, wrap: false, onLastLine: true });
    await toggle.click();
    assert.deepEqual(await geometry(), { width: 120, wrap: true, onLastLine: true });
    await toggle.click();
    assert.deepEqual(await geometry(), { width: 120, wrap: false, onLastLine: true });
  },

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
      // Move the same IDREF under a rule hiding its text. The title now supplies the name.
      await page.evaluate(() => {
        const name = document.getElementById('report-name');
        name.hidden = false;
        const piece = document.createElement('span');
        piece.className = 'moved-name-piece';
        piece.textContent = name.textContent;
        name.replaceChildren(piece);
        const target = document.body.appendChild(document.createElement('div'));
        target.className = 'moved-name-target';
        const style = document.head.appendChild(document.createElement('style'));
        style.textContent = '.moved-name-target .moved-name-piece {display:none}';
      });
      assert.deepEqual(await a11y('idref-name'), [
        'Annual report',
        'Named via IDREF Opens in a new tab',
      ]);
      await page.evaluate(() =>
        document.querySelector('.moved-name-target').append(document.getElementById('report-name')),
      );
      assert.deepEqual(await a11y('idref-name'), ['Named via IDREF', 'Opens in a new tab']);
      // CSS can also change the referenced name without touching the link or its IDREF.
      await page.evaluate(() => {
        const style = document.head.appendChild(document.createElement('style'));
        style.textContent =
          '.moved-name-target .moved-name-piece {display:inline} .collapse-name + .moved-name-target .moved-name-piece {display:none}';
      });
      const visibleName = ['Annual report', 'Named via IDREF Opens in a new tab'];
      assert.deepEqual(await a11y('idref-name'), visibleName);
      await page.evaluate(() => {
        const sibling = document.createElement('div');
        sibling.className = 'collapse-name';
        document.querySelector('.moved-name-target').before(sibling);
      });
      assert.deepEqual(await a11y('idref-name'), ['Named via IDREF', 'Opens in a new tab']);
      await page.locator('.collapse-name').evaluate((el) => el.remove());
      assert.deepEqual(await a11y('idref-name'), visibleName);
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
              'color-mix(in srgb, var(--action-context-ink) var(--_btn-context-ink-strength), var(--fg-primary))',
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

  'Link updates AX name/description on ancestor class hide/show, tracks late TrailingGlyph text, late ShadowRoot ID, and skips redundant observer churn':
    async ({ page, mount }) => {
      await mount('link');
      const session = await page.context().newCDPSession(page);
      const readAx = async (testId) => {
        const { root } = await session.send('DOM.getDocument', { depth: -1 });
        const { nodeId } = await session.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector: `[data-testid="${testId}"]`,
        });
        const { nodes: axNodes } = await session.send('Accessibility.getPartialAXTree', {
          nodeId,
          fetchRelatives: false,
        });
        const linkNode = axNodes.find((node) => node.role?.value === 'link');
        return [linkNode?.name?.value, linkNode?.description?.value];
      };

      // 1. Ancestor class hides/shows text inside <Link target="_blank" title="Additional info" aria-describedby="s2-late-desc">
      assert.deepEqual(await readAx('s2-ancestor-class-link'), [
        'Details',
        'Additional info Opens in a new tab',
      ]);
      await page.getByRole('button', { name: 'Toggle ancestor hide text' }).click();
      await page.waitForFunction(() => {
        const a = document.querySelector('[data-testid="s2-ancestor-class-link"]');
        const hintId = a.getAttribute('aria-describedby').split(' ').at(-1);
        return document.getElementById(hintId)?.textContent?.trim() === 'Opens in a new tab';
      });
      assert.deepEqual(await readAx('s2-ancestor-class-link'), [
        'Additional info',
        'Opens in a new tab',
      ]);
      await page.getByRole('button', { name: 'Toggle ancestor hide text' }).click();
      await page.waitForFunction(() => {
        const a = document.querySelector('[data-testid="s2-ancestor-class-link"]');
        const hintId = a.getAttribute('aria-describedby').split(' ').at(-1);
        return (
          document.getElementById(hintId)?.textContent?.trim() ===
          'Additional info Opens in a new tab'
        );
      });
      assert.deepEqual(await readAx('s2-ancestor-class-link'), [
        'Details',
        'Additional info Opens in a new tab',
      ]);
      await page.getByRole('button', { name: 'Toggle late description id' }).click();
      assert.deepEqual(await readAx('s2-ancestor-class-link'), [
        'Details',
        'Server note Opens in a new tab',
      ]);
      await session.detach();

      // 2. Late text in TrailingGlyph after initially empty label keeps glyph on last text line.
      await page.getByRole('button', { name: 'Populate late link text' }).click();
      await page.waitForFunction(() => {
        const link = document.querySelector('[data-testid="s2-late-glyph-link"]');
        const text = link?.querySelector('.unica-link-terminal-text');
        const svg = link?.querySelector('svg');
        if (!text || !svg) {
          return false;
        }
        const lastLine = Array.from(text.getClientRects()).at(-1);
        const box = svg.getBoundingClientRect();
        return Boolean(lastLine && box.height && box.top + box.height / 2 <= lastLine.bottom + 1);
      });

      // 3. Late ID in ShadowRoot clears the new-tab description fallback.
      const shadowBefore = await page.evaluate(() => {
        const shadow = document.querySelector('#s2-shadow-desc-host').shadowRoot;
        const a = shadow.querySelector('[data-testid="shadow-desc-link"]');
        const hintId = a.getAttribute('aria-describedby').split(' ').at(-1);
        return shadow.getElementById(hintId)?.textContent?.trim();
      });
      assert.equal(shadowBefore, 'Shadow tooltip Opens in a new tab');
      const shadowAfter = await page.evaluate(async () => {
        const shadow = document.querySelector('#s2-shadow-desc-host').shadowRoot;
        const note = document.createElement('span');
        note.id = 'shadow-late-note';
        note.textContent = 'Shadow description';
        shadow.appendChild(note);
        await Promise.resolve();
        const a = shadow.querySelector('[data-testid="shadow-desc-link"]');
        const hintId = a.getAttribute('aria-describedby').split(' ').at(-1);
        return shadow.getElementById(hintId)?.textContent?.trim();
      });
      assert.equal(shadowAfter, 'Opens in a new tab');

      // 4. Equivalent rerender causes 0 MutationObserver/ResizeObserver registrations.
      const observerChurn = await page.evaluate(async () => {
        let observes = 0;
        const origMo = MutationObserver.prototype.observe;
        const origRo = ResizeObserver.prototype.observe;
        MutationObserver.prototype.observe = function (...args) {
          observes++;
          return origMo.apply(this, args);
        };
        ResizeObserver.prototype.observe = function (...args) {
          observes++;
          return origRo.apply(this, args);
        };
        document.querySelector('[data-testid="s2-link-probes"] button:last-of-type').click();
        await new Promise((r) => requestAnimationFrame(r));
        MutationObserver.prototype.observe = origMo;
        ResizeObserver.prototype.observe = origRo;
        return observes;
      });
      assert.equal(observerChurn, 0);
    },
};

import assert from 'node:assert/strict';
import {
  assertBox,
  assertFocused,
  getBox,
  pressKeys,
  submitForm,
  textContrast,
} from '../helpers.mjs';

const sizes = {
  s: [40, 24, 12, 6, 16, 'heading-s', 'body-s'],
  m: [56, 32, 18, 8, 24, 'heading-m', 'body-s'],
  l: [72, 40, 24, 10, 32, 'heading-xl', 'body-m'],
};

function part(layout, name) {
  return layout.locator(`[data-part="${name}"]`);
}

async function openWorkbench(page, options) {
  await page.evaluate((options) => {
    const params = new URLSearchParams({
      fixture: 'button-consumers',
      family: 'soft',
      scheme: 'dark',
      ...options,
    });
    history.pushState(null, '', `?${params}`);
    dispatchEvent(new PopStateEvent('popstate'));
  }, options);
  return page.locator('.wb-artboard');
}

async function assertLayout(layout, size) {
  const [disc, glyph, mediaGap, copyGap, actionGap, headingSize, bodySize] = sizes[size];
  const media = await assertBox(part(layout, 'media'), { width: disc, height: disc });
  await assertBox(part(layout, 'media').locator('svg'), { width: glyph, height: glyph });
  const title = await getBox(part(layout, 'title'));
  const description = await getBox(part(layout, 'description'));
  const actions = await getBox(part(layout, 'actions'));
  assert.equal(title.y - (media.y + media.height), mediaGap);
  assert.equal(description.y - (title.y + title.height), copyGap);
  assert.equal(actions.y - (description.y + description.height), actionGap);
  const styles = await layout.evaluate(
    (node, { headingSize, bodySize }) => {
      const css = getComputedStyle(node);
      const title = getComputedStyle(node.querySelector('[data-part="title"]'));
      const description = getComputedStyle(node.querySelector('[data-part="description"]'));
      const probe = document.createElement('span');
      node.append(probe);
      const token = (size) => {
        probe.style.fontSize = `var(--text-size-${size})`;
        return getComputedStyle(probe).fontSize;
      };
      const typography = [
        title.fontSize === token(headingSize),
        description.fontSize === token(bodySize),
      ];
      probe.remove();
      return [
        css.backgroundColor,
        css.borderWidth,
        css.padding,
        css.boxShadow,
        ...typography,
        title.fontWeight,
        title.letterSpacing,
      ];
    },
    { headingSize, bodySize },
  );
  assert.deepEqual(styles, ['rgba(0, 0, 0, 0)', '0px', '0px', 'none', true, true, '600', 'normal']);
}

async function assertMedallion(layout, family) {
  const paint = await part(layout, 'media').evaluate((node) => {
    const css = getComputedStyle(node);
    const expected = document.createElement('span');
    expected.style.color =
      'color-mix(in oklab, var(--status-danger-soft-fg) 76%, var(--fg-subtle))';
    expected.style.backgroundColor =
      'color-mix(in srgb, var(--status-danger-soft-fg) 6%, transparent)';
    expected.style.border = '1px solid var(--card-border)';
    node.append(expected);
    const probe = getComputedStyle(expected);
    const paintMatches = ['color', 'backgroundColor'].every((key) => css[key] === probe[key]);
    const rimMatches = css.borderColor === probe.borderColor;
    expected.remove();
    return [
      paintMatches,
      rimMatches,
      css.borderWidth,
      parseFloat(css.borderRadius),
      css.backdropFilter,
    ];
  });
  assert.deepEqual(paint.slice(0, 3), [true, true, family === 'soft' ? '0px' : '1px']);
  assert.equal(paint[3] > 0, family !== 'pixel');
  assert.equal(paint[4], 'none');
}

const scenarios = {
  'Empty collapses skipped slots and preserves illustration bounds and alternatives': async ({
    page,
    mount,
  }) => {
    await mount('empty');
    await assertBox(page.getByTestId('no-content'), { height: 0 });
    const compact = page.getByTestId('compact');
    const paragraph = compact.getByText('No events.');
    const root = await getBox(compact);
    await assertBox(paragraph, { y: root.y, height: root.height });
    assert.equal(await compact.getByRole('heading').count(), 0);
    assert.equal(await compact.getByRole('button').count(), 0);
    assert.equal(
      await page.getByRole('table', { name: 'History' }).getByRole('columnheader').count(),
      2,
    );
    assert.equal(await paragraph.locator('xpath=ancestor::td').getAttribute('colspan'), '2');

    const skip = page.getByTestId('skipped-title');
    const media = await getBox(part(skip, 'media'));
    await assertBox(part(skip, 'description'), { y: media.y + media.height + 18 });
    await assertBox(page.getByRole('img', { name: 'Landscape', exact: true }), {
      width: 80,
      height: 60,
    });
    const portrait = page.getByRole('img', { name: 'Portrait', exact: true });
    await portrait.evaluate((node) => node.decode());
    const portraitBounds = { width: 160 * (2 / 3), height: 160 };
    await assertBox(portrait, portraitBounds, { tolerance: 0.1 });
    await assertBox(page.getByRole('img', { name: 'Scalable portrait' }), portraitBounds, {
      tolerance: 0.1,
    });
    const narrow = await getBox(page.getByTestId('narrow-illustration'));
    await assertBox(page.getByRole('img', { name: 'Scalable landscape' }), {
      x: narrow.x,
      width: 64,
      height: 48,
    });
  },

  'Empty preserves native popover visibility and keeps top-layer parts out of spacing': async ({
    page,
    mount,
  }) => {
    await mount('empty');
    const flow = page.getByTestId('native-parts');
    const content = flow.getByText('Content in normal flow.');
    const { y, height } = await getBox(flow);
    for (const [id, openDisplay] of [
      ['native-empty', 'flex'],
      ['native-media', 'grid'],
      ['native-actions', 'flex'],
    ]) {
      const part = page.getByTestId(id);
      assert.equal(await part.evaluate((node) => getComputedStyle(node).display), 'none');
      assert.equal(
        await part.evaluate((node) => {
          node.showPopover();
          return getComputedStyle(node).display;
        }),
        openDisplay,
      );
    }
    await assertBox(content, { y, height });
    await assertBox(flow, { y, height });
  },

  'Empty respects logical start and keeps long text and both actions inside a narrow host': async ({
    page,
    mount,
  }) => {
    await mount('empty', {
      theme: 'pixel-light',
      direction: 'rtl',
      textScale: 120,
      reducedMotion: 'reduce',
    });
    const layout = page.getByTestId('layout-l').first();
    for (const width of [360, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await assertLayout(layout, 'l');
      const alignment = await layout.evaluate((node) => {
        const right = node.getBoundingClientRect().right;
        const left = node.getBoundingClientRect().left;
        const desc = node.querySelector('[data-part="description"]');
        const actions = node.querySelector('[data-part="actions"]');
        const [button, link] = actions.children;
        return {
          direction: getComputedStyle(node).direction,
          geometry: [...node.children].every(
            (part) => Math.abs(part.getBoundingClientRect().right - right) < 0.1,
          ),
          fits: [...actions.children].every(
            (action) => action.getBoundingClientRect().left >= left,
          ),
          textFits: desc.scrollWidth <= desc.clientWidth && desc.scrollHeight <= desc.clientHeight,
          motion: [getComputedStyle(node).animationName, getComputedStyle(node).transitionDuration],
          wrapped: link.getBoundingClientRect().top > button.getBoundingClientRect().bottom,
        };
      });
      assert.deepEqual(alignment, {
        direction: 'rtl',
        geometry: true,
        fits: true,
        textFits: true,
        motion: ['none', '0s'],
        wrapped: width === 360,
      });
    }
  },

  'Empty uses secondary ink in higher contrast and a system outline and rim in forced colors':
    async ({ page, mount }) => {
      await mount('empty', { theme: 'frost-light' });
      const layout = page.getByTestId('layout-s');
      await page.emulateMedia({ contrast: 'more' });
      const ink = await part(layout, 'description').evaluate((node) => {
        const ref = document.createElement('span');
        ref.style.color = 'var(--fg-secondary)';
        node.after(ref);
        return [getComputedStyle(node).color, getComputedStyle(ref).color];
      });
      assert.equal(ink[0], ink[1]);
      await page.emulateMedia({ forcedColors: 'active' });
      const title = part(layout, 'title');
      await title.focus();
      assert.deepEqual(
        await title.evaluate((node) => {
          const css = getComputedStyle(node);
          const probe = document.createElement('span');
          probe.style.color = 'Highlight';
          node.after(probe);
          return [
            css.outlineStyle,
            css.outlineWidth,
            css.outlineOffset,
            css.outlineColor === getComputedStyle(probe).color,
          ];
        }),
        ['solid', '2px', '3px', true],
      );
      assert.deepEqual(
        await part(layout, 'media').evaluate((node) => {
          const probe = document.createElement('span');
          probe.style.cssText =
            'forced-color-adjust:none; color:CanvasText; background:Canvas; border:1px solid GrayText';
          node.after(probe);
          const actual = getComputedStyle(node);
          const expected = getComputedStyle(probe);
          return ['color', 'backgroundColor', 'borderColor', 'borderWidth'].map(
            (key) => actual[key] === expected[key],
          );
        }),
        [true, true, true, true],
      );
    },

  'Empty actions preserve native tab order, availability and form participation in RTL': async ({
    page,
    mount,
  }) => {
    await mount('empty', { direction: 'rtl' });
    const form = page.getByRole('form', { name: 'Recovery actions' });
    const field = form.getByRole('textbox', { name: 'Reason' });
    const command = form.getByRole('button', { name: 'Command', exact: true });
    const busy = form.getByRole('button', { name: 'Busy command' });
    const busyLink = form.getByRole('link', { name: 'Busy destination' });
    const link = form.getByRole('link', { name: 'Report list' });
    const submit = form.getByRole('button', { name: 'Submit' });
    const reset = form.getByRole('button', { name: 'Reset' });
    await form.evaluate((node) =>
      node.addEventListener('submit', (event) => event.preventDefault()),
    );
    await field.focus();
    await pressKeys(page, 'Tab', 'Space');
    await assertFocused(command);
    assert.equal(await command.getAttribute('data-activated'), 'yes');
    await command.evaluate((node) => node.removeAttribute('data-activated'));
    await pressKeys(page, 'Enter');
    assert.equal(await command.getAttribute('data-activated'), 'yes');
    assert.equal(await command.getAttribute('type'), 'button');
    for (const pending of [busy, busyLink]) {
      await pressKeys(page, 'Tab');
      await assertFocused(pending);
      await pressKeys(page, 'Enter', 'Space');
      assert.equal(await pending.getAttribute('data-activated'), null);
      assert.equal(new URL(page.url()).hash, '');
    }
    await pressKeys(page, 'Tab', 'Enter');
    await assertFocused(link);
    assert.equal(new URL(page.url()).hash, '#reports');
    for (const previous of [busyLink, busy, command, field]) {
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(previous);
    }
    await field.fill('network');
    assert.deepEqual(await submitForm(form, submit), [
      ['reason', 'network'],
      ['action', 'retry'],
    ]);
    await reset.click();
    assert.equal(await field.inputValue(), 'expired');
  },

  'Empty search keeps the query and status mounted and moves focus only on explicit submission':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await mount('button-consumers');
      const board = await openWorkbench(page, { item: 'empty', tab: 'states', block: 'search' });
      const input = board.getByRole('textbox', { name: 'Find runbooks' });
      const status = board.getByRole('status');
      const heading = board.getByRole('heading', { name: 'No matching runbooks' });
      const columns = board.getByRole('columnheader');
      await input.fill('incident');
      await status.getByText('1 runbook found').waitFor();
      const widths = await columns.evaluateAll((headers) =>
        headers.map((header) => header.getBoundingClientRect().width),
      );
      await status.evaluate((node) => node.setAttribute('data-original', ''));
      await input.fill('missing');
      await status.getByText('0 runbooks found').waitFor();
      await assertFocused(input);
      assert.equal(await input.evaluate((node) => node.selectionStart), 'missing'.length);
      assert.deepEqual(
        await columns.evaluateAll((headers) =>
          headers.map((header) => header.getBoundingClientRect().width),
        ),
        widths,
      );
      const changes = await status.evaluateHandle((node) => {
        const records = [];
        const observer = new MutationObserver((mutations) => records.push(...mutations));
        observer.observe(node, { subtree: true, childList: true, characterData: true });
        return { count: () => records.length, disconnect: () => observer.disconnect() };
      });
      try {
        await pressKeys(page, 'Enter');
        await assertFocused(heading);
        assert.equal(await heading.evaluate((node) => getComputedStyle(node).outlineWidth), '2px');
        assert.equal(await status.count(), 1);
        assert.equal(await status.getAttribute('data-original'), '');
        assert.equal(await changes.evaluate((observed) => observed.count()), 0);
      } finally {
        await changes.evaluate((observed) => observed.disconnect());
        await changes.dispose();
      }
      await pressKeys(page, 'Tab', 'Space');
      await assertFocused(input);
      assert.equal(await input.inputValue(), '');
      await status.getByText('2 runbooks found').waitFor();
      await heading.waitFor({ state: 'detached' });
    },

  'Empty retry preserves an action while pending and preserves outside focus on success': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('button-consumers');
    const board = await openWorkbench(page, { item: 'empty', tab: 'states', block: 'retry' });
    const retry = board.getByRole('button', { name: 'Try again' });
    const status = board.getByRole('status');
    const before = await getBox(retry);
    await retry.focus();
    await pressKeys(page, 'Enter');
    await status.getByText('Reconnecting…').waitFor();
    await assertFocused(retry);
    await assertBox(retry, { width: before.width, height: before.height });
    await pressKeys(page, 'Tab', 'Shift+Tab');
    await assertFocused(retry);
    await pressKeys(page, 'Space', 'Enter');
    await status.getByText('Retry failed').waitFor();
    await assertFocused(retry);
    await pressKeys(page, 'Enter', 'Tab');
    const outside = await page.evaluateHandle(() => document.activeElement);
    assert.ok(
      await outside.evaluate(
        (node) => node !== document.body && node.textContent.trim() !== 'Try again',
      ),
    );
    await status.getByText('Two reports loaded').waitFor();
    await board.getByRole('heading', { name: 'Reports' }).waitFor();
    assert.ok(await outside.evaluate((node) => node === document.activeElement));
    await outside.dispose();
  },

  'Empty Folio filters installed items and transfers focus across the sandbox actions': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await mount('button-consumers');
    const board = await openWorkbench(page, { item: '08-extensions-empty' });
    const filter = board.getByRole('textbox', { name: 'Filter connectors' });
    await filter.fill('missing-connector');
    await board.getByText('No installed connectors match this filter.').waitFor();
    await assertFocused(filter);
    const create = board.getByRole('button', { name: 'Create webhook sandbox' });
    await create.focus();
    await pressKeys(page, 'Enter');
    const ready = board.getByRole('heading', { name: 'Webhook sandbox', exact: true });
    await ready.and(page.locator(':focus')).waitFor();
    await pressKeys(page, 'Tab', 'Space');
    const empty = board.getByRole('heading', { name: 'No webhook sandboxes yet' });
    await empty.and(page.locator(':focus')).waitFor();
  },

  'Empty Workbench uses the public JSX, applies slot precedence and links the shipped guide':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await mount('button-consumers');
      const board = await openWorkbench(page, { item: 'empty', tab: 'playground' });
      const heading = board.getByRole('heading', { name: 'No saved pages' });
      await heading.waitFor();
      await page.getByRole('combobox', { name: 'EmptyTitle.as' }).selectOption('h2');
      assert.equal(await heading.evaluate((node) => node.tagName), 'H2');
      await page.getByRole('combobox', { name: 'EmptyMedia.color' }).selectOption('danger');
      assert.equal(
        await board.locator('[data-unica-empty-color]').getAttribute('data-unica-empty-color'),
        'danger',
      );
      await page.getByRole('combobox', { name: 'EmptyMedia.children' }).selectOption('landscape');
      assert.equal(await board.locator('img').getAttribute('alt'), '');
      assert.equal(await board.locator('[data-unica-empty-color]').count(), 0);
      const code = await page
        .getByRole('region', { name: 'JSX' })
        .locator('pre:not([data-wb-pending])')
        .innerText();
      assert.match(code, /from '@docouno\/unica'/);
      assert.match(code, /<EmptyMedia icon=\{FileTextIcon\}>/);
      assert.match(code, /href=\{pagesHref\}/);

      await openWorkbench(page, { item: 'empty', tab: 'usage' });
      await page.getByText('docs/components/empty.md', { exact: true }).waitFor();
      await page.getByRole('heading', { name: 'Search, retry, and focus' }).waitFor();
      const publicProps = await page
        .getByRole('table', { name: 'Public props' })
        .locator('tbody tr td:first-child code')
        .allTextContents();
      assert.deepEqual(publicProps, ['size', 'align', 'as', 'icon', 'color', 'children']);
      const consumers = page.getByRole('navigation', { name: 'Consuming scenes' });
      const folio = consumers.getByRole('link', { name: 'Extensions & Empty Sandbox' });
      assert.match(await folio.getAttribute('href'), /item=08-extensions-empty/);
    },
};

for (const family of ['soft', 'frost', 'pixel']) {
  for (const scheme of ['dark', 'light']) {
    const theme = `${family}-${scheme}`;
    scenarios[`Empty geometry and contrast on base and native overlay in ${theme}`] = async ({
      page,
      mount,
    }) => {
      await mount('empty', { theme });
      for (const size of Object.keys(sizes)) {
        await assertLayout(page.getByTestId(`layout-${size}`).first(), size);
      }
      const base = page.getByTestId('layout-m').first();
      await assertMedallion(base, family);
      const baseContrast = await textContrast(part(base, 'description'));
      assert.ok(baseContrast >= 4.5, `Base text contrast ${baseContrast.toFixed(2)}:1`);
      await page.getByRole('button', { name: 'Show floating message' }).click();
      const panel = page.getByRole('dialog', { name: 'Floating message' });
      await panel.waitFor();
      assert.equal(await panel.getAttribute('data-surface'), 'overlay');
      assert.ok(await panel.evaluate((node) => node.matches(':popover-open')));
      const overlay = panel.getByTestId('layout-m');
      await assertLayout(overlay, 'm');
      await assertMedallion(overlay, family);
      const overlayContrast = await textContrast(part(overlay, 'description'));
      assert.ok(overlayContrast >= 4.5, `Overlay text contrast ${overlayContrast.toFixed(2)}:1`);
    };
  }
}

export default scenarios;

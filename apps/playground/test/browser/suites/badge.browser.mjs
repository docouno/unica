import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox, pressKeys, submitForm } from '../helpers.mjs';

const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];
const statuses = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'];
const sizes = [
  { size: 's', height: 20, gap: 4, padding: 7, dot: 5, icon: 14 },
  { size: 'm', height: 24, gap: 5, padding: 9, dot: 6, icon: 16 },
  { size: 'l', height: 28, gap: 6, padding: 11, dot: 7, icon: 20 },
];

function material(locator, status, mix = 0) {
  const prefix = status === 'neutral' || status === 'accent' ? status : 'status-' + status;
  return locator.evaluate(
    (root, { prefix, mix }) => {
      const style = getComputedStyle(root);
      const label = getComputedStyle(root.querySelector('[dir=auto]'));
      const cueElement = root.firstElementChild;
      const cue = getComputedStyle(cueElement);

      const probe = document.createElement('span');
      root.append(probe);
      function resolve(color) {
        probe.style.color = color;
        return getComputedStyle(probe).color;
      }
      const bg = 'var(--' + prefix + '-soft-bg)';
      const ink = 'var(--' + prefix + '-soft-fg)';
      const expected = {
        background: resolve(mix ? 'color-mix(in oklab, ' + bg + ', ' + ink + ' ' + mix + '%)' : bg),
        color: resolve(ink),
        border: resolve('var(--' + prefix + '-border)'),
        cue: resolve(cueElement instanceof SVGElement ? ink : 'var(--' + prefix + '-signal)'),
      };
      const actual = {
        background: style.backgroundColor,
        color: label.color,
        border: style.borderTopColor,
        cue: cue.color,
      };
      const borderWidth = style.borderTopWidth;
      const radius = style.borderTopLeftRadius;
      const cueRadius = cue.borderTopLeftRadius;
      const halo = cue.boxShadow;
      const { backdropFilter } = style;
      probe.remove();

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      function luminance(color) {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const rgba = context.getImageData(0, 0, 1, 1).data;
        const [red, green, blue] = Array.from(rgba.slice(0, 3), (channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return [0.2126 * red + 0.7152 * green + 0.0722 * blue, rgba[3]];
      }
      const [lightness, alpha] = luminance(actual.background);
      const [foreground] = luminance(actual.color);
      const contrast =
        (Math.max(lightness, foreground) + 0.05) / (Math.min(lightness, foreground) + 0.05);
      return {
        expected,
        actual,
        borderWidth,
        radius,
        cueRadius,
        halo,
        contrast,
        alpha,
        backdropFilter,
      };
    },
    { prefix, mix },
  );
}

function assertPaint(result, message) {
  assert.deepEqual(result.actual, result.expected, message);
  assert.equal(result.alpha, 255, message + ' opacity');
  assert.equal(result.backdropFilter, 'none', message + ' backdrop filter');
  assert.ok(result.contrast >= 4.5, message + ' contrast = ' + result.contrast.toFixed(3));
}

async function font(label, theme) {
  const family = theme.startsWith('pixel') ? 'JetBrains Mono Variable' : 'Inter Variable';
  const loaded = await label.evaluate(async (element, family) => {
    const { fontFamily, fontSize, fontWeight } = getComputedStyle(element);
    const first = fontFamily.split(',')[0].replaceAll(/['"]/g, '').trim();
    const text = element.textContent;
    const faces = await document.fonts.load(
      fontWeight + ' ' + fontSize + ' "' + family + '"',
      text,
    );
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return {
      family: first,
      weight: fontWeight,
      loaded: faces.some(
        (face) => face.family.replaceAll(/['"]/g, '') === family && face.status === 'loaded',
      ),
    };
  }, family);
  assert.deepEqual(loaded, { family, weight: '500', loaded: true });
}

async function baselines(locator) {
  return locator
    .locator('[data-baseline]')
    .evaluateAll((markers) => markers.map((marker) => marker.getBoundingClientRect().top));
}

async function css(locator, property) {
  return locator.evaluate(
    (element, name) => getComputedStyle(element).getPropertyValue(name),
    property,
  );
}

const suite = Object.fromEntries(
  themes.map((theme) => [
    'Badge uses opaque semantic material on Base and Overlay in ' + theme,
    async ({ page, mount }) => {
      await mount('badge', { theme });
      const family = theme.split('-')[0];
      for (const surface of ['base', 'overlay']) {
        const panel = page.getByTestId(surface);
        assert.notEqual(await css(panel, 'background-color'), 'rgba(0, 0, 0, 0)');
        for (const status of statuses) {
          await page.mouse.move(0, 0);
          const sample = theme + ' ' + surface + ' ' + status;
          const dot = await material(panel.getByTestId(status + '-dot'), status);
          assertPaint(dot, sample + ' passive');
          assert.equal(dot.borderWidth, family === 'soft' ? '0px' : '1px', sample);
          assert.equal(dot.radius, family === 'pixel' ? '0px' : '9999px', sample);
          assert.equal(dot.cueRadius, dot.radius, sample);
          assert.equal(dot.halo !== 'none', family === 'frost', sample);
          if (family === 'frost') {
            assert.ok(dot.halo.includes(dot.actual.cue), sample + ' halo color');
          }

          const action = panel.getByTestId(status + '-action');
          assertPaint(await material(action, status), sample + ' rest');
          await action.hover();
          assertPaint(await material(action, status, 8), sample + ' hover');
          await page.mouse.down();
          assertPaint(await material(action, status, 11), sample + ' press');
          await page.mouse.up();
        }
      }
    },
  ]),
);

for (const theme of themes) {
  suite['Badge keeps baseline, sizing, text growth, and label-only ellipsis in ' + theme] = async ({
    page,
    mount,
  }) => {
    for (const textScale of [100, 120]) {
      const rtl = textScale === 120;
      await page.setViewportSize({ width: rtl ? 360 : 800, height: 780 });
      await mount('badge', {
        theme,
        textScale,
        direction: rtl ? 'rtl' : 'ltr',
        surface: rtl ? 'overlay' : 'base',
      });
      const geometry = page.getByTestId('geometry');
      for (const { size, height, padding, gap, dot, icon } of sizes) {
        const root = geometry.getByTestId(size + '-dot');
        await font(root.locator('[dir=auto]'), theme);
        const expectedHeight = ((height - 4) * textScale) / 100 + 4;
        const bounds = await assertBox(root, { height: expectedHeight }, { tolerance: 0.1 });
        assert.equal(await css(root, 'padding-inline-start'), padding + 'px');
        assert.equal(await css(root, 'gap'), gap + 'px');
        await assertBox(
          root.locator('[aria-hidden=true]'),
          {
            width: dot,
            height: dot,
            y: bounds.y + (bounds.height - dot) / 2,
          },
          { tolerance: 0.1 },
        );
        const glyph = geometry.getByTestId(size + '-glyph');
        await assertBox(
          glyph.locator('svg'),
          {
            width: icon,
            height: icon,
            y: bounds.y + (bounds.height - icon) / 2,
          },
          { tolerance: 0.1 },
        );
        const count = geometry.getByTestId(size + '-count');
        await assertBox(
          count,
          { width: expectedHeight, height: expectedHeight },
          { tolerance: 0.1 },
        );
        assert.equal(await css(count, 'padding-inline-start'), '5px');
        assert.equal(await css(count, 'font-variant-numeric'), 'tabular-nums');
        assert.equal(await count.textContent(), '0');
      }
      const inline = geometry.getByTestId('inline');
      const plain = geometry.getByTestId('plain');
      const [before, within, after] = await baselines(inline);
      assert.ok(Math.abs(before - within) < 0.1 && before === after, theme + ' shared baseline');
      assert.ok(
        Math.abs((await getBox(inline)).height - (await getBox(plain)).height) < 0.1,
        theme + ' inline line height',
      );

      const name = 'Restricted to workspace members';
      const narrow = geometry.getByRole('link', { name, exact: true });
      const wide = geometry.getByTestId('wide-glyph');
      for (const [root, width, cueWidth] of [
        [narrow, 72, 6],
        [wide, 148, 16],
      ]) {
        await assertBox(root, { width });
        const label = root.locator('[dir=auto]');
        const cue = root.locator('[aria-hidden=true]');
        const labelBox = await getBox(label);
        const cueBox = await assertBox(cue, { width: cueWidth });
        assert.ok(
          rtl ? labelBox.x < cueBox.x : labelBox.x > cueBox.x,
          theme + ' leading cue order',
        );
        assert.equal(await css(label, 'direction'), 'ltr');
        assert.equal(await css(label, 'text-overflow'), 'ellipsis');
        assert.ok(await label.evaluate((element) => element.scrollWidth > element.clientWidth));
        assert.equal(await label.textContent(), name);
      }
      const [first, second, third] = await geometry
        .getByTestId('wrap')
        .locator('.unica-badge')
        .all();
      assert.ok(
        (await getBox(first)).y < (await getBox(second)).y &&
          (await getBox(second)).y < (await getBox(third)).y,
      );
      assert.equal(
        await first
          .locator('[dir=auto]')
          .evaluate((label) => label.scrollWidth === label.clientWidth),
        true,
        theme + ' short status remains intact in the wrapped group at ' + textScale + '%',
      );
    }
  };
}

suite['Badge respects native focus, hidden, disabled, keyboard activation, and form types'] =
  async ({ page, mount }) => {
    await mount('badge');
    const actions = page.getByTestId('actions');
    const first = actions.getByRole('button', { name: 'First stop' });
    const version = actions.getByRole('link', { name: 'Version 2' });
    const details = actions.getByRole('button', { name: 'Review details' });
    const hidden = actions.getByTestId('hidden-action');
    const hiddenPassive = actions.getByTestId('hidden-passive');
    assert.equal(await hidden.boundingBox(), null);
    assert.equal(await hiddenPassive.boundingBox(), null);
    assert.equal(await actions.getByRole('link').count(), 1);
    assert.equal(await actions.getByRole('img').count(), 0);
    const snapshot = await actions.ariaSnapshot();
    assert.doesNotMatch(snapshot, /button "Passive"|status.*Passive|img:|link "No destination"/);
    assert.match(snapshot, /text: Passive/);

    for (const testId of ['passive', 'no-href']) {
      const passive = actions.getByTestId(testId);
      const rest = await css(passive, 'background-color');
      await passive.hover();
      assert.equal(await css(passive, 'background-color'), rest);
      assert.equal(await css(passive.locator('[dir=auto]'), 'text-decoration-line'), 'none');
    }

    await first.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(version);
    assert.equal(await css(version.locator('[dir=auto]'), 'text-decoration-line'), 'underline');
    assert.equal(await css(version, 'outline-width'), '2px');
    assert.equal(await css(version, 'outline-offset'), '2px');
    await pressKeys(page, 'Enter');
    assert.equal(new URL(page.url()).hash, '#version');
    await assertFocused(actions.getByText('About v2'));
    await pressKeys(page, 'Tab');
    await assertFocused(details);
    await pressKeys(page, 'Enter');
    assert.equal(await details.getAttribute('aria-expanded'), 'true');
    assert.equal(await actions.getByTestId('activation-count').textContent(), '1');
    await assertFocused(details);
    await pressKeys(page, 'Space');
    assert.equal(await details.getAttribute('aria-expanded'), 'false');
    assert.equal(await actions.getByTestId('activation-count').textContent(), '2');
    await assertFocused(details);

    const fieldsetButton = actions.getByRole('button', { name: 'Fieldset disabled' });
    assert.ok(await fieldsetButton.isDisabled());
    await actions.getByRole('button', { name: 'Reveal badges' }).click();
    assert.ok(await hiddenPassive.boundingBox());
    await first.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(hidden);
    await pressKeys(page, 'Tab');
    await assertFocused(version);

    const untilFound = await page.evaluate(() => {
      const node = document.querySelector('[data-testid="passive"]');
      node.id = 'until-found-badge';
      node.setAttribute('hidden', 'UNTIL-FOUND');
      const style = getComputedStyle(node);
      return {
        display: style.display,
        contentVisibility: style.contentVisibility,
      };
    });
    assert.deepEqual(untilFound, { display: 'inline-flex', contentVisibility: 'hidden' });
    await page.evaluate(() => {
      window.location.hash = '#until-found-badge';
    });
    await page.waitForFunction(
      () => !document.getElementById('until-found-badge')?.hasAttribute('hidden'),
    );
    assert.ok((await getBox(page.locator('#until-found-badge'))).width > 0);

    const form = page.getByRole('form', { name: 'Submit options' });
    for (const label of ['Omitted type', 'Undefined type']) {
      const button = form.getByRole('button', { name: label });
      assert.equal(await button.getAttribute('type'), 'button');
      await button.click();
    }
    assert.equal(await form.getByTestId('submit-count').textContent(), '0');
    const title = form.getByRole('textbox', { name: 'Title' });
    await title.fill('Published');
    assert.deepEqual(await submitForm(form, form.getByRole('button', { name: 'Approve' })), [
      ['title', 'Published'],
      ['action', 'approve'],
    ]);
    assert.equal(await form.getByTestId('submit-count').textContent(), '1');
    await form.getByRole('button', { name: 'Reset' }).click();
    assert.equal(await title.inputValue(), 'Draft');
  };

suite[
  'Badge owns material attributes and replaces status immediately with either motion preference'
] = async ({ page, mount }) => {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await mount('badge', { theme: 'frost-dark', reducedMotion });
    const passive = page.getByTestId('passive');
    assert.equal(await passive.getAttribute('data-status'), 'archived');
    assert.equal(await passive.getAttribute('data-ticket'), '42');
    assert.equal(await passive.getAttribute('data-unica-badge-numeric'), null);
    await assertBox(passive, { height: 24 });
    assertPaint(await material(passive, 'danger'), 'passive material ignores conflicting data');

    const root = page.getByTestId('details');
    assert.equal(await root.getAttribute('data-status'), 'archived');
    assert.equal(await root.getAttribute('data-size'), 'app-defined');
    assert.equal(await root.getAttribute('data-ticket'), '42');
    assert.equal(await root.getAttribute('data-unica-badge-size'), 's');
    assert.equal(await root.getAttribute('data-unica-badge-numeric'), null);
    assertPaint(await material(root, 'danger'), 'application data leaves material intact');
    await assertBox(root, { height: 20 });
    const glyph = root.locator('svg');
    const previousGlyph = await glyph.innerHTML();
    await page.getByRole('button', { name: 'Verify' }).click();
    assert.equal(await root.getAttribute('data-unica-mark-status'), 'success');
    assert.equal(await root.textContent(), 'Verified');
    assert.notEqual(await glyph.innerHTML(), previousGlyph);
    assertPaint(await material(root, 'success'), 'updated material');
    assert.equal(await css(root, 'transition-duration'), '0s');
    assert.equal(await css(root, 'animation-name'), 'none');
    assert.equal(await css(root, 'transform'), 'none');
  }
};

suite['Badge keeps system colors and focus in forced colors'] = async ({ page, mount }) => {
  await mount('badge', { theme: 'frost-dark', forcedColors: 'active' });
  const actions = page.getByTestId('actions');
  for (const [root, expected] of [
    [actions.getByTestId('passive'), 'CanvasText'],
    [actions.getByRole('link', { name: 'Version 2' }), 'LinkText'],
    [actions.getByRole('button', { name: 'Review details' }), 'LinkText'],
    [actions.getByRole('button', { name: 'Unavailable' }), 'GrayText'],
    [actions.getByRole('button', { name: 'Fieldset disabled' }), 'GrayText'],
  ]) {
    const result = await root.evaluate((node, expected) => {
      const reference = document.createElement('span');
      node.append(reference);
      reference.style.color = expected;
      reference.style.backgroundColor = 'Canvas';
      const { color, backgroundColor } = getComputedStyle(reference);
      const style = getComputedStyle(node);
      const cue = node.querySelector('[aria-hidden=true]');
      const result = {
        expected: { color, backgroundColor },
        actual: { color: style.color, backgroundColor: style.backgroundColor },
        border: style.borderTopColor,
        borderWidth: style.borderTopWidth,
        cueColor: cue ? getComputedStyle(cue).color : style.color,
        halo: cue ? getComputedStyle(cue).boxShadow : 'none',
      };
      reference.remove();
      return result;
    }, expected);
    assert.deepEqual(result.actual, result.expected);
    assert.equal(result.border, result.expected.color);
    assert.equal(result.borderWidth, '1px');
    assert.equal(result.cueColor, result.expected.color);
    assert.equal(result.halo, 'none');
  }
  await actions.getByRole('button', { name: 'First stop' }).focus();
  await pressKeys(page, 'Tab', 'Tab');
  const action = actions.getByRole('button', { name: 'Review details' });
  await assertFocused(action);
  const focus = await action.evaluate((node) => {
    const style = getComputedStyle(node);
    const reference = document.createElement('span');
    reference.style.color = 'Highlight';
    node.append(reference);
    const highlight = getComputedStyle(reference).color;
    const matches = highlight === style.outlineColor;
    reference.remove();
    return {
      matches,
      width: style.outlineWidth,
      offset: style.outlineOffset,
      style: style.outlineStyle,
    };
  });
  assert.deepEqual(focus, { matches: true, width: '2px', offset: '2px', style: 'solid' });
  const canvas = await css(action, 'background-color');
  await action.hover();
  assert.equal(await css(action, 'background-color'), canvas);
  await page.mouse.down();
  assert.equal(await css(action, 'background-color'), canvas);
  await page.mouse.up();
};

suite['Badge server markup survives hydration and retains the native root and action'] = async ({
  page,
  mount,
  renderFixture,
}) => {
  const html = await renderFixture('badge-ssr');
  await mount('badge-hydration');
  const root = page.getByTestId('ssr-root');
  await root.evaluate((node, html) => {
    node.innerHTML = html;
    window.serverBadgeNodes = [...node.querySelectorAll('*')];
  }, html);
  const label = root.getByTestId('server-label');
  const button = root.getByRole('button', { name: 'About this release' });
  assert.equal(await label.textContent(), 'Version 99+');
  assert.equal(await label.locator('bdi').getAttribute('dir'), 'ltr');
  assert.equal(await button.getAttribute('type'), 'button');
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.equal(await button.locator('svg').getAttribute('aria-hidden'), 'true');
  await page.getByRole('button', { name: 'Hydrate badges' }).click();
  await button.click();
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.getByTestId('hydration-errors').textContent(), '');
  assert.ok(
    await root.evaluate((node) => {
      const current = [...node.querySelectorAll('*')];
      return (
        current.length === window.serverBadgeNodes.length &&
        current.every((old, index) => old === window.serverBadgeNodes[index])
      );
    }),
  );
};

export default suite;

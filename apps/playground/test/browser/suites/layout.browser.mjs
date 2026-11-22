import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox, resetForm, submitForm } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const trackCount = (grid) =>
  grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);

const relativeBox = (item) =>
  item.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const parent = element.parentElement.getBoundingClientRect();
    return [box.x - parent.x, box.y - parent.y, box.width, box.height];
  });

const geometry = (root) =>
  root.locator('[data-responsive-grid]').evaluate((grid) => {
    const { width } = grid.getBoundingClientRect();
    const { gridTemplateColumns, columnGap } = getComputedStyle(grid);
    const columns = gridTemplateColumns.split(' ').length;
    return {
      innerWidth,
      columns,
      gap: parseFloat(columnGap),
      width,
      firstItemWidth: grid.firstElementChild.getBoundingClientRect().width,
    };
  });

const inlineAttributes = (root) =>
  root.locator('[data-layout-root], [data-layout-root] *').evaluateAll((elements) =>
    elements.map((element) => ({
      tag: element.localName,
      class: element.className,
      style: Object.fromEntries(
        Array.from(element.style).map((property) => [
          property,
          element.style.getPropertyValue(property),
        ]),
      ),
    })),
  );

async function assertResponsiveGeometry(root, width, columns, gap, span) {
  const metrics = await geometry(root);
  assert.equal(metrics.innerWidth, width);
  assert.equal(metrics.columns, columns);
  assert.equal(metrics.gap, gap);
  const trackWidth = (metrics.width - gap * (columns - 1)) / columns;
  const itemWidth = trackWidth * span + gap * (span - 1);
  assert.ok(
    Math.abs(metrics.firstItemWidth - itemWidth) <= 0.05,
    `Expected span ${span} of ${columns} tracks at ${width}px`,
  );
}

const childSequence = (stack) =>
  stack.evaluate((element) =>
    [...element.childNodes].map((node) => (node.nodeName === 'HR' ? 'hr' : node.textContent)),
  );

export default {
  'Layout resolves SSR geometry before hydration and resizes without React commits': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const markup = await renderFixture('layout-ssr');
    const warnings = [];
    page.on('console', (message) => {
      if (message.type() === 'warning') {
        warnings.push(message.text());
      }
    });
    await page.setViewportSize({ width: 767, height: 600 });
    await mount('layout-hydration');
    const server = page.getByTestId('layout-server');
    const client = page.getByTestId('layout-client');
    await client.and(page.locator('[data-commits="1"]')).waitFor({ state: 'attached' });
    await server.evaluate((element, html) => {
      element.innerHTML = html;
    }, markup);
    const serverGrid = server.locator('[data-responsive-grid]');
    const serverNodes = await server
      .locator('[data-layout-root], [data-layout-root] *')
      .elementHandles();
    const serverMarkup = await inlineAttributes(server);
    const clientMarkup = await inlineAttributes(client);
    assert.deepEqual(serverMarkup, clientMarkup);
    assert.equal(await server.getAttribute('data-commits'), null);
    await assertResponsiveGeometry(server, 767, 1, 8, 1);
    await page.setViewportSize({ width: 1024, height: 600 });
    await assertResponsiveGeometry(server, 1024, 3, 16, 2);

    // A hydration comparison must see a breakpoint style change even if React leaves old DOM styles in place.
    const originalStyle = await serverGrid.evaluate((grid) => {
      const property = Array.from(grid.style).find((name) => name.startsWith('--'));
      if (!property) {
        throw new Error('Expected inline responsive variables on the grid');
      }
      const style = grid.getAttribute('style');
      grid.style.setProperty(property, '999');
      return style;
    });
    assert.notDeepEqual(await inlineAttributes(server), clientMarkup);
    // Restore the serialized attribute, including its original formatting, before hydration.
    await serverGrid.evaluate((grid, style) => grid.setAttribute('style', style), originalStyle);
    assert.deepEqual(await inlineAttributes(server), clientMarkup);

    await button(page, 'Hydrate layout').click();
    await server.and(page.locator('[data-commits="1"]')).waitFor({ state: 'attached' });
    for (const [width, columns, gap, span] of [
      [767, 1, 8, 1],
      [768, 2, 8, 1],
      [1023, 2, 8, 1],
      [1024, 3, 16, 2],
      [1439, 3, 16, 2],
      [1440, 4, 16, 2],
    ]) {
      await page.setViewportSize({ width, height: 600 });
      await assertResponsiveGeometry(server, width, columns, gap, span);
      await assertResponsiveGeometry(client, width, columns, gap, span);
    }
    assert.equal(
      await server
        .locator('[data-layout-root], [data-layout-root] *')
        .evaluateAll(
          (nodes, original) =>
            nodes.length === original.length &&
            nodes.every((node, index) => node === original[index]),
          serverNodes,
        ),
      true,
    );
    assert.equal(await server.getAttribute('data-commits'), '1');
    assert.equal(await client.getAttribute('data-commits'), '1');
    assert.deepEqual(await inlineAttributes(server), serverMarkup);
    assert.equal(await page.getByTestId('layout-hydration-errors').textContent(), '');
    assert.deepEqual(warnings, []);
  },

  'Layout Box renders a standalone native main landmark in server markup': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const markup = await renderFixture('layout-page-ssr');
    await mount('layout-hydration');
    assert.deepEqual(
      await page.evaluate((html) => {
        const standalone = new DOMParser().parseFromString(html, 'text/html');
        const landmarks = [...standalone.querySelectorAll('main, [role=main]')];
        return landmarks.map((main) => [
          main.localName,
          main.parentElement.localName,
          main.querySelector('h1')?.textContent,
        ]);
      }, markup),
      [['main', 'body', 'Release checklist']],
    );
  },

  'Layout roots forward native props and refs, respect hidden, and allow authored display': async ({
    page,
    mount,
  }) => {
    await mount('layout');
    const toggle = button(page, 'Toggle hidden layout');
    const roots = page.getByTestId('hide-together').locator(':scope > *');
    const metrics = () =>
      roots.evaluateAll((elements) =>
        elements.map((node) => ({
          tag: node.localName,
          ref: node.dataset.refTag,
          width: node.getBoundingClientRect().width,
          height: node.getBoundingClientRect().height,
        })),
      );
    const tags = ['nav', 'div', 'div', 'div', 'div', 'div'];
    for (const order of ['before', 'after']) {
      await page.evaluate((position) => {
        const style = document.createElement('style');
        style.id = 'fixture-layout-style';
        style.textContent = '.fixture-layout-display { display: inline-flex; }';
        document.head[position === 'before' ? 'prepend' : 'append'](style);
      }, order);
      const classOverride = page.getByTestId('display-class');
      const styleOverride = page.getByTestId('display-style');
      assert.equal(
        await classOverride.evaluate((node) => getComputedStyle(node).display),
        'inline-flex',
      );
      assert.equal(
        await styleOverride.evaluate((node) => getComputedStyle(node).display),
        'inline-grid',
      );
      assert.deepEqual(
        await metrics(),
        tags.map((tag) => ({ tag, ref: tag, width: 0, height: 0 })),
      );
      await toggle.focus();
      await page.keyboard.press('Tab');
      await assertFocused(button(page, 'After hidden layout'));
      await toggle.click();
      const visible = await metrics();
      assert.ok(visible.every(({ width, height }) => width > 0 && height > 0));
      await toggle.focus();
      await page.keyboard.press('Tab');
      await assertFocused(button(page, 'Box child'));
      await toggle.click();
      await page.locator('#fixture-layout-style').evaluate((style) => style.remove());
    }

    // until-found is a DOM/HTML mode. The public React 19 hidden prop is boolean.
    const native = await page.getByTestId('native-until-found').evaluate((node) => {
      node.setAttribute('hidden', 'until-found');
      return [getComputedStyle(node).display, getComputedStyle(node).contentVisibility];
    });
    assert.deepEqual(native, ['block', 'hidden']);
    assert.deepEqual(
      await roots.evaluateAll((elements) =>
        elements.map((node) => {
          node.setAttribute('hidden', 'until-found');
          return [getComputedStyle(node).display, getComputedStyle(node).contentVisibility];
        }),
      ),
      tags.map(() => native),
    );

    const box = page.getByRole('region', { name: 'Release notes' });
    await box.click();
    assert.equal(await box.getAttribute('data-clicks'), '1');
    assert.equal(await box.getAttribute('lang'), 'en');
    assert.equal(
      await box.getAttribute('class').then((value) => value.includes('fixture-layout-heading')),
      true,
    );
    const boxLayout = (target) =>
      target.evaluate((element) => {
        const css = getComputedStyle(element);
        return [
          css.display,
          css.paddingTop,
          css.paddingLeft,
          css.paddingRight,
          css.paddingBottom,
          css.marginTop,
          css.marginLeft,
          css.marginRight,
          css.marginBottom,
          css.minBlockSize,
        ];
      });
    assert.deepEqual(await boxLayout(box), [
      'block',
      '16px',
      '0px',
      '8px',
      '16px',
      '16px',
      '4px',
      '8px',
      '16px',
      '40px',
    ]);
    await page.locator('html').evaluate((node) => (node.dir = 'rtl'));
    assert.deepEqual(await boxLayout(box), [
      'block',
      '16px',
      '8px',
      '0px',
      '16px',
      '16px',
      '8px',
      '4px',
      '16px',
      '40px',
    ]);
    assert.deepEqual(await boxLayout(page.getByTestId('inner-box')), [
      'inline',
      '0px',
      '0px',
      '0px',
      '0px',
      '0px',
      '0px',
      '0px',
      '0px',
      '0px',
    ]);
  },

  'Layout Flex wraps and Stack preserves keyed fields, DOM order, and native form behavior':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 767, height: 600 });
      await mount('layout');
      const flex = page.getByTestId('wrapped-flex');
      assert.deepEqual(await relativeBox(flex.locator(':scope > div').nth(0)), [22, 0, 60, 20]);
      assert.deepEqual(await relativeBox(flex.locator(':scope > div').nth(1)), [90, 0, 60, 20]);
      assert.deepEqual(await relativeBox(flex.locator(':scope > div').nth(2)), [90, 28, 60, 20]);

      const name = page.getByRole('textbox', { name: 'Name', exact: true });
      const version = page.getByRole('textbox', { name: 'Version', exact: true });
      assert.equal(
        (await getBox(version)).y - (await getBox(name)).y,
        (await getBox(name)).height + 8,
      );
      await name.fill('Edited');
      const nameNode = await name.elementHandle();
      const versionNode = await version.elementHandle();
      await button(page, 'Insert keyed sibling').evaluate((node) => node.click());
      assert.equal(
        await page.getByTestId('field-stack').locator(':scope > :first-child').textContent(),
        'Name fields',
      );
      await assertFocused(name);

      const divider = button(page, 'Toggle divider');
      const separators = page.getByTestId('field-stack').locator(':scope > hr');
      for (const [field, original, value] of [
        [name, nameNode, 'Edited'],
        [version, versionNode, '2.0'],
      ]) {
        await field.fill(value);
        await divider.evaluate((node) => node.click());
        assert.equal(await separators.count(), 3);
        await assertFocused(field);
        assert.equal(await field.evaluate((node, previous) => node === previous, original), true);
        assert.equal(await field.inputValue(), value);
        await divider.evaluate((node) => node.click());
        assert.equal(await separators.count(), 0);
        await assertFocused(field);
        assert.equal(await field.evaluate((node, previous) => node === previous, original), true);
        assert.equal(await field.inputValue(), value);
      }

      await page.setViewportSize({ width: 768, height: 600 });
      assert.equal((await getBox(name)).y, (await getBox(version)).y);
      assert.ok((await getBox(name)).x > (await getBox(version)).x);
      assert.equal(await name.evaluate((node, original) => node === original, nameNode), true);
      await assertFocused(version);
      await name.focus();
      await page.keyboard.press('Tab');
      await assertFocused(version);

      const form = page.getByTestId('layout-form');
      assert.deepEqual(await submitForm(form, button(page, 'Save layout form')), [
        ['name', 'Edited'],
        ['version', '2.0'],
      ]);
      await resetForm(form);
      assert.equal(await name.inputValue(), 'Draft');
      assert.equal(await version.inputValue(), '1.0');

      assert.deepEqual(await childSequence(page.getByTestId('divided-stack')), [
        'A',
        'hr',
        '0',
        'hr',
        'B',
        'hr',
        'C',
      ]);
      assert.deepEqual(await childSequence(page.getByTestId('single-stack')), ['One']);
      assert.deepEqual(await childSequence(page.getByTestId('empty-stack')), []);
      assert.deepEqual(await childSequence(page.getByTestId('zero-divider')), ['A', '0', 'B']);
      assert.deepEqual(await childSequence(page.getByTestId('empty-divider')), ['A', 'B']);
      assert.deepEqual(await childSequence(page.getByTestId('nested-array-stack')), [
        'First array',
        'hr',
        'Second array',
      ]);

      await page.setViewportSize({ width: 1024, height: 600 });
      for (const [component, direction] of [
        ['flex', 'row'],
        ['stack', 'column'],
      ]) {
        assert.deepEqual(
          await page.getByTestId(`inner-${component}`).evaluate((node) => {
            const css = getComputedStyle(node);
            return [css.flexDirection, parseFloat(css.gap) || 0];
          }),
          [direction, 0],
        );
      }
    },

  'Layout Grid keeps track counts, areas, spans, and auto-flow native': async ({ page, mount }) => {
    await page.setViewportSize({ width: 767, height: 600 });
    await mount('layout');
    const tracks = page.getByTestId('twelve-grid');
    const span = page.getByTestId('responsive-span');
    assert.equal(await trackCount(tracks), 12);
    assert.equal(await trackCount(page.getByTestId('inner-grid')), 1);
    assert.equal(await trackCount(page.getByTestId('map-twelve')), 12);
    assert.equal(await trackCount(page.getByTestId('map-dots')), 3);
    await assertBox(span, { width: 284 / 3 }, { tolerance: 0.02 });
    await page.setViewportSize({ width: 1024, height: 600 });
    assert.equal(await trackCount(tracks), 1);
    await assertBox(span, { width: (2 * 284) / 3 + 8 }, { tolerance: 0.02 });
    await page.setViewportSize({ width: 1440, height: 600 });
    assert.equal(await trackCount(tracks), 12);
    assert.equal(await trackCount(page.getByTestId('inner-grid')), 1);
    assert.deepEqual(await relativeBox(page.getByTestId('map-nav')), [0, 0, 100, 100]);
    assert.deepEqual(await relativeBox(page.getByTestId('map-body')), [100, 0, 200, 50]);
    assert.deepEqual(await relativeBox(page.getByTestId('map-foot')), [100, 50, 100, 50]);
    await button(page, 'Toggle area map').click();
    assert.equal(
      await page
        .getByTestId('map-grid')
        .evaluate((node) => getComputedStyle(node).gridTemplateAreas),
      'none',
    );
    assert.deepEqual(await relativeBox(page.getByTestId('map-nav')), [0, 0, 100, 100]);
    assert.deepEqual(await relativeBox(page.getByTestId('map-body')), [100, 0, 100, 100]);
    assert.deepEqual(await relativeBox(page.getByTestId('map-foot')), [200, 0, 100, 100]);

    for (const dir of ['ltr', 'rtl']) {
      await page.locator('html').evaluate((node, value) => (node.dir = value), dir);
      for (const name of ['auto', 'span', '1st', '列']) {
        const grid = page.getByTestId(`area-grid-${name}`);
        assert.equal(
          await grid.evaluate((node) => getComputedStyle(node).gridTemplateAreas),
          `"${name}-start . ." ". ${name}-end ." ". . ${name}"`,
        );
        assert.deepEqual(await relativeBox(grid.locator(':scope > *')), [
          dir === 'ltr' ? 200 : 0,
          80,
          100,
          40,
        ]);
      }
    }
    await page.locator('html').evaluate((node) => (node.dir = 'ltr'));
    const collision = page.getByTestId('area-grid-auto').locator(':scope > *');
    await collision.evaluate((entry) => {
      entry.style.gridRowStart = 'auto-start';
      entry.style.gridColumnStart = 'auto-start';
      entry.style.gridRowEnd = 'auto-end';
      entry.style.gridColumnEnd = 'auto-end';
    });
    assert.notDeepEqual(
      await relativeBox(collision),
      [200, 80, 100, 40],
      'Bare line names must fail the collision fixture',
    );

    const grid = page.getByTestId('flow-grid');
    const itemB = button(page, 'Item B');
    assert.deepEqual(await relativeBox(itemB), [50, 0, 50, 50]);
    await button(page, 'Toggle grid flow').click();
    assert.deepEqual(await relativeBox(itemB), [0, 50, 50, 50]);
    assert.deepEqual(await childSequence(grid), ['Item A', 'Item B', 'Item C']);
    await button(page, 'Item A').focus();
    await page.keyboard.press('Tab');
    await assertFocused(itemB);
  },

  'Layout Container constrains the border box, uses logical alignment, and keeps responsive gutters local':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1500, height: 600 });
      await mount('layout', {
        direction: 'rtl',
        surface: 'overlay',
        theme: 'pixel-light',
        textScale: 120,
      });
      for (const [size, width] of [
        ['s', 720],
        ['m', 960],
        ['l', 1280],
      ]) {
        const [offset, , actual] = await relativeBox(page.getByTestId(`container-${size}`));
        assert.equal(actual, width);
        assert.equal(offset, (1500 - width) / 2);
      }
      const [start, , startWidth] = await relativeBox(page.getByTestId('container-start'));
      assert.equal(start + startWidth, 1500);
      await assertBox(page.getByTestId('container-s-content'), { width: 688 });

      const responsive = page.getByTestId('container-responsive');
      const responsiveContent = page.getByTestId('container-responsive-content');
      const nested = page.getByTestId('container-nested');
      for (const [width, outer, gutter] of [
        [767, 960, 16],
        [768, 720, 0],
        [1024, 1280, 0],
        [1440, 1280, 32],
      ]) {
        await page.setViewportSize({ width, height: 600 });
        await assertBox(responsive, { width: outer });
        await assertBox(responsiveContent, { width: outer - 2 * gutter });
        await assertBox(nested, { width: Math.min(960, outer - 2 * gutter) });
        assert.equal(
          await nested.evaluate((node) => getComputedStyle(node).paddingInlineStart),
          '16px',
        );
      }
      await page.setViewportSize({ width: 360, height: 600 });
      await assertBox(page.getByTestId('container-narrow'), { width: 360 });
      await assertBox(page.getByTestId('container-narrow-content'), { width: 328 });
      await assertBox(page.getByTestId('container-tight'), { width: 48 });
      await assertBox(page.getByTestId('container-tight-content'), { width: 0 });

      // Custom --container-m overrides the default <Container /> width without a size prop.
      await page.setViewportSize({ width: 1500, height: 600 });
      await assertBox(page.getByTestId('container-custom-default'), { width: 640 });
      assert.equal(
        await page.getByTestId('container-start').getAttribute('data-unica-container-align'),
        'start',
      );

      // Numeric spacing (12px), custom --space-16 token override, min-inline-size: 0 overflow
      // containment at 360px / 120% text / RTL, and VisuallyHidden semantics.
      await page.setViewportSize({ width: 360, height: 600 });
      const hardening = await page.evaluate(() => {
        const stack = document.querySelector('[data-testid="spacing-12-stack"]');
        const box16 = document.querySelector('[data-testid="custom-space-16-box"]');
        const flex = document.querySelector('[data-testid="overflow-flex"]');
        const overflowBox = document.querySelector('[data-testid="overflow-box"]');
        const overflowText = document.querySelector('[data-testid="overflow-text"]');
        const overflowGrid = document.querySelector('[data-testid="overflow-grid"]');
        const overflowGridStack = document.querySelector('[data-testid="overflow-grid-stack"]');
        const vhSpan = document.querySelector('[data-testid="vh-span"]');
        const vhDiv = document.querySelector('[data-testid="vh-div"]');
        return {
          gap12: getComputedStyle(stack).rowGap,
          customPad16: getComputedStyle(box16).paddingInlineStart,
          flexWidth: flex.getBoundingClientRect().width,
          overflowBoxWidth: overflowBox.getBoundingClientRect().width,
          overflowTextWidth: overflowText.getBoundingClientRect().width,
          overflowTextScroll: overflowText.scrollWidth,
          gridWidth: overflowGrid.getBoundingClientRect().width,
          gridStackWidth: overflowGridStack.getBoundingClientRect().width,
          vhSpanTag: vhSpan.localName,
          vhSpanRect: vhSpan.getBoundingClientRect().width,
          vhDivTag: vhDiv.localName,
          vhDivRect: vhDiv.getBoundingClientRect().width,
        };
      });
      assert.equal(hardening.gap12, '12px');
      assert.equal(hardening.customPad16, '20px');
      assert.ok(
        hardening.overflowBoxWidth <= hardening.flexWidth + 0.5,
        `Box inside Flex must not overflow: ${hardening.overflowBoxWidth} vs ${hardening.flexWidth}`,
      );
      assert.ok(
        hardening.overflowTextWidth <= hardening.flexWidth + 0.5 &&
          hardening.overflowTextScroll > hardening.overflowTextWidth,
        'Truncated Text inside Flex > Box must ellipsize within flex bounds',
      );
      assert.ok(
        hardening.gridStackWidth <= hardening.gridWidth / 2 + 1,
        `Stack inside 2-col Grid must not blow out track width: ${hardening.gridStackWidth} vs ${hardening.gridWidth}`,
      );
      assert.equal(hardening.vhSpanTag, 'span');
      assert.equal(hardening.vhDivTag, 'div');
      assert.ok(hardening.vhSpanRect <= 1 && hardening.vhDivRect <= 1);
    },
};

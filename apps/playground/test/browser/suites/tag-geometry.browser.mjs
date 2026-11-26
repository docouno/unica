import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox } from '../helpers.mjs';

const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];
const sizes = [
  { size: 's', paint: 22, line: 16, plate: 16, icon: 14, inset: 6 },
  { size: 'm', paint: 26, line: 20, plate: 20, icon: 16, inset: 7 },
  { size: 'l', paint: 30, line: 24, plate: 24, icon: 20, inset: 8 },
];
const labelPart = '[data-unica-tag-part="label"]';
const platePart = '.unica-tag-remove-plate';
const tolerance = 0.1;

function closeTo(actual, expected, name) {
  assert.ok(Math.abs(actual - expected) <= tolerance, name + ': ' + actual + ' vs ' + expected);
}

function paint(tag) {
  return tag.evaluate((root) => {
    const style = getComputedStyle(root);
    const pseudo = getComputedStyle(root, '::before');
    const swatch = document.createElement('span');
    root.append(swatch);
    function resolve(value) {
      swatch.style.color = value;
      return getComputedStyle(swatch).color;
    }
    const reference = {
      background: resolve('var(--status-info-soft-bg)'),
      border: resolve('var(--status-info-border)'),
      color: resolve('var(--status-info-soft-fg)'),
    };
    swatch.remove();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    function luminance(color) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const channels = context.getImageData(0, 0, 1, 1).data;
      const [red, green, blue] = Array.from(channels.slice(0, 3), (channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return [0.2126 * red + 0.7152 * green + 0.0722 * blue, channels[3]];
    }
    const [background, alpha] = luminance(pseudo.backgroundColor);
    const [foreground] = luminance(style.color);
    return {
      actual: {
        background: pseudo.backgroundColor,
        border: pseudo.borderTopColor,
        color: style.color,
      },
      reference,
      height: parseFloat(pseudo.height),
      borderWidth: pseudo.borderTopWidth,
      radius: pseudo.borderTopLeftRadius,
      alpha,
      contrast:
        (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05),
    };
  });
}

const contracts = Object.fromEntries(
  themes.map((theme) => [
    'Tag preserves size, semantic paint and multiline field geometry in ' + theme,
    async ({ page, mount }) => {
      const pixel = theme.startsWith('pixel');
      for (const surface of ['base', 'overlay']) {
        const rtl = surface === 'overlay';
        const textScale = rtl ? 120 : 100;
        await page.setViewportSize({ width: rtl ? 360 : 800, height: 640 });
        await mount('tag-geometry', { theme, surface, direction: rtl ? 'rtl' : 'ltr', textScale });
        for (const dimensions of sizes) {
          const tag = page.getByTestId('size-' + dimensions.size);
          const result = await paint(tag);
          const height = Math.max(dimensions.paint, (dimensions.line * textScale) / 100 + 4);
          const targetSize = Math.max(24, height);
          assert.deepEqual(result.actual, result.reference, theme + ' ' + surface);
          assert.equal(result.alpha, 255);
          assert.ok(result.contrast >= 4.5, 'label contrast: ' + result.contrast);
          assert.equal(result.borderWidth, theme.startsWith('soft') ? '0px' : '1px');
          assert.equal(result.radius, pixel ? '0px' : '9999px');
          closeTo(result.height, height, 'paint height');
          const root = await assertBox(tag, { height: targetSize }, { tolerance });
          const remove = tag.getByRole('button');
          const action = await assertBox(
            remove,
            { height: targetSize, width: targetSize },
            { tolerance },
          );
          const plate = await assertBox(
            remove.locator(platePart),
            { height: dimensions.plate, width: dimensions.plate },
            { tolerance },
          );
          const icon = await assertBox(
            tag.locator('svg').first(),
            { width: dimensions.icon },
            { tolerance },
          );
          const label = await getBox(tag.locator(labelPart));
          const leadingInset = rtl ? root.x + root.width - icon.x - icon.width : icon.x - root.x;
          closeTo(
            leadingInset,
            dimensions.inset + (height - dimensions.paint) / 2,
            'leading inset',
          );
          closeTo(
            rtl ? icon.x - label.x - label.width : label.x - icon.x - icon.width,
            4,
            'label gap',
          );
          closeTo(plate.y - action.y, (targetSize - dimensions.plate) / 2, 'plate vertical inset');
          closeTo(
            rtl ? action.x + action.width - plate.x - plate.width : plate.x - action.x,
            (height - dimensions.plate) / 2,
            'plate inline inset',
          );
        }
        const rows = await page
          .getByRole('toolbar', { name: 'Wrapping tags' })
          .locator('button')
          .all();
        const [first, second] = await Promise.all(rows.slice(0, 2).map(getBox));
        assert.ok(second.y >= first.y + first.height + 7.9, 'wrapping preserves the gap');
        const fieldTag = page.getByTestId('field-tag');
        const fieldLabel = fieldTag.locator(labelPart);
        const bounds = await getBox(fieldTag);
        const field = await fieldTag.evaluate((node) => {
          const label = node.querySelector('[data-unica-tag-part="label"]');
          const { overflowWrap, userSelect, whiteSpace } = getComputedStyle(label);
          const selection = document.getSelection();
          const range = document.createRange();
          range.selectNodeContents(label);
          selection.addRange(range);
          const selectedText = selection.toString();
          selection.removeAllRanges();
          return {
            overflowWrap,
            userSelect,
            whiteSpace,
            selectedText,
            wraps: label.firstElementChild.getClientRects().length > 1,
            radius: getComputedStyle(node, '::before').borderTopLeftRadius,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          };
        });
        assert.ok(bounds.width > 80 && bounds.width <= 184, 'field gets the full available width');
        assert.deepEqual(field, {
          overflowWrap: 'anywhere',
          userSelect: 'text',
          whiteSpace: 'pre-wrap',
          selectedText: await fieldLabel.textContent(),
          wraps: true,
          radius: pixel ? '0px' : '4px',
          overflow: false,
        });
        const fieldAction = fieldTag.getByRole('button');
        closeTo((await getBox(fieldAction)).y, bounds.y, 'remove aligns with first line');
        await fieldAction.focus();
        await fieldLabel.hover();
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        assert.equal(await page.locator('[role="tooltip"]:popover-open').count(), 0);
      }
    },
  ]),
);

contracts['Tag keeps its capsule fitted to its label and action in a flex column'] = async ({
  page,
  mount,
}) => {
  await mount('tag-geometry', { theme: 'frost-light', surface: 'overlay' });
  const column = page.getByTestId('tag-column');
  const tag = column.getByTestId('column-tag');
  const root = await getBox(tag);
  const label = await getBox(tag.locator(labelPart));
  const action = await getBox(tag.getByRole('button'));
  const plate = await getBox(tag.locator(platePart));
  const paintedWidth = await tag.evaluate((node) =>
    parseFloat(getComputedStyle(node, '::before').width),
  );
  await assertBox(column, { width: 192 });
  assert.ok(paintedWidth < 192);
  closeTo(paintedWidth, label.x - root.x + label.width + action.width, 'capsule width');
  closeTo(root.x + paintedWidth - plate.x - plate.width, 3, 'trailing plate inset');
  const tightColumn = page.getByTestId('tight-tag-column');
  const tightTag = tightColumn.getByRole('button').locator('..');
  await assertBox(tightColumn, { width: 120 });
  await assertBox(tightTag, { width: 120 });
  assert.ok(
    await tightTag.locator(labelPart).evaluate((node) => node.scrollWidth > node.clientWidth),
  );
};

contracts['Tag reserves separate coarse targets and a tap on the label edge stays passive'] =
  async ({ origin, page, watchPage }) => {
    const context = await page
      .context()
      .browser()
      .newContext({
        hasTouch: true,
        viewport: { width: 360, height: 640 },
      });
    try {
      const touch = watchPage(await context.newPage());
      const url = new URL('/test/browser/index.html', origin);
      url.search = new URLSearchParams({ fixture: 'tag-geometry', theme: 'soft-light' });
      await touch.goto(url.href);
      assert.ok(await touch.evaluate(() => matchMedia('(pointer: coarse)').matches));
      const tag = touch.getByTestId('size-s');
      const label = await getBox(tag.locator(labelPart));
      const remove = tag.getByRole('button');
      const target = await assertBox(remove, { height: 44, width: 44 });
      await assertBox(tag, { height: 44 });
      closeTo((await paint(tag)).height, 22, 'paint stays compact');
      assert.ok(target.x >= label.x + label.width - 0.1);
      const count = touch.getByTestId('actions');
      await touch.touchscreen.tap(label.x + label.width - 2, label.y + label.height / 2);
      assert.equal(await count.textContent(), '0');
      await touch.touchscreen.tap(target.x + 8, target.y + 22);
      assert.equal(await count.textContent(), '1');
      const fieldTag = touch.getByTestId('field-tag');
      const fieldIcon = await getBox(fieldTag.locator('svg').first());
      const fieldPlate = await getBox(fieldTag.locator(platePart));
      closeTo(
        fieldIcon.y + fieldIcon.height / 2,
        fieldPlate.y + fieldPlate.height / 2,
        'field icon aligns with the first line',
      );
      const rows = await touch
        .getByRole('toolbar', { name: 'Wrapping tags' })
        .locator('button')
        .all();
      const [first, second] = await Promise.all(rows.slice(0, 2).map(getBox));
      assert.ok(second.y >= first.y + first.height + 7.9);
      const capped = touch.getByTestId('capped-tags');
      await capped.scrollIntoViewIfNeeded();
      for (const direction of ['ltr', 'rtl']) {
        await capped.evaluate((node, dir) => {
          node.dir = dir;
        }, direction);
        const action = capped.getByRole('button', { name: 'Remove Capped release notes' });
        const neighbor = capped.getByRole('button', { name: 'Remove Capped review checklist' });
        const bounds = await assertBox(action, { height: 44, width: 44 });
        const capsule = await assertBox(action.locator('..'), { width: 76 });
        const other = await assertBox(neighbor.locator('..'), { width: 76 });
        assert.ok(bounds.x >= capsule.x && bounds.x + bounds.width <= capsule.x + capsule.width);
        assert.ok(
          direction === 'ltr'
            ? other.x >= capsule.x + capsule.width + 7.9
            : capsule.x >= other.x + other.width + 7.9,
        );
        assert.ok(
          await action.evaluate((node, dir) => {
            const rect = node.getBoundingClientRect();
            const x = dir === 'ltr' ? rect.right - 1 : rect.left + 1;
            return node.contains(document.elementFromPoint(x, rect.top + rect.height / 2));
          }, direction),
          direction + ' trailing edge belongs to its remove button',
        );
      }
    } finally {
      await context.close();
    }
  };

contracts[
  'Tag keeps the remove plate keyboard-visible in forced colors and stops motion when requested'
] = async ({ page, mount }) => {
  await mount('tag-geometry', {
    theme: 'frost-dark',
    forcedColors: 'active',
    reducedMotion: 'reduce',
  });
  const remove = page.getByRole('button', { name: 'Remove size s' });
  await page.keyboard.press('Tab');
  await assertFocused(remove);
  const plate = remove.locator(platePart);
  const focus = await plate.evaluate((element) => {
    const css = getComputedStyle(element);
    const sample = document.createElement('span');
    element.append(sample);
    sample.style.color = 'Highlight';
    const highlight = getComputedStyle(sample).color;
    sample.remove();
    return {
      highlight: css.outlineColor === highlight,
      style: css.outlineStyle,
      width: css.outlineWidth,
      offset: css.outlineOffset,
      transition: css.transitionDuration,
    };
  });
  assert.deepEqual(focus, {
    highlight: true,
    style: 'solid',
    width: '2px',
    offset: '-2px',
    transition: '0s',
  });
  const loading = page.getByRole('button', { name: 'Remove syncing' });
  const spinner = loading.locator('[data-unica-activity-spinner]');
  assert.equal(await loading.getAttribute('aria-busy'), 'true');
  assert.equal(await spinner.getAttribute('aria-hidden'), 'true');
  assert.equal(
    await spinner
      .locator('.unica-activity-icon-wait-arc')
      .evaluate((node) => getComputedStyle(node).animationName),
    'none',
  );
  const locked = page.getByRole('button', { name: 'Remove locked' });
  assert.equal(await locked.getAttribute('aria-busy'), null);
  assert.equal(await locked.locator('[data-unica-activity-spinner]').count(), 0);
  assert.equal(
    await locked.locator(platePart).evaluate((node) => getComputedStyle(node).opacity),
    '1',
  );
};

export default contracts;

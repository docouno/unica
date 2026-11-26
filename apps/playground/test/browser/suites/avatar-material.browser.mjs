import assert from 'node:assert/strict';
import { getBox } from '../helpers.mjs';

const geometry = [
  ['xs', 24, 4],
  ['s', 32, 4],
  ['m', 40, 6],
  ['l', 48, 8],
];
const themes = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];

function assertLength(actual, expected, sample) {
  assert.ok(
    Math.abs(actual - expected) < 0.01,
    `${sample}: expected ${expected}px, got ${actual}px`,
  );
}

function luminance(rgb) {
  const channels = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a, b) {
  const lightness = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lightness[0] + 0.05) / (lightness[1] + 0.05);
}

async function pixels(page, image, points) {
  return page.evaluate(
    async ({ image, points }) => {
      const bytes = Uint8Array.from(atob(image), (character) => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3)));
    },
    { image: image.toString('base64'), points },
  );
}

async function inspectSeam(page, group, { pixel, direction, sharpOverlap = false }) {
  const items = group.getByRole('listitem');
  const [last, counter] = await Promise.all([getBox(items.nth(1)), getBox(items.nth(2))]);
  assertLength(last.width, 24, 'Member width');
  assertLength(counter.height, 24, 'Remainder height');
  assert.ok(counter.width > 24, 'Exact four-digit remainder expands at the same height');
  const rtl = direction === 'rtl';
  const y = last.y + last.height / 2;
  const seam = rtl ? counter.x + counter.width + 1 : counter.x - 1;
  // Sample inside the 1px borders even when the frame starts on a half pixel.
  const left = last.x + 0.5;
  const right = last.x + last.width - 0.5;
  const mid = last.x + last.width / 2;
  const seamRows = sharpOverlap ? [last.y + 1, y, last.y + last.height - 2] : [y];
  const seamPoints = seamRows.flatMap((row) => [
    [seam - 0.5, row],
    [seam + 0.5, row],
  ]);
  const points = [
    ...seamPoints,
    [mid, y],
    ...(pixel
      ? [
          [left, y],
          [right, y],
          [mid, last.y + 0.5],
          [mid, last.y + last.height - 0.5],
        ]
      : []),
  ].map(([x, y]) => [Math.floor(x), Math.floor(y)]);
  const painted = await page.screenshot({ scale: 'css' });
  const frame = await group.elementHandle();
  await frame.evaluate((node) => {
    node.style.visibility = 'hidden';
  });
  const background = await page.screenshot({ scale: 'css' });
  await frame.evaluate((node) => {
    node.style.visibility = '';
  });
  const [actual, underlying] = await Promise.all([
    pixels(page, painted, points),
    pixels(page, background, points),
  ]);

  const gap = rtl ? last.x - counter.x - counter.width : counter.x - last.x - last.width;
  if (pixel) {
    assertLength(gap, 2, 'Pixel gap');
  } else {
    assert.ok(gap < 0, `Expected an overlap, got ${gap}px`);
  }
  for (const [row, coordinate] of seamRows.entries()) {
    const start = row * 2;
    const paintedSeam = actual.slice(start, start + 2);
    const backdrop = underlying.slice(start, start + 2);
    assert.ok(
      paintedSeam.some((sample, index) =>
        sample.every((channel, i) => channel === backdrop[index][i]),
      ),
      `The seam shows the live surface at y=${coordinate}: ${JSON.stringify({ paintedSeam, backdrop, last, counter })}`,
    );
  }
  for (const [index, sample] of actual.slice(seamPoints.length).entries()) {
    assert.notDeepEqual(
      sample,
      underlying[index + seamPoints.length],
      'The frame center and Pixel borders are painted',
    );
  }
  assert.equal(await counterTextDirection(group), 'ltr');
}

async function counterTextDirection(group) {
  return group
    .getByText('+1200', { exact: true })
    .evaluate((node) => getComputedStyle(node).direction);
}

async function assertGeometry(surface, { pixel, direction, textScale }) {
  for (const [size, dimension, overlap] of geometry) {
    const list = surface.getByRole('list', { name: size, exact: true });
    const items = list.getByRole('listitem');
    const boxes = await Promise.all((await items.all()).map(getBox));
    const step = pixel ? dimension + 2 : dimension - overlap + (textScale === 120 ? 2 : 0);
    for (const [index, box] of boxes.entries()) {
      assertLength(box.width, dimension, size);
      assertLength(box.height, dimension, size);
      assertLength(box.y, boxes[0].y, size);
      assertLength(
        box.x - boxes[0].x,
        index === 0 ? 0 : index * (direction === 'rtl' ? -step : step),
        size,
      );
    }
    assertLength((await getBox(list)).width, dimension + step * 2, size);
  }
}

async function assertTextContrast(group) {
  const colors = await group.getByText('+1200', { exact: true }).evaluate((text) => {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const counter = text.closest('li');
    const style = getComputedStyle(counter);
    function rgb(color) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, alpha] = ctx.getImageData(0, 0, 1, 1).data;
      return { color: [r, g, b], alpha };
    }
    return { ink: rgb(getComputedStyle(text).color), fill: rgb(style.backgroundColor) };
  });
  assert.equal(colors.fill.alpha, 255);
  assert.ok(contrast(colors.ink.color, colors.fill.color) >= 4.5, JSON.stringify(colors));
}

const scenarios = {};
for (const [index, theme] of themes.entries()) {
  scenarios[`AvatarGroup paints an open seam and the correct step on both ${theme} surfaces`] =
    async ({ page, mount }) => {
      const direction = index % 2 ? 'rtl' : 'ltr';
      const textScale = index % 2 ? 120 : 100;
      const pixel = theme.startsWith('pixel');
      await page.setViewportSize({ width: [768, 360, 1280, 360, 1440, 360][index], height: 800 });
      await mount('avatar-material', { theme, direction, textScale });
      for (const context of ['base', 'overlay']) {
        const surface = page.locator(`section[data-surface=${context}]`);
        await assertGeometry(surface, { pixel, direction, textScale });
        const group = surface.getByRole('list', { name: 'Wide remainder' });
        await assertTextContrast(group);
        await inspectSeam(page, group, { pixel, direction });
      }
    };
}

for (const theme of ['frost-dark', 'pixel-light']) {
  scenarios[`AvatarGroup preserves the seam, outline and photos in forced colors on ${theme}`] =
    async ({ page, mount }) => {
      const direction = 'rtl';
      await mount('avatar-material', {
        theme,
        direction,
        textScale: 120,
        forcedColors: 'active',
        reducedMotion: 'reduce',
      });
      const surface = page.locator('section[data-surface=overlay]');
      const group = surface.getByRole('list', { name: 'Wide remainder' });
      await inspectSeam(page, group, { pixel: theme.startsWith('pixel'), direction });
      const photo = surface.getByRole('img', { name: 'Portrait' });
      await photo.locator('[data-unica-avatar-image-ready]').waitFor();
      assert.equal(
        await photo.evaluate((node) => getComputedStyle(node, '::after').borderWidth),
        '1px',
      );
      const img = photo.locator('img');
      const color = (await pixels(page, await img.screenshot({ scale: 'css' }), [[20, 20]]))[0];
      assert.ok(new Set(color).size > 1, 'The portrait retains its color channels');
      for (let i = 0; i < 15; i += 1) {
        await page.keyboard.press('Tab');
      }
      const first = surface.getByRole('list', { name: 'xs', exact: true });
      assert.equal(await first.evaluate((node) => getComputedStyle(node).outlineWidth), '2px');
      assert.equal(await first.evaluate((node) => getComputedStyle(node).transitionDuration), '0s');
    };
}

scenarios['AvatarGroup uses a straight cutout when Frost switches to sharp corners'] = async ({
  page,
  mount,
}) => {
  const direction = 'rtl';
  await mount('avatar-material', { theme: 'frost-dark', direction, textScale: 120 });
  await page.evaluate(() => document.documentElement.style.setProperty('--radius-factor', '0'));
  const overlay = page.locator('section[data-surface=overlay]');
  const group = overlay.getByRole('list', { name: 'Wide remainder' });
  const radius = await group
    .getByRole('listitem')
    .last()
    .evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
  assert.equal(radius, '0px');
  await assertGeometry(overlay, { pixel: false, direction, textScale: 120 });
  await inspectSeam(page, group, { pixel: false, direction, sharpOverlap: true });
};

export default scenarios;

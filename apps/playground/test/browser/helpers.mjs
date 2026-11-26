import assert from 'node:assert/strict';

export async function pressKeys(page, ...keys) {
  for (const key of keys) {
    await page.keyboard.press(key);
  }
}

export async function assertFocused(locator) {
  assert.equal(
    await locator.evaluate((element) => element === element.ownerDocument.activeElement),
    true,
    `Expected focus on ${locator}`,
  );
}

export async function assertHitTarget(locator, point) {
  const hit = await locator.evaluate((element, { x, y }) => {
    const target = element.ownerDocument.elementFromPoint(x, y);
    return target === element ? null : (target?.outerHTML ?? '(no element)');
  }, point);
  assert.equal(hit, null, `Expected ${locator} at (${point.x}, ${point.y}), hit ${hit}`);
}

export async function getBox(locator) {
  const box = await locator.boundingBox();
  assert.ok(box, `Expected a visible bounding box for ${locator}`);
  return box;
}

export async function assertBox(locator, expected, { tolerance = 0 } = {}) {
  const box = await getBox(locator);
  for (const [key, value] of Object.entries(expected)) {
    assert.ok(
      Math.abs(box[key] - value) <= tolerance,
      `Expected ${locator} ${key} within ${tolerance}px of ${value}px, got ${box[key]}px`,
    );
  }
  return box;
}

export async function submitForm(form, submitButton) {
  const capture = await form.evaluateHandle((element) => {
    let entries;
    function onSubmit(event) {
      event.preventDefault();
      entries = Array.from(new FormData(element, event.submitter), ([name, value]) => [
        name,
        typeof value === 'string'
          ? value
          : {
              name: value.name,
              size: value.size,
              type: value.type,
              lastModified: value.lastModified,
            },
      ]);
    }
    element.addEventListener('submit', onSubmit, { once: true });
    return {
      read: () => entries,
      dispose: () => element.removeEventListener('submit', onSubmit),
    };
  });

  try {
    await submitButton.click();
    const entries = await capture.evaluate((handle) => handle.read());
    assert.ok(entries, `No submit event fired on ${form}`);
    return entries;
  } finally {
    try {
      await capture.evaluate((handle) => handle.dispose());
    } finally {
      await capture.dispose();
    }
  }
}

export async function resetForm(form) {
  await form.evaluate((element) => HTMLFormElement.prototype.reset.call(element));
}

export async function textContrast(locator) {
  const foreground = await locator.evaluate((node) => {
    const color = getComputedStyle(node).color;
    let opacity = 1;
    for (let parent = node; parent; parent = parent.parentElement) {
      opacity *= +getComputedStyle(parent).opacity;
    }
    if (!node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
      throw new Error('The reference text is hidden');
    }
    const inlineColor = node.style.color;
    node.style.color = 'transparent';
    return { color, opacity, inlineColor };
  });
  let png;
  try {
    png = await locator.screenshot({ animations: 'disabled' });
  } finally {
    await locator.evaluate((node, color) => {
      node.style.color = color;
    }, foreground.inlineColor);
  }
  return locator.evaluate(
    async (_node, { png, color, opacity }) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      const { data: backdrop } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, alpha] = ctx.getImageData(0, 0, 1, 1).data;
      const blend = (opacity * alpha) / 255;
      const weights = [0.2126, 0.7152, 0.0722];
      const luminance = (rgb) =>
        rgb.reduce((sum, value, axis) => {
          const s = value / 255;
          return sum + weights[axis] * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
        }, 0);
      let weakest = Infinity;
      for (let index = 0; index < backdrop.length; index += 4) {
        const bg = backdrop.subarray(index, index + 3);
        const text = [r, g, b].map((channel, axis) => channel * blend + bg[axis] * (1 - blend));
        const backgroundLight = luminance(bg);
        const textLight = luminance(text);
        weakest = Math.min(
          weakest,
          (Math.max(backgroundLight, textLight) + 0.05) /
            (Math.min(backgroundLight, textLight) + 0.05),
        );
      }
      return weakest;
    },
    { png: png.toString('base64'), ...foreground },
  );
}

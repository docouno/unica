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

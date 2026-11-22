import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox, resetForm, submitForm } from '../helpers.mjs';

async function assertBorderPaint(line, color, axis = 'block') {
  const [width, style, paint, reference] = await line.evaluate(
    (node, { axis, color }) => {
      const style = getComputedStyle(node);
      const prefix = axis === 'block' ? 'borderBlockStart' : 'borderInlineStart';
      // Compare the same sRGB pixels when CSSOM serializes the colors differently.
      const context = document
        .createElement('canvas')
        .getContext('2d', { willReadFrequently: true });
      function pixel(value) {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      }
      return [
        style[`${prefix}Width`],
        style[`${prefix}Style`],
        pixel(style[`${prefix}Color`]),
        pixel(color),
      ];
    },
    { axis, color },
  );
  assert.equal(width, '1px');
  assert.equal(style, 'solid');
  assert.deepEqual(paint, reference);
}

const right = (box) => box.x + box.width;

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1, `Expected ${actual} within 1px of ${expected}`);
}

async function labelGeometry(divider, position, direction) {
  const root = await getBox(divider);
  const text = await getBox(divider.locator('.unica-divider-label'));
  const lines = divider.locator('[aria-hidden="true"]');
  assert.equal(await lines.count(), position === 'center' ? 2 : 1);
  const boxes = await Promise.all((await lines.all()).map(getBox));
  for (const line of boxes) {
    assert.equal(line.height, 1);
    assert.ok(line.width >= 12);
    near(line.y + line.height / 2, text.y + text.height / 2);
    near(line.x < text.x ? text.x - right(line) : line.x - right(text), 12);
  }
  if (position === 'center') {
    near(boxes[0].width, boxes[1].width);
  } else {
    const left = (position === 'start') === (direction === 'ltr');
    near(left ? text.x : right(text), left ? root.x : right(root));
  }
}

async function nativeAccessibility(page) {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = await session.send('Accessibility.getFullAXTree');
    const nodesById = new Map(nodes.map((node) => [node.nodeId, node]));
    const readingOrder = [];
    function visit({ ignored, role, name, properties, childIds = [] }) {
      if (!ignored) {
        readingOrder.push({
          role: role.value,
          name: name?.value,
          orientation: properties?.find(({ name }) => name === 'orientation')?.value.value,
        });
      }
      for (const id of childIds) {
        const child = nodesById.get(id);
        if (child) {
          visit(child);
        }
      }
    }
    visit(nodes[0]);
    return readingOrder;
  } finally {
    await session.detach();
  }
}

function assertReadingOrder(nodes, entries) {
  let preceding = -1;
  return entries.map(([role, name]) => {
    const indices = nodes.flatMap((node, index) =>
      node.role === role && node.name === name ? [index] : [],
    );
    assert.equal(indices.length, 1, `Expected one ${role} named ${name}`);
    assert.ok(indices[0] > preceding, `Expected ${name} after the previous item`);
    preceding = indices[0];
    return preceding;
  });
}

export default {
  'Divider fills a column, stretches in flex and grid rows, and collapses under hidden': async ({
    page,
    mount,
  }) => {
    await mount('divider');
    for (const layout of ['flex', 'grid']) {
      const neighbor = await getBox(page.getByTestId(`${layout}-neighbor`));
      await assertBox(page.getByTestId(`${layout}-rule`), {
        y: neighbor.y,
        width: 1,
        height: neighbor.height,
      });
    }
    await assertBox(page.getByTestId('column-rule'), { width: 150, height: 1 });
    assert.equal(
      await page.getByTestId('hidden').evaluate((node) => node.getClientRects().length),
      0,
    );
    await assertBox(page.getByTestId('empty').locator('hr'), { width: 144, height: 1 });
  },

  'Divider labels keep logical edges, equal tails, and readable wrapping at 120% text': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    for (const direction of ['ltr', 'rtl']) {
      let previousFontSize = 0;
      for (const textScale of [100, 120]) {
        await mount('divider', { direction, textScale, theme: 'pixel-light' });
        for (const position of ['start', 'center', 'end']) {
          await labelGeometry(page.getByTestId(position), position, direction);
        }

        const label = page.getByTestId('unbroken').locator('.unica-divider-label');
        const { fontSize, height, lineHeight, overflow } = await label.evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            fontSize: parseFloat(style.fontSize),
            height: node.offsetHeight,
            lineHeight: parseFloat(style.lineHeight),
            overflow: node.scrollWidth > node.clientWidth,
          };
        });
        assert.ok(fontSize > previousFontSize);
        previousFontSize = fontSize;
        assert.ok(height > lineHeight, 'Unbroken text wraps onto multiple lines');
        assert.equal(overflow, false);
      }
    }
  },

  'Divider resolves the nearest explicit surface and uses CanvasText in forced colors': async ({
    page,
    mount,
  }) => {
    for (const forcedColors of ['none', 'active']) {
      await mount('divider', { theme: 'frost-dark', forcedColors });
      const canvasText = await page.locator('body').evaluate((body) => {
        const sample = body.appendChild(document.createElement('span'));
        sample.style.color = 'CanvasText';
        const color = getComputedStyle(sample).color;
        sample.remove();
        return color;
      });
      const expected = {};
      for (const id of [
        'outer-base',
        'outer-overlay',
        'card-on-overlay',
        'themed-overlay',
        'nested-base',
        'nested-overlay',
      ]) {
        const scope = page.getByTestId(id);
        expected[id] = await scope
          .locator('[data-color-reference]')
          .evaluate((node) => getComputedStyle(node).borderBlockStartColor);
        await assertBorderPaint(
          scope.locator('hr'),
          forcedColors === 'active' ? canvasText : expected[id],
        );
      }
      if (forcedColors === 'none') {
        assert.notEqual(expected['outer-base'], expected['outer-overlay']);
        assert.notEqual(expected['themed-overlay'], expected['outer-overlay']);
      }
      const label = page.getByTestId('overlay-label');
      for (const segment of await label.locator('[aria-hidden="true"]').all()) {
        await assertBorderPaint(
          segment,
          forcedColors === 'active' ? canvasText : expected['outer-overlay'],
        );
      }
      await assertBorderPaint(
        page.getByTestId('flex-rule').locator('span'),
        forcedColors === 'active' ? canvasText : expected['outer-overlay'],
        'inline',
      );
      if (forcedColors === 'active') {
        assert.equal(
          await label
            .locator('.unica-divider-label')
            .evaluate((node) => getComputedStyle(node).color),
          canvasText,
        );
      }
    }
  },

  'Divider exposes only semantic lines and one text phrase in native reading order': async ({
    page,
    mount,
  }) => {
    await mount('divider', { reducedMotion: 'reduce' });
    const nodes = await nativeAccessibility(page);
    const separators = nodes.filter(({ role }) => role === 'separator');
    assert.deepEqual(separators, [
      { role: 'separator', name: 'Account sections', orientation: 'horizontal' },
      { role: 'separator', name: 'Action groups', orientation: 'vertical' },
    ]);

    assertReadingOrder(nodes, [
      ['button', 'First stop'],
      ['separator', 'Account sections'],
      ['StaticText', 'or choose another method'],
      ['separator', 'Action groups'],
      ['button', 'Next stop'],
    ]);
    await page.getByRole('button', { name: 'First stop' }).focus();
    await page.keyboard.press('Tab');
    const next = page.getByRole('button', { name: 'Next stop' });
    await assertFocused(next);
    const form = page.getByTestId('reading-flow');
    await resetForm(form);
    assert.deepEqual(await submitForm(form, next), [['submitter', 'next']]);
  },

  'Folio sign-in reads the Divider phrase once between SSO and email': async ({ page, mount }) => {
    await mount('divider-sign-in');
    const nodes = await nativeAccessibility(page);
    const [sso, , email] = assertReadingOrder(nodes, [
      ['button', 'Passkey / SAML'],
      ['StaticText', 'or continue with work email'],
      ['textbox', 'Work email'],
    ]);
    assert.equal(
      nodes.slice(sso, email).some(({ role }) => role === 'separator'),
      false,
    );
    await page.getByRole('button', { name: 'Passkey / SAML' }).focus();
    await page.keyboard.press('Tab');
    await assertFocused(page.getByRole('textbox', { name: 'Work email' }));
  },

  'Divider preserves hidden="until-found" and reveals on fragment navigation': async ({
    page,
    mount,
  }) => {
    await mount('divider');
    const hiddenState = await page.evaluate(() => {
      const target = document.querySelector('[data-testid="center"]');
      target.id = 'until-found-divider';
      target.setAttribute('hidden', 'until-found');
      const style = getComputedStyle(target);
      return {
        display: style.display,
        contentVisibility: style.contentVisibility,
      };
    });
    assert.deepEqual(hiddenState, { display: 'block', contentVisibility: 'hidden' });

    await page.evaluate(() => {
      window.location.hash = '#until-found-divider';
    });
    const revealed = page.locator('#until-found-divider');
    await page.waitForFunction(
      () => !document.getElementById('until-found-divider')?.hasAttribute('hidden'),
    );
    assert.ok((await getBox(revealed)).height > 0);
  },
};

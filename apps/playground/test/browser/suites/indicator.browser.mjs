import assert from 'node:assert/strict';
import {
  assertBox,
  assertFocused,
  assertHitTarget,
  getBox,
  pressKeys,
  submitForm,
} from '../helpers.mjs';

const markerSelector = '.unica-indicator-marker';
const presets = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];

async function assertAccessibleCount(scope, count) {
  assert.equal(
    (await scope.ariaSnapshot()).trim(),
    `- button "Notifications, ${count} unread": Notifications`,
  );
  assert.equal(await scope.locator('[aria-live], [role="status"], [role="alert"]').count(), 0);
}

async function painted(locator) {
  return locator.evaluate((node) => node.checkVisibility());
}

async function assertCorner(host, marker, position, direction, inset = 0) {
  const { x, y, width, height } = await getBox(host);
  const box = await getBox(marker);
  const atLeft = position.endsWith('start') === (direction === 'ltr');
  const expectedX = x + width * (atLeft ? inset : 1 - inset);
  const expectedY = y + height * (position.startsWith('top') ? inset : 1 - inset);
  assert.ok(Math.abs(box.x + box.width / 2 - expectedX) <= 1, `${position} ${direction} x`);
  assert.ok(Math.abs(box.y + box.height / 2 - expectedY) <= 1, `${position} ${direction} y`);
}

async function readPaint(parent) {
  return parent.evaluate((section, selector) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    function rgba(color) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    }
    return {
      ground: rgba(getComputedStyle(section).backgroundColor),
      pairs: Array.from(
        section.querySelectorAll(`:scope > .unica-indicator ${selector}`),
        (node) => {
          const styles = getComputedStyle(node);
          const shadow = styles.boxShadow;
          const color = shadow.match(/^(.*\)) 0px 0px 0px 2px$/)?.[1];
          return {
            mode: node.dataset.unicaIndicatorMode,
            status: node.closest('.unica-indicator').dataset.unicaIndicatorStatus,
            fill: rgba(styles.backgroundColor),
            ink: rgba(styles.color),
            separator: color ? rgba(color) : null,
            shadow,
          };
        },
      ),
    };
  }, markerSelector);
}

function luminance(color) {
  const channels = color.slice(0, 3).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const a = luminance(first) + 0.05;
  const b = luminance(second) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

export default {
  'Indicator updates the count with stable focus, geometry and accessible names': async ({
    page,
    mount,
  }) => {
    await mount('indicator');
    const scope = page.getByTestId('notifications');
    const host = scope.locator('button');
    const marker = scope.locator(markerSelector);
    const next = page.getByRole('button', { name: 'After notifications' });
    const original = await host.elementHandle();
    const hostBox = await getBox(host);
    const nextBox = await getBox(next);

    try {
      assert.equal(await marker.textContent(), '99+');
      assert.equal(await marker.getAttribute('aria-hidden'), 'true');
      await assertAccessibleCount(scope, 105);
      await page.getByRole('button', { name: 'Before notifications' }).focus();
      await pressKeys(page, 'Tab');
      await assertFocused(host);
      await pressKeys(page, 'Enter');
      assert.equal(await marker.count(), 0);
      await assertAccessibleCount(scope, 0);
      await assertFocused(host);
      await assertBox(host, hostBox);
      await assertBox(next, nextBox);
      assert.equal(await page.getByRole('status').textContent(), '0 unread');

      await page.getByRole('button', { name: 'Set three unread' }).evaluate((node) => node.click());
      assert.equal(await marker.textContent(), '3');
      await assertAccessibleCount(scope, 3);
      assert.equal(await host.evaluate((node, previous) => node === previous, original), true);
      await assertFocused(host);
      await assertBox(host, hostBox);
      await assertBox(next, nextBox);
      assert.equal(await page.getByRole('status').count(), 1);
      assert.equal(await page.getByRole('status').textContent(), '3 unread');
      await pressKeys(page, 'Tab');
      await assertFocused(next);
    } finally {
      await original.dispose();
    }
  },

  'Indicator overhang adds no hit area and native submit, disabled and reset remain host-owned':
    async ({ page, mount }) => {
      await mount('indicator');
      const scope = page.getByTestId('notifications');
      const host = scope.locator('button');
      const hostBox = await getBox(host);
      const marker = await getBox(scope.locator(markerSelector));
      const x = marker.x + marker.width / 2;
      const y = marker.y + marker.height / 2;
      assert.ok(marker.width > 6 && marker.height > 6);
      const inside = { x: x - 3, y: y + 3 };
      const outside = { x: x + 3, y: y - 3 };
      assert.ok(inside.x < hostBox.x + hostBox.width && inside.y > hostBox.y);
      assert.ok(outside.x > hostBox.x + hostBox.width && outside.y < hostBox.y);
      await page.mouse.click(outside.x, outside.y);
      assert.equal(await page.getByTestId('activations').textContent(), '0');
      await assertHitTarget(host, inside);
      await page.mouse.click(inside.x, inside.y);
      assert.equal(await page.getByTestId('activations').textContent(), '1');
      assert.equal(await page.getByRole('status').textContent(), '0 unread');

      const form = page.getByRole('form', { name: 'Request' });
      const disabled = form.getByRole('button', { name: 'Blocked' });
      assert.equal(await disabled.isDisabled(), true);
      assert.equal(await disabled.locator('..').locator(markerSelector).isVisible(), true);
      const disabledBox = await getBox(disabled);
      await page.mouse.click(
        disabledBox.x + disabledBox.width / 2,
        disabledBox.y + disabledBox.height / 2,
      );
      assert.equal(await form.getByRole('textbox').inputValue(), 'Draft');
      const subject = form.getByRole('textbox', { name: 'Subject' });
      await subject.fill('Updated');
      assert.deepEqual(await submitForm(form, form.getByRole('button', { name: 'Send' })), [
        ['subject', 'Updated'],
        ['action', 'send'],
      ]);
      await form.getByRole('button', { name: 'Reset' }).click();
      assert.equal(await subject.inputValue(), 'Draft');
    },

  'Indicator distinguishes marker visibility from native hiding on its wrapper and host': async ({
    page,
    mount,
  }) => {
    await mount('indicator');
    const scope = page.getByTestId('notifications');
    const host = scope.locator('button');
    const wrapper = scope.locator('#notification-indicator');
    const marker = scope.locator(markerSelector);
    const click = (name) => page.getByRole('button', { name }).click();
    const original = await host.elementHandle();

    try {
      const initial = await getBox(host);
      await click('Toggle marker');
      assert.equal(await marker.count(), 0);
      await assertBox(host, initial);
      await click('Toggle marker');

      for (const [name, owner] of [
        ['Toggle wrapper hidden', wrapper],
        ['Toggle host hidden', host],
      ]) {
        await click(name);
        assert.notEqual(await owner.getAttribute('hidden'), null);
        assert.equal(await host.isVisible(), false);
        assert.equal(await painted(marker), false);
        await click('Set three unread');
        await click(name);
        assert.equal(await owner.getAttribute('hidden'), null);
        assert.equal(await host.evaluate((node, previous) => node === previous, original), true);
        await assertBox(host, initial);
        assert.equal(await marker.textContent(), '3');
        assert.equal(await painted(marker), true);
      }
    } finally {
      await original.dispose();
    }
  },

  'Indicator permits native until-found fragment reveal on wrapper and direct host': async ({
    page,
    mount,
  }) => {
    await mount('indicator-hidden');
    const wrapper = page.getByTestId('hidden-wrapper');
    const wrappedHost = page.getByTestId('host-indicator').locator('button');
    const native = page.getByRole('button', { name: 'Standalone native button' });
    const targets = [wrapper, wrappedHost, native];

    for (const target of targets) {
      await target.evaluate((node) => {
        node.setAttribute('hidden', 'until-found');
        node.dataset.reveals = '0';
        node.addEventListener('beforematch', () => {
          node.dataset.reveals = String(Number(node.dataset.reveals) + 1);
        });
      });
      assert.equal(await target.getAttribute('hidden'), 'until-found');
    }

    const wrapperMarker = wrapper.locator(markerSelector);
    const hostMarker = page.getByTestId('host-indicator').locator(markerSelector);
    assert.equal(await painted(wrapperMarker), false);
    assert.equal(await painted(hostMarker), false);
    await page.getByRole('button', { name: 'Before wrapper' }).focus();
    await pressKeys(page, 'Tab');
    await assertFocused(page.getByRole('link', { name: 'Find inside wrapper' }));
    assert.equal(
      await wrapper.locator('button').evaluate((node) => {
        node.focus();
        return node === document.activeElement;
      }),
      false,
    );

    const keyboardBehavior = async (button, before, counter) => {
      const box = await getBox(button);
      await page.getByRole('button', { name: before }).focus();
      await pressKeys(page, 'Tab');
      const tab = await button.evaluate((node) => node === document.activeElement);
      const focus = await button.evaluate((node) => {
        node.focus();
        return node === document.activeElement;
      });
      await pressKeys(page, 'Space');
      return {
        width: box.width,
        height: box.height,
        tab,
        focus,
        count: await page.getByTestId(counter).textContent(),
      };
    };
    assert.deepEqual(
      await keyboardBehavior(wrappedHost, 'Before host', 'host-activations'),
      await keyboardBehavior(native, 'Before reference', 'native-activations'),
    );

    await page.getByRole('button', { name: 'Update hidden counts' }).click();
    for (const [target, link, marker] of [
      [wrapper, 'Find inside wrapper', wrapperMarker],
      [wrappedHost, 'Find inside host', hostMarker],
    ]) {
      assert.equal(await target.getAttribute('hidden'), 'until-found');
      assert.equal(await painted(marker), false);
      await page.getByRole('link', { name: link }).click();
      await page.waitForFunction(
        (id) => document.querySelector(id)?.dataset.reveals === '1',
        target === wrapper
          ? '[data-testid="hidden-wrapper"]'
          : '[data-testid="host-indicator"] > button',
      );
      assert.equal(await target.getAttribute('hidden'), null);
      assert.equal(await marker.textContent(), '3');
      assert.equal(await painted(marker), true);
    }
  },

  'Indicator centers all logical corners in nested directions and fills a naturally narrow host':
    async ({ page, mount }) => {
      for (const theme of ['soft-dark', 'frost-light', 'pixel-dark']) {
        await mount('indicator-material', { theme, textScale: 120 });
        for (const root of await page.getByTestId('corner').all()) {
          const [position, direction, overlap] = await root.evaluate((node) => [
            node.dataset.unicaIndicatorPosition,
            node.dataset.direction,
            node.dataset.unicaIndicatorOverlap,
          ]);
          const marker = root.locator(markerSelector);
          const inset = overlap === 'circular' && !theme.startsWith('pixel') ? 0.1464466 : 0;
          await assertCorner(root.locator('button'), marker, position, direction, inset);
          assert.equal(await marker.textContent(), '99+');
          assert.equal(
            await marker.locator('bdi').evaluate((node) => getComputedStyle(node).direction),
            'ltr',
          );
        }
        const expected = (await getBox(page.getByTestId('width-container'))).width;
        const auto = page.getByTestId('auto');
        const autoBox = await getBox(auto.locator('button'));
        assert.ok(autoBox.width < expected);
        await assertBox(auto, { width: autoBox.width }, { tolerance: 1 });
        for (const id of ['full', 'wrapped']) {
          const root = page.getByTestId(id);
          const host = root.locator('button');
          await assertBox(root, { width: expected }, { tolerance: 1 });
          const box = await assertBox(host, { width: expected }, { tolerance: 1 });
          if (id === 'wrapped') {
            assert.ok(box.height > autoBox.height, 'Long button text should wrap');
          }
          await assertCorner(host, root.locator(markerSelector), 'top-end', 'ltr');
        }
      }
    },

  'Indicator provides distinct count ink and dot signal colors with a surface-owned separator':
    async ({ page, mount }) => {
      for (const theme of presets) {
        await mount('indicator-material', { theme });
        for (const id of ['base', 'overlay', 'nested-base', 'shell-override']) {
          const { ground, pairs } = await readPaint(page.getByTestId(id));
          assert.equal(pairs.length, id === 'base' || id === 'overlay' ? 12 : 2);
          const expected = [...ground.slice(0, 3), 255];
          for (const sample of pairs) {
            assert.match(sample.shadow, /0px 0px 0px 2px$/);
            assert.equal(sample.separator?.[3], 255, `${theme} ${id} separator opacity`);
            // Canvas reads a translucent color from premultiplied pixels, allowing 1 channel value.
            assert.ok(
              sample.separator.every((value, index) => Math.abs(value - expected[index]) <= 1),
              `${theme} ${id} separator ${sample.separator}, expected ${expected}`,
            );
            const isCount = sample.mode === 'count';
            const minimum = isCount ? 4.5 : 3;
            const ratio = contrast(sample.fill, isCount ? sample.ink : sample.separator);
            assert.ok(
              ratio >= minimum,
              `${theme} ${id} ${sample.status} ${sample.mode}: ${ratio.toFixed(2)}`,
            );
          }
        }

        const { pairs: borderless } = await readPaint(page.getByTestId('borderless'));
        assert.equal(borderless.length, 2);
        assert.ok(borderless.every(({ shadow }) => shadow === 'none'));
      }
    },

  'Indicator auto matches its host box in stretched grid, flex and narrow containers': async ({
    page,
    mount,
  }) => {
    await mount('indicator-material');
    for (const container of await page.getByTestId('auto-layout').all()) {
      const host = container.locator('button');
      await assertBox(container.locator('.unica-indicator'), await getBox(host), { tolerance: 1 });
      await assertCorner(host, container.locator(markerSelector), 'top-end', 'ltr');
    }
  },

  'Indicator dots keep their size while counters scale, with no motion and a forced-colors outline':
    async ({ page, mount }) => {
      for (const textScale of [100, 120]) {
        for (const reducedMotion of ['no-preference', 'reduce']) {
          await mount('indicator-material', { textScale, reducedMotion });
          const sizes = page.getByTestId('sizes');
          for (const [index, [countHeight, dotSize]] of [
            [16, 6],
            [20, 8],
            [24, 12],
          ].entries()) {
            const count = sizes
              .locator(`${markerSelector}[data-unica-indicator-mode="count"]`)
              .nth(index);
            const dot = sizes
              .locator(`${markerSelector}[data-unica-indicator-mode="dot"]`)
              .nth(index);
            await assertBox(count, { height: (countHeight * textScale) / 100 }, { tolerance: 0.1 });
            await assertBox(dot, { width: dotSize, height: dotSize });
            for (const marker of [count, dot]) {
              const motion = await marker.evaluate((node) =>
                [node.parentElement, node].map((part) => [
                  part.getAnimations().length,
                  getComputedStyle(part).animationName,
                  getComputedStyle(part).transitionDuration,
                ]),
              );
              assert.deepEqual(motion, [
                [0, 'none', '0s'],
                [0, 'none', '0s'],
              ]);
            }
          }
        }
      }
      await page.emulateMedia({ forcedColors: 'active' });
      for (const [section, outlineWidth] of [
        ['sizes', '2px'],
        ['borderless', '1px'],
      ]) {
        for (const marker of await page.getByTestId(section).locator(markerSelector).all()) {
          const styles = await marker.evaluate((node) => {
            const style = getComputedStyle(node);
            return {
              background: style.backgroundColor,
              ink: style.color,
              outline: style.outlineStyle,
              outlineColor: style.outlineColor,
              outlineWidth: style.outlineWidth,
              shadow: style.boxShadow,
            };
          });
          assert.equal(styles.outline, 'solid');
          assert.equal(styles.outlineWidth, outlineWidth);
          assert.equal(styles.shadow, 'none');
          assert.equal(styles.ink, styles.outlineColor);
          assert.notEqual(styles.background, styles.ink);
        }
      }
    },
};

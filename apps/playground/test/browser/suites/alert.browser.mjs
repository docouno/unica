import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox, pressKeys, submitForm } from '../helpers.mjs';

const liveSelector = '.unica-alert > .unica-visually-hidden[aria-atomic="true"]';
const presets = [
  'soft-dark',
  'soft-light',
  'frost-dark',
  'frost-light',
  'pixel-dark',
  'pixel-light',
];

export function observeAlerts(selector) {
  const entries = [];
  new MutationObserver((records) => {
    for (const { target, addedNodes } of records) {
      const channel = target.nodeType === 3 ? target.parentElement : target;
      if (channel?.matches?.(selector) && channel.textContent) {
        entries.push({ role: channel.getAttribute('role'), message: channel.textContent });
      } else {
        for (const node of addedNodes) {
          if (node.matches?.(selector) && node.textContent) {
            entries.push({ role: node.getAttribute('role'), message: node.textContent });
          }
        }
      }
    }
  }).observe(document, { childList: true, characterData: true, subtree: true });
  window.alertEntries = entries;
}

export async function pausedClock(page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
}

function paintedAlerts(paint) {
  const context = document.createElement('canvas').getContext('2d');
  const pixel = (color) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data].map((value) => value / 255);
  };
  const over = (front, behind) =>
    front.slice(0, 3).map((channel, index) => front[3] * channel + (1 - front[3]) * behind[index]);
  const linear = (value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = (color) =>
    0.2126 * linear(color[0]) + 0.7152 * linear(color[1]) + 0.0722 * linear(color[2]);
  const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const background = over(
    pixel(getComputedStyle(paint).backgroundColor),
    pixel(getComputedStyle(paint.parentElement).backgroundColor),
  );

  return ['neutral', 'info', 'success', 'warning', 'danger'].map((status) => {
    const root = paint.querySelector('[data-testid="' + status + '"]');
    const description = root.querySelector('.unica-alert-description');
    const glyph = root.querySelector('svg');
    const style = getComputedStyle(root);
    const plate = over(pixel(style.backgroundColor), background);
    const ink = over(pixel(getComputedStyle(description).color), plate);
    const probe = document.createElement('span');
    root.append(probe);
    const prefix = status === 'neutral' ? 'neutral' : 'status-' + status;
    const palette = ['soft-bg', 'soft-fg', 'border'].map((axis) => {
      probe.style.color = 'var(--' + prefix + '-' + axis + ')';
      return getComputedStyle(probe).color;
    });
    probe.remove();
    return {
      status,
      palette,
      actual: [style.backgroundColor, style.color, style.borderTopColor],
      glyphInk: glyph && getComputedStyle(glyph).color,
      path: glyph?.querySelector('path')?.getAttribute('d'),
      contrast: contrast(luminance(plate), luminance(ink)),
      widths: [style.borderInlineStartWidth, style.borderInlineEndWidth],
      radius: style.borderRadius,
      effect: [style.boxShadow, style.backdropFilter],
    };
  });
}

const content = (text) => 'Check the schema ' + text + ' Run check-schema or read the guide.';

export default {
  'Alert registers an empty live node and delivers a single current message without focus changes':
    async ({ page, mount }) => {
      await mount('alert');
      await pausedClock(page);
      await page.evaluate(observeAlerts, liveSelector);
      const field = page.getByRole('textbox', { name: 'Schema' });
      await field.fill('draft.yaml');
      const click = (name) =>
        page.getByRole('button', { name }).evaluate((button) => button.click());
      await click('Show validation');
      const live = page.locator('#feedback').getByRole('alert');
      assert.equal(await live.textContent(), '');
      assert.equal(await live.getAttribute('aria-live'), null);
      assert.equal(await live.getAttribute('aria-atomic'), 'true');
      assert.equal(await live.locator('*').count(), 0);
      await page.clock.runFor(99);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), []);
      await click('Use second message');
      await page.clock.runFor(2);
      assert.equal(await live.textContent(), content('Draft B'));
      assert.equal(await field.inputValue(), 'draft.yaml');
      await assertFocused(field);

      await click('Toggle visibility');
      assert.equal(await page.locator('#feedback').isVisible(), false);
      await click('Toggle visibility');
      await page.clock.runFor(40);
      assert.equal(await live.textContent(), '');
      await click('Use polite role');
      await page.clock.runFor(100);
      const polite = page.locator('#feedback').getByRole('status');
      assert.equal(await polite.textContent(), content('Draft B'));
      await page.clock.runFor(7000);
      assert.equal(await polite.textContent(), '');
      const visible = page.locator('#feedback');
      await visible.getByRole('heading', { name: 'Check the schema' }).waitFor();
      await visible.getByRole('link', { name: 'the guide' }).waitFor();
      assert.equal(await visible.getByText('Draft B', { exact: true }).count(), 1);
      assert.match(await visible.ariaSnapshot(), /heading "Check the schema"/u);
      assert.deepEqual(await page.evaluate(() => window.alertEntries), [
        { role: 'alert', message: content('Draft B') },
        { role: 'status', message: content('Draft B') },
      ]);
    },

  'Alert close follows tab order, preserves external input and delegates native form-safe requests':
    async ({ page, mount }) => {
      await mount('alert');
      const form = page.getByTestId('alert-form');
      const summary = page.locator('#feedback');
      const requests = page.getByTestId('close-requests');
      const field = page.getByRole('textbox', { name: 'Schema' });
      const show = page.getByRole('button', { name: 'Show validation' });
      const close = summary.getByRole('button', { name: 'Dismiss validation' });

      await field.fill('typed.yaml');
      await show.evaluate((element) => element.click());
      await assertFocused(field);
      await close.click();
      await assertFocused(field);
      assert.equal(await requests.textContent(), '1');
      for (const name of ['Date field', 'Time field', 'Browser-normalized text field']) {
        const otherField = form.getByLabel(name);
        const value = await otherField.inputValue();
        await otherField.focus();
        await close.click();
        await assertFocused(otherField);
        assert.equal(await otherField.inputValue(), value);
      }
      const link = summary.getByRole('link', { name: 'the guide' });
      const retry = summary.getByRole('button', { name: 'Retry' });
      await link.focus();
      await pressKeys(page, 'Tab');
      await assertFocused(retry);
      await pressKeys(page, 'Tab');
      await assertFocused(close);
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(retry);
      await close.press('Enter');
      await close.press('Space');
      await close.press('Escape');
      await field.click();
      assert.equal(await requests.textContent(), '6');
      assert.equal(await summary.count(), 1);
      assert.equal(await field.inputValue(), 'typed.yaml');
      assert.equal(await page.getByTestId('submit-requests').textContent(), '0');
      assert.deepEqual(await form.evaluate((element) => [...new FormData(element)]), [
        ['schema', 'typed.yaml'],
      ]);

      await page.getByRole('checkbox', { name: 'Disable fieldset' }).check();
      assert.equal(await close.isDisabled(), true);
      await close.evaluate((element) => element.click());
      assert.equal(await requests.textContent(), '6');
      await summary.getByRole('heading').waitFor();
      await page.getByRole('checkbox', { name: 'Disable fieldset' }).uncheck();
      await page.getByRole('checkbox', { name: 'Accept dismissal' }).check();
      await close.press('Enter');
      assert.equal(await summary.count(), 0);
      assert.equal(await requests.textContent(), '7');
      await assertFocused(field);
      await form.getByRole('button', { name: 'Reset form' }).click();
      assert.equal(await field.inputValue(), 'default.yaml');
      assert.equal(await summary.count(), 0);
      assert.deepEqual(await submitForm(form, form.getByRole('button', { name: 'Submit form' })), [
        ['schema', 'default.yaml'],
      ]);
      assert.equal(await page.getByTestId('submit-requests').textContent(), '1');
    },

  'Native until-found reveals a static Alert quietly and reprimes a dynamic Alert': async ({
    page,
    mount,
  }) => {
    await mount('alert');
    const hidden = page.locator('#until-found');
    await hidden.evaluate((element) => element.setAttribute('hidden', 'UNTIL-FOUND'));
    assert.equal(
      await hidden.evaluate((element) => getComputedStyle(element).contentVisibility),
      'hidden',
    );
    assert.equal(await page.getByRole('heading', { name: 'Find the static notice' }).count(), 0);
    await page.getByRole('link', { name: 'Find alert', exact: true }).click();
    await hidden.getByRole('heading').waitFor();
    assert.equal(await hidden.getAttribute('hidden'), null);
    assert.equal(await hidden.locator(liveSelector).count(), 0);

    await page.evaluate(observeAlerts, liveSelector);
    await page.getByRole('button', { name: 'Show validation' }).click();
    const dynamic = page.locator('#feedback');
    const live = dynamic.getByRole('alert');
    await page.waitForFunction(
      (selector) => document.querySelector(selector)?.textContent,
      '#feedback > [role="alert"]',
    );
    await dynamic.evaluate((element) => element.setAttribute('hidden', 'UNTIL-FOUND'));
    assert.equal(await dynamic.getByRole('heading').count(), 0);
    await page.waitForFunction(
      () => document.querySelector('#feedback > [role="alert"]')?.textContent === '',
    );
    await page.getByRole('link', { name: 'Find alert', exact: true }).evaluate((element) => {
      element.setAttribute('href', '#feedback');
    });
    await page.getByRole('link', { name: 'Find alert', exact: true }).click();
    await live.waitFor();
    await page.waitForFunction(() => window.alertEntries.length === 2);
    assert.equal(await dynamic.getAttribute('hidden'), null);
    assert.deepEqual(await page.evaluate(() => window.alertEntries), [
      { role: 'alert', message: content('Draft A') },
      { role: 'alert', message: content('Draft A') },
    ]);
  },

  'Alert hydrates quietly and resolves external landmark names on the same focused node': async ({
    page,
    mount,
    renderFixture,
  }) => {
    await mount('alert-hydration');
    await page.getByTestId('ssr-root').evaluate(
      (root, markup) => {
        root.innerHTML = markup;
      },
      await renderFixture('alert-ssr'),
    );
    const named = page.getByTestId('named');
    const late = page.getByTestId('late-region');
    const original = await named.elementHandle();
    assert.equal(await named.getAttribute('role'), 'region');
    assert.equal(await late.getAttribute('role'), 'region');
    assert.equal(await named.getAttribute('aria-labelledby'), 'reference');
    assert.equal(await late.getAttribute('aria-labelledby'), 'late');
    await assertBox(page.getByTestId('hydrated-alert').locator('svg'), { width: 16, height: 16 });
    assert.equal(
      await page.getByTestId('hydrated-neutral').locator('.unica-alert-glyph').isHidden(),
      true,
    );
    await page.evaluate(observeAlerts, liveSelector);
    await pausedClock(page);
    await page.getByRole('button', { name: 'Hydrate alerts' }).press('Enter');
    await page.getByRole('region', { name: 'Recovery guide' }).waitFor();
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="late-region"]')?.hasAttribute('role'),
    );
    const within = page.getByRole('button', { name: 'Keep focus here' });
    await within.focus();
    const toggleLabel = page.getByRole('button', { name: 'Toggle label text' });
    await toggleLabel.evaluate((button) => button.click());
    await page.getByRole('region', { name: 'Fallback label' }).waitFor();
    await toggleLabel.evaluate((button) => button.click());
    await page.getByRole('region', { name: 'Recovery guide' }).waitFor();
    await page.getByRole('button', { name: 'Toggle heading' }).evaluate((button) => button.click());
    await page.getByRole('region', { name: 'New heading' }).waitFor();
    await page.getByRole('region', { name: 'Fallback label' }).waitFor();
    await assertFocused(within);
    assert.equal(await named.evaluate((root, node) => root === node, original), true);
    await original.dispose();
    await page.clock.runFor(120);
    assert.deepEqual(await page.evaluate(() => window.alertEntries), []);
    await page.getByRole('button', { name: 'Update message' }).evaluate((button) => button.click());
    await page.clock.runFor(120);
    assert.deepEqual(await page.evaluate(() => window.alertEntries), [
      { role: 'alert', message: 'Import failed Check schema.yml.' },
    ]);
    await assertFocused(within);
  },

  'Alert registers only when a hidden section or native overlay reveals its live node': async ({
    page,
    mount,
  }) => {
    await mount('alert-visibility');
    await pausedClock(page);
    await page.evaluate(observeAlerts, liveSelector);
    const press = (name) => page.getByRole('button', { name }).press('Enter');
    const entries = () => page.evaluate(() => window.alertEntries);
    await press('Update hidden messages');
    await page.clock.runFor(7200);
    assert.deepEqual(await entries(), []);

    const section = page.getByTestId('section-alert').locator(liveSelector);
    await press('Toggle section');
    assert.equal(await section.textContent(), '');
    await page.clock.runFor(100);
    assert.equal(await section.textContent(), 'Section result: latest.');
    await press('Toggle section');
    assert.equal(await section.textContent(), '');

    for (const [id, thing, role] of [
      ['dialog-alert', 'dialog', 'alert'],
      ['popover-alert', 'popover', 'status'],
    ]) {
      const layer = page.getByTestId(id);
      const channel = layer.locator(liveSelector);
      const message = thing[0].toUpperCase() + thing.slice(1) + ' result: latest.';
      await layer.evaluate((element) => {
        element.addEventListener('toggle', (event) => {
          element.dataset.toggleState = event.newState;
        });
      });
      const waitForToggle = (state) =>
        layer.locator('xpath=self::*[@data-toggle-state="' + state + '"]').waitFor({
          state: 'attached',
        });
      const finishExit = () =>
        layer.evaluate((element) => {
          for (const animation of element.getAnimations()) {
            animation.finish();
          }
        });
      await press('Open ' + thing);
      await waitForToggle('open');
      assert.equal(await channel.textContent(), '');
      await page.clock.runFor(150);
      assert.equal(await channel.textContent(), message);
      await press('Close ' + thing);
      await waitForToggle('closed');
      assert.equal(await channel.evaluate((node) => node.checkVisibility()), true);
      assert.equal(await channel.textContent(), '');
      await finishExit();
      await press('Open ' + thing);
      await waitForToggle('open');
      assert.equal(await channel.textContent(), '');
      await page.clock.runFor(150);
      assert.equal(await channel.textContent(), message);
      assert.deepEqual((await entries()).slice(-2), [
        { role, message },
        { role, message },
      ]);
      await press('Close ' + thing);
      await waitForToggle('closed');
      await finishExit();
    }
    assert.equal((await entries()).length, 5);
  },

  'Alert resolves slotted landmark names and preserves input focus inside nested shadow roots':
    async ({ page, mount }) => {
      await mount('alert-shadow');
      const region = page.getByTestId('shadow-region');
      await page.getByRole('region', { name: 'Recovery guide' }).waitFor();
      assert.equal(await region.getAttribute('aria-labelledby'), 'source');
      const original = await region.elementHandle();
      const focus = region.getByRole('button', { name: 'Keep shadow focus' });
      await focus.focus();
      const activate = (name) =>
        page.getByRole('button', { name }).evaluate((button) => button.click());
      await activate('Clear assigned text');
      await page.getByRole('region', { name: 'Fallback label' }).waitFor();
      await activate('Remove assigned heading');
      await activate('Add assigned heading');
      await page.getByRole('region', { name: 'Service guide' }).waitFor();
      await activate('Use embedded heading');
      await page.getByRole('region', { name: 'Component guide' }).waitFor();
      await activate('Update embedded heading');
      await page.getByRole('region', { name: 'Updated component guide' }).waitFor();
      await activate('Clear assigned text');
      await page.getByRole('region', { name: 'Fallback label' }).waitFor();
      await activate('Insert undefined heading element');
      await page.locator('late-alert-heading').waitFor({ state: 'attached' });
      assert.equal(await region.getAttribute('aria-labelledby'), null);
      await activate('Define heading element');
      await page.getByRole('region', { name: 'Upgraded heading' }).waitFor();
      assert.equal(await region.getAttribute('aria-labelledby'), 'source');
      assert.equal(await region.evaluate((node, identity) => node === identity, original), true);
      await original.dispose();
      assert.equal(await focus.evaluate((node) => node.getRootNode().activeElement === node), true);
      assert.equal(await region.locator(liveSelector).count(), 0);

      const field = page.getByRole('textbox', { name: 'Shadow draft' });
      await field.fill('preserved.yml');
      await region.getByRole('button', { name: 'Dismiss shadow notice' }).click();
      assert.equal(await field.evaluate((node) => node.getRootNode().activeElement === node), true);
      assert.equal(await field.inputValue(), 'preserved.yml');
      assert.equal(await page.getByTestId('shadow-requests').textContent(), '1');

      const inputName = page.getByTestId('name-input');
      await page.getByRole('region', { name: 'Draft schema' }).waitFor();
      await inputName.fill('');
      await page.getByRole('region', { name: 'Input fallback' }).waitFor();
      await inputName.fill('Ready schema');
      await page.getByRole('region', { name: 'Ready schema' }).waitFor();
      const valueRegion = page.getByTestId('value-region');
      const valueNode = await valueRegion.elementHandle();
      await activate('Toggle controlled heading');
      await page.getByRole('region', { name: 'Input fallback' }).waitFor();
      assert.equal(await inputName.getAttribute('value'), '');
      assert.equal(await valueRegion.getAttribute('aria-labelledby'), null);
      await activate('Toggle controlled heading');
      await page.getByRole('region', { name: 'Controlled schema' }).waitFor();
      assert.equal(await inputName.getAttribute('value'), 'Controlled schema');
      assert.equal(await valueRegion.getAttribute('aria-labelledby'), 'control-name');
      assert.equal(
        await valueRegion.evaluate((node, identity) => node === identity, valueNode),
        true,
      );
      await valueNode.dispose();
    },

  'Alert paints all statuses on Base and Overlay across all themes with readable text': async ({
    page,
    mount,
  }) => {
    for (const theme of presets) {
      const family = theme.split('-')[0];
      const end = family === 'soft' ? '0px' : '1px';
      const start = family === 'pixel' ? '2px' : end;
      for (const surface of ['base', 'overlay']) {
        await mount('alert-material', { theme, surface });
        const results = await page.getByTestId('paint').evaluate(paintedAlerts);
        const paths = new Set();
        for (const record of results) {
          const key = [theme, surface, record.status].join('/');
          assert.deepEqual(record.actual, record.palette, key);
          assert.deepEqual(record.widths, [start, end], key);
          assert.deepEqual(record.effect, ['none', 'none'], key);
          assert.equal(record.radius, family === 'pixel' ? '0px' : '12px', key);
          assert.ok(record.contrast >= 4.5, key + ' contrast ' + record.contrast.toFixed(2));
          if (record.status !== 'neutral') {
            assert.equal(record.glyphInk, record.actual[1], key);
            assert.ok(record.path, key);
            paths.add(record.path);
          }
        }
        assert.equal(paths.size, 4);
      }
    }
  },

  'Alert adapts inherited ink and close geometry on narrow RTL, coarse, and forced-color surfaces':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await mount('alert-material', {
        theme: 'pixel-dark',
        direction: 'rtl',
        textScale: 120,
        surface: 'overlay',
      });
      for (const [size, glyph, closeSize, padding] of [
        ['s', 14, 24, '12px'],
        ['m', 16, 24, '16px'],
        ['l', 20, 28, '24px'],
      ]) {
        const material = page.getByTestId(size);
        const close = material.getByRole('button', { name: 'Dismiss notice' });
        const icon = material.locator('.unica-alert-glyph > svg:visible');
        await assertBox(close, { width: closeSize, height: closeSize });
        await assertBox(icon, { width: glyph, height: glyph });
        const badge = await getBox(icon);
        const message = await getBox(material.locator('.unica-alert-content'));
        const button = await getBox(close);
        assert.ok(button.x + button.width <= message.x && message.x + message.width <= badge.x);
        assert.deepEqual(
          await material.evaluate((node) => {
            const style = getComputedStyle(node);
            return [
              style.paddingTop,
              style.borderLeftWidth,
              style.borderRightWidth,
              node.scrollWidth === node.clientWidth,
            ];
          }),
          [padding, '1px', '2px', true],
        );
      }

      for (const id of ['adapter-null', 'component-null', 'custom-glyph']) {
        await assertBox(page.getByTestId(id).locator('svg:visible'), { width: 16, height: 16 });
      }
      assert.equal(
        await page.getByTestId('neutral-null').locator('.unica-alert-glyph').isHidden(),
        true,
      );

      const styles = (id) =>
        page.getByTestId(id).evaluate((node) => {
          const style = getComputedStyle(node);
          return { color: style.color, background: style.backgroundColor };
        });
      assert.equal((await styles('inherit-link')).color, (await styles('context')).color);
      assert.equal((await styles('restored-link')).color, (await styles('inherit-link')).color);
      assert.notEqual((await styles('nested-link')).color, (await styles('inherit-link')).color);
      assert.notEqual((await styles('card-link')).color, (await styles('inherit-link')).color);
      assert.notDeepEqual(await styles('inherit-code'), await styles('explicit-code'));
      assert.equal((await styles('button-code')).color, (await styles('neutral-action')).color);
      assert.equal(
        (await styles('neutral-icon-action')).color,
        (await styles('neutral-action')).color,
      );
      assert.notDeepEqual(await styles('neutral-action'), await styles('outside-neutral-action'));
      assert.deepEqual(await styles('explicit-action'), await styles('outside-explicit-action'));
      assert.deepEqual(await styles('primary-action'), await styles('outside-primary-action'));
      const outline = (id) =>
        page.getByTestId(id).evaluate((node) => getComputedStyle(node).outlineColor);
      await page.getByTestId('inherit-link').focus();
      const contextualFocus = await outline('inherit-link');
      for (const id of ['outside-link', 'card-link', 'overlay-link']) {
        await page.getByTestId(id).focus();
        assert.notEqual(await outline(id), contextualFocus, id);
      }

      const close = page.getByTestId('m').getByRole('button', { name: 'Dismiss notice' });
      const readClose = () =>
        close.evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            background: style.backgroundColor,
            outline: style.outlineWidth,
            motion: style.transitionDuration,
          };
        });
      const rest = await readClose();
      assert.equal(rest.motion, '0s');
      await close.focus();
      assert.equal((await readClose()).outline, '2px');
      await close.hover();
      const hovered = await readClose();
      assert.notEqual(hovered.background, rest.background);
      assert.equal(hovered.outline, '2px');
      await page.mouse.down();
      assert.notEqual((await readClose()).background, hovered.background);
      await page.mouse.up();

      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
      await page.keyboard.press('Tab');
      await close.focus();
      assert.equal((await readClose()).outline, '2px');
      assert.equal((await readClose()).motion, '0s');
      assert.equal(
        await page.getByTestId('m').evaluate((node) => {
          const style = getComputedStyle(node);
          return (
            style.borderTopWidth === '1px' &&
            style.borderTopColor === style.color &&
            getComputedStyle(node.querySelector('svg')).color === style.color
          );
        }),
        true,
      );

      const device = await page.context().newCDPSession(page);
      await device.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
      await assertBox(close, { width: 44, height: 44 });
      await device.detach();
    },
};

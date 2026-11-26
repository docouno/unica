import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { assertFocused, resetForm, submitForm } from '../helpers.mjs';

const button = (scope, name) => scope.getByRole('button', { name, exact: true });
const entries = (form) => form.evaluate((node) => [...new FormData(node)]);
const expanded = (trigger) => trigger.getAttribute('aria-expanded');
const near = (a, b, message) =>
  assert.ok(Math.abs(a - b) <= 2, message ?? `${a} differs from ${b}`);

async function showInPort(trigger, nested) {
  await trigger.evaluate((node, nestedPort) => {
    if (nestedPort) {
      const port = node.closest('[data-testid="scrollport"]');
      port.scrollTop += node.getBoundingClientRect().top - port.getBoundingClientRect().top - 145;
    } else {
      window.scrollBy({ top: node.getBoundingClientRect().top - 215, behavior: 'instant' });
    }
  }, nested);
}

async function measure(trigger) {
  return trigger.evaluate((node) => {
    const port = node.closest('[data-testid="scrollport"]');
    return {
      y: node.getBoundingClientRect().top,
      relative: node.getBoundingClientRect().top - port.getBoundingClientRect().top,
      scroll: port.scrollTop,
      window: window.scrollY,
    };
  });
}

async function readMaterial(row, png) {
  return row.evaluate(async (node, base64) => {
    const parsed = new Image();
    parsed.src = 'data:image/png;base64,' + base64;
    await parsed.decode();
    const canvas = document.createElement('canvas');
    canvas.width = parsed.width;
    canvas.height = parsed.height;
    const pixels = canvas.getContext('2d', { willReadFrequently: true });
    pixels.drawImage(parsed, 0, 0);
    const middle = Math.floor(parsed.height / 2);
    const outside = pixels.getImageData(Math.floor(parsed.width / 2), middle, 1, 1).data;
    const style = getComputedStyle(node);
    const ink = (color) => {
      pixels.clearRect(0, 0, 1, 1);
      pixels.fillStyle = color;
      pixels.fillRect(0, 0, 1, 1);
      return pixels.getImageData(0, 0, 1, 1).data;
    };
    const luminance = (color) =>
      Array.from(color)
        .slice(0, 3)
        .reduce((sum, value, index) => {
          const channel = value / 255;
          const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          return sum + linear * [0.2126, 0.7152, 0.0722][index];
        }, 0);
    const ratio = (color) => {
      const bg = luminance(outside);
      const fg = luminance(ink(color));
      return (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05);
    };
    return {
      height: node.getBoundingClientRect().height,
      text: ratio(style.color),
      ring: ratio(style.outlineColor),
      outline: style.outlineWidth,
      caret: getComputedStyle(node.querySelector('svg')).transform,
    };
  }, Buffer.from(png).toString('base64'));
}

export default {
  'Disclosure geometry, contrast and RTL caret survive all six themes and both surfaces': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await mount('disclosure', { direction: 'rtl', reducedMotion: 'reduce' });
    for (const theme of [
      'soft-dark',
      'soft-light',
      'frost-dark',
      'frost-light',
      'pixel-dark',
      'pixel-light',
    ]) {
      await page.evaluate((preset) => {
        document.documentElement.dataset.theme = preset;
      }, theme);
      for (const surface of ['base', 'overlay']) {
        const host = page.getByTestId(surface + '-material');
        const row = button(host, 'M details');
        const heights = await host
          .getByRole('button')
          .evaluateAll((nodes) => nodes.map((node) => node.offsetHeight));
        assert.deepEqual(heights, [30, 40, 48], theme + ' ' + surface);
        await row.focus();
        const measured = await readMaterial(row, await row.screenshot());
        assert.equal(measured.outline, '2px');
        assert.equal(measured.caret, 'matrix(0, 1, -1, 0, 0, 0)');
        assert.ok(measured.text >= 4.5, `${theme} ${surface} text ${measured.text.toFixed(2)}`);
        assert.ok(measured.ring >= 3, `${theme} ${surface} focus ${measured.ring.toFixed(2)}`);
      }
    }

    const touch = await page.context().newCDPSession(page);
    try {
      await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      const small = button(page.getByTestId('base-material'), 'S details');
      assert.ok(await small.evaluate((row) => row.offsetHeight >= 44));
    } finally {
      await touch.detach();
    }
  },

  'Disclosure keeps a mounted form draft and returns focus to the last external trigger': async ({
    page,
    mount,
  }) => {
    await mount('disclosure');
    const form = page.getByRole('form', { name: 'keep' });
    const alternate = button(form, 'Alternate details');
    const first = button(form, 'Details');
    const close = button(form, 'Close inside');
    const draft = form.getByRole('textbox', { name: 'Draft' });
    const panel = page.getByTestId('keep-panel');

    await alternate.press('Enter');
    await panel.waitFor({ state: 'hidden' });
    assert.equal(await panel.evaluate((node) => getComputedStyle(node).display), 'none');
    await alternate.press('Space');
    assert.equal(await panel.evaluate((node) => getComputedStyle(node).display), 'grid');
    await draft.fill('changed reply');
    await close.press('Enter');
    await assertFocused(alternate);
    assert.equal(await expanded(first), 'false');
    assert.equal(await form.getAttribute('data-submitted'), null);
    assert.deepEqual(await entries(form), [['draft', 'changed reply']]);
    assert.deepEqual(await submitForm(form, button(form, 'Send')), [['draft', 'changed reply']]);
    await resetForm(form);
    assert.equal(await expanded(alternate), 'false');
    await alternate.press('Enter');
    assert.equal(await draft.inputValue(), 'original');
    await button(form, 'Remove alternate and disable first').press('Enter');
    await close.press('Enter');
    await assertFocused(page.getByTestId('keep-root'));
    assert.equal(await expanded(first), 'false');
  },

  'Disclosure keeps its panel ID while lazy and exit mounting change the native fields': async ({
    page,
    mount,
  }) => {
    await mount('disclosure');
    for (const policy of ['lazy', 'discard']) {
      const form = page.getByRole('form', { name: policy });
      const trigger = button(form, 'Details');
      const panel = page.getByTestId(policy + '-panel');
      const id = await panel.getAttribute('id');
      assert.equal(await panel.evaluate((node) => getComputedStyle(node).display), 'none');
      assert.equal(await trigger.getAttribute('aria-controls'), id);
      assert.deepEqual(await entries(form), []);
      await trigger.press('Enter');
      await form.getByRole('textbox', { name: 'Draft' }).fill('edited');
      await trigger.press('Space');
      await panel.waitFor({ state: 'hidden' });
      assert.deepEqual(await entries(form), policy === 'lazy' ? [['draft', 'edited']] : []);
      assert.equal(await panel.getAttribute('id'), id);
      await trigger.press('Enter');
      assert.equal(
        await form.getByRole('textbox', { name: 'Draft' }).inputValue(),
        policy === 'lazy' ? 'edited' : 'original',
      );
    }
  },

  'Disclosure leaves constraint validation to the form owner': async ({ page, mount }) => {
    await mount('disclosure', { reducedMotion: 'reduce' });
    const form = page.getByRole('form', { name: 'validation' });
    const trigger = button(form, 'Required details');
    const reveal = form.getByRole('checkbox', { name: 'Reveal invalid field' });
    await reveal.focus();
    assert.equal(await form.evaluate((node) => node.checkValidity()), false);
    await assertFocused(reveal);
    assert.equal(await expanded(trigger), 'false');
    await reveal.check();
    await form.evaluate((node) => node.requestSubmit());
    const input = form.getByRole('textbox', { name: 'Required draft' });
    await assertFocused(input);
    assert.equal(await expanded(trigger), 'true');
    assert.equal(await form.getAttribute('data-submitted'), null);
    await input.fill('complete');
    await button(form, 'Validate form').press('Enter');
    assert.equal(await form.getAttribute('data-submitted'), 'true');
  },

  'Accordion keeps native tab order, keyboard editing and an independent heading action': async ({
    page,
    mount,
  }) => {
    await mount('disclosure', { reducedMotion: 'reduce' });
    const headings = page.getByRole('region', { name: 'Headings' });
    const first = button(headings, 'First heading');
    const second = button(headings, 'Second heading');
    const copy = button(headings, 'Copy note');
    const draft = headings.getByRole('textbox', { name: 'Heading draft' });
    const itemA = page.getByTestId('item-a');
    const itemB = page.getByTestId('item-b');

    assert.equal(
      await headings.getByRole('heading', { level: 4, name: 'First heading' }).count(),
      1,
    );
    assert.equal(await headings.getByRole('region', { name: 'First heading' }).count(), 1);
    assert.equal(
      await itemA.evaluate((node) => getComputedStyle(node).borderBlockStartWidth),
      '0px',
    );
    assert.equal(
      await itemB.evaluate((node) => getComputedStyle(node).borderBlockStartWidth),
      '1px',
    );
    await button(headings, 'Toggle first item').press('Enter');
    assert.equal(await button(headings, 'Hidden first').count(), 0);
    assert.equal(
      await itemA.evaluate((node) => getComputedStyle(node).borderBlockStartWidth),
      '1px',
    );
    await button(headings, 'Toggle dividers').press('Enter');
    assert.equal(
      await itemB.evaluate((node) => getComputedStyle(node).borderBlockStartWidth),
      '0px',
    );

    await first.focus();
    for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
      assert.ok(
        await first.evaluate(
          (node, key) =>
            node.dispatchEvent(
              new KeyboardEvent('keydown', {
                key,
                bubbles: true,
                cancelable: true,
              }),
            ),
          key,
        ),
      );
      await first.press(key);
      await assertFocused(first);
      assert.equal(await expanded(first), 'true');
    }
    for (const next of [copy, draft, second]) {
      await page.keyboard.press('Tab');
      await assertFocused(next);
    }
    await page.keyboard.press('Shift+Tab');
    await assertFocused(draft);
    await draft.press('Home');
    await draft.press('ArrowRight');
    await draft.press('X');
    assert.equal(await draft.inputValue(), 'aXbcdef');
    await copy.press('Space');
    assert.equal(await expanded(first), 'true');
    assert.equal(await headings.locator('output').textContent(), '1');
    await second.press('Enter');
    assert.equal(await expanded(first), 'false');
    assert.equal(await expanded(second), 'true');
    await second.press('Space');
    assert.equal(await expanded(second), 'false');
    await page.keyboard.press('Shift+Tab');
    await assertFocused(copy);
  },

  'Disclosure reverses at the rendered height and settles when the theme motion stops': async ({
    page,
    mount,
  }) => {
    await mount('disclosure', { theme: 'frost-dark' });
    const panel = page.getByTestId('discard-panel');
    const form = page.getByRole('form', { name: 'discard' });
    const trigger = button(form, 'Details');
    const close = button(form, 'Close inside');
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--_disclosure-duration', '.6s'),
    );
    await panel.evaluate((node) => {
      node.style.transform = 'scale(.5)';
    });
    await trigger.press('Enter');
    const end = await panel.evaluate((node) => {
      const animation = node.getAnimations()[0];
      const height = Number.parseFloat(animation.effect.getKeyframes().at(-1).height);
      animation.finish();
      return height;
    });
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="discard-panel"]').getAnimations().length,
    );
    near(await panel.evaluate((node) => Number.parseFloat(getComputedStyle(node).height)), end);
    await form.getByRole('textbox', { name: 'Draft' }).fill('mid-flight');
    await close.press('Enter');

    const closing = await panel.evaluate((node) => {
      const animation = node.getAnimations()[0];
      animation.pause();
      animation.currentTime = 160;
      return {
        height: Number.parseFloat(getComputedStyle(node).height),
        inert: node.inert,
        duration: animation.effect.getTiming().duration,
      };
    });
    assert.equal(closing.inert, true);
    assert.equal(closing.duration, 480);
    assert.deepEqual(await entries(form), [['draft', 'mid-flight']]);
    await assertFocused(trigger);
    await trigger.press('Enter');
    const opening = await panel.evaluate((node) =>
      Number.parseFloat(node.getAnimations()[0].effect.getKeyframes()[0].height),
    );
    near(opening, closing.height);
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--_disclosure-duration', '0s'),
    );
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="discard-panel"]').getAnimations().length,
    );
    assert.equal(await expanded(trigger), 'true');
    assert.equal(await panel.evaluate((node) => getComputedStyle(node).overflow), 'visible');
    assert.deepEqual(await entries(form), [['draft', 'mid-flight']]);
    await trigger.press('Space');
    assert.equal(await panel.evaluate((node) => node.hidden && node.inert), true);
    assert.deepEqual(await entries(form), []);
  },

  'Disclosure observes native fieldset exceptions and loading Button availability': async ({
    page,
    mount,
  }) => {
    await mount('disclosure');
    const form = page.getByRole('form', { name: 'blocked' });
    const legend = button(form, 'Legend trigger');
    const disabled = button(form, 'Disabled fieldset trigger');
    const loading = button(form, 'Loading trigger');
    assert.equal(await legend.isEnabled(), true);
    assert.equal(await disabled.isDisabled(), true);
    await legend.press('Enter');
    await page.keyboard.press('Tab');
    await assertFocused(loading);
    assert.equal(await loading.getAttribute('aria-busy'), 'true');
    await page.keyboard.press('Space');
    await disabled.evaluate((node) =>
      node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    );
    assert.equal(await expanded(loading), 'false');
  },

  'Disclosure settles a closing draft when React Activity disconnects layout effects': async ({
    page,
    mount,
  }) => {
    await mount('disclosure');
    const form = page.getByRole('form', { name: 'Activity draft' });
    const trigger = button(form, 'Activity details');
    const panel = page.getByTestId('activity-panel');
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--_disclosure-duration', '1s'),
    );
    await trigger.press('Enter');
    await panel.evaluate((node) => node.getAnimations()[0].pause());
    await button(page, 'Hide activity').press('Enter');
    await button(page, 'Show activity').press('Enter');
    await panel.waitFor({ state: 'hidden' });
    assert.equal(await expanded(trigger), 'false');
    assert.equal(
      await panel.evaluate(
        (node) => node.hidden && node.inert && node.getAnimations().length === 0,
      ),
      true,
    );
    assert.deepEqual(await entries(form), []);
  },

  'Disclosure keeps a returned trailing trigger visible as a long panel closes': async ({
    page,
    mount,
  }) => {
    await mount('disclosure');
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--_disclosure-duration', '400ms'),
    );
    const port = page.getByTestId('trailing-port');
    const trigger = button(port, 'Trailing details trigger');
    const close = button(port, 'Close long details');
    const panel = page.getByTestId('trailing-panel');
    const relative = () =>
      trigger.evaluate(
        (node) =>
          node.getBoundingClientRect().top -
          node.closest('[data-testid="trailing-port"]').getBoundingClientRect().top,
      );
    await port.evaluate((node) => {
      node.style.overflowAnchor = 'none';
    });
    await trigger.press('Enter');
    await panel.evaluate((node) => node.getAnimations()[0].finish());
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="trailing-panel"]').getAnimations().length,
    );
    await trigger.evaluate((node) => {
      const scroll = node.closest('[data-testid="trailing-port"]');
      scroll.scrollTop +=
        node.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 145;
    });
    await close.press('Enter');
    await assertFocused(trigger);
    await panel.waitFor({ state: 'hidden' });
    assert.ok((await relative()) >= -1);
    assert.ok((await relative()) < 260);
  },

  'Simultaneous nested closure returns shadow focus outside the outer panel': async ({
    page,
    mount,
  }) => {
    await mount('disclosure', { reducedMotion: 'reduce' });
    const external = page.getByRole('textbox', { name: 'Outside shadow' });
    const draft = page.getByRole('textbox', { name: 'Deep draft' });
    const outer = button(page, 'Outer shadow trigger');
    const close = button(page, 'Close externally');
    await draft.focus();
    await close.evaluate((node) => node.click());
    assert.equal(await outer.evaluate((node) => node.getRootNode().activeElement === node), true);
    assert.equal(
      await outer.evaluate((node) => node.getRootNode().host.getAttribute('data-inner-focus')),
      null,
    );
    await button(page, 'Open externally').evaluate((node) => node.click());
    await external.focus();
    const scroll = await page.evaluate(() => window.scrollY);
    await close.evaluate((node) => node.click());
    await assertFocused(external);
    assert.equal(await page.evaluate(() => window.scrollY), scroll);
  },

  'Disclosure hydrates the existing panel nodes without enabling a second native command': async ({
    page,
    mount,
    renderFixture,
  }) => {
    await mount('disclosure-hydration', { reducedMotion: 'reduce' });
    const host = page.getByTestId('hydrate-disclosure');
    await host.evaluate(
      (node, html) => {
        node.innerHTML = html;
      },
      await renderFixture('disclosure-ssr'),
    );
    const first = button(host, 'Reveal report');
    const second = button(host, 'Second report trigger');
    const native = button(host, 'Native report trigger');
    const visible = button(host, 'Visible report');
    const id = await first.getAttribute('aria-controls');
    assert.notEqual(await visible.getAttribute('aria-controls'), id);
    for (const trigger of [first, second, native]) {
      assert.equal(await trigger.getAttribute('aria-controls'), id);
      assert.equal(
        await trigger.evaluate((node) =>
          node.matches('[command], [commandfor], [popovertarget], [popovertargetaction]'),
        ),
        false,
      );
    }
    const original = await first.evaluateHandle((node) =>
      document.getElementById(node.getAttribute('aria-controls')),
    );
    assert.ok(
      await original.evaluate((node) => node.hidden && node.inert && !node.querySelector('input')),
    );
    await host.getByRole('textbox', { name: 'Visible draft' }).fill('before hydration');
    await host.evaluate((node) => node.dispatchEvent(new Event('hydrate-disclosure')));
    for (const trigger of [first, second, native]) {
      await trigger.press('Enter');
      assert.equal(await expanded(trigger), 'false');
      assert.equal(
        await host.locator('#unrelated-overlay').evaluate((node) => node.matches(':popover-open')),
        false,
      );
    }
    await button(host, 'Accept disclosure').press('Enter');
    await second.press('Enter');
    assert.equal(await expanded(first), 'true');
    assert.ok(
      await original.evaluate((node) => node.ownerDocument.getElementById(node.id) === node),
    );
    await original.dispose();
    assert.equal(
      await host.locator('#unrelated-overlay').evaluate((node) => node.matches(':popover-open')),
      false,
    );
    assert.equal(
      await host.getByRole('textbox', { name: 'Visible draft' }).inputValue(),
      'before hydration',
    );
  },

  'Exclusive replacement holds the activated header in nested and window scrollports': async ({
    page,
    mount,
  }) => {
    for (const { nested, theme } of [
      { nested: true, theme: 'soft-dark' },
      { nested: false, theme: 'soft-dark' },
      { nested: true, theme: 'pixel-dark' },
    ]) {
      await mount('disclosure-scroll', { theme });
      if (!nested) {
        await button(page, 'Use window').press('Enter');
      }
      if (theme === 'soft-dark') {
        await page.evaluate(() =>
          document.documentElement.style.setProperty('--_disclosure-duration', '400ms'),
        );
      }
      const alpha = page.getByTestId('alpha-panel');
      const beta = button(page, 'Beta section');
      const port = page.getByTestId('scrollport');
      const draft = page.getByRole('textbox', { name: 'Alpha draft' });
      await port.evaluate((node) => node.style.setProperty('overflow-anchor', 'auto'));
      await draft.focus();
      await showInPort(beta, nested);
      const before = await measure(beta);
      await beta.evaluate((node) => node.click());
      await assertFocused(beta);
      if (theme === 'soft-dark') {
        await page.waitForTimeout(90);
        const during = await measure(beta);
        near(nested ? during.relative : during.y, nested ? before.relative : before.y);
      }
      await alpha.waitFor({ state: 'hidden' });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="scrollport"]').style.overflowAnchor === 'auto',
      );
      const after = await measure(beta);
      near(
        nested ? after.relative : after.y,
        nested ? before.relative : before.y,
        theme + ' finished header position',
      );
      if (nested) {
        near(after.window, before.window);
      }
    }
  },

  'Exclusive replacement releases the scroll owner when Activity hides the closing panel': async ({
    page,
    mount,
  }) => {
    for (const range of ['short', 'long']) {
      await mount('disclosure-scroll');
      const beta = button(page, 'Beta section');
      const alpha = page.getByTestId('alpha-panel');
      const port = page.getByTestId('scrollport');
      await button(page, 'Interrupt with ' + range + ' range').press('Enter');
      await page.evaluate(() =>
        document.documentElement.style.setProperty('--_disclosure-duration', '400ms'),
      );
      await port.evaluate((node) => {
        node.style.overflowAnchor = 'auto';
      });
      await page.getByRole('textbox', { name: 'Alpha draft' }).focus();
      await showInPort(beta, true);
      const before = await measure(beta);
      await beta.evaluate((node) => node.click());
      await assertFocused(beta);
      await alpha.waitFor({ state: 'hidden' });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="scrollport"]').style.overflowAnchor === 'auto',
      );
      const after = await measure(beta);
      near(
        after.relative,
        before.relative,
        range + ' range after Activity hides the closing panel',
      );
      near(after.window, before.window);
    }
  },

  'Exclusive replacement leaves external scroll alone when the viewport range is unchanged':
    async ({ page, mount }) => {
      await mount('disclosure-scroll');
      await button(page, 'Grow opening panel').press('Enter');
      const beta = button(page, 'Beta section');
      const draft = page.getByRole('textbox', { name: 'Alpha draft' });
      await page.evaluate(() => {
        document.documentElement.style.setProperty('--_disclosure-duration', '2s');
        document.scrollingElement.style.overflowAnchor = 'auto';
      });
      await draft.focus();
      await showInPort(beta, true);
      const start = await page.evaluate(() => {
        window.scrollTo(0, document.scrollingElement.scrollHeight);
        return window.scrollY;
      });
      await beta.evaluate((node) => node.click());
      await assertFocused(beta);
      await page.waitForFunction(
        () => document.querySelector('[data-testid="beta-panel"]').offsetHeight > 100,
      );
      const desired = await page.evaluate(() => {
        window.scrollBy({ top: -40, behavior: 'instant' });
        return window.scrollY;
      });
      near(desired, start - 40);
      await page.waitForFunction(() => document.scrollingElement.style.overflowAnchor === 'auto');
      near(await page.evaluate(() => window.scrollY), desired);
    },

  'Exclusive replacement respects a manual scroll while that scrollport shrinks': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 900, height: 1050 });
    await mount('disclosure-scroll');
    await button(page, 'Use shrinking range').press('Enter');
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--_disclosure-duration', '600ms'),
    );
    const beta = button(page, 'Beta section');
    const port = page.getByTestId('shrinking-port');
    await beta.focus();
    await port.evaluate((node) => {
      window.scrollTo(0, document.scrollingElement.scrollHeight);
      node.scrollTop = node.scrollHeight;
    });
    await beta.press('Enter');
    await page.waitForFunction(
      () => document.querySelector('[data-testid="beta-panel"]').offsetHeight > 100,
    );
    const desired = await port.evaluate((node) => {
      node.scrollTop -= 40;
      return node.scrollTop;
    });
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="shrinking-port"]').style.overflowAnchor === 'auto',
    );
    const position = await port.evaluate((node) => ({
      actual: node.scrollTop,
      max: node.scrollHeight - node.clientHeight,
    }));
    near(position.actual, Math.min(desired, position.max));
  },

  'Exclusive replacement releases native scrollbars inside shadows and under scaling': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 900, height: 1050 });
    for (const [placement, legacyZoom] of [
      ['shadow', false],
      ['scaled', false],
      ['zoomed', false],
      ['zoomed', true],
    ]) {
      await mount('disclosure-scroll');
      const selectPort = button(page, 'Use shrinking range');
      await selectPort.evaluate((node, next) => {
        node.dataset.placement = next;
      }, placement);
      await selectPort.press('Enter');
      if (legacyZoom) {
        await page.evaluate(() => {
          Object.defineProperty(Element.prototype, 'currentCSSZoom', {
            configurable: true,
            value: undefined,
          });
        });
      }
      await page.evaluate(() =>
        document.documentElement.style.setProperty('--_disclosure-duration', '4s'),
      );
      const port = page.getByTestId('shrinking-port');
      const beta = button(port, 'Beta section');
      await beta.focus();
      await port.evaluate((node) => {
        window.scrollTo(0, document.scrollingElement.scrollHeight);
        node.scrollTop = node.scrollHeight;
      });
      await beta.press('Enter');
      await port
        .locator('[data-testid="beta-panel"]')
        .evaluate((node) => (node.getAnimations()[0].currentTime = 180));
      const thumb = await port.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const thumbHeight = node.clientHeight ** 2 / node.scrollHeight;
        const maximum = node.scrollHeight - node.clientHeight;
        const localY =
          (node.scrollTop / maximum) * (node.clientHeight - thumbHeight) + thumbHeight / 2;
        return {
          x: rect.right - 12 * (rect.width / node.offsetWidth),
          y: rect.top + (node.clientTop + localY) * (rect.height / node.offsetHeight),
          anchor: node.style.overflowAnchor,
        };
      });
      assert.equal(thumb.anchor, 'none');
      await page.mouse.move(thumb.x, thumb.y);
      await page.mouse.down();
      try {
        assert.equal(await port.evaluate((node) => node.style.overflowAnchor), 'auto', placement);
      } finally {
        await page.mouse.up();
      }
    }
  },

  'Exclusive replacement stops anchoring on user scroll and ignores late controlled acceptance':
    async ({ page, mount }) => {
      await mount('disclosure-scroll');
      const alpha = page.getByTestId('alpha-panel');
      const first = button(page, 'Alpha section');
      const beta = button(page, 'Beta section');
      const draft = page.getByRole('textbox', { name: 'Alpha draft' });
      await button(page, 'Reject proposals').press('Enter');
      await showInPort(beta, true);
      await beta.click();
      const rejectedAt = JSON.parse(await page.getByTestId('proposal').textContent());
      await assertFocused(beta);
      assert.equal(rejectedAt.focus, 'Beta section');
      const rejected = await measure(beta);
      near(rejected.scroll, rejectedAt.scroll[0]);
      near(rejected.window, rejectedAt.scroll[1]);
      assert.equal(await expanded(first), 'true');

      await button(page, 'Defer proposals').press('Enter');
      await draft.focus();
      await showInPort(beta, true);
      await beta.evaluate((node) => node.click());
      await assertFocused(draft);
      await button(page, 'Apply deferred proposal').evaluate((node) => node.click());
      await assertFocused(first);
      await alpha.waitFor({ state: 'hidden' });

      await mount('disclosure-scroll');
      await page.evaluate(() =>
        document.documentElement.style.setProperty('--_disclosure-duration', '450ms'),
      );
      await draft.focus();
      await showInPort(beta, true);
      await beta.evaluate((node) => node.click());
      const wantedScroll = await page.getByTestId('scrollport').evaluate((node) => {
        node.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
        node.scrollTop = 100;
        return node.scrollTop;
      });
      await alpha.waitFor({ state: 'hidden' });
      near((await measure(beta)).scroll, wantedScroll);
    },
};

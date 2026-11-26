import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox, pressKeys, submitForm } from '../helpers.mjs';

const face = '.unica-kbd-face';
const group = '.unica-kbd-group';
const separator = '.unica-kbd-separator';
const tolerance = 0.1;

function near(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: got ${actual}, expected ${expected}`,
  );
}

async function motion(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return [style.animationName, style.transitionDuration, node.getAnimations().length];
  });
}

async function paint(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      ink: style.color,
      background: style.backgroundColor,
      border: style.borderTopColor,
      radius: style.borderTopLeftRadius,
      shadow: style.boxShadow,
    };
  });
}

async function contrastRatios(sample) {
  const screenshot = await sample.screenshot({
    animations: 'disabled',
    scale: 'css',
    style: `${face} { visibility: hidden !important; } ${separator} { color: transparent !important; }`,
  });
  return sample.evaluate(
    async (node, { png, face, separator }) => {
      const bitmap = new Image();
      bitmap.src = `data:image/png;base64,${png}`;
      await bitmap.decode();

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const pixels = canvas.getContext('2d', { willReadFrequently: true });
      pixels.drawImage(bitmap, 0, 0);
      const origin = node.getBoundingClientRect();

      const luminance = (rgb) => {
        const [r, g, b] = rgb.map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const context = document.createElement('canvas').getContext('2d');
      return [...node.querySelectorAll(`${face}, ${separator}`)].map((text) => {
        const bounds = text.getBoundingClientRect();
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = getComputedStyle(text).color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
        const foreground = [r, g, b];
        const ratios = [];

        // Sample underneath each text box, including the gradient across an accent action.
        for (const x of [0.2, 0.5, 0.8]) {
          for (const y of [0.2, 0.5, 0.8]) {
            const background = [
              ...pixels.getImageData(
                Math.floor(bounds.left - origin.left + x * bounds.width),
                Math.floor(bounds.top - origin.top + y * bounds.height),
                1,
                1,
              ).data,
            ].slice(0, 3);
            const ink = foreground.map(
              (channel, index) => (channel * alpha + background[index] * (255 - alpha)) / 255,
            );
            const [dark, light] = [luminance(ink), luminance(background)].sort((a, b) => a - b);
            ratios.push((light + 0.05) / (dark + 0.05));
          }
        }
        return Math.min(...ratios);
      });
    },
    { png: screenshot.toString('base64'), face, separator },
  );
}

export default {
  'Kbd inherits line height and aligns mixed SVG and text at both text scales': async ({
    page,
    mount,
  }) => {
    for (const textScale of [100, 120]) {
      await mount('kbd', { theme: 'frost-dark', textScale });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const scale = textScale / 100;
      for (const size of ['caption-l', 'body-s', 'body-m', 'body-l', 'heading-m']) {
        const typography = page.getByTestId(size);
        const rows = typography.locator(':scope > div');
        const metrics = await typography.evaluate((node) => {
          const { fontSize, lineHeight } = getComputedStyle(node);
          return { font: parseFloat(fontSize), line: parseFloat(lineHeight) };
        });
        const { height } = await getBox(rows.first());
        for (const row of await rows.all().then((items) => items.slice(1))) {
          await assertBox(row, { height }, { tolerance });
          const cap = row.locator('kbd');
          await assertBox(cap, { width: metrics.line, height: metrics.line }, { tolerance });
          const fontSize = await cap
            .locator(face)
            .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
          near(fontSize, 0.9 * Math.min(metrics.font, metrics.line - 4), `${size} face font`);
        }
      }

      const sizes = page.getByTestId('explicit-sizes').locator(':scope > kbd');
      for (const [index, base] of [20, 24, 28].entries()) {
        const side = base * scale;
        await assertBox(sizes.nth(index), { width: side, height: side }, { tolerance });
      }
      const enter = await assertBox(sizes.nth(3), { height: 24 * scale }, { tolerance });
      assert.ok(enter.width > enter.height, 'Long key names grow inline');

      const axis = await page
        .getByTestId('mixed')
        .locator(face)
        .evaluate((node) => {
          const glyph = node.querySelector('svg');
          const letter = node.querySelector('span');
          const probe = document.createElement('span');
          // The empty inline-block's bottom is the text baseline; the top is the cap height.
          probe.style.cssText = 'display:inline-block;vertical-align:baseline;width:0;height:1cap';
          node.append(probe);
          const [graphicBox, letterBox, capBox] = [glyph, letter, probe].map((part) =>
            part.getBoundingClientRect(),
          );
          probe.remove();
          return {
            glyphCenter: graphicBox.y + graphicBox.height / 2,
            letterCenter: capBox.y + capBox.height / 2,
            gap: letterBox.left - graphicBox.right,
            fontSize: parseFloat(getComputedStyle(node).fontSize),
          };
        });
      near(axis.glyphCenter, axis.letterCenter, 'SVG follows the capital-height axis');
      near(axis.gap, 0.125 * axis.fontSize, 'Mixed hint glyph gap');

      const nestedKeys = page.getByTestId('nested').locator('kbd');
      for (const [index, base] of [28, 20, 28].entries()) {
        await assertBox(nestedKeys.nth(index), { height: base * scale }, { tolerance });
      }
    }
  },

  'Kbd exposes key names, localized replacements and chord separators to accessibility APIs':
    async ({ page, mount }) => {
      await mount('kbd');
      assert.match(await page.getByTestId('plain').ariaSnapshot(), /Page Down/u);
      const localized = page.getByTestId('localized');
      assert.equal(await localized.getAttribute('lang'), 'fr');
      assert.equal(await localized.locator('svg').isVisible(), true);
      assert.equal(await localized.locator('svg').getAttribute('aria-hidden'), 'true');
      const localizedSnapshot = await localized.ariaSnapshot();
      assert.equal(localizedSnapshot.match(/Commande/gu)?.length, 1);
      assert.doesNotMatch(localizedSnapshot, /\bCommand\b/u);
      assert.match(await page.getByTestId('mixed').ariaSnapshot(), /Command \+ K/u);
      const compact = page.getByTestId('compact');
      assert.equal(await compact.locator(separator).count(), 0);
      assert.match(await compact.ariaSnapshot(), /Command plus K/u);
      const sequence = await page.getByTestId('sequence').ariaSnapshot();
      assert.match(sequence, /Enter then Return/u);
      assert.equal(sequence.match(/\bthen\b/gu)?.length, 1);
      assert.doesNotMatch(sequence, /Tab|Space/u);
      const semantics = await page.getByTestId('semantics').ariaSnapshot();
      assert.doesNotMatch(semantics, /Duplicate Command|Esc/u);
      assert.equal(await page.getByTestId('hidden').isVisible(), false);
    },

  'Kbd leaves Tab order, activation, availability and form submission with the owner': async ({
    page,
    mount,
  }) => {
    await mount('kbd');
    const form = page.getByTestId('hint-form');
    const before = form.getByRole('button', { name: 'Before hint' });
    const action = form.getByRole('button', { name: 'Run command' });
    const save = form.getByRole('button', { name: 'Save document' });
    const cap = action.locator('kbd');
    const count = form.getByTestId('activations');

    await before.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(action);
    await pressKeys(page, 'Meta+k');
    assert.equal(await count.textContent(), '0');
    assert.equal(await action.getAttribute('aria-keyshortcuts'), null);
    await pressKeys(page, 'Enter');
    assert.equal(await count.textContent(), '1');
    await pressKeys(page, 'Space');
    assert.equal(await count.textContent(), '2');
    await cap.click();
    assert.equal(await count.textContent(), '3');
    await pressKeys(page, 'Tab');
    await assertFocused(save);

    const state = form.getByLabel('Action state');
    const readyBox = await getBox(action);
    const capBox = await getBox(cap);
    const isPainted = () =>
      cap.evaluate((node) =>
        node.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
      );
    assert.equal(await isPainted(), true);
    await state.selectOption('loading');
    assert.equal(await action.getAttribute('aria-disabled'), 'true');
    assert.equal(await isPainted(), false);
    await assertBox(action, { width: readyBox.width, height: readyBox.height }, { tolerance });
    await assertBox(cap, capBox, { tolerance });
    await action.focus();
    await assertFocused(action);
    await pressKeys(page, 'Enter', 'Space');
    let box = await getBox(cap);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    assert.equal(await count.textContent(), '3');

    await state.selectOption('disabled');
    assert.equal(await action.isDisabled(), true);
    assert.equal(await isPainted(), true);
    box = await getBox(cap);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await before.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(save);
    assert.equal(await count.textContent(), '3');
    assert.deepEqual(await submitForm(form, save), [
      ['document', 'release'],
      ['intent', 'save'],
    ]);
  },

  'Kbd contrast and inner edges hold in all six presets on Base and Overlay': async ({
    page,
    mount,
  }) => {
    await mount('kbd');
    for (const family of ['soft', 'frost', 'pixel']) {
      for (const scheme of ['dark', 'light']) {
        const theme = `${family}-${scheme}`;
        await page.evaluate(async (preset) => {
          document.documentElement.dataset.theme = preset;
          await document.fonts.ready;
        }, theme);
        for (const surface of ['base', 'overlay']) {
          const sample = page.getByTestId(`material-${surface}`);
          const neutral = await paint(sample.locator('kbd').first());
          assert.equal(neutral.radius, family === 'pixel' ? '0px' : '4px');
          assert.equal(neutral.shadow.match(/inset/gu)?.length, family === 'frost' ? 2 : 1);
          assert.match(neutral.shadow, family === 'pixel' ? /0px -2px/u : /0px -1px/u);
          const action = sample.getByRole('button');
          const symbol = action.locator('kbd').first();
          const actionCap = await paint(symbol);
          const line = await symbol.evaluate((node) =>
            parseFloat(getComputedStyle(node).lineHeight),
          );
          await assertBox(symbol, { width: line, height: line }, { tolerance });
          assert.equal(actionCap.ink, (await paint(action)).ink);
          assert.equal(actionCap.background, 'rgba(0, 0, 0, 0)');
          assert.equal(actionCap.shadow, 'none');
          const borderAlpha = await symbol.evaluate((node) => {
            const context = document.createElement('canvas').getContext('2d');
            context.fillStyle = getComputedStyle(node).borderTopColor;
            context.fillRect(0, 0, 1, 1);
            return context.getImageData(0, 0, 1, 1).data[3] / 255;
          });
          assert.ok(Math.abs(borderAlpha - 0.28) < 0.01, 'Action uses a 28% foreground contour');
          const ratios = await contrastRatios(sample);
          assert.equal(ratios.length, 6, 'Measure two keycaps and a separator in each context');
          for (const [index, ratio] of ratios.entries()) {
            assert.ok(ratio >= 4.5, `${theme} ${surface} text ${index + 1}: ${ratio.toFixed(2)}:1`);
          }
        }
      }
    }
  },

  'Kbd uses forced-color outlines and remains still under either motion preference': async ({
    page,
    mount,
  }) => {
    await mount('kbd', { theme: 'frost-dark' });
    const neutral = page.getByTestId('material-base').locator('kbd').first();
    const disabledMenu = page.getByRole('menuitem', { name: 'Locked command' }).locator('kbd');
    const shortcuts = page.getByRole('button', { name: 'Show shortcuts' });
    const action = page.getByRole('button', { name: 'Run command' });
    const disabledAction = action.locator('kbd');
    for (const reducedMotion of ['no-preference', 'reduce']) {
      await page.emulateMedia({ forcedColors: 'active', reducedMotion });
      await page.getByLabel('Action state').selectOption('disabled');
      await shortcuts.click();
      await disabledMenu.waitFor();
      const { canvas, ink, disabled } = await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.cssText =
          'forced-color-adjust:none;background:Canvas;color:CanvasText;border:1px solid GrayText';
        document.body.append(probe);
        const style = getComputedStyle(probe);
        const result = {
          canvas: style.backgroundColor,
          ink: style.color,
          disabled: style.borderTopColor,
        };
        probe.remove();
        return result;
      });
      for (const [cap, foreground] of [
        [neutral, ink],
        [disabledAction, disabled],
        [disabledMenu, disabled],
      ]) {
        const style = await paint(cap);
        assert.equal(style.ink, foreground);
        assert.equal(style.border, foreground);
        assert.equal(style.background, canvas);
        assert.equal(style.shadow, 'none');
      }
      for (const forcedColors of ['none', 'active']) {
        await page.emulateMedia({ forcedColors, reducedMotion });
        for (const cap of [neutral, disabledAction, disabledMenu]) {
          assert.deepEqual(await motion(cap), ['none', '0s', 0]);
        }
      }
      await page.keyboard.press('Escape');
    }
  },

  'Kbd chords wrap as a unit in RTL and an oversized reference scrolls locally': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 660 });
    await mount('kbd', { theme: 'frost-dark', direction: 'rtl', textScale: 120 });
    const reflow = page.getByTestId('reflow');
    const chord = reflow.locator(group);
    const labelBox = await getBox(reflow.getByText('Open the command palette'));
    const groupBox = await getBox(chord);
    assert.ok(groupBox.y >= labelBox.y + labelBox.height - tolerance);
    const boxes = await Promise.all((await chord.locator(`kbd, ${separator}`).all()).map(getBox));
    assert.equal(boxes.length, 5, 'Three keys and two separators stay in the same chord');
    for (const [index, box] of boxes.entries()) {
      near(box.y + box.height / 2, groupBox.y + groupBox.height / 2, 'Chord children share a line');
      if (index > 0) {
        assert.ok(box.x >= boxes[index - 1].x + boxes[index - 1].width);
      }
    }
    const arrowOrientation = (glyph) =>
      glyph.evaluate((svg) => {
        const path = svg.querySelector('path');
        const shape = path.getBBox();
        const beginning = new DOMPoint(shape.x, shape.y).matrixTransform(path.getScreenCTM());
        const end = new DOMPoint(shape.x + shape.width, shape.y).matrixTransform(
          path.getScreenCTM(),
        );
        return end.x - beginning.x;
      });
    const arrows = chord.locator('svg');
    assert.equal(await arrows.count(), 2);
    for (const arrow of await arrows.all()) {
      assert.ok((await arrowOrientation(arrow)) > 0, 'Physical arrows do not reflect in RTL');
    }

    const scroll = page.getByRole('region', { name: 'Extended shortcut' });
    assert.match(await scroll.ariaSnapshot(), /Control \+ Shift \+ Page Down/u);
    assert.equal(await scroll.evaluate((node) => node.scrollWidth > node.clientWidth), true);
    await scroll.focus();
    await assertFocused(scroll);
    await pressKeys(page, 'ArrowRight');
    await page.waitForFunction(
      () => document.querySelector('[aria-label="Extended shortcut"]').scrollLeft > 0,
    );
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const root = document.documentElement;
      return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
    });
    assert.equal(scrollWidth, clientWidth);
  },

  'Tooltip keeps a whole chord below its label and Menu hides oversized hints as a unit': async ({
    page,
    mount,
  }) => {
    await mount('kbd', { theme: 'frost-dark', textScale: 120 });
    const source = page.getByRole('button', { name: 'Duplicate selection' });
    await source.scrollIntoViewIfNeeded();
    await source.focus();
    const tooltip = page
      .getByTestId('shortcut-tooltip')
      .and(page.locator(':popover-open[data-side]'));
    await tooltip.waitFor({ state: 'visible' });
    const label = await getBox(tooltip.getByText('Duplicate the selection'));
    const chord = tooltip.locator(group);
    const bounds = await getBox(chord);
    const shell = await getBox(tooltip);
    assert.ok(bounds.y >= label.y + label.height - tolerance);
    assert.ok(bounds.x + bounds.width < shell.x + shell.width);
    const keys = chord.locator('kbd');
    assert.equal(await keys.nth(1).locator(face).textContent(), 'Page Down');
    near(
      (await getBox(keys.first())).y,
      (await getBox(keys.last())).y,
      'Tooltip keycaps stay on one line',
    );
    await pressKeys(page, 'Escape');
    await tooltip.waitFor({ state: 'hidden' });
    await assertFocused(source);

    await page.getByRole('button', { name: 'Show shortcuts' }).click();
    const menu = page.getByTestId('shortcut-menu');
    const row = menu.getByRole('menuitem', { name: 'Open help' });
    const cap = row.locator('kbd');
    await cap.waitFor({ state: 'visible' });
    assert.equal(await cap.locator(face).textContent(), 'Control Shift International Keyboard');
    await menu.evaluate((node) => {
      node.style.inlineSize = '110px';
    });
    await cap.waitFor({ state: 'hidden' });
    assert.equal(await cap.count(), 1, 'The owner hides the complete hint without rewriting it');
    await menu.evaluate((node) => {
      node.style.inlineSize = '400px';
    });
    await cap.waitFor({ state: 'visible' });
  },

  'Autocomplete moves the real shortcut slot below the copy at 16rem in LTR and RTL': async ({
    page,
    mount,
  }) => {
    for (const direction of ['ltr', 'rtl']) {
      await mount('kbd', { direction });
      await page.getByRole('button', { name: 'Show suggestions' }).click();
      const list = page.getByRole('listbox', { name: 'Suggestions' });
      const panel = page.locator('.suggestion-panel-proto:popover-open');
      const option = list.getByRole('option', { name: /International release checklist/u });
      const cap = option.locator('kbd');
      await cap.waitFor();
      assert.equal(await cap.locator(face).textContent(), '/release');
      assert.equal(await cap.evaluate((node) => getComputedStyle(node).direction), 'ltr');
      for (const width of [280, 256, 230]) {
        await panel.evaluate((node, width) => {
          node.style.boxSizing = 'content-box';
          node.style.setProperty('inline-size', `${width}px`, 'important');
        }, width);
        // Read both boxes atomically while the anchored panel is free to reposition.
        const { captionBox, capBox, measuredWidth } = await option.evaluate((node) => {
          const caption = node.querySelector('.suggestion-option-copy-proto');
          const cap = node.querySelector('kbd');
          const panel = node.closest('.suggestion-panel-proto');
          return {
            captionBox: caption.getBoundingClientRect().toJSON(),
            capBox: cap.getBoundingClientRect().toJSON(),
            measuredWidth: parseFloat(getComputedStyle(panel).inlineSize),
          };
        });
        near(measuredWidth, width, `${direction} panel width`);
        const details = `${direction} at ${width}px: cap ${JSON.stringify(capBox)}, copy ${JSON.stringify(captionBox)}`;
        if (width > 256) {
          assert.ok(Math.abs(capBox.y - captionBox.y) < 2, details);
          assert.ok(
            direction === 'ltr'
              ? capBox.x >= captionBox.x + captionBox.width
              : capBox.x + capBox.width <= captionBox.x,
            details,
          );
        } else {
          assert.ok(capBox.y >= captionBox.y + captionBox.height, details);
          const start = (box) => (direction === 'ltr' ? box.x : box.x + box.width);
          near(start(capBox), start(captionBox), `${direction} shortcut aligns with copy start`);
        }
      }
      const lockedCap = list.getByRole('option', { name: /Locked checklist/u }).locator('kbd');
      assert.notEqual((await paint(lockedCap)).ink, (await paint(cap)).ink);
    }
  },

  'Kbd Node SSR markup survives browser hydration with its native nodes intact': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('kbd-ssr');
    await mount('kbd');
    const container = page.getByTestId('ssr-root');
    const nodes = await container.evaluateHandle((root, markup) => {
      root.innerHTML = markup;
      return [...root.querySelectorAll('*')];
    }, html);
    const rendered = container.locator(`:scope > ${group}`);
    assert.equal(await rendered.locator('kbd').count(), 3);
    assert.equal(await rendered.getAttribute('data-hydrated'), null);
    assert.match(await rendered.ariaSnapshot(), /Commande plus K then Return/u);
    const before = await rendered.innerHTML();
    await page.getByRole('button', { name: 'Hydrate shortcuts' }).click();
    await container.locator('[data-hydrated]').waitFor({ state: 'attached' });
    assert.equal(await rendered.innerHTML(), before);
    assert.equal(
      await container.evaluate((root, before) => {
        const after = [...root.querySelectorAll('*')];
        return (
          before.length === after.length && after.every((node, index) => before[index] === node)
        );
      }, nodes),
      true,
    );
    await nodes.dispose();
    assert.equal(await page.getByTestId('hydration-errors').textContent(), '');
  },
};

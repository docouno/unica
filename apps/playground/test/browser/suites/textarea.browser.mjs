import assert from 'node:assert/strict';
import { assertBox, assertFocused, getBox, pressKeys, resetForm } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const field = (page, name) => page.getByRole('textbox', { name, exact: true });
const entries = (form) => form.evaluate((node) => [...new FormData(node)]);
const selection = (editor) => editor.evaluate((node) => [node.selectionStart, node.selectionEnd]);
const select = (editor, start, end = start) =>
  editor.evaluate((node, range) => node.setSelectionRange(...range), [start, end]);
const output = async (page, testId) => JSON.parse(await page.getByTestId(testId).textContent());
const resize = (editor) => editor.evaluate((node) => getComputedStyle(node).resize);

async function dragCorner(page, editor) {
  await editor.scrollIntoViewIfNeeded();
  const box = await getBox(editor);
  await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 45, box.y + box.height + 63, { steps: 6 });
  await page.mouse.up();
  await assertBox(editor, { width: box.width });
  assert.ok((await getBox(editor)).height > box.height + 45);
}

async function hydrateDraft(page, mount, renderFixture, beforeHydration) {
  const html = await renderFixture('textarea-ssr');
  await mount('textarea-hydration');
  await page.getByTestId('textarea-ssr-root').evaluate((node, html) => {
    node.innerHTML = html;
    window.serverTextarea = node.querySelector('#ssr-draft');
  }, html);
  const form = page.locator('#ssr-notes');
  const editor = field(page, 'Server draft');
  assert.deepEqual(await entries(form), [
    ['draft', 'A'],
    ['plain', 'A'],
  ]);
  assert.equal(
    await page
      .locator('label[for="ssr-draft"]')
      .evaluate((node) => node.control === window.serverTextarea),
    true,
  );
  await beforeHydration?.(editor);
  await button(page, 'Hydrate textarea').evaluate((node) => node.click());
  await form.and(page.locator('[data-hydrated][data-ref-matches]')).waitFor();
  assert.equal(await editor.evaluate((node) => node === window.serverTextarea), true);
  assert.equal(await form.getAttribute('data-edits'), '[]');
  return { form, editor };
}

function disableFieldSizing() {
  for (const sheet of document.styleSheets) {
    const remove = (owner) => {
      for (let i = owner.cssRules.length - 1; i >= 0; i--) {
        const rule = owner.cssRules[i];
        if (rule instanceof CSSSupportsRule && rule.conditionText === '(field-sizing: content)') {
          owner.deleteRule(i);
        } else if (rule.cssRules && !(rule instanceof CSSStyleRule)) {
          remove(rule);
        }
      }
    };
    remove(sheet);
  }
}

export default {
  'Textarea keeps native caret and Undo when controlled edits are accepted and repairs rejected drafts':
    async ({ page, mount }) => {
      await mount('textarea');
      const editor = field(page, 'Managed draft');
      const form = page.locator('#controlled');
      await page.locator('label[for="managed"]').click();
      await assertFocused(editor);
      await select(editor, 2);
      await page.keyboard.insertText('X');
      assert.equal(await editor.inputValue(), 'heXllo\nthere');
      assert.deepEqual(await selection(editor), [3, 3]);
      await button(page, 'Toggle danger').evaluate((node) => node.click());
      assert.equal(await editor.getAttribute('aria-invalid'), 'true');
      await assertFocused(editor);
      assert.deepEqual(await selection(editor), [3, 3]);

      await pressKeys(page, 'Control+z');
      assert.equal(await editor.inputValue(), 'hello\nthere');
      await pressKeys(page, 'Control+Shift+z');
      assert.equal(await editor.inputValue(), 'heXllo\nthere');
      await button(page, 'Toggle acceptance').evaluate((node) => node.click());
      await page.keyboard.insertText('Z');
      assert.equal(await editor.inputValue(), 'heXllo\nthere');
      assert.deepEqual(await output(page, 'proposals'), [
        'heXllo\nthere',
        'hello\nthere',
        'heXllo\nthere',
        'heXZllo\nthere',
      ]);
      assert.deepEqual(await entries(form), [['managed', 'heXllo\nthere']]);
      await button(page, 'Replace draft').click();
      await button(page, 'Reset managed draft').click();
      assert.equal(await editor.inputValue(), 'A different draft');
      assert.deepEqual(await entries(form), [['managed', 'A different draft']]);
      assert.equal((await output(page, 'proposals')).length, 4);
    },

  'Textarea keeps the native IME draft until composition ends and reconciles the latest owner':
    async ({ page, mount }) => {
      const cdp = await page.context().newCDPSession(page);
      for (const [accept, replace, finalValue] of [
        [true, false, 'he仮名llo\nthere'],
        [false, false, 'hello\nthere'],
        [false, true, 'A different draft'],
      ]) {
        await mount('textarea');
        const editor = field(page, 'Managed draft');
        const form = page.locator('#controlled');
        if (!accept) {
          await button(page, 'Toggle acceptance').click();
        }
        await editor.focus();
        await select(editor, 2);
        await cdp.send('Input.imeSetComposition', {
          text: 'か',
          selectionStart: 1,
          selectionEnd: 1,
        });
        assert.equal(await editor.inputValue(), 'heかllo\nthere');
        assert.deepEqual(await selection(editor), [3, 3]);
        assert.deepEqual(await entries(form), [['managed', 'heかllo\nthere']]);
        if (replace) {
          // Change the owner's value without moving focus away from the active composition.
          await button(page, 'Replace draft').evaluate((node) => node.click());
          assert.equal(await editor.inputValue(), 'heかllo\nthere');
        }
        await cdp.send('Input.imeSetComposition', {
          text: 'かな',
          selectionStart: 2,
          selectionEnd: 2,
        });
        assert.equal(await editor.inputValue(), 'heかなllo\nthere');
        assert.deepEqual(await selection(editor), [4, 4]);
        assert.deepEqual(await entries(form), [['managed', 'heかなllo\nthere']]);
        await cdp.send('Input.insertText', { text: '仮名' });
        await page.waitForFunction(
          (expected) => document.querySelector('#managed').value === expected,
          finalValue,
        );
        assert.deepEqual(await output(page, 'composition'), ['start', 'end']);
        assert.deepEqual(await output(page, 'proposals'), [
          'heかllo\nthere',
          'heかなllo\nthere',
          'he仮名llo\nthere',
        ]);
        assert.deepEqual(await entries(form), [['managed', finalValue]]);
        await resetForm(form);
        assert.equal(await editor.inputValue(), finalValue);
      }
    },

  'Textarea uses the current native form and resets only on completed native resets': async ({
    page,
    mount,
  }) => {
    await mount('textarea');
    const editor = field(page, 'External draft');
    const home = page.locator('#home');
    const away = page.locator('#away');
    const draft = 'B\nsecond\nthird\nfourth\nfifth';
    await editor.fill(draft);
    await assertBox(editor, { height: 126 });
    assert.deepEqual(await output(page, 'external-changes'), [[draft, draft]]);
    await button(page, 'Change default').click();
    await button(page, 'Move form owner').click();
    assert.deepEqual(await entries(home), []);
    assert.deepEqual(await entries(away), [['external', draft]]);
    await resetForm(home);
    assert.equal(await editor.inputValue(), draft);
    await away.evaluate((node) => {
      node.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      node.reset();
      node.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
    });
    assert.equal(await editor.inputValue(), draft);

    await button(page, 'Reset away').click();
    assert.equal(await editor.inputValue(), 'A');
    await assertBox(editor, { height: 86 });
    await editor.fill(draft);
    assert.deepEqual(await output(page, 'external-changes'), [
      [draft, draft],
      [draft, draft],
    ]);
  },

  'Textarea submits native soft and hard wrapping with LF editor values': async ({
    page,
    mount,
  }) => {
    await mount('textarea');
    const form = page.locator('#wrapping');
    await form.evaluate((node) => {
      for (const mode of ['soft', 'hard']) {
        const source = node.elements.namedItem('package-' + mode);
        const plain = node.elements.namedItem('native-' + mode);
        const computed = getComputedStyle(source);
        for (const prop of [
          'font',
          'box-sizing',
          'width',
          'height',
          'padding',
          'border',
          'overflow-wrap',
        ]) {
          plain.style.setProperty(prop, computed.getPropertyValue(prop));
        }
      }
    });
    const soft = field(page, 'Package soft');
    const hard = field(page, 'Package hard');
    const expected = await soft.inputValue();
    assert.equal(await hard.inputValue(), expected);
    assert.equal(await field(page, 'Native hard').inputValue(), expected);
    assert.ok(expected.includes('\n') && !expected.includes('\r'));
    const read = async () => Object.fromEntries(await entries(form));
    const first = await read();
    assert.equal(first['package-soft'], expected);
    assert.equal(first['package-soft'], first['native-soft']);
    assert.equal(first['package-hard'], first['native-hard']);
    assert.ok(first['package-hard'].split('\n').length > expected.split('\n').length);
    await hard.fill('Changed');
    await resetForm(form);
    assert.deepEqual(await read(), first);
  },

  'Textarea preserves native focus, composition, availability and fieldset legend semantics':
    async ({ page, mount }) => {
      await mount('textarea');
      const editor = field(page, 'Required notes');
      const legend = field(page, 'Legend field');
      const form = page.locator('#availability');
      const outline = () =>
        editor.evaluate((node) => getComputedStyle(node.parentElement).outlineStyle);
      assert.equal(await form.evaluate((node) => node.reportValidity()), false);
      await page.locator('label[for="availability-notes"]').click();
      await assertFocused(editor);
      assert.equal(await outline(), 'none');
      await editor.dispatchEvent('compositionstart', { data: '' });
      await editor.dispatchEvent('compositionend', { data: '文' });
      await page.keyboard.insertText('文');
      await pressKeys(page, 'Enter', 'ArrowLeft');
      assert.equal(await outline(), 'none');
      await pressKeys(page, 'Escape');
      assert.equal(await editor.inputValue(), '文\n');
      assert.deepEqual(await output(page, 'editor-events'), ['start', 'end', '文', '文\n']);
      assert.equal(await form.evaluate((node) => node.checkValidity()), true);

      await button(page, 'Toggle fieldset').focus();
      await pressKeys(page, 'Tab', 'Tab');
      await assertFocused(editor);
      assert.equal(await outline(), 'solid');
      await pressKeys(page, 'Tab');
      await assertFocused(button(page, 'After notes'));

      await button(page, 'Toggle read-only').click();
      await editor.focus();
      await pressKeys(page, 'Control+a');
      assert.deepEqual(await selection(editor), [0, 2]);
      await page.keyboard.insertText('ignored');
      assert.equal(await editor.inputValue(), '文\n');
      assert.equal(await resize(editor), 'vertical');
      assert.equal(await editor.getAttribute('aria-invalid'), 'true');
      assert.deepEqual(await entries(form), [
        ['legend', 'Legend'],
        ['notes', '文\n'],
      ]);

      await button(page, 'Toggle disabled').click();
      assert.equal(await editor.isDisabled(), true);
      assert.equal(await editor.getAttribute('aria-invalid'), null);
      assert.equal(await resize(editor), 'none');
      await button(page, 'Toggle disabled').click();
      assert.equal(await editor.getAttribute('aria-invalid'), 'true');

      await editor.evaluate((node) => {
        node.closest('fieldset').disabled = true;
      });
      assert.equal(await editor.getAttribute('aria-invalid'), null);
      assert.equal(await legend.getAttribute('aria-invalid'), 'true');
      await editor.evaluate((node) => {
        node.closest('fieldset').disabled = false;
      });
      assert.equal(await editor.getAttribute('aria-invalid'), 'true');

      await button(page, 'Toggle fieldset').click();
      assert.equal(await legend.isEnabled(), true);
      assert.equal(await legend.getAttribute('aria-invalid'), 'true');
      assert.equal(await editor.isDisabled(), true);
      assert.equal(await editor.getAttribute('aria-invalid'), null);
      assert.equal(await editor.locator('..').locator('svg').isVisible(), false);
      assert.deepEqual(await entries(form), [['legend', 'Legend']]);
      await button(page, 'Toggle fieldset').click();
      assert.equal(await editor.getAttribute('aria-invalid'), 'true');
    },

  'Textarea hands off native drag height to fixed and content sizing on the same editor': async ({
    page,
    mount,
  }) => {
    for (const mode of ['Fixed height', 'Autosize height']) {
      await mount('textarea');
      const editor = field(page, 'Height test');
      await editor.evaluate((node) => {
        window.originalTextarea = node;
      });
      await assertBox(editor, { height: 86 });
      await dragCorner(page, editor);
      const dragged = await getBox(editor);
      await editor.press('End');
      await page.keyboard.insertText('!');
      await assertBox(editor, { height: dragged.height });
      await select(editor, 1, 4);
      await button(page, mode).evaluate((node) => node.click());
      assert.deepEqual(await selection(editor), [1, 4]);
      assert.equal(await editor.inputValue(), 'Short draft!');
      assert.equal(await editor.evaluate((node) => node === window.originalTextarea), true);
      assert.equal(await resize(editor), 'none');
      await assertBox(editor, { height: 86 });
      if (mode === 'Fixed height') {
        await button(page, 'Five rows').click();
        await assertBox(editor, { height: 126 });
      } else {
        await editor.fill('One\nTwo\nThree\nFour\nFive\nSix');
        await assertBox(editor, { height: 126 });
        assert.equal(await editor.evaluate((node) => node.scrollHeight > node.clientHeight), true);
        await editor.fill('One');
        await assertBox(editor, { height: 86 });
      }
    }

    await mount('textarea');
    const editor = field(page, 'Height test');
    await button(page, 'Author height').click();
    await assertBox(editor, { height: 108 });
    await dragCorner(page, editor);
    await button(page, 'Fixed height').click();
    await assertBox(editor, { height: 108 });
    assert.equal(await editor.evaluate((node) => node.style.fontWeight), '500');
  },

  'Textarea wraps and scrolls without changing its gutter on validation, including emulated autosize fallback':
    async ({ page, mount }) => {
      await mount('textarea');
      const editor = field(page, 'Height test');
      const unwrapped = field(page, 'Unwrapped log');
      const unbounded = field(page, 'Unbounded draft');
      assert.ok((await getBox(unbounded)).height > 126);
      await assertBox(unwrapped, { height: 126 });
      assert.equal(await unwrapped.getAttribute('wrap'), 'OFF');
      assert.equal(await unwrapped.locator('..').locator('svg').count(), 0);
      assert.equal(
        await unwrapped.evaluate((node) => {
          const style = getComputedStyle(node);
          return style.paddingInlineEnd === style.paddingInlineStart;
        }),
        true,
      );
      await unwrapped.press('Control+End');
      assert.equal(
        await unwrapped.evaluate(
          (node) =>
            node.scrollWidth > node.clientWidth &&
            node.scrollLeft > 0 &&
            node.scrollTop > 0 &&
            node.selectionStart === node.value.length,
        ),
        true,
      );

      await editor.fill('Long draft '.repeat(150));
      await select(editor, 420, 432);
      const metrics = (node) => {
        const { paddingInlineEnd } = getComputedStyle(node);
        return [
          node.scrollTop,
          node.scrollHeight,
          node.clientHeight,
          node.clientWidth,
          node.selectionStart,
          node.selectionEnd,
          paddingInlineEnd,
        ];
      };
      const before = await editor.evaluate(metrics);
      await button(page, 'Change status').evaluate((node) => node.click());
      assert.deepEqual(await editor.evaluate(metrics), before);
      await assertFocused(editor);

      await page.evaluate(disableFieldSizing);
      assert.equal(await unbounded.evaluate((node) => getComputedStyle(node).fieldSizing), 'fixed');
      await assertBox(unbounded, { height: 86 });
      assert.equal(await resize(unbounded), 'none');
      await unbounded.press('Control+End');
      assert.equal(
        await unbounded.evaluate(
          (node) => node.scrollTop > 0 && node.selectionStart === node.value.length,
        ),
        true,
      );
    },

  'Textarea preserves edited and cleared drafts, selection and undo across SSR hydration': async (
    context,
  ) => {
    const { page, mount, renderFixture } = context;
    for (const draft of ['b', '']) {
      const { form, editor } = await hydrateDraft(page, mount, renderFixture, async (editor) => {
        await editor.focus();
        await pressKeys(page, 'Control+a');
        if (draft) {
          await page.keyboard.insertText(draft);
        } else {
          await pressKeys(page, 'Backspace');
        }
      });
      assert.equal(await editor.inputValue(), draft);
      assert.deepEqual(await selection(editor), [draft.length, draft.length]);
      assert.deepEqual(await entries(form), [
        ['draft', draft],
        ['plain', 'A'],
      ]);
      assert.equal(await editor.evaluate((node) => node.defaultValue), 'A');
      await form.evaluate((node) => {
        node.addEventListener('reset', (event) => event.preventDefault(), { once: true });
        node.reset();
        node.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
      });
      assert.equal(await editor.inputValue(), draft);
      await pressKeys(page, 'Control+z');
      assert.equal(await editor.inputValue(), 'A');
      await pressKeys(page, 'Control+Shift+z');
      assert.equal(await editor.inputValue(), draft);
      assert.deepEqual(JSON.parse(await form.getAttribute('data-edits')), ['A', draft]);
      await resetForm(form);
      assert.deepEqual(await entries(form), [
        ['draft', 'A'],
        ['plain', 'A'],
      ]);
    }
  },

  'Textarea hydrates a pristine default and reports the same user edit again after reset': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const { form, editor } = await hydrateDraft(page, mount, renderFixture, async (editor) => {
      await select(editor, 0, 1);
      await select(field(page, 'Plain draft'), 0, 1);
    });
    assert.equal(await editor.inputValue(), 'A');
    assert.deepEqual(await selection(editor), await selection(field(page, 'Plain draft')));
    await editor.focus();
    await select(editor, 0, 1);
    await button(page, 'Change server draft status').evaluate((node) => node.click());
    assert.deepEqual(await selection(editor), [0, 1]);
    await pressKeys(page, 'Backspace');
    await page.keyboard.insertText('b');
    assert.deepEqual(await entries(form), [
      ['draft', 'b'],
      ['plain', 'A'],
    ]);
    await resetForm(form);
    assert.equal(await editor.inputValue(), 'A');
    await pressKeys(page, 'Control+a');
    await page.keyboard.insertText('b');
    assert.deepEqual(JSON.parse(await form.getAttribute('data-edits')), ['', 'b', 'b']);
  },

  'Textarea publishes the controlled value before its public ref can read a hydrated draft':
    async ({ page, mount, renderFixture }) => {
      const managed = field(page, 'Server managed draft');
      await hydrateDraft(page, mount, renderFixture, async () => {
        await managed.fill('Edited before hydration');
        assert.equal(await managed.inputValue(), 'Edited before hydration');
      });
      const form = page.locator('#ssr-managed-form');
      assert.deepEqual(JSON.parse(await form.getAttribute('data-ref-value')), [
        'Owner value',
        'Owner value',
      ]);
      assert.deepEqual(await entries(form), [['managed', 'Owner value']]);
    },

  'Textarea aligns explicit direction and keeps hidden-until-found chrome out of view': async ({
    page,
    mount,
  }) => {
    await mount('textarea');
    const editor = page.locator('#availability-notes');
    const metrics = await editor.evaluate((node) => {
      // Drop unsupported :dir() alternatives, as in Chromium before version 120.
      const stripDirection = (owner) => {
        for (const rule of owner.cssRules) {
          if (rule instanceof CSSStyleRule && rule.selectorText.includes('textarea-status')) {
            rule.selectorText = rule.selectorText
              .replaceAll(/,\s*:dir\((?:rtl|ltr)\)/gu, '')
              .replaceAll(/:dir\((?:rtl|ltr)\)/gu, '[data-no-direction-match]');
          } else if (rule.cssRules && !(rule instanceof CSSStyleRule)) {
            stripDirection(rule);
          }
        }
      };
      for (const sheet of document.styleSheets) {
        stripDirection(sheet);
      }
      const measurements = [];
      for (const [outer, inner] of [
        ['ltr', 'rtl'],
        ['rtl', 'ltr'],
      ]) {
        document.documentElement.dir = outer;
        node.dir = inner;
        const box = node.getBoundingClientRect();
        const status = node.parentElement.querySelector('svg').getBoundingClientRect();
        measurements.push(inner === 'rtl' ? status.left - box.left : box.right - status.right);
      }
      return measurements;
    });
    assert.deepEqual(metrics, [17, 17]);
    const hidden = await editor.evaluate((node) => {
      node.setAttribute('hidden', 'until-found');
      const frame = node.parentElement;
      return [
        getComputedStyle(node).contentVisibility,
        getComputedStyle(frame).backgroundColor,
        getComputedStyle(frame, '::before').display,
        getComputedStyle(frame, '::after').display,
        getComputedStyle(frame.querySelector('svg')).display,
        getComputedStyle(node).resize,
      ];
    });
    assert.deepEqual(hidden, ['hidden', 'rgba(0, 0, 0, 0)', 'none', 'none', 'none', 'none']);
    await page.evaluate(() => {
      window.location.hash = '#availability-notes';
    });
    await editor.and(page.locator(':not([hidden])')).waitFor();
    assert.equal(await editor.evaluate((node) => getComputedStyle(node).resize), 'vertical');
    assert.equal(await editor.locator('..').locator('svg').isVisible(), true);
  },

  'Textarea preserves scaled row geometry and readable text on the six Base and Overlay presets':
    async ({ page, mount }) => {
      await mount('textarea');
      const materials = page.getByTestId('materials');
      const themes = [
        'soft-dark',
        'soft-light',
        'frost-dark',
        'frost-light',
        'pixel-dark',
        'pixel-light',
      ];
      for (const width of [360, 768, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const theme of themes) {
          const samples = await materials.evaluate((surface, theme) => {
            const root = document.documentElement;
            root.dataset.theme = theme;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            function paint(color) {
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
            }
            const luminance = () =>
              [...context.getImageData(0, 0, 1, 1).data]
                .slice(0, 3)
                .map((channel) => {
                  const srgb = channel / 255;
                  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
                })
                .reduce(
                  (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
                  0,
                );

            const result = [];
            for (const material of ['base', 'overlay']) {
              surface.dataset.surface = material;
              surface.style.background =
                material === 'base' ? 'var(--bg-surface)' : 'var(--bg-overlay)';
              root.dir = material === 'base' ? 'ltr' : 'rtl';
              root.dataset.textScale = material === 'base' ? '100' : '120';
              for (const editor of surface.querySelectorAll('textarea')) {
                const frame = editor.parentElement;
                const snapshot = getComputedStyle(editor);
                context.clearRect(0, 0, 1, 1);
                paint(getComputedStyle(root).getPropertyValue('--bg-canvas').trim());
                paint(getComputedStyle(surface).backgroundColor);
                paint(getComputedStyle(frame).backgroundColor);
                const background = luminance();
                paint(
                  editor.placeholder
                    ? getComputedStyle(editor, '::placeholder').color
                    : snapshot.color,
                );
                const foreground = luminance();
                const contrast =
                  (Math.max(background, foreground) + 0.05) /
                  (Math.min(background, foreground) + 0.05);
                const box = editor.getBoundingClientRect();
                const icon = frame.querySelector('svg')?.getBoundingClientRect();
                result.push({
                  material,
                  size: frame.dataset.unicaTextareaSize,
                  radius: parseFloat(snapshot.borderTopLeftRadius),
                  direction: snapshot.direction,
                  width: box.width,
                  height: box.height,
                  contrast,
                  inset: parseFloat(snapshot.paddingInlineStart),
                  iconInset:
                    icon &&
                    (snapshot.direction === 'rtl' ? icon.left - box.left : box.right - icon.right),
                });
              }
            }
            return result;
          }, theme);
          for (const sample of samples) {
            const { material, size, height, contrast, direction, inset, iconInset, radius } =
              sample;
            const baseHeight = { s: 78, m: 86, l: 106 }[size];
            const scaled = material === 'overlay';
            assert.ok(
              Math.abs(height - (baseHeight + (scaled ? (size === 'l' ? 14.4 : 12) : 0))) < 1,
            );
            assert.equal(radius, theme.startsWith('pixel') ? 0 : { s: 6, m: 8, l: 10 }[size]);
            assert.equal(direction, scaled ? 'rtl' : 'ltr');
            assert.equal(inset, { s: 10, m: 16, l: 20 }[size]);
            assert.ok(iconInset === undefined || Math.abs(iconInset - inset - 1) < 1);
            assert.ok(sample.width <= width);
            assert.ok(contrast >= 4.5, `${theme} ${material} ${size}: ${contrast}`);
          }
        }
      }
    },

  'Textarea uses a system focus contour for pointer and keyboard in forced colors': async ({
    page,
    mount,
  }) => {
    await mount('textarea', {
      theme: 'pixel-dark',
      surface: 'overlay',
      direction: 'rtl',
      textScale: 120,
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    const editor = field(page, 'Required notes');
    const frame = editor.locator('..');
    const ring = () =>
      frame.evaluate((node) => {
        const system = document.createElement('span');
        system.style.color = 'Highlight';
        node.append(system);
        const expected = getComputedStyle(system).color;
        system.remove();
        const style = getComputedStyle(node);
        return [
          style.outlineWidth,
          style.outlineOffset,
          style.outlineColor,
          expected,
          style.borderRadius,
        ];
      });
    await editor.click();
    const pointer = await ring();
    assert.deepEqual(pointer, ['2px', '2px', pointer[3], pointer[3], '0px']);
    await button(page, 'After notes').focus();
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(editor);
    assert.deepEqual(await ring(), pointer);
  },
};

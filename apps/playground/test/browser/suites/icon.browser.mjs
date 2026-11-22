import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

async function size(locator, expected) {
  const { width, height } = await getBox(locator);
  assert.ok(Math.abs(width - expected) < 0.1, `width ${width}, expected ${expected}`);
  assert.ok(Math.abs(height - expected) < 0.1, `height ${height}, expected ${expected}`);
}

async function inheritedPaint(owner, glyph = owner.locator('svg')) {
  const ownerColor = await owner.evaluate((node) => getComputedStyle(node).color);
  assert.equal(await glyph.evaluate((node) => getComputedStyle(node).fill), ownerColor);
  return ownerColor;
}

async function centerSize(frame) {
  return frame.evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    const drawing = svg.querySelector('[data-drawing]');
    const matrix = drawing.getScreenCTM();
    const start = new DOMPoint(0, 0).matrixTransform(matrix);
    const end = new DOMPoint(32, 16).matrixTransform(matrix);
    return [start.x - box.x, start.y - box.y, end.x - start.x, end.y - start.y];
  });
}

export default {
  'Folio connector and list slots retain owner sizes under standalone overrides': async ({
    page,
    mount,
  }) => {
    await mount('icon-folio', { theme: 'pixel-light' });
    for (const selector of ['.folio-connector-icon > svg', '.folio-connector-sync svg']) {
      const glyph = page.locator(selector).first();
      await size(
        glyph,
        await glyph.evaluate((svg) => parseFloat(getComputedStyle(svg.parentElement).fontSize)),
      );
    }
    await size(page.locator('.list-leading-proto svg').first(), 16);
  },

  'AppShell disclosure points down when open and toward inline end when closed': async ({
    page,
    mount,
  }) => {
    for (const direction of ['ltr', 'rtl']) {
      await mount('icon', { direction });
      const branch = page
        .getByTestId('chrome')
        .getByRole('treeitem', { name: 'Architecture, 34 items' });
      const disclosure = branch.locator(':scope > .app-shell-tree-disclosure');
      const caret = disclosure.locator('.app-shell-nav-caret');
      assert.ok((await caret.evaluate((svg) => svg.getScreenCTM().b)) > 0);
      await disclosure.click();
      assert.equal(await branch.getAttribute('aria-expanded'), 'false');
      const horizontal = await caret.evaluate((svg) => svg.getScreenCTM().a);
      assert.ok(direction === 'rtl' ? horizontal < 0 : horizontal > 0);
    }
  },

  'Icon sizes follow owner geometry and the project SVG is centered without distortion': async ({
    page,
    mount,
  }) => {
    for (const textScale of [100, 120]) {
      await mount('icon', { theme: 'pixel-light', direction: 'rtl', textScale });
      await size(page.getByTestId('standalone'), 14);
      const text = page.getByTestId('text');
      await size(
        page.getByTestId('inline'),
        await text.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
      );
      const escape = page.getByTestId('styled-escape');
      await size(escape, 24);
      assert.equal(await escape.evaluate((node) => getComputedStyle(node).fill), 'rgb(18, 92, 60)');
      const external = page.getByTestId('external');
      await size(
        external.locator('svg'),
        await external.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
      );
      await size(page.getByTestId('media').locator('svg'), 32);
      await size(page.getByTestId('themed-button').locator('svg'), 16);
      await size(page.getByTestId('wide'), 24);
      const drawing = await centerSize(page.getByTestId('wide'));
      [0, 6, 24, 12].forEach((expected, index) =>
        assert.ok(Math.abs(drawing[index] - expected) < 0.1),
      );
      const listboxes = page.getByTestId('listbox-sizes').locator('.choice-option-icon-proto svg');
      await size(listboxes.nth(0), 16);
      await size(listboxes.nth(1), 20);
      const tabs = page.getByRole('tablist');
      const label = (text) => tabs.locator('.tab-label-proto').getByText(text, { exact: true });
      const withIcon = await getBox(label('With icon'));
      const plain = await getBox(label('Without icon'));
      assert.ok(Math.abs(withIcon.x + withIcon.width - plain.x - plain.width) < 0.1);
      assert.equal(await tabs.locator('.tab-count-proto').textContent(), '12');
      assert.equal(await tabs.getByRole('tab', { name: 'Icon only' }).locator('svg').count(), 1);
    }
  },

  'Icon names use native SVG precedence and never introduce a tab stop': async ({
    page,
    mount,
  }) => {
    await mount('icon');
    const group = page.getByTestId('accessible');
    for (const name of ['Linked name', 'Fallback name', 'Arrow title', 'Build ready']) {
      assert.equal(await group.getByRole('img', { name, exact: true }).count(), 1);
    }
    assert.equal(await group.getByRole('img').count(), 4);
    const decorative = page.getByTestId('decorative');
    assert.equal(await decorative.getAttribute('aria-hidden'), 'true');
    assert.equal(await decorative.getAttribute('focusable'), 'false');
    const before = group.getByRole('button', { name: 'Before icons' });
    const after = group.getByRole('button', { name: 'After icons' });
    await before.focus();
    await page.keyboard.press('Tab');
    await assertFocused(after);
    assert.equal(await after.locator('svg').getAttribute('aria-hidden'), 'true');
  },

  'Phosphor context supplies slot weight while Icon owns paint, reflection, naming and ref':
    async ({ page, mount }) => {
      for (const direction of ['ltr', 'rtl']) {
        await mount('icon', { direction });
        const weight = page.getByTestId('weight');
        const scope = page.getByTestId('vendor');
        assert.equal(await scope.getByRole('img', { name: 'Owner label', exact: true }).count(), 1);
        assert.equal(await weight.getAttribute('viewBox'), '0 0 256 256');
        assert.equal(await weight.getAttribute('data-owner-ref'), '');
        assert.equal(await weight.getAttribute('aria-labelledby'), null);
        await size(weight, 16);
        await inheritedPaint(scope, weight);

        const markup = (locator) => locator.evaluate((svg) => svg.innerHTML);
        assert.equal(await markup(weight), await markup(page.getByTestId('reference-regular')));
        assert.equal(
          await markup(page.getByTestId('slot-weight')),
          await markup(page.getByTestId('reference-fill')),
        );
        await scope.getByRole('button', { name: 'Toggle weight' }).focus();
        await page.keyboard.press('Tab');
        await assertFocused(scope.getByRole('button', { name: 'After vendor icons' }));
        assert.equal(
          await weight.locator('path').evaluate((node) => getComputedStyle(node).fill),
          await scope.evaluate((node) => getComputedStyle(node).color),
        );
        const original = await weight.elementHandle();
        await scope.getByRole('button', { name: 'Toggle weight' }).click();
        assert.equal(await markup(weight), await markup(page.getByTestId('reference-bold')));
        assert.equal(await weight.evaluate((node, previous) => node === previous, original), true);
        await original.dispose();

        // The CTM includes CSS reflection and determines where the drawing is painted.
        const xScale = (id) => page.getByTestId(id).evaluate((svg) => svg.getScreenCTM().a);
        assert.ok((await xScale('logical')) * (direction === 'rtl' ? -1 : 1) > 0);
        assert.ok((await xScale('physical')) < 0);
        assert.ok((await xScale('check')) > 0);
        assert.ok((await xScale('nested-ltr')) > 0);
        if (direction === 'ltr') {
          assert.equal(
            await page.getByTestId('logical').evaluate((svg) => getComputedStyle(svg).scale),
            'none',
          );
        }
        assert.equal(
          await page.getByTestId('nested-ltr').evaluate((svg) => getComputedStyle(svg).scale),
          'none',
        );
      }
    },

  'CurrentColor follows the real control in rest, hover, press, disabled and forced colors':
    async ({ page, mount }) => {
      for (const forcedColors of ['none', 'active']) {
        await mount('icon', { theme: 'frost-dark', surface: 'overlay', forcedColors });
        const button = page.getByTestId('themed-button');
        await inheritedPaint(button);
        await button.hover();
        await inheritedPaint(button);
        await page.mouse.down();
        assert.equal(await button.evaluate((node) => node.matches(':active')), true);
        await inheritedPaint(button);
        await page.mouse.up();
        await inheritedPaint(page.getByTestId('disabled-button'));
        const input = page.getByRole('textbox', { name: 'Disabled input' });
        const inputColor = await input.evaluate((node) => getComputedStyle(node).color);
        const leading = page.getByTestId('disabled-field').locator('svg');
        assert.equal(await leading.evaluate((node) => getComputedStyle(node).fill), inputColor);

        const semanticHost = page.getByTestId('semantic-host');
        const semanticDanger = page.getByTestId('semantic-danger');
        const hostColor = await semanticHost.evaluate((node) => getComputedStyle(node).color);
        const dangerFill = await semanticDanger.evaluate((node) => getComputedStyle(node).fill);
        if (forcedColors === 'active') {
          assert.equal(dangerFill, hostColor);
        } else {
          assert.notEqual(dangerFill, hostColor);
        }
      }
    },

  'Project glyph instances keep local clipping and author colors when a sibling unmounts': async ({
    page,
    mount,
  }) => {
    await mount('icon');
    const first = page.getByTestId('first-project');
    const second = page.getByTestId('second-project');
    const clipId = (svg) => svg.locator('clipPath').getAttribute('id');
    const id = await clipId(second);
    assert.notEqual(await clipId(first), id);
    const checkDrawing = () =>
      second.evaluate((svg) => {
        const rect = svg.querySelector('[data-drawing]');
        const matrix = rect.getScreenCTM();
        const inside = new DOMPoint(10, 8).matrixTransform(matrix);
        const outside = new DOMPoint(30, 8).matrixTransform(matrix);
        return [
          document.elementFromPoint(inside.x, inside.y) === rect,
          document.elementFromPoint(outside.x, outside.y) === rect,
          getComputedStyle(svg.lastElementChild).fill,
        ];
      });
    await second.scrollIntoViewIfNeeded();
    assert.deepEqual(await checkDrawing(), [true, false, 'rgb(20, 100, 45)']);
    await page.getByRole('button', { name: 'Remove first icon' }).click();
    assert.equal(await first.count(), 0);
    assert.equal(await clipId(second), id);
    await second.scrollIntoViewIfNeeded();
    assert.deepEqual(await checkDrawing(), [true, false, 'rgb(20, 100, 45)']);
  },

  'Application adapters swap Button icons and preserve Modal, Drawer and Switch geometry': async ({
    page,
    mount,
  }) => {
    await mount('icon');
    const application = page.getByTestId('application');
    const snapshot = async () => {
      const chrome = {};
      for (const host of ['modal', 'drawer']) {
        await page.getByRole('button', { name: `Open ${host}` }).click();
        const dialog = page.getByRole('dialog', { name: `Example ${host}` });
        const close = dialog.getByRole('button', { name: 'Close dialog' });
        chrome[host] = await close.locator('svg').evaluate((node) => node.outerHTML);
        await close.click();
        await dialog.waitFor({ state: 'hidden' });
      }
      return chrome;
    };
    const assertSwitchIconSizes = async () => {
      for (const [controlSize, dimension] of Object.entries({ s: 14, m: 16, l: 20 })) {
        await size(page.getByTestId(`switch-icon-${controlSize}`), dimension);
      }
    };
    const before = await snapshot();
    await assertSwitchIconSizes();
    const original = await application.locator('svg').evaluate((node) => node.outerHTML);
    await page.getByRole('button', { name: 'Toggle adapter' }).click();
    assert.equal(await application.locator('svg').getAttribute('data-replacement'), 'slot');
    assert.notEqual(await application.locator('svg').evaluate((node) => node.outerHTML), original);
    assert.deepEqual(await snapshot(), before);
    await assertSwitchIconSizes();
  },

  'Migrated control chrome keeps its size, ink and RTL submenu placement': async ({
    page,
    mount,
  }) => {
    await mount('icon', { direction: 'rtl' });
    const chrome = page.getByTestId('chrome');
    const branch = chrome.getByRole('treeitem', { name: 'Architecture, 34 items' });
    await size(branch.locator('.app-shell-nav-caret'), 12);
    await size(branch.locator('.app-shell-nav-icon'), 16);
    await size(chrome.getByRole('button', { name: /Trash/ }).locator('svg'), 16);
    const direction = (label) =>
      chrome
        .getByRole('menuitem', { name: label })
        .locator('svg.menu-branch-proto')
        .evaluate((node) => node.getScreenCTM().a);
    assert.ok((await direction('Default side')) < 0);
    assert.ok((await direction('Flipped side')) > 0);
    assert.equal(
      await chrome.getByRole('button', { name: 'Open another document' }).locator('svg').count(),
      1,
    );
    assert.equal(
      await chrome.getByRole('img', { name: 'Unassigned user' }).locator('svg').count(),
      1,
    );
    assert.equal(await chrome.locator('.file-item-icon-proto > svg').count(), 1);
    const railButtons = chrome
      .getByRole('navigation', { name: 'Workspace sections' })
      .locator('.app-shell-rail-item');
    assert.equal(await railButtons.count(), 7);
    assert.equal(await railButtons.locator('svg').count(), 7);
    assert.equal(
      await chrome
        .getByRole('button', { name: /Members & roles/ })
        .locator('svg')
        .count(),
      1,
    );
    const selectStatus = chrome.locator('svg.select-status-proto');
    await size(selectStatus, 20);
    assert.equal(await selectStatus.getAttribute('data-replacement'), null);
    const status = await selectStatus.evaluate((node) => {
      const own = getComputedStyle(node);
      return [own.fill, own.color, getComputedStyle(node.parentElement).color];
    });
    assert.equal(status[0], status[1]);
    assert.notEqual(status[0], status[2]);
    const warning = chrome.locator('.suggestion-notice-proto[data-warning] > svg');
    assert.equal(await warning.count(), 1);
    assert.equal(await warning.getAttribute('data-replacement'), null);
    const warningColor = await warning.evaluate((node) => [
      getComputedStyle(node).fill,
      getComputedStyle(node.parentElement).color,
    ]);
    assert.notEqual(warningColor[0], warningColor[1]);
  },

  'Icon resolves directional reflection for English RTL, nested LTR, and dir="auto"': async ({
    page,
    mount,
  }) => {
    await mount('icon', { direction: 'rtl' });
    const result = await page.evaluate(() => {
      document.documentElement.lang = 'en';
      const logical = document.querySelector('[data-testid="logical"]');
      const nestedLtr = document.querySelector('[data-testid="nested-ltr"]');
      const rtlToken = getComputedStyle(logical).getPropertyValue('--_dir-scale').trim();
      const rtlScale = getComputedStyle(logical).scale;
      const rtlCtm = logical.getScreenCTM().a;
      const nestedToken = getComputedStyle(nestedLtr).getPropertyValue('--_dir-scale').trim();
      const nestedScale = getComputedStyle(nestedLtr).scale;
      const nestedCtm = nestedLtr.getScreenCTM().a;

      const wrapper = document.createElement('span');
      wrapper.setAttribute('dir', 'auto');
      const text = document.createTextNode('שלום ');
      const clone = logical.cloneNode(true);
      wrapper.append(text, clone);
      document.body.append(wrapper);
      const autoRtlCtm = clone.getScreenCTM().a;
      const autoRtlScale = getComputedStyle(clone).scale;

      text.data = 'Hello ';
      const autoLtrCtm = clone.getScreenCTM().a;
      const autoLtrScale = getComputedStyle(clone).scale;
      wrapper.remove();

      return {
        rtlToken,
        rtlScale,
        rtlCtm,
        nestedToken,
        nestedScale,
        nestedCtm,
        autoRtlCtm,
        autoRtlScale,
        autoLtrCtm,
        autoLtrScale,
      };
    });
    assert.equal(result.rtlToken, '-1 1');
    assert.equal(result.rtlScale, '-1 1');
    assert.ok(result.rtlCtm < 0);
    assert.equal(result.nestedToken, 'none');
    assert.equal(result.nestedScale, 'none');
    assert.ok(result.nestedCtm > 0);
    assert.ok(result.autoRtlCtm < 0);
    assert.equal(result.autoRtlScale, '-1 1');
    assert.ok(result.autoLtrCtm > 0);
    assert.equal(result.autoLtrScale, 'none');
  },
};

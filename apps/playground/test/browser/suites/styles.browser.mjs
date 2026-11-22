import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { Features, transform } from 'lightningcss';
import { createLightningCssOptions } from '../../../../../css.config.mjs';

const presets = [
  ['soft-dark', 'dark', 'rgb(247, 239, 224)', '1', '8px', '9999px'],
  ['soft-light', 'light', 'rgb(41, 36, 33)', '1', '8px', '9999px'],
  ['frost-dark', 'dark', 'rgb(244, 247, 255)', '1', '8px', '9999px'],
  ['frost-light', 'light', 'rgb(12, 16, 28)', '1', '8px', '9999px'],
  ['pixel-dark', 'dark', 'rgb(237, 243, 247)', '0', '0px', '0px'],
  ['pixel-light', 'light', 'rgb(15, 20, 25)', '0', '0px', '0px'],
];

const scenarios = {};

for (const [theme, colorScheme, color, factor, rectangle, capsule] of presets) {
  scenarios[`Resolves computed tokens and geometry for ${theme}`] = async ({ page, mount }) => {
    await mount('styles', { theme });
    const tokens = await page.getByTestId('theme').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        colorScheme: style.colorScheme,
        color: style.color,
        factor: style.getPropertyValue('--radius-factor').trim(),
      };
    });
    assert.deepEqual(tokens, { colorScheme, color, factor });

    for (const [shape, radius] of [
      ['rectangle', rectangle],
      ['capsule', capsule],
      ['circle', '50%'],
    ]) {
      assert.equal(
        await page.getByTestId(shape).evaluate((element) => getComputedStyle(element).borderRadius),
        radius,
        `${shape} radius in ${theme}`,
      );
    }
  };
}

function readScrollbar(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      gutter: element.offsetWidth - element.clientWidth,
      width: style.scrollbarWidth,
      color: style.scrollbarColor,
    };
  });
}

scenarios['Uses regular and compact native scrollbar geometry with forced-colors fallback'] =
  async ({ page, mount }) => {
    await mount('styles');
    const regular = page.getByTestId('regular');
    const compact = page.getByTestId('compact');
    assert.equal((await readScrollbar(regular)).gutter, 14);
    assert.equal((await readScrollbar(compact)).gutter, 10);

    for (const scroller of [regular, compact]) {
      await scroller.evaluate((element) => element.scrollBy(0, 48));
      assert.equal(await scroller.evaluate((element) => element.scrollTop), 48);
    }

    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForFunction(() => matchMedia('(forced-colors: active)').matches);
    const native = await readScrollbar(page.getByTestId('native'));
    assert.ok(native.gutter > 0, 'The unstyled scrollbar must occupy space');
    const expected = { gutter: native.gutter, width: 'auto', color: 'auto' };
    assert.deepEqual(await readScrollbar(regular), expected);
    assert.deepEqual(await readScrollbar(compact), expected);
  };

scenarios['Slider, Drawer and AppShell honor nested explicit direction without native :dir()'] =
  async ({ page }) => {
    const files = [
      'packages/ui/src/styles.css',
      'apps/playground/src/prototypes/slider/slider.css',
      'apps/playground/src/prototypes/dialog/dialog.css',
      'apps/playground/src/prototypes/app-shell/app-shell.css',
    ];
    const css = await Promise.all(
      files.map(async (filename) => {
        const code = await readFile(new URL('../../../../../' + filename, import.meta.url));
        const built = transform({
          filename,
          code,
          minify: true,
          ...createLightningCssOptions(Features),
        });
        return Buffer.from(built.code)
          .toString()
          .replace(/:dir\((?:ltr|rtl)\)/gi, ':not(*)');
      }),
    );
    await page.setContent(`<html lang="en" dir="rtl"><body><main data-theme="pixel-light">
      <div style="position:relative; width:300px; height:30px; --slider-position:.5; --slider-short:16px; --slider-long:20px"><div class="slider-thumb-wrap-proto"></div></div>
      <div class="dialog-layer" data-dialog-side="start"><div class="dialog-placement"><div class="dialog-surface"></div></div></div>
      <dialog class="app-shell-panel app-shell-panel-start" style="--shell-sheet-left:11px;--shell-sheet-right:27px"></dialog>
      </main></body></html>`);
    await page.addStyleTag({ content: css.join('\n') });
    await page.locator('dialog').evaluate((el) => el.showModal());
    for (const [dir, sign, inset] of [
      ['rtl', -1, 27],
      ['ltr', 1, 11],
    ]) {
      const result = await page.evaluate((dir) => {
        const main = document.querySelector('main');
        if (dir === 'ltr') {
          main.dir = dir;
          main.lang = 'ar';
        }
        const thumb = main.querySelector('.slider-thumb-wrap-proto');
        const box = thumb.getBoundingClientRect();
        const track = thumb.parentElement.getBoundingClientRect();
        const shell = getComputedStyle(main.querySelector('dialog'));
        const surface = getComputedStyle(main.querySelector('.dialog-surface'));
        return {
          offset: box.x + box.width / 2 - track.x - track.width / 2,
          inset: parseFloat(shell.insetInlineStart),
          shellShadow: shell.boxShadow,
          drawerShadow: surface.boxShadow,
        };
      }, dir);
      assert.ok(Math.abs(result.offset) < 1);
      assert.equal(result.inset, inset);
      assert.equal(result.shellShadow, result.drawerShadow);
      assert.ok(result.drawerShadow.includes(`${6 * sign}px 0px`), result.drawerShadow);
    }
  };

export default scenarios;

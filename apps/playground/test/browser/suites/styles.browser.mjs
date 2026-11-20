import assert from 'node:assert/strict';

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

export default scenarios;

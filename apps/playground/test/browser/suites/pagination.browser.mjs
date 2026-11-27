import assert from 'node:assert/strict';
import { assertFocused, resetForm } from '../helpers.mjs';

const nav = (page, name = 'Results') => page.getByRole('navigation', { name, exact: true });
const button = (page, name) => page.getByRole('button', { name, exact: true });
const link = (page, name) => page.getByRole('link', { name, exact: true });
const current = (owner) => owner.locator('[aria-current="page"]:visible');
const clickWithoutFocus = (page, name) => button(page, name).evaluate((node) => node.click());

async function selected(owner, label) {
  assert.equal(await current(owner).getAttribute('aria-label'), label);
}

async function setWidth(owner, width) {
  await owner.evaluate((node, width) => {
    node.style.inlineSize = width + 'px';
  }, width);
}

async function edges(owner) {
  return owner.evaluate((node) =>
    Array.from(node.querySelectorAll('[aria-label$=" page"]:not([aria-current])'))
      .filter((el) => /^[PN]/u.test(el.getAttribute('aria-label')))
      .map((el) => {
        const { x, y, width, height } = el.getBoundingClientRect();
        return [x, y, width, height];
      }),
  );
}

export default {
  'Pagination keeps confirmed state and restores only lost local focus': async ({
    page,
    mount,
  }) => {
    await mount('pagination');
    const pager = nav(page);
    const next = button(pager, 'Next page');
    const nextNode = await next.elementHandle();
    await next.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await selected(pager, 'Page 12');
    assert.equal(await page.getByTestId('requests').textContent(), '[13,13]');
    await clickWithoutFocus(page, 'Commit page 13');
    await selected(pager, 'Page 13');
    await assertFocused(next);
    assert.equal(await nextNode.evaluate((node) => node === document.activeElement), true);

    const number = button(pager, 'Page 13');
    const numberNode = await number.elementHandle();
    await number.focus();
    await clickWithoutFocus(page, 'Commit page 13');
    assert.equal(await numberNode.evaluate((node) => node === document.activeElement), true);
    await clickWithoutFocus(page, 'Commit page 22');
    await assertFocused(button(pager, 'Page 22'));

    await next.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await assertFocused(button(page, 'After results'));
    await clickWithoutFocus(page, 'Commit page 24');
    await assertFocused(button(page, 'After results'));
    await selected(pager, 'Page 24');

    await button(pager, 'Page 24').focus();
    await button(pager, 'Page 24').evaluate((node) => node.blur());
    await clickWithoutFocus(page, 'Commit page 1');
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
    await button(page, 'Filter').focus();
    await clickWithoutFocus(page, 'Commit page 24');
    await assertFocused(button(page, 'Filter'));

    await button(pager, 'Page 24').focus();
    await clickWithoutFocus(page, 'Toggle range');
    assert.equal(await pager.count(), 0);
    await clickWithoutFocus(page, 'Toggle range');
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
  },

  'Pagination redirects focus across both bounds and numbered-to-compact projection': async ({
    page,
    mount,
  }) => {
    await mount('pagination');
    const pager = nav(page);
    const prev = button(pager, 'Previous page');
    const next = button(pager, 'Next page');
    const width = page.getByTestId('pager-width');

    await prev.focus();
    await clickWithoutFocus(page, 'Commit page 1');
    await assertFocused(button(pager, 'Page 1'));
    await next.focus();
    await clickWithoutFocus(page, 'Commit page 24');
    await assertFocused(button(pager, 'Page 24'));

    await setWidth(width, 260);
    await assertFocused(prev);
    assert.equal(await current(pager).count(), 0);
    assert.equal(await pager.getByText('Page 24 of 24', { exact: true }).count(), 1);
    await setWidth(width, 600);
    await assertFocused(prev);
    await clickWithoutFocus(page, 'Commit page 13');
    await button(pager, 'Page 13').focus();
    await setWidth(width, 260);
    await assertFocused(next);

    await prev.focus();
    await clickWithoutFocus(page, 'Commit page 1');
    await assertFocused(next);
    await next.focus();
    await clickWithoutFocus(page, 'Commit page 24');
    await assertFocused(prev);

    await button(page, 'Open modal').click();
    const overlay = nav(page, 'Modal pages');
    await button(overlay, 'Next page').focus();
    await page.keyboard.press('Space');
    await assertFocused(button(overlay, 'Previous page'));
    await button(page, 'Close modal').click();
    await assertFocused(button(page, 'Open modal'));
  },

  'Pagination keeps native hrefs and follows replacements in a route adapter': async ({
    page,
    mount,
  }) => {
    await mount('pagination');
    const pager = nav(page);
    await button(pager, 'Next page').focus();
    await clickWithoutFocus(page, 'Use route');
    await assertFocused(link(pager, 'Next page'));
    assert.equal(await link(pager, 'Page 12').getAttribute('href'), '?page=12');
    const next = link(pager, 'Next page');
    const before = await next.elementHandle();
    await page.keyboard.press('Space');
    await selected(pager, 'Page 12');
    await next.dispatchEvent('click', { ctrlKey: true, button: 0 });
    await selected(pager, 'Page 12');
    await page.keyboard.press('Enter');
    await selected(pager, 'Page 13');
    assert.equal(await before.evaluate((node) => node.isConnected), false);
    await assertFocused(next);
    await clickWithoutFocus(page, 'Use local buttons');
    await assertFocused(button(pager, 'Next page'));
    await selected(pager, 'Page 13');
    assert.equal(await page.getByTestId('requests').textContent(), '[]');
  },

  'Pagination preserves an explicit document focus during router ref attachment': async ({
    page,
    mount,
  }) => {
    await mount('pagination');
    const pager = nav(page);
    await clickWithoutFocus(page, 'Use route');
    await link(pager, 'Next page').focus();
    await clickWithoutFocus(page, 'Focus document on route attach');
    await clickWithoutFocus(page, 'Commit page 13');
    await selected(pager, 'Page 13');
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
    assert.equal(await page.locator('body').getAttribute('tabindex'), '-1');
  },

  'Pagination yields to a route destination and supports cancellation and native forms': async ({
    page,
    mount,
  }) => {
    await mount('pagination');
    const pager = nav(page);
    await clickWithoutFocus(page, 'Use route');
    await clickWithoutFocus(page, 'Focus destination on route');
    await link(pager, 'Next page').press('Enter');
    await assertFocused(page.getByRole('heading', { name: 'Destination' }));
    await selected(pager, 'Page 13');
    await clickWithoutFocus(page, 'Cancel link clicks');
    await link(pager, 'Next page').press('Enter');
    await selected(pager, 'Page 13');
    await assertFocused(link(pager, 'Next page'));
    await clickWithoutFocus(page, 'Commit page 1');
    const previous = link(pager, 'Previous page');
    assert.equal(await previous.getAttribute('href'), null);
    assert.equal(await previous.getAttribute('aria-disabled'), 'true');

    const form = page.locator('#pagination-form');
    const formPager = nav(form, 'Form pages');
    await button(formPager, 'Next page').press('Space');
    await assertFocused(button(formPager, 'Page 3'));
    await form.getByRole('textbox').fill('draft');
    await resetForm(form);
    await selected(formPager, 'Page 3');
    await button(formPager, 'Previous page').press('Enter');
    await button(formPager, 'Previous page').click();
    await selected(formPager, 'Page 1');
    assert.equal(await page.getByTestId('submits').textContent(), '0');
    assert.deepEqual(await form.evaluate((node) => [...new FormData(node)]), [
      ['query', 'release'],
    ]);
    await clickWithoutFocus(page, 'Toggle fieldset');
    assert.equal(await button(formPager, 'Next page').isEnabled(), false);
    await button(formPager, 'Next page').evaluate((node) => node.click());
    assert.equal(await page.getByTestId('requests').textContent(), '[3,2,1]');
  },

  'Pagination SSR exposes only the chosen representation and hydrates the same anchors': async ({
    page,
    mount,
    renderFixture,
    watchPage,
  }) => {
    const html = await renderFixture('pagination-ssr');
    await mount('pagination-hydration');
    const localized = await page.context().browser().newContext({ locale: 'my-MM' });
    try {
      const other = watchPage(await localized.newPage());
      await other.goto(page.url());
      const host = other.getByTestId('pager-ssr');
      await host.evaluate((node, html) => {
        node.innerHTML = html;
        window.paginationBefore = Array.from(node.querySelectorAll('a'));
      }, html);
      assert.equal(await host.getByRole('navigation').count(), 6);

      const expectations = [
        ['Default digits', '123'],
        ['Burmese digits', '၁၂၃'],
        ['Invalid digits', '123'],
        ['Astral digits', '𝟙𝟚𝟛'],
        ['Tolong Siki digits', String.fromCodePoint(0x11de1, 0x11de2, 0x11de3)],
      ];
      for (const [name, digits] of expectations) {
        const owner = nav(host, name);
        const target = link(owner, `Page ${digits}`);
        assert.equal(await target.textContent(), digits);
        assert.equal(await target.getAttribute('href'), '?page=123');
        await selected(owner, `Page ${digits}`);
      }
      const compact = nav(host, 'Collection page controls');
      assert.equal(await compact.getByRole('link').count(), 2);
      assert.equal(await current(compact).count(), 0);
      assert.equal(await compact.getByText('من أصل ٢٤٠، الصفحة ١٢٣', { exact: true }).count(), 1);
      assert.equal(await compact.locator('strong:visible').last().textContent(), '١٢٣');
      assert.equal(await host.locator('[aria-live], [role=status]').count(), 0);
      await button(other, 'Hydrate pagination').click();
      await host.locator('[data-hydrated]').waitFor({ state: 'attached' });
      assert.equal(
        await host.evaluate((node) => {
          const after = Array.from(node.querySelectorAll('a'));
          return (
            after.length === window.paginationBefore.length &&
            after.every((anchor, index) => anchor === window.paginationBefore[index])
          );
        }),
        true,
      );
      for (const [name, digits] of expectations) {
        await selected(nav(host, name), `Page ${digits}`);
      }
    } finally {
      await localized.close();
    }
  },

  'Pagination fits the container and reserves every fullwidth digit at the exact threshold':
    async ({ page, mount }) => {
      await mount('pagination-geometry', { theme: 'soft-light' });
      assert.equal(await current(nav(page, 'Narrow auto')).count(), 0);
      assert.equal(await current(nav(page, 'Wide auto')).count(), 1);
      assert.equal(await current(nav(page, 'Short auto')).count(), 0);
      assert.equal(await current(nav(page, 'Short explicit')).count(), 1);
      const fullwidth = page.getByTestId('fullwidth');
      const pager = nav(page, 'Fullwidth digits');
      await page.evaluate(() => document.fonts.load('14px "Pagination fullwidth fixture"', '８'));
      for (const dir of ['ltr', 'rtl']) {
        await fullwidth.evaluate((node, dir) => {
          node.dir = dir;
        }, dir);
        for (const width of [550, 687, 688, 700]) {
          await setWidth(fullwidth, width);
          const numbered = width >= 688;
          assert.equal(await current(pager).count(), Number(numbered), `${dir} ${width}px`);
          const geometry = await pager.evaluate((nav) => ({
            overflows: nav.scrollWidth > nav.clientWidth,
            overlaps: [...nav.querySelectorAll('button bdi')]
              .filter((text) => text.getClientRects().length > 0)
              .some((text) => {
                const range = document.createRange();
                range.selectNodeContents(text);
                const ink = range.getBoundingClientRect();
                const cell = text.closest('button').getBoundingClientRect();
                return ink.left < cell.left + 4 || ink.right > cell.right - 4;
              }),
          }));
          assert.deepEqual(geometry, { overflows: false, overlaps: false }, `${dir} ${width}px`);
        }
      }
      const examples = [nav(page, 'Large compact'), nav(page, 'Large numbered')];
      const before = await Promise.all(examples.map(edges));
      for (const change of ['Set 1000', 'Set first', 'Set last']) {
        await clickWithoutFocus(page, change);
        assert.deepEqual(await Promise.all(examples.map(edges)), before);
      }
    },

  'Pagination preserves touch targets, localized wrapping, and system focus in RTL': async ({
    page,
    mount,
  }) => {
    const touch = await page.context().browser().newContext({ hasTouch: true });
    try {
      await mount('pagination-geometry', { direction: 'rtl', textScale: 120, surface: 'overlay' });
      const other = await touch.newPage();
      await other.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
      await other.goto(page.url());
      const rtl = nav(other, 'Localized wrapping');
      await rtl.waitFor();
      assert.equal(await other.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
      const english = nav(other, 'Narrow auto').getByText('Page 12 of 24', { exact: true });
      const arabic = rtl.getByText('من أصل ١٢٨٤٠ صفحة، أنت الآن في الصفحة ٩٩٩', { exact: true });
      assert.equal(await english.evaluate((node) => getComputedStyle(node).direction), 'ltr');
      assert.equal(await arabic.evaluate((node) => getComputedStyle(node).direction), 'rtl');
      const next = rtl.getByRole('button', { name: 'التالي' });
      const prev = rtl.getByRole('button', { name: 'السابق' });
      const [start, end] = await Promise.all([prev.boundingBox(), next.boundingBox()]);
      assert.ok(start.width >= 44 && start.height >= 44);
      assert.ok(end.width >= 44 && end.height >= 44);
      assert.ok(end.x + end.width <= start.x);
      assert.equal(await next.locator('svg').evaluate((el) => getComputedStyle(el).scale), '-1 1');
      const nested = nav(other, 'Nested LTR');
      assert.equal(
        await button(nested, 'Next page')
          .locator('svg')
          .evaluate((el) => getComputedStyle(el).scale),
        'none',
      );
      await button(nested, 'Page 1').focus();
      const system = await current(nested).evaluate((node) => {
        const style = getComputedStyle(node);
        return [
          style.outlineWidth,
          style.outlineOffset,
          style.transitionDuration,
          style.outlineColor === style.backgroundColor,
          style.color !== style.backgroundColor,
        ];
      });
      assert.deepEqual(system, ['2px', '2px', '0s', true, true]);
    } finally {
      await touch.close();
    }
  },
};

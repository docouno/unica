import assert from 'node:assert/strict';

async function navigate(page, params) {
  await page.evaluate((nextParams) => {
    document.documentElement.removeAttribute('data-wb-ready');
    const url = new URL(window.location.href);
    url.search = '';
    for (const [key, value] of Object.entries(nextParams)) {
      url.searchParams.set(key, value);
    }
    history.pushState(null, '', url);
    dispatchEvent(new PopStateEvent('popstate'));
  }, params);
}

export default {
  'Workbench v3 StoryFrame controls, actions, and reset synchronize across all 6 themes without header jump':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mount('workbench-v3');
      await navigate(page, { item: 'progress', tab: 'states', block: 'motion' });

      const headerRow = page.locator('.wb-story-header-row').first();
      await headerRow.waitFor();
      const beforeHeight = (await headerRow.boundingBox()).height;

      const activeToggle = page.getByRole('checkbox', { name: 'Active' });
      await activeToggle.click();
      const afterHeight = (await headerRow.boundingBox()).height;
      assert.equal(afterHeight, beforeHeight, 'Toggling Active must not change header height');
      assert.equal(await page.getByText('Transfer paused').count(), 6);

      await activeToggle.click();
      await page.getByRole('button', { name: 'Reach 100%' }).click();
      assert.equal(await page.getByText('All bytes transferred').count(), 6);

      await page.getByRole('button', { name: 'Replay' }).click();
      assert.equal(await page.getByText('Transferring archive').count(), 6);

      // Mutate both frame control and action state right before Reset so Reset proves both restore.
      await activeToggle.click();
      await page.getByRole('button', { name: 'Reach 100%' }).click();
      assert.equal(await activeToggle.isChecked(), false);
      assert.equal(await page.getByText('All bytes transferred').count(), 6);

      await page.getByRole('button', { name: 'Reset' }).click();
      assert.equal(await activeToggle.isChecked(), true);
      assert.equal(await page.getByText('Transferring archive').count(), 6);

      // Button toggles and overflow keep zero ad-hoc harness controls inside artboards.
      await navigate(page, { item: 'button', tab: 'states', block: 'toggles' });
      await page.locator('.wb-story-frame[data-wb-block="toggles"]').waitFor();
      assert.equal(await page.locator('.wb-artboard select').count(), 0);
      await page.getByLabel('Tone').selectOption('danger');
      assert.equal(await page.locator('.wb-artboard').getByText('primary / danger / s').count(), 6);
    },

  'Workbench v3 solo expand/collapse, Escape after checkbox focus, light canvas, and Usage readiness work in Chromium':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mount('workbench-v3');
      await navigate(page, { item: 'button', tab: 'states', scheme: 'light' });

      const canvas = page.locator('.wb-canvas[data-canvas-scheme="light"]');
      await canvas.waitFor();
      const lightBg = await canvas.evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(lightBg, 'rgb(231, 231, 228)');

      // Expand a single artboard inside a case, toggle a StoryFrame checkbox, then Escape collapses solo cleanly.
      const lightFrame = page.locator('.wb-story-frame[data-wb-block="light"]');
      await lightFrame.getByRole('button', { name: 'Expand Frost · Light' }).click();
      await page.waitForFunction(() => window.location.search.includes('solo=frost-light'));
      assert.equal(await page.locator('.wb-artboard').count(), 1);
      assert.equal(
        await page
          .getByRole('group', { name: 'Scheme' })
          .getByRole('link', { name: 'Light' })
          .getAttribute('aria-current'),
        null,
      );

      const pendingCheckbox = page.getByRole('checkbox', { name: 'Pending' });
      await pendingCheckbox.click();
      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () =>
          !window.location.search.includes('solo=') &&
          window.location.search.includes('scheme=light'),
      );
      assert.ok((await page.locator('.wb-story-frame').count()) > 1);

      // Compositions code footer matches the light canvas scheme, and Button form uses real Unica Input.
      await navigate(page, { item: 'button', tab: 'compositions', scheme: 'light' });
      const footer = page.locator('.wb-story-footer').first();
      await footer.waitFor();
      const footerBg = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(footerBg, 'rgb(245, 245, 242)');
      assert.ok(
        (await page.locator('[data-wb-block="form"] .unica-input').count()) >= 3,
        'Button form composition must use real @docouno/unica Input',
      );

      // Compositions code footer returns to the dark surface when dark themes are visible.
      await navigate(page, { item: 'button', tab: 'compositions', scheme: 'both' });
      await page.locator('.wb-canvas[data-canvas-scheme="dark"]').waitFor();
      const darkFooterBg = await page
        .locator('.wb-story-footer')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(darkFooterBg, 'rgb(23, 23, 23)');

      // Button Playground renders only the button subject (no stray Workbench Submit/Reset wrapper buttons).
      await navigate(page, { item: 'button', tab: 'playground', scheme: 'light' });
      await page.locator('[data-wb-tab="playground"]').waitFor();
      await page.locator('.wb-artboard .unica-button').first().waitFor();
      assert.equal(await page.locator('.wb-inspector-form-actions').count(), 0);

      // Usage stays dark under scheme=light, resolves async Markdown to data-wb-ready="1", and omits sentinel "auto".
      await navigate(page, { item: 'button', tab: 'usage', scheme: 'light' });
      await page.locator('[data-wb-tab="usage"]').waitFor();
      await page.locator('#wb-usage-reference').waitFor();
      await page.waitForSelector('html[data-wb-ready="1"]');
      assert.equal(await page.locator('.wb-canvas').getAttribute('data-canvas-scheme'), 'dark');
      const propsTable = page.getByRole('table', { name: 'Public props' });
      const variantRow =
        (await propsTable.getByRole('row', { name: /^variant\b/ }).textContent()) ?? '';
      assert.match(variantRow, /"primary" \| "secondary" \| "ghost"/);
      assert.match(variantRow, /undefined/);
      assert.doesNotMatch(variantRow, /"auto"/);
      const widthRow =
        (await propsTable.getByRole('row', { name: /^width\b/ }).textContent()) ?? '';
      assert.match(widthRow, /"auto" \| "full"/);
    },
};

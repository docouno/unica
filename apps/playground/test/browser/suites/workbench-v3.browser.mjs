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
  'An AppShell save failure clears the shared control and preserves each workspace draft': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount('workbench-v3');
    await navigate(page, { item: 'app-shell', tab: 'states', block: 'save' });

    const frame = page.locator('[data-wb-block="save"]');
    const toolbar = frame.getByRole('group', { name: 'Save, discard and retry controls' });
    const fail = toolbar.getByRole('checkbox', { name: 'Simulate a save failure' });
    const artboards = frame.locator('.wb-artboard');
    const first = artboards.first();
    const fields = artboards.getByRole('textbox', { name: 'Workspace name' });
    await fields.first().waitFor();
    assert.equal(await fields.count(), 6);
    const initial = await fields.first().inputValue();
    const edited = 'Editorial workspace';
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await fields.first().fill(edited);
    await fail.check();
    await first.getByRole('button', { name: 'Save changes' }).click();
    assert.equal(await fail.isChecked(), false);
    const second = artboards.nth(1);
    await second.getByRole('button', { name: 'Save changes' }).click();
    await page.clock.runFor(700);
    await second.getByText('All changes saved', { exact: true }).waitFor();
    const retry = first.getByRole('button', { name: 'Retry save' });
    await retry.waitFor();
    assert.equal(await fail.isChecked(), false);
    assert.equal(await fields.first().inputValue(), edited);
    assert.equal(await artboards.getByText('Unsaved changes', { exact: true }).count(), 4);

    await retry.click();
    await page.clock.runFor(700);
    await first.getByText('All changes saved', { exact: true }).waitFor();
    assert.deepEqual(await fields.evaluateAll((inputs) => inputs.map((input) => input.value)), [
      edited,
      ...Array(5).fill(initial),
    ]);
    await toolbar.getByRole('button', { name: 'Reset' }).click();
    assert.equal(await fields.first().inputValue(), initial);
    assert.equal(await artboards.getByText('Unsaved changes', { exact: true }).count(), 6);

    await navigate(page, {
      item: 'app-shell',
      tab: 'states',
      block: 'save',
      family: 'soft',
      scheme: 'light',
      vp: '1280',
    });
    const canvas = frame.locator('.wb-artboard .app-shell-main');
    await canvas.waitFor();
    const scrolled = await canvas.evaluate((element) => {
      const bar = element.querySelector('.app-shell-sticky-bar');
      const before = bar.getBoundingClientRect().bottom;
      element.scrollTop = element.scrollHeight;
      return { distance: element.scrollTop, shift: bar.getBoundingClientRect().bottom - before };
    });
    assert.ok(scrolled.distance > 0, 'The desktop canvas needs content to scroll');
    assert.ok(Math.abs(scrolled.shift) <= 1, 'Save actions should stay visible while scrolling');
  },

  'Narrow overlay studies keep readable text on the floating surface': async ({ page, mount }) => {
    await page.setViewportSize({ width: 412, height: 950 });
    await mount('workbench-v3');

    for (const [item, tab, block, selector] of [
      ['app-shell', 'states', 'layout', '.shell-study-layout h3'],
      ['blockquote', 'states', 'overflow', 'blockquote p'],
      ['container', 'compositions', 'document', 'h3'],
    ]) {
      await navigate(page, {
        item,
        block,
        tab,
        family: 'pixel',
        scheme: 'light',
        surface: 'overlay',
        vp: '360',
        scale: '120',
        dir: 'rtl',
        raw: '1',
      });
      const frame = page.locator(`[data-wb-block="${block}"] .wb-artboard`);
      const reading = frame.locator(selector).first();
      await reading.waitFor({ state: 'attached' });
      const { stageWidth, textWidth, contained, painted } = await reading.evaluate((element) => {
        const stage = element.closest('[data-stage-content]').getBoundingClientRect();
        const text = element.getBoundingClientRect();
        const panel = element.closest('.unica-overlay-surface');
        return {
          painted: panel && getComputedStyle(panel).backgroundColor !== 'rgba(0, 0, 0, 0)',
          stageWidth: stage.width,
          textWidth: text.width,
          contained: text.left >= stage.left - 1 && text.right <= stage.right + 1,
        };
      });
      assert.ok(painted, `${item} text has no floating surface over the underlay`);
      assert.ok(textWidth >= stageWidth / 2, `${item} text collapsed to ${textWidth}px`);
      assert.ok(contained, `${item} text extends past its overlay stage`);
    }
  },

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
